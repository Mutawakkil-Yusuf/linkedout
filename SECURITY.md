# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Instead, open a
[private security advisory](https://github.com/Mutawakkil-Yusuf/linkedout/security/advisories/new)
on GitHub, or reach out to the maintainer directly.

Include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The commit or deployment you tested against.

## What's in scope

- The Next.js app in `src/`
- Supabase migrations and Row-Level Security policies in `supabase/`
- Auth flows (magic link, session handling, onboarding)
- Server actions in `src/lib/actions/`
- Any way to bypass blocks, bans, or moderation
- Any way to enumerate users beyond what's intentionally public

## Out of scope

- Vulnerabilities in Supabase itself — report those to Supabase.
- Vulnerabilities in third-party dependencies — report upstream, but let us
  know so the dependency can be bumped here too.

Thanks for helping keep LinkedOut safe.
