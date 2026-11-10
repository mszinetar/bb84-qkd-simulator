import { Panel } from "../Panel/Panel";
import { Satellite, Ghost, Rocket, BadgeX, BadgePlus, MoveRight, CircleAlert, Funnel, FunnelX, Divide } from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "../Button/Button";
import { type SimulatorPhase, type SimulatorState, PHASE_ORDER } from "../../config/simulatorConfig";

type TransmissionPanelProps = {
   state: SimulatorState;
   onConfigure: () => void;
   onStart: () => void;
};



export default function TransmissionPanel({ state, onConfigure, onStart }: TransmissionPanelProps) {
  const views: Record<SimulatorPhase, ReactNode> = {
    UNINITIALISED: <EmptyView onConfigure={onConfigure} />,
    CONFIGURED:    <ConfiguredView onStart={onStart} />,
    PREPARED:      <ActiveView state={state} />,
    TRANSMITTED:   <ActiveView state={state} />,
    MEASURED:      <ActiveView state={state} />,
    SIFTED:        <ActiveView state={state} />,
    RECONCILED:    <div>Error correction</div>,
    CONFIRMED:     <div>Key confirmed</div>,
    ABORTED:       <div>Simulation aborted</div>,
  };
  return (
    <Panel title="Transmission" icon={< Satellite/>} shadow={true}>{views[state.phase]}</Panel>
  );
}

function EmptyView({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div
      style={{
        marginTop: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "100%",
      }}
    >
      <div>
        <Ghost size={48} strokeWidth={1.5} style={{ color: "var(--muted, #666)" }} />
        <h3 style={{ margin: "0.75rem 0 0.25rem", fontSize: "1.25rem", fontWeight: 700 }}>
          Setup
        </h3>
        <p style={{ margin: 0, color: "var(--muted, #666)",  }}>
          Configure the simulation to begin
        </p>
      </div>

      <Button variant="primary" onClick={onConfigure}>
        Configure
      </Button>
    </div>
  );
}

function ConfiguredView({ onStart }: { onStart: () => void }) {
    return (
    <div
      style={{
        marginTop: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "100%",
      }}
    >
      <div>
        <Rocket size={48} strokeWidth={1.5} style={{ color: "var(--muted, #666)" }} />
        <h3 style={{ margin: "0.75rem 0 0.25rem", fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <div style={{ background: "var(--ok-light)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "99px", width: "20px", height: "20px" }}>
            <div style={{ background: "var(--ok)", borderRadius: "99px", width: "10px", height: "10px" }}></div>
          </div>
          Ready
        </h3>
        <p style={{ margin: 0, color: "var(--muted, #666)" }}>
          Simulation configured successfully
        </p>
      </div>

      <Button variant="primary" onClick={onStart}>
        Start
      </Button>
    </div>
  );
}


function ActiveView({ state }: { state: SimulatorState}) {

  const isTransmittedOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("TRANSMITTED");
  const isMeasuredOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("MEASURED");
  const isSiftedOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("SIFTED");

  return (
    <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "100%",
    }}>

      <div style={{display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "150px", overflowY: "auto"}}>

        {state.records.map((record, idx) => (
          <div key={idx} style={{display: "flex", justifyContent: "space-evenly", gap: "0.6rem", alignItems: "center"}}>
            <div style={{background: "var(--sky)", padding: "0.25rem 0.5rem", borderRadius: "10px", display: "flex", gap: "10px", maxWidth: "100px"}}>
              {record.emittedBit}
              {record.emittedBasis === "rectilinear" ? <BadgePlus /> : <BadgeX />}
              </div>
              {isTransmittedOrLater && (
                <>
                  <MoveRight />
                  {record.interceptOptions?.isIntercept ? (
                    <CircleAlert color="var(--danger)" />
                  ) : (
                    <MoveRight color="var(--ok)" />
                  )}
                  <MoveRight color={record.interceptOptions?.isIntercept ? "var(--danger)" : "var(--ok)"} />
                </>
              )}  
              {isMeasuredOrLater && (
                <div style={{background: "var(--sky)", padding: "0.25rem 0.5rem", borderRadius: "10px", display: "flex", gap: "10px", maxWidth: "100px"}}>
                {record.receivedBasis === "rectilinear" ? <BadgePlus /> : <BadgeX />}
                {record.receivedBit}
                </div>
              )}
              {isSiftedOrLater && <MoveRight />}
              {isSiftedOrLater && (record.isSifted ? <Funnel color="var(--ok)"/> : <FunnelX color="var(--danger)"/>)}
              {isMeasuredOrLater && record.isSifted ? <MoveRight /> : <MoveRight opacity="0"/> }
              {isMeasuredOrLater && record.isSifted ? <div>{record.receivedBit}</div> : <div style={{opacity: "0"}}>{record.receivedBit}</div>}
          </div>
            
            
        ))}

      </div>
  </div>
  );
}