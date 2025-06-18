# T3 Chat Clone - Cloneathon Edition 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**This project is an open-source clone of the [T3.Chat](https://t3.chat) application, built as a submission for the [T3 ChatCloneathon Competition](https://cloneathon.t3.chat).**

This repository contains a modern, multi-LLM chat application featuring real-time streaming, robust authentication, and a secure, scalable backend. It's designed to be a high-performance, production-ready chat interface.

[**Live Demo (Coming Soon)**](#) | [**Cloneathon Page**](https://cloneathon.t3.chat) | [**Original T3.Chat**](https://t3.chat)

For MVP, focus was on basic features but smooth UX and performance.

---

## ✨ Core Features

- **🤖 Multi-LLM Support**: using the Vercel AI SDK v4, you can use any model supported by the SDK.
- **🔒 Secure & Private**: End-to-end security with Clerk for authentication and Convex's Row-Level Security (RLS) to ensure data privacy.
- **🚀 Fast local first caching**: using custom hooks on top of Convex's queries

## 🛠️ Tech Stack

This project leverages a modern, type-safe, and scalable technology stack.

- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Backend & Database**: [Convex](https://convex.dev/) (Real-time serverless backend)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Integration**: [Vercel AI SDK v4](https://sdk.vercel.ai/)
- **UI**: [ShadCN UI](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Containerization (Dev)**: [Docker](https://www.docker.com/) & Docker Compose

## 🏛️ Architecture Highlights

- **Server-Side AI Operations**: All AI SDK calls are handled in Next.js API Routes (`/api/chat`) to protect API keys and manage provider logic securely.
- **Row-Level Security (RLS)**: Utilizes a custom RLS system within Convex (`queryWithRLS`, `mutationWithRLS`) to provide bulletproof data isolation between users automatically.
- **Optimistic UI Updates**: Messages appear instantly in the UI while being sent to the server in the background for a snappy user experience.
- **Local Caching**: All data returned by convex query hooks are cached locally for fast load with good UX of stale data.
- **Component-Based Architecture**: A clean separation of concerns with reusable components for UI, chat logic, and authentication.

## 🚀 Getting Started

This project is fully containerized. The only local dependencies you need are `Docker` (with `docker-compose`) and `make`.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/PaulSenon/t3-chat-cloneathon.git
   cd t3-chat-cloneathon
   ```

2. **Set up environment variables:**
   Copy the example environment file and fill in your keys for Convex, Clerk, OpenAI, and Anthropic.

   ```bash
   cp .env.example .env.local
   ```

3. **Install and Build:**
   This command builds the Docker container and installs all `pnpm` dependencies inside it.

   ```bash
   make install
   ```

   > [!NOTE]
   > It will prompt you for convex setup.
   > Ctrl+C to exit.

4. **Run the Development Server:**
   This starts the Next.js development server inside the container.

   ```bash
   make dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

### Available `make` Commands

- `make help`: Show all available commands.
- `make dev`: Start the development server.
- `make run cmd="..."`: Run any command inside the development container (e.g., `make run cmd="pnpm add package-name"`).
- `make bash`: Get a shell inside the running container.
- `make clean`: Stop and remove all project-related containers and volumes.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE.TXT) file for details.

---

_Developed by [Paul Senon](https://github.com/PaulSenon) for the T3 ChatCloneathon._
_Connect with me on [LinkedIn](https://www.linkedin.com/in/paulsenon/) or [Twitter/X](https://x.com/isaaacdotdev)._
