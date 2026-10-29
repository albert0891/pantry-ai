# Pantry AI - Development Log

## 2026-06-21

### Completed:

- Migrated default Gemini model to `gemini-3.5-flash` to bypass Free Tier quota restrictions on 2.0.
- Implemented robust UI states for KanBan cards, resolving layout shifts and "blurry" borders using a solid `border-2` system.
- Corrected Z-index stacking contexts ensuring the "Inspire Me" Floating Action Bar (`z-50`) is never blocked by selected cards (`z-10`).
- Implemented `Mandatory Pre-flight Check` rule in local `.agents/AGENTS.md` to guarantee documentation updates on every code change.
- Re-architected mobile Navbar into a clean two-row layout, fixing redundant logout buttons and alignment issues.
- Added a robust Auto-Retry loop (max 3 attempts) with structural JSON validation to the AI recipe generation feature (`generateRecipe` mutation) to improve stability against AI hallucinations and API transient errors.
- Refactored `page.tsx` into specialized UI components (`Navbar`, `MobileBottomNav`, `KanbanBoard`, etc.) and a custom data hook (`usePantry.ts`) following the Container/Presenter pattern.
- Extracted Gemini AI logic and prompts from `resolvers.ts` into a dedicated `src/lib/ai/recipeGenerator.ts` service for better separation of concerns.
- Finalized premium Glassmorphism aesthetic with color-tinted ambient background blobs and strict `border-2` layouts to prevent mobile layout shifts.
- Upgraded components (`Navbar`, `ItemFormDialog`, `PantryItemCard`) with strong physical hover interactions (`scale-110`, solid color feedback) and deep `backdrop-blur-3xl` glass panels for maximum contrast and readability.
- Fixed critical data duplication bug in `moveItem` GraphQL resolver by enforcing strict item merging (matching by name, unit, and expiryDate) when moving items between columns, resolving frontend Apollo cache errors.

### Next Steps:

- Implement Voice Input (Web Speech API) for friction-less pantry logging.
- Implement Mock Receipt Scanner using Gemini Multimodal.
- Add premium empty states illustrations for onboarding.

## 2026-06-29

### Completed:

- Successfully deployed Pantry-AI to production using Vercel (Frontend & Next.js API Routes).
- Provisioned and linked Neon Serverless PostgreSQL for the production database.
- Configured Vercel environment variables, including AWS Cognito fallbacks and Mock Auth configuration.
- Modified `package.json` to inject `prisma generate` step natively into Vercel's build command (`next build`), ensuring successful serverless schema compilation.
- Wiped and re-initialized the production Neon Database using Prisma `migrate reset --force` and `db push`.
- Implemented Multi-Tenant Mock Auth system: Added a "Try Demo" button for public access (`public-demo-user`) and a secret backdoor login for personal use (`albert-admin-id`) to isolate recruiter traffic from private data.
- Configured a Vercel Cron Job (`/api/cron/reset-demo`) to automatically reset the public demo pantry to default ingredients every midnight.

### Completed (Codebase Audit & Refactor):

- Refactored `src/graphql/resolvers.ts` to adhere to enterprise clean code standards.
- Extracted repetitive authentication logic into a reusable `ensureAuthenticatedUser` helper function.
- Deconstructed the complex, monolithic `moveItem` resolver into separate, readable logical branches (`handleFullMove` and `handlePartialMove`).
- Generated comprehensive `walkthrough.md` interview study guide detailing project architecture, GraphQL data flows, Next.js App Router patterns, and UI design systems.
- Re-wrote open-source `README.md` to properly document tech stack and local setup instructions.

## 2026-06-30

### Completed (UI & Bug Fixes):

- Fixed iOS Safari specific UI glitch in the "Add Item" dialog (`ItemFormDialog.tsx`) where the native date picker (`type="date"`) would overflow its container due to insufficient fixed height (`h-8`).
- Increased default height for Dialog inputs to `h-10` (40px) to meet Apple mobile touch target guidelines and enforced `block w-full appearance-none` on the date input for consistent cross-browser mobile layout.
- Updated Next.js global metadata in `src/app/layout.tsx` to properly display the app title "Pantry AI" and description.
- Restored the original `logo.svg` (carrot logo) as the official Next.js favicon (`src/app/icon.svg`).
- Changed the main title of the login page from "Welcome Back" to "Pantry AI" to reinforce project branding.

