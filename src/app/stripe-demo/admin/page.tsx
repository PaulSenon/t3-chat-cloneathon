"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useSubscription, useStripeCustomer } from "@/hooks/useSubscription";

export default function AdminDemoPage() {
  const { user } = useUser();
  const { subscription, isPremium, tier, isLoading } = useSubscription();
  const { customer } = useStripeCustomer();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">🔄 TEMPORARY - Admin Dashboard</h1>
          <Link href="/stripe-demo">
            <Button variant="outline">Back to Demo</Button>
          </Link>
        </div>
        <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mt-2">
          ⚠️ This is a temporary admin page for testing. Delete after integration is complete.
        </p>
      </div>

      <div className="grid gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{user?.fullName || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{user?.primaryEmailAddress?.emailAddress || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono text-xs">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Tier:</span>
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {tier?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Status */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Schema Deployed:</span>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stripe API Connected:</span>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hooks Enabled:</span>
                <Badge variant="secondary">Mock Data</Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">
                📋 Follow the setup guide to complete the integration. 
                Once the schema is deployed and hooks are enabled, this page will show real subscription data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mock Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-2">
                No subscription data available (setup incomplete)
              </p>
              <Link href="/stripe-demo">
                <Button size="sm">
                  Test Subscription Flow
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Link href="/stripe-demo">
                <Button variant="outline" size="sm">
                  View Pricing Page
                </Button>
              </Link>
              <Link href="/stripe-demo/success?session_id=test_session">
                <Button variant="outline" size="sm">
                  Test Success Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}