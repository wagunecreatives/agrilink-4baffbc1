import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Leaf,
  Brain,
  ShoppingCart,
  Users,
  CloudSun,
  Microscope,
  TrendingUp,
  ArrowRight,
  Check,
  Star,
  Sprout,
  Wheat,
  Apple,
} from 'lucide-react';

const features = [
  {
    icon: Microscope,
    title: 'AI Disease Diagnosis',
    description: 'Upload crop images and get instant AI-powered disease identification with treatment recommendations.',
  },
  {
    icon: ShoppingCart,
    title: 'Direct Market Access',
    description: 'Connect directly with buyers. Sell your produce without middlemen and maximize profits.',
  },
  {
    icon: CloudSun,
    title: 'Weather Intelligence',
    description: 'Real-time weather data and forecasts to help you plan farming activities effectively.',
  },
  {
    icon: Brain,
    title: 'Smart Recommendations',
    description: 'Get personalized farming tips based on your crops, location, and current conditions.',
  },
  {
    icon: Users,
    title: 'Farmer Community',
    description: 'Connect with fellow farmers, share experiences, and learn from agricultural experts.',
  },
  {
    icon: TrendingUp,
    title: 'Market Analytics',
    description: 'Track market trends and prices to make informed decisions about when to sell.',
  },
];

const benefits = [
  'Increase crop yield by up to 30%',
  'Reduce crop losses from diseases',
  'Get better prices for your produce',
  'Access to expert agricultural advice',
  'Save time with automated insights',
  'Connect directly with buyers',
];

const testimonials = [
  {
    name: 'James Mwangi',
    role: 'Maize Farmer',
    content: 'Agrilink AI helped me identify a disease in my maize crop early. I saved over 60% of my harvest!',
    rating: 5,
  },
  {
    name: 'Sarah Ochieng',
    role: 'Vegetable Farmer',
    content: 'The marketplace feature connected me directly to buyers in Nairobi. My income has doubled.',
    rating: 5,
  },
  {
    name: 'Peter Kimani',
    role: 'Coffee Farmer',
    content: 'Weather alerts helped me plan my harvest perfectly. No more guessing when to pick.',
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-nature py-20 lg:py-32">
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Sprout className="w-4 h-4 mr-2" />
                AI-Powered Agriculture
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                Grow Smarter with{' '}
                <span className="text-gradient">Agrilink AI</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Empowering farmers with artificial intelligence for disease diagnosis, 
                market access, and smart farming decisions. Transform your agricultural 
                journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gradient-hero text-primary-foreground group" asChild>
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/marketplace">Explore Marketplace</Link>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">Active Farmers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-primary">95%</p>
                  <p className="text-sm text-muted-foreground">Diagnosis Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-primary">50K+</p>
                  <p className="text-sm text-muted-foreground">Crops Analyzed</p>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <Card className="shadow-medium animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Wheat className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-medium">Crop Monitoring</p>
                    <p className="text-sm text-muted-foreground">Real-time insights</p>
                  </CardContent>
                </Card>
                <Card className="shadow-medium animate-fade-in mt-8" style={{ animationDelay: '0.2s' }}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                      <Brain className="w-7 h-7 text-accent" />
                    </div>
                    <p className="font-medium">AI Analysis</p>
                    <p className="text-sm text-muted-foreground">Smart predictions</p>
                  </CardContent>
                </Card>
                <Card className="shadow-medium animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mb-4">
                      <Apple className="w-7 h-7 text-success" />
                    </div>
                    <p className="font-medium">Marketplace</p>
                    <p className="text-sm text-muted-foreground">Direct sales</p>
                  </CardContent>
                </Card>
                <Card className="shadow-medium animate-fade-in mt-8" style={{ animationDelay: '0.4s' }}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center mb-4">
                      <CloudSun className="w-7 h-7 text-warning" />
                    </div>
                    <p className="font-medium">Weather</p>
                    <p className="text-sm text-muted-foreground">Local forecasts</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground">
              Our comprehensive platform provides all the tools farmers need to improve 
              productivity, reduce losses, and increase profits.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group hover:shadow-medium transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 gradient-nature">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary">Why Choose Us</Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Transform Your Farming Experience
              </h2>
              <p className="text-muted-foreground text-lg">
                Join thousands of farmers who are already benefiting from AI-powered 
                agriculture. Our platform is designed to help you succeed.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="gradient-hero text-primary-foreground" asChild>
                <Link to="/signup">Start Your Journey</Link>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-2xl" />
              <Card className="relative shadow-medium">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xl">Agrilink AI Dashboard</h3>
                        <p className="text-muted-foreground">Your farming command center</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-2xl font-display font-bold text-primary">98%</p>
                        <p className="text-sm text-muted-foreground">Healthy Crops</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-2xl font-display font-bold text-accent">12</p>
                        <p className="text-sm text-muted-foreground">Active Listings</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-2xl font-display font-bold text-success">+45%</p>
                        <p className="text-sm text-muted-foreground">Revenue Growth</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary">
                        <p className="text-2xl font-display font-bold text-warning">24°C</p>
                        <p className="text-sm text-muted-foreground">Local Temp</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Farmers Say About Us
            </h2>
            <p className="text-muted-foreground">
              Real stories from real farmers who have transformed their agricultural 
              practices with Agrilink AI.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
            Join thousands of farmers already using Agrilink AI to grow smarter, 
            sell better, and succeed in modern agriculture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Create Free Account
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
