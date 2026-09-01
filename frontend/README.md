# SACCO Management System - Frontend

React SPA for the SACCO Management System backend API.


## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 | UI library |
| TypeScript | Type safety |
| Vite 8 | Build tool + dev server |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI components |
| Zustand | State management |
| React Query | Server state |
| React Router | Routing |
| React Hook Form | Forms |
| Zod | Validation |
| Axios | HTTP client |

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint with oxlint |

## Documentation

- [Architecture](./docs/architecture.md)
- [Project Structure](./docs/project-structure.md)
- [Components](./docs/components.md)
- [State Management](./docs/state-management.md)
- [API Integration](./docs/api-integration.md)
- [Forms & Validation](./docs/forms-validation.md)
- [Routing](./docs/routing.md)
- [Styling](./docs/styling.md)
- [Testing](./docs/testing.md)

## Project Structure

```
src/
├── components/ui/    # shadcn/ui components
├── lib/              # Utilities (api client, cn)
├── pages/            # Route pages
├── stores/           # Zustand stores
├── types/            # TypeScript types
├── App.tsx           # Routes + providers
├── index.css         # Tailwind + theme
└── main.tsx          # Entry point
```
