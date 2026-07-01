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
