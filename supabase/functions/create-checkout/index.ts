import { verifyTelegram } from '../_shared/telegram.mjs'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { initData, feature_key } = await req.json()
    const user = await verifyTelegram(initData, Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('BOT_TOKEN'))
    const user_id = user.id
    if (typeof feature_key !== 'string' || !/^[a-z_]{1,64}$/.test(feature_key)) throw new Error('INVALID_PRODUCT')

    // 1. Get product from DB
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', feature_key)
      .eq('active', true)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${feature_key}`)
    }

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://t.me/My_NumerologistBot?start=success_${feature_key}`,
      cancel_url: `https://t.me/My_NumerologistBot?start=cancel`,
      metadata: {
        user_id: user_id.toString(),
        feature_key: feature_key,
      },
    })

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error.message === 'UNAUTHORIZED' ? 401 : error.message === 'AUTH_NOT_CONFIGURED' ? 503 : 400 }
    )
  }
})
