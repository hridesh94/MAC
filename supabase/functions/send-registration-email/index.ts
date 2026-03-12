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

    // Use environment variables or fallback to provided key for initial testing
    // RECOMMENDED: Set these in Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_bQeF7X6L_2SXVCjnNFxFjkmqKAUdbnkoh';
    const senderEmail = 'Resend <onboarding@resend.dev>';
    const adminEmail = (Deno.env.get('ADMIN_EMAIL') || 'hridesh.775421@pmc.tu.edu.np').trim().toLowerCase();

    console.log(`Using Sender: ${senderEmail}, Admin: ${adminEmail}, Member: ${memberEmail}`);

    const resend = new Resend(resendApiKey);

    // 1. Send notification to Admin
    const adminResponse = await resend.emails.send({
      from: senderEmail,
      to: adminEmail,
      subject: `Registration Request — ${eventName}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="font-family: 'Playfair Display', serif; font-style: italic; color: #d41132; margin-bottom: 24px;">New Registration Request</h2>
          <p style="font-size: 16px;"><strong>${memberName}</strong> (${memberEmail}) has requested to join:</p>
          <div style="background: #fdf2f4; padding: 24px; border-radius: 8px; border-left: 4px solid #d41132; margin: 24px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${eventName}</p>
            <p style="margin: 8px 0 0; opacity: 0.7;">${eventDate}</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 32px; border-top: 1px solid #eee; pt: 16px;">
            Please follow up with the member within 24 hours to confirm details.
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
