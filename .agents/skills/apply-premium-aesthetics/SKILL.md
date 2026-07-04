---
name: apply-premium-aesthetics
description: High-end UI/UX research and implementation methodology. Use this skill whenever planning new UI components, features, or fixing ugly designs, to ensure premium Glassmorphism aesthetics and active trend research.
---

# Apply Premium Aesthetics (Research-Driven UI/UX Design)

When tasked with designing new UI, building new features, or redesigning components, you MUST execute this three-step methodology during the planning phase:

## 1. Web Trend Research (主動調研)

- Do not rely solely on your internal training data. Use `search_web` to look up the latest UI/UX trends (e.g., from Vercel, Linear, Framer, Awwwards, or Tailwind UI).
- Gather inspiration for the specific component you are building (e.g., "modern web app voice input button UI", "premium dashboard data table UX").

## 2. Contextual DNA Integration (環境基因融合)

- Analyze the project's current design language by reading `globals.css`, `tailwind.config.ts`, or adjacent components.
- Extrapolate the core aesthetics. For this project, it is **Premium Glassmorphism**:
  - Translucent backgrounds (e.g., `bg-white/40`, `bg-sky-500/90`)
  - Blurs (`backdrop-blur-md`, `backdrop-blur-xl`)
  - Subtle and soft borders/shadows (`border-white/50`, `shadow-sm`)
- Downscale or adapt the web trends found in Step 1 to perfectly fit this DNA. **Ban Cheap AI Tropes**: No harsh neon gradients, no massive glowing borders, and no exaggerated pulsing animations unless strictly necessary. Ensure "Invisible AI" principles where AI features feel native and understated.
- Feedback Subtlety: For active states (like loading or listening), use minimalist and elegant feedback (e.g., a tiny dot pulsing, or a soft text color change) instead of violently pulsating the entire button.

## 3. Parallel Design Exploration (多重方案推薦)

- In your `implementation_plan.md`, provide 2-3 distinct UI/UX approaches for the user to choose from.
- Compare their pros and cons.
- You may use the `design-an-interface` skill or spin up sub-agents to explore radical variations if the feature is large enough.

## Output

When proposing UI changes, explicitly mention how you applied this skill (e.g., what trend you found, how you adapted it to Glassmorphism, and your 2-3 options).
