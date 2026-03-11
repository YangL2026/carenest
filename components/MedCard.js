"use client";

import { useRef } from "react";
import { Check } from "lucide-react";

export default function MedCard({
  med,
  onToggle,
  onLongPressUncheck,
  canQuickUncheck,
  quiet = false,
}) {
  const holdTimerRef = useRef(null);
  const didLongPressRef = useRef(false);

  const startHold = () => {
    if (!med.checked || canQuickUncheck) return;

    didLongPressRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      onLongPressUncheck?.();
    }, 500);
  };

  const stopHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }

    if (!med.checked || canQuickUncheck) {
      onToggle?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      className={`w-full rounded-2xl border-l-4 p-4 text-left shadow-sm transition-all duration-200 ease-in-out ${
        med.checked ? "bg-slate-50" : "bg-white"
      } ${quiet ? "opacity-75" : "opacity-100"}`}
      style={{ borderLeftColor: med.dependentColor }}
    >
      <div className="flex min-h-[44px] items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ease-in-out ${
            med.checked ? "border-transparent" : "border-slate-300 bg-white"
          }`}
          style={med.checked ? { backgroundColor: med.dependentColor } : undefined}
          aria-hidden="true"
        >
          {med.checked ? <Check className="h-5 w-5 text-white" strokeWidth={2.5} /> : null}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-base font-semibold ${
              med.checked ? "text-slate-400 line-through" : "text-slate-800"
            }`}
          >
            {med.name}
          </p>
          <p className="text-sm text-slate-500">{med.detailLine}</p>
          {med.checked && med.givenAtLabel ? (
            <p className="text-xs text-slate-400">{med.givenAtLabel}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: med.dependentColor }}
          >
            {med.dependentName}
          </span>
          <span className="text-xs text-slate-400">{med.timeText}</span>
          {med.checked && !canQuickUncheck ? (
            <span className="text-xs text-slate-400">hold to uncheck</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
