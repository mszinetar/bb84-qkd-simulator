import { useState } from 'react';
import stlyes from './App.module.css';

import  Header  from "./ui/components/Header/Header";
import  DashBoard  from "./ui/components/Dashboard/Dashboard";
import  LedgerPanel  from "./ui/components/BottomRow/LedgerPanel";
import  ActivityLog  from "./ui/components/BottomRow/ActivityLog";
import SetupDialog from './ui/components/SetupDialog/SetupDialog';

import { convertConfigToQuantumModel, handleTransmission, handleMeasure } from './ui/config/simulatorConfigHelper';

import { INITIAL_STATE, type SimulatorState, type SimulatorConfig } from "./ui/config/simulatorConfig";
import type { TransmitRecord } from './core/types';
import { siftBatch } from './core/postProcessor';

export default function App() {
  const [state, setState] = useState<SimulatorState>(INITIAL_STATE);
  const [setupOpen, setSetupOpen] = useState(false);

  // Configure the numerical values regarding the simulation
  const handleConfigSave = (config: SimulatorConfig) => {
      setState((s) => ({
          ...s,
          config, 
          phase: "CONFIGURED"
     }));
    setSetupOpen(false);
  };

  // Generate the actual QuantumBatch defined in types.ts which creates the records
  const handleStart = () => {
    const records = convertConfigToQuantumModel({ senderBits: state.config?.SenderBits!, senderBases: state.config?.SenderBases! });
    setState((s) => ({
      ...s,
      records,
      phase: "PREPARED"
    }));
  };


  const handleStep = () => {
    let records: TransmitRecord[];
    switch(state.phase) {
      case "PREPARED":
        records = handleTransmission({ interceptProbability: state.config?.interceptProbability!})
        setState((s) => ({
           ...s,
           records,
           phase: "TRANSMITTED"}
          ));
      break;

      case "TRANSMITTED":
        records  = handleMeasure({ receiverBasis: state.config?.ReceiverBases! });
        setState((s) => ({
           ...s,
           records,
           phase: "MEASURED"}
          ));
      break;

      case "MEASURED":
      records = siftBatch(state.records);
      setState((s) => ({
           ...s,
           records,
           phase: "SIFTED"}
          ));
      break;

      
    }
  }; 

  const handleAbort = () => setState((s) => ({ ...s, phase: "ABORTED" }));

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
        />
        <div className={stlyes.bottom}>
          <LedgerPanel records={state.records} phase={state.phase}/>
          <ActivityLog />
        </div>
      </main>
    </div>
  );
}