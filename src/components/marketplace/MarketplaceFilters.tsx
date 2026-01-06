import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface MarketplaceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cropType: string;
  onCropTypeChange: (type: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

const cropTypes = [
  'All',
  'Vegetables',
  'Fruits',
  'Grains',
  'Legumes',
  'Herbs',
  'Nuts',
  'Dairy',
  'Other',
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export function MarketplaceFilters({
  searchQuery,
  onSearchChange,
  cropType,
  onCropTypeChange,
  sortBy,
  onSortChange,
  onClearFilters,
}: MarketplaceFiltersProps) {
  const hasFilters = searchQuery || cropType !== 'All' || sortBy !== 'newest';

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Select value={cropType} onValueChange={onCropTypeChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Crop Type" />
          </SelectTrigger>
          <SelectContent>
            {cropTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-44">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={onClearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
