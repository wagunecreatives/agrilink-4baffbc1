import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { Order, MarketListing, Profile } from "@/types/database";

type OrderAction = "accept" | "decline";

type OrderWithListing = Order & { listing?: MarketListing | null };

export default function OrdersForFarmer() {
  const { user, profile, roles, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderWithListing[]>([]);
  const [loading, setLoading] = useState(false);

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithListing | null>(null);
  const [customerProfile, setCustomerProfile] = useState<Profile | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  const isFarmer = roles.includes("farmer") || roles.includes("admin");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isFarmer) {
      navigate("/marketplace");
    }
  }, [user, isAuthLoading, isFarmer, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Farmer can only see orders belonging to them.
      const q = (supabase as any)
        .from("orders")
        .select(
          "*, listing:market_listings(id, title, crop_type, quantity, unit, price, images, location, created_at)"
        )
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await q;
      if (error) throw error;

      const mapped: OrderWithListing[] = (data || []).map((row: any) => ({
        ...(row as Order),
        listing: row.listing ?? null,
      }));

      setOrders(mapped);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isFarmer) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isFarmer]);

  const fetchCustomerForOrder = async (order: OrderWithListing) => {
    setCustomerLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("id", order.customer_id)
        .single();

      if (error) throw error;
      setCustomerProfile((data as Profile) ?? null);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load customer details");
      setCustomerProfile(null);
    } finally {
      setCustomerLoading(false);
    }
  };

  const callUpdateOrderResponse = async (order: OrderWithListing, action: OrderAction) => {
    if (!user) throw new Error("Not authenticated");

    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-order-response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ orderId: order.id, action }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed");
    return json?.order as Order;
  };

  const notifyCustomer = async (order: OrderWithListing, action: OrderAction) => {
    if (!order.listing) return;

    const listing = order.listing;
    const totalPrice = order.total_price;

    const { data: cData } = await (supabase as any)
      .from("profiles")
      .select("full_name, email")
      .eq("id", order.customer_id)
      .single();

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-response-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        orderId: order.id,
        productTitle: listing.title,
        quantity: order.quantity,
        totalPrice,
        farmerName: profile?.full_name || "Farmer",
        farmerEmail: profile?.email,
        customerName: cData?.full_name ?? order.customer_id,
        customerEmail: cData?.email,
      }),
    });
  };

  const onAccept = async (order: OrderWithListing) => {
    try {
      toast.message("Confirming acceptance...");
      const updated = await callUpdateOrderResponse(order, "accept");

      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      toast.success("Order accepted");

      setSelectedOrder({ ...order, status: updated.status });
      setCustomerDialogOpen(true);
      await fetchCustomerForOrder({ ...order, status: updated.status });

      await notifyCustomer(order, "accept").catch(() => undefined);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to accept order");
    }
  };

  const onDecline = async (order: OrderWithListing) => {
    try {
      const updated = await callUpdateOrderResponse(order, "decline");

      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      toast.success("Order declined");

      await notifyCustomer(order, "decline").catch(() => undefined);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to decline order");
    }
  };

  const actionableOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Order Requests</h1>
            <p className="text-muted-foreground mt-1">Accept or decline orders sent to your listings.</p>
          </div>
          <Badge variant="secondary">Pending: {actionableOrders.length}</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No orders yet</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">When a customer places an order, it will appear here.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const isPending = order.status === "pending";
              const productTitle = order.listing?.title ?? "Product";
              const statusLabel =
                order.status === "confirmed" ? "Accepted" : order.status === "cancelled" ? "Declined" : "Pending";

              return (
                <Card key={order.id} className={isPending ? "border-primary" : undefined}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{productTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {order.quantity} • Total: KES {order.total_price}
                        </p>
                      </div>
                      <Badge
                        variant={
                          order.status === "confirmed"
                            ? "default"
                            : order.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </CardHeader>


                  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Order ID: <span className="font-medium text-foreground">{order.id}</span>
                    </div>

                    {isPending ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onDecline(order)}>
                          <ThumbsDown className="h-4 w-4 mr-2" /> Decline
                        </Button>
                        <Button onClick={() => onAccept(order)}>
                          <ThumbsUp className="h-4 w-4 mr-2" /> Accept
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No actions required.</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Contact the buyer to arrange delivery and payment methods.</DialogDescription>
          </DialogHeader>

          {customerLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !customerProfile ? (
            <div className="text-muted-foreground">Customer details unavailable.</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={customerProfile.full_name ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={customerProfile.email ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={customerProfile.phone ?? ""} readOnly />
              </div>

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">Next steps</p>
                <ul className="list-disc ml-5 mt-2 text-muted-foreground space-y-1">
                  <li>Call/DM the customer to confirm delivery address and schedule.</li>
                  <li>Agree on payment method(s) before making delivery.</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setCustomerDialogOpen(false)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

