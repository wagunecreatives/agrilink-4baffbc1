import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { listingId, quantity, customerId, deliveryAddress, notes } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get listing and farmer details
    const { data: listing, error: listingError } = await supabase
      .from("market_listings")
      .select("*, seller:profiles!seller_id(id, full_name, email)")
      .eq("id", listingId)
      .single();
    if (listingError) throw listingError;

    const farmerId = listing.seller_id;
    const farmerEmail = listing.seller.email;
    const farmerName = listing.seller.full_name;
    const totalPrice = listing.price * quantity;

    // 2. Get customer name
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", customerId)
      .single();
    if (customerError) throw customerError;

    // 3. Insert order (matches your orders table)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        listing_id: listingId,
        customer_id: customerId,
        farmer_id: farmerId,
        quantity,
        total_price: totalPrice,
        status: "pending",
        payment_status: "unpaid",
        delivery_address: deliveryAddress || null,
        notes: notes || null,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    // 4. Send email (fire and forget)
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-notification`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
      body: JSON.stringify({
        farmerEmail,
        farmerName,
        customerName: customer.full_name,
        productTitle: listing.title,
        quantity,
        totalPrice,
        orderId: order.id,
      }),
    }).catch(err => console.error("Email failed:", err));

    return new Response(JSON.stringify({ success: true, order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});