import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
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

// Updated Zod schema with images required
const listingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(1000).optional(),
  crop_type: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  price: z.coerce.number().positive(),
  location: z.string().min(2),
  images: z.array(z.string()).min(1, "At least one image is required"), // ✅ required
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
  const { user, isApprovedFarmer } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      images: [],
    },
  });

  const onSubmit = async (data: ListingFormData) => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!isApprovedFarmer) {
      toast.error('Only approved farmers can create listings');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('market_listings')
        .insert({
          seller_id: user.id,
          title: data.title,
          description: data.description,
          crop_type: data.crop_type,
          quantity: data.quantity,
          unit: data.unit,
          price: data.price,
          location: data.location,
          images: data.images, // validated by Zod
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

  if (!isApprovedFarmer) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only approved farmers can create listings.
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Listing</CardTitle>
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
                    <Input placeholder="Fresh Organic Tomatoes" {...field} />
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
                    <Textarea className="min-h-24" {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe quality and growing conditions
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
                    <Select onValueChange={field.onChange}>
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
                      <Input placeholder="City, Country" {...field} />
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
                      <Input type="number" {...field} />
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
                    <Select onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                    <FormLabel>Price per Unit (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ✅ Image upload required */}
            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>Upload Images</FormLabel>
                  <ImageUpload
                    images={form.getValues('images')}
                    onImagesChange={(imgs) =>
                      form.setValue('images', imgs, { shouldValidate: true })
                    }
                    maxImages={5}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/marketplace')}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Listing
              </Button>
            </div>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}