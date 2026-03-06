# Care Command: Project Plan & Learning Curriculum

## Origin Story (Your Portfolio Narrative)

A friend — solo caregiver for three elderly parents and a child — described the cognitive overload of managing 12+ daily medications across multiple people while simultaneously coordinating procedure prep timelines (colonoscopy, surgeries) with complex medication hold/resume schedules. She said: "I have to calculate everything myself — when to stop eating, when to drink the prep in two split doses, which of my dad's dozen medications to pause and when to restart them. Nobody tells us this clearly. Multiply this by three people and that's my daily stress."

I researched every caregiver app on the market (Medisafe, CareClinic, CareZone, Caring Village, CareMobi, Connected Caregiver, ianacare, and others). I downloaded and tested the top-rated ones firsthand. Findings:

- No app handles the "one caregiver, multiple dependents" use case well — most are architected around "one patient, multiple caregivers" (the opposite problem)
- CareClinic, the most feature-rich option, was glitchy, aggressive with upsells, and had a broken dependent-adding flow
- No app offers procedure prep timeline functionality (countdown-based medication hold/resume schedules)
- Real users on forums don't recommend any caregiver-specific app — they default to Apple Health + pill boxes + spreadsheets
- The "Top 10 Caregiver Apps" content ecosystem is almost entirely SEO marketing, not based on real testing

So I built the tool myself.

---

## What We're Building

**Care Command** — a Progressive Web App (PWA) for solo caregivers managing medical care for multiple dependents.

**Core features:**
1. Multi-dependent profiles with color coding
2. Medication management with daily toggle checklists
3. Master calendar showing all dependents' events overlaid
4. Procedure prep timeline builder (countdown-based, with medication hold/resume)
5. Push notifications for medication reminders and procedure prep alerts

