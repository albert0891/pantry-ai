## Teaching and Documentation Rules (教學與文件規則)

1. **Code Walkthrough Requirement**: 
   Every time you make significant code changes, you MUST create or update a `walkthrough.md` artifact. This document must detail exactly what files were changed, what the new code means, and how the new logic works, so the user can thoroughly review and learn from the changes.

2. **Dev-Log Maintenance**:
   After completing any code update, feature, or phase, you MUST explicitly evaluate if `docs/dev-log.md` needs to be updated. If a task or phase has been completed, automatically update the dev-log to reflect the current progress without waiting for the user to ask.

## Teaching and Documentation Rules (教學與文件規則)

1. **Code Walkthrough Requirement**: 
   Every time you make significant code changes, you MUST create or update a `walkthrough.md` artifact. This document must detail exactly what files were changed, what the new code means, and how the new logic works, so the user can thoroughly review and learn from the changes.

2. **Dev-Log Maintenance**:
   After completing any code update, feature, or phase, you MUST explicitly evaluate if `docs/dev-log.md` needs to be updated. If a task or phase has been completed, automatically update the dev-log to reflect the current progress without waiting for the user to ask.

3. **Mandatory Pre-flight Check**:
   Before ending ANY turn where code was modified, you MUST explicitly state in your internal thoughts: "Did I update `walkthrough.md` and `dev-log.md`?" You are strictly forbidden from returning a final response without satisfying Rules 1 and 2.

## Principle-Driven Engineering (Professional Pushback)

1. **No "Yes-Man" Behavior**: You must NOT blindly agree with the user's architectural, UI/UX, or product suggestions.
2. **Industry-Backed Reasoning**: When evaluating a user request, you must critically analyze it against industry standards, market trends, and software engineering theory.
3. **Firm Pushback**: If the user suggests a suboptimal solution (e.g., deleting a useful database column instead of fixing the UI, or using an anti-pattern), you must FIRMLY disagree, explain *why* it's a bad idea using professional terminology, and propose a superior alternative.
4. **Confident Agreement**: When you agree with a user's idea, validate it by citing *why* it is a good idea in the context of industry best practices.

## Clean React Rendering & DRY Principles

1. **No JSX Hardcoding**: You must NEVER use nested ternary operators or long inline conditional chains inside JSX for mapping values to labels.
2. **Data-Driven Rendering**: Always extract static mappings, select options, or repetitive UI data into constant dictionaries (`Record<string, string>`) or arrays of objects OUTSIDE of the component rendering cycle.
3. **Map Iteration**: Use `Object.entries(MY_DICT).map(...)` or array `.map()` to generate repetitive JSX elements like `<SelectItem>` or list items.
4. **Separation of Concerns**: Keep the JSX clean and focused solely on layout. Business logic and static data definitions must live above or completely outside the React component.

## Architectural Guidelines (Deep Modules vs. God Components)

1. **Prioritize Deep Modules**: When creating features (especially modals, workflows, or distinct business logic like AI generation), encapsulate the state, GraphQL mutations, and UI components into a single "Deep Module" (e.g., `<AIRecipeManager>`).
2. **Prevent God Components**: Do NOT dump all `useState` hooks, `handleX` functions, and mutation states into top-level Route Pages (like `page.tsx`). Root pages should strictly handle layout, route-level params, and high-level structural composition.
3. **High Locality**: If a component acts solely as a "pass-through" for 5+ props just to render a modal or state managed 3 levels up, it is a "Shallow Module." Push the state down into the component so it manages itself.

## Mandatory Post-Edit Verification (強制代碼驗證 S.O.P.)

To prevent regressions and framework invariant violations (e.g., React Rules of Hooks), you must NEVER assume that a successful `build` means the code is bug-free. Next.js/TypeScript builds often compile successfully despite fatal runtime or linting errors.

After any significant code modification, you MUST perform the following pipeline before ending your turn:
1. **Static Analysis (Linting)**: Always run `npm run lint` (or the equivalent linter command). If the project is missing essential plugins (like `eslint-plugin-react-hooks`), proactively suggest installing them.
2. **Semantic Diff Review**: Do not blindly trust the compiler. Mentally review your exact changes (or run `git diff`) and specifically check for framework anti-patterns (e.g., Hooks in loops, mutating state directly, incorrect dependency arrays).
