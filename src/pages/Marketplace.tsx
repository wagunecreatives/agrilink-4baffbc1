import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { Button } from '@/components/ui/button';
import { MarketListing } from '@/types/database';
import { Plus, ShoppingCart, Loader2 } from 'lucide-react';

export default function Marketplace() {
  const { roles, profile, isApprovedFarmer } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cropType, setCropType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const isFarmer = roles.includes('farmer');
  const isPendingApproval = isFarmer && profile?.approval_status === 'pending';

  useEffect(() => {
    fetchListings();
  }, [cropType, sortBy]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('market_listings')
        .select('*')
        .eq('status', 'active');

      if (cropType !== 'All') {
        query = query.eq('crop_type', cropType);
      }

      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('views_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearFilters = () => {
    setSearchQuery('');
    setCropType('All');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold">Marketplace</h1>
              <p className="text-muted-foreground mt-1">
                Browse fresh produce directly from local farmers
              </p>
            </div>
            {isPendingApproval ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                Your farmer account is pending admin approval
              </div>
            ) : isApprovedFarmer && (
              <Button asChild className="gradient-hero text-primary-foreground">
                <Link to="/marketplace/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Link>
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-8">
            <MarketplaceFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              cropType={cropType}
              onCropTypeChange={setCropType}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">
                No products found
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || cropType !== 'All'
                  ? 'Try adjusting your filters to find what you\'re looking for'
                  : 'Be the first to list your produce on the marketplace'}
              </p>
              {isApprovedFarmer && (
                <Button asChild>
                  <Link to="/marketplace/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Listing
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
