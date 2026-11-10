import { type TransmitRecord, type Bit, type Basis } from '../../core/types.ts'; 
import { type QBERMetrics } from '../../core/postProcessor.ts';

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

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SimulatorState {
  phase: SimulatorPhase;
  config: SimulatorConfig | null;
  logs: LogEntry[];
  records: TransmitRecord[];
  metrics: QBERMetrics | null;
}

export const INITIAL_STATE: SimulatorState = {
  phase: "UNINITIALISED",
  config: null,
  logs: [],
  records: [],
  metrics: null,
};