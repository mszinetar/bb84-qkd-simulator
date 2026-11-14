import { Panel } from "../Panel/Panel";
import { Satellite, Ghost, Rocket, BadgeX, BadgePlus, MoveRight, CircleAlert, Funnel, FunnelX, OctagonX, Hammer, CircleCheck } from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "../Button/Button";
import { type SimulatorPhase, type SimulatorState, PHASE_ORDER } from "../../config/simulatorConfig";

type TransmissionPanelProps = {
   state: SimulatorState;
   onConfigure: () => void;
   onStart: () => void;
   onRestart: () => void;
};

export default function TransmissionPanel({ state, onConfigure, onStart, onRestart }: TransmissionPanelProps) {
  const views: Record<SimulatorPhase, ReactNode> = {
    UNINITIALISED: <EmptyView onConfigure={onConfigure} />,
    CONFIGURED:    <ConfiguredView onStart={onStart} />,
    PREPARED:      <ActiveView state={state} />,
    TRANSMITTED:   <ActiveView state={state} />,
    MEASURED:      <ActiveView state={state} />,
    SIFTED:        <ActiveView state={state} />,
    RECONCILED:        <ActiveView state={state} />,
    CONFIRMED:     <ConfirmedView state={state} onRestart={onRestart} />,
    ABORTED:       <AbortedView onRestart={onRestart} state={state}/>,
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

function ActiveView({ state }: { state: SimulatorState }) {
  const isTransmittedOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("TRANSMITTED");
  const isMeasuredOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("MEASURED");
  const isSiftedOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("SIFTED");
  const isReconciledOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("RECONCILED");

  let rawKeyCursor = 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxHeight: "160px",
        overflowY: "auto",
        paddingRight: "0.5rem",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {state.records.map((record, idx) => {
        const isError = record.emittedBit !== record.receivedBit;

        const keyIndex = record.isFinalKeyBit ? rawKeyCursor++ : -1;
        const reconciledBit =
          keyIndex !== -1 && state.metrics?.reconciledKey?.[keyIndex] !== undefined
            ? state.metrics.reconciledKey[keyIndex]
            : record.receivedBit;

        const isFixed = reconciledBit === record.emittedBit;

        return (
          <div
            key={idx}
            style={{
              display: "grid",
              // Alice | arrow | Eve | Bob | arrow | Funnel | arrow | SiftedBit | Hammer | ReconciledBit
              gridTemplateColumns: "70px 24px 24px 70px 24px 24px 24px 28px 24px 28px",
              alignItems: "center",
              justifyItems: "center",
              columnGap: "0.5rem",
              opacity: record.isSacrificed ? "0.2" : "1",
            }}
          >
            {/* 1. Alice Emitted */}
            <div
              style={{
                background: "var(--sky)",
                padding: "0.25rem 0.5rem",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <span>{record.emittedBit}</span>
              {record.emittedBasis === "rectilinear" ? <BadgePlus size={18} /> : <BadgeX size={18} />}
            </div>

            {/* 2. Channel Arrow 1 */}
            {isTransmittedOrLater ? (
              <MoveRight size={18} color={record.interceptOptions?.isIntercept ? "var(--danger)" : "var(--ok)"} />
            ) : (
              <span />
            )}

            {/* 3. Eve Intercept */}
            {isTransmittedOrLater ? (
              record.interceptOptions?.isIntercept ? (
                <CircleAlert size={18} color="var(--danger)" />
              ) : (
                <MoveRight size={18} color="var(--ok)" />
              )
            ) : (
              <span />
            )}

            {/* 4. Bob Measured */}
            {isMeasuredOrLater ? (
              <div
                style={{
                  background: "var(--sky)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {record.receivedBasis === "rectilinear" ? <BadgePlus size={18} /> : <BadgeX size={18} />}
                <span>{record.receivedBit}</span>
              </div>
            ) : (
              <span />
            )}

            {/* 5. Arrow to Funnel */}
            {isSiftedOrLater ? <MoveRight size={18} /> : <span />}

            {/* 6. Sift Funnel */}
            {isSiftedOrLater ? (
              record.isSifted ? <Funnel size={18} color="var(--ok)" /> : <FunnelX size={18} color="var(--danger)" />
            ) : (
              <span />
            )}

            {/* 7. Arrow to Sifted bit */}
            {isSiftedOrLater && record.isSifted ? <MoveRight size={18} /> : <span />}

            {/* 8. Sifted Bit outcome */}
            {isSiftedOrLater && record.isSifted ? (
              <div
                style={{
                  backgroundColor: !isError ? "var(--ok-light)" : "var(--danger-light)",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "5px",
                  color: !isError ? "var(--ok)" : "var(--danger)",
                }}
              >
                {record.receivedBit}
              </div>
            ) : (
              <span />
            )}

            {/* 9. Reconcile Hammer */}
            {isReconciledOrLater && record.isSifted && !record.isSacrificed && isError ? (
              <Hammer size={18} />
            ) : (
              <span />
            )}

            {/* 10. Reconciled Bit */}
            {isReconciledOrLater && record.isSifted && !record.isSacrificed && isError ? (
              <div
                style={{
                  backgroundColor: isFixed ? "var(--ok-light)" : "var(--danger-light)",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "5px",
                  color: isFixed ? "var(--ok)" : "var(--danger)",
                }}
                title={isFixed ? "Corrected by Cascade" : "Unresolved parity collision"}
              >
                {reconciledBit}
              </div>
            ) : (
              <span />
            )}
          </div>
        );
      })}
    </div>
  );
}
function AbortedView({ state, onRestart }: { state: SimulatorState, onRestart: () => void }) {
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
        <OctagonX size={48} strokeWidth={1.5} style={{ color: "var(--danger)" }} />
        <h3 style={{ margin: "0.75rem 0 0.25rem", fontSize: "1.25rem", fontWeight: 700 }}>
          Aborted
        </h3>
        <p style={{ margin: 0, color: "var(--muted, #666)",  }}>
          {state.abortReason && (state.abortReason === "QberViolation" ? "Maximum QBER violated, channel is unsafe" : "Simulation stopped")}
        </p>
      </div>

      <Button variant="primary" onClick={onRestart}>
        Restart
      </Button>
    </div>
  );
}

function ConfirmedView({ state, onRestart }: { state: SimulatorState; onRestart: () => void }) {
  const finalBits = state.metrics?.senderFinalKey ?? [];
  const rawLen = state.metrics?.senderRawKey.length ?? 0;
  const isKeyConfirmed = state.metrics?.isKeyConfirmed ?? false;
  const hasKey = finalBits.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {hasKey ? (
            <CircleCheck size={32} strokeWidth={1.75} style={{ color: "var(--ok)" }} />
          ) : (
            <CircleAlert size={32} strokeWidth={1.75} style={{ color: "var(--danger)" }} />
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              {hasKey ? "Secure Key Established" : "No Secret Key Extracted"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted, #666)" }}>
               Compression: {rawLen} bits → {finalBits.length} bits
            </p>
          </div>
        </div>

        <Button variant="primary" onClick={onRestart}>
          Restart
        </Button>
      </div>

      {hasKey ? (
        <div
          style={{
            background: "var(--ok-light)",
            border: "1px solid var(--ok)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.8rem",
            wordBreak: "break-all",
            maxHeight: "95px",
            overflowY: "auto",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--ok)" }}>
            FINAL SECRET KEY ({finalBits.length} BITS)
          </div>
          <div>{finalBits.join("")}</div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--danger-light)",
            border: "1px solid var(--danger)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            fontSize: "0.8rem",
            color: "var(--danger)",
          }}
        >
          {rawLen === 0 ? (
            <>
              <strong>Insufficient Raw Bits:</strong> All sifted bits were consumed during QBER sampling. Run a larger batch size to extract a key.
            </>
          ) : !isKeyConfirmed ? (
            <>
              <strong>Reconciliation Unconfirmed:</strong> Residual parity errors remained after Cascade passes, preventing key extraction.
            </>
          ) : (
            <>
              <strong>Zero-Yield Compression:</strong> Quantum leakage and Cascade parity disclosure consumed the entire {rawLen}-bit raw key budget.
            </>
          )}
        </div>
      )}
    </div>
  );
}