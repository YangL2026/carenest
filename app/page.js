"use client";

import { useState } from "react";

const DEPENDENTS = {
  dad: { name: "Dad", color: "#3B82F6" },
  mom: { name: "Mom", color: "#22C55E" },
};

const MEDICATIONS = [
  { id: 1, dependent: "dad", name: "Lisinopril", dosage: "10mg", time: "07:00", block: "Morning" },
  { id: 2, dependent: "dad", name: "Metformin", dosage: "500mg", time: "07:00", block: "Morning" },
  { id: 3, dependent: "mom", name: "Amlodipine", dosage: "5mg", time: "08:00", block: "Morning" },
  { id: 4, dependent: "mom", name: "Levothyroxine", dosage: "50mcg", time: "08:00", block: "Morning" },
  { id: 5, dependent: "dad", name: "Warfarin", dosage: "5mg", time: "18:00", block: "Evening" },
];

const TIME_BLOCKS = ["Morning", "Evening"];

function MedCard({ med, checked, onToggle }) {
  const dep = DEPENDENTS[med.dependent];

  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
      style={{ borderLeft: `4px solid ${dep.color}` }}
    >
      {/* Checkbox */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: checked ? dep.color : "#CBD5E1",
          backgroundColor: checked ? dep.color : "transparent",
        }}
      >
        {checked && (
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Med info */}
      <div className="flex flex-col items-start">
        <span className={`text-base font-semibold ${checked ? "line-through text-slate-400" : "text-slate-800"}`}>
          {med.name}
        </span>
        <span className="text-sm text-slate-500">{med.dosage}</span>
      </div>

      {/* Dependent badge + time */}
      <div className="ml-auto flex flex-col items-end gap-1">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: dep.color }}
        >
          {dep.name}
        </span>
        <span className="text-xs text-slate-400">
          {med.time.startsWith("0") ? med.time.slice(1) : med.time}
          {parseInt(med.time) < 12 ? " AM" : " PM"}
        </span>
      </div>
    </button>
  );
}

export default function TodayScreen() {
  const [checked, setChecked] = useState({});

  const toggle = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const totalMeds = MEDICATIONS.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Today</h1>
        <p className="text-sm text-slate-500">{today}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            {checkedCount} of {totalMeds} medications
          </span>
          <span className="text-sm font-medium text-slate-600">
            {totalMeds > 0 ? Math.round((checkedCount / totalMeds) * 100) : 0}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${totalMeds > 0 ? (checkedCount / totalMeds) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Time blocks */}
      {TIME_BLOCKS.map((block) => {
        const blockMeds = MEDICATIONS.filter((m) => m.block === block);
        if (blockMeds.length === 0) return null;

        const blockChecked = blockMeds.filter((m) => checked[m.id]).length;

        return (
          <div key={block} className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{block}</h2>
              <span className="text-xs font-medium text-slate-400">
                {blockChecked}/{blockMeds.length} done
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {blockMeds.map((med) => (
                <MedCard
                  key={med.id}
                  med={med}
                  checked={!!checked[med.id]}
                  onToggle={() => toggle(med.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
