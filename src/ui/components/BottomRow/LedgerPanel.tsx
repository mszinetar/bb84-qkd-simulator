import { ClipboardPen } from "lucide-react";
import { Panel } from "../Panel/Panel";
import LedgerTable from "./LedgerTable";
import { PHASE_ORDER, type SimulatorPhase, type SimulatorState } from "../../config/simulatorConfig";
import type { TransmitRecord } from "../../../core/types";

type Props = { records: TransmitRecord[]; phase: SimulatorPhase, state: SimulatorState };

export default function LedgerPanel({ records, phase, state}: Props) {
  const qberAbort = (state.abortReason !== undefined) &&  (state.abortReason === "QberViolation");
  const showSifted = PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf("SIFTED") || qberAbort;

  return (
    <Panel title="Ledger" icon={<ClipboardPen />}>
      <LedgerTable records={records} showSifted={showSifted} phase={phase}/>
    </Panel>
  );
}