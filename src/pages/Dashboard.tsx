import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Microscope,
  ShoppingCart,
  Wheat,
  CloudSun,
  TrendingUp,
  MessageSquare,
  Bell,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const { profile, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isFarmer = roles.includes('farmer') || roles.includes('admin');
  const isCustomer = roles.includes('customer') || roles.includes('admin');

  const stats = [
    { label: 'Active Listings', value: '0', icon: ShoppingCart, color: 'text-primary' },
    { label: 'Crops Monitored', value: '0', icon: Wheat, color: 'text-success' },
    { label: 'Diagnoses Made', value: '0', icon: Microscope, color: 'text-accent' },
    { label: 'Messages', value: '0', icon: MessageSquare, color: 'text-warning' },
  ];

  const quickActions = isFarmer
    ? [
        { label: 'Diagnose Crop', href: '/diagnosis', icon: Microscope, description: 'AI-powered disease detection' },
        { label: 'Create Listing', href: '/marketplace/new', icon: Plus, description: 'Sell your produce' },
        { label: 'My Crops', href: '/crops', icon: Wheat, description: 'Manage your crops' },
        { label: 'Weather', href: '/weather', icon: CloudSun, description: 'Local forecasts' },
      ]
    : [
        { label: 'Browse Marketplace', href: '/marketplace', icon: ShoppingCart, description: 'Find fresh produce' },
        { label: 'My Orders', href: '/orders', icon: TrendingUp, description: 'Track your orders' },
        { label: 'Messages', href: '/messages', icon: MessageSquare, description: 'Chat with farmers' },
        { label: 'Notifications', href: '/notifications', icon: Bell, description: 'Stay updated' },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your farm today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href}>
                  <Card className="group hover:shadow-medium transition-all cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                        <action.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {action.label}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 shadow-soft">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Wheat className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No recent activity</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by diagnosing a crop or creating a listing
                  </p>
                  <Button asChild>
                    <Link to={isFarmer ? '/diagnosis' : '/marketplace'}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weather Widget */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-primary" />
                  Weather Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-5xl font-display font-bold text-primary mb-2">24°C</p>
                  <p className="text-muted-foreground mb-4">Partly Cloudy</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground">Humidity</p>
                      <p className="font-semibold">65%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground">Wind</p>
                      <p className="font-semibold">12 km/h</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/weather">View Full Forecast</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
