import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { api } from '../../../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Convex client for webhooks
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');
  
  if (!signature) {
    console.error('No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error: unknown) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
  
  console.log(`✅ Received webhook: ${event.type}`);
  
  try {
    await processStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await convex.mutation(api.stripe.syncStripeSubscription, {
          stripeCustomerId: session.customer as string,
          stripeEventId: event.id,
        });
      }
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await convex.mutation(api.stripe.syncStripeSubscription, {
        stripeCustomerId: subscription.customer as string,
        stripeEventId: event.id,
      });
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
        await convex.mutation(api.stripe.syncStripeSubscription, {
          stripeCustomerId: invoice.customer as string,
          stripeEventId: event.id,
        });
      }
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}