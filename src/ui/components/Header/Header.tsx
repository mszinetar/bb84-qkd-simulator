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
        <a href="https://github.com/mszinetar/bb84-qkd-simulator">
          <img src="/github-svgrepo-com.svg" alt="github icon" />
        </a>
      </nav>
    </header>
  );
}