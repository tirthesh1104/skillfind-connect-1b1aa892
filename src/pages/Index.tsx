import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, IndianRupee, Star, HardHat, Users, Briefcase, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImg from "@/assets/landing-hero.jpg";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    // Admins should see the landing page first, then proceed via Login → Access Key.
    if (role === "contractor") navigate("/contractor", { replace: true });
    else if (role === "labour") navigate("/labour", { replace: true });
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground"><HardHat className="h-4 w-4" /></span>
            <span className="font-display text-lg font-bold">Labour Connector</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#problem" className="hover:text-foreground">Why us</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#trust" className="hover:text-foreground">Stories</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-foreground">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="btn-primary-amber">
              <Link to="/auth">Get Started</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 dot-grid opacity-40" />
        <div className="absolute -left-24 top-10 -z-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 -z-10 h-96 w-96 rounded-full bg-accent-strong/20 blur-3xl" />

        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" /> India's first trusted Thekedaar–Majdoor platform
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              Work. Connect.<br />
              <span className="gradient-text">Get Paid.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Connecting daily-wage workers directly with contractors — no middlemen, no wage theft, no broken promises. Just verified work and fair pay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="btn-primary-amber h-12 text-base">
                <Link to="/auth?role=contractor">I'm a Thekedaar <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-border text-base hover:border-accent hover:text-accent">
                <Link to="/auth?role=labour">I'm a Majdoor <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Counters */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { v: "12,400+", l: "Workers" },
                { v: "3,200+", l: "Contractors" },
                { v: "₹4.2 Cr", l: "Wages Protected" },
              ].map((s, i) => (
                <div key={s.l} className={`animate-fade-up stagger-${i + 1}`}>
                  <div className="font-display text-2xl font-bold text-accent sm:text-3xl">{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up stagger-2">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-amber blur-2xl" />
            <img src={heroImg} alt="Indian contractor and worker shaking hands at construction site" width={1280} height={896}
              className="relative w-full rounded-2xl border border-border object-cover shadow-elegant" />
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card/95 p-4 shadow-card backdrop-blur sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-success/20 text-success"><CheckCircle2 className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm font-semibold">Verified Agreement</div>
                  <div className="text-xs text-muted-foreground">₹600/day · 12 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-[1280px]" />

      {/* PROBLEM / SOLUTION */}
      <section id="problem" className="mx-auto max-w-[1280px] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Built to fix what's broken.</h2>
          <p className="mt-4 text-muted-foreground">Three core problems. Three real solutions.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: IndianRupee, title: "Wage theft", body: "Workers chase contractors for unpaid wages.", solution: "Smart agreements with verified payment status." },
            { icon: Star, title: "No skill proof", body: "Skilled workers treated like beginners.", solution: "Verified ratings & a portable Work Passport." },
            { icon: ShieldCheck, title: "Middle-man cuts", body: "Brokers take 15–30% of every wage.", solution: "Direct match. Zero middlemen. Zero cuts." },
          ].map((p, i) => (
            <article key={p.title} className={`stat-card animate-fade-up stagger-${i + 1}`}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{p.solution}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="section-divider mx-auto max-w-[1280px]" />

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-[1280px] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">From sign-up to first paycheck — in four steps.</p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-4">
          {[
            { n: "01", icon: Users, t: "Register", d: "Sign up free as a Thekedaar or Majdoor in under 60 seconds." },
            { n: "02", icon: Briefcase, t: "Match", d: "Find verified workers or jobs near your pin code." },
            { n: "03", icon: ShieldCheck, t: "Agree", d: "Lock a fair wage with a platform-signed agreement." },
            { n: "04", icon: Star, t: "Earn & Rate", d: "Get paid, build your Work Passport, grow your reputation." },
          ].map((s, i) => (
            <div key={s.n} className={`relative animate-fade-up stagger-${(i % 4) + 1}`}>
              <div className="font-mono text-xs text-accent">{s.n}</div>
              <div className="mt-2 grid h-12 w-12 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider mx-auto max-w-[1280px]" />

      {/* TRUST */}
      <section id="trust" className="mx-auto max-w-[1280px] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Real workers. Real trust.</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { q: "Pehli baar saara paisa same day mila. Koi katauti nahi.", n: "Ramesh K.", r: "Mason · Pune" },
            { q: "Verified workers, verified wages. Saved me 4 hours of phone calls every week.", n: "Anil S.", r: "Contractor · Mumbai" },
            { q: "My ratings travel with me. Naya thekedaar bhi mujhe expert rate deta hai.", n: "Sunil M.", r: "Electrician · Nagpur" },
          ].map((t, i) => (
            <article key={t.n} className={`glass-card p-6 animate-fade-up stagger-${i + 1}`}>
              <div className="mb-3 flex gap-1 text-accent">
                {[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-sm leading-relaxed">"{t.q}"</p>
              <div className="mt-5 border-t border-border pt-4">
                <div className="font-semibold">{t.n}</div>
                <div className="text-xs text-muted-foreground">{t.r}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-accent/40 bg-gradient-amber p-10 text-center shadow-glow">
          <h3 className="font-display text-3xl font-bold sm:text-4xl">Join the movement.</h3>
          <p className="mt-3 text-muted-foreground">Free forever for workers. Pay nothing until you hire.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="btn-primary-amber h-12">
              <Link to="/auth">Create free account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-[1280px] px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground"><HardHat className="h-4 w-4" /></span>
                <span className="font-display font-bold">Labour Connector</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Direct. Verified. Fair.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#how" className="hover:text-foreground">How it works</a></li>
                <li><Link to="/auth" className="hover:text-foreground">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#trust" className="hover:text-foreground">Stories</a></li>
                <li><a href="#problem" className="hover:text-foreground">Mission</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Terms</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Built for the unorganised workforce of India · © {new Date().getFullYear()} Labour Connector
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
