import { BotIcon, GithubIcon, LinkedinIcon, TwitterIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ExternalLink } from "lucide-react";
import { SignInButton, SignUpButton } from "../auth/auth-button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "../ui/markdown";

export const WelcomeChat = () => {
  const { isAnonymous, isLoadingClerk } = useAuth();

  return (
    <div className="prose max-w-4xl mx-auto px-6 py-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <BotIcon className="h-16 w-16 text-primary" />
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-sm"></div>
          </div>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
          <a
            className="text-primary underline"
            href="https://t3.chat"
            target="_blank"
            rel="noopener noreferrer"
          >
            T3.Chat
          </a>{" "}
          Clone
        </h1>

        {/* <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          This simply is an open source clone of the T3.chat app{" "}
          <Link href="https://t3.chat">t3.chat</Link>
        </p> */}

        {/* CTA Section */}
        {!isLoadingClerk ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-2">
            {isAnonymous ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <SignInButton size="lg" className="min-w-[140px]" />
                  <SignUpButton size="lg" className="min-w-[140px]" />
                </div>
                <p className="text-sm text-muted-foreground">
                  And get started with your first conversation !
                </p>
              </div>
            ) : (
              <p className="text-lg text-muted-foreground">
                👋 Welcome back! Start a new conversation below.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>

      {/* Competition Info */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-600/5">
        <CardHeader className="text-center text-xl">
          <CardTitle className="flex items-center justify-center gap-2">
            🏆 Built for T3 ChatCloneathon
          </CardTitle>
          <CardDescription className="text-base">
            This project was created as part of the T3 Stack ChatCloneathon
            competition
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center flex flex-col gap-2 max-w-md mx-auto">
          <Button variant="outline" asChild className="gap-2">
            <a
              href="https://cloneathon.t3.chat"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about the competition
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <a
              href="https://github.com/PaulSenon/t3-chat-cloneathon"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="h-4 w-4" />
              View Source Code
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Features Grid */}
      {/* <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🤖 Multi-LLM Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Switch between OpenAI GPT and Anthropic Claude models seamlessly
              within the same conversation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚡ Real-time Streaming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Experience fast, streaming responses with resumable streams - our
              key differentiator.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔒 Secure & Private</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Built-in authentication with Clerk and bulletproof Row-Level
              Security via Convex.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📱 Mobile-First Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Responsive interface optimized for both desktop and mobile with
              smooth 60fps scrolling.
            </p>
          </CardContent>
        </Card>
      </div> */}

      {/* Tech Stack */}
      {/* <div className="text-center mb-12">
        <h2 className="text-xl font-semibold mb-6">
          Built with Modern Tech Stack
        </h2>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {[
            "Next.js 15",
            "Convex",
            "Vercel AI SDK",
            "Clerk Auth",
            "TypeScript",
            "Tailwind CSS",
            "ShadCN UI",
            "T3 Stack",
          ].map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 bg-secondary rounded-full text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div> */}

      <Separator className="mb-8" />

      {/* Footer with Links */}
      <div className="text-center space-y-6">
        {/* Source Code */}
        {/* <div>
          <Button variant="outline" asChild className="gap-2 mb-4">
            <a
              href="https://github.com/PaulSenon/t3-chat-cloneathon"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="h-4 w-4" />
              View Source Code
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div> */}

        {/* Social Links */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            I&apos;m open for work btw...
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/PaulSenon"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <GithubIcon className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://www.linkedin.com/in/paulsenon/"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <LinkedinIcon className="h-4 w-4" />
                LinkedIn
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://x.com/isaaacdotdev"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <TwitterIcon className="h-4 w-4" />
                Twitter
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://medium.com/@isaaacdotdev"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                📝 Medium
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
