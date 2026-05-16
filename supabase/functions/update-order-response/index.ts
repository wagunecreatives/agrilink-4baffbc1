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
    const { orderId, action } = await req.json();

    if (!orderId) throw new Error("Missing orderId");
    if (action !== "accept" && action !== "decline") {
      throw new Error("Invalid action. Use accept or decline");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, farmer_id, customer_id, listing_id, status")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");

    // 2) Identify caller (farmer) from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError) throw userError;

    const callerId = userData.user?.id;
    if (!callerId) throw new Error("Unauthorized");

    if (order.farmer_id !== callerId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Update order status based on action
    const nextStatus = action === "accept" ? "confirmed" : "cancelled";

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, order: updated }), {
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

