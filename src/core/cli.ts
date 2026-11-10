import * as readline from 'node:readline';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

import { prepareBatch, transmitBatch, receiveBatch , type QuantumBatch} from './quantumEngine.ts';
import { siftBatch, evaluateBatch, binaryEntropy } from './postProcessor.ts';
import { type Bit, type Basis, type TransmitRecord } from './types.ts';

const randomBit = (): Bit => (Math.random() < 0.5 ? 0 : 1);
const randomBasis = (): Basis => (Math.random() < 0.5 ? 'rectilinear' : 'diagonal');

function printLedger(records: TransmitRecord[]) {
    const display = records.map(r => ({
        Seq: r.seqID,
        'Sent Bit': r.emittedBit,
        'Sent in Basis': r.emittedBasis === 'rectilinear' ? '+' : 'x',
        'Sent Qubit Ref': r.emittedQubitRef,
        'Sent Quantum State': r.emittedState.ket,
        'Intercept': r.interceptOptions.isIntercept ? 'YES' : 'NO',
        'Received in Basis': r.receivedBasis ? (r.receivedBasis === 'rectilinear' ? '+' : 'x') : '-',
        'Reveived Bit': r.receivedBit ?? '-',
        'Received Qubit Ref': r.receivedQubitRef,
        'Received State': r.receivedState?.ket,
        'Sifted': r.isSifted !== undefined ? (r.isSifted ? '✓' : '✗') : '-',
    }));
    console.table(display);
}

const NUM_BITS = 500;
const INTERCEPT_PROBABILITY = 0.2;

let stage = 0;
let sentBits: Bit[] = [];
let sentBases: Basis[] = [];
let receivedBases:  Basis[] = [];

let batchPrepared: QuantumBatch;
let batchTransmitted: any;
let recordsReceived: TransmitRecord[];
let recordsSifted: TransmitRecord[];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\nSimulator [type "step" to advance]> '
});

console.log('=== BB84 QKD Simulator ===');
console.log(`Config: ${NUM_BITS} bits, Eve Intercept Probability: ${INTERCEPT_PROBABILITY * 100}%`);
console.log('Type "step" to begin.');
rl.prompt();

rl.on('line', async (line) => {
    if (line.trim().toLowerCase() !== 'step') {
        console.log('Type "step" to advance to the next phase.');
        rl.prompt();
        return;
    }

    switch (stage) {
        case 0:
            console.log('\n--- STAGE 1: SENDER PREPARES BATCH ---');
            sentBits = Array.from({ length: NUM_BITS }, randomBit);
            sentBases = Array.from({ length: NUM_BITS }, randomBasis);

            batchPrepared = prepareBatch(sentBits, sentBases);
            printLedger(batchPrepared.ledger);
            stage++;
            break;

        case 1:
           console.log('\n--- STAGE 2: TRANSMISSION (MAY INTERCEPT) ---');     
           batchTransmitted = transmitBatch(batchPrepared, INTERCEPT_PROBABILITY);
           printLedger(batchTransmitted.ledger);
           stage++;
           break;

        case 2:
            console.log('\n--- STAGE 3: RECEIVE AND MEASURE ---');
            receivedBases = Array.from({ length: NUM_BITS }, randomBasis);
            recordsReceived = receiveBatch(batchTransmitted, receivedBases);
            printLedger(recordsReceived);
            stage++;
            break;
           
        case 3:
            console.log('\n--- STAGE 4: BASIS SIFTING ---');
            recordsSifted = siftBatch(recordsReceived);
            printLedger(recordsSifted);
            stage++;
            break;

        case 4:
            console.log('\n--- STAGE 5: POST-PROCESSING (EVALUATE, RECONCILE, CONFIRM) ---');
            const result = await evaluateBatch(recordsSifted, 0.3, 0.11);

            console.log('\n[ Final Metrics ]');
            console.log(`Total Transmitted: ${result.metrics.totalTransmitted}`);
            console.log(`Sifted Count:      ${result.metrics.siftedCount}`);
            console.log(`Sacrificed:        ${result.metrics.sampleSize}`);
            console.log(`Errors Found:      ${result.metrics.errorCount}`);
            console.log(`QBER:              ${(result.metrics.qber * 100).toFixed(2)}%`);
            console.log(`Channel Secure?    ${result.metrics.isSecure ? 'YES' : 'NO (Aborted)'}`);

            if (result.metrics.isSecure) {
                console.log('\n--- RECONCILIATION & CONFIRMATION ---');
                
                result.metrics.passes.forEach(pass => {
                    if (pass.passNumber === 1) {
                        console.log(`\n[ Pass 1 (Block Size: ${pass.blockSize}) ]`);
                    } else {
                        console.log(`\n[ Adaptive Recovery: Triggering Cascade Pass ${pass.passNumber} ]`);
                        console.log(`- Action: Synchronized bit shuffle applied to untangle collision pairs.`);
                        console.log(`- Block Size doubled to: ${pass.blockSize}`);
                    }
                    
                    console.log(`- Corrected ${pass.errorsCorrected} isolated errors.`);
                    console.log(`- Parity bits leaked: ${pass.parityBitsExchanged} bits.`);
                    
                    if (!pass.isMatch) {
                        console.log(`- Intermediate Status: ⚠️ Even-error collision detected! ${pass.errorsRemaining} errors survived.`);
                    }

                    console.log(`\n[ Key Confirmation Check #${pass.passNumber} ]`);
                    console.log(`- Sender Hash:   ${pass.senderHash.slice(0, 16)}...`);
                    console.log(`- Received Hash: ${pass.receiverHash.slice(0, 16)}...`);
                    console.log(`- Match: ${pass.isMatch ? '✓ SUCCESS (Key established)' : '✗ FAILED (Safety net caught residual errors!)'}`);
                });

                console.log(`\n[ Final Summary ]`);

                console.log('\n[ Privacy Amplification Budget ]');
                console.log(`Reconciled Raw Bits:     ${result.metrics.senderRawKey.length}`);
                console.log(`- Quantum Eavesdrop: ~${(result.metrics.senderRawKey.length * binaryEntropy(result.metrics.qber)).toFixed(1)} bits (from QBER ${ (result.metrics.qber * 100).toFixed(2) }%)`);
                console.log(`- Classical Parity Leak: ${result.metrics.parityBitsLeaked} bits (from Cascade)`);
                console.log(`-------------------------------------------`);
                console.log(`Final Pure Secret Key:   ${result.metrics.secureKeyLength} bits`);

                
            }

            console.log('\nSimulation complete. Press Ctrl+C to exit.');
            stage++;
            break;

        default:
            console.log('Simulation is finished. Press Ctrl+C to exit.');
            break;    
    }
    if (stage <= 4) rl.prompt();
});

