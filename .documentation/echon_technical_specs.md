# ECHON MVP — Technical Specifications

## Product Vision Summary

**Echon** is a private family space platform that allows families worldwide to create their own isolated, invitation-only communities for sharing memories, stories, and staying connected across generations and distances.

**Core Principle:** Each family's space is completely separate. The "Çarkaxhia Space" cannot see the "Silva Space" — total privacy, no cross-family interaction.

---

## MVP SCOPE (Version 1.0 - Launch Ready)

### What We MUST Build (Non-Negotiable):

1. ✅ Founder onboarding (create family space)
2. ✅ Invitation system (invite via email/SMS/WhatsApp link)
3. ✅ Member authentication (secure login)
4. ✅ Three upload types: stories (text), photos, voice recordings
5. ✅ Timeline view (chronological + sortable by decade)
6. ✅ Family profiles (pages for each person)
7. ✅ Privacy controls (who can see each post)
8. ✅ Comments & reactions (basic engagement)
9. ✅ Dual-root family system (two surname lineages)
10. ✅ Elder-friendly simplified interface
11. ✅ Mobile-responsive web app (works on phone browsers)
12. ✅ Data export (users can download their contributions)

### What We DON'T Build Yet (Version 2.0+):

- ❌ Native iOS/Android apps (web-first)
- ❌ Video calls (use Zoom/Meet integration)
- ❌ AI transcription (manual for now)
- ❌ Auto-translation (English/Albanian only manually)
- ❌ Advanced genealogy tools (tree visualizations)
- ❌ Collaborative editing (Google Docs-style)
- ❌ Map view (text-based location for now)

---

## TECHNICAL STACK

### Frontend:
**Framework:** React 18+ (TypeScript)
**Styling:** Tailwind CSS (for rapid UI development)
**State Management:** React Query + Context API
**Routing:** React Router v6
**Forms:** React Hook Form + Zod validation

**Why:** 
- Fast development
- Mobile-responsive by default
- Large ecosystem for future features

---

### Backend:
**Framework:** Node.js + Express (TypeScript)
**Database:** PostgreSQL 15+
**File Storage:** AWS S3 or Cloudflare R2 (for photos/audio)
**Authentication:** Auth0 or custom JWT
**Real-time:** Socket.io (for live updates, optional MVP)

**Why:**
- Scalable (can handle 100,000+ family spaces)
- PostgreSQL perfect for relational family data
- S3 industry standard for media storage

---

### Infrastructure:
**Hosting:** 
- Backend: Railway / Render / Fly.io (easy deploy)
- Frontend: Vercel / Netlify
- Database: Managed PostgreSQL (Railway / Supabase)
- Storage: Cloudflare R2 (cheaper than S3)

**CDN:** Cloudflare (fast global access)
**Email/SMS:** Twilio (SendGrid for email)
**Monitoring:** Sentry (error tracking)

**Why:**
- Start small, scale later
- Minimal DevOps overhead
- Focus on features, not infrastructure

---

## DATABASE SCHEMA (Core Tables)

### 1. `family_spaces`
```sql
CREATE TABLE family_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- "Çarkaxhia"
    secondary_name VARCHAR(255), -- "Çulaj" (optional)
    origin_location TEXT, -- "Albania, Kosovo"
    created_at TIMESTAMP DEFAULT NOW(),
    settings JSONB -- privacy rules, who can invite, etc.
);
```

### 2. `members`
```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_space_id UUID REFERENCES family_spaces(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50), -- 'founder', 'elder', 'member', 'guest'
    birth_year INTEGER,
    birth_location TEXT,
    generation VARCHAR(50), -- 'elder', 'middle', 'younger'
    profile_photo_url TEXT,
    simplified_mode BOOLEAN DEFAULT FALSE, -- elder-friendly UI
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);
```

