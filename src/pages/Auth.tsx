import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, HardHat, Loader2 } from "lucide-react";
import { SKILL_OPTIONS } from "@/lib/labour";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  phone: z.string().trim().min(6, "Phone required").max(20),
  role: z.enum(["contractor", "labour"]),
  company_name: z.string().trim().max(100).optional(),
  skill: z.string().trim().max(50).optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", phone: "", role: "labour", skill: "Plumber" },
  });
  const watchedRole = registerForm.watch("role");

  const routeForRole = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
    const r = data?.role;
    navigate(r === "admin" ? "/admin" : r === "contractor" ? "/contractor" : "/labour", { replace: true });
  };

  const onLogin = async (values: LoginForm) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    if (data.user) await routeForRole(data.user.id);
  };

  const onRegister = async (values: RegisterForm) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: values.full_name,
          phone: values.phone,
          role: values.role,
          company_name: values.company_name,
          skill: values.skill,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
    if (data.user) await routeForRole(data.user.id);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animated mesh background */}
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-80" />
      <div className="absolute -left-32 top-20 -z-10 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute -right-32 bottom-20 -z-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="rounded-2xl bg-gradient-primary p-3 shadow-glow">
            <HardHat className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Labour Connector</h1>
            <p className="text-xs text-muted-foreground">Thekedar ⇄ Majdoor</p>
          </div>
        </div>

        <div className="glass-panel p-6 sm:p-8 shadow-elegant">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6 space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showPwd ? "text" : "password"} {...loginForm.register("password")} />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-glow hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6 space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" {...registerForm.register("full_name")} />
                    {registerForm.formState.errors.full_name && <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.full_name.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" {...registerForm.register("email")} />
                    {registerForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="reg-pwd">Password</Label>
                    <div className="relative">
                      <Input id="reg-pwd" type={showPwd ? "text" : "password"} {...registerForm.register("password")} />
                      <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...registerForm.register("phone")} />
                    {registerForm.formState.errors.phone && <p className="mt-1 text-xs text-destructive">{registerForm.formState.errors.phone.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <Label>Role</Label>
                    <Select value={watchedRole} onValueChange={(v) => registerForm.setValue("role", v as "contractor" | "labour")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">Contractor (Thekedar)</SelectItem>
                        <SelectItem value="labour">Labour (Majdoor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {watchedRole === "contractor" && (
                    <div className="col-span-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input id="company" placeholder="e.g. Ramesh Constructions" {...registerForm.register("company_name")} />
                    </div>
                  )}
                  {watchedRole === "labour" && (
                    <div className="col-span-2">
                      <Label>Primary Skill</Label>
                      <Select value={registerForm.watch("skill")} onValueChange={(v) => registerForm.setValue("skill", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SKILL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-glow hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms of service.
        </p>
      </div>
    </div>
  );
};

export default Auth;
