# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Layout

The actual app lives inside `taltech-agent/`. All commands below should be run from that directory.

```
taltech-agent-frontend/
└── taltech-agent/      ← project root; run all commands here
    ├── src/
    │   ├── main.js     ← app entry point
    │   ├── App.vue     ← root component
    │   └── style.css   ← global styles (Tailwind v4 import)
    ├── index.html
    └── vite.config.js
```

## Commands

```bash
cd taltech-agent

npm install          # install dependencies
npm run dev          # dev server with HMR
npm run build        # production build
npm run preview      # preview production build
npm run lint         # run oxlint then eslint (both with --fix)
npm run format       # prettier format src/
```

## Stack

- **Vue 3** with `<script setup>` SFCs
- **Vite 8** (dev server + bundler) with `@vitejs/plugin-vue` and `@vitejs/plugin-vue-jsx`
- **Tailwind CSS v4** via `@tailwindcss/vite` (imported with `@import 'tailwindcss'` in CSS, no config file)
- **Node ≥ 20.19 or ≥ 22.12** required

## Path Aliases

`@` maps to `./src/` — use `@/` imports throughout.

## Code Style

- Prettier: no semicolons, single quotes, 100-char line width
- Linting: oxlint runs first, then eslint; both auto-fix on `npm run lint`
- Vue SFCs use `<script setup>` composition API style