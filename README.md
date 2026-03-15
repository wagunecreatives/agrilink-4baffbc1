# Agrilink AI

[![CI](https://github.com/wagunecreatives/agrilink-4baffbc1/actions/workflows/ci.yml/badge.svg)](https://github.com/wagunecreatives/agrilink-4baffbc1/actions/workflows/ci.yml)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)

Agrilink AI is a Vite + React + TypeScript application for agricultural workflows, including crop diagnosis, marketplace features, messaging, and farmer-focused tools backed by Supabase.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- TanStack Query

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm ci
```

### Run the app

```bash
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173/
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment

Create a local `.env` file with the frontend variables required by the app:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_ANON_KEY=
```

The crop diagnosis flow also depends on the `analyze-crop` Supabase Edge Function and a valid Gemini or Google AI API key in the Supabase project environment.

## Project Layout

```text
src/                  Frontend pages, components, hooks, and integrations
public/               Static assets
supabase/             Edge functions, migrations, and local Supabase config
ai-server/            Optional local Node service
```

## Repository Standards

- Use feature branches for substantial work.
- Keep application behavior changes separate from repo-health updates.
- Do not commit secrets or generated local environment files.

## GitHub Health Files

This repository includes:

- CI workflow
- Issue templates
- Pull request template
- Contributing guide
- Security policy
- Code of conduct

## Notes

- The deployed crop diagnosis quality depends on the currently deployed Supabase Edge Function, not only the frontend.
- If the linked Supabase project differs from the configured project ref, deployments will fail until access is corrected.
