import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  CloudSun,
  Leaf,
  MessageSquare,
  Microscope,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  TrendingUp,
  Wheat,
} from "lucide-react";

const pillars = [
  {
    icon: Microscope,
    title: "Advanced crop diagnosis",
    description: "Richer disease analysis with urgent actions, treatment split, monitoring steps, and field notes.",
  },
  {
    icon: ShoppingCart,
    title: "Market access",
    description: "Direct marketplace workflows designed to help farmers connect with buyers faster.",
  },
  {
    icon: Brain,
    title: "Advisory intelligence",
    description: "Decision support across diagnosis, crop protection, and next-step planning.",
  },
  {
    icon: MessageSquare,
    title: "Farmer coordination",
    description: "Messaging and collaboration tools for field updates, buyer follow-up, and operational continuity.",
  },
];

const highlights = [
  "Richer AI crop disease analysis and recommendations",
  "Glass cards, layered gradients, and smoother motion",
  "More useful dashboard routing and clearer quick actions",
  "Persistent diagnosis history and exportable reports",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20">
        <section className="hero-mesh surface-grid">
          <div className="container py-14 md:py-20">
            <ScrollReveal>
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="glass-strong rounded-[2rem] p-8 md:p-10">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="px-4 py-2">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Smarter agriculture platform
                    </Badge>
                    <Badge variant="outline" className="px-4 py-2">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Upgraded AI system + UI
                    </Badge>
                  </div>
                  <h1 className="mt-6 text-4xl font-bold md:text-6xl">
                    Agrilink AI now works like a more capable agricultural command system.
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                    Diagnose crop issues with richer AI recommendations, coordinate market actions,
                    track field decisions, and move through a more polished glass-based interface
                    built for speed, clarity, and better operational flow.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button className="gradient-hero text-primary-foreground" asChild>
                      <Link to="/crop-diagnosis">
                        Open AI diagnosis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/dashboard">View dashboard</Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    { label: "Platform mode", value: "Upgraded", icon: Sparkles },
                    { label: "AI diagnosis", value: "Advanced", icon: Microscope },
                    { label: "Operations view", value: "Sharper", icon: TrendingUp },
                  ].map((item, index) => (
                    <ScrollReveal key={item.label} delayMs={120 + index * 90}>
                      <Card className="glass card-lift rounded-[1.5rem]">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">{item.label}</p>
                              <p className="mt-2 text-3xl font-bold">{item.value}</p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-3 text-primary">
                              <item.icon className="h-5 w-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="container mt-10 space-y-10">
          <ScrollReveal>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="glass-strong rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>What changed in the system</CardTitle>
                  <CardDescription>
                    The product now exposes more value through better content, stronger layout, and improved AI output handling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-border/70 bg-white/70 p-4">
                      <CheckIcon />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {pillars.map((pillar, index) => (
                  <ScrollReveal key={pillar.title} delayMs={120 + index * 80}>
                    <Card className="glass card-lift rounded-[1.5rem]">
                      <CardHeader>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <pillar.icon className="h-6 w-6" />
                        </div>
                        <CardTitle>{pillar.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">{pillar.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={140}>
            <Card className="glass-strong rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>Richer platform content</CardTitle>
                <CardDescription>
                  The interface now emphasizes system depth, clear next actions, and stronger informational density without changing the core product structure.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <Card className="border-border/60 bg-white/75 shadow-none">
                  <CardContent className="p-5">
                    <Leaf className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">AI-first diagnosis</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Crop-specific recommendations now support better action planning and follow-up monitoring.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-white/75 shadow-none">
                  <CardContent className="p-5">
                    <Wheat className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Operational clarity</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The dashboard routes only to real destinations and reduces dead-end navigation.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-white/75 shadow-none">
                  <CardContent className="p-5">
                    <CloudSun className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="font-semibold">Improved presentation</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Glass surfaces, motion reveal, denser cards, and cleaner sectioning improve overall UX quality.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delayMs={220}>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="glass rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle>Where to start</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: "Run diagnosis", href: "/crop-diagnosis", icon: Microscope },
                    { title: "Open dashboard", href: "/dashboard", icon: TrendingUp },
                    { title: "Browse market", href: "/marketplace", icon: ShoppingCart },
                    { title: "Read tips", href: "/tips", icon: Sprout },
                  ].map((item) => (
                    <Link key={item.href} to={item.href}>
                      <div className="card-lift rounded-2xl border border-border/70 bg-white/75 p-5">
                        <item.icon className="mb-3 h-5 w-5 text-primary" />
                        <p className="font-semibold">{item.title}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className="gradient-hero rounded-[1.75rem] border-none text-primary-foreground shadow-medium">
                <CardContent className="p-8">
                  <p className="text-sm uppercase tracking-[0.24em] text-primary-foreground/75">
                    General system upgrade
                  </p>
                  <h2 className="mt-4 text-3xl font-bold">
                    Better analysis, better content, cleaner workflow.
                  </h2>
                  <p className="mt-4 text-sm text-primary-foreground/80">
                    The biggest gain is not one visual change. It is the combined improvement in AI output quality, page clarity, operational routing, and surface-level polish.
                  </p>
                  <Button className="mt-6 bg-white text-foreground hover:bg-white/90" asChild>
                    <Link to="/crop-diagnosis">Try the upgraded diagnosis flow</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CheckIcon() {
  return <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />;
}
