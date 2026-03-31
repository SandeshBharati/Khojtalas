from celery import shared_task
# import smtplib
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText

@shared_task
def send_match_email(owner_email: str, lost_item: dict, found_item: dict, scores: dict):
    """
    Trigger: called from run_matching task when score >= 0.95
    """
    total_score = scores['total_score']
    score_pct = f"{total_score * 100:.1f}"
    
    subject = f"🎉 Someone found your lost {lost_item['title']} — {score_pct}% match"
    
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
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg">
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
                <p><strong>Title:</strong> {lost_item['title']}</p>
                <p><strong>Lost Date:</strong> {lost_item.get('time', {}).get('lost_from', 'N/A')}</p>
              </div>
              <div style="width: 48%; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #555;">Found Item</h3>
                <p><strong>Title:</strong> {found_item['title']}</p>
                <p><strong>Found Date:</strong> {found_item.get('time', {}).get('found_at', 'N/A')}</p>
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
              <a href="http://localhost:3000/item/{found_item['id']}" style="background-color: #E85D24; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Found Item</a>
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
    
    Your Lost Item: {lost_item['title']}
    Found Item: {found_item['title']}
    
    Score Breakdown:
    Text match: {scores['text_score'] * 100:.1f}%
    Image match: {scores['image_score'] * 100:.1f}%
    Location match: {scores['location_score'] * 100:.1f}%
    Time match: {scores['time_score'] * 100:.1f}%
    Total score: {score_pct}%
    
    View Found Item: http://localhost:3000/item/{found_item['id']}
    
    If this is not your item, no action needed.
    """
    
    # msg = MIMEMultipart('alternative')
    # msg['Subject'] = subject
    # msg['From'] = "KhojTalas <noreply@khojtalas.com>"
    # msg['To'] = owner_email
    
    # msg.attach(MIMEText(plain_text, 'plain'))
    # msg.attach(MIMEText(html_content, 'html'))
    
    # try:
    #     server = smtplib.SMTP('localhost')
    #     server.sendmail("noreply@khojtalas.com", owner_email, msg.as_string())
    #     server.quit()
    # except Exception as e:
    #     print(f"Failed to send email: {e}")
    
    print(f"Mock sending email to {owner_email} with subject: {subject}")
