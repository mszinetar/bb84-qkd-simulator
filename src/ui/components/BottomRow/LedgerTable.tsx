import type { ReactNode } from "react";
import type { Basis, TransmitRecord } from "../../../core/types";
import styles from "./BottomRow.module.css";
import { BadgePlus, BadgeX, } from "lucide-react";

const BASIS_SYMBOL: Record<Basis, ReactNode> = {
  rectilinear: <BadgePlus size={16} style={{display: "inline"}}/>,
  diagonal: <BadgeX size={16} style={{display: "inline"}}/>,
};

const COLUMNS = ["Seq", "Sent", "Sent Qubit & State", "Intercept",  "Received Qubit & State", "Received", "Status"];

type Props = {
  records: TransmitRecord[];
  showSifted: boolean; // false until the sifting stage, so "not sifted yet" isn't shown as "discarded"
};

export default function LedgerTable({ records, showSifted }: Props) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c} scope="col" className={(c === "Intercept") ? styles.Intercept : ""}>{c}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={COLUMNS.length}>
                No transmissions yet
              </td>
            </tr>
          ) : (
            records.map((r) => (
              <tr key={r.seqID} className={r.isSifted === undefined ? "" : r.isSifted ? "" : styles.rowGreyed}>
                <td className={styles.seq}>{r.seqID}</td>

                <td>
                    <div className={styles.bitAndBaseContainer} >
                        <span className={styles.bit}>{r.emittedBit}</span>
                        <span className={styles.basis}>{BASIS_SYMBOL[r.emittedBasis]}</span>
                    </div>
                  
                </td>

                <td>
                  <span className={styles.ref}>{r.emittedQubitRef}</span>
                  <span className={styles.ket}>{r.emittedState.ket}</span>
                </td>

                <td className={styles.intercept}>
                {r.interceptOptions === undefined ? (
                <span className={styles.muted}>-</span>
                ) : r.interceptOptions.isIntercept ? (
                <span className={styles.badgeWarn}>Intercepted</span>
                ) : (
                <span className={styles.badgeOk}>Untouched</span>
                )}
                </td>


                <td>
                  {r.receivedState ? (
                    <>
                      <span className={r.receivedQubitRef?.toString().split("-")[1] === "retrans" ? styles.refBad : styles.ref}>{r.receivedQubitRef}</span>
                      <span className={styles.ket}>{r.receivedState.ket}</span>
                    </>
                  ) : (
                    <span className={styles.muted}>-</span>
                  )}
                </td>

                <td>
                  {r.receivedBit != null && r.receivedBasis ? (
                    <div className={styles.bitAndBaseContainer} >
                      <span className={styles.basis}>{BASIS_SYMBOL[r.receivedBasis]}</span>
                      <span className={styles.bit}>{r.receivedBit}</span>
                    </div>
                  ) : (
                    <span className={styles.muted}>-</span>
                  )}
                </td>

                <td>
                  {!showSifted ? (
                    <span className={styles.muted}>-</span>
                  ) : r.isSifted ? (
                    <span className={styles.badgeOk}>Sifted</span>
                  ) : (
                    <span className={styles.badgeDanger}>Discarded</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}