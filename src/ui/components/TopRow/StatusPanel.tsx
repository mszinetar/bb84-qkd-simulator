import { Panel } from "../Panel/Panel";
import { BadgeInfo, CircleCheckIcon, CircleIcon } from "lucide-react";
import { PHASE_ORDER } from "../../config/simulatorConfig";
import styles from "./TopRow.module.css";
import { type SimulatorPhase } from "../../config/simulatorConfig";

const STEPS: { label: string; phase: SimulatorPhase }[] = [
  { label: "Setup",       phase: "CONFIGURED" },
  { label: "Started",     phase: "PREPARED" },
  { label: "Transmitted", phase: "TRANSMITTED" },
  { label: "Measured",    phase: "MEASURED" },
  { label: "Sifted",      phase: "SIFTED" },
  { label: "Reconciled",  phase: "RECONCILED" },
  { label: "Confirmed",   phase: "CONFIRMED" },
];

type StatusPanelProps = { phase?: SimulatorPhase };

export default function StatusPanel({ phase = "UNINITIALISED" }: StatusPanelProps) {
  const reached = PHASE_ORDER.indexOf(phase);
  const isDone = (p: SimulatorPhase) => reached >= PHASE_ORDER.indexOf(p);

  const doneCount = STEPS.filter((s) => isDone(s.phase)).length;

  return (
    <Panel title="Status" icon={<BadgeInfo />}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Progress</span>
        <span className={styles.progressCount}>{doneCount} of {STEPS.length} steps</span>
      </div>

      <ul className={styles.steps}>
        {STEPS.map(({ label, phase: p }) => {
          const done = isDone(p);
          return (
            <li key={label} className={done ? styles.stepDone : styles.stepPending}>
              {done ? <CircleCheckIcon color="#24B853" size={16} aria-hidden /> : <CircleIcon size={16} aria-hidden />}
              {label}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}