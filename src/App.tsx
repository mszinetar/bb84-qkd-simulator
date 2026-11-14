import { useState } from 'react';
import stlyes from './App.module.css';

import  Header  from "./ui/components/Header/Header";
import  DashBoard  from "./ui/components/Dashboard/Dashboard";
import  LedgerPanel  from "./ui/components/BottomRow/LedgerPanel";
import  ActivityLog  from "./ui/components/BottomRow/ActivityLog";
import  SetupDialog from './ui/components/SetupDialog/SetupDialog';

import { evaluateBatch } from './core/postProcessor';

import { convertConfigToQuantumModel, handleTransmission, handleMeasure } from './ui/config/simulatorConfigHelper';

import { INITIAL_STATE, type SimulatorState, type SimulatorConfig } from "./ui/config/simulatorConfig";
import type { TransmitRecord } from './core/types';
import { siftBatch } from './core/postProcessor';
import { binaryEntropy } from './core/postProcessor';

import { type LogEntry } from './ui/config/simulatorConfig';
import { amplifyPrivacy } from './core/postProcessor';

export default function App() {
  const [state, setState] = useState<SimulatorState>(INITIAL_STATE);
  const [setupOpen, setSetupOpen] = useState(false);

  const handleConfigSave = (config: SimulatorConfig) => {
      setState((s) => ({
          ...s,
          config, 
          phase: "CONFIGURED",
          logs: [...s.logs, { title:  "Configured", message: "Click start to begin", type: "green"} as LogEntry],
     }));
    setSetupOpen(false);
  };

  const handleStart = () => {
    const records = convertConfigToQuantumModel({ senderBits: state.config?.SenderBits!, senderBases: state.config?.SenderBases! });
    setState((s) => ({
      ...s,
      records,
      phase: "PREPARED",
      logs: [...s.logs, { title:  "Prepared", message: "Qubits are ready for transmission", type: "green"} as LogEntry],
    }));
  };

  const handleRestart = () => {
    setState((s) => INITIAL_STATE);
  }


  const handleStep = async () => {
    let records: TransmitRecord[];
    switch(state.phase) {
            case "PREPARED":
              records = handleTransmission({ interceptProbability: state.config?.interceptProbability!})
              setState((s) => ({
                ...s,
                records,
                phase: "TRANSMITTED",
                logs: [...s.logs, { title:  "Transmitted", message: "Qubits transmitted", type: "green"} as LogEntry],}
                ));
            break;

            case "TRANSMITTED":
              records  = handleMeasure({ receiverBasis: state.config?.ReceiverBases! });
              setState((s) => ({
                ...s,
                records,
                phase: "MEASURED",
                logs: [...s.logs, { title:  "Measured", message: "Qubits received", type: "green"} as LogEntry],}
                ));
            break;

            case "MEASURED":
            records = siftBatch(state.records);
            setState((s) => ({
                ...s,
                records,
                phase: "SIFTED",
                logs: [...s.logs, { title:  "Sifted", message: "Bases compared", type: "green"} as LogEntry],}
                ));
            break;

            case "SIFTED": 
            const result = await evaluateBatch(
              state.records, 
              state.config?.sacrificeRatio!, 
              state.config?.maxQber!
            );
            const shouldWarn = !result.metrics.isSecure; 
            const nextLogs: LogEntry[] = shouldWarn ? 
            [
              { title:  "Sampling", message: "Public sampling", type: "green"},
              { title:  "Warning", message: `Sampled QBER of ${(result.metrics.qber*100).toFixed(2)}% exceeds ${(state.config?.maxQber!*100).toFixed(2)}% threshold. The simulation will abort`, type: "peach"},] : 
              [{ title:  "Sampling", message: "Public sampling", type: "green"}];
            setState((s) => ({
              ...s,
              records: result.records,
              metrics: result.metrics, 
              phase: "SAMPLED",
              logs: [...s.logs, ...nextLogs]
            }));
            break;

            case "SAMPLED": {
               const nextPhase = state.metrics?.isSecure ? "RECONCILED" : "ABORTED";

            const passLogs: LogEntry[] = (state.metrics?.passes ?? []).map((p) => ({
              title: `Reconciliation · Pass #${p.passNumber}`,
              message:
                `Block size: ${p.blockSize} \n Corrected: ${p.errorsCorrected} errors \n` +
                `Hash check: ${p.senderHash.slice(0, 6)}… / ${p.receiverHash.slice(0, 6)}… ${
                  p.isMatch ? "✓" : "✗"
                }`,
              type: p.isMatch ? "green" : "peach",
            }));

            const nextLogs: LogEntry[] = state.metrics?.isSecure
              ? [...passLogs, {title: "Reconciliation · Finished", message: "Key confirmed", type: "green"},
                              {title: "Reconciliation · Final Summary", message: 
                                ` Reconciled Raw Bits: ${state.metrics.senderRawKey.length} \n` + 
                                `Quantum Eavesdrop: approx. ${(state.metrics.senderRawKey.length * binaryEntropy(state.metrics.qber)).toFixed(1)} bits` +
                                `\nParity Leak From Cascade: ${state.metrics.parityBitsLeaked} bits \n` +
                                `Final Pure Secret Key:   ${state.metrics.secureKeyLength} bits`,
                                 type: "sky"}
                ]
              : [
                  {
                    title: "Aborted",
                    message: "QBER threshold exceeded",
                    type: "red",
                  },
                ];

            const abortReason = state.metrics?.isSecure ? undefined : "QberViolation";

            setState((s) => ({
              ...s,
              phase: nextPhase,
              abortReason: abortReason,
              logs: [...s.logs, ...nextLogs],
            }));
            break;
            }

            case "RECONCILED": {
            if (!state.metrics) break;

            const { senderRawKey, reconciledKey, secureKeyLength, isKeyConfirmed } = state.metrics;

            const toeplitzSeed = Math.floor(Math.random() * 233280);
            const senderFinalKey =
              isKeyConfirmed && secureKeyLength > 0
                ? amplifyPrivacy(senderRawKey, secureKeyLength, toeplitzSeed)
                : [];
            const receiverFinalKey =
              isKeyConfirmed && secureKeyLength > 0
                ? amplifyPrivacy(reconciledKey, secureKeyLength, toeplitzSeed)
                : [];

            setState((s) => ({
              ...s,
              phase: "CONFIRMED",
              metrics: s.metrics
                ? {
                    ...s.metrics,
                    senderFinalKey,
                    receiverFinalKey,
                  }
                : null,
              logs: [
                ...s.logs,
                senderFinalKey.length > 0
                  ? {
                      title: "Privacy Amplification · Complete",
                      message: `Compressed ${senderRawKey.length} bits → ${senderFinalKey.length} secret bits`,
                      type: "green",
                    }
                  : {
                      title: "Privacy Amplification · Zero Yield",
                      message: !isKeyConfirmed
                        ? "Key confirmation failed or no raw bits remained to amplify."
                        : "Entire raw key budget consumed by quantum & parity leakage (0 bits extracted).",
                      type: "red",
                    },
                  ],
                }));
                break;
}
    }
}; 

  const handleAbort = () => setState((s) => (
      {
        ...s,
        abortReason: "manualAbort",
        phase: "ABORTED",
        logs: [...s.logs, {title:  "Aborted", message: "Simulation aborted", type: "red"}],
      }));

  console.log(state);

  return (
    <div className={stlyes.page}>
      <Header />
      <main className={stlyes.main}>
        <SetupDialog
          open={setupOpen}
          onClose={() => setSetupOpen(false)}
          onSave={handleConfigSave}
        />
        <DashBoard 
          state={state}
          onConfigure={() => setSetupOpen(true)}
          onStep={handleStep}
          onAbort={handleAbort}
          onStart={handleStart}
          onRestart={handleRestart}
        />
        <div className={stlyes.bottom}>
          <LedgerPanel records={state.records} phase={state.phase} state={state}/>
          <ActivityLog logs={state.logs} />
        </div>
      </main>
    </div>
  );
}