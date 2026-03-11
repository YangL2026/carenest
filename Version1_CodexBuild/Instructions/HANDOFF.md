# CareNest — AI Handoff Context Document
# Last updated: March 5, 2026
# Purpose: Any AI assistant reading this file should be able to pick up this project
# at any phase and maintain consistency with all prior decisions.

---

## HOW TO USE THIS FILE

When starting a new chat session with ANY AI (Claude, ChatGPT, Codex, Gemini, etc.),
paste this entire file as context along with your question. Update this file after
each major session to reflect what was completed and any decisions that were made.

Keep this file saved locally on your computer and also in your GitHub repo.

---

## PROJECT SUMMARY

**Project name:** CareNest
**What it is:** A Progressive Web App (PWA) for solo caregivers managing medical care
for multiple dependents (elderly parents, children, etc.)
**Who it's for:** Built for personal use by two households (the builder's family of 5,
and a friend who cares for 3 elderly parents + a child)
**Why it exists:** Every caregiver app on the market (CareClinic, Medisafe, CareZone,
Caring Village, etc.) was tested firsthand and found inadequate — either broken UX,
aggressive upselling, or architecturally designed for "one patient + many caregivers"
instead of "one caregiver + many patients"
**GitHub:** github.com/YangL2026/carenest

---

## CORE DESIGN PHILOSOPHY

**"A supportive friend, not a micromanager."**

This app must reduce anxiety, not add to it. The user is an exhausted caregiver
managing multiple people's medical lives. Every design decision follows these rules:

1. **Features are invisible until relevant.** The screen shows only what exists and
   what's due. No empty sections, no placeholder text, no "add your first X!" prompts
   cluttering the screen.

2. **Adding is simple, details are optional.** Three taps to add a basic medication.
   Power features (supply tracking, treatment duration) are tucked behind "more options."

3. **Time does the filtering.** She only sees what matters right now. Later today is
   collapsed. Tomorrow doesn't exist on the Today screen.

4. **No guilt, no shame.** Missed items are acknowledged gently with a next action,
   never with angry red alerts or failure language. The app assumes she's doing her
   best.

5. **The app proposes, the human adjusts.** For anything requiring judgment (rescheduling
   recurring tasks, adjusting timelines), the app suggests defaults that she can edit.
   It never makes medical decisions.

---

## CALM URGENCY LEVELS

All visual elements in the app follow this four-level system. There is intentionally
no Level 5 / emergency level — if something is a true emergency, she's calling 911,
not opening an app.

| Level | Name | Visual Style | Example |
|-------|------|-------------|---------|
| 1 | Informational | Gray/subtle text | As-needed med last given 2hrs ago, evening meds preview |
| 2 | Active | White card, normal weight | Current meds due now, today's tasks |
| 3 | Approaching | Amber/warm tint | Procedure prep starting, pharmacy pickup window closing |
| 4 | Overdue | Soft red-orange, never harsh red | Yesterday's missed meds, expired pickup window |

Level 4 items always include a next action ("mark as taken late" / "call to refill")
rather than just stating the failure.

---

## MEDICATION TYPES

| Type | Schedule | Shows on Today? | Reminders? | Example |
|------|----------|----------------|------------|---------|
| Clock-based | Fixed times daily | Yes, in time block | Yes, at set times | Lisinopril 10mg at 7AM |
| Interval-based | Every N hours from last dose | Yes, recalculated | Yes, from last dose | Amoxicillin every 6hrs |
| As-needed | No schedule | Only as context line when recently given | No | Tylenol, Miralax |

**Supply tracking (optional for any med type):**
- User can enter total doses when picking up prescription
- App counts down as doses are checked off
- Gentle reminder when ~10 days of supply remain
- "Running low" notice, not "you're out!" alarm

**Treatment duration:**
- Ongoing (no end date) — med stays on checklist until manually stopped
- Fixed course (X days or X total doses) — med auto-retires from checklist when complete

**Pausing a medication:**
- Quick options: "Before procedure" / "Doctor's orders" / "Side effects" / "Other"
- Optional resume date (auto-resumes) or linked to procedure (resumes per protocol)
- Paused meds show grayed out on checklist with reason, not hidden

**Stopping a medication:**
- Removed from daily checklist
- Preserved in dependent's medication history for medical records

