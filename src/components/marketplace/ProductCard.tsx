import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Eye, ShoppingCart } from 'lucide-react';
import { MarketListing } from '@/types/database';

interface ProductCardProps {
  listing: MarketListing;
}

export function ProductCard({ listing }: ProductCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-medium transition-all">
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        {!listing.is_available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="secondary" className="text-lg">Sold Out</Badge>
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          {listing.crop_type}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {listing.description || 'Fresh produce available for purchase'}
        </p>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-2xl font-display font-bold text-primary">
              {formatPrice(listing.price_per_unit, listing.currency)}
            </p>
            <p className="text-sm text-muted-foreground">per {listing.unit}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{listing.quantity} {listing.unit}</p>
            <p className="text-sm text-muted-foreground">available</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/marketplace/${listing.id}`}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </Link>
        </Button>
        <Button asChild className="flex-1" disabled={!listing.is_available}>
          <Link to={`/marketplace/${listing.id}`}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
