import { Panel } from "../Panel/Panel";
import { Gauge } from "lucide-react";
import { Tile } from "../Tile/Tile";
import styles from "./TopRow.module.css";
import { type SimulatorState, PHASE_ORDER } from "../../config/simulatorConfig";

type MetricsPanelProps = {
  state: SimulatorState;
};

export default function MetricsPanel({ state }: MetricsPanelProps) {
  const isTransmittedOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("TRANSMITTED");
  const isSiftedOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("SIFTED");
  const isAborted = state.phase === "ABORTED";

  return (
    <Panel title="Metrics" icon={<Gauge />} shadow={true}>
        <div className={styles.metricsGrid}>
          <Tile label="Batch Size" value={state.config?.numBits.toString().concat(" bits")} tone="peach-blackborder" />
          <Tile label="P(intercept)" value={state.config?.interceptProbability.toString()} tone="peach-blackborder" />
          <Tile label="Sacrifice Ratio" value={state.config?.sacrificeRatio.toString()} tone="peach-blackborder" />
          <Tile label="Transmitted" value={isTransmittedOrLater ? state.records?.length.toString().concat(" bits") : 
            (isAborted ? state.records?.length.toString().concat(" bits") : "-")} tone="peach-blackborder" />
          <Tile label="Sifted" value={isSiftedOrLater ? state.records?.filter((r) => r.isSifted).length.toString().concat(" bits") :
           (isAborted ? state.records?.filter((r) => r.isSifted).length.toString().concat(" bits") : "-")} tone="peach-blackborder" />
          <Tile label="Public Sample" value={state.metrics?.sampleSize.toString().concat(" bits")} tone="peach-blackborder" />
           <Tile label="Public Errors" value={state.metrics?.errorCount.toString().concat(" bits")} tone="peach-blackborder" />
          <Tile label="QBER" value={state.metrics ? ((state.metrics?.qber*100).toFixed(2)).toString().concat("%") : "-"} tone={state.abortReason === "QberViolation" ? "red" : "peach-blackborder"} />
      </div>
    </Panel>
  );
}
