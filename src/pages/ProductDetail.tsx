import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MarketListing, Profile } from "@/types/database";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  ShoppingCart,
  MessageSquare,
  Loader2,
  Package,
} from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing();
      incrementViewCount();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from("market_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (listingError) throw listingError;
      if (!listingData) {
        toast({
          title: "Listing not found",
          description: "This product listing doesn't exist.",
          variant: "destructive",
        });
        navigate("/marketplace");
        return;
      }

      setListing(listingData);

      // Fetch seller info
      const { data: sellerData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", listingData.farmer_id)
        .maybeSingle();

      setSeller(sellerData);
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;
    try {
      await supabase.rpc("increment_views", { listing_id: id });
    } catch {
      // Silently fail - view count is not critical
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const handlePurchase = async () => {
    if (!user || !listing) {
      toast({
        title: "Login required",
        description: "Please login to make a purchase.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (purchaseQuantity > listing.quantity) {
      toast({
        title: "Insufficient quantity",
        description: `Only ${listing.quantity} ${listing.unit} available.`,
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const { error } = await supabase.from("orders").insert({
        listing_id: listing.id,
        customer_id: user.id,
        farmer_id: listing.farmer_id,
        quantity: purchaseQuantity,
        total_price: purchaseQuantity * listing.price_per_unit,
        status: "pending",
        payment_status: "pending",
        delivery_address: "", // Would be collected in a real flow
      });

      if (error) throw error;

      toast({
        title: "Order placed!",
        description: "Your order has been submitted successfully.",
      });
      setPurchaseDialogOpen(false);
      setPurchaseQuantity(1);
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !listing) {
      toast({
        title: "Login required",
        description: "Please login to contact the seller.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: listing.farmer_id,
        listing_id: listing.id,
        content: message,
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "The seller will be notified.",
      });
      setMessageDialogOpen(false);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) return null;

  const totalPrice = purchaseQuantity * listing.price_per_unit;
  const isOwnListing = user?.id === listing.farmer_id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product image */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-24 w-24 text-muted-foreground" />
                )}
              </div>
            </Card>

            {/* Product details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{listing.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{listing.crop_type}</Badge>
                      <Badge variant={listing.is_available ? "default" : "destructive"}>
                        {listing.is_available ? "Available" : "Sold Out"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(listing.price_per_unit, listing.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">per {listing.unit}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {listing.description || "No description provided."}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{listing.quantity}</strong> {listing.unit} available
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Listed {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{listing.views_count} views</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {seller?.full_name || "Anonymous Farmer"}
                    </p>
                    <p className="text-sm text-muted-foreground">Verified Seller</p>
                  </div>
                </div>

                {seller?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{seller.location}</span>
                  </div>
                )}

                {seller?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{seller.email}</span>
                  </div>
                )}

                {seller?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{seller.phone}</span>
                  </div>
                )}

                {!isOwnListing && (
                  <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Seller
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contact Seller</DialogTitle>
                        <DialogDescription>
                          Send a message to {seller?.full_name || "the seller"} about this
                          listing.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="message">Your Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Hi, I'm interested in your product..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setMessageDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSendMessage} disabled={isSendingMessage}>
                          {isSendingMessage && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Send Message
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Purchase card */}
            {!isOwnListing && listing.is_available && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Make a Purchase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity ({listing.unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={listing.quantity}
                      value={purchaseQuantity}
                      onChange={(e) =>
                        setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Max: {listing.quantity} {listing.unit}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Price per {listing.unit}</span>
                      <span>{formatPrice(listing.price_per_unit, listing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Quantity</span>
                      <span>
                        {purchaseQuantity} {listing.unit}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-3 border-t pt-3">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(totalPrice, listing.currency)}
                      </span>
                    </div>
                  </div>

                  <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Purchase</DialogTitle>
                        <DialogDescription>
                          You are about to purchase {purchaseQuantity} {listing.unit} of{" "}
                          {listing.title} for{" "}
                          {formatPrice(totalPrice, listing.currency)}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                          The seller will be notified and will contact you to arrange
                          payment and delivery.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setPurchaseDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handlePurchase} disabled={isPurchasing}>
                          {isPurchasing && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Confirm Order
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {isOwnListing && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    This is your listing. You cannot purchase your own products.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
