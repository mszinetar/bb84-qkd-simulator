import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "danger" | "dangerBg";
  icon?: ReactNode;   
};

export function Button({
  variant = "primary",
  icon,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
      {icon}
    </button>
  );
}