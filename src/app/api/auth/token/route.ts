import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string' || token.length < 8) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('login_tokens').insert({ token })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
