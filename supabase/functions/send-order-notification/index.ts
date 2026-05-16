import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "onboarding@resend.dev"; // change later to your verified domain

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { farmerEmail, farmerName, customerName, productTitle, quantity, totalPrice, orderId } = await req.json();

    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

    const html = `
      <h2>New Order Received! 🌾</h2>
      <p>Hello ${farmerName},</p>
      <p><strong>${customerName}</strong> has placed an order for your product:</p>
      <ul>
        <li><strong>Product:</strong> ${productTitle}</li>
        <li><strong>Quantity:</strong> ${quantity} kg</li>
        <li><strong>Total:</strong> KES ${totalPrice}</li>
      </ul>
      <p>Please contact the buyer to arrange payment and delivery.</p>
      <p><a href="https://yourapp.com/orders/${orderId}">View Order Details</a></p>
      <hr />
      <p style="color: #666;">This is an automated message from AgriLink Marketplace.</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: farmerEmail,
        subject: `New Order: ${productTitle}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});