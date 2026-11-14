import { type TransmitRecord, type Bit, type Basis } from '../../core/types.ts'; 
import { type QBERMetrics } from '../../core/postProcessor.ts';

export type AbortReason = 
  | "QberViolation"
  | "manualAbort"
  |  undefined;

export type SimulatorPhase = 
  | 'UNINITIALISED'  
  | 'CONFIGURED'     
  | 'PREPARED'       
  | 'TRANSMITTED'    
  | 'MEASURED'       
  | 'SIFTED'         
  | 'RECONCILED'     
  | 'CONFIRMED'      
  | 'ABORTED';       

export const PHASE_ORDER: SimulatorPhase[] = [
  "UNINITIALISED", "CONFIGURED", "PREPARED", "TRANSMITTED",
  "MEASURED", "SIFTED", "RECONCILED", "CONFIRMED",
];

export interface SimulatorConfig {
  bitAndBasemode: 'random' | 'manual';
  numBits: number;
  interceptProbability: number;
  maxQber: number;
  sacrificeRatio: number;
  
  SenderBits: Bit[];
  SenderBases: Basis[];
  ReceiverBases: Basis[];
}

export type LogEntry = {
  id?: string;
  title: string;
  message: string;
  type: "peach" | "grey" | "sky" | "red" | "green";
};

export interface SimulatorState {
  phase: SimulatorPhase;
  config: SimulatorConfig | null;
  logs: LogEntry[];
  records: TransmitRecord[];
  metrics: QBERMetrics | null;
  abortReason?: AbortReason;
}

export const INITIAL_STATE: SimulatorState = {
  phase: "UNINITIALISED",
  config: null,
  logs: [{title: "Uninitialised", message: "Configure the simulator", type: "peach"}],
  records: [],
  metrics: null,
};