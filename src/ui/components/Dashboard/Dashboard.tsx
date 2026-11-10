import styles from "./Dashboard.module.css";

import TransmissionPanel  from "../TopRow/TransmissionPanel";
import  MetricsPanel  from "../TopRow/MetricsPanel";
import  InfographicPanel  from "../TopRow/InfographicPanel";
import  StatusPanel  from "../TopRow/StatusPanel";
import  ControlPanel  from "../TopRow/ControlPanel";

import { type SimulatorState } from "../../config/simulatorConfig";

type DashBoardProps = {
    state: SimulatorState;
    onConfigure: () => void;
    onStep: () => void;
    onAbort: () => void;
    onStart: () => void;
};

export default function Dashboard({ state, onConfigure, onStep, onAbort, onStart }: DashBoardProps) {
    return(
        <div className={styles.frame}>

            <div className={styles.column}>
                <TransmissionPanel state={state} onConfigure={onConfigure} onStart={onStart} />
                <MetricsPanel state={state} />
            </div>

            <InfographicPanel />

            <div className={styles.column}>
                <StatusPanel phase={state.phase} />
                <ControlPanel phase={state.phase} onStep={onStep} onAbort={onAbort} />
            </div>
        </div>
    );
}