---

## TASK TYPES

| Type | Recurs? | Shows on Today? | Example |
|------|---------|----------------|---------|
| One-time task | No | Yes, with deadline window | Pick up meds at CVS by Friday |
| Procedure protocol | One-time timeline | Amber banner + countdown steps | Colonoscopy prep |

**One-time tasks** have an optional deadline. Before deadline approaches, the task sits
calmly in Today's Plan. Within 2 days of deadline, amber tint. After expiration,
soft notice with next action ("call to refill" / "call to reschedule").

**Procedure protocols** have a dedicated timeline of steps, each with an offset from
procedure datetime. Steps can be informational, tasks, or medication pause/resume
triggers. See UX-SPEC.md for full screen description.

**NOT in v1 (deferred to v2):**
- Recurring tasks with auto-regeneration (quarterly blood work, annual visits)
- Schedule-ahead tasks with lead times ("call to book 3 weeks before due date")
- Post-op follow-up scheduling chains
These are real needs but add significant complexity. In v1, the user manually creates
one-time tasks for these. In v2, the app can automate the recurrence.

---

## TECH STACK (all decisions final)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.x (App Router) | Installed as 16.1.6. Params are Promises — use React.use() to unwrap. |
| Language | JavaScript (not TypeScript) | ES2022+ | May migrate to TS later |
| Styling | Tailwind CSS | 3.x or 4.x | Mobile-first responsive |
| Database | Supabase | Free tier | Postgres, 500MB limit |
| Hosting | Vercel | Free tier | Includes cron jobs |
| Notifications | Web Push API | — | VAPID keys, no Twilio/SMS |
| Package manager | npm | — | Not yarn, not pnpm |

**Explicitly NOT using:**
- TypeScript (keep it simple for learning)
- Native iOS/Android (PWA only)
- Any paid API (no OpenAI/Claude API calls in the app)
- SMS/Twilio (push notifications only)
- Firebase (using Supabase instead)
- Any CSS framework other than Tailwind

---

## DESIGN SPECIFICATIONS

**Color palette:**
- Background: #F8FAFC (slate-50)
- Cards: #FFFFFF with subtle shadow
- Dependent colors (user-assignable, defaults):
  - Person 1: #3B82F6 (blue-500)
  - Person 2: #22C55E (green-500)
  - Person 3: #F59E0B (amber-500)
  - Person 4: #A855F7 (purple-500)
- Urgency levels:
  - Informational: #94A3B8 (slate-400)
  - Active: #FFFFFF white cards
  - Approaching: #FEF3C7 (amber-100 background), #F59E0B (amber-500 border)
  - Overdue: #FEE2E2 (red-100 background), #F87171 (red-400 border)
- Completed/checked: #D1D5DB (gray-300) with line-through text
- Text primary: #1E293B (slate-800)
- Text secondary: #64748B (slate-500)

**Typography:**
- Font: Inter (Google Fonts) or system sans-serif fallback
- Body: 16px base
- Headings: bold, 20-28px
- Med names: 16px semibold
- Dosage/notes: 14px regular, secondary color

**Layout principles:**
- Mobile-first (design for 375px width, scale up)
- Card-based layout with generous padding (p-4 minimum)
- Large tap targets (minimum 44x44px, prefer 48x48px)
- No hamburger menus or deep navigation
- Bottom tab bar for main navigation (Today, Calendar, People, Settings)
- Maximum 2 levels of navigation depth
- Screen never longer than ~2 thumb-scrolls of content

---

## DATABASE SCHEMA

