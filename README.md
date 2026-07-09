# Pantry-AI: Smart Kitchen & AI Recipe Generator

Pantry-AI is a premium, full-stack Next.js web application that transforms how you manage your kitchen inventory. Built with a focus on **Enterprise-Grade Robustness** and **Glassmorphism Aesthetics**, it utilizes a mobile-optimized Kanban interface to track items (To Buy, In Pantry, Consumed). It integrates natively with Google Gemini AI (3.1 Flash Lite) for two powerful features: **Smart Voice Input** for effortless grocery logging, and an **AI Chef** that generates creative recipes based strictly on your available and requested ingredients using Cross-Board Planning.

## 🚀 Features

- **Glassmorphism UI**: A stunning, premium user interface utilizing Tailwind CSS, micro-animations, dynamic visual blurs, and native-feeling **mobile swipe gestures**.
- **Smart Voice AI**: Speak naturally to log your groceries. The AI auto-extracts item names, exact quantities, categories, and calculates expiry dates.
- **Kanban Inventory Management**: Shift grocery items between `TO_BUY`, `IN_PANTRY`, and `CONSUMED` states with smart merging and Prisma `$transaction` atomic updates.
- **AI-Powered Chef (Gemini 3.1 Flash Lite)**: Generate structured recipes with **Cross-Board Planning** (select must-use ingredients from any list, guided by Michelin-star flavor rules).
- **Enterprise GraphQL API**: Built with Apollo Server and strictly typed Schema-First design for seamless data querying, protected by strict Zod runtime validation.
- **Multi-Tenant Architecture**: Features a public demo mode with a nightly cron reset alongside private administrative access, backed by **PostgreSQL (Neon Serverless)**.
- **Defensive Engineering**: Fortified with Vitest pure logic testing, Husky pre-commit hooks, and a robust Deep Module Next.js architecture.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
- **Backend**: Next.js Server Actions & Route Handlers, Apollo GraphQL Server (@apollo/server).
- **Database**: PostgreSQL (Neon Serverless) via Prisma ORM.
- **AI Integration**: Google GenAI SDK (`gemini-3.1-flash-lite`).
- **Validation & Testing**: Zod, Vitest.
- **Authentication**: AWS Cognito / Custom Multi-Tenant Mock Auth.

## 💻 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/pantry-ai.git
cd pantry-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory and add the following:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/pantry_db?schema=public"

# AI Integration
GEMINI_API_KEY="your_google_gemini_api_key"
```

### 4. Setup the Database

Push the Prisma schema to your local PostgreSQL instance and generate the Prisma Client:

```bash
npm run build # (This project wraps prisma generate inside the build command)
# OR manually:
npx prisma generate
npx prisma db push
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Key Directory Structure

- `src/app`: Next.js App Router entry points and high-level routing logic.
- `src/components/pantry`: Specialized UI Presenter components (e.g., `KanbanBoard`, `ItemFormDialog`, `AIRecipeManager` deep modules).
- `src/graphql`: Apollo GraphQL Resolvers and Type Definitions, handling atomic DB operations.
- `src/lib/ai`: AI Prompts, Voice Parsing, and Recipe Generation services using Gemini 3.1 Flash Lite.
- `src/lib/schemas`: Core Zod schemas for runtime validation, shared safely between frontend and Server Actions.
- `docs/`: Comprehensive project documentation, architectural decisions, and development logs.
- `prisma/`: Database schema and migration tracking.

## 📄 License

This project is licensed under the MIT License.
