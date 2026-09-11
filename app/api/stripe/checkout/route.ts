import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { PRECIO } from '@/lib/planes'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Los pagos aun no estan configurados' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: PRECIO.moneda,
          unit_amount: PRECIO.unit_amount,
          product_data: { name: PRECIO.nombreProducto },
        },
        quantity: 1,
      },
    ],
    metadata: { usuario_id: user.id },
    customer_email: user.email ?? undefined,
    success_url: `${origin}/precio?compra=exitosa`,
    cancel_url: `${origin}/precio?compra=cancelada`,
  })

  return NextResponse.json({ url: session.url })
}
