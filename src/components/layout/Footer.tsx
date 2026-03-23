import { Facebook, Instagram, Leaf, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const quickLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/crop-diagnosis", label: "AI Diagnosis" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tips", label: "Farming Tips" },
  { href: "/about", label: "About" },
];

const serviceLinks = [
  "Advanced crop diagnosis",
  "Crop monitoring workflow",
  "Marketplace access",
  "Farmer coordination",
  "Advisory intelligence",
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-sidebar text-sidebar-foreground">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
                <Leaf className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  Agrilink<span className="text-sidebar-primary">AI</span>
                </p>
                <p className="text-xs text-sidebar-foreground/60">Agricultural intelligence platform</p>
              </div>
            </Link>
            <p className="text-sm text-sidebar-foreground/70">
              A more capable farming system for diagnosis, market actions, operational clarity,
              and better AI-assisted decision making.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent transition hover:bg-sidebar-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick links</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="transition hover:text-sidebar-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">System focus</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              {serviceLinks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm text-sidebar-foreground/70">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>support@agrilink.ai</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>+254 745 256 745</span>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>Zetech University, Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-sidebar-border pt-6 text-sm text-sidebar-foreground/60 md:flex-row md:items-center md:justify-between">
          <p>(c) {currentYear} Agrilink AI. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/about" className="transition hover:text-sidebar-foreground">Platform overview</Link>
            <Link to="/crop-diagnosis" className="transition hover:text-sidebar-foreground">AI diagnosis</Link>
            <Link to="/marketplace" className="transition hover:text-sidebar-foreground">Marketplace</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
