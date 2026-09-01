# SACCO Management System

A multi-tenant platform where SACCOs (Savings and Credit Cooperative Organizations) manage their own members, savings, loans, share capital, and dividends.

This project is built on a shared starter kit used across the 2026 Summer Internship projects. The kit already provides working authentication (register, login, logout, email verification, password reset) on the backend, and a fully wired frontend shell (routing, state, forms, i18n, dark mode) on the frontend — so every team starts from the same solid, tested foundation instead of an empty scaffold.

## Project Structure

```
SACCO-Management-System/
├── Backend/                # Laravel 12 REST API
│   ├── app/
│   │   ├── Http/           # Controllers, Requests, Resources, Traits
│   │   ├── Models/         # Eloquent models
│   │   └── Services/       # Business logic (ActivityLogger)
│   ├── config/             # Configuration files
│   ├── database/           # Migrations, factories, seeders
│   ├── docs/                # Backend documentation
│   ├── routes/             # Versioned API routes (routes/api/v1.php)
│   ├── scripts/            # Utility scripts (naming convention checker)
│   ├── tests/               # PHPUnit tests (Feature + Unit)
│   └── dockerfiles/         # Docker build files
├── Frontend/                # React 19 + Vite + TypeScript SPA
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui components
│   │   ├── hooks/           # Custom hooks (useTheme)
│   │   ├── i18n/            # Translations (English + Amharic)
│   │   ├── lib/             # Utilities (api client, cn helper)
│   │   ├── pages/           # Route pages
│   │   ├── stores/          # Zustand state stores
│   │   └── types/           # TypeScript types
│   ├── docs/                # Frontend documentation
│   └── scripts/             # Utility scripts
├── .github/workflows/       # CI/CD pipeline (lint, static analysis, tests, build)
├── .husky/                  # Pre-commit hooks
└── README.md                 # This file
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Zustand, TanStack Query, React Hook Form + Zod, i18next (English + Amharic), Vitest |
| Backend | Laravel 12, Sanctum (token auth), Scramble (auto-generated API docs), Log Viewer, PHPUnit, Larastan (PHPStan), Laravel Pint |
| Database | MySQL (SQLite/PostgreSQL also supported out of the box for testing) |
| Version control | Git / GitHub |
| CI/CD | GitHub Actions — lint, static analysis, naming checks, tests, and build on every push/PR |

## Getting Started

Read **GETTING-STARTED.docx** first — it's a short orientation covering what's already built, what your team needs to build, and how to trace the existing Auth feature before writing new code. Then follow the setup guides below for the actual install commands.

### Backend (Docker — recommended)

```bash
cd Backend
cp .env.example .env
cp compose.override.yaml.example compose.override.yaml
docker compose up -d --build
docker compose run --rm composer install
docker compose run --rm artisan key:generate
docker compose run --rm artisan migrate
```

Application: http://localhost

### Backend (Local)

```bash
cd Backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Full backend setup, testing, and coding conventions → [`Backend/README.md`](./Backend/README.md) and [`Backend/docs/`](./Backend/docs)

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Open http://localhost:5173

Full frontend setup and architecture → [`Frontend/README.md`](./Frontend/README.md) and [`Frontend/docs/`](./Frontend/docs)

## Branching Model

- `main` — stable, production-ready code only
- `develop` — active development branch; all feature branches merge here first
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `docs/<name>` — documentation changes

See [`Backend/README.md`](./Backend/README.md) for full commit message and pull request conventions — the same conventions apply across both `Backend/` and `Frontend/`.

## What's Already Built vs. What Your Team Builds

This kit ships with a generic, tested `User` model and full auth flow — nothing domain-specific. Your team's own entities, business rules, and screens are built on top of this foundation, following the same Route → Controller → Request → Resource → Test pattern the Auth feature already demonstrates. See **GETTING-STARTED.docx** for a step-by-step walkthrough.

## Full Name

```bash
Gemechu Alemu
Begonet Debebe
```

test

# Mahder Seifu
bethelhem kefeni
meklit hailemichael
