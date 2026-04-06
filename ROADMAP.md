# Echon Roadmap

> This is a living document. Milestones reflect current thinking and shift as real families use the app.
>
> **Our north star:** Any family in the world should be able to create their own private digital home — preserving their history, staying connected, and owning their data — forever.

---

## How We Think About Progress

We ask four questions before building anything:

1. **Does a real family need this right now?** User need beats developer preference.
2. **Does it make the app more reliable?** Foundation before features.
3. **Does it protect family data?** Privacy and security are always high priority.
4. **Can a non-technical person use it?** If grandma can't use it, it's not done.

Progress is measured not in features shipped, but in **experience milestones** — moments where a family feels something.

---

## Phase 1 — First Family ✅ (April 2026)

**Goal:** One real family can create and use Echon independently.

**What we shipped:**
- [x] Auth: register, login, JWT, profile photos
- [x] Family spaces: create, magic-link invitations, join flow, approval workflow
- [x] Entrance sequence (3-panel emotional journey) + door scene (4 arched doors)
- [x] Chat (real-time WebSocket) + presence ("home now" avatars)
- [x] Memories: photo/video/doc upload, timeline, reactions, comments, search, pin
- [x] Stories: voice recording upload and playback — distinct amber card UI
- [x] Family tree: card grid + interactive graph view (dagre auto-layout)
- [x] Activity feed (Now) with date grouping and birthday reminders
- [x] Member profiles with search, pagination, and action buttons
- [x] Notifications
- [x] Space settings (identity, members, pending approvals)
- [x] Landing page (dark luxury aesthetic, CandleFlame motif)
- [x] PWA: installable on Android/iOS via browser
- [x] VPS deployment: echon.app with Nginx + Docker

**Success metric:** ✅ The Çarkaxhia family is using it in the wild.

---

## Phase 2 — Solid Foundation (Q2 2026)

**Goal:** The app is reliable, maintainable, and ready for more families — not just one.

**Focus:**
- [ ] Alembic migrations — replace `Base.metadata.create_all`, proper schema versioning
- [ ] Backend test coverage ≥ 80%
- [ ] Replace all `alert()` calls with inline UI feedback
- [ ] Loading states / skeletons across feeds and tree
- [ ] Media improvements:
  - [ ] Image compression before upload (max 2 MB stored)
  - [ ] Thumbnail generation for memory feed
  - [ ] **Video story upload** (same flow as voice stories, max 50 MB)
- [ ] Error pages (404, 500, connection lost)
- [ ] One-command local setup (`./dev-setup.sh`)

**Success metric:** A second, unrelated family can set up and use Echon without our help.

---

## Phase 3 — Emotional Activation (Q3 2026)

**Goal:** The platform creates emotional value, not just utility. Families return regularly.

**Focus:**
- [ ] **Birthday & anniversary notifications** — push to Now feed, email reminder day-of
- [ ] **Family events** — add shared calendar events (weddings, reunions, milestones)
- [ ] **Google Play Store** via TWA (Trusted Web Activity) — wraps the existing PWA
- [ ] **Family Call** — one-button live voice/video via embedded Jitsi room
- [ ] Memory "On This Day" — surface old memories from same date in previous years
- [ ] @mentions in chat trigger notifications

**Success metric:** Members open the app at least once a week without a prompt.

---

## Phase 4 — Accessibility & Elders (Q3–Q4 2026)

**Goal:** Design for the grandparents, not the developers.

**Focus:**
- [ ] Elder simplified mode: larger text, fewer options, voice-first navigation
- [ ] Full keyboard navigation
- [ ] WCAG 2.1 AA compliance audit and fixes
- [ ] Reduced-motion mode (respects OS preference)
- [ ] RTL language support
- [ ] Localization — Albanian first, then expand (i18n infrastructure)

**Success metric:** An 80-year-old family member navigates independently on first use.

---

## Phase 5 — Privacy & Control (Q4 2026)

**Goal:** Families trust Echon with long-term, sensitive data.

**Focus:**
- [ ] Per-memory privacy: visible to all / selected members only
- [ ] Room-level privacy (some doors restricted to adults)
- [ ] **Data export** — download entire space as ZIP (photos, stories, tree, chat)
- [ ] Account deletion with full data wipe
- [ ] Audit log for founders (who joined, who left, who deleted what)
- [ ] Multi-admin spaces (currently only founder has admin rights)
- [ ] Legacy profiles — mark a member as deceased, preserve their content permanently

**Success metric:** Families say they trust Echon with irreplaceable memories.

---

## Phase 6 — Open Source Ecosystem (2027)

**Goal:** Grow a contributor community around Echon.

**Focus:**
- [ ] Modular, well-documented architecture
- [ ] Contributor guide + "good first issues" labelled in GitHub
- [ ] Developer onboarding (30-minute local setup, working sample space)
- [ ] Security audit by external party or community review
- [ ] Demo instance people can try before self-hosting

**Success metric:** Active external contributors — PRs merged from people we don't know.

---

## Phase 7 — Scale & Distribution (2027+)

**Goal:** Any family anywhere can run Echon on infrastructure they control.

**Focus:**
- [ ] One-click VPS deploy (single Docker Compose, pre-configured)
- [ ] Helm chart for Kubernetes
- [ ] Performance: 500+ members per space, 10,000+ memories
- [ ] Cross-space family tree connections (link people across two separate spaces)
- [ ] Guest view: share a memory publicly via link (no account required)
- [ ] Self-hosting documentation — comprehensive, beginner-friendly

**Success metric:** Multiple independent family deployments running globally without our involvement.

---

## Contributing to the Roadmap

Open an issue with the label `roadmap` and describe:
- What problem you're solving
- Who benefits (which family members, which situations)
- What "done" looks like — not technically, but experientially

We don't accept features that require third-party analytics, tracking, or paid cloud services to function. **Everything must work fully self-hosted.**
