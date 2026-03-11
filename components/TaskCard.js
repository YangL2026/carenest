"use client";

import { CalendarClock, Car, Check, ClipboardList, Phone, Pill, TestTube } from "lucide-react";

const taskIcons = {
  phone_call: Phone,
  errand: Car,
  pharmacy_pickup: Pill,
  blood_work: TestTube,
  appointment: CalendarClock,
};

function getUrgencyClasses(task) {
  if (task.checked) return "bg-slate-50";
  if (task.urgency === "overdue") return "border border-red-200 bg-red-50";
  if (task.urgency === "approaching") return "border border-amber-200 bg-amber-50";
  return "bg-white";
}

export default function TaskCard({ task, onToggle }) {
  const Icon = taskIcons[task.taskType] || ClipboardList;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-2xl p-4 text-left shadow-sm transition-all duration-200 ease-in-out ${getUrgencyClasses(task)}`}
    >
      <div className="flex min-h-[44px] items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-base font-semibold ${
              task.checked ? "text-slate-400 line-through" : "text-slate-800"
            }`}
          >
            {task.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.dependentName ? (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: task.dependentColor }}
              >
                {task.dependentName}
              </span>
            ) : null}

            {task.deadlineLabel ? (
              <span className="text-xs text-slate-400">{task.deadlineLabel}</span>
            ) : null}
          </div>

          {task.urgency === "overdue" && !task.checked ? (
            <p className="mt-1 text-xs text-red-600">May need to call for refill</p>
          ) : null}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ease-in-out ${
            task.checked ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
          }`}
        >
          {task.checked ? <Check className="h-5 w-5 text-white" strokeWidth={2.5} /> : null}
        </div>
      </div>
    </button>
  );
}
