# Pixel Quest

Top-down pixel action RPG built with Next.js 15, libSQL/Turso, and Phaser 3.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — eslint (strict, zero warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test` — vitest run

## Environment

Copy `.env.example` to `.env` and adjust `DATABASE_URL` and `JWT_SECRET`.

- `DATABASE_URL` default: `file:./data/dev.db`
- `JWT_SECRET`: change in production to a long random string.