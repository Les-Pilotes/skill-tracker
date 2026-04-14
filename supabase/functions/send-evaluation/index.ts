import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { evaluation_id } = await req.json()
    if (!evaluation_id) throw new Error('evaluation_id requis')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch evaluation with person and scores
    const { data: ev, error: evErr } = await supabase
      .from('evaluations')
      .select(`
        *,
        people (name, email, color),
        evaluation_scores (score, comment, skills (name))
      `)
      .eq('id', evaluation_id)
      .single()

    if (evErr || !ev) throw new Error('Évaluation introuvable')

    const person = ev.people
    if (!person?.email) throw new Error('Aucun email défini pour ce membre')

    const scores = ev.evaluation_scores || []
    const avg = scores.length
      ? (scores.reduce((a: number, s: any) => a + s.score, 0) / scores.length).toFixed(1)
      : '—'

    const evalDate = new Date(ev.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    // Build scores table HTML
    const scoresTableRows = scores
      .sort((a: any, b: any) => b.score - a.score)
      .map((s: any) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px">${s.skills?.name || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">
            <span style="font-weight:600;color:#BA7517">${s.score}</span><span style="color:#999"> / 5</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#5F5E5A;font-size:13px">${s.comment || ''}</td>
        </tr>`).join('')

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Bilan de compétences</title></head>
<body style="font-family:sans-serif;background:#F7F6F3;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E8E7E3;border-radius:8px;overflow:hidden">

  <div style="padding:24px;border-bottom:1px solid #E8E7E3">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:50%;background:${person.color};display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:16px">
        ${person.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)}
      </div>
      <div>
        <div style="font-size:18px;font-weight:600;color:#1a1a1a">${person.name}</div>
        <div style="font-size:13px;color:#5F5E5A">Bilan de compétences — ${evalDate}</div>
      </div>
      <div style="margin-left:auto;background:#FAEEDA;color:#BA7517;font-size:16px;font-weight:700;padding:6px 16px;border-radius:20px">
        ${avg} / 5
      </div>
    </div>
  </div>

  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 12px;background:#F7F6F3;font-size:12px;color:#5F5E5A;text-transform:uppercase;letter-spacing:0.04em">Compétence</th>
          <th style="text-align:center;padding:8px 12px;background:#F7F6F3;font-size:12px;color:#5F5E5A;text-transform:uppercase;letter-spacing:0.04em">Note</th>
          <th style="text-align:left;padding:8px 12px;background:#F7F6F3;font-size:12px;color:#5F5E5A;text-transform:uppercase;letter-spacing:0.04em">Commentaire</th>
        </tr>
      </thead>
      <tbody>${scoresTableRows}</tbody>
    </table>

    ${ev.general_comment ? `
    <div style="margin-top:20px;padding:16px;background:#F7F6F3;border-radius:6px">
      <div style="font-size:12px;color:#5F5E5A;margin-bottom:6px;font-weight:600">COMMENTAIRE GÉNÉRAL</div>
      <div style="font-size:14px;color:#1a1a1a">${ev.general_comment}</div>
    </div>` : ''}
  </div>

  <div style="padding:16px 24px;border-top:1px solid #E8E7E3;font-size:12px;color:#B4B2A9;text-align:center">
    Pilotes Academy — Skill Tracker · Les Pilotes
  </div>
</div>
</body>
</html>`

    // Send via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Pilotes Academy <noreply@les-pilotes.fr>',
        to: [person.email],
        subject: `Bilan de compétences — ${person.name} — ${evalDate}`,
        html
      })
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error(`Resend error: ${err}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
