# T3 Chat Clone 🚀

**Submission for the [T3 ChatCloneathon Competition](https://cloneathon.t3.chat)**  
*Competing for the $10,000+ prize pool*

A modern multi-LLM chat application with real-time streaming, authentication, and payment integration.

## ✨ Features

- **Multi-LLM Support**: OpenAI GPT-4, Anthropic Claude, and more
- **Real-time Chat**: Instant message streaming and synchronization
- **Authentication**: Social login with Clerk (Google, GitHub)
- **Persistence**: Chat history stored with Convex
- **Payments**: Stripe integration for premium tiers
- **Resumable Streams**: Continue conversations after page refresh *(competitive edge)*

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + ShadCN UI
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk
- **AI**: Vercel AI SDK
- **Payments**: Stripe
- **Hosting**: Vercel

## 🚀 Quick Start

This project uses a fully dockerized development environment (zero host dependencies):

```bash
# Clone and navigate
git clone <repo-url>
cd t3-chat-cloneathon

# Install everything (builds Docker container + dependencies)
make install

# Start development server
make dev
```

**Available Commands:**

- `make help` - Show all available commands
- `make run cmd="..."` - Run any command in container
- `make bash` - Access container shell
- `make clean` - Full cleanup

## 📝 Development Notes

- **Container-first**: Everything runs in Docker (Node.js 22 + pnpm)
- **Real-time by default**: Leveraging Convex capabilities
- **Mobile-first**: Responsive design optimized for all devices
- **TypeScript strict**: 100% type safety

---

*Built for the T3 ChatCloneathon • Deadline: June 17, 2025 • Good luck to all participants! 🎯*
