"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, useSubscriptionActions } from "@/hooks/useSubscription";
import { useUser } from "@clerk/nextjs";
import { Check, Loader2, Crown, Zap } from "lucide-react";
import { useState } from "react";
import { DEMO_PRICING, formatPrice } from "@/lib/stripe";
import { toast } from "sonner";

// ✅ PERMANENT - Pricing table component
export function PricingTable() {
  const { tier, isLoading, isActive } = useSubscription();
  const { user } = useUser();
  const { createCheckoutSession, openCustomerPortal } = useSubscriptionActions();
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  
  const handleUpgrade = async (priceId: string, planName: string) => {
    if (!user) {
      toast.error("Please sign in to upgrade your subscription");
      return;
    }
    
    setUpgradeLoading(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpgradeLoading(null);
    }
  };
  
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await openCustomerPortal();
      window.location.href = url;
    } catch (error: unknown) {
      console.error('Portal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to access customer portal. Please try again.';
      toast.error(errorMessage);
    } finally {
      setPortalLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading subscription data...</span>
      </div>
    );
  }
  
  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* Free Plan */}
      <Card className="relative border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Crown className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{DEMO_PRICING.FREE.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Perfect for getting started</p>
            </div>
          </div>
          <div className="text-3xl font-bold">
            Free
            <span className="text-lg font-normal text-muted-foreground ml-1">
              forever
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {DEMO_PRICING.FREE.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          
          {tier === "free" ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Downgrade not available
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Premium Monthly Plan */}
      <Card className="relative border-2 border-primary shadow-lg">
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
          Most Popular
        </Badge>
        
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{DEMO_PRICING.PREMIUM_MONTHLY.name}</CardTitle>
              <p className="text-sm text-muted-foreground">For power users</p>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {formatPrice(DEMO_PRICING.PREMIUM_MONTHLY.price)}
            <span className="text-lg font-normal text-muted-foreground">
              /{DEMO_PRICING.PREMIUM_MONTHLY.interval}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {DEMO_PRICING.PREMIUM_MONTHLY.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          
          {tier === "premium-level-1" && isActive ? (
            <div className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => handleUpgrade(DEMO_PRICING.PREMIUM_MONTHLY.priceId, DEMO_PRICING.PREMIUM_MONTHLY.name)}
              className="w-full"
              disabled={upgradeLoading === DEMO_PRICING.PREMIUM_MONTHLY.priceId}
            >
              {upgradeLoading === DEMO_PRICING.PREMIUM_MONTHLY.priceId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Upgrade to Premium'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Premium Yearly Plan */}
      <Card className="relative border-2">
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600">
          Best Value
        </Badge>
        
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{DEMO_PRICING.PREMIUM_YEARLY.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Save with annual billing</p>
            </div>
          </div>
          <div className="text-3xl font-bold">
            {formatPrice(DEMO_PRICING.PREMIUM_YEARLY.price)}
            <span className="text-lg font-normal text-muted-foreground">
              /{DEMO_PRICING.PREMIUM_YEARLY.interval}
            </span>
          </div>
          <div className="text-sm text-green-600 font-medium">
            Save {formatPrice(DEMO_PRICING.PREMIUM_MONTHLY.price * 12 - DEMO_PRICING.PREMIUM_YEARLY.price)} per year
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {DEMO_PRICING.PREMIUM_YEARLY.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          
          {tier === "premium-level-1" && isActive ? (
            <div className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => handleUpgrade(DEMO_PRICING.PREMIUM_YEARLY.priceId, DEMO_PRICING.PREMIUM_YEARLY.name)}
              className="w-full"
              variant="outline"
              disabled={upgradeLoading === DEMO_PRICING.PREMIUM_YEARLY.priceId}
            >
              {upgradeLoading === DEMO_PRICING.PREMIUM_YEARLY.priceId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Upgrade to Yearly'
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ PERMANENT - Compact pricing component for smaller spaces
export function CompactPricingTable() {
  const { tier } = useSubscription();
  const { createCheckoutSession } = useSubscriptionActions();
  const [loading, setLoading] = useState(false);
  
  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckoutSession(DEMO_PRICING.PREMIUM_MONTHLY.priceId);
      window.location.href = url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (tier === "premium-level-1") {
    return null; // Don't show if already premium
  }
  
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Upgrade to Premium</h3>
            <p className="text-sm text-muted-foreground">
              Unlock unlimited messages and advanced AI models
            </p>
          </div>
          <Button 
            onClick={handleUpgrade}
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Upgrade'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}