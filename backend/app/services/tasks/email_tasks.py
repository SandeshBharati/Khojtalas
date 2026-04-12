import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.celery_app import celery_app


@celery_app.task
def send_match_email(owner_email: str, lost_item: dict, found_item: dict, scores: dict):
    """
    Trigger: called from run_matching task when score >= 0.95
    """
    total_score = scores['total_score']
    score_pct = f"{total_score * 100:.1f}"
    
    subject = f"Someone found your lost {lost_item.get('category', 'item')} — {score_pct}% match"
    
    # HTML body sections:
    # 1. KhojTalas branded header (dark #1a1a18 bg, orange logo)
    # 2. Headline: "A possible match was found!"
    # 3. Match score displayed as large % badge:
    #      - >= 97% -> green badge "Excellent match"
    #      - 95-97% -> amber badge "Strong match"
    # 4. Side-by-side comparison card:
    #      LEFT: Lost item thumbnail + title + lost date + lost route
    #      RIGHT: Found item thumbnail + title + found date + found location
    # 5. Score breakdown table:
    #      Text match:     XX%
    #      Image match:    XX%
    #      Location match: XX%
    #      Time match:     XX%
    #      ─────────────────
    #      Total score:    XX%
    # 6. Orange CTA button: "View Found Item"
    #      -> links to: http://localhost:3000/found-items/{found_item_id}
    # 7. Footer: "If this is not your item, no action needed."
    
    badge_color = "green" if total_score >= 0.97 else "orange"
    badge_text = "Excellent match" if total_score >= 0.97 else "Strong match"
    app_url = os.getenv("APP_URL", "http://localhost:3000")
    
    lost_title = lost_item.get('brand', lost_item.get('category', 'item'))
    found_title = found_item.get('brand', found_item.get('category', 'item'))
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #1a1a18; padding: 20px; text-align: center;">
            <h1 style="color: #E85D24; margin: 0;">KhojTalas</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">A possible match was found!</h2>
            <div style="background-color: {badge_color}; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; margin-bottom: 20px;">
              {badge_text} - {score_pct}% Match
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div style="width: 48%; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #555;">Your Lost Item</h3>
                <p><strong>Title:</strong> {lost_title}</p>
                <p><strong>Lost Date:</strong> {lost_item.get('timeFrom', 'N/A')}</p>
              </div>
              <div style="width: 48%; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #555;">Found Item</h3>
                <p><strong>Title:</strong> {found_title}</p>
                <p><strong>Found Date:</strong> {found_item.get('timeFrom', 'N/A')}</p>
              </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 5px 0;">Text match:</td><td style="text-align: right;">{scores['text_score'] * 100:.1f}%</td></tr>
              <tr><td style="padding: 5px 0;">Image match:</td><td style="text-align: right;">{scores['image_score'] * 100:.1f}%</td></tr>
              <tr><td style="padding: 5px 0;">Location match:</td><td style="text-align: right;">{scores['location_score'] * 100:.1f}%</td></tr>
              <tr><td style="padding: 5px 0;">Time match:</td><td style="text-align: right;">{scores['time_score'] * 100:.1f}%</td></tr>
              <tr><td colspan="2"><hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;"></td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Total score:</td><td style="text-align: right; font-weight: bold;">{score_pct}%</td></tr>
            </table>
            
            <div style="text-align: center;">
              <a href="{app_url}/item/{found_item.get('id', '')}" style="background-color: #E85D24; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Found Item</a>
            </div>
          </div>
          <div style="background-color: #f9f9f9; padding: 15px; text-align: center; color: #777; font-size: 12px;">
            If this is not your item, no action needed.
          </div>
        </div>
      </body>
    </html>
    """
    
    plain_text = f"""
    A possible match was found!
    
    {badge_text} - {score_pct}% Match
    
    Your Lost Item: {lost_item.get('category', 'item')}
    Found Item: {found_item.get('category', 'item')}
    
    Score Breakdown:
    Text match: {scores['text_score'] * 100:.1f}%
    Image match: {scores['image_score'] * 100:.1f}%
    Location match: {scores['location_score'] * 100:.1f}%
    Time match: {scores['time_score'] * 100:.1f}%
    Total score: {score_pct}%
    
    View Found Item: {app_url}/item/{found_item.get('id', '')}
    
    If this is not your item, no action needed.
    """
    
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    from_email = os.getenv("SMTP_FROM", "KhojTalas <noreply@khojtalas.com>")
    
    if not smtp_host or not smtp_user:
        print(f"[email] SMTP not configured — skipping email to {owner_email}")
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = owner_email
    
    msg.attach(MIMEText(plain_text, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, owner_email, msg.as_string())
        server.quit()
        print(f"[email] Sent match notification to {owner_email}")
    except Exception as e:
        print(f"[email] Failed to send to {owner_email}: {e}")
