import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';

// Initialize Stripe with secret key
const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10'
});

// Get Supabase client with service role for database writes
function getSupabaseServiceClient() {
  const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      get() { return undefined; },
      set() {},
      remove() {},
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Received Stripe webhook:', event.type, 'ID:', event.id);

    // Get Supabase service client for database operations
    const supabase = getSupabaseServiceClient();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);

        // Store successful payment
        const { error: paymentError } = await supabase
          .from('donations')
          .upsert({
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'completed',
            donor_email: paymentIntent.receipt_email,
            metadata: paymentIntent.metadata,
            processed_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_payment_intent_id'
          });

        if (paymentError) {
          console.error('Error storing payment:', paymentError);
        } else {
          console.log('Payment stored successfully:', paymentIntent.id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', failedPayment.id);

        // Update payment status
        const { error: failureError } = await supabase
          .from('donations')
          .upsert({
            stripe_payment_intent_id: failedPayment.id,
            amount: failedPayment.amount,
            currency: failedPayment.currency,
            status: 'failed',
            donor_email: failedPayment.receipt_email,
            metadata: failedPayment.metadata,
            processed_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_payment_intent_id'
          });

        if (failureError) {
          console.error('Error updating failed payment:', failureError);
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription event:', event.type, subscription.id);

        // Store subscription info
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            metadata: subscription.metadata,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (subscriptionError) {
          console.error('Error storing subscription:', subscriptionError);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', deletedSubscription.id);

        // Update subscription status
        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', deletedSubscription.id);

        if (cancelError) {
          console.error('Error updating cancelled subscription:', cancelError);
        }
        break;

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Handle one-time payments or subscription setup
        if (session.mode === 'payment' && session.payment_intent) {
          // One-time payment - will be handled by payment_intent.succeeded
          console.log('One-time payment completed:', session.payment_intent);
        } else if (session.mode === 'subscription' && session.subscription) {
          // Subscription setup - will be handled by customer.subscription.created
          console.log('Subscription setup completed:', session.subscription);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log webhook event for audit trail
    const { error: logError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'stripe',
        event_type: event.type,
        event_id: event.id,
        processed_at: new Date().toISOString(),
        raw_data: event,
      });

    if (logError) {
      console.error('Error logging webhook event:', logError);
      // Don't fail the webhook for logging errors
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};