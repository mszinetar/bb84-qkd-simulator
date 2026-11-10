export type Bit = 0 | 1;

export type Basis = 'rectilinear' | 'diagonal';

export type QuantumState =
  | { readonly basis: 'rectilinear'; readonly ket: '|0⟩'; readonly bit: 0 }
  | { readonly basis: 'rectilinear'; readonly ket: '|1⟩'; readonly bit: 1 }
  | { readonly basis: 'diagonal'; readonly ket: '|+⟩'; readonly bit: 0 }
  | { readonly basis: 'diagonal'; readonly ket: '|-⟩'; readonly bit: 1 };

export type Qubit = {
  readonly id: string;
  readonly state: QuantumState;
};

export const QUANTUM_STATES = {
  rectilinear: {
    0: { basis: 'rectilinear', ket: '|0⟩', bit: 0 } as const,
    1: { basis: 'rectilinear', ket: '|1⟩', bit: 1 } as const,
  },
  diagonal: {
    0: { basis: 'diagonal', ket: '|+⟩', bit: 0 } as const,
    1: { basis: 'diagonal', ket: '|-⟩', bit: 1 } as const,
  },
} as const;

type InterceptionState = 
    | {readonly isIntercept: false}
    | {
        readonly isIntercept: true;
        readonly guessedBasis: Basis;
        readonly measuredBit: Bit;
        readonly retransmitRef: string;
        readonly retransmittedState: QuantumState;
    };

export type TransmitRecord = {
    readonly seqID: number;

    readonly emittedBit: Bit;
    readonly emittedBasis: Basis;

    readonly emittedQubitRef: string;
    readonly emittedState: QuantumState;

    readonly interceptOptions?: InterceptionState;

    readonly receivedBit?: Bit;
    readonly receivedBasis?: Basis;

    readonly receivedQubitRef?: string;
    readonly receivedState?: QuantumState;

    readonly isSifted?: boolean;
    readonly isSacrificed?: boolean;
    readonly hasError?: boolean;
    readonly isFinalKeyBit?: boolean;
};



