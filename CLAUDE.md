# Pantry AI — Project Rules for Claude Code

Pantry AI is a mobile-first pantry manager (Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui on Base UI, Apollo GraphQL, Prisma, Gemini).
Talk to the user in Traditional Chinese (繁體中文). Code, comments, and UI copy stay in English (see "Strict English-Only Codebase").

## 文件地圖 (Docs Map) — 哪個檔案負責什麼

| File                                                                           | Owns (負責什麼)                                                                                            | Read / updated by                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `CLAUDE.md`                                                                    | **How the AI must work**: engineering rules, verification steps, mobile requirements.                      | Claude Code (auto-loaded every session)                                   |
| `PRODUCT.md`                                                                   | **Why**: target users, product purpose, brand personality, design principles.                              | `impeccable` skill, product decisions                                     |
| `DESIGN.md`                                                                    | **What it looks like**: colors, typography, component specs, mobile layout specs.                          | `impeccable` skill, any UI work                                           |
| `CONTEXT.md`                                                                   | **Domain glossary**: exact meaning of PantryItem, BoardState, Must-Use Ingredient…                         | `grill-with-docs`, `ubiquitous-language`, `improve-codebase-architecture` |
| `README.md`                                                                    | Public intro + local setup for GitHub visitors / interviewers.                                             | Humans                                                                    |
| `docs/dev-log.md`                                                              | Dated changelog of what was done and why.                                                                  | Updated after each completed task                                         |
| `docs/*-notes.md`, `docs/css-best-practices.md`, `docs/commands-cheatsheet.md` | Personal study notes and lessons learned. Background reference, **not rules**.                             | Humans                                                                    |
| `docs/agent-skills-guide.md`                                                   | How to invoke the installed skills.                                                                        | Humans                                                                    |
| `docs/learning/`                                                               | Interview-prep workspace for the `teach` skill: `MISSION.md`, `RESOURCES.md`, `lessons/`, `reference/`.    | `teach` skill (use `docs/learning/` as its workspace root)                |
| `.agents/skills/` + `skills-lock.json`                                         | Installed skills (managed by `npx skills`). `.claude/skills` is a symlink to it so Claude Code loads them. | Skill installer                                                           |
| `.claude/settings.json`                                                        | Project hooks (impeccable design check after edits).                                                       | Claude Code                                                               |
| `.claude/launch.json`                                                          | Dev server config for the in-app browser preview.                                                          | Claude Code                                                               |

Where new information goes:

- A new rule about how the AI should code, test, or verify → `CLAUDE.md`
- A new visual or layout spec (spacing, breakpoints, component look) → `DESIGN.md`
- A change in who the product is for or what matters most → `PRODUCT.md`
- A new domain term → `CONTEXT.md`
- "What did we do on date X" → `docs/dev-log.md`

## Mobile-First UI Is Mandatory (手機顯示是硬性要求)

Users mostly operate this app one-handed on a phone in the kitchen or supermarket. A UI change that only looks right on desktop is **not done**.

1. **Verify at three widths before reporting done**: 320px, 375px, and desktop (≥1280px). Use the in-app browser preview (`.claude/launch.json` → `dev`; "Try Demo" signs in). Open every dialog, dropdown, and popover you touched, not just the page.
2. **What to check**: no clipped or overlapping text, no horizontal scroll, every popup/dropdown fully inside the viewport, touch targets per `DESIGN.md`, and the longest realistic content (e.g. the longest category name, a long item name).
3. **Fix the layout, not the content**: keep the established patterns (e.g. form rows are label-left / field-right via `FORM_ROW_CLASS` in `ItemFormDialog.tsx`). Do not "fix" mobile by stacking everything vertically, removing information, or bolting on extra buttons. If a row is too crowded, reduce the number of controls.
4. **Measure, don't guess**: when something is tight, measure `scrollWidth` vs `clientWidth` in the browser instead of tweaking classes blindly.
5. If you could not verify in a browser, say so explicitly in your reply. Never claim mobile works without having looked.

## Teaching and Documentation (教學與文件規則)

1. **Explain every significant change**: after significant code changes, end the reply with a walkthrough in Traditional Chinese: which files changed, what the new code means, and how the logic works, so the user can learn from it and explain it in interviews.
2. **Dev-log maintenance**: after completing a task or phase, update `docs/dev-log.md` without waiting to be asked.

## Principle-Driven Engineering (Professional Pushback)

1. **No "Yes-Man" behavior**: do not blindly agree with the user's architectural, UI/UX, or product suggestions.
2. **Industry-backed reasoning**: evaluate requests against industry standards and software engineering theory.
3. **Firm pushback**: if a suggestion is suboptimal (e.g. deleting a useful DB column instead of fixing the UI), say so, explain why, and propose a better alternative.
4. **Confident agreement**: when you agree, explain why it is good practice.

## Clean React Rendering & DRY Principles

1. **No JSX hardcoding**: never use nested ternaries or long inline conditional chains inside JSX to map values to labels.
2. **Data-driven rendering**: extract static mappings, select options, and repetitive UI data into constants (`Record<string, string>`, arrays of objects) outside the component.
3. **Map iteration**: generate repetitive elements (`<SelectItem>`, list items) with `.map()`.
4. **Separation of concerns**: JSX focuses on layout; business logic and static data live above or outside the component.

## Architectural Guidelines (Deep Modules vs. God Components)

1. **Prioritize deep modules**: encapsulate a feature's state, GraphQL mutations, and UI in one module (e.g. `<AIRecipeManager>`).
2. **Prevent god components**: route pages (`page.tsx`) handle layout, route params, and composition only.
3. **High locality**: if a component passes 5+ props through just to render something managed levels up, push the state down.

## Mandatory Post-Edit Verification (強制代碼驗證)

A successful build does not mean the code is correct. After any significant change, before ending the turn:

1. **Lint**: `npm run lint`.
2. **Type check**: `npx tsc --noEmit`.
3. **Tests**: `npm test` when logic, schemas, or constants changed.
4. **Semantic diff review**: read `git diff` and check for framework anti-patterns (hooks in loops, state mutation, wrong dependency arrays).
5. **UI changes**: run the mobile verification above.

## Default to Enterprise-Grade Robustness (嚴禁 MVP 技術債)

1. **No happy-path only**: never assume external inputs, LLM outputs, or network requests succeed. Handle errors (UI feedback, try/catch, graceful degradation).
2. **Strict runtime validation**: no blind `as Type` casts on external data; validate with `zod`.
3. **Structured AI outputs**: use `responseSchema` / function calling instead of prompt-only JSON.
4. **Prototype override**: only bypass these rules when the user invokes the `prototype` skill or says "prototype".

## Core Logic & Boundary Testing (防禦性單元測試)

1. **Test AI boundaries**: when changing AI parsing, Zod schemas, or pure business logic, add or update Vitest tests (e.g. `ai.test.ts`).
2. **No UI testing in Vitest**: test pure logic, transformations, and schema coercion only. UI is verified in the browser.
3. **Red-green-refactor**: never refactor core logic without tests covering it first.

## Thin Server Actions (極簡 Server Action 架構)

1. Files with `'use server'` export only `async function`s.
2. Never define or export Zod schemas, constants, or types in a `'use server'` file (it crashes Next.js with a 500).
3. Put schemas and constants in `src/lib/` (e.g. `src/lib/schemas/pantry.ts`) and import them.

## Strict English-Only Codebase

1. No Chinese comments, docstrings, or identifiers in code.
2. No hard-coded Chinese UI text or error messages unless explicitly requested for i18n.
