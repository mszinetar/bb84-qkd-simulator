import { type ReactNode } from "react";
import styles from "./Panel.module.css";

type PanelProps = {
    title: string;
    shadow?: boolean;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
};

export function Panel({ title, shadow, icon, action, className = "", children }: PanelProps) {
    return (
        <section className={`${styles.panel} ${className} ${shadow && styles.shadow}`}>
            <header className={styles.header}>
                <h2 className={styles.title}>

                {icon}
                {title}
                </h2>
                {action}
            </header>
            {children}
        </section>
    );
}