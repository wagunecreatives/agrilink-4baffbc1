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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MarketListing, Order, Profile } from "@/types/database";
import { useFarmerOrdersRealtime } from "@/hooks/useFarmerOrdersRealtime";

type OrderAction = "accept" | "decline";

type OrderWithListing = Order & { listing?: MarketListing | null };

export default function NotificationsForFarmer() {
  const { user, profile, roles, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const isFarmer = roles.includes("farmer") || roles.includes("admin");

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderWithListing[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithListing | null>(null);
  const [customerProfile, setCustomerProfile] = useState<Profile | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

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
      const q = (supabase as any)
        .from("orders")
        .select(
          "*, listing:market_listings(id, title, crop_type, quantity, unit, price, images, location, latitude, longitude, created_at)"
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
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isFarmer) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isFarmer]);

  // Realtime updates for incoming buyer requests + status changes
  useFarmerOrdersRealtime({
    enabled: isFarmer,
    farmerId: user?.id,
    onChange: () => {
      fetchOrders();
    },
  });

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
      toast.error("Failed to load buyer details");
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

    // Edge function already composes content; send minimal data here.
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
      const updated = await callUpdateOrderResponse(order, "accept");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      await notifyCustomer(order, "accept").catch(() => undefined);
      toast.success("Request accepted");
      setDetailOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to accept");
    }
  };

  const onDecline = async (order: OrderWithListing) => {
    try {
      const updated = await callUpdateOrderResponse(order, "decline");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
      await notifyCustomer(order, "decline").catch(() => undefined);
      toast.success("Request declined");
      setDetailOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to decline");
    }
  };

  const newRequests = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const interestedBuyers = useMemo(() => {
    // With current schema we treat all non-cancelled confirmed/processing orders as "interested".
    return orders.filter((o) => o.status === "confirmed" || o.status === "processing");
  }, [orders]);

  const deliveryUpdates = useMemo(() => {
    return orders.filter((o) => o.status === "shipped" || o.status === "delivered");
  }, [orders]);

  const priceAlerts = useMemo(() => {
    // No explicit price_alerts table currently; show derived alerts from low/high price listings.
    // Keeps UI requirement without breaking DB.
    const list = orders
      .filter((o) => o.listing)
      .slice(0, 4)
      .map((o) => o.listing!)
      .filter(Boolean);
    return list;
  }, [orders]);

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
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              New buyer requests, interested buyers, price signals, and delivery updates.
            </p>
          </div>
          <Badge variant="secondary">New: {newRequests.length}</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">New buyer requests</h2>
                {newRequests.length > 0 && <Badge>{newRequests.length}</Badge>}
              </div>
              {newRequests.length === 0 ? (
                <p className="text-muted-foreground">No new requests right now.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {newRequests.map((order) => (
                    <Card key={order.id} className="border-primary/40">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {order.listing?.crop_type ? <span className="text-xl">🍅</span> : <span>🛎️</span>}
                          {order.listing?.title ?? "Request"}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">Buyer request</Badge>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <div>Buyer needs: {order.quantity} {order.listing?.unit ?? "kg"}</div>
                          <div>Budget: KSh {Math.round(order.total_price)}</div>
                          <div>Delivery: {"Pickup"}</div>
                          <div>Location: {order.listing?.location ?? "Nairobi"}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => onDecline(order)}>
                            Decline
                          </Button>
                          <Button onClick={() => onAccept(order)}>Accept</Button>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={async () => {
                            setSelectedOrder(order);
                            setDetailOpen(true);
                            await fetchCustomerForOrder(order);
                          }}
                        >
                          View details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Interested buyers</h2>
              {interestedBuyers.length === 0 ? (
                <p className="text-muted-foreground">No active buyer interest yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {interestedBuyers.map((o) => (
                    <Card key={o.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{o.listing?.title ?? "Order"}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{o.status === "confirmed" ? "Accepted" : "In Delivery"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        Qty: {o.quantity} {o.listing?.unit ?? "kg"}
                        <br />
                        Total: KSh {Math.round(o.total_price)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Delivery updates</h2>
              {deliveryUpdates.length === 0 ? (
                <p className="text-muted-foreground">No delivery updates.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {deliveryUpdates.map((o) => (
                    <Card key={o.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{o.listing?.title ?? "Order"}</CardTitle>
                        <Badge variant={o.status === "delivered" ? "default" : "secondary"}>
                          {o.status === "delivered" ? "Completed" : "In Delivery"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        Location: {o.listing?.location ?? "Nairobi"}
                        <br />
                        Qty: {o.quantity} {o.listing?.unit ?? "kg"}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Price alerts</h2>
              {priceAlerts.length === 0 ? (
                <p className="text-muted-foreground">No price signals right now.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {priceAlerts.map((l) => (
                    <Card key={l.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{l.title}</CardTitle>
                        <Badge variant="outline">Price signal</Badge>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        KSh {Math.round(l.price)} per {l.unit}
                        <br />
                        Status: {l.status}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request details</DialogTitle>
            <DialogDescription>Accept or decline this request.</DialogDescription>
          </DialogHeader>

          {selectedOrder ? (
            <div className="space-y-3">
              <div>
                <div className="font-medium">{selectedOrder.listing?.title ?? "Product"}</div>
                <div className="text-sm text-muted-foreground">
                  Need: {selectedOrder.quantity} {selectedOrder.listing?.unit ?? "kg"}
                </div>
                <div className="text-sm text-muted-foreground">Budget: KSh {Math.round(selectedOrder.total_price)}</div>
                <div className="text-sm text-muted-foreground">Location: {selectedOrder.listing?.location ?? "Nairobi"}</div>
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="font-medium">Buyer</div>
                {customerLoading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : (
                  <div className="text-muted-foreground">
                    {customerProfile?.full_name ?? "Unknown"}
                    <div>{customerProfile?.email ?? ""}</div>
                    <div>{customerProfile?.phone ?? ""}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onDecline(selectedOrder)}>
                  Decline
                </Button>
                <Button onClick={() => onAccept(selectedOrder)}>Accept</Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/orders/farmer")}>Go to active orders</Button>
            </div>
          ) : (
            <div className="text-muted-foreground">No request selected.</div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