### 3. `invitations`
```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_space_id UUID REFERENCES family_spaces(id),
    invited_by UUID REFERENCES members(id),
    invitee_name VARCHAR(255),
    invitee_contact VARCHAR(255), -- email or phone
    personal_message TEXT,
    token VARCHAR(255) UNIQUE, -- unique invite link
    status VARCHAR(50), -- 'pending', 'accepted', 'expired'
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. `posts` (Stories, Photos, Voice Memos)
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_space_id UUID REFERENCES family_spaces(id),
    author_id UUID REFERENCES members(id),
    type VARCHAR(50), -- 'story', 'photo', 'voice', 'document'
    content TEXT, -- story text or description
    file_url TEXT, -- S3 URL for media
    file_type VARCHAR(50), -- 'image/jpeg', 'audio/mp3', 'application/pdf'
    date_of_memory DATE, -- when the memory happened (not when posted)
    location_of_memory TEXT, -- "Gjakova, Kosovo"
    decade VARCHAR(10), -- "1950s", "1990s" (for timeline sorting)
    privacy_level VARCHAR(50), -- 'everyone', 'circle', 'private'
    privacy_list JSONB, -- [member_ids] if 'circle'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### 5. `comments`
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES members(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. `reactions` (Hearts, etc.)
```sql
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id),
    type VARCHAR(50), -- 'heart', 'thankful', etc.
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, member_id, type) -- one reaction per person per type
);
```

### 7. `family_members` (Not users, but people in the tree)
```sql
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_space_id UUID REFERENCES family_spaces(id),
    linked_member_id UUID REFERENCES members(id), -- if this person is a user
    name VARCHAR(255) NOT NULL,
    birth_year INTEGER,
    death_year INTEGER,
    birth_location TEXT,
    lineage VARCHAR(50), -- 'paternal', 'maternal', 'both'
    is_memorial BOOLEAN DEFAULT FALSE, -- deceased
    profile_photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8. `tags` (Tag people in photos)
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API ENDPOINTS (MVP)

### Authentication:
```
POST   /api/auth/signup          (Create founder account)
POST   /api/auth/login           (Login with email/phone)
POST   /api/auth/logout
GET    /api/auth/me              (Get current user)
```

### Family Space:
```
POST   /api/spaces               (Create new family space)
GET    /api/spaces/:id           (Get space details)
PATCH  /api/spaces/:id           (Update space settings)
GET    /api/spaces/:id/members   (List all members)
```

### Invitations:
```
POST   /api/invitations                    (Send invite)
GET    /api/invitations/:token             (Validate invite link)
POST   /api/invitations/:token/accept      (Join via invite)
```

### Posts (Memories):
```
POST   /api/spaces/:id/posts               (Create post)
GET    /api/spaces/:id/posts               (List posts - paginated)
GET    /api/spaces/:id/posts/:postId       (Single post)
PATCH  /api/spaces/:id/posts/:postId       (Edit post)
DELETE /api/spaces/:id/posts/:postId       (Delete post)
POST   /api/spaces/:id/posts/:postId/react (Add reaction)
```

### Comments:
```
POST   /api/posts/:id/comments             (Add comment)
GET    /api/posts/:id/comments             (List comments)
DELETE /api/comments/:id                   (Delete own comment)
```

### File Upload:
```
POST   /api/upload/photo                   (Upload image → S3)
POST   /api/upload/audio                   (Upload voice memo → S3)
POST   /api/upload/document                (Upload PDF/doc → S3)
```

### Family Members (People in tree):
```
POST   /api/spaces/:id/family-members      (Add person)
GET    /api/spaces/:id/family-members      (List all people)
PATCH  /api/spaces/:id/family-members/:id  (Edit person)
```

### Export:
```
GET    /api/members/:id/export             (Download all my contributions as ZIP)
```

---

## SECURITY & PRIVACY

### Access Control:
- Each API call checks: "Does this user belong to this family space?"
- Posts respect privacy settings (server-side checks)
- No cross-space queries (each space is isolated)

### Data Encryption:
- All data in transit: HTTPS (TLS 1.3)
- Sensitive fields at rest: AES-256 encryption
- Passwords: bcrypt hashing (cost factor 12)

### File Security:
- S3 buckets: Private (not public)
- Pre-signed URLs (expire after 1 hour)
- No direct file links (prevents external sharing)

### GDPR Compliance:
- Users can export all data (JSON + files)
- Users can delete account + all contributions
- Data retention: No deletion unless user requests
- Cookie consent: Yes (required in EU)

---

## FILE UPLOAD SPECIFICATIONS

### Image Processing:
**Original:** Store as-is (up to 10 MB)
**Thumbnail:** 300x300px (for timeline view)
**Display:** 1200px max width (for detail view)

**Accepted formats:** JPG, PNG, HEIC
**Metadata preserved:** EXIF data (date, location if available)

### Audio Processing:
**Format:** MP3 (convert from any format)
**Bitrate:** 128kbps (voice quality, small file)
**Max length:** Unlimited (but warn if >30 min)

**Accepted formats:** MP3, M4A, WAV

