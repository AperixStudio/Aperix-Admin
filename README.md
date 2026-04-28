# Aperix Admin

Private internal dashboard for Aperix Studio.

## Purpose
- Track client websites and project ownership
- Monitor site health, deployments, and hosting
- Link repos, domains, credential locations, and operational notes
- Provide a central internal command center for Aperix Studio

## Included in this scaffold
- Dashboard overview at `/`
- Client detail pages at `/clients/[id]`
- Repo architecture view at `/repos`
- Structured JSON-backed seed data loaded through typed server helpers
- Reusable shell and styling based on the Aperix visual language

## Getting started
```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts
- `npm run dev` — start local development server
- `npm run build` — create a production build
- `npm run start` — run the production build
- `npm run typecheck` — run TypeScript checks

## Near-term roadmap
- Add authentication for Harrison and Thomas
- Move mock data into a real database
- Integrate GitHub, Netlify, and Cloudflare status data
- Add lead handoff from `Aperix-Website`
