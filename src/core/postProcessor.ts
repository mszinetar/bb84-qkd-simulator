import { type TransmitRecord, type Bit } from './types.ts'

export type PassTelemetry = {
    readonly passNumber: number;
    readonly blockSize: number;
    readonly errorsCorrected: number;
    readonly parityBitsExchanged: number;
    readonly errorsRemaining: number; 
    readonly senderHash: string;
    readonly receiverHash: string;
    readonly isMatch: boolean;
};

export type QBERMetrics = {
    readonly totalTransmitted: number;
    readonly siftedCount: number;
    readonly sampleSize: number;
    readonly errorCount: number;
    readonly qber: number;            
    readonly isSecure: boolean;    
    readonly senderRawKey: Bit[];
    readonly receiverRawKey: Bit[];
    readonly reconciledKey: Bit[];   
    readonly parityBitsLeaked: number;
    readonly isKeyConfirmed: boolean;
    readonly passes: PassTelemetry[];
    readonly secureKeyLength: number;
};

export type PostProcessResult = {
  readonly records: TransmitRecord[];
  readonly metrics: QBERMetrics;
};

export type ReconciliationResult = {
    reconciledKey: Bit[];
    parityBitsExchanged: number;
    correctedIndices: number[];
};

async function computeSHA256(bits: Bit[]): Promise<string> {
    const bitString = bits.join('');
    const encoder = new TextEncoder();
    const data = encoder.encode(bitString);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getPermutation(length: number, seed: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    let s = seed;
    for (let i = length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
}

export function binaryEntropy(p: number): number {
    if (p <= 0 || p >= 1) return 0;
    return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

export function calculateSecureKeyLength(
    rawKeyLength: number,
    qber: number,
    parityBitsLeaked: number,
): number {
    const interceptQuantumEntropy = rawKeyLength * binaryEntropy(qber);
    const extractableBits = rawKeyLength - interceptQuantumEntropy - parityBitsLeaked;
    
    return Math.max(0, Math.floor(extractableBits));
}

export function runReconciliationPass(
    senderBits: Bit[],
    receiverBits: Bit[],
    blockSize: number,
    permutation: number[]
): ReconciliationResult {
    const correctedKey = [...receiverBits];
    const correctedIndices: number[] = [];
    let parityBitsExchanged = 0;

    const permSender = permutation.map(i => senderBits[i]);
    const permReceiver = permutation.map(i => correctedKey[i]);

    const getParity = (bits: Bit[], start: number, end: number): number => {
        let parity = 0;
        for (let i = start; i < end; i++) {
            parity ^= bits[i];
        }
        return parity;
    };

    const bisectAndFix = (start: number, end: number) => {
        if (end - start === 1) {
           const origIdx = permutation[start];
            correctedKey[origIdx] = (correctedKey[origIdx] ^ 1) as Bit;
            permReceiver[start] = correctedKey[origIdx]; 
            correctedIndices.push(origIdx);
            return;
        }

        const mid = Math.floor((start + end) / 2);
        const senderLeftParity = getParity(permSender, start, mid);
        const receiverLeftParity = getParity(permReceiver, start, mid);
        parityBitsExchanged++;

        if (senderLeftParity !== receiverLeftParity) {
            bisectAndFix(start, mid);
        } else {
            bisectAndFix(mid, end);
        }
    };

    for (let i = 0; i < permSender.length; i += blockSize) {
        const end = Math.min(i + blockSize, permSender.length);
        const senderParity = getParity(permSender, i, end);
        const receiverParity = getParity(permReceiver, i, end);

        parityBitsExchanged++;

        if (senderParity !== receiverParity) {
            bisectAndFix(i, end);
        }
    }

    return {
        reconciledKey: correctedKey,
        parityBitsExchanged,
        correctedIndices,
    };
}

export function siftBatch(records: TransmitRecord[]): TransmitRecord[] {
  return records.map(record => {
    const isSifted = record.emittedBasis === record.receivedBasis;
    return {
      ...record,
      isSifted,
    };
  });
}

export async function evaluateBatch(
  records: TransmitRecord[],
  sacrificeRatio: number = 0.3,
  abortThreshold: number = 0.11
): Promise<PostProcessResult> {
    const siftedIndices: number[] = [];
    records.forEach((record, idx) => {
        if (record.isSifted) {
             siftedIndices.push(idx);
        }
    });

    const targetSampleSize = Math.max(1, Math.floor(siftedIndices.length * sacrificeRatio));
    const sacrificedSet = new Set<number>();

    const shuffledSifted = [...siftedIndices].sort(() => Math.random() - 0.5);
    shuffledSifted.slice(0, targetSampleSize).forEach(idx => sacrificedSet.add(idx));

    let errorCount = 0;

   
    const processedRecords = records.map((record, idx) => {
        if (!record.isSifted) {
            return {
                ...record,
                isSifted: false,
                isSacrificed: false,
                hasError: false,
                isFinalKeyBit: false,
            };
        }

        const isSacrificed = sacrificedSet.has(idx);
        const hasError = record.emittedBit !== record.receivedBit;

        if (isSacrificed && hasError) {
            errorCount++;
        }

        return {
            ...record,
            isSacrificed,
            hasError,
            isFinalKeyBit: !isSacrificed,
        };
    });

    const qber = targetSampleSize > 0 ? errorCount / targetSampleSize : 0;
    const isSecure = qber <= abortThreshold;

    const finalRecords = processedRecords.filter((record) => record.isFinalKeyBit);

    const senderRawKey: Bit[] = isSecure 
        ? finalRecords.map((record) => record.emittedBit as Bit)
        : []
    ;

    const receiverRawKey: Bit[] = isSecure
        ? finalRecords.map((record) => record.receivedBit as Bit)
        : []
    ;

    let currentReconciledKey: Bit[] = [...receiverRawKey];
    let totalParityBitsLeaked = 0;
    let isKeyConfirmed = false;
    const passes: PassTelemetry[] = [];


    if (isSecure && senderRawKey.length > 0) {
        let currentBlockSize = 8;

        for (let pass = 1; pass <= 4; pass++) {
            const perm = pass === 1 
                ? Array.from({ length: senderRawKey.length }, (_, i) => i) 
                : getPermutation(senderRawKey.length, pass * 42);

            const result = runReconciliationPass(senderRawKey, currentReconciledKey, currentBlockSize, perm);
            
            currentReconciledKey = result.reconciledKey;
            totalParityBitsLeaked += result.parityBitsExchanged;

            const errorsRemaining = senderRawKey.filter((bit, idx) => bit !== currentReconciledKey[idx]).length;
            const senderHash = await computeSHA256(senderRawKey);
            const receiverHash = await computeSHA256(currentReconciledKey);
            const isMatch = (senderHash === receiverHash);

            passes.push({
                passNumber: pass,
                blockSize: currentBlockSize,
                errorsCorrected: result.correctedIndices.length,
                parityBitsExchanged: result.parityBitsExchanged,
                errorsRemaining,
                senderHash,
                receiverHash,
                isMatch
            });

            if (isMatch) {
                isKeyConfirmed = true;
                break;
            }

            currentBlockSize *= 2;

        }
    }

    const secureKeyLength = (isSecure && isKeyConfirmed)
        ? calculateSecureKeyLength(senderRawKey.length, qber, totalParityBitsLeaked)
        : 0;

    return {
        records: processedRecords,
        metrics: {
            totalTransmitted: records.length,
            siftedCount: siftedIndices.length,
            sampleSize: targetSampleSize,
            errorCount,
            qber,
            isSecure,
            senderRawKey,
            receiverRawKey,
            reconciledKey: currentReconciledKey,
            parityBitsLeaked: totalParityBitsLeaked,
            isKeyConfirmed,
            passes,
            secureKeyLength,
        },
    };
}
