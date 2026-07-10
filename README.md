# Voxora Ops CRM

Next.js CRM for the Voxora voice-agent backend.

## Local Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/crm
```

Run the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Auth And Workspace Context

Users must sign up or sign in before using the CRM. Signup captures the
business name, business details, and default niche. Settings lets the user
edit those values later.

Authenticated API calls send `Authorization: Bearer <token>` automatically.
The websocket adds the token as `?token=...`, so realtime events are scoped
to the signed-in workspace.

## Backend Pairing

Run the sibling backend from `..\..\voice-agent` on port `8000`. The backend
owns workspace isolation, business-profile normalization, model routing, and
call creation. The CRM should not send or trust a frontend workspace id.

## Default marketing agent

The `/agents` route configures the workspace's image-only marketing agent.
It reads the saved business profile, accepts uploaded image references,
stores encrypted publisher credentials in the backend, and runs automatically
at the selected 3, 6, 12, or 24 hour interval. The backend supports LinkedIn,
Instagram, Facebook, Threads, and an authenticated publisher webhook.

## Verification

```bash
npx tsc --noEmit
npm run lint -- --ignore-pattern next-env.d.ts
npm run build
```