### Completed (Features):

- **Mobile UX Enhancements**:
  - **Swipe Gestures**: Added `onTouchStart`, `onTouchMove`, and `onTouchEnd` event handlers to the main Kanban board container to allow users to smoothly swipe left and right to switch between columns on mobile devices. Enhanced this with a lightweight, native-feeling CSS sliding animation (`translateX` with `cubic-bezier` easing) that completely avoids heavy JS libraries.
  - **Minimalist Mobile Headers**: Removed the redundant Kanban column headers (and floating count badges) entirely on mobile devices. Instead, the item counts `(X)` are now beautifully integrated directly into the sticky mobile navigation tabs at the top of the screen (e.g. `🛒 To Buy (12)`). This maximizes screen real estate for the actual item cards and resolves visual awkwardness.
- **Quick Re-buy Button**: Added a one-click `ShoppingCart` button to items in the "Consumed" column to quickly move them back to the "To Buy" list (`PantryItemCard.tsx`).
- **AI Recipe Regeneration & Cross-Board Planning**: Added a "Regenerate" button in the generated recipe dialog. The entire modal UX was fully redesigned to use a **Responsive Floating Pill (懸浮膠囊)** instead of a traditional footer. On mobile, it displays as space-saving, sleek circular icons (`[ ✕ | 🔄 | 💖 ]`). On desktop, it seamlessly expands to show full text labels (`[ 💖 Save Recipe ]`) to ensure maximum clarity without sacrificing the premium, glassmorphism aesthetic.
  - **Toggle Save Workflow**: Replaced the disruptive "save and jump" UX with a continuous "Heart Toggle" UX. Clicking "Save" instantly turns the button into a green "✅ Saved!", keeping the modal open and selections intact to maintain user flow. Clicking it again instantly unsaves (deletes) the recipe. Regenerating automatically resets the button state.
  - **Cross-Board Capability**: Refactored the backend `generateRecipe` resolver. Users can now check items in the `TO_BUY` or `CONSUMED` lists, and the AI will explicitly include them as "must-use" main ingredients, allowing users to do "pre-shopping meal planning". Unchecked ingredients are still strictly pulled only from `IN_PANTRY`.
  - **Prompt Engineering**: Leverages a new technique by passing `previouslyUsedIngredients` to the backend, instructing Gemini to actively down-weight previous ingredients and explore diverse recipe combinations while maintaining required ingredients. Additionally, solved an "over-crowded recipe" hallucination by strictly separating `mustUseIngredients` (primary requirements) from `supportingIngredients` (optional pantry items) in the prompt. Added a `CRITICAL FLAVOR RULE` instructing the AI to act as a Michelin-star chef, strictly forbidding weird flavor combinations (like mixing cocoa powder with ground meat) and emphasizing that it is better to ignore pantry items entirely than to force them into a bad dish.
- **AI API Resiliency**: Researched the latest 2026 AI models and upgraded the core recipe generation engine to `gemini-3.1-flash-lite`, replacing the deprecated or invalid previous models. This new model is Google's flagship lightweight AI, offering the best balance of speed, cost-efficiency, and free-tier rate limits. Also added an exponential backoff delay to the API retries to handle `429 Too Many Requests`, and improved the error messages to explicitly tell the user when they hit the quota limit.
- **Onboarding Guide**: Implemented a responsive "Guide" modal in the Navbar with an interactive step-by-step tutorial explaining core app workflows.

## 2026-07-01

### Completed (Codebase Architecture & Refactor):

- **Deep Modules Architecture**: Eliminated the "God Component" anti-pattern in `src/app/page.tsx` by extracting all AI Recipe state and GraphQL logic into a highly cohesive, deep module (`AIRecipeManager.tsx`).
- **State Decoupling**: Removed 5 state variables and 4 massive event handlers from the top-level route. `page.tsx` is now strictly responsible for high-level layout and Kanban state, significantly increasing code Locality and Leverage.
- **Added Architectural Guardrails**: Updated `.agents/AGENTS.md` to strictly enforce the creation of Deep Modules and forbid shallow pass-through components for new features.
- **Kanban Gesture Encapsulation**: Extracted touch physics into a dedicated `useSwipe` hook. Pushed `activeTab` state and mobile navigation UI down into `KanbanBoard.tsx`, completing the Deep Module architecture and cleanly decoupling `page.tsx` from all swipe physics and Kanban-specific layout concerns.

