import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { BadgePlus, BadgeX } from "lucide-react";
import type { Bit, Basis } from "../../../core/types";
import styles from "./SetupDialog.module.css";

const BASE_OPTIONS: { basis: Basis; name: string; icon: React.ReactNode }[] = [
  { basis: "rectilinear", name: "Rectilinear (+)", icon: <BadgePlus size={20} strokeWidth={2.5} /> },
  { basis: "diagonal",    name: "Diagonal (x)",    icon: <BadgeX size={20} strokeWidth={2.5} /> },
];

type Props = {
  count: number;
  bits: (Bit | null)[];
  senderBases: (Basis | null)[];
  receiverBases: (Basis | null)[];
  onBits: (start: number, values: (Bit | null)[]) => void;
  onSenderBases: (start: number, values: (Basis | null)[]) => void;
  onReceiverBases: (start: number, values: (Basis | null)[]) => void;
};

export default function ManualEntry({
  count, bits, senderBases, receiverBases, onBits, onSenderBases, onReceiverBases,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusBox = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/[^01]/g, "").slice(-1);
    if (!digit) return;
    onBits(i, [Number(digit) as Bit]);
    focusBox(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (bits[i] != null) {
        onBits(i, [null]);
      } else if (i > 0) {
        onBits(i - 1, [null]);
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      focusBox(i + 1);
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/[^01]/g, "")
      .slice(0, count - i)
      .split("")
      .map((d) => Number(d) as Bit);
    if (!digits.length) return;
    onBits(i, digits);
    focusBox(Math.min(i + digits.length, count - 1));
  };

  const indexes = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={styles.manual}>
      <div className={styles.manualScroll}>
        <div className={styles.manualGrid} style={{ "--n": count } as React.CSSProperties}>
          <span className={styles.rowLabel}>Sender-Side Bits</span>
          {indexes.map((i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              className={styles.bitBox}
              inputMode="numeric"
              autoComplete="off"
              aria-label={`Sender bit ${i + 1}`}
              value={bits[i] ?? ""}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}

          <span className={styles.rowLabel}>Sender-Side Bases</span>
          {indexes.map((i) => (
            <BaseCell key={i} label={`Sender basis ${i + 1}`}
              value={senderBases[i] ?? null} onChange={(b) => onSenderBases(i, [b])} />
          ))}

          <span className={styles.rowLabel}>Receiver-Side Bases</span>
          {indexes.map((i) => (
            <BaseCell key={i} label={`Receiver basis ${i + 1}`}
              value={receiverBases[i] ?? null} onChange={(b) => onReceiverBases(i, [b])} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BaseCell({ value, onChange, label }: {
  value: Basis | null; onChange: (b: Basis) => void; label: string;
}) {
  return (
    <div className={styles.baseCell} role="radiogroup" aria-label={label}>
      {BASE_OPTIONS.map(({ basis, name, icon }) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === basis}
          aria-label={name}
          className={value === basis ? styles.baseOn : styles.baseOff}
          onClick={() => onChange(basis)}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}