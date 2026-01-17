# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FMEA On-Premise is a Korean-language enterprise quality management system for APQP (Advanced Product Quality Planning), PFMEA/DFMEA (Process/Design FMEA), Control Plans, and PFD (Process Flow Diagrams). Built as a full-stack Next.js application with PostgreSQL.

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Frontend**: React 19.2.3, Radix UI, Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM 7.2.0
- **Spreadsheets**: Handsontable for data grids, ExcelJS/xlsx for import/export
- **Charts**: Chart.js with react-chartjs-2

## Development Commands

```bash
# Development server (default port 3000)
npm run dev
npm run dev:4000    # Port 4000
npm run dev:5000    # Port 5000

# Production build
npm run build
npm start

# Database
npm run db:generate  # Generate Prisma client (run after schema changes)
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to DB
npm run db:studio    # Open Prisma Studio GUI

# Linting
npm run lint
```

## Architecture

### Data Model Hierarchy

The system follows a strict hierarchical structure:

```
APQPProject (최상위)
├── FMEA Project (PFMEA/DFMEA)
│   ├── L1Structure (완제품 공정) → L1Function → FailureEffect
│   ├── L2Structure (공정) → L2Function → FailureMode
│   └── L3Structure (작업요소) → L3Function → FailureCause
│
├── ControlPlan (관리계획서)
│   └── CpAtomicProcess → Detectors, ControlItems, Methods, ReactionPlans
│
└── PFD (공정흐름도)
    └── PfdItem
```

### Key Database Patterns

1. **Hybrid ID System**: Tables use `parentId`, `mergeGroupId`, `rowSpan`, `colSpan` fields for row merging in worksheets
2. **FailureLink**: Central table connecting FailureMode ↔ FailureEffect ↔ FailureCause (FM-FE-FC triad)
3. **Atomic DB Pattern**: Control Plan uses atomic row-level tables for worksheet synchronization

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # 55+ REST API routes
│   ├── apqp/              # APQP module
│   ├── pfmea/             # PFMEA module (register, worksheet, import, revision)
│   ├── dfmea/             # DFMEA module
│   ├── control-plan/      # Control Plan module
│   ├── pfd/               # Process Flow Diagram
│   └── master/            # Master data management
├── components/
│   ├── layout/            # Header, Sidebar, TopNav
│   ├── modals/            # Dialog components
│   ├── tables/            # Table components
│   └── worksheets/        # Worksheet-specific components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   └── fmea-core/         # Core FMEA logic
└── types/                 # TypeScript type definitions
```

### Module Pattern (Worksheets)

Each worksheet module follows this structure:
```
worksheet/
├── page.tsx              # Main page (<700 lines)
├── constants.ts
├── utils.ts
├── components/
├── hooks/
├── tabs/                 # Tab-specific components
└── panels/               # Right-side panels (AP Table, RPN Chart, Tree)
```

## Key Rules

### File Size Limits
- **Maximum 700 lines per file** - split larger files
- New features should always be in new files
- Separate data/constants into `data/` folders

### Worksheet Design Principles
1. Menu bar fixed at top, doesn't scroll
2. Only one horizontal scrollbar per container
3. Vertical scrollbar controls worksheet only
4. Design for 1440px browser width

### Database Operations
- Always use `prisma.ts` singleton from `@/lib/prisma`
- Schema file: `prisma/schema.prisma`
- Run `npm run db:generate` after schema changes

### Git Hooks
Protected paths are enforced via git hooks:
- `pre-commit`: Check staged files
- `commit-msg`: Validate commit messages
- `pre-push`: Branch protection

## Important Files

- `prisma/schema.prisma` - Database schema (60+ models)
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/api/` - All API endpoints
- `docs/` - Extensive documentation (50+ files)
- `scripts/` - Database and migration utilities

## Documentation References

- `docs/MODULARIZATION_GUIDE.md` - File organization patterns
- `docs/WORKSHEET_DESIGN_PRINCIPLES.md` - UI layout rules
- `docs/DB_SCHEMA.md` - Database schema details
- `docs/중요_ONPREMISE_MASTER_PLAN.md` - FMEA workflow sequence
