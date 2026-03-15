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
  Calendar,
  Eye,
  ShoppingCart,
  MessageSquare,
  Loader2,
  Package,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
        .eq("id", listingData.seller_id)
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

  const formatPrice = (price: number, currency: string = "USD") => {
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
        farmer_id: listing.seller_id,
        quantity: purchaseQuantity,
        total_price: purchaseQuantity * listing.price,
        status: "pending",
        payment_status: "pending",
        delivery_address: "",
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
        receiver_id: listing.seller_id,
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

  const totalPrice = purchaseQuantity * listing.price;
  const isOwnListing = user?.id === listing.seller_id;
  const isAvailable = listing.status === "active";

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
              {listing.images && listing.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {listing.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video bg-muted">
                          <img
                            src={image}
                            alt={`${listing.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {listing.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {listing.images && listing.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Product details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{listing.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{listing.crop_type}</Badge>
                      <Badge variant={isAvailable ? "default" : "destructive"}>
                        {isAvailable ? "Available" : "Sold Out"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(listing.price)}
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
                    <span>{listing.location || "Location not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Listed {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller info */}
        {/* Seller info */}
{/* Seller info */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Seller Information</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        {seller?.avatar_url ? (
          <img
            src={seller.avatar_url}
            alt={seller.full_name || "Seller"}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-primary" />
        )}
      </div>

      <div>
        <p className="font-medium">
          {seller?.full_name || "Seller"}
        </p>

        {seller?.role && (
          <p className="text-sm text-muted-foreground capitalize">
            {seller.role}
          </p>
        )}

        {seller?.approval_status === "approved" ? (
          <p className="text-sm text-green-600 font-medium">
            Verified Seller
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pending Verification
          </p>
        )}
      </div>
    </div>

    {seller?.email && (
      <div className="flex items-center gap-2 text-sm">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span>{seller.email}</span>
      </div>
    )}

    {seller?.phone && (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Phone:</span>
        <span>{seller.phone}</span>
      </div>
    )}

    {seller?.location && (
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span>{seller.location}</span>
      </div>
    )}
  </CardContent>
</Card>


            {/* Purchase card */}
            {!isOwnListing && isAvailable && (
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
                      <span>{formatPrice(listing.price)}</span>
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
                        {formatPrice(totalPrice)}
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
                          {listing.title}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Product</span>
                            <span className="font-medium">{listing.title}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <span>Quantity</span>
                            <span>
                              {purchaseQuantity} {listing.unit}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold mt-3 pt-3 border-t">
                            <span>Total</span>
                            <span className="text-primary">
                              {formatPrice(totalPrice)}
                            </span>
                          </div>
                        </div>
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
