import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { adminAuthEvent, clearAdminToken, isAdminAuthenticated } from "@/lib/admin-auth";

const navLinkClasses =
  "text-sm font-semibold text-muted-foreground hover:text-primary transition-colors";

const SiteNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(isAdminAuthenticated());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncAdminState = () => setAdminLoggedIn(isAdminAuthenticated());
    window.addEventListener("storage", syncAdminState);
    window.addEventListener(adminAuthEvent, syncAdminState);
    return () => {
      window.removeEventListener("storage", syncAdminState);
      window.removeEventListener(adminAuthEvent, syncAdminState);
    };
  }, []);

  const handleUserLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out.",
    });
    navigate("/");
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminLoggedIn(false);
    toast({
      title: "Admin session ended",
      description: "You have been logged out of the admin panel.",
    });
    if (location.pathname.startsWith("/admin")) {
      navigate("/admin-login");
    }
  };

  if (!isMounted) return null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-200 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-primary">CogniWise Scan</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Early neuro screening
              </p>
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Link to="/home" className={navLinkClasses}>
            Home
          </Link>

          {!session && (
            <Link to="/login" className={navLinkClasses}>
              User Login
            </Link>
          )}

          {!adminLoggedIn && (
            <Link to="/admin-login" className={navLinkClasses}>
              Admin Login
            </Link>
          )}

          {session && (
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          )}

          {adminLoggedIn && (
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => navigate("/admin")}>
              Admin Panel
            </Button>
          )}

          {(session || adminLoggedIn) && (
            <div className="flex items-center gap-2">
              {session && (
                <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                  User
                </Badge>
              )}
              {adminLoggedIn && (
                <Badge variant="outline" className="text-xs uppercase tracking-wide text-blue-600 border-blue-200">
                  Admin
                </Badge>
              )}
            </div>
          )}

          {session && (
            <Button variant="ghost" size="sm" onClick={handleUserLogout}>
              Logout
            </Button>
          )}

          {adminLoggedIn && (
            <Button variant="ghost" size="sm" onClick={handleAdminLogout}>
              Admin Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SiteNavbar;

