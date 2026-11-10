import { useEffect, useRef } from "react";
import type { SimulatorConfig } from "../../config/simulatorConfig";
import SetupForm from "./SetupForm";
import styles from "./SetupDialog.module.css";

type SetupDialogProps = {
  open: boolean;
  onSave: (config: SimulatorConfig) => void;
  onClose: () => void;
};

export default function SetupDialog({ open, onSave, onClose }: SetupDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="setup-title"
      onClose={onClose} 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); 
      }}
    >
      {open && <SetupForm onSave={onSave} onClose={onClose} />}
    </dialog>
  );
}