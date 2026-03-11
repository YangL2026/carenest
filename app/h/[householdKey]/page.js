"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarPlus,
  ChevronDown,
  ClipboardList,
  Pill,
  Plus,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TaskCard from "@/components/TaskCard";
import TimeBlock from "@/components/TimeBlock";
import { supabase } from "@/lib/supabase";
import {
  TIME_BLOCKS,
  dateToIsoLocal,
  formatTimeLabel,
  getTimeBlock,
  hoursAgoText,
  normalizeTime,
  toTimeString,
} from "@/lib/time-utils";

const PROCEDURE_WINDOW_HOURS = 7 * 24;

function medicationLogKey(medicationId, scheduledTime) {
  return `${medicationId}::${scheduledTime ?? "none"}`;
}

function getDeadlineUrgency(task, now = new Date()) {
  if (task.status === "completed") return "completed";
  if (!task.deadline_date) return "active";

  const deadlineDate = new Date(`${task.deadline_date}T23:59:59`);
  const msUntilDeadline = deadlineDate.getTime() - now.getTime();

  if (msUntilDeadline < 0) return "overdue";

  const warningDays = task.warning_days ?? 2;
  if (msUntilDeadline <= warningDays * 24 * 60 * 60 * 1000) return "approaching";

  return "active";
}

