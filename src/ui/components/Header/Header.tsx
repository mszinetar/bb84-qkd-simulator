import styles from "./Header.module.css";
import { AsteriskIcon } from "lucide-react";
import { GitHubIcon } from "../../../assets/GithubIcon";

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
        <a
          href="https://github.com/mszinetar/bb84-qkd-simulator"
          aria-label="GitHub repository"
        >
          <GitHubIcon />
        </a>
      </nav>
    </header>
  );
}