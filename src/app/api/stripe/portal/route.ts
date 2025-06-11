import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    if (!token) {
      return NextResponse.json({ error: 'Unable to get auth token' }, { status: 401 });
    }
    
    // Get customer from Convex
    const customer = await fetchQuery(
      api.stripe.getStripeCustomer,
      { userId },
      { token }
    );
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe-demo`,
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}