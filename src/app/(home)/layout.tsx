import { Suspense } from "react";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@/components/auth/auth-button";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Suspense
          fallback={
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
          }
        >
          <SignedOut>
            <div className="flex gap-2">
              <SignInButton />
              <SignUpButton />
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
    </>
  );
}
