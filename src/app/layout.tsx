import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "../providers";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T3 Chat Clone",
  description: "Multi-LLM chat interface for the T3 ChatCloneathon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
        >
          {/* Authentication header - positioned to not interfere with chat UI */}
          <div className="fixed top-4 right-4 z-50">
            <Suspense
              fallback={
                <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
              }
            >
              <SignedOut>
                <div className="flex gap-2">
                  <SignInButton>
                    <button className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary rounded-md border border-primary transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </SignedIn>
            </Suspense>
          </div>
          {children}
        </body>
      </html>
    </Providers>
  );
}
