# LinkedOut

A pseudonymous social network built around people and rooms rather than résumés, recruiters, follower counts, and professional identity.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Vercel

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Create a Supabase project, fill `.env.local`, then apply the migration:

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

For Supabase Auth, enable Email and add:

- Local callback: `http://localhost:3000/auth/callback`
- Production callback: `https://YOUR-DOMAIN/auth/callback`

Set `NEXT_PUBLIC_SITE_URL` to the matching origin.

## Vercel

Import the repository into Vercel and add the four environment variables from `.env.example`.

**Important:** `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_` and never expose it to client code.

## Notes

The project intentionally avoids employer-oriented profile fields such as company, school, title, skills, endorsements, follower counts, view counts, jobs, and salary.

Before public launch, review the RLS policies and implement moderation/rate limiting.

## License

AGPL-3.0-or-later — see [LICENSE](./LICENSE).

Fork it, remix it, run your own instance — just keep it open. If you're hosting a modified version of LinkedOut for others to use, the AGPL asks you to share those changes too. That's the deal: freedom stays freedom, even on a server.
