import { ClipboardPen } from "lucide-react";
import { Panel } from "../Panel/Panel";
import LedgerTable from "./LedgerTable";
import { PHASE_ORDER, type SimulatorPhase } from "../../config/simulatorConfig";
import type { TransmitRecord } from "../../../core/types";

type Props = { records: TransmitRecord[]; phase: SimulatorPhase };

export default function LedgerPanel({ records, phase }: Props) {
  const showSifted = PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf("SIFTED");

  return (
    <Panel title="Ledger" icon={<ClipboardPen />}>
      <LedgerTable records={records} showSifted={showSifted} />
    </Panel>
  );
}