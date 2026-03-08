import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  try {
    if (!signature) {
      return new Response('Missing signature', { status: 400 })
    }

    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret ?? '')
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { user_id, feature_key } = session.metadata

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need service role to bypass RLS/update permissions
      )

      // Insert permission for user
      const { error } = await supabaseClient
        .from('user_permissions')
        .insert({
          user_id: parseInt(user_id),
          permission_key: feature_key,
          stripe_session_id: session.id,
          amount_paid: session.amount_total,
          currency: session.currency,
          status: 'granted'
        })

      if (error) {
        console.error('Error inserting permission:', error)
        return new Response('Error updating database', { status: 500 })
      }

      console.log(`Permission ${feature_key} granted to user ${user_id}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Internal Error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
})