## 2026-07-02

### Completed (Performance & UI/UX Audit):

- **React Performance Optimization**: Audited the project against `vercel-react-best-practices`. Wrapped all top-level event handlers in `src/app/page.tsx` with `useCallback` to prevent massive re-renders of the Kanban board during typing. Wrapped column filtering logic in `KanbanBoard.tsx` with `useMemo` to prevent array iteration on every render.
- **Mobile UX Refactor (Action Overload)**: Resolved a cluttered UI issue in `PantryItemCard.tsx`. Replaced the row of 4-6 tiny action buttons with a clean, touch-friendly `DropdownMenu` (from Shadcn/UI and Base UI) for secondary actions like Edit, Delete, and single-item moves. The primary interface now breathes better and strongly reinforces the premium Glassmorphism aesthetic.
- **User Flow Fix (Selection Persistence)**: Fixed an issue where moving an item automatically un-checked it from the AI Recipe generation queue. Users can now check items from the "To Buy" list, move them to the "In Pantry" list, and immediately generate a recipe without losing their selection state.

## 2026-07-03

### Completed (Roadmap Execution & Defensive Engineering):

- **Defensive Engineering**: Adopted the **Mandatory Post-Edit Verification** rule in `.agents/AGENTS.md` and formally enforced it by installing **Husky pre-commit hooks**. All code pushes are now strictly gated by `npm run build` and `npx lint-staged` to absolutely prevent Vercel deployment crashes.
- **Smart Voice Parsing (AI-Driven)**: Replaced the dumb speech-to-text dictation with a true AI Voice Assistant. Transcripts are now sent to a new Server Action (`parseVoiceInput`) powered by Gemini 3.1 Flash Lite. The AI extracts the item name, exact quantity, category, and calculates the expiry date automatically, returning a strict JSON response to instantly populate the entire Add Item form.
- **UI Architecture Refactor (ItemFormDialog)**: Resolved visual clutter and AI-button ambiguity in the Add Item modal.
  - The `Auto Categorize` button was demoted visually and moved down next to the `Category` dropdown.
  - The `Smart Voice Input` button was promoted to a massive, full-width, gradient-styled hero button at the top of the form, complete with dynamic loading and listening animations (`animate-pulse`).
- **Fuzzy Quantities Guide**: Added a "Ground Pork 250g" demo item and an updated Onboarding Guide to teach users about the new Smart Voice Fill feature and how to handle fuzzy quantities.
- **Visual Expiry Cues**: Added a subtle, premium visual warning system to `PantryItemCard.tsx`. Items in the Pantry now emit a glowing yellow border (`shadow-[0_0_15px_rgba(251,191,36,0.3)]`) if they expire within 3 days, and a glowing red border if they expire today or have already passed their date.

## 2026-07-04

### Completed (AI & Engineering Robustness):

