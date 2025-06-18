"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  BotIcon,
  ArrowRightIcon,
  LogInIcon,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import Link from "next/link";

/**
 * Home page component
 *
 * This serves as a landing page that introduces users to the chat interface.
 * Features:
 * - Authentication-aware content
 * - Feature highlights
 * - Clear call-to-action based on auth state
 * - Tech stack showcase
 */
export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="min-h-screen mx-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <BotIcon className="h-16 w-16 text-primary" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-sm"></div>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              T3 Chat Clone
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              An open-source, multi-LLM chat interface built for the{" "}
              <a
                href="https://cloneathon.t3.chat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                T3 ChatCloneathon
              </a>
              . Experience real-time streaming, secure authentication, and a
              modern, responsive UI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/chat">
                  {isSignedIn ? "Go to Chat" : "Get Started"}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
              >
                <a
                  href="https://github.com/PaulSenon/t3-chat-cloneathon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View Source
                </a>
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <FeatureCard
              title="🤖 Multi-LLM Support"
              description="Seamlessly switch between OpenAI and Anthropic models in one interface."
            />
            <FeatureCard
              title="⚡ Real-time Streaming"
              description="Powered by the Vercel AI SDK and Convex for instant, streaming responses."
            />
            <FeatureCard
              title="🔒 Secure & Private"
              description="Built with Clerk authentication and Convex Row-Level Security."
            />
          </div>

          {/* Authentication Info */}
          {isLoaded && !isSignedIn && (
            <div className="mb-12 p-6 rounded-lg bg-muted/50 border">
              <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                <LogInIcon className="h-5 w-5" />
                Sign Up to Continue
              </h3>
              <p className="text-muted-foreground">
                Create an account or sign in using the buttons in the top-right
                corner to save and continue your conversations.
              </p>
            </div>
          )}

          {/* Tech Stack */}
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-xl font-semibold mb-6">
              Built with a Modern, Scalable Stack
            </h3>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              {[
                "Next.js 15",
                "Convex",
                "Vercel AI SDK",
                "Clerk",
                "TypeScript",
                "ShadCN UI",
                "Tailwind CSS",
                "Docker",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 rounded-full bg-background border"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center text-muted-foreground">
            <p className="mb-4">
              A project by{" "}
              <a
                href="https://github.com/PaulSenon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground font-medium underline"
              >
                Paul Senon
              </a>{" "}
              for the T3.Chat Cloneathon.
            </p>
            <div className="flex justify-center gap-2">
              <SocialLink
                href="https://github.com/PaulSenon"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </SocialLink>
              <SocialLink
                href="https://x.com/isaaacdotdev"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </SocialLink>
              <SocialLink
                href="https://www.linkedin.com/in/paulsenon/"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </SocialLink>
            </div>
            <p className="mt-6 text-xs">
              Licensed under the{" "}
              <a
                href="https://github.com/PaulSenon/t3-chat-cloneathon/blob/main/LICENSE.TXT"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                MIT License
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="p-6 rounded-lg bg-card border text-left">
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const SocialLink = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
    {...props}
  >
    {children}
  </a>
);
