product: "Sing for Hope — Hybrid Contact Experience"
version: "1.0.0"
author: "SFH Web Team"
date: "2025-09-04"
status: "In Development"
0. TL;DR

A hybrid Contact experience (dynamic form + live chat) that adapts to user intent, validates inputs in real time, sends ticketed confirmations, and routes submissions to the right team with 24-hour reminders and 48-hour escalations. Built for WCAG 2.1 AA, protected by reCAPTCHA + honeypot, and backed by reliable email delivery (SendGrid/Mailgun), this upgrade ensures fast, accessible, and secure communication for press, volunteers, donors, and the public.

1. Executive Summary
1.1 Product Overview

Create a toggle-enabled contact surface offering (a) a dynamic, context-aware form and (b) a smart chat widget. Both paths capture intent, provide instant feedback, and guarantee tracked follow-ups.

1.2 Key Objectives

Reduce time-to-first-response (TTFR) to < 6 business hours (median) within 60 days of launch.

Increase completion rate of contact attempts by 25% vs. current baseline.

SLA adherence: ≥ 95% of inquiries receive a human response within 48 hours.

Accessibility: Achieve WCAG 2.1 AA conformance verified via audits at launch.

1.3 Key Features

Dual mode: Dynamic Form ↔ Chat Widget (user-toggle, shared context).

Adaptive fields by inquiry type (Press/Volunteer/Donor/General) with real-time validation.

On-page submission toast, ticketed confirmation email, and personalized next steps.

Intent classification pipeline powering tailored responses and internal routing.

24h reminder / 48h escalation automation; conditional internal notifications.

Spam defense (invisible reCAPTCHA + honeypot) and reliable email delivery.

ADA/WCAG 2.1 AA design, privacy consent, and 30-day submission logging.

1.4 Stakeholders & Roles
Role	Responsibilities	Decision Authority
Executive/Comms Lead	Messaging, press priorities	Final content & press SLAs
Digital Comms Director	Product owner, KPIs, approvals	Feature & roadmap priority
Web/Platform Team	Build, QA, ops	Technical architecture
Programs (Volunteer/Donor)	Triage & reply	Queue ownership
Support Moderators	Inbox hygiene, escalations	Day-to-day routing decisions
1.5 Risks & Mitigations

Inbox overload → Conditional notifications; priority rules; dashboards.

Spam bursts → reCAPTCHA score thresholds + honeypot + rate limits.

Deliverability issues → Authenticated ESP (SPF/DKIM/DMARC), retries, fallbacks.

Accessibility gaps → Pre-launch WCAG audit + regressions in CI.

2. Goals, Context & Problem Statement
2.1 Goals & Objectives

Improve reachability, speed, and clarity of SFH communications while lowering team toil via automation and intent-aware routing.

2.2 Background & Target Audience

Primary: Press, Volunteers, Donors, Program/community inquiries. Needs: fast routing, clarity, and accessible UX.

2.3 Current State

Traditional form w/ limited validation, mixed deliverability, manual routing, and uneven follow-ups; no unified chat channel.

2.4 Problem Statement

How can SFH offer a fast, inclusive, low-friction contact surface that adapts to intent, ensures tracked follow-ups, and reduces toil?

2.5 Impact

Faster press responses; better donor care; improved volunteer intake.

Measurable SLAs; reduced abandonment; stronger brand trust.

3. Scope Definition
3.1 In Scope

Form: Inquiry-type selector → dynamic fields; real-time validation; success/failure toast.

Email: Ticketed confirmation + personalized next steps; internal routing emails.

Chat: FAQ assistance, guided flows (donation/volunteer/press), seamless human handoff, chat transcript export.

Automation: 24h reminder to assignee; 48h escalation to supervisor; conditional notifications.

Security/Privacy: HTTPS, data minimization, consent checkbox, 30-day submission logs with auto-purge.

Anti-spam: Invisible reCAPTCHA + honeypot + per-IP rate limiting.

Accessibility: WCAG 2.1 AA; keyboard-only flows; screen reader labels; non-color cues.

3.2 Out of Scope (v1)

Full CRM migration; advanced ticketing beyond basic ticket IDs.

SMS/voice channels; push notifications.

Deep analytics dashboards beyond GA + lightweight ops metrics.

3.3 Assumptions

Site stack: Astro + TypeScript + DaisyUI/Tailwind + Supabase (Postgres, Auth, Storage), deployed on Vercel.

ESP: SendGrid or Mailgun with domain auth.

Chat: Intercom-like widget or custom webchat; human handoff via inbox/escalation rules.

3.4 Key Dependencies & Decisions

Supabase (RLS policies, secure functions)

reCAPTCHA (Invisible)

Email ESP (DKIM/SPF/DMARC set up)

Feature flags for progressive rollout

4. Success Metrics & KPIs
4.1 Primary

TTFR (median) < 6 business hours; 48h SLA compliance ≥ 95%.

Completion rate +25% vs. baseline.

Bounce/Spam: < 0.5% outbound bounce, < 0.1% spam complaints.

4.2 Secondary

Abandon rate on contact surface −20%.

Accessibility: Lighthouse a11y ≥ 95; AXE zero criticals.

Chat deflection: ≥ 30% inquiries resolved without human.

4.3 Measurement

GA4 events (start/submit/error), custom metrics (TTFR, SLA), ESP deliverability, a11y CI checks.

5. Requirements
5.1 Functional

Form

Inquiry-type dropdown → conditional sections (Press, Volunteer, Donor, General).

Real-time validation (email format, requireds, length, pattern); inline error text + aria-describedby.

Submission toast with clear next steps; retry guidance on network failures.

