# Echon Roadmap

> This is a living document. Milestones reflect our current thinking — they will shift as we learn from real families using the app.

---

## v0.1 — First Family ✅ (April 2026)

The Çarkaxhia Space. One real family using it in the wild.

**Done:**
- [x] Auth: register, login, JWT, profile photos
- [x] Family spaces: create, invite by code, join flow
- [x] Entrance sequence (3-panel emotional journey)
- [x] Door scene (4 arched doors → rooms)
- [x] Chat (real-time WebSocket)
- [x] Presence: "home now" avatars on door scene
- [x] Memories: photo/doc upload and feed
- [x] Stories: voice recording upload and playback
- [x] Family tree: Card View + interactive Graph View (dagre auto-layout)
- [x] Notifications: story creation, @mention in chat
- [x] Activity feed with date grouping
- [x] Invitation management (pending list, delete invites)
- [x] Member profiles (edit all fields, photo, password change)
- [x] Space settings (identity, members, invite, pending tabs)
- [x] Landing page (dark luxury, CandleFlame motif)
- [x] PWA: installable on Android/Samsung via Chrome
- [x] VPS deployment: echon.app with Nginx + Docker

---

## v0.2 — Solid Foundation (Q2 2026)

Make the app reliable and contributor-friendly before expanding features.

**Goals:**
- [x] Alembic migrations — models fully synced, `create_all` removed ✅
- [x] Playwright E2E tests — 11 tests, all passing ✅
- [x] Magic-link invitations — `echon.app/join/:token` deep link, no code typing ✅
- [ ] Backend unit/integration test coverage ≥ 80%
- [ ] Replace all `alert()` calls with inline UI feedback
- [ ] Loading states / skeletons across all feeds
- [ ] Media handling improvements:
  - [ ] Image compression before upload (max 2 MB stored)
  - [ ] Thumbnail generation for memory feed
  - [ ] **Video story upload** (record via camera, same flow as voice stories, max 50 MB)
- [ ] Error pages (404, 500, connection lost)
- [ ] One-command local setup script (`./dev-setup.sh`)

---

## v0.3 — Timeline + Platform (Q3 2026)

History browsing and first native distribution channel.

**Goals:**
- [x] Timeline view — memories browsable by decade (1960s, 1970s, ...) ✅
- [x] Date-tagging for memories (when did this happen, not just when uploaded) ✅
- [x] Reactions (❤️ 🕯️ 🙏) on memories and stories ✅
- [x] Comments on memories ✅
- [x] Search across memories and stories ✅
- [x] Pin important memories to the space home ✅
- [ ] **Google Play Store** via TWA (Trusted Web Activity)
  - Wraps the existing PWA using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
  - Requires: `/.well-known/assetlinks.json` on the server + signing keystore
  - No separate codebase — same web app, distributed through Play Store
  - Automatic updates (no store approval for UI changes)
- [ ] **Family Call** (live voice/video) via embedded Jitsi room
  - One "Call" button per space → opens a Jitsi room named after the space
  - Self-hostable (Jitsi is open-source) or use meet.jit.si for free
  - No WebRTC infrastructure to build — pure embed

---

## v0.4 — Accessibility & Elders (Q3–Q4 2026)

Design for the grandparents, not the developers.

**Goals:**
- [ ] Elder simplified mode: larger text, fewer options, voice-first navigation
- [ ] Full keyboard navigation
- [ ] WCAG 2.1 AA compliance audit and fixes
- [ ] Reduced-motion mode (respects OS preference)
- [ ] RTL language support
- [ ] Localization infrastructure (i18n) — Albanian first, then expand

---

## v0.5 — Privacy & Control (Q4 2026)

Trust requires control.

**Goals:**
- [ ] Per-memory privacy: visible to all / selected members only
- [ ] Room-level privacy (some doors restricted to adults)
- [ ] Data export: download your entire space as a ZIP (photos, stories, tree)
- [ ] Account deletion with full data wipe
- [ ] Audit log for space admins (who joined, who left, who deleted what)
- [ ] Multi-admin spaces (currently only founder has admin rights)

---

## v0.6 — Connections (2027)

Families aren't one room. They're a web of spaces.

**Goals:**
- [ ] Cross-space family tree connections (link people across two separate family spaces)
- [ ] Guest view: share a memory or story publicly via link (no account required)
- [ ] Family milestone events: birthdays, anniversaries as first-class objects
- [ ] Push notifications (web push for new memories, stories)

---

## v1.0 — Public Release (2027)

Ready for anyone to use or self-host with confidence.

**Goals:**
- [ ] One-click deploy: Docker Compose with everything pre-configured
- [ ] Helm chart for Kubernetes deployment
- [ ] Comprehensive self-hosting documentation
- [ ] Security audit (by external party or community review)
- [ ] Performance: support 500+ members per space, 10,000+ memories
- [ ] Automated backup and restore tooling
- [ ] Community contributor guide + governance model
- [ ] Demo instance for people to try before self-hosting

---

## Principles for Prioritization

When deciding what to build next, we ask:

1. **Does a real family need this right now?** (User need beats developer preference)
2. **Does it make the app more reliable?** (Foundation before features)
3. **Does it protect family data?** (Privacy and security are always high priority)
4. **Can a non-technical person use it?** (If grandma can't use it, it's not done)

---

## How to Contribute to the Roadmap

Open an issue with the label `roadmap` and describe:
- What problem you're solving
- Who benefits
- What "done" looks like

We don't accept features that require third-party analytics, tracking, or paid cloud services to function. Everything must work fully self-hosted.