- **Smart Voice AI Schema Validation**: Refactored the core AI parsing layer in `ai.ts` to use `zod` for strict runtime validation. Upgraded Gemini API calls to use `responseSchema` (Structured Outputs) to guarantee JSON format from the LLM, completely eliminating "blind type casting" (`as Type`) vulnerabilities.
- **Recipe Generator AI Schema Validation**: Applied the exact same Zod and `responseSchema` refactoring to `recipeGenerator.ts`, eliminating prompt-engineering hacks and preventing app crashes from AI hallucinations during recipe creation.
- **Kanban Prisma Transactions**: Wrapped Kanban drag-and-drop item movements (`handleFullMove`, `handlePartialMove`) in Prisma `$transaction` blocks within the GraphQL resolver. This ensures atomic database updates, preventing data loss if a network failure occurs midway through an item split/move.
- **Graceful Error Handling (Toast UI)**: Handled edge cases where AI fails to parse voice input. Replaced silent `console.error` crashes with a soft red inline error message in `ItemFormDialog.tsx`, providing a robust, user-friendly fallback.
- **Relative Date Context Fix**: Supplied the current day of the week to the Gemini prompt to ensure accurate relative date calculations (e.g., "next Wednesday").
- **Enterprise Engineering Rules**: Established the `Default to Enterprise-Grade Robustness` rule in `.agents/AGENTS.md`, formally rejecting MVP technical debt. Established `/prototype` as the official override switch for rapid ideation.
- **Research-Driven Design Rule**: Established the `apply-premium-aesthetics` skill to strictly enforce active web trend research and contextual Glassmorphism integration during UI planning phases.
- **Automated Pure Logic Testing**: Installed `vitest` and created boundary unit tests for AI schema validation (`ai.test.ts`, `recipeGenerator.test.ts`). This guarantees that Edge Cases (like Zod coercion of strings to numbers) work perfectly outside the React UI layer.
- **Husky Testing Integration**: Enforced `npm run test` inside the `.husky/pre-commit` hook to automatically run unit tests on every commit, creating an impenetrable defense against logic regressions.
- **Thin Server Actions Architecture**: Diagnosed and fixed a fatal Next.js 500 Error caused by exporting Zod schemas directly from a `'use server'` file. Extracted all core logic schemas (`ParsedItemSchema`, `VALID_CATEGORIES`) into a dedicated `src/lib/schemas/pantry.ts` file, keeping Server Actions strictly for async API handlers and safely enabling frontend schema reuse. Updated `AGENTS.md` to formally enforce this architecture.

## 2026-07-08

### Completed (Documentation):

- **Project README & Profile Updates**: Updated the open-source `README.md` to feature a refined, high-impact introductory summary emphasizing the smart kitchen AI capabilities, strictly typed GraphQL architecture, and premium Glassmorphism UI. Prepared the corresponding GitHub profile snippet.

## 2026-07-08

### Completed (Infrastructure & Bug Fixes):

- **Vercel Cron Bug Resolution**: Resolved a multi-day debugging issue where the Vercel Cron Job (`vercel.json`) failed to register in the Vercel Dashboard despite a valid `Ready` Production deployment. Root cause was identified as Vercel platform-level silent failure (likely due to Hobby plan account-wide limits or Git integration desync).
- **Migration to cron-job.org**: Bypassed Vercel's opaque cron infrastructure by migrating to the external `cron-job.org` service.
- **Secure API Endpoints**: Verified that the Next.js API route (`/api/cron/reset-demo`) correctly handles unauthorized manual browser triggers (401 Unauthorized), ensuring that database resets are strictly gated by the `CRON_SECRET` Bearer token.
- **Environment Variable Tracking**: Created a safe `.env.example` file and pushed it to GitHub to securely track required environment variables (Cognito settings, `CRON_SECRET`) without leaking actual secrets, following industry standard practices.

## 2026-07-10

### Completed (UI Refactoring & Impeccable Design):

- **Aesthetic Overhaul (Warm & Organic)**: Completely removed the "AI Slop" (heavy glassmorphism, glowing cyan/magenta shadows, translucent blobs) from the entire application. Transitioned to "Direction B", a warm, organic, and efficient design system featuring solid `stone` backgrounds, clean `orange` primary buttons, and solid white cards.
- **Global Layout Reset**: Removed the floating fixed background blobs in `page.tsx` and changed the global background to `bg-stone-50`.
- **Component Refactoring**: Redesigned `PantryItemCard`, `AIRecipeManager`, `Navbar`, `MobileBottomNav`, `KanbanBoard`, and `ItemFormDialog` to adhere strictly to the new solid-color, high-contrast palette. This significantly improves visual clarity and mobile performance by eliminating expensive `backdrop-blur` CSS rules.

### Completed (Authentication & Security Refactoring):

- **Restored AWS Cognito Integration**: Completely removed the hard-coded `MOCK_AUTH` backdoor for admin logins and restored native `aws-amplify/auth` capabilities across the frontend. Users can now successfully sign up, verify emails, and sign in using real credentials.
- **Hybrid Auth System**: Preserved the "Try Demo" feature by refactoring `AuthProvider`, `ApolloProvider`, and the GraphQL `/api/graphql` backend to seamlessly support both AWS Cognito JWTs (for real users) and `demo_token` overrides (for public visitors).
- **Global Error Interceptor**: Implemented a global Apollo Client `onError` link to elegantly handle `Unauthorized` errors. Invalid or expired tokens now automatically trigger a redirect to `/login`, eliminating jarring GraphQL error overlays.

