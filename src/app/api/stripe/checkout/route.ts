import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

// ✅ PERMANENT - Stripe checkout session creation endpoint
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { priceId } = await request.json();
    
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
    }
    
    // Validate priceId format (basic validation)
    if (!priceId.startsWith('price_')) {
      return NextResponse.json({ error: 'Invalid price ID format' }, { status: 400 });
    }
    
    // Get Clerk user details and token
    const user = await currentUser();
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    
    if (!token || !user) {
      return NextResponse.json({ error: 'Unable to get user data' }, { status: 401 });
    }
    
    // Create checkout session via Convex
    const result = await fetchMutation(
      api.stripe.createCheckoutSession,
      {
        priceId,
        userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || undefined,
      },
      { token }
    );
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Checkout error:', error);
    
    // Handle specific error types
    if (error.message?.includes('No such price')) {
      return NextResponse.json(
        { error: 'Invalid price ID. Please check your Stripe configuration.' },
        { status: 400 }
      );
    }
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Stripe configuration error. Please check your API keys.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}