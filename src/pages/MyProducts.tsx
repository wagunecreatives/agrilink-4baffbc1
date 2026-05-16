import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MarketListing } from "@/types/database";

export default function MyProducts() {
  const { user, profile, roles, isAuthLoading, isApprovedFarmer } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<MarketListing[]>([]);

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editQuantity, setEditQuantity] = useState<number | undefined>(undefined);
  const [editPrice, setEditPrice] = useState<number | undefined>(undefined);

  const isFarmer = roles.includes("farmer") || roles.includes("admin");

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isFarmer) {
      navigate("/marketplace");
      return;
    }
    if (!isApprovedFarmer) {
      toast.error("Only approved farmers can manage products");
      navigate("/marketplace");
    }
  }, [user, isAuthLoading, isFarmer, isApprovedFarmer, navigate]);

  const fetchMyListings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("market_listings")
        // Avoid strict typing issues where DB may not include computed fields like `currency`
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings((data || []) as any);

    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load your products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isFarmer || !isApprovedFarmer) return;
    fetchMyListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isFarmer, isApprovedFarmer]);

  const soldOutCount = useMemo(() => listings.filter((l) => l.status !== "active").length, [listings]);

  const startEdit = (l: MarketListing) => {
    setEditId(l.id);
    setEditTitle(l.title);
    setEditDescription(l.description ?? "");
    setEditQuantity(l.quantity);
    setEditPrice(l.price);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditDescription("");
    setEditQuantity(undefined);
    setEditPrice(undefined);
  };

  const saveEdit = async (l: MarketListing) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("market_listings")
        .update({
          title: editTitle,
          description: editDescription,
          quantity: editQuantity,
          price: editPrice,
        })
        .eq("id", l.id);

      if (error) throw error;
      toast.success("Product updated");
      cancelEdit();
      await fetchMyListings();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const markSoldOut = async (l: MarketListing) => {
    try {
      setLoading(true);
      const nextStatus = l.status === "active" ? "sold_out" : "active";
      const { error } = await supabase
        .from("market_listings")
        .update({ status: nextStatus })
        .eq("id", l.id);

      if (error) throw error;
      toast.success(nextStatus === "active" ? "Marked active" : "Marked sold out");
      await fetchMyListings();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold">My Products</h1>
            <p className="text-muted-foreground mt-1">Manage your listings: quantity, price, and availability.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">Sold out: {soldOutCount}</Badge>
            <Button onClick={() => navigate("/marketplace/new")}>Add product</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No products yet</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Create your first listing to start receiving orders.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((l) => {
              const isEditing = editId === l.id;
              const isActive = l.status === "active";

              return (
                <Card key={l.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg line-clamp-1">{l.title}</CardTitle>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Sold out"}</Badge>
                          <Badge variant="outline">{l.crop_type}</Badge>
                        </div>
                      </div>
                      {!isEditing && (
                        <Button variant="outline" size="icon" onClick={() => startEdit(l)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="font-medium">KSh {Math.round(l.price)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Quantity</div>
                      <div className="font-medium">
                        {l.quantity} {l.unit}
                      </div>
                    </div>
                    {l.location && <div className="text-sm text-muted-foreground">Location: {l.location}</div>}

                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Title</div>
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Description</div>
                          <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Quantity</div>
                            <Input
                              type="number"
                              value={editQuantity ?? ""}
                              onChange={(e) => setEditQuantity(e.target.value === "" ? undefined : Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Price (KES)</div>
                            <Input
                              type="number"
                              step="0.01"
                              value={editPrice ?? ""}
                              onChange={(e) => setEditPrice(e.target.value === "" ? undefined : Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <Button className="flex-1" onClick={() => saveEdit(l)}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant={isActive ? "destructive" : "secondary"}
                          className="flex-1"
                          onClick={() => markSoldOut(l)}
                          disabled={loading}
                        >
                          {isActive ? "Mark as sold out" : "Mark as active"}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => navigate(`/marketplace/${l.id}`)}>
                          View
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Image upload edit is handled via the listing creation UI for now.
                    </div>
                  </CardContent>
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

