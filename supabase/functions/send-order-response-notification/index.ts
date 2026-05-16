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
    const { farmerName, farmerEmail, customerName, customerEmail, productTitle, quantity, totalPrice, orderId, action } = await req.json();

    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
    if (!customerEmail) throw new Error("Missing customerEmail");

    const accepted = action === "accept";
    const headline = accepted ? "Order accepted ✅" : "Order declined ❌";
    const actionText = accepted
      ? "The farmer accepted your order. Please contact them for delivery details and payment methods."
      : "The farmer declined your order. You can place a new order if you like.";

    const html = `
      <h2>${headline}</h2>
      <p><strong>${customerName}</strong>,</p>
      <p>${actionText}</p>
      <ul>
        <li><strong>Product:</strong> ${productTitle}</li>
        <li><strong>Quantity:</strong> ${quantity} kg</li>
        <li><strong>Total:</strong> KES ${totalPrice}</li>
      </ul>
      <hr />
      <p>Farmer: ${farmerName}</p>
      <p>Email: ${farmerEmail || "N/A"}</p>
      <p><a href="https://yourapp.com/orders/${orderId}">View Order Details</a></p>
      <p style="color: #666;">Automated message from AgriLink Marketplace.</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: accepted ? `Order Accepted: ${productTitle}` : `Order Declined: ${productTitle}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send email");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

