"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { BotIcon, ArrowRightIcon, LogInIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <BotIcon className="h-12 w-12 text-primary" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              T3 Chat Clone
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A modern AI chat interface built with Next.js 15, Convex, and
              shadcn/ui. Experience seamless conversations with multiple AI
              models.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                {!isSignedIn ? (
                  <Link href="/chat">
                    Sign up and start chatting now !
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link href="/chat">
                    Start Chatting
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 rounded-lg bg-card border">
              <h3 className="text-xl font-semibold mb-3">Modern UI</h3>
              <p className="text-muted-foreground">
                Clean, responsive interface built with shadcn/ui components and
                Tailwind CSS.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <h3 className="text-xl font-semibold mb-3">Real-time Chat</h3>
              <p className="text-muted-foreground">
                Streaming responses and real-time updates powered by Convex
                database.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <h3 className="text-xl font-semibold mb-3">
                Multi-Model Support
              </h3>
              <p className="text-muted-foreground">
                Support for multiple AI models including GPT-4, Claude, and
                more.
              </p>
            </div>
          </div>

          {/* Authentication Info */}
          {isLoaded && !isSignedIn && (
            <div className="mb-12 p-6 rounded-lg bg-muted/50 border">
              <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                <LogInIcon className="h-5 w-5" />
                Get Started
              </h3>
              <p className="text-muted-foreground">
                Sign up or sign in using the buttons in the top-right corner to
                start chatting and save your conversation history.
              </p>
            </div>
          )}

          {/* Tech Stack */}
          <div className="border rounded-lg p-6 bg-muted/50">
            <h3 className="text-lg font-semibold mb-4">
              Built with Modern Technologies
            </h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded bg-background border">
                Next.js 15
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                React 19
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                TypeScript
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                Convex
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                Clerk Auth
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                shadcn/ui
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                Tailwind CSS
              </span>
              <span className="px-3 py-1 rounded bg-background border">
                AI SDK
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