### Completed (Architecture & User Profile UI):

- **Database Cleanup (Decoupling PII)**: Executed a database schema migration to permanently drop the `email` column from the Prisma `User` model. This resolves technical debt and adheres to enterprise architecture standards by making AWS Cognito the strict, sole source of truth for user identity and PII.
- **Client-Side Profile Fetching**: Updated `AuthProvider.tsx` to dynamically fetch the user's real email directly from AWS (`fetchUserAttributes`) upon successful session validation, completely bypassing the local database.
- **Responsive Avatar Dropdown**: Upgraded the `Navbar` component (both Desktop and Mobile layouts) by replacing the simple logout button with a Shadcn `DropdownMenu`. The new Avatar menu cleanly displays the current user's email address and provides a distinct logout action, resolving user confusion in multi-account scenarios.

## 2026-08-23

### Completed (Engineering Robustness & Type Safety):

- **Strict TypeScript Enforcement**: Executed a codebase-wide audit to remove all remaining `any` types and `as any` type assertions, adhering to the "Enterprise-Grade Robustness" rule. This also fixed the `lint-staged` hook blocking commits.
- **Error Handling Standardization**: Refactored all `catch (err: any)` blocks to `catch (err: unknown)` across the application (`login/page.tsx`, `ai/recipeGenerator.ts`, `api/cron/reset-demo/route.ts`). Implemented strict `err instanceof Error` type guards for safe error message extraction.
- **GraphQL Type Safety**: Added explicit Prisma generated types (`PantryItem`, `Recipe`) to Apollo Client `useQuery` and `useMutation` hooks, as well as React component props (`KanbanBoard`, `PantryItemCard`), ensuring strict runtime and compile-time validation.
- **Input Reset Bugfix**: Fixed the quantity input field in `ItemFormDialog.tsx` to allow complete clearing by accepting empty strings and utilizing native `required` HTML validation, replacing an aggressive `|| 1` parse fallback.

## 2026-09-10

- **Bug Fix (AI Recipe Modal)**: Fixed an issue where clicking the "Inspire Me" button would immediately show a "Generation failed" error message before the generated content loaded. This was caused by missing `setIsGeneratingRecipe(true)` and `setIsGeneratingRecipe(false)` state updates in the `handleGenerateRecipe` handler, which caused the UI to incorrectly fall back to the error render state while the API call was still in-flight. Also tightened the condition to render the error block only when `recipeError` is explicitly truthy.

## 2026-10-21

### Completed (AI Recipe Nutritionist - Phase 1):

- **Structured Nutrition Engine (`recipeGenerator.ts`)**:
  - Upgraded Gemini prompt to integrate certified clinical nutritionist intelligence alongside Michelin-star recipe creation.
  - Designed and implemented strict Zod `NutritionSchema` covering calories (kcal), serving size, macronutrients (protein, carbs, fat, fiber), dietary tags, dietitian tips, and healthy swaps.
  - Implemented Gemini `responseSchema` enforcing structured JSON generation directly from the LLM, eliminating post-processing hallucinations.
  - Added defensive numeric transforms to round floating point values and enforce positive integers/floats.
- **GraphQL Schema & Apollo Hook Modernization**:
  - Extended GraphQL `typeDefs` (`src/graphql/schema.ts`) with `NutritionInfo` and embedded it into `GeneratedRecipe`.
  - Updated `GENERATE_RECIPE` mutation in `usePantry.ts` to request comprehensive nutritional data.
- **Presenter Component Architecture (`RecipeNutritionCard.tsx`)**:
  - Created a modular presenter component following Clean React Rendering and DRY principles.
  - Data-driven macronutrient rendering using static configuration mappings (`MACRO_CONFIGS`) outside component lifecycle.
  - Implemented glassmorphic styling, dietary tags, calorie breakdown badges, and dietitian advice callouts.
  - Added standard nutritional/medical disclaimer.
