import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CreateListingForm } from '@/components/marketplace/CreateListingForm';

export default function CreateListing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <CreateListingForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