function formatDeadline(task) {
  if (!task.deadline_date) return "";

  const date = new Date(`${task.deadline_date}T00:00:00`);
  return `by ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

function formatProcedureCountdown(hoursUntil) {
  if (hoursUntil < 24) {
    const roundedHours = Math.max(1, Math.round(hoursUntil));
    return `in ${roundedHours} hours`;
  }

  const roundedDays = Math.round(hoursUntil / 24);
  return `in ${roundedDays} day${roundedDays === 1 ? "" : "s"}`;
}

function buildProcedureAlert(procedures, dependentMap, now = new Date()) {
  for (const procedure of procedures) {
    const dependent = dependentMap[procedure.dependent_id];
    if (!dependent) continue;

    const procedureDate = new Date(procedure.procedure_datetime);
    const hoursUntil = (procedureDate.getTime() - now.getTime()) / (60 * 60 * 1000);

    if (procedure.status === "prep_active") {
      return {
        id: procedure.id,
        dependentName: dependent.name,
        procedureName: procedure.name,
        text: `${dependent.name} - ${procedure.name} ${formatProcedureCountdown(hoursUntil)}`,
      };
    }

    if (procedure.status === "upcoming" && hoursUntil >= 0 && hoursUntil <= PROCEDURE_WINDOW_HOURS) {
      return {
        id: procedure.id,
        dependentName: dependent.name,
        procedureName: procedure.name,
        text: `${dependent.name} - ${procedure.name} ${formatProcedureCountdown(hoursUntil)}`,
      };
    }
  }

  return null;
}

export default function TodayPage({ params }) {
  const { householdKey } = use(params);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [medications, setMedications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [procedureAlert, setProcedureAlert] = useState(null);
  const [asNeededLines, setAsNeededLines] = useState([]);

  const [hasDependents, setHasDependents] = useState(true);
  const [overdueExpanded, setOverdueExpanded] = useState(false);
  const [laterExpanded, setLaterExpanded] = useState({});
  const [fabOpen, setFabOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [nowMs, setNowMs] = useState(0);

  const todayDateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const syncNow = () => setNowMs(new Date().getTime());
    syncNow();

    const timer = setInterval(syncNow, 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      const now = new Date();
      const todayIso = dateToIsoLocal(now);

      if (!silent) setLoading(true);
      setLoadError("");

      try {
        const { data: dependentRows, error: dependentsError } = await supabase
          .from("dependents")
          .select("id, name, color, household_key")
          .eq("household_key", householdKey)
          .order("created_at", { ascending: true });

        if (dependentsError) throw dependentsError;

        const dependentMap = Object.fromEntries((dependentRows || []).map((dep) => [dep.id, dep]));
        const dependentIds = (dependentRows || []).map((dep) => dep.id);

        if (dependentIds.length === 0) {
          setHasDependents(false);
          setMedications([]);
          setTasks([]);
          setOverdueItems([]);
          setProcedureAlert(null);
          setAsNeededLines([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        setHasDependents(true);

        const [medicationsResult, tasksResult, proceduresResult] = await Promise.all([
          supabase
            .from("medications")
            .select("*")
            .in("dependent_id", dependentIds)
            .eq("status", "active"),
          supabase
            .from("tasks")
            .select("*")
            .eq("household_key", householdKey)
            .in("status", ["pending", "completed", "expired"])
            .order("created_at", { ascending: true }),
          supabase
            .from("procedures")
            .select("*")
            .in("dependent_id", dependentIds)
            .in("status", ["prep_active", "upcoming"])
            .order("procedure_datetime", { ascending: true }),
        ]);

        if (medicationsResult.error) throw medicationsResult.error;
        if (tasksResult.error) throw tasksResult.error;
        if (proceduresResult.error) throw proceduresResult.error;

        const medicationRows = medicationsResult.data || [];
        const taskRows = tasksResult.data || [];
        const procedureRows = proceduresResult.data || [];
        const medicationIds = medicationRows.map((med) => med.id);

        let todayLogRows = [];
        let recentTakenRows = [];
        let overdueLogRows = [];

        if (medicationIds.length > 0) {
          const [todayLogsResult, recentTakenResult, overdueLogsResult] = await Promise.all([
            supabase
              .from("med_logs")
              .select("*")
              .in("medication_id", medicationIds)
              .eq("date", todayIso),
            supabase
              .from("med_logs")
              .select("*")
              .in("medication_id", medicationIds)
              .in("status", ["taken", "taken_late"])
              .not("time_taken", "is", null)
              .order("time_taken", { ascending: false })
              .limit(500),
            supabase
              .from("med_logs")
              .select("*")
              .in("medication_id", medicationIds)
              .lt("date", todayIso)
              .eq("status", "pending")
              .order("date", { ascending: false }),
          ]);

          if (todayLogsResult.error) throw todayLogsResult.error;
          if (recentTakenResult.error) throw recentTakenResult.error;
          if (overdueLogsResult.error) throw overdueLogsResult.error;

          todayLogRows = todayLogsResult.data || [];
          recentTakenRows = recentTakenResult.data || [];
          overdueLogRows = overdueLogsResult.data || [];
        }

        const todayLogMap = new Map();
        for (const log of todayLogRows) {
          const scheduledTime = log.time_scheduled ? normalizeTime(log.time_scheduled) : "none";
          todayLogMap.set(medicationLogKey(log.medication_id, scheduledTime), log);
        }

        const latestTakenByMedication = new Map();
        for (const log of recentTakenRows) {
          if (!latestTakenByMedication.has(log.medication_id)) {
            latestTakenByMedication.set(log.medication_id, log);
          }
        }

        const medicationById = Object.fromEntries(medicationRows.map((med) => [med.id, med]));

        const medicationCards = [];
        const asNeededContextLines = [];

        for (const med of medicationRows) {
          const dependent = dependentMap[med.dependent_id];
          if (!dependent) continue;

          if (med.timing_type === "clock") {
            for (const rawTime of med.times || []) {
              const scheduledTime = normalizeTime(rawTime);
              const key = medicationLogKey(med.id, scheduledTime);
              const todayLog = todayLogMap.get(key);
              const isChecked = todayLog
                ? ["taken", "taken_late"].includes(todayLog.status)
                : false;

              medicationCards.push({
                itemKey: key,
                medicationId: med.id,
                dependentId: med.dependent_id,
                name: med.name,
                dosage: med.dosage || "",
                detailLine: med.dosage || "No dosage listed",
                dependentName: dependent.name,
                dependentColor: dependent.color,
                timingType: "clock",
                intervalHours: null,
                scheduledTime,
                timeText: formatTimeLabel(scheduledTime),
                block: getTimeBlock(scheduledTime),
                checked: isChecked,
                checkedAt: isChecked ? todayLog.time_taken : null,
                givenAtLabel:
                  isChecked && todayLog.time_taken
                    ? `given at ${formatTimeLabel(toTimeString(new Date(todayLog.time_taken)))}`
                    : "",
              });
            }
            continue;
          }

          if (med.timing_type === "interval") {
            const intervalHours = med.interval_hours || 0;
            const latestTaken = latestTakenByMedication.get(med.id);

            let dueAt = now;
            if (latestTaken?.time_taken && intervalHours > 0) {
              dueAt = new Date(
                new Date(latestTaken.time_taken).getTime() + intervalHours * 60 * 60 * 1000
              );
            }

            const scheduledTime = toTimeString(dueAt);
            const key = medicationLogKey(med.id, scheduledTime);
            const todayLog = todayLogMap.get(key);
            const isChecked = todayLog
              ? ["taken", "taken_late"].includes(todayLog.status)
              : false;

            const dueLabel = intervalHours
              ? `due by ${formatTimeLabel(scheduledTime)} (${intervalHours}hrs since last dose)`
              : "due now";

            medicationCards.push({
              itemKey: key,
              medicationId: med.id,
              dependentId: med.dependent_id,
              name: med.name,
              dosage: med.dosage || "",
              detailLine: med.dosage ? `${med.dosage} · ${dueLabel}` : dueLabel,
              dependentName: dependent.name,
              dependentColor: dependent.color,
              timingType: "interval",
              intervalHours,
              scheduledTime,
              timeText: `Due ${formatTimeLabel(scheduledTime)}`,
              block: getTimeBlock(scheduledTime),
              checked: isChecked,
              checkedAt: isChecked ? todayLog.time_taken : null,
              givenAtLabel:
                isChecked && todayLog.time_taken
                  ? `given at ${formatTimeLabel(toTimeString(new Date(todayLog.time_taken)))}`
                  : "",
            });
            continue;
          }

          if (med.timing_type === "as_needed") {
            const latestTaken = latestTakenByMedication.get(med.id);
            if (!latestTaken?.time_taken) continue;

            const intervalHours = med.interval_hours || 0;
            const nextOkAt = new Date(
              new Date(latestTaken.time_taken).getTime() + intervalHours * 60 * 60 * 1000
            );

            if (nextOkAt <= now) continue;

            asNeededContextLines.push({
              id: `${med.id}-${latestTaken.id}`,
              dependentName: dependent.name,
              dependentColor: dependent.color,
              text: `${med.name} given ${hoursAgoText(
                latestTaken.time_taken,
                now
              )} · next OK after ${formatTimeLabel(toTimeString(nextOkAt))}`,
            });
          }
        }

        const overdueCards = overdueLogRows
          .map((log) => {
            const med = medicationById[log.medication_id];
            const dependent = dependentMap[log.dependent_id];
            if (!med || !dependent) return null;

            const timeText = log.time_scheduled
              ? formatTimeLabel(normalizeTime(log.time_scheduled))
              : "as needed";

            return {
              id: log.id,
              medicationId: log.medication_id,
              scheduledTime: log.time_scheduled ? normalizeTime(log.time_scheduled) : null,
              medName: med.name,
              dependentName: dependent.name,
              dependentColor: dependent.color,
              dateLabel: new Date(`${log.date}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
              timeText,
            };
          })
          .filter(Boolean);

        const taskCards = taskRows.map((task) => {
          const dependent = task.dependent_id ? dependentMap[task.dependent_id] : null;

          return {
            id: task.id,
            title: task.title,
            taskType: task.task_type,
            dependentName: dependent?.name || "",
            dependentColor: dependent?.color || "#94A3B8",
            deadlineLabel: formatDeadline(task),
            urgency: getDeadlineUrgency(task, now),
            checked: task.status === "completed",
            status: task.status,
          };
        });

        setMedications(medicationCards);
        setTasks(taskCards);
        setOverdueItems(overdueCards);
        setProcedureAlert(buildProcedureAlert(procedureRows, dependentMap, now));
        setAsNeededLines(asNeededContextLines);
      } catch (error) {
        setLoadError(error.message || "Could not load today data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [householdKey]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedMedications = useMemo(() => {
    const grouped = { Morning: [], Afternoon: [], Evening: [] };

    for (const med of medications) {
      if (!grouped[med.block]) grouped[med.block] = [];
      grouped[med.block].push(med);
    }

    return grouped;
  }, [medications]);

  const rightNowBlock = useMemo(() => {
    const available = TIME_BLOCKS.filter((block) => (groupedMedications[block] || []).length > 0);
    if (available.length === 0) return null;

    const nowBlock = getTimeBlock(toTimeString(new Date()));
    const currentIndex = TIME_BLOCKS.indexOf(nowBlock);

    for (let index = currentIndex; index >= 0; index -= 1) {
      const block = TIME_BLOCKS[index];
      if ((groupedMedications[block] || []).length > 0) return block;
    }

    return available[0];
  }, [groupedMedications]);

  const laterBlocks = useMemo(() => {
    if (!rightNowBlock) return [];
    const currentIndex = TIME_BLOCKS.indexOf(rightNowBlock);

    return TIME_BLOCKS.filter(
      (block, index) => index > currentIndex && (groupedMedications[block] || []).length > 0
    );
  }, [groupedMedications, rightNowBlock]);

  const orderedTasks = useMemo(() => {
    const urgencyWeight = { overdue: 0, approaching: 1, active: 2, completed: 3 };

    return [...tasks].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
    });
  }, [tasks]);

  const handleToggleMedication = async (medicationCard) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayIso = dateToIsoLocal(now);
    const isChecking = !medicationCard.checked;

    let snapshot = [];

    setMedications((prev) => {
      snapshot = prev;

      if (isChecking && medicationCard.timingType === "interval" && medicationCard.intervalHours > 0) {
        const nextDueAt = new Date(now.getTime() + medicationCard.intervalHours * 60 * 60 * 1000);
        const nextScheduledTime = toTimeString(nextDueAt);
        const nextKey = medicationLogKey(medicationCard.medicationId, nextScheduledTime);
        const nextDueLabel = `due by ${formatTimeLabel(nextScheduledTime)} (${medicationCard.intervalHours}hrs since last dose)`;

        const nextCard = {
          ...medicationCard,
          itemKey: nextKey,
          scheduledTime: nextScheduledTime,
          block: getTimeBlock(nextScheduledTime),
          detailLine: medicationCard.dosage
            ? `${medicationCard.dosage} · ${nextDueLabel}`
            : nextDueLabel,
          timeText: `Due ${formatTimeLabel(nextScheduledTime)}`,
          checked: false,
          checkedAt: null,
          givenAtLabel: "",
        };

        const withoutCurrent = prev.filter((med) => med.itemKey !== medicationCard.itemKey);
        const withoutDuplicate = withoutCurrent.filter((med) => med.itemKey !== nextKey);

        return [...withoutDuplicate, nextCard];
      }

      return prev.map((med) => {
        if (med.itemKey !== medicationCard.itemKey) return med;

        if (isChecking) {
          return {
            ...med,
            checked: true,
            checkedAt: nowIso,
            givenAtLabel: `given at ${formatTimeLabel(toTimeString(now))}`,
          };
        }

        return {
          ...med,
          checked: false,
          checkedAt: null,
          givenAtLabel: "",
        };
      });
    });

    try {
      if (isChecking) {
        const { error } = await supabase.from("med_logs").upsert(
          {
            medication_id: medicationCard.medicationId,
            dependent_id: medicationCard.dependentId,
            date: todayIso,
            time_scheduled: medicationCard.scheduledTime,
            time_taken: nowIso,
            status: "taken",
          },
          { onConflict: "medication_id,date,time_scheduled" }
        );

        if (error) throw error;
      } else {
        let updateQuery = supabase
          .from("med_logs")
          .update({ status: "pending", time_taken: null })
          .eq("medication_id", medicationCard.medicationId)
          .eq("date", todayIso);

        if (medicationCard.scheduledTime) {
          updateQuery = updateQuery.eq("time_scheduled", medicationCard.scheduledTime);
        } else {
          updateQuery = updateQuery.is("time_scheduled", null);
        }

        const { error } = await updateQuery;
        if (error) throw error;
      }
    } catch {
      setMedications(snapshot);
      setToast("Could not save medication update. Reverted.");
    }
  };

  const handleLongPressUncheck = (medicationCard) => {
    if (window.confirm("Unmark as taken?")) {
      handleToggleMedication(medicationCard);
    }
  };

  const handleResolveOverdue = async (item, status) => {
    let snapshot = [];

    setOverdueItems((prev) => {
      snapshot = prev;
      return prev.filter((entry) => entry.id !== item.id);
    });

    const payload =
      status === "taken_late"
        ? { status: "taken_late", time_taken: new Date().toISOString() }
        : { status: "missed" };

    const { error } = await supabase.from("med_logs").update(payload).eq("id", item.id);

    if (error) {
      setOverdueItems(snapshot);
      setToast("Could not update overdue item.");
    }
  };

  const handleToggleTask = async (task) => {
    const nextChecked = !task.checked;

    let snapshot = [];

    setTasks((prev) => {
      snapshot = prev;
      return prev.map((entry) =>
        entry.id === task.id
          ? {
              ...entry,
              checked: nextChecked,
              status: nextChecked ? "completed" : "pending",
              urgency: nextChecked ? "completed" : entry.urgency,
            }
          : entry
      );
    });

    const payload = nextChecked
      ? { status: "completed", completed_at: new Date().toISOString() }
      : { status: "pending", completed_at: null };

    const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);

    if (error) {
      setTasks(snapshot);
      setToast("Could not save task update.");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-28">
        <main className="mx-auto max-w-lg px-4 py-6">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-5 w-48 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </main>
        <BottomNav householdKey={householdKey} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <main className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Today</h1>
            <p className="text-sm text-slate-500">{todayDateLabel}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-100"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {loadError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        {!hasDependents ? (
          <div className="rounded-2xl bg-white p-4 text-slate-500 shadow-sm">
            Welcome to CareNest. Tap + to add your first person.
          </div>
        ) : (
          <>
            {overdueItems.length > 0 ? (
              <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <button
                  type="button"
                  onClick={() => setOverdueExpanded((prev) => !prev)}
                  className="flex w-full min-h-[44px] items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" strokeWidth={2} />
                    <p className="text-red-700">
                      Yesterday - {overdueItems.length} meds not checked off
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-red-500 transition-all duration-200 ease-in-out ${
                      overdueExpanded ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    overdueExpanded ? "max-h-[600px] pt-3" : "max-h-0"
                  }`}
                >
                  <div className="space-y-2">
                    {overdueItems.map((item) => (
                      <div key={item.id} className="rounded-xl bg-white/70 p-3">
                        <p className="text-sm font-medium text-red-700">
                          {item.dependentName} - {item.medName}
                        </p>
                        <p className="text-xs text-red-500">
                          {item.dateLabel} at {item.timeText}
                        </p>
                        <div className="mt-2 flex gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => handleResolveOverdue(item, "taken_late")}
                            className="min-h-[44px] text-red-600 underline"
                          >
                            Taken late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveOverdue(item, "missed")}
                            className="min-h-[44px] text-red-600 underline"
                          >
                            Missed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {procedureAlert ? (
              <section className="mb-4">
                <Link
                  href={`/h/${householdKey}/procedure/${procedureAlert.id}`}
                  className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-all duration-200 ease-in-out hover:bg-amber-100"
                >
                  <div className="flex items-start gap-3">
                    <CalendarPlus className="h-5 w-5 shrink-0 text-amber-500" strokeWidth={2} />
                    <div>
                      <p className="text-base font-semibold text-amber-800">{procedureAlert.text}</p>
                      <p className="text-sm text-amber-600">Prep checklist active - tap to view</p>
                    </div>
                  </div>
                </Link>
              </section>
            ) : null}

            {rightNowBlock ? (
              <section>
                <TimeBlock
                  title={rightNowBlock}
                  medications={groupedMedications[rightNowBlock]}
                  onToggleMedication={handleToggleMedication}
                  onHoldUncheck={handleLongPressUncheck}
                  nowMs={nowMs}
                />
              </section>
            ) : null}

            {asNeededLines.length > 0 ? (
              <section className="mt-3 space-y-2">
                {asNeededLines.map((line) => (
                  <div key={line.id} className="flex items-start gap-2 text-sm text-slate-400">
                    <span
                      className="mt-1 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: line.dependentColor }}
                      aria-hidden="true"
                    />
                    <p>
                      {line.dependentName} - {line.text}
                    </p>
                  </div>
                ))}
              </section>
            ) : null}

            {orderedTasks.length > 0 ? (
              <section>
                <div className="mb-3 mt-6 flex items-end justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Today&apos;s Plan</h2>
                  <p className="text-sm font-normal text-slate-400">
                    {orderedTasks.filter((task) => task.checked).length}/{orderedTasks.length} done
                  </p>
                </div>
                <div className="space-y-3">
                  {orderedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={() => handleToggleTask(task)} />
                  ))}
                </div>
              </section>
            ) : null}

            {laterBlocks.length > 0 ? (
              <section className="mt-6">
                <h2 className="text-lg font-bold text-slate-800">Later Today</h2>
                <div className="mt-2 space-y-2">
                  {laterBlocks.map((block) => {
                    const isExpanded = !!laterExpanded[block];
                    const medsInBlock = groupedMedications[block];
                    const medCountLabel = `${medsInBlock.length} medication${
                      medsInBlock.length === 1 ? "" : "s"
                    }`;

                    return (
                      <div key={block} className="rounded-2xl bg-white/80 p-3 shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setLaterExpanded((prev) => ({
                              ...prev,
                              [block]: !prev[block],
                            }))
                          }
                          className="flex w-full min-h-[44px] items-center justify-between py-3"
                        >
                          <p className="text-base font-medium text-slate-400">
                            {block} - {medCountLabel}
                          </p>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 transition-all duration-200 ease-in-out ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            strokeWidth={2}
                          />
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? "max-h-[1000px]" : "max-h-0"
                          }`}
                        >
                          {isExpanded ? (
                            <TimeBlock
                              title={block}
                              medications={medsInBlock}
                              onToggleMedication={handleToggleMedication}
                              onHoldUncheck={handleLongPressUncheck}
                              nowMs={nowMs}
                              quiet
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>

      <div className="fixed bottom-20 right-4 z-40">
        {fabOpen ? (
          <div className="absolute bottom-16 right-0 mb-2 w-56 rounded-2xl bg-white p-2 shadow-xl transition-all duration-200 ease-in-out">
            <Link
              href={`/h/${householdKey}/add-med`}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50"
              onClick={() => setFabOpen(false)}
            >
              <Pill className="h-5 w-5 text-slate-500" strokeWidth={2} />
              <span>Add medication</span>
            </Link>
            <Link
              href={`/h/${householdKey}/add-task`}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50"
              onClick={() => setFabOpen(false)}
            >
              <ClipboardList className="h-5 w-5 text-slate-500" strokeWidth={2} />
              <span>Add task</span>
            </Link>
            <Link
              href={`/h/${householdKey}/procedure/new`}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50"
              onClick={() => setFabOpen(false)}
            >
              <CalendarPlus className="h-5 w-5 text-slate-500" strokeWidth={2} />
              <span>Add procedure</span>
            </Link>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setFabOpen((prev) => !prev)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-105 hover:bg-blue-700"
          aria-expanded={fabOpen}
          aria-label="Open quick add menu"
        >
          <Plus className="h-7 w-7" strokeWidth={2} />
        </button>
      </div>

      <BottomNav householdKey={householdKey} />

      {toast ? (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-lg rounded-xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
