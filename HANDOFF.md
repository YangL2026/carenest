# Care Command — AI Handoff Context Document
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

**Project name:** Care Command
**What it is:** A Progressive Web App (PWA) for solo caregivers managing medical care
for multiple dependents (elderly parents, children, etc.)
**Who it's for:** Built for personal use by two households (the builder's family of 5,
and a friend who cares for 3 elderly parents + a child)
**Why it exists:** Every caregiver app on the market (CareClinic, Medisafe, CareZone,
Caring Village, etc.) was tested firsthand and found inadequate — either broken UX,
aggressive upselling, or architecturally designed for "one patient + many caregivers"
instead of "one caregiver + many patients"

---

## CORE FEATURES (in priority order)

1. **Multi-dependent profiles** — Each person has a name, color code, optional photo
2. **Medication management** — Each dependent has a list of medications with name,
   dosage, frequency, scheduled times, and notes
3. **Daily toggle checklist ("Today" screen)** — Shows all medications due today,
   grouped by time of day, color-coded by dependent. Each med is a tappable checkbox
   that records a timestamp when checked. Progress indicators per time block.
   Paused medications show as grayed-out with reason.
4. **Master calendar** — Week/day view showing all dependents' appointments overlaid,
   color-coded. When a procedure prep is active, shows a colored block overlay.
5. **Procedure prep timeline builder** — User enters a procedure date/time, then adds
   timeline entries as rows (offset from procedure time + instruction text). System
   calculates absolute times, sends push notifications at each milestone, and
   automatically pauses/resumes linked medications on schedule.
6. **Push notifications** — Web Push API via service worker. Medication reminders at
   scheduled times, follow-up nudges if not checked off within 30 min, procedure
   prep countdown alerts for critical steps.

---

## TECH STACK (all decisions final)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.x (16.1.6 confirmed) | NOT Pages Router |
| Language | JavaScript (not TypeScript for simplicity) | ES2022+ | May migrate to TS later |
| Styling | Tailwind CSS | 3.x | Mobile-first responsive |
| Database | Supabase | Free tier | Postgres, 500MB limit |
| Hosting | Vercel | Free tier | Includes cron jobs |
| Notifications | Web Push API | — | VAPID keys, no Twilio/SMS |
| Package manager | npm | — | Not yarn, not pnpm |

## VERSION MANAGEMENT

- The source of truth for all dependency versions is package.json and package-lock.json,
  NOT this document. Always check package.json before writing code that depends on
  framework-specific APIs.
- package-lock.json must always be committed to Git. Never add it to .gitignore.
- Use `npm ci` (not `npm install`) when setting up on a new machine or in CI/CD.
- Do not upgrade Next.js major versions without reading the official migration guide
  and testing on a branch first.
- Current known version-specific behaviors:
  - Next.js 16: params in page components is a Promise, must unwrap with React.use()

**Explicitly NOT using:**
- TypeScript (keep it simple for learning)
- Native iOS/Android (PWA only)
- Any paid API (no OpenAI/Claude API calls in the app)
- SMS/Twilio (push notifications only)
- Firebase (using Supabase instead)
- Any CSS framework other than Tailwind (no Bootstrap, no Material UI)

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
- Urgent alerts: #F59E0B (amber, NEVER red)
- Success/completed: #22C55E (green-500)
- Text primary: #1E293B (slate-800)
- Text secondary: #64748B (slate-500)

**Typography:**
- Font: Inter (from Google Fonts) or system sans-serif as fallback
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
- Maximum 2 levels of hierarchy on any screen

---

## DATABASE SCHEMA

