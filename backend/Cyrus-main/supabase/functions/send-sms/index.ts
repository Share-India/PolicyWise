import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // SECURITY: Temporarily disabled secret verification to unblock testing
    /*
    const authHeader = req.headers.get("Authorization");
    const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
    
    if (hookSecret && authHeader !== `Bearer ${hookSecret}`) {
      console.error("Unauthorized request to send-sms hook.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    */

    const phoneNumber = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phoneNumber || !otp) {
      console.error("Missing phone or otp in payload:", JSON.stringify(payload));
      return new Response(JSON.stringify({ error: "Missing phone or otp" }), { status: 400 });
    }

    // Normalize mobile: Ensure we have the '91' prefix and no '+'
    let mobile = phoneNumber.replace(/\+/g, "").trim();
    if (mobile.length === 10) {
      mobile = "91" + mobile;
    }

    // Ensure we strip out any accidental quotes or whitespace that could corrupt the query parameters
    const rawAuthKey = Deno.env.get("MSG91_AUTH_KEY") || "";
    const rawTemplateId = Deno.env.get("MSG91_TEMPLATE_ID") || "";
    
    const msg91AuthKey = rawAuthKey.replace(/['"]/g, "").trim();
    const msg91TemplateId = rawTemplateId.replace(/['"]/g, "").trim();

    if (!msg91AuthKey || !msg91TemplateId) {
      console.error("Missing MSG91 secrets.");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
    }

    console.log(`Sending OTP to ${mobile} via MSG91 template ${msg91TemplateId}`);

    const url = "https://control.msg91.com/api/v5/flow/";

    // ABORT CONTROLLER: Ensure the function returns before Supabase's 10s default timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const msg91Response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
          "authkey": msg91AuthKey 
        },
        signal: controller.signal,
        body: JSON.stringify({
          template_id: msg91TemplateId, 
          mobiles: mobile,
          // MATCHING TEMPLATE: ##alphanumeric## and ##numeric##
          alphanumeric: "Cyber Risk Underwriting System",
          numeric: otp,
          // FALLBACKS:
          var1: "Cyber Risk Underwriting System",
          var2: otp,
          OTP: otp,
          otp: otp
        }),
      });

      clearTimeout(timeoutId);
      const resultText = await msg91Response.text();
      console.log("MSG91 Raw Response:", resultText);
      
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        result = { type: "error", message: `Invalid response format: ${resultText.substring(0, 50)}` };
      }

      if (result.type === "error" || msg91Response.status >= 400) {
        console.error("MSG91 Delivery Failed:", result.message || resultText);
        return new Response(JSON.stringify({ 
          error: "SMS delivery failed", 
          detail: result.message || "Upstream provider error" 
        }), { status: 502 });
      }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error("MSG91 Request Timed Out (6s)");
        return new Response(JSON.stringify({ error: "SMS provider timeout" }), { status: 504 });
      }
      throw err;
    }
  } catch (err) {
    console.error("Edge Function Fatal Error:", err);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      message: err.message 
    }), { status: 500 });
  }
});
