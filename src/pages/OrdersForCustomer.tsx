import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MarketListing, Order, Profile } from "@/types/database";

type OrderWithListing = Order & { listing?: MarketListing | null };

type FarmerProfileMap = Record<string, Pick<Profile, "full_name" | "avatar_url">>;

export default function OrdersForCustomer() {
  const { user, roles, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderWithListing[]>([]);
  const [farmerProfiles, setFarmerProfiles] = useState<FarmerProfileMap>({});
  const [loading, setLoading] = useState(true);

  const isCustomer = !roles.includes("farmer") || roles.includes("customer") || roles.includes("admin");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isCustomer) {
      navigate("/marketplace");
    }
  }, [user, isAuthLoading, isCustomer, navigate]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("orders")
          .select(
            "id, customer_id, farmer_id, quantity, total_price, status, created_at, "+
              "listing:market_listings(id, title, crop_type, quantity, unit, price, images, location, created_at)"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: OrderWithListing[] = (data || []).map((row: any) => ({
          ...(row as Order),
          listing: row.listing ?? null,
        }));

        setOrders(mapped);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    if (user && !isAuthLoading) run();
  }, [user, isAuthLoading]);

  // Fetch farmer profiles so the customer sees seller details (name/avatar), not raw farmer UUID.
  useEffect(() => {
    const loadFarmerProfiles = async () => {
      if (!orders.length) {
        setFarmerProfiles({});
        return;
      }

      const farmerIds = Array.from(new Set(orders.map((o) => o.farmer_id).filter(Boolean)));
      if (!farmerIds.length) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", farmerIds);

      if (error) {
        console.error(error);
        return;
      }

      const map: FarmerProfileMap = {};
      (data || []).forEach((p: any) => {
        if (!p?.id) return;
        map[p.id] = {
          full_name: p.full_name ?? null,
          avatar_url: p.avatar_url ?? null,
        };
      });

      setFarmerProfiles(map);
    };

    if (!isAuthLoading) loadFarmerProfiles();
  }, [orders, isAuthLoading]);

  const latestResponse = useMemo(() => {
    return orders.find((o) => o.status === "confirmed" || o.status === "cancelled") ?? null;
  }, [orders]);

  useEffect(() => {
    if (!latestResponse) return;

    if (latestResponse.status === "confirmed") {
      toast.success("Farmer accepted your order");
    } else if (latestResponse.status === "cancelled") {
      toast.error("Farmer declined your order");
    }
  }, [latestResponse]);

  const renderSellerLine = (order: OrderWithListing) => {
    const profile = farmerProfiles[order.farmer_id];

    return (
      <div className="text-muted-foreground">
        Seller: {
          profile?.full_name
            ? (
                <span className="font-medium text-foreground">{profile.full_name}</span>
              )
            : (
                <span className="font-medium text-foreground">{order.farmer_id}</span>
              )
        }
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground mt-1">Track order status and farmer responses.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/marketplace")}>
            Marketplace
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No orders</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Place an order from the marketplace.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const statusLabel =
                order.status === "confirmed" ? "Accepted" : order.status === "cancelled" ? "Declined" : "Pending";

              return (
                <Card
                  key={order.id}
                  className={order.status === "confirmed" ? "border-primary" : undefined}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{order.listing?.title ?? "Product"}</CardTitle>
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

                  {order.status === "confirmed" && (
                    <CardContent className="pt-0">
                      <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                        <p className="font-medium">Farmer accepted your order</p>
                        {renderSellerLine(order)}
                        <div className="flex gap-2 flex-wrap pt-2">
                          <Button variant="outline" onClick={() => navigate("/messages")}>
                            Message farmer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {order.status === "cancelled" && (
                    <CardContent className="pt-0">
                      <div className="text-sm text-destructive">
                        Farmer declined this order. You can place a new order.
                      </div>
                    </CardContent>
                  )}

                  {order.status === "pending" && (
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground">Waiting for the farmer to accept or decline.</div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

