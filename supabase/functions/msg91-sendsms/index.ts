import { Webhook } from "https://esm.sh/svix@1.45.0";

// These variables will be securely configured in your Supabase Dashboard
const WEBHOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET")!;
const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY")!;
const MSG91_TEMPLATE_ID = Deno.env.get("MSG91_TEMPLATE_ID")!;

Deno.serve(async (req) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // 1. Verify the webhook signature to ensure it's a legitimate request from Supabase Auth
  const wh = new Webhook(WEBHOOK_SECRET);
  let event;
  
  try {
    event = wh.verify(payload, headers) as {
      user: { phone: string };
      sms: { otp: string };
    };
  } catch (err) {
    console.error("Signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Extract phone and OTP from the verified Supabase payload
  const phone = event.user?.phone;
  const otp = event.sms?.otp;
  
  if (!phone || !otp) {
    return new Response("Missing phone or OTP in payload", { status: 400 });
  }

  // MSG91 prefers mobile numbers without the '+' sign
  const cleanPhone = phone.replace("+", "");

  // 2. Call MSG91 SendOTP API (v5)
  // === MSG91 Setup Commented Out ===
  // try {
  //   console.log(`Attempting to send OTP via MSG91 to ${cleanPhone}`);
  //   
  //   const response = await fetch("https://control.msg91.com/api/v5/otp", {
  //     method: "POST",
  //     headers: {
  //       "authkey": MSG91_AUTH_KEY,
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({
  //       template_id: MSG91_TEMPLATE_ID,
  //       mobile: cleanPhone,
  //       otp: otp
  //     })
  //   });
  //
  //   const data = await response.json();
  //   console.log("MSG91 API Response:", data);
  //
  //   if (data.type === "error") {
  //     throw new Error(`MSG91 returned an error: ${data.message}`);
  //   }
  //
  //   return new Response(JSON.stringify({ success: true, message: "OTP sent via MSG91" }), { 
  //     status: 200,
  //     headers: { "Content-Type": "application/json" }
  //   });
  //   
  // } catch (error) {
  //   console.error("Failed to execute MSG91 call:", error);
  //   return new Response(JSON.stringify({ error: "Failed to send SMS via MSG91" }), { 
  //     status: 500,
  //     headers: { "Content-Type": "application/json" } 
  //   });
  // }

  // Fallback response since MSG91 is commented out
  return new Response(JSON.stringify({ 
    success: false, 
    error: "MSG91 Hook is disabled. To use Twilio natively, please disable the Custom SMS Hook in your Supabase Dashboard." 
  }), { 
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
});
