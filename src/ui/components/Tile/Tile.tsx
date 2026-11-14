import styles from "./Tile.module.css";

type TileProps = {
  label: string;
  value: string | undefined;
  tone?: "peach" | "peach-blackborder" | "grey" | "sky" | "red" | "green";
  swatch?: string;      
};

export function Tile({ label, value = "-", tone = "grey", swatch }: TileProps) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`}>
      <div className={styles.label}>
        {swatch && <span className={styles.swatch} style={{ background: swatch }} />}
        <span className={styles.labelText}>{label}</span>
      </div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}