import Stripe from 'stripe';
import { env } from '@/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

// 🔄 TEMPORARY - Replace these with your actual Stripe price IDs after creating products
export const PRICE_IDS = {
  PREMIUM_MONTHLY: 'price_1234567890', // Replace with your actual price ID
  PREMIUM_YEARLY: 'price_0987654321',  // Replace with your actual price ID
} as const;

export type PriceId = typeof PRICE_IDS[keyof typeof PRICE_IDS];

export function mapPriceIdToTier(priceId: string): "free" | "premium-level-1" {
  switch (priceId) {
    case PRICE_IDS.PREMIUM_MONTHLY:
    case PRICE_IDS.PREMIUM_YEARLY:
      return "premium-level-1";
    default:
      return "free";
  }
}

export function formatPrice(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// 🔄 TEMPORARY - Example pricing data for demo purposes
export const DEMO_PRICING = {
  FREE: {
    name: "Free",
    price: 0,
    currency: "usd",
    interval: "forever" as const,
    features: [
      "100 messages/month",
      "Basic AI models",
      "Standard support",
    ],
  },
  PREMIUM_MONTHLY: {
    name: "Premium Monthly", 
    price: 999, // $9.99 in cents
    currency: "usd",
    interval: "month" as const,
    priceId: PRICE_IDS.PREMIUM_MONTHLY,
    features: [
      "Unlimited messages",
      "Advanced AI models (GPT-4, Claude)",
      "Priority support",
      "Export conversations",
      "Custom prompts",
    ],
  },
  PREMIUM_YEARLY: {
    name: "Premium Yearly",
    price: 9999, // $99.99 in cents  
    currency: "usd",
    interval: "year" as const,
    priceId: PRICE_IDS.PREMIUM_YEARLY,
    features: [
      "Unlimited messages",
      "Advanced AI models (GPT-4, Claude)", 
      "Priority support",
      "Export conversations",
      "Custom prompts",
      "2 months free",
    ],
  },
} as const;

export type PricingPlan = typeof DEMO_PRICING[keyof typeof DEMO_PRICING];

// Type for Stripe subscription statuses
export type StripeSubscriptionStatus = 
  | "active"
  | "canceled" 
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid"
  | "paused";

// Utility function to check if subscription is active
export function isActiveSubscription(status: StripeSubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

// Utility function to check if subscription needs attention  
export function needsAttention(status: StripeSubscriptionStatus): boolean {
  return status === "past_due" || status === "incomplete";
}