"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

function normalizeTime(t) {
  return t.slice(0, 5);
}

function medKey(medId, time) {
  return `${medId}_${normalizeTime(time)}`;
}

export default function DebugPage() {
  const [data, setData] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function load() {
      const { data: deps } = await supabase
        .from("dependents")
        .select("*")
        .eq("household_key", "demo");

      const depMap = {};
      for (const d of deps || []) depMap[d.id] = d;

      const { data: meds } = await supabase
        .from("medications")
        .select("*")
        .in("dependent_id", Object.keys(depMap))
        .eq("status", "active");

      const { data: logs } = await supabase
        .from("med_logs")
        .select("*")
        .eq("date", todayStr);

      // Build keys the same way page.js does
      const medKeys = [];
      for (const med of meds || []) {
        for (const time of med.times || []) {
          medKeys.push({
            name: med.name,
            dependent: depMap[med.dependent_id]?.name,
            rawTime: time,
            key: medKey(med.id, time),
          });
        }
      }

      const logKeys = (logs || []).map((log) => ({
        medicationId: log.medication_id,
        rawTimeScheduled: log.time_scheduled,
        status: log.status,
        key: medKey(log.medication_id, log.time_scheduled),
      }));

      // Check matches
      const logKeySet = new Set(logKeys.map((l) => l.key));
      const medKeySet = new Set(medKeys.map((m) => m.key));

      setData({ deps, meds, logs, medKeys, logKeys, logKeySet, medKeySet });
    }
    load();
  }, []);

  if (!data) return <div className="p-8">Loading debug data...</div>;

  const { medKeys, logKeys, logKeySet, medKeySet } = data;

  return (
    <div className="mx-auto max-w-3xl p-8 font-mono text-sm">
      <h1 className="mb-6 text-xl font-bold">Debug: Key Comparison</h1>
      <p className="mb-4">Today: {todayStr}</p>

      <h2 className="mb-2 mt-6 text-lg font-bold">Medication Keys (from page render)</h2>
      <table className="mb-6 w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Med</th>
            <th className="p-2 text-left">Person</th>
            <th className="p-2 text-left">Raw Time</th>
            <th className="p-2 text-left">Key</th>
            <th className="p-2 text-left">Has Log?</th>
          </tr>
        </thead>
        <tbody>
          {medKeys.map((m, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{m.name}</td>
              <td className="p-2">{m.dependent}</td>
              <td className="p-2">{JSON.stringify(m.rawTime)}</td>
              <td className="p-2 break-all">{m.key}</td>
              <td className="p-2" style={{ color: logKeySet.has(m.key) ? "green" : "red" }}>
                {logKeySet.has(m.key) ? "YES" : "NO"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-2 mt-6 text-lg font-bold">Med Log Keys (from Supabase)</h2>
      <table className="mb-6 w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Raw time_scheduled</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Key</th>
            <th className="p-2 text-left">Has Med?</th>
          </tr>
        </thead>
        <tbody>
          {logKeys.length === 0 ? (
            <tr><td colSpan={4} className="p-2 text-slate-400">No med_logs for today</td></tr>
          ) : (
            logKeys.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{JSON.stringify(l.rawTimeScheduled)}</td>
                <td className="p-2">{l.status}</td>
                <td className="p-2 break-all">{l.key}</td>
                <td className="p-2" style={{ color: medKeySet.has(l.key) ? "green" : "red" }}>
                  {medKeySet.has(l.key) ? "YES" : "NO"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 className="mb-2 mt-6 text-lg font-bold">Raw Data</h2>
      <details className="mb-4">
        <summary className="cursor-pointer font-bold">med_logs ({data.logs?.length})</summary>
        <pre className="mt-2 overflow-auto rounded bg-slate-100 p-4">{JSON.stringify(data.logs, null, 2)}</pre>
      </details>
      <details className="mb-4">
        <summary className="cursor-pointer font-bold">medications ({data.meds?.length})</summary>
        <pre className="mt-2 overflow-auto rounded bg-slate-100 p-4">{JSON.stringify(data.meds, null, 2)}</pre>
      </details>
      <details>
        <summary className="cursor-pointer font-bold">dependents ({data.deps?.length})</summary>
        <pre className="mt-2 overflow-auto rounded bg-slate-100 p-4">{JSON.stringify(data.deps, null, 2)}</pre>
      </details>
    </div>
  );
}
