"""
VPS endpoint: POST /skill-tracker/send-bilan
Fetches evaluation data from Supabase and sends via assistant@les-pilotes.fr (Gmail)
"""
import base64
import email.mime.multipart
import email.mime.text
import json
import os
from datetime import datetime

import psycopg2
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SUPABASE_DB = {
    'host': 'db.hqitmgdieygglffauycj.supabase.co',
    'port': 5432,
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'L4yqboblQ2SQZbWE',
    'sslmode': 'require'
}

GMAIL_CREDS_PATH = os.path.expanduser('~/.gmail-mcp/credentials.json')
SENDER = 'assistant@les-pilotes.fr'


def get_gmail_service():
    with open(GMAIL_CREDS_PATH) as f:
        d = json.load(f)
    creds = Credentials(
        token=None,
        refresh_token=d['refresh_token'],
        client_id=d['client_id'],
        client_secret=d['client_secret'],
        token_uri='https://oauth2.googleapis.com/token'
    )
    return build('gmail', 'v1', credentials=creds)


def send_bilan(evaluation_id: str, cc: list[str] = None, radar_image: str = None) -> dict:
    conn = psycopg2.connect(**SUPABASE_DB)
    cur = conn.cursor()

    # Fetch evaluation + person + scores
    cur.execute("""
        SELECT e.id, e.created_at, e.general_comment,
               p.name, p.email, p.color,
               es.score, es.comment, s.name as skill_name
        FROM evaluations e
        JOIN people p ON p.id = e.person_id
        JOIN evaluation_scores es ON es.evaluation_id = e.id
        JOIN skills s ON s.id = es.skill_id
        WHERE e.id = %s
        ORDER BY s.name
    """, (evaluation_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return {'error': 'Évaluation introuvable'}

    person_name  = rows[0][3]
    person_email = rows[0][4]
    person_color = rows[0][5] or '#BA7517'
    created_at   = rows[0][1]
    general_comment = rows[0][2]

    eval_date = created_at.strftime('%-d %B %Y') if created_at else ''
    scores = [(r[8], r[6], r[7]) for r in rows]  # (skill_name, score, comment)
    avg = sum(s[1] for s in scores) / len(scores)

    initials = ''.join(w[0] for w in person_name.split())[:2].upper()

    scores_rows = ''.join(f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px">{sn}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">
            <span style="font-weight:600;color:{person_color}">{sc}</span><span style="color:#999"> / 5</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#5F5E5A;font-size:13px">{cm or ''}</td>
        </tr>""" for sn, sc, cm in sorted(scores, key=lambda x: -x[1]))

    html = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#F7F6F3;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto;background:white;border:1px solid #E8E7E3;border-radius:8px;overflow:hidden">
  <div style="padding:24px;border-bottom:1px solid #E8E7E3">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:50%;background:{person_color};display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:16px">{initials}</div>
      <div>
        <div style="font-size:18px;font-weight:600;color:#1a1a1a">{person_name}</div>
        <div style="font-size:13px;color:#5F5E5A">Bilan de compétences — {eval_date}</div>
      </div>
      <div style="margin-left:auto;background:#FAEEDA;color:#BA7517;font-size:16px;font-weight:700;padding:6px 16px;border-radius:20px">{avg:.1f} / 5</div>
    </div>
  </div>
  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:8px 12px;background:#F7F6F3;font-size:12px;color:#5F5E5A;text-transform:uppercase">Compétence</th>
        <th style="text-align:center;padding:8px 12px;background:#F7F6F3;font-size:12px;color:#5F5E5A;text-transform:uppercase">Note</th>
        <th style="text-align:left;padding:8px 12px;background:#F7F6F3;font-size:12px;color:#5F5E5A;text-transform:uppercase">Commentaire</th>
      </tr></thead>
      <tbody>{scores_rows}</tbody>
    </table>
    {f'<div style="margin-top:20px;padding:16px;background:#F7F6F3;border-radius:6px"><div style="font-size:12px;color:#5F5E5A;margin-bottom:6px;font-weight:600">COMMENTAIRE GÉNÉRAL</div><div style="font-size:14px;color:#1a1a1a">{general_comment}</div></div>' if general_comment else ''}
    {f'<div style="margin-top:24px"><div style="font-size:12px;font-weight:600;color:#5F5E5A;text-transform:uppercase;margin-bottom:12px">Radar des compétences</div><img src="{radar_image}" style="max-width:100%;border-radius:6px" alt="Radar"></div>' if radar_image else ''}
  </div>
  <div style="padding:16px 24px;border-top:1px solid #E8E7E3;font-size:12px;color:#B4B2A9;text-align:center">Pilotes Academy — Skill Tracker · Les Pilotes</div>
</div>
</body></html>"""

    # Build email
    msg = email.mime.multipart.MIMEMultipart('alternative')
    msg['From']    = f'Pilotes Academy <{SENDER}>'
    msg['To']      = person_email
    msg['Subject'] = f'Bilan de compétences — {person_name} — {eval_date}'
    if cc:
        msg['Cc'] = ', '.join(cc)
    msg.attach(email.mime.text.MIMEText(html, 'html'))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    service = get_gmail_service()
    result = service.users().messages().send(userId='me', body={'raw': raw}).execute()
    return {'success': True, 'message_id': result.get('id'), 'to': person_email}


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 send_bilan.py <evaluation_id> [cc_email]")
        sys.exit(1)
    ev_id = sys.argv[1]
    cc = sys.argv[2:] if len(sys.argv) > 2 else []
    result = send_bilan(ev_id, cc)
    print(json.dumps(result, indent=2))
