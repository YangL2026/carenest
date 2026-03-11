# CareNest — UX Specification
# Version 1.0 — March 5, 2026
# This document describes every screen, interaction, and visual pattern.
# It is written for a coding AI (Codex, Claude Code, etc.) to implement directly.

---

## NAVIGATION

Bottom tab bar, always visible, four tabs:
- **Today** (home icon) — daily checklist and plan
- **Calendar** (calendar icon) — master calendar for all dependents
- **People** (people icon) — dependent profiles and medication management
- **Settings** (gear icon) — notification preferences, household info

The app opens to the Today tab by default.

---

## SCREEN 1: TODAY (Main Screen)

This is the screen the user sees every time she opens the app. It answers:
"What do I need to do right now, and what's coming today?"

### Layout (top to bottom):

**Header:**
- "Today" in large bold text
- Date underneath in secondary text (e.g., "Thursday, March 5")

**Section A: Overdue (only visible if items exist)**
- Appears ONLY if there are unchecked medications from previous days
- Soft red-orange background card
- Text: "Yesterday — 2 meds not checked off"
- Expandable: tap to see which meds, with options:
  - "Taken late" (logs it as taken with late flag)
  - "Missed" (acknowledges and clears)
- Once all overdue items are addressed, this section disappears entirely

**Section B: Procedure Alert Banner (only visible if active procedure exists)**
- Amber background card, full width
- Icon + text: "⚠️ Dad — Colonoscopy in 36 hours"
- Subtitle: "Prep checklist active — tap to view"
- Tapping navigates to the procedure countdown screen
- Only shows when a procedure is in "prep_active" or "upcoming" (within 7 days) status
- Disappears after procedure is marked complete

**Section C: Right Now — Current Medications**
- Shows medications due in the current or most recent time block
- Time block label: "Morning" / "Afternoon" / "Evening" with time range
- Counter on right: "2/4 done" (not a progress bar — just text)

**Medication cards within time block:**
- Left edge: colored bar matching dependent's color (4px wide vertical stripe)
- Checkbox circle: empty when pending, filled with checkmark when done
- Center: medication name (semibold), dosage below (regular, secondary color)
- Right side: dependent name badge (small pill-shaped tag in their color), time
- When checked off:
  - Card background shifts to light gray
  - Text gets subtle line-through
  - Card moves to bottom of its time block (unchecked items stay on top)
  - Subtle timestamp appears: "given at 7:12 AM"
- Single tap to check off (instant, no confirm button)
- Tap again within 5 minutes to uncheck
- After 5 minutes, tap-and-hold to uncheck (prevents accidental changes)

**Interval-based medication cards:**
- Same visual style as clock-based
- Instead of fixed time, shows: "due by 3:00 PM (6hrs since last dose)"
- After check-off, the card disappears from current block and a new card
  appears in the appropriate future time block with recalculated time

**As-needed medication context line (only visible if recently given):**
- NOT a card — a small subtle line of text under the relevant dependent's section
- Gray text: "⏱ Tylenol given 3hrs ago · next OK after 8:00 PM"
- Not tappable, not checkable — purely informational
- Disappears once the safety window expires

**Section D: Today's Plan — Tasks & Errands**
- Shows only if tasks exist for today
- Section header: "Today's Plan"
- Each task is a card with:
  - Small icon on left (📞 phone, 🚗 errand, 💊 pharmacy, 🩸 blood work)
  - Task title
  - Dependent name badge
  - Deadline if set: "by Friday" in secondary text
  - Amber tint if within warning_days of deadline
  - Soft red-orange tint if past deadline, with next action text
- Tappable checkbox to mark complete
- Completed tasks gray out and move to bottom

