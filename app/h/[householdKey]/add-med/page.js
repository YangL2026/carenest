"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dateToIsoLocal } from "@/lib/time-utils";

const DEPENDENT_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#EF4444", "#14B8A6"];
const TOTAL_STEPS = 4;

const inputClassName =
  "min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition-all duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const optionButtonBaseClass =
  "min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-base text-slate-700 transition-all duration-200 ease-in-out";
const selectedOptionClass = "border-blue-500 bg-blue-100 ring-2 ring-blue-200 font-semibold";

function toInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function AddMedicationPage({ params }) {
  const { householdKey } = use(params);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [dependents, setDependents] = useState([]);
  const [loadingDependents, setLoadingDependents] = useState(true);

  const [selectedDependentId, setSelectedDependentId] = useState("");
  const [showNewDependentForm, setShowNewDependentForm] = useState(false);
  const [newDependentName, setNewDependentName] = useState("");
  const [newDependentColor, setNewDependentColor] = useState(DEPENDENT_COLORS[0]);
  const [creatingDependent, setCreatingDependent] = useState(false);

  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");

  const [timingType, setTimingType] = useState("clock");
  const [clockTimes, setClockTimes] = useState(["08:00"]);
  const [intervalHours, setIntervalHours] = useState("6");
  const [asNeededHours, setAsNeededHours] = useState("0");

  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [trackSupply, setTrackSupply] = useState(false);
  const [supplyTotal, setSupplyTotal] = useState("");
  const [fixedCourse, setFixedCourse] = useState(false);
  const [fixedCourseMode, setFixedCourseMode] = useState("days");
  const [fixedCourseValue, setFixedCourseValue] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadDependents() {
      setLoadingDependents(true);

      const { data, error } = await supabase
        .from("dependents")
        .select("id, name, color")
        .eq("household_key", householdKey)
        .order("created_at", { ascending: true });

      if (error) {
        setFormError("Could not load dependents.");
      } else {
        setDependents(data || []);
      }

      setLoadingDependents(false);
    }

    loadDependents();
  }, [householdKey]);

  const selectedDependent = useMemo(
    () => dependents.find((dep) => dep.id === selectedDependentId) || null,
    [dependents, selectedDependentId]
  );

  const summaryTimingText = useMemo(() => {
    if (timingType === "clock") {
      const times = [...new Set(clockTimes.filter(Boolean))];
      return `Daily at ${times.join(", ") || "08:00"}`;
    }
    if (timingType === "interval") {
      return `Every ${intervalHours || "6"} hours`;
    }
    return `Only when needed (wait ${asNeededHours || "0"} hours)`;
  }, [asNeededHours, clockTimes, intervalHours, timingType]);

  function validateStep(nextStep = step) {
    if (nextStep === 1) {
      if (!selectedDependentId) {
        setFormError("Select a person before continuing.");
        return false;
      }
    }

    if (nextStep === 2) {
      if (!medName.trim()) {
        setFormError("Medication name is required.");
        return false;
      }
    }

    if (nextStep === 3) {
      if (timingType === "clock") {
        const validTimes = clockTimes.filter(Boolean);
        if (validTimes.length === 0) {
          setFormError("Add at least one scheduled time.");
          return false;
        }
      }

      if (timingType === "interval" && (!intervalHours || Number(intervalHours) <= 0)) {
        setFormError("Interval hours must be greater than 0.");
        return false;
      }

      if (timingType === "as_needed" && Number(asNeededHours) < 0) {
        setFormError("As-needed minimum hours cannot be negative.");
        return false;
      }
    }

    setFormError("");
    return true;
  }

  async function handleCreateDependent() {
    if (!newDependentName.trim()) {
      setFormError("Enter a name for the new person.");
      return;
    }

    setCreatingDependent(true);
    setFormError("");

    const { data, error } = await supabase
      .from("dependents")
      .insert({
        name: newDependentName.trim(),
        color: newDependentColor,
        household_key: householdKey,
      })
      .select("id, name, color")
      .single();

    if (error) {
      setFormError("Could not save new person.");
      setCreatingDependent(false);
      return;
    }

    setDependents((prev) => [...prev, data]);
    setSelectedDependentId(data.id);
    setNewDependentName("");
    setNewDependentColor(DEPENDENT_COLORS[0]);
    setShowNewDependentForm(false);
    setCreatingDependent(false);
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  }

  function handleBack() {
    if (step === 1) {
      router.push(`/h/${householdKey}`);
      return;
    }
    setFormError("");
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleSaveMedication() {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    if (trackSupply && (!supplyTotal || Number(supplyTotal) <= 0)) {
      setFormError("Enter a valid supply total.");
      return;
    }

    if (fixedCourse && (!fixedCourseValue || Number(fixedCourseValue) <= 0)) {
      setFormError("Enter a valid fixed course value.");
      return;
    }

    setSaving(true);
    setFormError("");

    const normalizedTimes = [...new Set(clockTimes.filter(Boolean))].sort();
    const intervalValue = timingType === "interval" ? toInt(intervalHours, 6) : null;
    const asNeededValue = timingType === "as_needed" ? toInt(asNeededHours, 0) : null;
    const supplyValue = trackSupply ? toInt(supplyTotal, null) : null;
    const fixedValue = fixedCourse ? toInt(fixedCourseValue, null) : null;

    let courseEndDate = null;
    if (fixedCourse && fixedCourseMode === "days" && fixedValue) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + fixedValue - 1);
      courseEndDate = dateToIsoLocal(endDate);
    }

    const medicationPayload = {
      dependent_id: selectedDependentId,
      name: medName.trim(),
      dosage: dosage.trim() || null,
      timing_type: timingType,
      times: timingType === "clock" ? normalizedTimes : null,
      interval_hours: timingType === "interval" ? intervalValue : asNeededValue,
      duration_type: fixedCourse ? "fixed_course" : "ongoing",
      total_doses: fixedCourse && fixedCourseMode === "doses" ? fixedValue : null,
      doses_given: 0,
      course_end_date: fixedCourse && fixedCourseMode === "days" ? courseEndDate : null,
      supply_tracking: trackSupply,
      supply_total: supplyValue,
      supply_remaining: supplyValue,
      notes: notes.trim() || null,
      status: "active",
    };

    const { data: medication, error: medicationError } = await supabase
      .from("medications")
      .insert(medicationPayload)
      .select("id")
      .single();

    if (medicationError) {
      setFormError("Could not save medication.");
      setSaving(false);
      return;
    }

    if (timingType === "clock" && normalizedTimes.length > 0) {
      const today = dateToIsoLocal(new Date());
      const medLogRows = normalizedTimes.map((time) => ({
        medication_id: medication.id,
        dependent_id: selectedDependentId,
        date: today,
        time_scheduled: time,
        status: "pending",
      }));

      const { error: medLogsError } = await supabase.from("med_logs").insert(medLogRows);
      if (medLogsError) {
        setFormError("Medication saved, but today's logs could not be created.");
        setSaving(false);
        return;
      }
    }

    router.push(`/h/${householdKey}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6 grid grid-cols-3 items-center">
          <button
            type="button"
            onClick={handleBack}
            className="flex min-h-[44px] items-center gap-1 text-sm text-slate-500 transition-all duration-200 ease-in-out hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => (
              <span
                key={`step-dot-${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full ${step === index + 1 ? "bg-blue-600" : "bg-slate-300"}`}
              />
            ))}
          </div>

          <div />
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {step === 1 ? (
            <div>
              <h1 className="mb-6 text-center text-xl font-semibold text-slate-800">
                Who is this medication for?
              </h1>

              {loadingDependents ? (
                <p className="text-sm text-slate-500">Loading dependents...</p>
              ) : (
                <div className="space-y-3">
                  {dependents.map((dependent) => (
                    <button
                      key={dependent.id}
                      type="button"
                      onClick={() => setSelectedDependentId(dependent.id)}
                      className={`${optionButtonBaseClass} ${selectedDependentId === dependent.id ? selectedOptionClass : ""}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span
                          className="flex items-center gap-3"
                        >
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: dependent.color }}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-slate-800">{dependent.name}</span>
                        </span>
                        {selectedDependentId === dependent.id ? (
                          <Check className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                        ) : null}
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowNewDependentForm((prev) => !prev)}
                    className={optionButtonBaseClass}
                  >
                    <span className="flex items-center gap-2 text-slate-700">
                      <Plus className="h-5 w-5" />
                      Add new person
                    </span>
                  </button>

                  {showNewDependentForm ? (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newDependentName}
                          onChange={(event) => setNewDependentName(event.target.value)}
                          placeholder="Name"
                          className={inputClassName}
                        />

                        <div className="flex flex-wrap gap-3">
                          {DEPENDENT_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewDependentColor(color)}
                              className={`h-10 w-10 rounded-full border-2 transition-all duration-200 ease-in-out ${
                                newDependentColor === color
                                  ? "border-slate-800 ring-2 ring-slate-200"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Select ${color} color`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleCreateDependent}
                          disabled={creatingDependent}
                          className="min-h-[44px] w-full rounded-2xl bg-blue-600 px-4 py-3 text-white transition-all duration-200 ease-in-out hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {creatingDependent ? "Saving..." : "Save person"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h1 className="mb-6 text-center text-xl font-semibold text-slate-800">
                What&apos;s the medication?
              </h1>
              <div className="space-y-4">
                <input
                  type="text"
                  value={medName}
                  onChange={(event) => setMedName(event.target.value)}
                  placeholder="Medication name"
                  className={inputClassName}
                />
                <input
                  type="text"
                  value={dosage}
                  onChange={(event) => setDosage(event.target.value)}
                  placeholder="Dosage (e.g., 10mg, 2 tablets)"
                  className={inputClassName}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h1 className="mb-6 text-center text-xl font-semibold text-slate-800">How often?</h1>

              <div className="space-y-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setTimingType("clock")}
                    className={`${optionButtonBaseClass} ${
                      timingType === "clock" ? selectedOptionClass : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>Every day at set times</span>
                      {timingType === "clock" ? (
                        <Check className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                      ) : null}
                    </span>
                  </button>

                  {timingType === "clock" ? (
                    <div className="ml-4 mt-2 space-y-3 border-l-2 border-blue-200 pl-4">
                      {clockTimes.map((time, index) => (
                        <div key={`clock-time-${index}`} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={time}
                            onChange={(event) =>
                              setClockTimes((prev) =>
                                prev.map((entry, entryIndex) =>
                                  entryIndex === index ? event.target.value : entry
                                )
                              )
                            }
                            className={inputClassName}
                          />
                          {clockTimes.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setClockTimes((prev) =>
                                  prev.filter((_, entryIndex) => entryIndex !== index)
                                )
                              }
                              className="min-h-[44px] rounded-xl px-3 text-sm text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-100"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setClockTimes((prev) => [...prev, "08:00"])}
                        className="min-h-[44px] text-sm font-medium text-blue-600 transition-all duration-200 ease-in-out hover:text-blue-700"
                      >
                        Add another time
                      </button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setTimingType("interval")}
                    className={`${optionButtonBaseClass} ${
                      timingType === "interval" ? selectedOptionClass : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>Every X hours</span>
                      {timingType === "interval" ? (
                        <Check className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                      ) : null}
                    </span>
                  </button>

                  {timingType === "interval" ? (
                    <div className="ml-4 mt-2 border-l-2 border-blue-200 pl-4">
                      <input
                        type="number"
                        min="1"
                        value={intervalHours}
                        onChange={(event) => setIntervalHours(event.target.value)}
                        placeholder="Hours between doses"
                        className={inputClassName}
                      />
                    </div>
                  ) : null}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setTimingType("as_needed")}
                    className={`${optionButtonBaseClass} ${
                      timingType === "as_needed" ? selectedOptionClass : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>Only when needed</span>
                      {timingType === "as_needed" ? (
                        <Check className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
                      ) : null}
                    </span>
                  </button>

                  {timingType === "as_needed" ? (
                    <div className="ml-4 mt-2 border-l-2 border-blue-200 pl-4">
                      <input
                        type="number"
                        min="0"
                        value={asNeededHours}
                        onChange={(event) => setAsNeededHours(event.target.value)}
                        placeholder="Minimum hours between doses"
                        className={inputClassName}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h1 className="text-center text-xl font-semibold text-slate-800">
                ✓ {medName.trim() || "Medication"} added for {selectedDependent?.name || "selected person"}
              </h1>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Dosage:</span> {dosage || "Not set"}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-slate-800">Schedule:</span> {summaryTimingText}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreDetails((prev) => !prev)}
                className="mt-4 min-h-[44px] text-sm font-medium text-blue-600 transition-all duration-200 ease-in-out hover:text-blue-700"
              >
                {showMoreDetails ? "Hide more details" : "Add more details"}
              </button>

              {showMoreDetails ? (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setTrackSupply((prev) => !prev)}
                    className={`${optionButtonBaseClass} ${
                      trackSupply ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : ""
                    }`}
                  >
                    Track supply?
                  </button>

                  {trackSupply ? (
                    <input
                      type="number"
                      min="1"
                      value={supplyTotal}
                      onChange={(event) => setSupplyTotal(event.target.value)}
                      placeholder="How many doses in current supply?"
                      className={inputClassName}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setFixedCourse((prev) => !prev)}
                    className={`${optionButtonBaseClass} ${
                      fixedCourse ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : ""
                    }`}
                  >
                    Fixed course?
                  </button>

                  {fixedCourse ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFixedCourseMode("days")}
                          className={`${optionButtonBaseClass} ${
                            fixedCourseMode === "days"
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                              : ""
                          }`}
                        >
                          For how many days?
                        </button>
                        <button
                          type="button"
                          onClick={() => setFixedCourseMode("doses")}
                          className={`${optionButtonBaseClass} ${
                            fixedCourseMode === "doses"
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                              : ""
                          }`}
                        >
                          Total doses?
                        </button>
                      </div>

                      <input
                        type="number"
                        min="1"
                        value={fixedCourseValue}
                        onChange={(event) => setFixedCourseValue(event.target.value)}
                        placeholder={fixedCourseMode === "days" ? "Number of days" : "Total doses"}
                        className={inputClassName}
                      />
                    </div>
                  ) : null}

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Notes (optional)"
                    rows={3}
                    className={inputClassName}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {formError ? <p className="mt-4 text-sm text-red-600">{formError}</p> : null}

          <div className="mt-6">
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[44px] w-full rounded-2xl bg-blue-600 px-4 py-3 text-white transition-all duration-200 ease-in-out hover:bg-blue-700"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveMedication}
                disabled={saving}
                className="min-h-[44px] w-full rounded-2xl bg-blue-600 px-4 py-3 text-white transition-all duration-200 ease-in-out hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Done"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
