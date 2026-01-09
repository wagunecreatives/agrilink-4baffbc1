import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().max(1000).optional(),
  crop_type: z.string().min(1, 'Please select a crop type'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Please select a unit'),
  price: z.coerce.number().positive('Price must be positive'),
  location: z.string().min(2, 'Please enter a location'),
});

type ListingFormData = z.infer<typeof listingSchema>;

const cropTypes = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Legumes',
  'Herbs',
  'Nuts',
  'Dairy',
  'Other',
];

const units = ['kg', 'lb', 'ton', 'piece', 'dozen', 'crate', 'bushel', 'bag'];

export function CreateListingForm() {
  const navigate = useNavigate();
  const { user, isApprovedFarmer, profile, roles } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const isFarmer = roles.includes('farmer');
  const isPendingApproval = isFarmer && profile?.approval_status === 'pending';

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      crop_type: '',
      quantity: undefined,
      unit: 'kg',
      price: undefined,
      location: '',
    },
  });

  const onSubmit = async (data: ListingFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a listing');
      return;
    }

    if (!isApprovedFarmer) {
      toast.error('Your farmer account must be approved to create listings');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('market_listings').insert({
        seller_id: user.id,
        title: data.title,
        description: data.description,
        crop_type: data.crop_type,
        quantity: data.quantity,
        unit: data.unit,
        price: data.price,
        location: data.location,
        images: images,
        status: 'active',
      });

      if (error) throw error;

      toast.success('Listing created successfully!');
      navigate('/marketplace');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPendingApproval) {
    return (
      <Card className="max-w-2xl mx-auto shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-display">Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your farmer account is pending admin approval. You'll be able to create listings once approved.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => navigate('/marketplace')}
          >
            Back to Marketplace
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isApprovedFarmer) {
    return (
      <Card className="max-w-2xl mx-auto shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-display">Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only approved farmers can create listings. Please sign up as a farmer and wait for admin approval.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => navigate('/marketplace')}
          >
            Back to Marketplace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-soft">
      <CardHeader>
        <CardTitle className="text-2xl font-display">Create New Listing</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fresh Organic Tomatoes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product, growing conditions, quality..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help buyers understand what makes your produce special
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="crop_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cropTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Unit ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Images</label>
              <ImageUpload images={images} onImagesChange={setImages} maxImages={5} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/marketplace')}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Listing
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
