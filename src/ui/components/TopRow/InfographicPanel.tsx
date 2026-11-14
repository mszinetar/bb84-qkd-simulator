import { ChartColumnBig, CircleHelp } from "lucide-react";
import { Panel } from "../Panel/Panel";
import { Tile } from "../Tile/Tile";
import { type SimulatorState } from "../../config/simulatorConfig";
import { binaryEntropy } from "../../../core/postProcessor";
import { PHASE_ORDER } from "../../config/simulatorConfig";

type InfographicPanelProps = {
  state: SimulatorState;
};

type ColumnDatum = {
  shortLabel: string;
  label: string;
  value: number;
  color: string;
};

function calculateZeroYieldCutoff(rawLen: number, parityLeaked: number): number {
  if (rawLen <= 0) return 0.11;
  const targetEntropy = 1 - parityLeaked / rawLen;
  if (targetEntropy <= 0) return 0;
  if (targetEntropy >= 1) return 0.5;

  let low = 0;
  let high = 0.5;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    if (binaryEntropy(mid) < targetEntropy) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function VectorColumnChart({
  data,
  width = 230,
  height = 210,
}: {
  data: ColumnDatum[];
  width?: number;
  height?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const scaleMax = maxVal * 1.18;

  const padTop = 18;
  const padBottom = 26;
  const padLeft = 10;
  const padRight = 10;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const baselineY = padTop + plotHeight;

  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(34, slotWidth * 0.62);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {[0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = baselineY - ((maxVal * ratio) / scaleMax) * plotHeight;
        return (
          <line
            key={ratio}
            x1={padLeft}
            y1={y}
            x2={width - padRight}
            y2={y}
            stroke="#E5E5E5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        );
      })}

      <line
        x1={padLeft}
        y1={baselineY}
        x2={width - padRight}
        y2={baselineY}
        stroke="#000"
        strokeWidth="2"
      />

      {data.map((item, idx) => {
        const barHeight = Math.max(
          item.value > 0 ? 3 : 0,
          (item.value / scaleMax) * plotHeight
        );
        const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
        const y = baselineY - barHeight;
        const formattedVal = Number.isInteger(item.value)
          ? `${item.value}`
          : item.value.toFixed(1);

        return (
          <g key={item.label}>
            <title>{`${item.label}: ${formattedVal} bits`}</title>

            {/* Bar */}
            {barHeight > 0 && (
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={item.color}
                stroke="#000"
                strokeWidth="2"
              />
            )}

            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fill="#111"
            >
              {formattedVal}
            </text>

            <text
              x={x + barWidth / 2}
              y={baselineY + 15}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#444"
            >
              {item.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function InfographicPanel({ state }: InfographicPanelProps) {
  const isReconciledOrLater = PHASE_ORDER.indexOf(state.phase) >= PHASE_ORDER.indexOf("RECONCILED");

  const metrics = state.metrics;
  const hasData = Boolean(
   isReconciledOrLater && metrics && metrics.senderRawKey.length > 0 && state.phase !== "ABORTED"
  );

  const rawSiftedLen = metrics?.senderRawKey.length ?? 0;
  const quantumLeak =
    hasData && metrics ? rawSiftedLen * binaryEntropy(metrics.qber) : 0;
  const parityLeak = hasData && metrics ? metrics.parityBitsLeaked : 0;
  const netExtractable = hasData && metrics ? metrics.secureKeyLength : 0;

  const batchSize = state.config?.numBits ?? state.records.length;
  const overallYieldPct =
    hasData && batchSize > 0
      ? ((netExtractable / batchSize) * 100).toFixed(1)
      : null;

  const cutoffQber =
    hasData && metrics
      ? calculateZeroYieldCutoff(rawSiftedLen, parityLeak)
      : null;

  const colors = {
    raw: "#FBBF77",    
    quantum: "#F97316",
    parity: "#C2410C", 
    net: "#9A3412",    
  };

  const columnData: ColumnDatum[] = [
    { shortLabel: "Raw", label: "Raw Sifted Key", value: rawSiftedLen, color: colors.raw },
    { shortLabel: "Q-Leak", label: "Quantum Leak", value: quantumLeak, color: colors.quantum },
    { shortLabel: "P-Leak", label: "Parity Leak", value: parityLeak, color: colors.parity },
    { shortLabel: "Secret", label: "Net Extractable", value: netExtractable, color: colors.net },
  ];

  return (
    <Panel title="Infographic Key Yield" icon={<ChartColumnBig size={20} />} shadow={true}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginTop: "0.75rem",
          height: "calc(100% - 2.5rem)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--sky)",
            border: "2px solid var(--ink, #000)",
            borderRadius: "var(--radius-tile, 12px)",
            padding: "0.45rem 0.75rem",
            fontSize: "0.8rem",
            marginBottom: "0.5rem",
          }}
        >
        <span style={{
              fontWeight: 700,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
        Key rate
        </span>
          
          <span
            style={{
              fontWeight: 700,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {overallYieldPct !== null ? `${overallYieldPct}% yield` : "- % yield"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: "1rem",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              {hasData ? (
                <VectorColumnChart data={columnData} width={235} height={200} />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "220px",
                    marginBottom: "1.25rem",
                    borderRadius: "14px",
                    border: "2px dashed #444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666",
                    fontSize: "0.9rem",
                    textAlign: "center",
                    padding: "1rem",
                  }}
                >
                  Nothing to show here yet.
                </div>
              )}
            </div>

            <div
              style={{ position: "relative", width: "100%" }}
            >
              <Tile
                label="Zero-Yield Cutoff"
                value={cutoffQber !== null ? `${(cutoffQber * 100).toFixed(2)}% QBER` : "- % QBER"}
                tone="sky"
              />
              <CircleHelp
                size={18}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.5rem",
              width: "155px",
            }}
          >
            <Tile
              label="Raw Sifted Key"
              value={hasData ? `${rawSiftedLen} bits` : "-"}
              tone="grey"
              swatch={colors.raw}
            />
            <Tile
              label="Quantum Leak"
              value={hasData ? `${quantumLeak.toFixed(1)} bits` : "-"}
              tone="grey"
              swatch={colors.quantum}
            />
            <Tile
              label="Parity Leak"
              value={hasData ? `${parityLeak} bits` : "-"}
              tone="grey"
              swatch={colors.parity}
            />
            <Tile
              label="Net Extractable"
              value={hasData ? `${netExtractable} bits` : "-"}
              tone="grey"
              swatch={colors.net}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}