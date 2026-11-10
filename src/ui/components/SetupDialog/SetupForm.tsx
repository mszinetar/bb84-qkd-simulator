import { useState, type Dispatch, type SetStateAction, type FormEvent } from "react";
import { Bolt } from "lucide-react";
import { Button } from "../Button/Button";
import ManualEntry from "./ManualEntry";
import type { SimulatorConfig } from "../../config/simulatorConfig";
import type { Bit, Basis } from "../../../core/types";
import styles from "./SetupDialog.module.css";

const MAX_MANUAL_BITS = 15;
const MAX_BITS = 1000;

const randomBit = (): Bit => (Math.random() < 0.5 ? 0 : 1);
const randomBasis = (): Basis => (Math.random() < 0.5 ? 'rectilinear' : 'diagonal');

const toNumber = (s: string) => (s.trim() === "" ? NaN : Number(s));
const inRange = (n: number, min: number, max: number) => n >= min && n <= max;

const patcher =
  <T,>(set: Dispatch<SetStateAction<(T | null)[]>>) =>
  (start: number, values: (T | null)[]) =>
    set((prev) => {
      const next = [...prev];
      values.forEach((v, k) => { next[start + k] = v; });
      return next;
    });

type SetupFormProps = {
  onSave: (config: SimulatorConfig) => void;
  onClose: () => void;
};

export default function SetupForm({ onSave, onClose }: SetupFormProps) {
  const [wantsRandom, setWantsRandom] = useState(true);
  const [numBits, setNumBits] = useState("20");
  const [intercept, setIntercept] = useState("0.25");
  const [maxQber, setMaxQber] = useState("11");
  const [sacrifice, setSacrifice] = useState("0.3");

  const [bits, setBits] = useState<(Bit | null)[]>([]);
  const [senderBases, setSenderBases] = useState<(Basis | null)[]>([]);
  const [receiverBases, setReceiverBases] = useState<(Basis | null)[]>([]);

  const n = toNumber(numBits);
  const nValid = Number.isInteger(n) && inRange(n, 1, MAX_BITS);
  const manualAllowed = nValid && n <= MAX_MANUAL_BITS;
  const isRandom = wantsRandom || !manualAllowed; 

  const interceptValue = toNumber(intercept);
  const qberValue = toNumber(maxQber);
  const sacrificeValue = toNumber(sacrifice);

  const fieldsValid =
    nValid &&
    inRange(interceptValue, 0, 1) &&
    inRange(qberValue, 0, 100) &&
    inRange(sacrificeValue, 0, 1);

  const manualComplete =
    isRandom ||
    Array.from({ length: n }, (_, i) => i).every(
      (i) => bits[i] != null && senderBases[i] != null && receiverBases[i] != null
    );

  const canSave = fieldsValid && manualComplete;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      bitAndBasemode: isRandom ? "random" : "manual",
      numBits: n,
      interceptProbability: interceptValue,
      maxQber: qberValue / 100,
      sacrificeRatio: sacrificeValue,
      
      SenderBits: isRandom ? (Array.from({ length: n}, randomBit)) : (bits.slice(0, n) as Bit[]),
      SenderBases: isRandom ? (Array.from({ length: n}, randomBasis)) : (senderBases.slice(0, n) as Basis[]),
      ReceiverBases: isRandom ? (Array.from({ length: n}, randomBasis)) : (receiverBases.slice(0, n) as Basis[]),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 id="setup-title" className={styles.heading}>
        <Bolt size={20} aria-hidden /> Setup
      </h2>

      <h3 className={styles.sectionTitle}>I. Configuration mode</h3>
      <div className={styles.modeFrame}>
        <label className={styles.modeCard}>
          <span className={styles.modeText}>
            <span className={styles.modeTitle}>Randomise bases</span>
            <span className={styles.hint}>
              {manualAllowed
                ? "Load a randomly generated set of bases"
                : `Manual entry is available up to ${MAX_MANUAL_BITS} bits`}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className={styles.switch}
            checked={isRandom}
            disabled={!manualAllowed}
            onChange={(e) => setWantsRandom(e.target.checked)}
          />
        </label>
      </div>

      <h3 className={styles.sectionTitle}>II. Configuration</h3>
      <div className={styles.configPanel}>
        <div className={styles.fields}>
          <Field label="Transmitted bits" hint="Total number of transmitted bits"
            value={numBits} onChange={setNumBits} min={1} max={MAX_BITS} step={1}
            invalid={!nValid} />
          <Field label="Eavesdropping probability" hint="Per-Photon possibility of being intercepted"
            value={intercept} onChange={setIntercept} min={0} max={1} step={0.01}
            invalid={!inRange(interceptValue, 0, 1)} />
          <Field label="Max QBER" hint="Security abort threshold in %"
            value={maxQber} onChange={setMaxQber} min={0} max={100} step={1}/>
          <Field label="Sacrifice ratio" hint="Per-Bit Probability of being publicly checked"
            value={sacrifice} onChange={setSacrifice} min={0} max={1} step={0.01}
            invalid={!inRange(sacrificeValue, 0, 1)} />
        </div>

        <div className={styles.basesSection}>
          <h4 className={styles.basesTitle}>
            Bits &amp; Bases
            <span className={isRandom ? styles.badgeRandom : styles.badgeManual}>
              {isRandom ? "Randomised" : "Manual"}
            </span>
          </h4>

          {isRandom ? (
            <p className={styles.hint}>
              Sender-Side Bits, Bases and Receiver-Side Bases are randomised
            </p>
          ) : (
            <ManualEntry
              count={n}
              bits={bits}
              senderBases={senderBases}
              receiverBases={receiverBases}
              onBits={patcher(setBits)}
              onSenderBases={patcher(setSenderBases)}
              onReceiverBases={patcher(setReceiverBases)}
            />
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={!canSave}>Save</Button>
        <Button variant="dangerBg" onClick={onClose}>Close</Button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string; hint: string; value: string; onChange: (v: string) => void;
  min: number; max: number; step: number; suffix?: string; invalid?: boolean;
};

function Field({ label, hint, value, onChange, min, max, step, suffix, invalid }: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.inputWrap}>
        <input
          className={styles.input}
          type="number"
          inputMode="decimal"
          value={value}
          min={min} max={max} step={step}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </span>
      <span className={styles.hint}>{hint}</span>
    </label>
  );
}