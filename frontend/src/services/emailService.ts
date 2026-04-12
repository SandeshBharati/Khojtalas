/**
 * Lightweight email helper using EmailJS (https://www.emailjs.com).
 *
 * Set these env vars in .env.local:
 *   EMAILJS_SERVICE_ID   – the service id from your EmailJS dashboard
 *   EMAILJS_TEMPLATE_ID  – the template id (template should have {{to_email}}, {{subject}}, {{message}} vars)
 *   EMAILJS_PUBLIC_KEY   – your EmailJS public key
 *
 * If any of those are missing the helper logs a warning and skips sending.
 */

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID ?? '';
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID ?? '';
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY ?? '';

export async function sendEmail(toEmail: string, subject: string, message: string): Promise<boolean> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[email] EmailJS not configured — skipping email to', toEmail);
    return false;
  }

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          subject,
          message,
        },
      }),
    });

    if (!res.ok) {
      console.error('[email] EmailJS responded with', res.status, await res.text());
      return false;
    }

    console.log('[email] Sent to', toEmail);
    return true;
  } catch (err) {
    console.error('[email] Failed to send', err);
    return false;
  }
}
