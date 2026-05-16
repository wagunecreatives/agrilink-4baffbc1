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
import type { Order, MarketListing } from "@/types/database";

type OrderWithListing = Order & { listing?: MarketListing | null };

export default function OrdersForCustomer() {
  const { user, roles, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderWithListing[]>([]);
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
            "*, listing:market_listings(id, title, crop_type, quantity, unit, price, images, location, created_at)"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: OrderWithListing[] = (data || []).map((row: any) => ({
          ...(row as Order),
          listing: row.listing ?? null,
        }));

        setOrders(mapped);
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    if (user && !isAuthLoading) run();
  }, [user, isAuthLoading]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground mt-1">Track order status and farmer responses.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/marketplace")}>Marketplace</Button>
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
                order.status === "confirmed"
                  ? "Accepted"
                  : order.status === "cancelled"
                    ? "Declined"
                    : "Pending";

              return (
                <Card key={order.id} className={order.status === "confirmed" ? "border-primary" : undefined}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{order.listing?.title ?? "Product"}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {order.quantity} • Total: KES {order.total_price}
                        </p>
                      </div>
                      <Badge
                        variant={order.status === "confirmed" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </CardHeader>
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

