import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()

  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Firma invalida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const usuarioId = session.metadata?.usuario_id

    if (usuarioId) {
      const admin = createAdminSupabase()
      await admin
        .from('perfiles')
        .update({ plan: 'vitalicio', plan_actualizado_en: new Date().toISOString() })
        .eq('id', usuarioId)

      await admin.from('compras').insert({
        usuario_id: usuarioId,
        stripe_session_id: session.id,
        monto: (session.amount_total ?? 0) / 100,
        moneda: session.currency ?? 'usd',
      })
    }
  }

  return NextResponse.json({ received: true })
}
