import { type QuantumBatch } from "../../core/quantumEngine";
import { type Bit, type Basis, type TransmitRecord } from "../../core/types";
import { prepareBatch, transmitBatch, receiveBatch } from "../../core/quantumEngine";

let batch: QuantumBatch;
let measureRecords: TransmitRecord[];

// Create the quantum model based on the configured settings
export function convertConfigToQuantumModel({ senderBits, senderBases }: { senderBits: Bit[], senderBases: Basis[]}) {
    batch = prepareBatch(senderBits, senderBases);

    return batch.ledger;
}

export function handleTransmission({ interceptProbability }: { interceptProbability: number }) {
    batch = transmitBatch(batch, interceptProbability);

    return batch.ledger;
}

export function handleMeasure({ receiverBasis }: { receiverBasis: Basis[] }) {
    measureRecords = receiveBatch(batch, receiverBasis);

    return measureRecords;
}


