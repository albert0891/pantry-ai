# Pantry-AI: Smart Kitchen & AI Recipe Generator

Pantry-AI is a premium, full-stack Next.js web application that transforms how you manage your kitchen inventory. It utilizes a drag-and-drop Kanban interface to track items (To Buy, In Pantry, Consumed) and integrates natively with Google Gemini AI to generate creative recipes based strictly on what you currently have in your fridge.

## 🚀 Features

- **Glassmorphism UI**: A stunning, premium user interface utilizing Tailwind CSS, micro-animations, and dynamic visual blurs.
- **Kanban Inventory Management**: Easily shift grocery items between `TO_BUY`, `IN_PANTRY`, and `CONSUMED` states. Features smart merging of identical items during partial moves.
- **AI-Powered Chef (Gemini)**: Select "must-use" ingredients from your pantry and let the AI generate structured, delicious recipes using your current stock.
- **Enterprise GraphQL API**: Built with Apollo Server and strictly typed Schema-First design for seamless, over-fetch-free data querying.
- **PostgreSQL + Prisma**: Rock-solid relational database design with scalable Cognito-decoupled User authentication schemas.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
- **Backend**: Next.js Route Handlers, Apollo GraphQL Server (@apollo/server).
- **Database**: PostgreSQL (Neon Serverless) via Prisma ORM.
- **AI Integration**: Google GenAI SDK (`gemini-3.5-flash`).
- **Authentication**: AWS Cognito.

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

- `src/app`: Next.js App Router entry points and UI pages.
- `src/components/pantry`: Specialized UI Presenter components (Navbar, Kanban, Modals).
- `src/graphql`: Apollo GraphQL Resolvers and Type Definitions.
- `src/hooks`: Custom React hooks (e.g., `usePantry.ts`) for data fetching.
- `src/lib/ai`: Gemini Prompting and Recipe Generation services.
- `prisma`: Database schema and migration tracking.

## 📄 License
This project is licensed under the MIT License.
