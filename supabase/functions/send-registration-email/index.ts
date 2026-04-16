import { Resend } from "npm:resend";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let { memberName, memberEmail, eventName, eventDate } = await req.json();
    memberEmail = memberEmail?.trim().toLowerCase();

    // Use environment variables — set these in Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_LdJ8WmHJ_7T9oE4qEoCGTiFD6TLUSfHJZ';
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'MAC <noreply@mail.joinmac.club>';
    const adminEmail = (Deno.env.get('ADMIN_EMAIL') || 'joinmac.club@gmail.com').trim().toLowerCase();

    console.log(`Using Sender: ${senderEmail}, Admin: ${adminEmail}, Member: ${memberEmail}`);

    const resend = new Resend(resendApiKey);

    // 1. Send notification to Admin
    const adminResponse = await resend.emails.send({
      from: senderEmail,
      to: adminEmail,
      subject: `New Registration Request — ${eventName}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #eee; border-radius: 12px;">
          
          <div style="border-bottom: 2px solid #d41132; padding-bottom: 16px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #d41132;">MAC — The Limitless Club</p>
            <h2 style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">New Registration Request</h2>
          </div>

          <p style="font-size: 14px; color: #555; margin-bottom: 24px;">A member has requested to join an upcoming experience and requires your confirmation.</p>

          <div style="background: #fdf2f4; padding: 20px 24px; border-radius: 8px; border-left: 4px solid #d41132; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #d41132;">Event</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a;">${eventName}</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #777;">${eventDate}</p>
          </div>

          <div style="background: #f8f8f8; padding: 20px 24px; border-radius: 8px; margin-bottom: 28px;">
            <p style="margin: 0 0 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #555;">Member Details</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #999; width: 110px;">Name</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${memberName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #999;">Email</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">
                  <a href="mailto:${memberEmail}" style="color: #d41132; text-decoration: none;">${memberEmail}</a>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
            Please review and confirm or reject this request via the MAC admin panel. Follow up with the member within 24 hours.
          </p>
        </div>
      `,
    });

    if (adminResponse.error) {
        console.error("Resend Admin Error:", adminResponse.error);
        throw new Error(`Admin email failed: ${adminResponse.error.message}`);
    } else {
        console.log("Admin notification sent:", adminResponse.data);
    }

    // 2. Send confirmation to Member
    const memberResponse = await resend.emails.send({
      from: senderEmail,
      to: memberEmail,
      subject: `Registration Interest — ${eventName}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="font-family: 'Playfair Display', serif; font-style: italic; color: #d41132; margin-bottom: 24px;">Interest Received</h2>
          <p>Hi ${memberName},</p>
          <p>Thank you for your interest in <strong>${eventName}</strong>. We've received your registration request.</p>
          <p>Our team is currently reviewing the manifest and will reach out to you shortly with next steps and further details.</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
            MAC — The Limitless Club
          </div>
        </div>
      `,
    });

    if (memberResponse.error) {
        console.warn("Member confirmation failed:", memberResponse.error);
    } else {
        console.log("Member confirmation sent:", memberResponse.data);
    }

    return new Response(JSON.stringify({ success: true, details: "Logged to console" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
