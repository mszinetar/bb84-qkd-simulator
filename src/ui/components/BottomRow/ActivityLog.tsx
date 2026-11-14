import { useEffect, useRef } from "react";
import { Panel } from "../Panel/Panel";
import { Tile } from "../Tile/Tile";
import { type LogEntry } from "../../config/simulatorConfig";
import { Activity } from "lucide-react";

type ActivityLogProps = {
  logs: LogEntry[];
};

export default function ActivityLog({ logs }: ActivityLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const start = el.scrollTop;
    const target = el.scrollHeight - el.clientHeight;
    const distance = target - start;
    if (distance <= 0) return;

    const duration = 600; 
    let startTime: number | null = null;
    let frameId: number;

    const step = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 3);
      el.scrollTop = start + distance * ease;

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [logs.length]);

  return (
    <Panel title="Activity Log" icon={<Activity />}>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          overflowY: "auto",
          maxHeight: "200px",
          whiteSpace: "pre-line"
        }}
      >
        {logs.map((l, idx) => (
          <Tile key={idx} label={l.title} value={l.message} tone={l.type} />
        ))}
      </div>
    </Panel>
  );
}