import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Brain,
  ClipboardCheck,
  CloudSun,
  Loader2,
  MessageSquare,
  Microscope,
  ShoppingCart,
  Sprout,
  TrendingUp,
  Wheat,
} from "lucide-react";

const operations = [
  {
    title: "AI crop diagnosis",
    href: "/crop-diagnosis",
    icon: Microscope,
    description: "Run richer disease analysis, treatment planning, and monitoring workflows.",
  },
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: ShoppingCart,
    description: "Browse produce listings, demand signals, and selling opportunities.",
  },
  {
    title: "Farming tips",
    href: "/tips",
    icon: Brain,
    description: "Open curated guidance, seasonal advice, and smart farming recommendations.",
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare,
    description: "Stay close to buyers, partners, and field coordination updates.",
  },
];

const modules = [
  { label: "Diagnosis workspace", value: "Advanced", icon: ClipboardCheck },
  { label: "Market readiness", value: "Live", icon: TrendingUp },
  { label: "Farmer network", value: "Connected", icon: MessageSquare },
  { label: "Advisory layer", value: "AI-backed", icon: Brain },
];

export default function Dashboard() {
  const { profile, roles, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Farmer";
  const isFarmer = roles.includes("farmer") || roles.includes("admin");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20">
        <section className="hero-mesh surface-grid">
          <div className="container py-12 md:py-16">
            <ScrollReveal>
              <div className="glass-strong rounded-[2rem] p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">Operations dashboard</Badge>
                  <Badge variant="outline">Smarter workflow routing</Badge>
                </div>
                <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold md:text-5xl">
                      Welcome back, {firstName}. Your farm operations hub is ready.
                    </h1>
                    <p className="max-w-2xl text-lg text-muted-foreground">
                      Move between diagnosis, market actions, messaging, and advisory guidance
                      from a tighter dashboard with clearer routing and richer operational context.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button className="gradient-hero text-primary-foreground" asChild>
                        <Link to="/crop-diagnosis">Open diagnosis workspace</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/marketplace">Browse marketplace</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {modules.map((item) => (
                      <Card key={item.label} className="glass card-lift">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="mt-2 text-2xl font-bold">{item.value}</p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3 text-primary">
                              <item.icon className="h-5 w-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="container -mt-8 space-y-8">
          <ScrollReveal delayMs={80}>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="glass-strong rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>Quick operations</CardTitle>
                  <CardDescription>
                    Jump into the high-value actions that already exist in the product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {operations.map((item) => (
                    <Link key={item.href} to={item.href}>
                      <Card className="card-lift h-full border-border/60 bg-white/75 shadow-none">
                        <CardHeader className="pb-3">
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm">{item.description}</CardDescription>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>Current focus areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Use the diagnosis workspace for richer treatment and monitoring plans.",
                    "Keep market listings updated with clean photos and accurate pricing.",
                    "Use messages for buyer follow-up and supply coordination.",
                    "Review farming tips regularly for preventive actions and seasonal planning.",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-border/70 bg-white/70 p-4">
                      <Sprout className="mt-0.5 h-4 w-4 text-success" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={160}>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Advisory readiness",
                  value: "95%",
                  note: "Better routing into diagnosis, monitoring, and action planning.",
                  icon: Brain,
                },
                {
                  title: "Market visibility",
                  value: isFarmer ? "Seller" : "Buyer",
                  note: "Marketplace access is connected directly from dashboard actions.",
                  icon: ShoppingCart,
                },
                {
                  title: "Weather awareness",
                  value: "Ready",
                  note: "Use farming tips and crop diagnosis notes to react to stress signals faster.",
                  icon: CloudSun,
                },
                {
                  title: "Collaboration",
                  value: "Live",
                  note: "Messages and alerts remain one click away for field coordination.",
                  icon: Bell,
                },
              ].map((item) => (
                <Card key={item.title} className="glass card-lift rounded-[1.5rem]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <p className="mt-2 text-3xl font-bold">{item.value}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={220}>
            <Card className="glass-strong rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>Role-aware command deck</CardTitle>
                <CardDescription>
                  The dashboard now points only to real routes, with clearer actions for active users.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/60 bg-white/75 shadow-none">
                  <CardContent className="p-5">
                    <Wheat className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Production decisions</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Diagnose disease pressure, capture notes, and monitor follow-up actions.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-white/75 shadow-none">
                  <CardContent className="p-5">
                    <TrendingUp className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Market actions</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Move from diagnosis into selling and buyer communication without dead links.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-white/75 shadow-none">
                  <CardContent className="p-5">
                    <Microscope className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">AI workflow</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Richer AI response fields now support better recommendations and field planning.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
