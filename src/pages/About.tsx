import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  Leaf, 
  Users, 
  Target, 
  Heart, 
  Globe, 
  Award,
  Cpu,
  ShoppingBag,
  MessageCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const values = [
  {
    icon: Heart,
    title: 'Farmer First',
    description: 'Every decision we make puts farmers at the center, ensuring their success and prosperity.',
  },
  {
    icon: Globe,
    title: 'Sustainability',
    description: 'We promote environmentally responsible farming practices for a healthier planet.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building strong connections between farmers, buyers, and agricultural experts.',
  },
  {
    icon: Award,
    title: 'Innovation',
    description: 'Leveraging cutting-edge AI technology to solve real agricultural challenges.',
  },
];

const features = [
  {
    icon: Cpu,
    title: 'AI Crop Diagnosis',
    description: 'Upload images of your crops and get instant AI-powered disease detection and treatment recommendations.',
  },
  {
    icon: ShoppingBag,
    title: 'Digital Marketplace',
    description: 'Connect directly with buyers and sellers. List your produce, negotiate prices, and expand your market reach.',
  },
  {
    icon: MessageCircle,
    title: 'Farming Tips Community',
    description: 'Share knowledge, ask questions, and learn from experienced farmers in our collaborative community.',
  },
];

const stats = [
  { value: '10,000+', label: 'Active Farmers' },
  { value: '50,000+', label: 'Crops Diagnosed' },
  { value: '25,000+', label: 'Products Listed' },
  { value: '98%', label: 'Accuracy Rate' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Leaf className="w-4 h-4" />
              <span className="text-sm font-medium">About Agrilink AI</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Empowering Farmers with{' '}
              <span className="text-primary">AI Technology</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Agrilink AI is an innovative agricultural platform that combines artificial intelligence 
              with community-driven insights to help farmers diagnose crop diseases, access markets, 
              and share knowledge—all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Our Mission</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Bridging the Gap Between Technology and Agriculture
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our mission is to democratize access to agricultural technology, making advanced 
                AI-powered tools available to farmers of all scales. We believe that every farmer 
                deserves access to cutting-edge technology to improve their yields, reduce losses, 
                and increase profitability.
              </p>
              <ul className="space-y-3">
                {[
                  'Instant AI-powered crop disease diagnosis',
                  'Direct market access without intermediaries',
                  'Community-driven knowledge sharing',
                  'Real-time farming insights and tips',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl gradient-hero opacity-20" />
              <div className="absolute inset-4 rounded-xl bg-card border shadow-lg flex items-center justify-center">
                <Leaf className="w-32 h-32 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-none shadow-md">
                <CardContent className="pt-6">
                  <p className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What We Offer
            </h2>
            <p className="text-muted-foreground">
              Comprehensive tools designed to address the real challenges faced by modern farmers.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-none">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Our Core Values
            </h2>
            <p className="text-muted-foreground">
              The principles that guide everything we do at Agrilink AI.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Our Vision for the Future
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We envision a world where every farmer, regardless of their location or resources, 
              has access to the same advanced agricultural technology as large-scale operations. 
              Through continuous innovation and community building, we're working to make this 
              vision a reality—one farm at a time.
            </p>
            <div className="inline-flex items-center gap-2 text-primary font-medium">
              <Leaf className="w-5 h-5" />
              <span>Growing together, harvesting success</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
