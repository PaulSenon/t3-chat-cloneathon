"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            🎉 Subscription Activated!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your premium subscription has been successfully activated.
            You now have unlimited access to all features!
          </p>
          {sessionId && (
            <p className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded">
              Session: {sessionId}
            </p>
          )}
          <div className="space-y-2">
            <Link href="/stripe-demo">
              <Button className="w-full">
                Back to Demo
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to App
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}