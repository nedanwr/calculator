# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start Vite dev server with HMR
pnpm build      # TypeScript check + Vite production build
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier
pnpm test       # Run tests with Vitest (watch mode)
pnpm test:run   # Run tests once
pnpm preview    # Preview production build locally
```

## Architecture

**Finesse** is a React 19 SPA with four calculator modes: Loan, Mortgage, Investment, and Currency. Built with Vite, TypeScript (strict mode), and Tailwind CSS v4.

### Core Structure

- `src/App.tsx` - Main component with mode switcher, lazy-loaded calculators
- `src/components/calculators/` - Each calculator manages its own state via hooks (useState, useMemo, useCallback)
- `src/lib/calculations.ts` - All financial math: amortization schedules, extra payments, grace periods, investment growth
- `src/lib/currency.ts` - Currency exchange rate fetching with caching and validation (Frankfurter API)
- `src/lib/export.ts` - CSV and Excel (.xlsx via ExcelJS) export with formula injection protection
- `src/lib/print.ts` - PDF/print via hidden iframe with HTML escaping for XSS prevention
- `src/lib/format.ts` - Currency formatting utilities
- `src/lib/utils.ts` - Shared utilities: `cn()` for class merging, `sanitizeText()`, `generateUUID()`
- `src/hooks/` - Custom hooks: `use-formatted-input` for numeric input handling

### Component Patterns

- `InputField` - Reusable numeric input with prefix/suffix, slider integration, accessibility labels
- `charts.tsx` - Recharts-based visualizations (pie charts, area charts) with custom theme colors
- `ThemeProvider` - System/light/dark mode via context, syncs with localStorage
- `src/components/ui/` - shadcn-style UI primitives (button, select, dropdown-menu, sonner toast)
- `ErrorBoundary` - Error handling wrapper for lazy-loaded calculators

### Custom Theme (defined in src/index.css)

Light/dark mode uses semantic color tokens: ivory, cream, sand, stone, charcoal, graphite, slate, terracotta, sage. Dark mode inverts these via CSS custom property overrides on `html.dark`.

## Tech Stack

- React 19 with React Compiler (babel-plugin-react-compiler)
- Vite with rolldown-vite
- Tailwind CSS 4 with @tailwindcss/vite plugin
- Recharts for data visualization
- ExcelJS for Excel export
- Lucide React for icons
- Radix UI primitives with shadcn-style components
- Sonner for toast notifications
- Vitest for testing