### Document Processing:
**Accepted:** PDF, DOC, DOCX, TXT
**Max size:** 50 MB per file
**Preview:** Generate thumbnail (first page for PDFs)

---

## FRONTEND PAGES (MVP)

### Public Pages (No Login Required):
1. `/` - Landing page (What is Echon?)
2. `/login` - Login page
3. `/invite/:token` - Accept invitation

### Authenticated Pages:
4. `/onboarding` - Create family space (founder flow)
5. `/spaces/:id/home` - Family space homepage
6. `/spaces/:id/memories` - Timeline view
7. `/spaces/:id/family` - People in the family
8. `/spaces/:id/talk` - Conversations
9. `/spaces/:id/settings` - Space settings (founders only)
10. `/profile` - User profile (personal settings)

---

## UI COMPONENTS (Reusable)

### Core Components:
- `<Timeline>` - Chronological post feed
- `<PostCard>` - Display story/photo/voice memo
- `<CommentThread>` - Comments on a post
- `<UploadModal>` - Upload photo/audio/story
- `<InviteModal>` - Invite new member
- `<FamilyMemberCard>` - Profile card for a person
- `<PrivacySelector>` - Choose who can see a post
- `<VoiceRecorder>` - Record audio (Web Audio API)
- `<ElderSimpleView>` - Simplified interface toggle

---

## PERFORMANCE TARGETS

### Page Load Times:
- Homepage: <2 seconds (first load)
- Post upload: <5 seconds (with image)
- Timeline scroll: Infinite scroll (smooth)

### File Upload:
- Image: <10 seconds (10 MB file)
- Audio: <15 seconds (5 min recording)

### Concurrent Users:
- MVP: Support 1,000 concurrent users
- Scale: 10,000+ by v2.0

---

## MONITORING & ANALYTICS

### What We Track (Privacy-First):
✓ Space creation rate (how many families joining)
✓ Upload frequency (stories, photos, audio)
✓ Invitation acceptance rate
✓ Error logs (crashes, failed uploads)

### What We DON'T Track:
✗ Content of posts (never read family stories)
✗ Photo content analysis (no facial recognition)
✗ Individual user behavior (no "user clicked X")
✗ Third-party analytics (no Google Analytics)

**Tool:** Custom analytics dashboard (self-hosted)

---

## DEVELOPMENT PHASES

### Phase 1: Foundation (Weeks 1-4)
- [ ] Database schema
- [ ] Authentication system
- [ ] Family space creation flow
- [ ] Basic post creation (text only)
- [ ] Invitation system

**Milestone:** You can create Çarkaxhia Space and invite Masar

---

### Phase 2: Media & Timeline (Weeks 5-8)
- [ ] Photo upload
- [ ] Voice recording
- [ ] Timeline view (chronological + decade sorting)
- [ ] Comments & reactions
- [ ] Privacy controls

**Milestone:** Masar can upload a photo and record a voice memo

---

### Phase 3: Polish & Launch Prep (Weeks 9-12)
- [ ] Elder-friendly simplified mode
- [ ] Mobile-responsive design (all pages)
- [ ] Data export feature
- [ ] Error handling (graceful failures)
- [ ] Email/SMS invitations (Twilio)
- [ ] Help documentation

**Milestone:** 5 beta families actively using Echon

---

### Phase 4: Beta Testing (Months 4-6)
- [ ] Invite 100 families
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Accessibility improvements (screen readers, keyboard nav)

**Milestone:** Public launch ready

---

## TESTING STRATEGY

### Unit Tests:
- API endpoints (Jest + Supertest)
- Database queries (pg-mem)
- File upload validation

### Integration Tests:
- Full user flows (create space → invite → join → post)
- Privacy controls (user A can't see user B's private posts)

### Manual Testing:
- Elder usability testing (watch them use it)
- Mobile testing (iOS Safari, Android Chrome)
- Slow internet testing (3G simulation)

**Coverage Goal:** 80% code coverage

---

## LOCALIZATION (Future)

### Phase 1 (MVP):
- English interface only
- Users can post in any language

### Phase 2 (Post-Launch):
- Albanian interface
- German interface
- Auto-detect user language preference

### Phase 3 (Scale):
- Top 20 diaspora languages
- Community-contributed translations

---

## COST ESTIMATES (Monthly, MVP Scale)

