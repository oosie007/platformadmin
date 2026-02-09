# Platform Admin Console

Web app for managing **products**, **policies**, and **customers**. Built with Next.js (App Router), React 19, TypeScript, and [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS. The UI includes an environment selector (EMEA SIT / UAT) for API-backed features; many areas still use mock data and are marked as draft.

---

## Getting started (product owners / first-time run)

**Prerequisites:** Node.js 18+ and npm.

1. **Clone the repo**
   ```bash
   git clone https://github.com/oosie007/platformadmin.git
   cd platformadmin
   ```

2. **Create the env file**  
   In the project root, create a file named `.env.local`. Paste the env contents shared with you by the team (do not commit this file).  
   If you skip this step, the app still runs; **Products** and **Customers** use mock data. **Policies** need env vars for real API search/detail.

3. **Install dependencies**  
   You must run this before starting the app. The repo does not include `node_modules`.
   ```bash
   npm install
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```
   Then open **http://localhost:3000**.

**One-liner (after clone and creating `.env.local`):**
```bash
npm install && npm run dev
```

---

## Project context (for humans and AI assistants)

This section gives enough context so that an AI (e.g. Claude) can work on this codebase without guessing.

### What this app is

- **Platform Admin Console** – internal admin UI for insurance platform operations.
- **Main areas (sidebar):** Dashboard (`/`), Products (`/products`), Policies (`/policies`), Customers (`/customers`). Settings at `/settings`.
- **Tech stack:** Next.js 16 (App Router), React 19, TypeScript. UI: shadcn components (use `shadcn@latest` when adding components), Tailwind CSS, `lucide-react` icons. Forms: `react-hook-form` + `zod` + `@hookform/resolvers`.
- **Current state:** Products list and create flow use **mock data** (labelled “Draft — not API connected” on the Products page). Customers search is mock. Policies can call real APIs when `.env.local` is configured (SIT/UAT); the sidebar environment dropdown stores the chosen env in a cookie and all policy/document API calls use that env’s credentials and base URLs.

### Repository structure

- **`src/app/`** – Next.js App Router: one folder per route. `page.tsx` is the route UI; `layout.tsx` is the root layout (sidebar, header, theme, providers). API routes live under `src/app/api/` (e.g. `policies/search`, `customers/search`, `audit`).
- **`src/components/`** – Reusable UI: `app-sidebar.tsx` (nav + env selector), form components for the product wizard (`product-details-form.tsx`, `coverage-variant-form.tsx`, etc.), `theme-provider.tsx`, `mode-toggle.tsx`. `src/components/ui/` holds shadcn primitives (button, card, input, table, etc.).
- **`src/contexts/`** – React context: `sidebar-context.tsx` (sidebar open/collapsed state), `migrations-context.tsx` (used only by legacy migration routes, not by main nav).
- **`src/lib/`** – Shared logic: `utils.ts` (e.g. `cn`), `env-constants.ts` and `env-config.ts` (env keys and labels), `mock-data.ts` (migration mock data), `product-wizard-mocks.ts` and `product-wizard-steps.ts` (product wizard), API helpers and audit client/server.
- **`src/hooks/`** – Custom hooks (e.g. migration streams); used by legacy migration flows.
- **`context/`** (repo root) – API contracts (OpenAPI/AsyncAPI), integration docs, event schemas. Reference only.
- **`product-wizard-spec/`** – Specs and reference implementation for the product wizard (Canvas/Angular reference). Used as behaviour reference, not wired into this app’s runtime.

### Key conventions

- **Routing:** App Router. Pages are in `src/app/<segment>/page.tsx`. Dynamic segments: `[id]`, `[policyNumber]`, etc.
- **Client vs server:** Use `"use client"` only where needed (state, hooks, browser APIs). Layout and static content can stay server components.
- **UI additions:** Use `npx shadcn@latest add <component>` (not `shadcn-ui`). Components go in `src/components/ui/`.
- **Env:** Never commit `.env` or `.env.local`. Env keys and labels are in `src/lib/env-constants.ts`. Server-side env is read in API routes and server components; client-safe vars must be prefixed with `NEXT_PUBLIC_` if used in the browser.
- **Styling:** Tailwind + globals in `src/app/globals.css`. Prefer existing design tokens (e.g. `border-border`, `text-muted-foreground`, `bg-card`).

### Scripts

| Command         | Purpose                          |
|----------------|-----------------------------------|
| `npm run dev`  | Start dev server (localhost:3000) |
| `npm run build`| Production build                  |
| `npm run start`| Run production build              |
| `npm run lint` | Run ESLint                        |
| `npm run package` | Create zip for sharing (excludes node_modules, .next, .git) |

### Environment variables (optional, for API-backed features)

Used for **Policies** (search, detail, documents, download) and any future API-backed areas. The team will share the exact contents for `.env.local`. Typical vars (names may vary):

- **Auth (per env):** `SIT_EMEA_AUTH_*` / `UAT_EMEA_AUTH_*` (URL, app id/key, resource, impersonation id).
- **API base URLs (per env):** `SIT_EMEA_API_BASE_URL`, `UAT_EMEA_API_BASE_URL`, and document API URLs.
- **Policies:** Policy search/detail/document routes in `src/app/api/policies/` use these. If you get 401/404, check auth resource and base URLs for the selected environment.

Products and Customers do **not** depend on these env vars today; they use mocks.

### Legacy / unused in main nav

- **Migrations** – Routes under `src/app/migrations/` (list, new, detail) and `migrations-context.tsx` still exist but are **not linked in the sidebar**. Dashboard no longer shows migration stats. These can be removed or repurposed later.

---

## Build and run (summary)

```bash
git clone https://github.com/oosie007/platformadmin.git
cd platformadmin
# Create .env.local with shared contents (optional for mocks)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