```sql
-- Dependents (the people being cared for)
CREATE TABLE dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  photo_url TEXT,
  household_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  
  -- Timing type
  timing_type TEXT NOT NULL DEFAULT 'clock',  -- 'clock' | 'interval' | 'as_needed'
  
  -- For clock-based: specific times of day
  times TEXT[],                               -- e.g., ARRAY['07:00', '19:00']
  
  -- For interval-based: minimum hours between doses
  interval_hours INTEGER,                     -- e.g., 6 for "every 6 hours"
  
  -- Treatment duration
  duration_type TEXT DEFAULT 'ongoing',       -- 'ongoing' | 'fixed_course'
  total_doses INTEGER,                        -- for fixed_course: total prescribed doses
  doses_given INTEGER DEFAULT 0,             -- for fixed_course: counter
  course_end_date DATE,                      -- alternative: end by date instead of count
  
  -- Supply tracking (optional)
  supply_tracking BOOLEAN DEFAULT FALSE,
  supply_total INTEGER,                      -- total doses in current supply
  supply_remaining INTEGER,                  -- decremented on each check-off
  supply_low_threshold INTEGER DEFAULT 10,   -- days remaining to trigger warning
  
  -- Status
  status TEXT DEFAULT 'active',              -- 'active' | 'paused' | 'completed' | 'discontinued'
  pause_reason TEXT,
  pause_linked_procedure_id UUID,            -- if paused for a procedure
  resume_date DATE,                          -- optional auto-resume date
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily medication check-off log
CREATE TABLE med_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_scheduled TIME,                       -- null for as-needed meds
  time_taken TIMESTAMPTZ,                    -- when actually given
  status TEXT DEFAULT 'pending',             -- 'pending' | 'taken' | 'missed' | 'skipped' | 'taken_late'
  notes TEXT,                                -- optional note ("gave with food", etc.)
  UNIQUE(medication_id, date, time_scheduled)
);

-- Tasks (pharmacy pickups, phone calls, blood work, etc.)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  household_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'errand',           -- 'errand' | 'phone_call' | 'pharmacy_pickup' | 'blood_work' | 'appointment'
  
  -- Deadline window
  deadline_date DATE,                        -- when this needs to be done by
  warning_days INTEGER DEFAULT 2,            -- days before deadline to show amber
  
  -- For appointments with specific times
  appointment_datetime TIMESTAMPTZ,
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',             -- 'pending' | 'completed' | 'expired'
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedures (surgeries, colonoscopies, etc.)
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  procedure_datetime TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',            -- 'upcoming' | 'prep_active' | 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedure timeline steps
CREATE TABLE procedure_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  offset_minutes INTEGER NOT NULL,           -- negative = before, positive = after
  instruction TEXT NOT NULL,
  step_type TEXT DEFAULT 'task',             -- 'info' | 'medication_pause' | 'medication_resume' | 'task' | 'dietary'
  linked_medication_id UUID REFERENCES medications(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL
);

-- Push notification subscriptions (one per device)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Important schema note learned from prototype v1:**
Postgres TIME columns return "07:00:00" (HH:MM:SS) not "07:00" (HH:MM).
Always normalize time strings with a helper function: `normalizeTime(t) { return t.slice(0,5); }`

---

## ACCESS CONTROL MODEL

- No traditional login/password
- Each household gets a unique key (random string, e.g., "a7x9k2m")
- URL pattern: carenest.vercel.app/h/{household_key}
- All database queries filter by household_key
- If auth needed later: add Supabase Auth with "Sign in with Google"

---

## CURRENT STATUS

**Phase:** UX design complete, ready for frontend rebuild
**Last completed:**
- Prototype v1 built with Claude Code — working but UX needs human-driven redesign
- Supabase project created and connected (tables from prototype v1 exist but will need
  to be updated to match new schema above)
- Full UX design session completed — all screen layouts, interaction patterns, medication
  types, task types, and design philosophy documented
- UX spec written (see UX-SPEC.md)
**What exists in Supabase:** Old prototype tables (dependents, medications, med_logs).
  These need to be dropped and recreated with the new schema above.
**What exists on GitHub:** Prototype v1 code (commit 4bcc724). New frontend will be
  built fresh, either on a new branch or replacing the existing code.
**Blockers:** None
**Next step:** Give HANDOFF.md + UX-SPEC.md to Codex (or other coding AI) to build
  the complete frontend from scratch on top of Supabase backend.

---

## KEY FILES

```
carenest/
├── HANDOFF.md                   -- THIS FILE (always keep updated)
├── UX-SPEC.md                   -- Screen-by-screen interaction spec
├── PROJECT-PLAN.md              -- Learning curriculum (7 phases)
├── package.json
├── next.config.mjs
├── .env.local                   -- Supabase URL + anon key + VAPID keys (NEVER commit)
├── public/
│   ├── manifest.json            -- PWA manifest
│   ├── sw.js                    -- Service worker
│   └── icons/                   -- App icons for home screen
├── app/
│   ├── layout.js                -- Root layout with bottom nav
│   ├── page.js                  -- Landing/redirect
│   └── h/
│       └── [householdKey]/
│           ├── page.js          -- Today screen
│           ├── calendar/
│           │   └── page.js      -- Master calendar
│           ├── people/
│           │   ├── page.js      -- Dependent list
│           │   └── [id]/
│           │       └── page.js  -- Dependent detail (meds, history, as-needed log)
│           ├── add-med/
│           │   └── page.js      -- Add medication flow
│           ├── add-task/
│           │   └── page.js      -- Add task flow
│           └── procedure/
│               ├── new/
│               │   └── page.js  -- Create procedure + timeline
│               └── [id]/
│                   └── page.js  -- Active procedure countdown view
├── components/
│   ├── MedCard.js               -- Single medication checkbox card
│   ├── TimeBlock.js             -- Group of meds for a time slot
│   ├── TaskCard.js              -- Task/errand card
│   ├── ProcedureBanner.js       -- Amber procedure alert banner
│   ├── DependentBadge.js        -- Color-coded name badge
│   ├── BottomNav.js             -- Tab bar (Today, Calendar, People, Settings)
│   ├── AddMedFlow.js            -- Multi-step medication add
│   └── ProcedureTimeline.js     -- Timeline editor for procedure steps
├── lib/
│   ├── supabase.js              -- Supabase client
│   ├── notifications.js         -- Push subscription helpers
│   └── time-utils.js            -- normalizeTime, interval calc, time block grouping
└── vercel.json                  -- Cron job config for notifications
```

---

## DECISIONS LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-05 | PWA, not native app | $0 cost, no App Store needed, works cross-platform |
| 2026-03-05 | Next.js + Supabase + Vercel | All free tier, one language (JS), strong portfolio signal |
| 2026-03-05 | No login, household key URL | Minimal friction for 2-household personal use |
| 2026-03-05 | Push notifications, not SMS | $0 ongoing cost, sufficient for personal use |
| 2026-03-05 | JavaScript, not TypeScript | Learning project, reduce complexity |
| 2026-03-05 | Prototype-first, then tutorial rebuild | De-risk architecture before investing in structured learning |
| 2026-03-05 | Supabase connected, 3 tables created | dependents, medications, med_logs all working |
| 2026-03-05 | Prototype v1 built with Claude Code | Working but UX needs human-driven redesign |
| 2026-03-05 | Will use Codex for v2 frontend rebuild | Claude Code good for scaffolding, Codex may produce fewer bugs |
| 2026-03-05 | Supabase backend stays, only frontend rebuilds | Database reusable regardless of who writes frontend |
| 2026-03-05 | Four medication types: clock, interval, as-needed | Covers all real-world scenarios identified from user interviews |
| 2026-03-05 | Supply tracking is optional per medication | Not all meds need it, keeps adding meds simple |
| 2026-03-05 | Fixed-course meds auto-retire | Antibiotics etc. disappear from checklist when course completes |
| 2026-03-05 | Calm urgency levels (4 tiers, no red) | App must reduce anxiety, not create it |
| 2026-03-05 | As-needed meds show safety windows, not reminders | Tylenol/ibuprofen need timing awareness, not schedules |
| 2026-03-05 | Recurring tasks deferred to v2 | Real need but adds complexity; manual one-time tasks work for v1 |
| 2026-03-05 | Complex rescheduling logic excluded | Doctor judgment, not app logic; user can edit dates manually |
| 2026-03-05 | Interval meds recalculate from last actual dose | Handles the "gave antibiotics late, recalculate next dose" case |
| 2026-03-05 | Paired as-needed meds (Tylenol/ibuprofen alternating) | Deferred, nice-to-have for v2; v1 just shows individual safety windows |

---

## ABOUT THE BUILDER

- Background: Fluid dynamics PhD (Yale), physics BS (Zhejiang University)
- Current: Associate scientist at Woods Hole Oceanographic Institution
- Coding experience: MATLAB (strong), Python (learning), n8n automation, JavaScript (learning)
- Learning style: Structured, phase-based with working increments
- Goal: Build freelance capability — "hand me a problem, I'll build you a solution"
- Languages: English, Mandarin Chinese, Spanish