```sql
-- Dependents (the people being cared for)
CREATE TABLE dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  photo_url TEXT,
  household_key TEXT NOT NULL,  -- links to a household for access control
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,                    -- e.g., "10mg", "2 tablets"
  frequency TEXT,                 -- e.g., "twice daily", "every 8 hours"
  times TEXT[],                   -- e.g., ARRAY['07:00', '19:00']
  notes TEXT,
  status TEXT DEFAULT 'active',   -- 'active' | 'paused' | 'discontinued'
  pause_reason TEXT,              -- e.g., "colonoscopy prep"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily medication check-off log
CREATE TABLE med_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_scheduled TIME NOT NULL,
  time_taken TIMESTAMPTZ,         -- null if not yet taken
  status TEXT DEFAULT 'pending',  -- 'pending' | 'taken' | 'missed' | 'skipped'
  UNIQUE(medication_id, date, time_scheduled)
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  notes TEXT,
  type TEXT DEFAULT 'routine',    -- 'routine' | 'procedure' | 'follow-up'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedures (surgeries, colonoscopies, etc.)
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  procedure_datetime TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'upcoming' | 'prep_active' | 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedure timeline steps
CREATE TABLE procedure_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  offset_minutes INTEGER NOT NULL,  -- negative = before, positive = after procedure
  instruction TEXT NOT NULL,
  step_type TEXT DEFAULT 'task',     -- 'info' | 'medication_pause' | 'medication_resume' | 'task'
  linked_medication_id UUID REFERENCES medications(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE
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

---

## ACCESS CONTROL MODEL

- No traditional login/password (for simplicity)
- Each household gets a unique key (random string, e.g., "a7x9k2m")
- URL pattern: carecommand.vercel.app/h/{household_key}
- All database queries filter by household_key
- All dependents, medications, etc. belong to a household_key
- If auth is needed later: add Supabase Auth with "Sign in with Google"

---

## BUILD APPROACH

**Two-track strategy:**

**Track 1: Working prototype (build first)**
- Build a minimal but fully functional version end-to-end
- Ugly UI is fine — purpose is to prove architecture works
- Must demonstrate: database CRUD, daily checklist, push notifications
- This gives confidence that the full build will work

**Track 2: Tutorial rebuild (learn by building)**
- 7 phases, each a self-contained lesson
- Each phase produces a working increment
- Styled and polished from Phase 1 onward
- Can reference the prototype when debugging

---

## TUTORIAL PHASES

| Phase | Name | What's Built | Key Concepts |
|-------|------|-------------|--------------|
| 1 | Hello Beautiful Screen | Static Today checklist, hardcoded data | HTML, Tailwind, responsive design, PWA manifest |
| 2 | Make It Think | Interactive checkboxes, state | React, useState, components, event handling |
| 3 | Make It Remember | Supabase connected, data persists | Database, CRUD, async/await, env variables |
| 4 | Make It Know Everyone | Multi-dependent, calendar | Dynamic routing, data joins, calendar UI |
| 5 | Make It Warn Me | Push notifications working | Service workers, Web Push API, cron jobs |
| 6 | Make It Handle Crises | Procedure prep timeline | Complex forms, time math, state machines |
| 7 | Make It Shine | Polish, PDF export, README | Error handling, accessibility, portfolio |

---

## CURRENT STATUS

**Phase:** Phase 2 complete, starting Phase 3
**Last completed:**
- Phase 0: Database schema reset — all 7 tables created in Supabase
- Phase 1: Today screen built and tested — all components working
- Phase 2: Add Medication flow built and tested — 4-step guided flow with Supabase save, med_log generation, inline dependent creation
- Bug fix: params unwrapped with React.use() for Next.js 16 compatibility
- Polish: stronger selection states, nested sub-options, back button on all steps
**Blockers:** None
**Next step:** Phase 3 — People list + Dependent Detail screen

---

## KEY FILES (update as project progresses)

```
care-command/
├── README.md                    -- Portfolio story (write in Phase 7)
├── HANDOFF.md                   -- THIS FILE (always keep updated)
├── package.json
├── next.config.js
├── .env.local                   -- Supabase URL, anon key, VAPID keys (NEVER commit)
├── public/
│   ├── manifest.json            -- PWA manifest
│   ├── sw.js                    -- Service worker (Phase 5)
│   └── icons/                   -- App icons for home screen
├── src/
│   ├── app/
│   │   ├── layout.js            -- Root layout
│   │   ├── page.js              -- Landing/redirect
│   │   └── h/
│   │       └── [householdKey]/
│   │           ├── page.js      -- Today screen (daily checklist)
│   │           ├── calendar/
│   │           │   └── page.js  -- Master calendar
│   │           ├── people/
│   │           │   └── page.js  -- Dependent list & profiles
│   │           └── procedure/
│   │               └── new/
│   │                   └── page.js  -- Procedure timeline builder
│   ├── components/
│   │   ├── MedCard.js           -- Single medication checkbox card
│   │   ├── TimeBlock.js         -- Group of meds for a time slot
│   │   ├── DependentBadge.js    -- Color-coded name badge
│   │   ├── BottomNav.js         -- Tab bar navigation
│   │   └── ...
│   └── lib/
│       ├── supabase.js          -- Supabase client init
│       ├── notifications.js     -- Push subscription helpers
│       └── time-utils.js        -- Date/time calculation helpers
├── supabase/
│   └── schema.sql               -- Database schema (see above)
└── vercel.json                  -- Cron job config
```

---

## DECISIONS LOG (append, never delete)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-05 | PWA, not native app | $0 cost, no App Store needed, works cross-platform |
| 2026-03-05 | Next.js + Supabase + Vercel | All free tier, one language (JS), strong portfolio signal |
| 2026-03-05 | No login, household key URL | Minimal friction for 2-household personal use |
| 2026-03-05 | Push notifications, not SMS | $0 ongoing cost, sufficient for personal use |
| 2026-03-05 | JavaScript, not TypeScript | Learning project, reduce complexity |
| 2026-03-05 | Prototype-first, then tutorial rebuild | De-risk architecture before investing in structured learning |
| 2026-03-05 | Used Claude Code for prototype scaffolding | Fast, effective, confirmed architecture works in one session |
| 2026-03-05 | Supabase connected, 3 tables created | dependents, medications, med_logs all working |
| 2026-03-05 | Prototype v1 built with Claude Code | Working but UX needs human-driven redesign |
| 2026-03-05 | Will use Codex for v2 frontend rebuild | Claude Code good for scaffolding, Codex may be stronger for bug-free code generation |
| 2026-03-05 | Supabase backend stays, only frontend rebuilds | Database, tables, seed data all reusable regardless of who writes the frontend |
| 2026-03-10 | Next.js version is 16.1.6, not 14 | package.json is source of truth; params requires React.use() |
| 2026-03-10 | Phase 1 built by Codex, reviewed by Claude | Claude as conductor, Codex as engineer, Yang as liaison |
| 2026-03-10 | RLS disabled on all tables for now | Personal-use app with household key access; revisit if app goes public |
| 2026-03-11 | Add Medication selected state strengthened | Blue-50 too subtle; added bg-blue-100 + checkmark icon for clarity |
| 2026-03-11 | Timing sub-options visually nested | Time pickers indented under parent button to avoid sibling confusion |
| 2026-03-11 | Back button works on all steps including Step 4 | User could get stuck on summary screen without it |
---

## ABOUT THE BUILDER

- Background: Fluid dynamics PhD (Yale), physics BS (Zhejiang University)
- Current: Associate scientist at Woods Hole Oceanographic Institution
- Coding experience: MATLAB (strong), Python (learning), n8n automation (built email triage system), JavaScript (learning through this project)
- Learning style: Prefers structured, phase-based approach with working increments
- Goal: Build freelance technical capability — "hand me a problem, I'll build you a solution"
- Native languages: English, Mandarin Chinese