**Section E: Later Today — Upcoming Medications (collapsed by default)**
- Shows future time blocks (e.g., if it's morning, shows Afternoon and Evening)
- Collapsed: just the header "Evening — 3 medications" with expand arrow
- Expandable: tap to preview the medication cards (same style, but lighter/grayed)
- Purpose: she can see what's coming without it demanding attention

**Section F: Floating Action Button (FAB)**
- Bottom right corner, above the tab bar
- "+" icon
- Tapping opens a quick-add menu:
  - "Add medication"
  - "Add task"
  - "Add procedure"
- Each option navigates to its respective add flow

---

## SCREEN 2: CALENDAR

Master calendar showing all dependents' events overlaid with color coding.

### Layout:

**Header:**
- "Calendar" in large bold text
- Toggle: "Week" / "Month" view (default: Week)

**Week view:**
- 7-day horizontal strip showing dates
- Current day highlighted
- Below: vertical timeline for selected day showing:
  - Medication times as small colored dots (grouped if multiple)
  - Appointments as colored blocks with title
  - Procedure prep periods as amber overlay blocks spanning multiple days

**Tapping a day** shows its full schedule below the strip.

**Tapping an event** shows details in a bottom sheet (appointment info, location, etc.)

**Procedure prep overlay:**
- When a procedure prep is active, the calendar shows an amber block spanning
  from prep start to procedure day
- Label on block: "Dad — Colonoscopy Prep"
- Visual makes it impossible to accidentally schedule something during prep

---

## SCREEN 3: PEOPLE

List of all dependents with quick access to their profiles.

### Layout:

**Header:**
- "People" in large bold text
- "+" button top right to add new dependent

**Dependent list:**
- Large cards, one per dependent
- Card shows: color bar on left, name, number of active medications
- Subtitle: status summary ("all meds on track" or "1 med paused" or "procedure in 3 days")
- Tapping navigates to dependent detail screen

---

## SCREEN 3a: DEPENDENT DETAIL

Full profile for one dependent.

### Layout:

**Header:**
- Back arrow, dependent name, color indicator
- Edit button (pencil icon) to change name/color

**Tabs within the screen:**

**Tab: Medications**
- List of all medications (active, paused, completed)
- Active meds: name, dosage, schedule, supply status if tracked
- Paused meds: grayed out with reason badge ("paused — colonoscopy prep")
- Completed meds: collapsed section "Completed courses (2)" expandable
- Discontinued meds: collapsed section at bottom
- Tapping a med opens detail view with full info, edit, pause, stop options
- "+" button to add new medication for this dependent

**Tab: As-Needed Log**
- Chronological log of as-needed medications given
- Each entry: med name, time given, next-OK-time
- "Log a dose" button at top for quick entry
- Shows safety window status for each as-needed med:
  "Tylenol — OK to give now" or "Tylenol — wait until 8:00 PM"

**Tab: History**
- Monthly adherence summary (simple, not judgmental)
- Just factual: "February: 89% of scheduled doses given"
- Exportable as text/PDF for doctor visits

---

## SCREEN 4: ADD MEDICATION FLOW

Multi-step guided flow for adding a new medication. Designed to be completable
in 15 seconds for basic meds, with optional detail for complex ones.

### Step 1: Who
- "Who is this medication for?"
- Large buttons showing each dependent's name and color
- Or "Add new person" at the bottom

### Step 2: What
- "What's the medication?"
- Text input for medication name (with common name autocomplete if feasible)
- Text input for dosage (e.g., "10mg", "2 tablets", "5ml")

### Step 3: When
- "How often?"
- Large simple buttons:
  - "Every day at set times" → clock-based
  - "Every X hours" → interval-based
  - "Only when needed" → as-needed
- If clock-based: show time picker(s), "Add another time" link
- If interval-based: number input for hours between doses
- If as-needed: show minimum hours between doses (for safety window), default 0

### Step 4: Done (basic flow ends here)
- "✓ [Med name] added for [Dependent name]"
- Shows summary of what was entered
- Link: "Add more details" → opens optional fields:
  - Track supply? (toggle) → if yes: "How many doses in current supply?"
  - Fixed course? (toggle) → if yes: "For how many days?" or "Total doses?"
  - Notes (free text)
- "Done" button returns to wherever they came from

---

## SCREEN 5: ADD TASK FLOW

Simple flow for adding tasks, errands, and appointments.

### Step 1: Who
- "Who is this for?"
- Dependent buttons + "General / household" option

### Step 2: What
- "What needs to be done?"
- Quick-select buttons for common types:
  - "📞 Make a phone call"
  - "💊 Pick up prescription"
  - "🩸 Blood work / lab"
  - "📋 Other task"
- Text input for title
- Optional: description/notes

### Step 3: When
- "When does this need to happen?"
- Options:
  - "No specific deadline" (just goes on today's plan)
  - "By a specific date" → date picker for deadline
  - "At a specific time" → date + time picker (for appointments)
- Optional: location text field (for appointments)

### Step 4: Done
- Summary of task
- "Done" button

---

## SCREEN 6: PROCEDURE SETUP

For creating a procedure prep protocol (colonoscopy, surgery, etc.)

### Step 1: Basics
- "Who is having the procedure?" → dependent selector
- "What procedure?" → text input (e.g., "Colonoscopy")
- "When?" → date + time picker for procedure datetime

### Step 2: Timeline Builder
- Header: "Build the prep timeline"
- Instruction text: "Add each step from the discharge instructions. We'll calculate
  the exact times and remind you."
- List of timeline rows. Each row has:
  - When: dropdown "days before" / "hours before" / "hours after" + number input
  - What: text input for instruction
  - Type: dropdown "General step" / "Stop a medication" / "Resume a medication" / "Dietary change"
  - If "Stop/Resume a medication": dropdown showing the dependent's active meds
- "Add step" button at bottom adds a new blank row
- Rows are reorderable (drag handle or up/down buttons)
- Optional: "Use template" button at top with pre-built templates:
  - "Colonoscopy prep (generic)"
  - "General surgery"
  - "Cardiac procedure"
  Templates pre-fill rows that user can then edit to match their specific instructions

### Step 3: Review
- Shows the calculated absolute times for each step
- E.g., "5 days before → Stop Warfarin → March 8"
- "Looks good" button activates the protocol

### After activation:
- Procedure status changes to "prep_active" when first step's time arrives
- Banner appears on Today screen
- Linked medications are automatically paused/resumed at their scheduled times
- Push notifications fire for each step
- After procedure datetime + last post-op step is completed, status → "completed"

---

## SCREEN 7: ACTIVE PROCEDURE VIEW

Reached by tapping the procedure alert banner on Today screen.

### Layout:

**Header:**
- Dependent name + procedure name
- Countdown: "In 36 hours" or "T-minus 2 days"

**Timeline visualization:**
- Vertical timeline with nodes for each step
- Past steps: green checkmark, grayed text
- Current/next step: prominent, highlighted, with exact time
- Future steps: visible but subdued
- Each node shows:
  - Absolute time and date
  - Instruction text
  - Type badge (if medication pause/resume: shows which med)
  - Checkbox for task-type steps

**Bottom:**
- "Edit timeline" link (in case instructions change)
- "Mark procedure complete" button (only shows after procedure datetime)

---

## SCREEN 8: ONBOARDING (First-time use)

### Flow:

**Welcome screen:**
- CareNest logo + tagline "Keep everyone's care in one calm place"
- "Get started" button

**Step 1:**
- "Who do you care for? Let's start with one person."
- Name input + color picker (preset swatches)
- "Next" button

**Step 2:**
- "Does [name] take any daily medications?"
- "Yes, let's add them" → enters add medication flow (repeatable)
- "Not right now, I'll add later" → skips

**Step 3:**
- "Want to add another person?"
- "Yes" → back to Step 1
- "That's enough for now" → goes to Today screen

**After onboarding:**
- PWA install prompt: "Add CareNest to your home screen for reminders"
- Notification permission request (with friendly explanation of why)

At no point does onboarding force completion. She can set up one person with
zero medications and start using the app. Everything else can be added later.

---

## PUSH NOTIFICATION PATTERNS

**Medication reminder (clock-based):**
- Fires at scheduled time
- Text: "💊 Dad — Morning meds: Lisinopril 10mg, Metformin 500mg"
- Tapping opens Today screen

**Medication follow-up (30 min after, if not checked off):**
- Text: "Dad still has 2 unchecked meds from this morning"
- Tapping opens Today screen

**Interval-based medication:**
- Fires at calculated time
- Text: "💊 Kid — Amoxicillin due now (6hrs since last dose)"

**Procedure prep step:**
- Fires at calculated absolute time
- Text: "⚠️ Dad — Colonoscopy prep: Stop Warfarin today"
- Tapping opens procedure countdown view

**Task approaching deadline:**
- Fires 2 days before deadline (morning)
- Text: "📋 Dad — Blood work at Quest due by Thursday"

**Supply running low:**
- Fires when supply_remaining hits threshold
- Text: "💊 Mom — Amlodipine running low (~10 days left). Time to refill?"
- Only once, not repeated daily

---

## RESPONSIVE BEHAVIOR

**Mobile (375px - 768px):**
- Single column layout
- Bottom tab bar
- Cards full width with padding
- Floating action button bottom right

**Tablet/Desktop (768px+):**
- Two-column layout possible: Today + Calendar side by side
- Bottom tab bar becomes sidebar navigation
- More spacious cards with additional detail visible
- Same data, more room to breathe

---

## EMPTY STATES

All empty states are invisible — they don't show placeholder sections.
The ONLY exceptions where we show helpful text:

- **Today screen with zero dependents:** "Welcome to CareNest. Tap + to add
  your first person." (This only appears before ANY setup is done)
- **Dependent detail with zero medications:** "No medications yet. Tap + to add one."
- **Calendar with zero events:** Show the calendar grid normally, just with no markers.
  No "nothing scheduled!" text.

---

## INTERACTION DETAILS

**Checking off a medication:**
- Single tap on checkbox circle
- Immediate visual feedback: checkmark appears, card grays out
- Card slides to bottom of its time block (animation: 200ms ease)
- Timestamp appears on card
- Database write happens in background (optimistic update)
- If database write fails: card reverts, subtle error toast at bottom

**Unchecking a medication (within 5 minutes):**
- Single tap on checked checkbox
- Card reverts to unchecked state, moves back up
- Database log updated

**Unchecking a medication (after 5 minutes):**
- Single tap does nothing (prevents accidental changes)
- Tap and hold (500ms) shows confirmation: "Unmark as taken?"
- Confirm reverts the card

**Swiping a medication card (left):**
- Reveals action buttons: "Pause" / "Skip today" / "Info"
- Pause: opens pause flow (reason + optional resume date)
- Skip today: marks as skipped for today only, grays out
- Info: opens medication detail

**Pull to refresh on Today screen:**
- Refreshes all data from Supabase
- Useful if she updated something on another device

---

## VISUAL DESIGN APPENDIX — MANDATORY STYLING RULES

**CRITICAL: Codex and other coding AIs tend to produce ugly, unstyled output.
This section provides exact Tailwind CSS classes and visual specifications that
MUST be followed. Do not deviate from these. The goal is a modern, calming,
polished health app — think Apple Health meets a premium meditation app.**

### Global Page Style
```
Body/page background: bg-slate-50 (not white — the slight gray makes cards pop)
Font: Import Inter from Google Fonts. Fallback: system-ui, sans-serif
Base text size: text-base (16px)
All text: text-slate-800 for primary, text-slate-500 for secondary
Page padding: px-4 py-6 on mobile, px-8 py-8 on desktop
Max content width: max-w-lg mx-auto on mobile (keeps it centered and readable)
```

### Card Style (used for medication cards, task cards, dependent cards)
```
Background: bg-white
Border radius: rounded-2xl (16px — generously rounded, feels modern and soft)
Shadow: shadow-sm (subtle, not dramatic)
Padding inside card: p-4
Margin between cards: space-y-3
Border: DO NOT use visible borders on cards. The shadow + white-on-slate is enough.
Exception: the colored dependent stripe on the left edge of med cards:
  border-l-4 with the dependent's color (e.g., border-l-blue-500)
```

### Medication Card Specific Layout
```
Container: flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border-l-4
Checkbox circle (unchecked): w-10 h-10 rounded-full border-2 border-slate-300
  flex items-center justify-center (empty inside)
Checkbox circle (checked): w-10 h-10 rounded-full bg-{dependent-color}
  flex items-center justify-center (white checkmark SVG icon inside)
Med name: text-base font-semibold text-slate-800
Dosage: text-sm text-slate-500
Dependent badge: text-xs font-medium px-2 py-0.5 rounded-full
  bg-{dependent-color} text-white
Time: text-xs text-slate-400

When checked off:
  Card: bg-slate-50 (instead of bg-white)
  Med name: line-through text-slate-400
  Checkbox: stays filled with color and checkmark
  Add: text-xs text-slate-400 "given at 7:12 AM" below dosage
  Transition: transition-all duration-200 ease-in-out
```

### Section Headers (Morning, Evening, Today's Plan, etc.)
```
Text: text-lg font-bold text-slate-800
Counter text (e.g., "2/4 done"): text-sm font-normal text-slate-400
  float right or flex justify-between
Margin: mb-3 mt-6 (generous spacing between sections)
NO background color on section headers. NO borders. Just text.
```

### Overdue Section (Section A)
```
Container: bg-red-50 border border-red-200 rounded-2xl p-4
Text: text-red-700 font-medium
Icon: use a subtle ⚠ or clock icon in text-red-400
Action buttons inside: text-sm font-medium text-red-600 underline
NOT aggressive red — this is a soft, warm warning
```

### Procedure Alert Banner (Section B)
```
Container: bg-amber-50 border border-amber-200 rounded-2xl p-4
Main text: text-amber-800 font-semibold text-base
Subtitle: text-amber-600 text-sm
Left icon: text-amber-500 (use ⚠️ or a calendar-alert icon)
The whole card is tappable — add cursor-pointer and hover:bg-amber-100 transition
```

### Task Cards (Today's Plan)
```
Same base card style as medication cards (bg-white rounded-2xl shadow-sm p-4)
Left side: icon in a small circle (w-8 h-8 rounded-full bg-slate-100
  flex items-center justify-center text-slate-500)
  📞 for phone calls, 💊 for pharmacy, 🩸 for blood work, 📋 for other
Layout: flex items-center gap-3
Deadline text: text-xs text-slate-400

When approaching deadline: border border-amber-200 bg-amber-50
When past deadline: border border-red-200 bg-red-50
  + small text "May need to call for refill" in text-red-600 text-xs
```

### Bottom Tab Bar
```
Container: fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200
  flex justify-around items-center h-16 px-4
  (add safe-area padding for iPhone notch: pb-[env(safe-area-inset-bottom)])
Each tab: flex flex-col items-center gap-0.5
Icon: w-6 h-6
Label: text-xs
Inactive: text-slate-400
Active: text-blue-600 font-medium
DO NOT use background colors on tabs. Just icon + label color change.
Ensure main content has padding-bottom: pb-20 to account for tab bar height.
```

### Floating Action Button
```
Position: fixed bottom-20 right-4 (above tab bar)
Size: w-14 h-14
Style: rounded-full bg-blue-600 text-white shadow-lg
  flex items-center justify-center
Icon: + (plus) in text-2xl font-light
Hover/press: bg-blue-700 scale-105 transition
The FAB menu (when tapped): bg-white rounded-2xl shadow-xl p-2
  positioned above the FAB button
  Each menu item: flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50
```

### Onboarding Screens
```
Full screen, centered content: min-h-screen flex flex-col items-center justify-center px-6
Title: text-2xl font-bold text-slate-800 text-center
Subtitle: text-base text-slate-500 text-center mt-2 mb-8
Primary button: w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl
  text-center text-lg shadow-sm hover:bg-blue-700 transition
Secondary button/link: text-blue-600 font-medium text-base mt-4
Input fields: w-full px-4 py-3 bg-white border border-slate-200 rounded-xl
  text-base text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100
  outline-none transition
Color picker swatches: flex gap-3, each swatch w-10 h-10 rounded-full
  border-2 border-transparent, selected: border-slate-800 ring-2 ring-offset-2
```

### Add Medication / Add Task Flow
```
Same centered layout as onboarding
Step question: text-xl font-semibold text-slate-800 text-center mb-6
Option buttons (e.g., frequency choices): w-full py-4 px-4 bg-white
  border border-slate-200 rounded-2xl text-left text-base text-slate-700
  hover:border-blue-500 hover:bg-blue-50 transition mb-3
  When selected: border-blue-500 bg-blue-50 ring-2 ring-blue-100
Back button: text-slate-500 text-sm, top left
Step indicator: small dots at top center, current dot bg-blue-600, others bg-slate-300
```

### Later Today / Collapsed Sections
```
Header row: flex justify-between items-center py-3 cursor-pointer
Label: text-base font-medium text-slate-400
Expand arrow: text-slate-400, rotates 180deg when expanded (transition-transform)
When expanded: children have opacity-75 to feel visually quieter than "Right Now"
```

### Procedure Timeline (Active Procedure View)
```
Vertical line: w-0.5 bg-slate-200, positioned left with nodes on it
Each node:
  Completed: w-6 h-6 rounded-full bg-green-500 with white checkmark
  Current: w-8 h-8 rounded-full bg-amber-500 with white icon, ring-4 ring-amber-100
  Future: w-6 h-6 rounded-full bg-slate-200
Connecting line between nodes: the vertical line behind them
Step text next to node: ml-4
  Completed: text-slate-400 line-through
  Current: text-slate-800 font-semibold text-base
  Future: text-slate-500 text-sm
Time labels: text-xs text-slate-400, above each step text
```

### Calendar
```
Week strip: flex gap-1, each day w-10 h-10 rounded-full flex items-center justify-center
  Today: bg-blue-600 text-white font-semibold
  Selected (not today): bg-blue-100 text-blue-600
  Other days: text-slate-600
  Days with events: small dot below the number (w-1.5 h-1.5 rounded-full bg-blue-400)
Day schedule below: vertical timeline similar to procedure view but simpler
  Time labels on left, event cards on right
```

### Typography Scale (exact sizes)
```
Page title ("Today", "Calendar"): text-2xl font-bold (24px)
Section header ("Morning", "Today's Plan"): text-lg font-bold (18px)
Card primary text (med name, task title): text-base font-semibold (16px)
Card secondary text (dosage, deadline): text-sm text-slate-500 (14px)
Metadata (timestamps, counters): text-xs text-slate-400 (12px)
Dependent badge text: text-xs font-medium (12px)
```

### Animation & Transitions
```
All interactive elements: transition-all duration-200 ease-in-out
Card check-off slide: animate with opacity and translateY
Checkbox fill: transition-colors duration-150
Section expand/collapse: transition-all duration-300, use max-height technique
Page transitions: keep simple, no fancy route animations
Loading states: subtle pulse animation on skeleton cards (animate-pulse on bg-slate-200 rounded-2xl)
```

### Icons
```
Use Lucide React icons (import from 'lucide-react')
Icon size in tab bar: w-6 h-6
Icon size in cards: w-5 h-5
Icon size in buttons: w-5 h-5
Checkmark in checkbox: use a simple SVG path, not an emoji
Stroke width: 2px for all icons
```

### DO NOT DO (common AI coding mistakes)
```
- DO NOT use default browser checkbox inputs. Build custom checkbox circles.
- DO NOT use default blue link colors. Use the slate/blue palette defined above.
- DO NOT use visible card borders as the primary visual separator. Use shadow-sm.
- DO NOT use bright/saturated background colors on large areas. Keep backgrounds slate-50.
- DO NOT use emoji as icons in the tab bar. Use Lucide React SVG icons.
- DO NOT use Times New Roman, Georgia, or any serif font. Inter or system sans only.
- DO NOT center all text. Cards should be left-aligned. Only onboarding is centered.
- DO NOT use default HTML form styling. All inputs must be custom styled per above.
- DO NOT forget padding. Every card needs p-4. Every page needs px-4. Breathing room is critical.
- DO NOT make tap targets smaller than 44x44px. Buttons, checkboxes, tabs all need minimum size.
```
