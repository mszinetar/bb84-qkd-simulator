import { type Bit,
        type Qubit, 
        type Basis, 
        type QuantumState,
        type TransmitRecord,
        QUANTUM_STATES } from './types.ts'

export type QuantumBatch = {
    readonly qubits: Qubit[];
    readonly ledger: TransmitRecord[];
};     

export function measureState(
  state: QuantumState,
  measureBasis: Basis
): { measuredBit: Bit; collapsedState: QuantumState } {
  if (state.basis === measureBasis) {
    return {
      measuredBit: state.bit,
      collapsedState: state,
    };
  }

  const collapsedBit: Bit = Math.random() < 0.5 ? 0 : 1;
  const collapsedState = QUANTUM_STATES[measureBasis][collapsedBit];

  return {
    measuredBit: collapsedBit,
    collapsedState,
  };
}

export function prepareBatch(
    srcBits: Bit[],
    srcBases: Basis[]
): QuantumBatch {
   if (srcBits.length !== srcBases.length) {
    throw new Error('Bits and bases arrays must have identical length.');
   }

    const emittedQubits: Qubit[] = [];
    const initialLedger: TransmitRecord[] = [];

    srcBits.forEach((bit, idx) => {
    const basis = srcBases[idx];
    const qubitRef = `#Q-originl-${idx.toString().padStart(2, '0')}`;
    const state = QUANTUM_STATES[basis][bit];

    const qubit: Qubit = {
        id: qubitRef,
        state: state,
    };
    emittedQubits.push(qubit);

    initialLedger.push({
      seqID: idx,
      emittedBit: bit,
      emittedBasis: basis,
      emittedQubitRef: qubit.id,
      emittedState: qubit.state,
    });
  });

  return { 
    qubits: emittedQubits,
    ledger: initialLedger
  };
}

export function transmitBatch(
    inFlightBatch: QuantumBatch,
    interceptProbability: number
): QuantumBatch {
    const arrivingQubits: Qubit[] = [];

    const updatedLedger = inFlightBatch.ledger.map((record, idx) => {
        const originalQubit = inFlightBatch.qubits[idx];
        const willIntercept = Math.random() < interceptProbability;

        if (!willIntercept) {
            arrivingQubits.push(originalQubit);
            return  {
                ...record,
                interceptOptions: { isIntercept: false } as const,
            };
        }

        const guessedBasis: Basis = Math.random() < 0.5 ? 'rectilinear' : 'diagonal';
        const { measuredBit, collapsedState } = measureState(originalQubit.state, guessedBasis);

        const retransmittedQubit: Qubit = {
            id: `#Q-retrans-${idx.toString().padStart(2, '0')}`,
            state: collapsedState,
        };
        arrivingQubits.push(retransmittedQubit);

        return {
            ...record,
            interceptOptions: {
                isIntercept: true,
                guessedBasis,
                measuredBit,
                retransmitRef: retransmittedQubit.id,
                retransmittedState: retransmittedQubit.state,
            },
        };
    });

    return { 
        qubits: arrivingQubits,
        ledger: updatedLedger
    }; 
}

export function receiveBatch(
    arrivingBatch: QuantumBatch,
    dstBases: Basis[]
): TransmitRecord[] {
    if (dstBases.length !== arrivingBatch.qubits.length) {
  throw new Error('Receiver-side bases count must match the arriving batch size.');
}
    return arrivingBatch.ledger.map((record, idx) => {
        const arrivingQubit = arrivingBatch.qubits[idx];
        const chosenBasis = dstBases[idx];

        const { measuredBit, collapsedState } = measureState(arrivingQubit.state, chosenBasis);

        return {
            ...record,
            receivedBit: measuredBit,
            receivedBasis: chosenBasis,
            receivedQubitRef: arrivingQubit.id,
            receivedState: collapsedState,
        };
    });
}