- **Unit Testing & Boundary Validation (`recipeGenerator.test.ts`)**:
  - Expanded Vitest test suite to cover valid full nutrition parsing, backward compatibility for legacy recipes without nutrition, and mandatory macro validation.
  - Verified 100% test pass rate and static type check compliance (`npx tsc --noEmit`).

## 2026-10-22

### Completed (UI & Layout Alignment):

- **Item Form Dialog Label Alignment Fix (`ItemFormDialog.tsx`)**:
  - Identified root cause of the "Expiry Date" label misalignment: the base Shadcn `Label` component enforces `display: flex; align-items: center; gap: 0.5rem;` in `label.tsx`. Without explicit `justify-content` styling, standard `text-right` was ineffective for single line text nodes, leaving them left-aligned, while two-word labels like "Expiry Date" could wrap onto multiple lines with right-indented second lines.
  - Extracted a centralized constant `FORM_LABEL_CLASS = 'text-right justify-end text-stone-700 font-semibold whitespace-nowrap'` following DRY and clean React principles.
  - Unified all form labels (`Name`, `Quantity`, `Target`, `Category`, `Expiry Date`) with `justify-end` and `whitespace-nowrap`, guaranteeing consistent right alignment against input controls and preventing multiline wrapping.
  - Standardized the DOM structure of the `Quantity` row with a `<div className="col-span-3">` wrapper to match the other form rows.

## 2026-10-23

### Completed (Category Guide & Interactive Taxonomy UX):

- **Data-Driven Category Taxonomy (`src/lib/constants/categories.ts`)**:
  - Extracted centralized `CATEGORY_DEFINITIONS` and `CATEGORY_LIST` adhering to DRY and Clean React Rendering principles.
  - Defined comprehensive metadata for each food category, including emoji icons, plain-English taglines, detailed storage descriptions, curated real-world examples, and accessible color badges.
  - Provided `getCategoryDefinition` helper with graceful fallback to `OTHER`.
- **Base UI Popover Primitive (`src/components/ui/popover.tsx`)**:
  - Implemented accessible, unstyled Popover component utilizing `@base-ui/react/popover` following the `base-nova` Shadcn architecture.
  - Added support for trigger, portal, positioner, popup content, close button, title, and description.
- **Interactive Category Cheat Sheet (`src/components/pantry/CategoryGuidePopover.tsx`)**:
  - Designed and built a Deep Module `CategoryGuidePopover` encapsulated within the pantry module.
  - Provided an instant-reference cheat sheet listing all 7 food categories with representative examples (e.g. Produce: Apples, Bananas, Spinach, Garlic, Tomatoes; Pantry: Rice, Pasta, Olive Oil, Canned Beans, Spices).
  - Implemented one-click selection: clicking any category card in the popover immediately applies the category to the form and dismisses the popover.
- **Rich Category Select & Guide Affordance (`src/components/pantry/ItemFormDialog.tsx`)**:
  - Placed the `HelpCircle` Category Guide trigger directly adjacent to the Category dropdown and AI Auto-categorize button.
  - Enhanced the Select dropdown options with emoji icons and concise real-world examples, eliminating the need to wait 1 to 2 seconds for Gemini AI auto-classification in routine logging.
- **Cross-Component Taxonomy Synchronization**:
  - Refactored `KanbanBoard.tsx` category filter list to dynamically derive from `CATEGORY_LIST`.
  - Refactored `PantryItemCard.tsx` category badges to utilize `getCategoryDefinition`, providing unified color badges and emojis across all cards.
- **Unit Testing & Boundary Verification (`categories.test.ts`)**:
  - Created Vitest unit test suite validating complete coverage of schema categories, presence of metadata/examples, and fallback behaviors.
  - Verified 100% test pass rate (15/15 tests passing across the suite).
- **Vercel Build Fix for Turbopack Font Bug (`package.json`)**:
  - Diagnosed Vercel deployment crash: Next.js 16 defaults to Turbopack for production builds, which suffers from an upstream Rust parser bug when handling Google Fonts URLs containing multiple query parameters (e.g. `&skey=...&v=v37`), throwing `next/font/google queries have exactly one entry`.
  - Configured `"build": "prisma generate && next build --webpack"` to utilize Webpack for production compilation, bypassing the Turbopack font loader bug and ensuring stable production deployments.

