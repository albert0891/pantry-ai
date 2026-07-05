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
- **Graceful Error Handling (Toast UI)**: Handled edge cases where AI fails to parse voice input. Replaced silent `console.error` crashes with a soft red inline error message in `ItemFormDialog.tsx`, providing a robust, user-friendly fallback.
- **Relative Date Context Fix**: Supplied the current day of the week to the Gemini prompt to ensure accurate relative date calculations (e.g., "next Wednesday").
- **Enterprise Engineering Rules**: Established the `Default to Enterprise-Grade Robustness` rule in `.agents/AGENTS.md`, formally rejecting MVP technical debt. Established `/prototype` as the official override switch for rapid ideation.
- **Research-Driven Design Rule**: Established the `apply-premium-aesthetics` skill to strictly enforce active web trend research and contextual Glassmorphism integration during UI planning phases.
