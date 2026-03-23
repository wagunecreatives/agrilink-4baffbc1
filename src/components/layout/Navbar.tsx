import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Leaf, LogOut, Menu, Microscope, ShoppingCart, Sprout, User } from "lucide-react";

const navLinks = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/crop-diagnosis", label: "AI Diagnosis", icon: Microscope },
  { href: "/tips", label: "Farming Tips", icon: Sprout },
  { href: "/about", label: "About", icon: User },
];

export function Navbar() {
  const { user, profile, signOut, isApprovedFarmer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">Agricultural intelligence</p>
            <p className="text-lg font-bold">Agrilink<span className="text-primary">AI</span></p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Button variant="outline" onClick={() => navigate(user ? "/dashboard" : "/login")}>
            {user ? "Dashboard" : "Sign in"}
          </Button>
          {isApprovedFarmer && (
            <Button className="gradient-hero text-blue-500" onClick={() => navigate("/marketplace/new")}>
              Create Listing
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px]">
              <div className="mt-8 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3"
                  >
                    <link.icon className="h-4 w-4 text-primary" />
                    <span>{link.label}</span>
                  </Link>
                ))}
                <Link
                  to={user ? "/dashboard" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span>{user ? "Dashboard" : "Sign in"}</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile?.full_name || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/crop-diagnosis")}>
                  <Microscope className="mr-2 h-4 w-4" />
                  AI Diagnosis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/marketplace")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Marketplace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button className="md:hidden" variant="outline" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
