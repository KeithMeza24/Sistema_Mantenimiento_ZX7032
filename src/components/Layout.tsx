import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "./NavLink";
import Navbar from "./Navbar";
import {
  LayoutDashboard,
  Cog,
  Package,
  Wrench,
  Calendar,
  Activity,
  Users,
  ShoppingCart,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/machine", icon: Cog, label: "Machine" },
    { to: "/parts", icon: Package, label: "Parts Inventory" },
    { to: "/maintenance", icon: Wrench, label: "New Maintenance" },
    { to: "/maintenance-records", icon: Wrench, label: "Maintenance Records" },
    { to: "/preventive", icon: Calendar, label: "Preventive" },
    { to: "/predictive", icon: Activity, label: "Predictive" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/vendors", icon: Users, label: "Vendors" },
    { to: "/purchases", icon: ShoppingCart, label: "Purchases" },
    { to: "/alerts", icon: Bell, label: "Alerts" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Fixed */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 h-screen">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            CMMS System
          </h1>
          <p className="text-sm text-sidebar-foreground/70 mt-1">
            ZX7032 Milling Machine
          </p>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar user={user} />

        {/* Content Area with padding */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="px-8 py-6 max-w-screen-2xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;