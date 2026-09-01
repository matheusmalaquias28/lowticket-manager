import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// POST /api/kanban/upload-creative
// Body: { path: string }
// Returns a signed upload URL so the client uploads directly to Supabase Storage
// (avoids proxying the file through Next.js — no body size issues)
export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json() as { path: string }
    if (!path) return NextResponse.json({ error: 'path obrigatório' }, { status: 400 })

    const supabase = adminSupabase()

    const { data, error } = await supabase.storage
      .from('creatives')
      .createSignedUploadUrl(path, { upsert: true })

    if (error) {
      console.error('[upload-creative]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from('creatives').getPublicUrl(path)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: pub.publicUrl,
    })
  } catch (err) {
    console.error('[upload-creative]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
