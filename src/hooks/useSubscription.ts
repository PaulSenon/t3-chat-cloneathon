import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import type { StripeSubscriptionStatus } from "@/lib/stripe";

// ✅ PERMANENT - Type definitions for subscription data
export type SubscriptionData = {
  _id: string;
  _creationTime: number;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: StripeSubscriptionStatus;
  priceId: string;
  tier: "free" | "premium-level-1";
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  updatedAt: number;
};

// ✅ PERMANENT - Main subscription hook
export function useSubscription() {
  const { user } = useUser();
  
  // TODO: Uncomment after Convex schema is set up
  // const subscription = useQuery(
  //   api.stripe.getUserSubscription,
  //   user ? { userId: user.id } : "skip"
  // );
  
  // 🔄 TEMPORARY - Mock data for development until schema is ready
  const subscription: SubscriptionData | null = null;
  
  return {
    subscription,
    isLoading: subscription === undefined,
    tier: subscription?.tier || "free",
    isActive: subscription?.status === "active",
    isPremium: subscription?.tier === "premium-level-1",
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    // Computed helpers
    isTrialing: subscription?.status === "trialing",
    isPastDue: subscription?.status === "past_due", 
    needsPaymentMethod: subscription?.status === "incomplete",
    // Formatting helpers
    periodEndDate: subscription?.currentPeriodEnd 
      ? new Date(subscription.currentPeriodEnd)
      : null,
    periodEndFormatted: subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
      : null,
  };
}

// ✅ PERMANENT - Hook for Stripe customer data
export function useStripeCustomer() {
  const { user } = useUser();
  
  // TODO: Uncomment after Convex schema is set up
  // const customer = useQuery(
  //   api.stripe.getStripeCustomer,
  //   user ? { userId: user.id } : "skip"
  // );
  
  // 🔄 TEMPORARY - Mock data for development
  const customer: { stripeCustomerId: string; email: string } | null = null;
  
  return {
    customer,
    isLoading: customer === undefined,
    stripeCustomerId: customer?.stripeCustomerId,
    hasStripeCustomer: !!customer,
  };
}

// ✅ PERMANENT - Hook for subscription operations
export function useSubscriptionActions() {
  return {
    createCheckoutSession: async (priceId: string) => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }
      
      return response.json();
    },
    
    openCustomerPortal: async () => {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to access customer portal');
      }
      
      return response.json();
    },
  };
}