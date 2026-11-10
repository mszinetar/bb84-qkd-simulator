import { Panel } from "../Panel/Panel";
import { Joystick, CircleStop, StepForward } from "lucide-react";
import { Button } from "../Button/Button";
import styles from "./TopRow.module.css";
import type { SimulatorPhase } from "../../config/simulatorConfig";

type ControlPanelProps = {
  onStep?: () => void;
  onAbort?: () => void;
  phase: SimulatorPhase;
};

export default function ControlPanel({ phase, onStep, onAbort }: ControlPanelProps) {

  const CAN_STEP: SimulatorPhase[] = ["PREPARED","TRANSMITTED","MEASURED","SIFTED","RECONCILED"];
  const CAN_ABORT: SimulatorPhase[] = ["CONFIGURED","PREPARED","TRANSMITTED","MEASURED","SIFTED","RECONCILED"];
  return (
    <Panel title="Controls" icon={<Joystick />} shadow={true}>
     <div className={styles.controls}>
        <Button disabled={!CAN_STEP.includes(phase)} icon={<StepForward />} onClick={onStep}>Step</Button>
        <Button disabled={!CAN_ABORT.includes(phase)} variant="danger" icon={<CircleStop />} onClick={onAbort}>Abort</Button>
      </div>
    </Panel>
  );
}