Confirmation & Ticketing

Generate Ticket ID (ULID/UUID).

Send confirmation email (ticket, user copy, personalized next steps/links).

Store submission + metadata (consent flag, reCAPTCHA score, ticket).

Routing & Automations

Rule-based routing by category; assignee mapping.

24h reminder to assignee; 48h escalation to supervisor/ops channel.

Conditional notifications (suppress routine FYIs; alert on urgent/press).

Chat Widget

FAQ answers, guided flows; auto-fill form fields from chat context.

Human handoff; transcript export; preferred follow-up (email/SMS/callback).

Admin/Ops

Lightweight queue view: status, assignee, timestamps, SLA badges.

Edit routing rules; manage email templates; view spam scores.

5.2 Non-Functional

Performance: TTI < 2.5s on 4G, form submit < 400ms p95 (server roundtrip).

Reliability: 99.5% uptime; email retries/backoff.

Security: HTTPS, input sanitization, CSRF protections, RLS.

Privacy: Data minimization; 30-day logs auto-purge; consent required for processing.

Accessibility: WCAG 2.1 AA; visible focus; proper labels/roles; non-color feedback.

5.3 User Stories

Guest

As a visitor, I can choose Form or Chat and switch without losing context.

As a press contact, I see press-specific fields and get a quick confirmation + ETA.

Registered/Returning (optional)

As a donor/volunteer, prefill my known info; receive tailored resources post-submit.

Staff

As a coordinator, I get only necessary notifications and a 24h reminder if pending.

As a supervisor, I see 48h escalations and SLA breaches.

5.4 Technical

Frontend

Astro + TypeScript, DaisyUI/Tailwind, React islands for form/chat.

React Hook Form + Zod for schema validation; toast notifications.

A11y-first components (labels, aria-live regions, focus traps).

Backend

Supabase (Postgres) with RLS; submissions table, logs table (30-day TTL).

Edge Functions for: reCAPTCHA verify, ticket ID, ESP send, routing, reminders/escalations (cron).

ESP templates with locale/variant support; DMARC-aligned sending domain.

Security

reCAPTCHA (invisible) + honeypot + IP rate limits; audit logging for admin actions.

5.5 Testing

Unit: validation schemas, routing rules, ticket generation.

E2E (Cypress): happy paths (each category), failure states, chat handoff, a11y flows.

Accessibility: AXE CI + manual screen reader tests (NVDA/VoiceOver).

Performance: Lighthouse CI; ESP sandbox deliverability checks.

6. User Flows & Journeys
6.1 Primary Flows

Form Path

Choose inquiry type → dynamic fields appear.

Real-time validation → Submit.

Toast success → Confirmation email with ticket.

Internal routing → 24h reminder → 48h escalation if needed.

Chat Path

Open chat → guided prompts by intent.

Answer FAQs or handoff; form auto-filled if needed.

Transcript sent; ticket created if a submission occurs.

6.2 Entry & Onboarding

Contact CTAs site-wide; press page deep links preselect Press.

First-time helper tooltip (1-time) explaining toggle + privacy commitment.

6.3 Edge Cases & Errors

Network fail → non-blocking error with retry + offline draft (localStorage).

reCAPTCHA fail → soft block with human challenge.

Duplicate submissions within N minutes → merge hint + dedupe flag.

7. Design & UX
7.1 IA & Layout

Single Contact page with Form/Chat toggle; persistent help text; privacy notice + consent.

Clear states: idle, validating, submitting, success, error.

7.2 UI System

DaisyUI theme; high-contrast palette; Lucide icons with aria-hidden as needed; large touch targets.

7.3 Micro-interactions

Subtle progress indicators; success toast (3–5s, aria-live="polite"); focus return on errors.

8. Risks & Mitigations

Press surges during events → Priority rule for “Press”; burst staff alerts.

A11y regressions post-launch → a11y CI + quarterly audits.

ESP outage → queue + retry; fallback SMTP provider.

9. Roadmap
9.1 MVP (Weeks 1–6)

Dynamic form + validation + ticketed confirmation.

Invisible reCAPTCHA + honeypot + rate limit.

Routing rules; 24h/48h automations; basic ops queue.

Accessibility audit & fixes.

Exit Criteria: SLA instrumentation live; a11y ≥ AA; deliverability authenticated; E2E passing.

9.2 Phase 2 (Weeks 7–10)

Chat widget with guided flows + human handoff; chat→form auto-fill.

Tailored confirmation emails by intent; content links library.

Conditional notifications tuning; analytics dashboards (TTFR, SLA).

9.3 Phase 3 (Weeks 11–14)

Saved drafts; i18n email templates; per-category SLAs; ops dashboard polishing.

Advanced spam heuristics and adaptive thresholds.

9.4 Long-Term

CRM sync; knowledge-base surfaced in chat; multi-channel (SMS/callback) opt-in; richer analytics.

Data Model (high level)

contact_submissions: id (UUID/ULID), intent_type, payload_json, email, name, recaptcha_score, ticket_id, status, assignee, created_at, updated_at, consent_at.

contact_logs: id, submission_id, event_type (created/routed/reminder/escalated/closed), meta_json, created_at (TTL 30 days).

routing_rules: id, intent_type, conditions_json, assignee, priority.

Email Templates

Confirmation (all intents), Press fast-track, Volunteer next steps, Donor stewardship, General info received. Each localized, WCAG-friendly, and DMARC-aligned.

SLAs

Initial human response target: < 24h; escalation at 48h with manager alert and dashboard flag.

This PRD captures v1 scope; future iterations may refine routing, analytics, and CRM integrations based on post-launch data.