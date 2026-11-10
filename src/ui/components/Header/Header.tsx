import styles from "./Header.module.css";
import { AsteriskIcon } from "lucide-react";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          <AsteriskIcon size={18} />
        </span>
        <span className={styles.title}>BB84 Quantum Key Distribution Simulator</span>
      </div>

      <nav className={styles.links} aria-label="Primary">
        <a href="/docs" className={styles.link}>Docs</a>
        <img src="/github-svgrepo-com.svg" alt="github icon" />
      </nav>
    </header>
  );
}