**Design principles:**
- Zero learning curve (if CareClinic confused me, it'll confuse my friend)
- Calming, not anxiety-inducing (soft blues, sage greens, amber for alerts — never red)
- Large tap targets, card-based layout, no deep menus
- No upsells, no ads, no account creation barriers
- Works beautifully on phone AND desktop (responsive design)

---

## Tech Stack

| Layer | Technology | Why | Cost |
|-------|-----------|-----|------|
| Framework | Next.js 14 (App Router) | Industry-standard, great for portfolio, handles frontend + backend in one codebase | Free |
| Styling | Tailwind CSS | Fast, beautiful, mobile-first, huge community | Free |
| Database | Supabase (Postgres) | Free tier = 500MB, real SQL database, built-in auth if needed later | Free |
| Hosting | Vercel | Free tier includes serverless functions + cron jobs, perfect for Next.js | Free |
| Notifications | Web Push API + service worker | Native-feeling push notifications, no SMS cost | Free |
| Domain | Optional (yourname.vercel.app works) | Custom domain ~$12/year if you want one | $0-12/yr |

**Total ongoing cost: $0/month** (optionally $1/month for a custom domain)

---

## Learning Curriculum: 7 Phases

Each phase is a self-contained lesson that:
- Teaches specific web development concepts
- Produces a working, demonstrable increment
- Can be completed in 1-3 sessions (a few hours each)
- Builds on the previous phase without requiring rework

### Prerequisites
- A computer with Node.js installed
- A code editor (VS Code, free)
- A GitHub account (free — your code lives here, also part of portfolio)
- A Supabase account (free)
- A Vercel account (free)

---

### Phase 1: "Hello, Beautiful Screen"
**What you build:** A static, pixel-perfect "Today" checklist screen — hardcoded data, no database, but it looks production-ready on a phone.

**What you learn:**
- How a Next.js project is structured (files → pages)
- HTML fundamentals: divs, headings, buttons, semantic markup
- Tailwind CSS: utility classes, responsive design (mobile-first), color palette
- How to think in components (even before React — just visual blocks)
- How to test on your actual phone (localhost + same wifi, or Vercel preview deploy)

**Concepts introduced:**
- The box model (padding, margin, border)
- Flexbox layout
- Mobile-first responsive design (`sm:`, `md:`, `lg:` breakpoints)
- Color systems and design tokens
- PWA basics: manifest.json, viewport meta tag

**Deliverable:** A URL you can open on your phone that shows a beautiful daily medication checklist with hardcoded data for "Dad" with 5 medications. Checkboxes are tappable. It looks like a real app. It does nothing yet — but it looks ready.

**Portfolio value:** "I can take a design concept and turn it into a polished, responsive UI."

---

### Phase 2: "Make It Think"
**What you build:** The checklist becomes interactive — tapping a checkbox actually toggles it, you can switch between time-of-day sections, and the data is structured (but still local, no database yet).

**What you learn:**
- React fundamentals: components, props, JSX
- State management with useState
- Event handling (onClick, onChange)
- Array methods (map, filter) for rendering lists
- Thinking in data: separating data structure from visual presentation

**Concepts introduced:**
- Component composition (MedCard inside TimeBlock inside DayView)
- Lifting state up
- Conditional rendering
- JavaScript objects and arrays as "fake databases"

**Deliverable:** Same beautiful screen, but now interactive. Tap a med → it checks off with a timestamp. A progress bar updates. Multiple time blocks (Morning, Noon, Evening) are expandable/collapsible.

**Portfolio value:** "I understand component architecture and state management."

---

### Phase 3: "Make It Remember"
**What you build:** Connect to Supabase. Now medications, dependents, and check-off history are stored in a real database. Data persists across sessions and devices.

**What you learn:**
- What a relational database is (tables, rows, columns, foreign keys)
- Designing a data schema from requirements
- Supabase client setup and CRUD operations
- Async/await and handling loading states
- Environment variables (keeping secrets out of code)

**Concepts introduced:**
- Database schema design:
  - `dependents` table (id, name, color, photo_url)
  - `medications` table (id, dependent_id, name, dosage, frequency, times[])
  - `med_logs` table (id, medication_id, date, time_scheduled, time_taken, status)
- One-to-many relationships (one dependent → many medications)
- SQL basics through Supabase dashboard
- Row Level Security (RLS) concept

**Deliverable:** The app now works for real. Add a dependent, add their medications, check them off, close the browser, reopen it — everything is still there. Your friend could start using it TODAY for the daily checklist alone.

**Portfolio value:** "I can design a database schema and build a full-stack application."

---

### Phase 4: "Make It Know Everyone"
**What you build:** Multi-dependent support — add multiple people, each with their own color-coded profile, medications, and schedules. The Today screen shows everyone together. A master calendar view shows all appointments overlaid.

**What you learn:**
- Data filtering and grouping in the UI
- Tab/navigation patterns
- Calendar UI libraries (or building a simple one)
- Color-coding as a UX system
- Managing related data across multiple tables

**Concepts introduced:**
- Dynamic routing in Next.js (`/dependent/[id]`)
- Data joins (fetching medications with their dependent info)
- UI state vs. server state
- Simple calendar grid layout
- Appointment/event data model

**Deliverable:** Full multi-dependent dashboard. Your friend adds Dad (blue), Mom (green), Father-in-law (amber), Kid (purple). The Today screen groups meds by time with color-coded cards. The Calendar screen shows a week view with everyone's appointments overlaid in their colors.

**Portfolio value:** "I can build complex, multi-entity data interfaces that are intuitive to use."

---

### Phase 5: "Make It Warn Me"
**What you build:** Push notifications — the app reminds you when medications are due, follows up if you don't check them off, and sends procedure-related alerts.

**What you learn:**
- Service workers: what they are, how they enable offline + push
- The Web Push API and notification permissions
- Vercel cron jobs (scheduled serverless functions)
- The push notification subscription flow
- Notification UX: when to notify, how to word it, when to stop

**Concepts introduced:**
- Service worker lifecycle (install, activate, fetch, push)
- VAPID keys for web push authentication
- Cron job scheduling syntax
- Background sync concepts
- PWA "install" prompt and manifest.json refinement

**Deliverable:** Install the PWA on your phone. Grant notification permission. At medication time, your phone buzzes with a notification showing which person, which meds, which dosage. If not checked off in 30 minutes, a follow-up arrives. This is the moment it becomes a real daily-use tool.

**Portfolio value:** "I can build production notification systems and background processes."

---

### Phase 6: "Make It Handle Crises"
**What you build:** The procedure prep timeline builder — the killer feature that no existing app offers.

**What you learn:**
- Complex form design (dynamic row addition/removal)
- Relative time calculations (T-minus hours/days from a reference datetime)
- State machines: how a medication transitions between "active," "paused," and "resumed"
- Template systems (pre-built timeline templates that can be customized)
- Edge cases and defensive programming

**Concepts introduced:**
- Dynamic form patterns (add row, remove row, reorder)
- Date/time arithmetic with JavaScript Date or a library like date-fns
- Enum states for medication status
- JSON templates as a "protocol library"
- Cascading data effects (pausing a med should stop its daily reminders)

**Deliverable:** Your friend taps "New Procedure" on Dad's profile, enters "Colonoscopy, Thursday 10AM." She's presented with a timeline editor. She fills in rows from the discharge paper:
- T-7 days: Stop Warfarin
- T-24 hours: Clear liquids only
- T-18 hours: First prep dose
- T-7 hours: Second prep dose
- T-4 hours: Nothing by mouth
- T+2 hours: Clear liquids OK
- T+24 hours: Resume Metformin
- T+48 hours: Resume Warfarin

She saves it. Warfarin disappears from Dad's daily checklist (marked "paused — colonoscopy"). The calendar shows a colored block. Push notifications fire at each countdown milestone. After the procedure, post-op items appear automatically.

**Portfolio value:** "I can build complex workflow engines with real-world state management."

---

### Phase 7: "Make It Shine"
**What you build:** Polish, edge cases, and the touches that make it feel professional.

**What you learn:**
- Loading states, error handling, empty states
- Accessibility basics (screen readers, contrast ratios, tap target sizes)
- Performance optimization (lazy loading, efficient re-renders)
- Data export (generate a PDF medication summary for doctor visits)
- How to write a README that tells the portfolio story

**Concepts introduced:**
- Error boundaries in React
- Skeleton loading patterns
- Lighthouse audit and PWA checklist
- Simple PDF generation (html-to-pdf or jsPDF)
- GitHub README as portfolio storytelling

**Deliverable:** The app passes a Lighthouse audit with high scores. It handles edge cases gracefully (no meds yet? helpful empty state. Lost internet? offline mode shows cached data). Your friend can export a "Medication Summary for Dr. Chen" PDF before an appointment. Your GitHub README tells the full story: problem → research → design → build.

**Portfolio value:** "I ship polished products, not just prototypes."

---

## Database Schema (Preview)

```
dependents
├── id (uuid, primary key)
├── name (text)
├── color (text, hex code)
├── photo_url (text, optional)
├── created_at (timestamp)

medications
├── id (uuid, primary key)
├── dependent_id (uuid, foreign key → dependents)
├── name (text)
├── dosage (text, e.g., "10mg")
├── frequency (text, e.g., "twice daily")
├── times (text[], e.g., ["07:00", "19:00"])
├── notes (text, optional)
├── status (text: "active" | "paused" | "discontinued")
├── pause_reason (text, optional, e.g., "colonoscopy prep")
├── created_at (timestamp)

med_logs
├── id (uuid, primary key)
├── medication_id (uuid, foreign key → medications)
├── date (date)
├── time_scheduled (time)
├── time_taken (timestamp, nullable)
├── status (text: "taken" | "missed" | "skipped")

appointments
├── id (uuid, primary key)
├── dependent_id (uuid, foreign key → dependents)
├── title (text)
├── date (timestamp)
├── location (text, optional)
├── notes (text, optional)
├── type (text: "routine" | "procedure" | "follow-up")

procedures
├── id (uuid, primary key)
├── dependent_id (uuid, foreign key → dependents)
├── name (text, e.g., "Colonoscopy")
├── procedure_datetime (timestamp)
├── status (text: "upcoming" | "prep_active" | "completed")
├── created_at (timestamp)

procedure_steps
├── id (uuid, primary key)
├── procedure_id (uuid, foreign key → procedures)
├── offset_minutes (integer, negative = before, positive = after)
├── instruction (text)
├── step_type (text: "info" | "medication_pause" | "medication_resume" | "task")
├── linked_medication_id (uuid, optional, foreign key → medications)
├── completed (boolean)
├── completed_at (timestamp, nullable)
├── sort_order (integer)

push_subscriptions
├── id (uuid, primary key)
├── endpoint (text)
├── keys_p256dh (text)
├── keys_auth (text)
├── created_at (timestamp)
```

---

## Suggested Timeline

| Phase | Estimated Time | Milestone |
|-------|---------------|-----------|
| Phase 1 | 1 weekend | Beautiful static screen on your phone |
| Phase 2 | 1 weekend | Interactive checklist, feels like a real app |
| Phase 3 | 1-2 weekends | Database connected, data persists — USABLE |
| Phase 4 | 1 weekend | Multi-dependent, calendar — GIFT-READY |
| Phase 5 | 1-2 weekends | Push notifications — DAILY DRIVER |
| Phase 6 | 1-2 weekends | Procedure prep timelines — THE DREAM |
| Phase 7 | 1 weekend | Polish, PDF export, portfolio README |

**Total: ~7-10 weekends** to go from zero to the full dream app.

Your friend can start using it after Phase 3 (daily med checklist that works).
The "killer feature" (procedure prep) lands in Phase 6.
The portfolio piece is complete after Phase 7.

---

## What This Demonstrates on Your Resume

For freelance clients who want to hand you a problem:

1. **Problem discovery:** You didn't just build what was asked — you researched the market, tested competitors firsthand, identified the real gap
2. **Product thinking:** You designed a solution based on actual user pain, not feature checklists
3. **Technical execution:** Full-stack PWA with real-time notifications, complex state management, responsive design
4. **Pragmatic architecture:** Chose a stack that costs $0/month to run, no over-engineering
5. **User empathy:** Every design decision traced back to a real person's real stress

**One-liner for your resume/portfolio:**
"Built a full-stack Progressive Web App for multi-dependent medical care coordination — featuring real-time push notifications, procedure prep countdown timelines, and daily medication tracking — after researching and testing every major caregiver app on the market and finding none that solved the core problem."

---

## How to Start

When you're ready for Phase 1, open a new conversation and say:
"Let's start Phase 1 of Care Command. I want to set up the Next.js project and build the static Today screen."

Bring this document with you. We'll work through it step by step.
