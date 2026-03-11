import MedCard from "@/components/MedCard";
import { getTimeRangeLabel } from "@/lib/time-utils";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function TimeBlock({
  title,
  medications,
  onToggleMedication,
  onHoldUncheck,
  nowMs = 0,
  quiet = false,
}) {
  const doneCount = medications.filter((med) => med.checked).length;

  const orderedMeds = [...medications].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    if (a.checked && b.checked) {
      return new Date(a.checkedAt || 0).getTime() - new Date(b.checkedAt || 0).getTime();
    }
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  return (
    <section className={quiet ? "opacity-75" : ""}>
      <div className="mb-3 mt-6 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">{getTimeRangeLabel(title)}</p>
        </div>
        <p className="text-sm font-normal text-slate-400">
          {doneCount}/{medications.length} done
        </p>
      </div>

      <div className="space-y-3">
        {orderedMeds.map((med) => {
          const canQuickUncheck = med.checkedAt
            ? nowMs - new Date(med.checkedAt).getTime() <= FIVE_MINUTES_MS
            : false;

          return (
            <MedCard
              key={med.itemKey}
              med={med}
              canQuickUncheck={canQuickUncheck}
              quiet={quiet}
              onToggle={() => onToggleMedication?.(med)}
              onLongPressUncheck={() => onHoldUncheck?.(med)}
            />
          );
        })}
      </div>
    </section>
  );
}
