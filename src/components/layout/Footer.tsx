import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                Agrilink<span className="text-sidebar-primary">AI</span>
              </span>
            </Link>
            <p className="text-sidebar-foreground/70 text-sm">
              Empowering farmers with AI-driven solutions for sustainable agriculture, 
              connecting them directly to markets and providing smart farming insights.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/marketplace', label: 'Marketplace' },
                { href: '/diagnosis', label: 'AI Diagnosis' },
                { href: '/tips', label: 'Farming Tips' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-lg">Our Services</h4>
            <ul className="space-y-2">
              {[
                'Crop Disease Detection',
                'Market Linkage',
                'Weather Insights',
                'Farming Advisory',
                'Direct Sales Platform',
              ].map((service) => (
                <li key={service} className="text-sidebar-foreground/70 text-sm">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-lg">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <Mail className="w-4 h-4 text-sidebar-primary" />
                support@agrilink.ai
              </li>
              <li className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
                <Phone className="w-4 h-4 text-sidebar-primary" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start gap-3 text-sm text-sidebar-foreground/70">
                <MapPin className="w-4 h-4 text-sidebar-primary mt-0.5" />
                123 Farm Road, Agriculture Valley, AG 12345
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-sidebar-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sidebar-foreground/60">
            © {currentYear} Agrilink AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-sidebar-foreground/60">
            <Link to="/privacy" className="hover:text-sidebar-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-sidebar-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
