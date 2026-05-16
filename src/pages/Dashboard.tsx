import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Loader2, ShoppingCart, Sprout, TrendingUp, Bell, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { MarketListing, Order, Profile } from "@/types/database";

type OrderAction = "accept" | "decline";

type OrderWithListing = Order & { listing?: MarketListing | null };

export default function Dashboard() {
  const { profile, roles, isAuthLoading, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderWithListing[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [earningsWeek, setEarningsWeek] = useState<number>(0);
  const [buyerRequests, setBuyerRequests] = useState(0);

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

  const firstName = profile?.full_name?.split(" ")[0] || "Farmer";

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Products listed
      const { data: listings, error: lErr } = await supabase
        .from("market_listings")
        .select("id")
        .eq("seller_id", user.id);
      if (lErr) throw lErr;
      setProductCount((listings || []).length);

      // Orders for farmer
      const { data: ordersData, error: oErr } = await (supabase as any)
        .from("orders")
        .select(
          "*, listing:market_listings(id, title, crop_type, quantity, unit, price, images, location, created_at)"
        )
        .eq("farmer_id", user.id);

      if (oErr) throw oErr;

      const mapped: OrderWithListing[] = (ordersData || []).map((row: any) => ({
        ...(row as Order),
        listing: row.listing ?? null,
      }));

      setOrders(mapped);

      // Earnings this week: sum of total_price where delivered/completed (or delivered)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const earnings = mapped
        .filter((o) => {
          const delivered = o.status === "delivered";
          const dt = new Date(o.created_at);
          return delivered && dt >= weekAgo;
        })
        .reduce((sum, o) => sum + (o.total_price || 0), 0);
      setEarningsWeek(earnings);

      // New requests: pending orders
      setBuyerRequests(mapped.filter((o) => o.status === "pending").length);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isFarmer) return;
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isFarmer]);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== "cancelled");
  }, [orders]);

  const newRequestOrders = useMemo(() => {
    return orders.filter((o) => o.status === "pending").slice(0, 4);
  }, [orders]);

  const callUpdateOrderResponse = async (order: OrderWithListing, action: OrderAction) => {
    if (!user) throw new Error("Not authenticated");

    const session = await (supabase as any).auth.getSession();
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

  const onAccept = async (order: OrderWithListing) => {
    try {
      await callUpdateOrderResponse(order, "accept");
      await fetchDashboardData();
      toast.success("Request accepted");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to accept");
    }
  };

  const onDecline = async (order: OrderWithListing) => {
    try {
      await callUpdateOrderResponse(order, "decline");
      await fetchDashboardData();
      toast.success("Request declined");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to decline");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-16">
        <section className="container py-10 md:py-14">
          <ScrollReveal>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold md:text-5xl">
                Good Morning, {firstName} 👋
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Your farmer dashboard with requests, orders, and operational notifications in one place.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
                <Card className="glass-strong rounded-[1.5rem]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sprout className="h-4 w-4 text-primary" /> Products Listed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{productCount} </p>
                  </CardContent>
                </Card>

                <Card className="glass-strong rounded-[1.5rem]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShoppingCart className="h-4 w-4 text-primary" /> Active Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{activeOrders.length}</p>
                  </CardContent>
                </Card>

                <Card className="glass-strong rounded-[1.5rem]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-primary" /> Earnings This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">KSh {Math.round(earningsWeek).toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="glass-strong rounded-[1.5rem]">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bell className="h-4 w-4 text-primary" /> New Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{buyerRequests}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <ScrollReveal delayMs={80}>
              <Card className="glass-strong rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>New buyer requests</CardTitle>
                  <CardContent className="p-0" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : newRequestOrders.length === 0 ? (
                    <div className="text-muted-foreground">No new requests right now.</div>
                  ) : (
                    newRequestOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-border/70 bg-white/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Request</p>
                            <h3 className="text-xl font-bold mt-1">
                              {order.listing?.crop_type ? "🍅" : "🛎️"} {order.listing?.title ?? "Product"}
                            </h3>
                            <div className="text-sm text-muted-foreground mt-2 space-y-1">
                              <div>
                                Buyer needs: {order.quantity} {order.listing?.unit ?? "kg"}
                              </div>
                              <div>Location: {order.listing?.location ?? "Nairobi"}</div>
                              <div>Budget: KSh {Math.round(order.total_price).toLocaleString()}</div>
                              <div>Delivery: Pickup</div>
                            </div>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" onClick={() => onDecline(order)}>
                            <ThumbsDown className="h-4 w-4 mr-2" /> Decline
                          </Button>
                          <Button onClick={() => onAccept(order)}>
                            <ThumbsUp className="h-4 w-4 mr-2" /> Accept
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="pt-2">
                    <Button variant="secondary" asChild className="w-full">
                      <Link to="/notifications">View all notifications</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delayMs={160}>
              <div className="space-y-4">
                <Card className="glass rounded-[1.5rem]">
                  <CardHeader>
                    <CardTitle>Active orders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Manage negotiation and fulfillment progress.
                    </p>
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/orders/farmer">Open orders</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass rounded-[1.5rem]">
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Requests, interested buyers, price alerts and delivery updates.</p>
                    <Button asChild className="w-full">
                      <Link to="/notifications">Go to notifications</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass rounded-[1.5rem]">
                  <CardHeader>
                    <CardTitle>My products</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Update quantities, pricing and availability.</p>
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/my-products">Manage products</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

