"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Normalize any time string ("07:00", "07:00:00") to "HH:MM"
function normalizeTime(t) {
  return t.slice(0, 5);
}

// Build a unique key for a medication at a specific time
function medKey(medId, time) {
  return `${medId}_${normalizeTime(time)}`;
}

function getTimeBlock(time) {
  const hour = parseInt(time.split(":")[0]);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function formatTime(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour < 12 ? "AM" : "PM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function MedCard({ med, dependent, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
      style={{ borderLeft: `4px solid ${dependent.color}` }}
    >
      {/* Checkbox */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: checked ? dependent.color : "#CBD5E1",
          backgroundColor: checked ? dependent.color : "transparent",
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
          style={{ backgroundColor: dependent.color }}
        >
          {dependent.name}
        </span>
        <span className="text-xs text-slate-400">{formatTime(med.time)}</span>
      </div>
    </button>
  );
}

export default function TodayScreen() {
  const [meds, setMeds] = useState([]);
  const [dependents, setDependents] = useState({});
  const [checkedMap, setCheckedMap] = useState({});
  const [loading, setLoading] = useState(true);

  const householdKey = "demo";
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function loadData() {
      // Fetch dependents for this household
      const { data: deps } = await supabase
        .from("dependents")
        .select("*")
        .eq("household_key", householdKey);

      const depMap = {};
      for (const d of deps || []) {
        depMap[d.id] = d;
      }
      setDependents(depMap);

      // Fetch active medications with their dependents
      const { data: medications } = await supabase
        .from("medications")
        .select("*")
        .in("dependent_id", Object.keys(depMap))
        .eq("status", "active");

      // Flatten: one entry per medication per scheduled time
      const flatMeds = [];
      for (const med of medications || []) {
        for (const time of med.times || []) {
          flatMeds.push({ ...med, time, block: getTimeBlock(time) });
        }
      }
      // Sort by time
      flatMeds.sort((a, b) => a.time.localeCompare(b.time));
      setMeds(flatMeds);

      // Fetch today's med_logs to restore check state
      const medIds = flatMeds.map((m) => m.id);
      if (medIds.length > 0) {
        const { data: logs } = await supabase
          .from("med_logs")
          .select("*")
          .in("medication_id", medIds)
          .eq("date", todayStr)
          .eq("status", "taken");

        const checked = {};
        for (const log of logs || []) {
          const key = medKey(log.medication_id, log.time_scheduled);
          console.log("[LOAD] log key:", key, "| raw time_scheduled:", log.time_scheduled);
          checked[key] = true;
        }
        console.log("[LOAD] checkedMap:", JSON.stringify(checked));
        setCheckedMap(checked);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  async function toggle(med) {
    const key = medKey(med.id, med.time);
    const isChecked = !!checkedMap[key];

    // Optimistic update
    setCheckedMap((prev) => ({ ...prev, [key]: !isChecked }));

    if (!isChecked) {
      // Mark as taken — upsert a med_log row
      await supabase.from("med_logs").upsert(
        {
          medication_id: med.id,
          date: todayStr,
          time_scheduled: med.time,
          time_taken: new Date().toISOString(),
          status: "taken",
        },
        { onConflict: "medication_id,date,time_scheduled" }
      );
    } else {
      // Uncheck — set back to pending
      await supabase
        .from("med_logs")
        .update({ time_taken: null, status: "pending" })
        .eq("medication_id", med.id)
        .eq("date", todayStr)
        .eq("time_scheduled", med.time);
    }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const totalMeds = meds.length;
  const checkedCount = Object.values(checkedMap).filter(Boolean).length;
  const timeBlocks = [...new Set(meds.map((m) => m.block))];

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

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
      {timeBlocks.map((block) => {
        const blockMeds = meds.filter((m) => m.block === block);
        if (blockMeds.length === 0) return null;

        const blockChecked = blockMeds.filter((m) => checkedMap[medKey(m.id, m.time)]).length;

        return (
          <div key={block} className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{block}</h2>
              <span className="text-xs font-medium text-slate-400">
                {blockChecked}/{blockMeds.length} done
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {blockMeds.map((med) => {
                const key = medKey(med.id, med.time);
                console.log("[RENDER] med:", med.name, "| key:", key, "| found:", !!checkedMap[key]);
                return (
                  <MedCard
                    key={key}
                    med={med}
                    dependent={dependents[med.dependent_id]}
                    checked={!!checkedMap[key]}
                    onToggle={() => toggle(med)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