## 2026-10-27

### Completed (Mobile-Safe Category Picker):

- **Rebuilt the Category row in `ItemFormDialog.tsx`**:
  - Removed the `?` Category Guide popover (`CategoryGuidePopover.tsx`) and the now-unused `ui/popover.tsx`. Three controls in one row overflowed and overlapped text on phones.
  - Each dropdown option is now self-explanatory: icon + name on the first line, the category tagline (e.g. "Poultry, beef, pork, seafood, and tofu") on the second line. The dropdown may grow wider than its trigger but is capped to the viewport.
  - A one-line hint under the trigger always describes the currently selected category.
  - The AI auto-categorize button is now a compact 40px icon button (`aria-label` + tooltip) next to the dropdown.
- **Consistent form rows**: replaced `grid-cols-4` / `col-span-3` with a shared `FORM_ROW_CLASS` (fixed label column, 5rem on mobile / 5.5rem on desktop) so long labels such as "Expiry Date" no longer overflow at 320px, while keeping the label-left / field-right layout.
- The date input only reserves right padding for the clear button when a date is set, so the placeholder is not clipped on narrow screens.
- Verified in the browser at 320px, 375px, and 1280px (longest option "Beverage" fits at 320px; no horizontal overflow).

### Completed (Agent Docs Migration to Claude Code):

- Moved `.agents/AGENTS.md` to the root `CLAUDE.md` (removed the duplicated section, adapted Antigravity-specific rules, added a Docs Map and a mandatory mobile verification rule).
- Linked `.claude/skills` to `.agents/skills` and migrated the impeccable PostToolUse hook from `.codex/hooks.json` to `.claude/settings.json`.
- Moved the interview-prep workspace (`MISSION.md`, `RESOURCES.md`, `lessons/`, `reference/`) into `docs/learning/`.
- Added concrete mobile layout specs (supported widths, form-row pattern, popup sizing) to `DESIGN.md`.

## 2026-10-28

### Completed (README Refresh):

- Rewrote `README.md` for GitHub visitors: a product summary that matches `PRODUCT.md` (management first, AI as an assistant), a feature tour (partial moves, expiry warnings, voice input, Inspire Me, nutrition card), a tech stack table, a Mermaid architecture diagram, and the project structure.
- Removed outdated claims (Glassmorphism UI, the private admin login) and documented the real local setup: `docker compose up -d` → `cp .env.example .env` → `npx prisma db push` → `npm run dev` → Try Demo, plus `curl /api/cron/reset-demo` to load the sample pantry.
- Updated `.env.example`: added the missing `GEMINI_API_KEY`, aligned `DATABASE_URL` with `docker-compose.yml`, and documented that the Cognito placeholders must stay because `CognitoJwtVerifier.create` throws on a missing pool ID, which breaks the GraphQL route even in demo mode.

### Completed (Mobile Tab Switch Scroll Fix):

- **Bug**: on mobile, switching from a long tab (scrolled to the bottom) to a short one left the user in empty space and forced a long scroll back up. The window is the scroll container and the three columns sit side by side, only shifted with `translate-x`, so the tallest column set the page height for every tab and `scrollY` carried over.
- **Fix in `KanbanBoard.tsx`**: tab taps and swipes now go through one `goToTab()` that, on the mobile layout only (`MOBILE_LAYOUT_QUERY`, mirrors Tailwind `max-md:`), scrolls back to the top and marks the track as sliding. After the slide (`SLIDE_DURATION_MS`, shared with the track's inline `transitionDuration`), inactive columns collapse with `max-md:h-0 overflow-hidden`, so the page is only as tall as the visible tab. Columns stay full height during the slide so the animation never shows a blank panel.
- A timer settles the slide instead of `transitionend`, which does not fire when a transition is interrupted or the tab is in the background.
- Verified in the browser at 320px, 375px, and 1280px: after switching from a 3000px In Pantry list at the bottom, the short tab opens at the top with no blank scroll area (page height = viewport); desktop columns are unaffected; no horizontal overflow.