### Infrastructure:
- Backend hosting (Railway): $20/mo
- Database (PostgreSQL): $15/mo
- File storage (Cloudflare R2): $10/mo (first 10 GB free)
- CDN (Cloudflare): Free tier
- Email/SMS (Twilio): $50/mo (estimate)
- Monitoring (Sentry): Free tier

**Total:** ~$100/mo (for first 100 families)

### As We Scale (1,000 families):
- Backend: $100/mo
- Database: $50/mo
- Storage: $100/mo (10 TB)
- Twilio: $200/mo

**Total:** ~$500/mo

**Revenue needed:** 50 paying families ($10/mo) = break-even

---

## LAUNCH CHECKLIST

### Pre-Launch:
- [ ] Legal: Privacy Policy, Terms of Service
- [ ] Security audit (penetration testing)
- [ ] Backup system (daily database backups)
- [ ] Domain name: echon.app (registered)
- [ ] SSL certificate (Let's Encrypt)
- [ ] Support email: support@echon.app

### Launch Day:
- [ ] Deploy to production
- [ ] Create Çarkaxhia Space (first family)
- [ ] Invite 5 beta families
- [ ] Monitor error logs (24-hour watch)

### Post-Launch:
- [ ] Weekly user interviews
- [ ] Bug fixes (respond <48 hours)
- [ ] Feature requests (track in GitHub issues)

---

## SUCCESS METRICS (Year 1)

### Quantitative:
- 100 active family spaces
- 1,000 total members
- 10,000 memories uploaded
- 70% invitation acceptance rate
- <1% churn rate (families leaving)

### Qualitative:
- Elders successfully using the platform
- Families report feeling more connected
- Stories preserved that would otherwise be lost
- Positive word-of-mouth referrals

---

## RISKS & MITIGATIONS

### Risk 1: Elders can't figure out technology
**Mitigation:** 
- Simplified mode by default for 65+
- Phone support (human help)
- Printed instruction booklets

### Risk 2: Low adoption (nobody invites family)
**Mitigation:**
- Make first invite mandatory (onboarding step)
- Show value immediately (pre-populate with example content)
- Founder success stories (testimonials)

### Risk 3: Privacy breach (data leak)
**Mitigation:**
- Regular security audits
- Bug bounty program
- Immediate response plan (notify affected families <24h)

### Risk 4: Unsustainable costs (storage explodes)
**Mitigation:**
- Compression (reduce file sizes)
- Tiered pricing (heavy users pay more)
- Archive old content (cold storage)

---

## ROADMAP (Post-MVP)

### Version 2.0 (Months 7-12):
- Native mobile apps (iOS, Android)
- Video upload (short videos)
- AI transcription (voice → text)
- Auto-translation (25+ languages)
- Family tree visualization

### Version 3.0 (Year 2):
- Video calls (built-in, no Zoom)
- Collaborative storytelling (multiple authors)
- Map view (interactive world map)
- DNA integration (upload 23andMe data)
- Historical context AI (explain events from family's era)

### Version 4.0 (Year 3):
- Public memorial pages (opt-in, for deceased)
- Book printing (export space as physical photo book)
- Genealogy research assistance (AI + human experts)
- NFT certificates (blockchain-based family records)

---

## TEAM REQUIREMENTS (MVP)

### Core Team:
- 1 Full-stack developer (you + contractor?)
- 1 UI/UX designer (part-time)
- 1 QA tester (part-time)

### Advisors:
- 1 Elder advocate (test with real grandparents)
- 1 Privacy lawyer (GDPR compliance)
- 1 Genealogist (validate approach)

### Timeline: 4-6 months to MVP

---

## COMPETITOR ANALYSIS

### Similar Products:
1. **MyHeritage** - Focus: Genealogy trees
   - What they do well: DNA matching, huge database
   - What we do better: Living connection, privacy, storytelling

2. **FamilySearch** - Focus: Historical records
   - What they do well: Free, massive archive
   - What we do better: Modern UI, private spaces, elders

3. **WhatsApp Family Groups** - Focus: Chat
   - What they do well: Familiar, easy to use
   - What we do better: Organized, permanent, multimedia

**Echon's Unique Position:** 
We're the ONLY platform designed for:
- Completely private family spaces
- Elder-first design
- Preserving stories + staying connected
- No genealogy gatekeeping (oral history = valid)

---

## END OF TECHNICAL SPECIFICATIONS

**Version 1.0 - MVP Scope**
**Last Updated: January 2026**

---

Ready to build when you are.
Next step: Choose tech stack + start Phase 1.