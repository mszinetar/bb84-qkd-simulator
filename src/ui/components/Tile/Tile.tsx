import styles from "./Tile.module.css";

type TileProps = {
  label: string;
  value: string | undefined;
  tone?: "peach" | "grey" | "sky";
  swatch?: string;      
};

export function Tile({ label, value = "-", tone = "grey", swatch }: TileProps) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`}>
      <div className={styles.label}>
        {swatch && <span className={styles.swatch} style={{ background: swatch }} />}
        {label}
      </div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}