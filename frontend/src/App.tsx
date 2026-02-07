import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { DesignSystem } from "./components/DesignSystem";
import { PublicCalendar } from "./components/PublicCalendar";
import { BookingFlow } from "./components/BookingFlow";
import { ClientDashboard } from "./components/ClientDashboard";
import { TeamDashboard } from "./components/TeamDashboard";
import { TeamDirectory } from "./components/TeamDirectory";
import { AdminDashboard } from "./components/AdminDashboard";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { AvailabilityEditor } from "./components/AvailabilityEditor";
import { AvailabilityManagement } from "./components/AvailabilityManagement";
import { DigitalContentLibrary } from "./components/DigitalContentLibrary";
import { ContentViewer } from "./components/ContentViewer";
import { OnDemandProductDetail } from "./components/OnDemandProductDetail";
import { RetreatDetail } from "./components/RetreatDetail";
import { ProgramCheckout } from "./components/ProgramCheckout";
import { WordPressCalendarWidget } from "./components/WordPressCalendarWidget";
import { TeamManagement } from "./components/TeamManagement";
import { TeamMemberDetail } from "./components/TeamMemberDetail";
import { UserManagement } from "./components/UserManagement";
import { ServicesOverview } from "./components/ServicesOverview";
import { ServicesCategories } from "./components/ServicesCategories";
import { ServiceDetail } from "./components/ServiceDetail";
import { LocationsDirectory } from "./components/LocationsDirectory";
import { LocationDetail } from "./components/LocationDetail";
import { BookingsDirectory } from "./components/BookingsDirectory";
import { BookingDetail } from "./components/BookingDetail";
import { DigitalContentManagement } from "./components/DigitalContentManagement";
import { DigitalContentDetail } from "./components/DigitalContentDetail";
import { SettingsPage } from "./components/SettingsPage";
import { AuthPage } from "./components/AuthPage";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { CurrencyProvider } from "./context/CurrencyContext";
import { CurrencySelector } from "./components/CurrencySelector";
import { PublicServiceDetail } from "./components/PublicServiceDetail";
import { Toaster } from "./components/ui/sonner";
// Force Vercel Rebuild
import { TooltipProvider } from "./components/ui/tooltip";
import { NotificationCenter } from "./components/NotificationCenter";
import { ProgramsRetreats } from "./components/ProgramsRetreats";
import { ProductsOnDemand } from "./components/ProductsOnDemand";
import { BookingSuccess } from "./components/BookingSuccess";
import { EducationDashboard } from "./components/education/EducationDashboard";
import { ModuleOverview } from "./components/education/ModuleOverview";
import { LessonPlayer } from "./components/education/LessonPlayer";
import { BundlesList } from "./components/BundlesList";
import { BundleCheckout } from "./components/BundleCheckout";
import { EducationAdmin } from "./components/admin/EducationAdmin";
import { BundleManagement } from "./components/BundleManagement";
import { ClientProgramsDirectory } from "./components/ClientProgramsDirectory";
import {
  Wind,
  Sparkles,
  Users,
  User,
  LogOut,
  Loader2,
  Database,
} from "lucide-react";
import { SSOHandler } from "./components/auth/SSOHandler";

import { Card, CardContent } from "./components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { TEAM_MEMBERS } from "./components/team-data";
import {
  BarChart3,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Play,
  Mountain,
  Grid3x3,
  Settings,
  GraduationCap,
  Package,
  Home
} from "lucide-react";

import { supabase } from "./utils/supabase/client";

function AppContent() {
  const EMBED_ALLOWED_VIEWS = [
    "calendar",
    "booking",
    "auth",
    "wordpress-calendar-widget",
    "program-checkout",
  ];
  const { user, loading, signOut, getAccessToken } = useAuth();

  // Initialize state from URL to prevent race conditions
  const [activeView, setActiveView] = useState(() => {
    // Check for password recovery hash in URL first
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      return "update-password";
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") return "booking-success";
    // Check for direct booking link parameters
    if (params.get("serviceId")) return "booking";
    return params.get("view") || "home";
  });

  // Listen for Supabase Password Recovery Event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setActiveView("update-password");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const [initializingData, setInitializingData] = useState(false);

  const [bookingPreselection, setBookingPreselection] = useState<any>(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get("serviceId");

    if (serviceId) {
      return {
        preselectedService: serviceId,
        preselectedTeamMember: params.get("teamMemberId"),
        preselectedDate: params.get("date"), // Expecting YYYY-MM-DD
        preselectedTime: params.get("time"), // Expecting HH:MM
        // Provide defaults or minimal info so BookingFlow can fetch the rest
      };
    }
    return null;
  });

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("programId");
  });

  const [returnView, setReturnView] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("return");
  });

  const [selectedEducationId, setSelectedEducationId] = useState<string | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  const [embedMode, setEmbedMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const val = params.get("embed");
    return val === "1" || val === "true";
  });
  const userBadgeLabel =
    user?.user_metadata?.role || "Client";

  const [initialCategory, setInitialCategory] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || undefined;
  });

  // Handle URL cleanup and specific side effects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successParam = params.get("success");

    if (successParam === "true") {
      // Clean URL to prevent reload loops, but keep session_id for the UI
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  useEffect(() => {
    // Only redirect from auth to home if NOT in update-password flow
    // and if the event logic hasn't already intervened
    if (user && activeView === "auth") {
      setActiveView("home");
    }
  }, [user, activeView]);

  // Force Booking View if URL parameters are present (Safe-guard against redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get("serviceId");

    if (serviceId) {
      if (activeView !== "booking") {
        console.log("Direct Link: Enforcing booking view");
        setActiveView("booking");
      }

      if (!bookingPreselection) {
        console.log("Direct Link: Setting preselection data");
        setBookingPreselection({
          preselectedService: serviceId,
          preselectedTeamMember: params.get("teamMemberId"),
          preselectedDate: params.get("date"),
          preselectedTime: params.get("time"),
        });
      }
    }
  }, [activeView, bookingPreselection]);

  // Role Helpers
  // Derived state for roles
  const role = (user?.user_metadata?.role || "Client").toLowerCase();
  const isAdminEmail = user?.email?.toLowerCase().includes("admin") ||
    user?.email?.toLowerCase().includes("fx@fxcreativestudio.com") ||
    user?.email?.toLowerCase() === "contact@mroffbeat.com" ||
    user?.email?.toLowerCase() === "hanna@wezet.xyz";

  const isAdmin = role === "admin" || isAdminEmail;
  const isInstructor = role === "instructor" || role === "teacher";

  // Check Access Permissions
  useEffect(() => {
    if (loading) return;

    // 1. Redirect if not logged in for protected routes
    const protectedViews = [
      "admin-dashboard",
      "team-dashboard",
      "client-dashboard",
      "settings-page",
      "analytics-dashboard",
      "user-management",
      "services-categories",
      "availability-management",
      "locations-directory",
      "bookings-directory",
      "education-dashboard", // Added
      "education-module",    // Added
      "education-lesson"     // Added
    ];

    if (!user && protectedViews.includes(activeView)) {
      setActiveView("auth");
      return;
    }

    // 2. Check Role Permissions
    if (user) {
      const adminRoutes = [
        "admin-dashboard",
        "analytics-dashboard",
        "user-management",
        "settings-page",
        "admin-education",
        "education-dashboard", // Added to admin-only for now
        "education-module",
        "education-lesson"
      ];

      const teamRoutes = [
        "team-dashboard",
        "availability-management",
        "bookings-directory"
      ];

      if (adminRoutes.includes(activeView) && !isAdmin) {
        console.warn(`Access Denied to ${activeView} for role: ${role}`);
        setActiveView("home");
      }

      if (teamRoutes.includes(activeView) && !isAdmin && !isInstructor) {
        console.warn(`Access Denied to ${activeView} for role: ${role}`);
        setActiveView("home");
      }
    }

  }, [user, loading, activeView, isAdmin, isInstructor, role]);

  useEffect(() => {
    if (embedMode && !EMBED_ALLOWED_VIEWS.includes(activeView)) {
      setActiveView("calendar");
    }
  }, [embedMode, activeView]);

  const HeaderBar = ({
    onBack,
    backLabel = "Back to Home",
  }: {
    onBack?: () => void;
    backLabel?: string;
  }) => (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {onBack ? (
            <Button
              variant="ghost"
              onClick={onBack}
              className="px-2 text-xs md:text-sm"
            >
              ← <span className="hidden xs:inline">{backLabel}</span><span className="xs:hidden">Back</span>
            </Button>
          ) : (
            <>
              <img src="/logo.png" alt="Wezet Logo" className="h-6 md:h-8 w-auto" />
              {user && (
                <Badge variant="secondary" className="text-[10px] md:text-xs">
                  {userBadgeLabel}
                </Badge>
              )}
            </>
          )}
          {/* Home Button linking to Shop */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs md:text-sm gap-2 ml-2"
            onClick={() => window.location.href = 'https://shop.wezet.xyz'}
          >
            <Home className="h-4 w-4" />
            HOME
          </Button>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <CurrencySelector />
          <NotificationCenter />
          {user ? (
            <>
              <div className="text-sm text-muted-foreground hidden lg:block">
                {user.user_metadata?.name || user.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="h-8 px-2 md:px-3 text-xs md:text-sm"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveView("auth")}
              className="h-8 text-xs md:text-sm"
            >
              Log In
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const handleInitializeDemo = async () => {
    setInitializingData(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      alert("No access token found");
      setInitializingData(false);
      return;
    }

    const { initializeDemoData } = await import(
      "./utils/initDemoData"
    );
    const result = await initializeDemoData(accessToken);

    if (result.success) {
      alert("✅ " + result.message);
    } else {
      alert("❌ Error: " + result.error);
    }
    setInitializingData(false);
  };

  if (activeView === "sso-authorize") {
    return <SSOHandler />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">
            Loading WEZET...
          </p>
        </div>
      </div>
    );
  }



  // Auth Page for explicit login/signup
  if (activeView === "auth") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <AuthPage />
      </div>
    );
  }

  if (activeView === "design-system") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <DesignSystem />
      </div>
    );
  }

  if (activeView === "calendar") {
    return (
      <div>
        {!embedMode && (
          <HeaderBar onBack={() => setActiveView("home")} />
        )}
        {embedMode && (
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const base = window.location.origin;
                  window.open(`${base}/?view=client-dashboard`, "_blank");
                }}
              >
                User Panel
              </Button>
            </div>
          </div>
        )}
        <PublicCalendar
          initialCategory={initialCategory}
          isEmbedded={embedMode}
          onNavigateToBooking={(bookingData) => {
            // Store booking data for BookingFlow
            console.log(
              "Navigating to booking with data:",
              bookingData,
            );
            setReturnView("calendar");
            setBookingPreselection(bookingData);
            setActiveView("booking");
          }}
          onNavigateToProgram={(programId) => {
            console.log("Navigating to program:", programId);
            setSelectedProgramId(programId);
            setReturnView("calendar");
            setActiveView("program-checkout");
          }}
          onNavigateToProduct={(productId) => {
            console.log("Navigating to product:", productId);
            setActiveView("on-demand-product-detail");
          }}
        />
      </div>
    );
  }

  if (activeView === "booking") {
    return (
      <div>
        {embedMode ? (
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
            <div className="max-w-5xl mx-auto px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveView(returnView || "calendar");
                  setBookingPreselection(null);
                }}
              >
                ← Back to Calendar
              </Button>
            </div>
          </div>
        ) : (
          <HeaderBar
            onBack={() => {
              setActiveView(returnView || "home");
              setBookingPreselection(null);
            }}
          />
        )}
        <BookingFlow preselection={bookingPreselection} />
      </div>
    );
  }

  if (activeView === "client-dashboard") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <ClientDashboard
          onNavigate={(route) => setActiveView(route)}
          onBookSession={() => setActiveView("booking-flow")}
        />
      </div>
    );
  }

  if (activeView === "team-dashboard") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <TeamDashboard onNavigate={(route) => setActiveView(route)} />
      </div>
    );
  }

  if (activeView === "team-directory") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <TeamDirectory />
      </div>
    );
  }

  if (activeView === "admin-dashboard") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <AdminDashboard
          onNavigate={(route) => setActiveView(route)}
        />
      </div>
    );
  }

  if (activeView === "analytics-dashboard") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <AnalyticsDashboard />
      </div>
    );
  }

  if (activeView === "availability-editor") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <AvailabilityEditor />
      </div>
    );
  }

  if (activeView === "availability-management") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <AvailabilityManagement />
      </div>
    );
  }

  if (activeView === "digital-content-library") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <DigitalContentLibrary />
      </div>
    );
  }

  if (activeView === "content-viewer") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <ContentViewer />
      </div>
    );
  }

  if (activeView === "on-demand-product-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <OnDemandProductDetail />
      </div>
    );
  }

  if (activeView === "retreat-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <RetreatDetail />
      </div>
    );
  }

  if (activeView === "program-checkout") {
    return (
      <div>
        {!embedMode && <HeaderBar onBack={() => {
          setActiveView(returnView || "home");
          setSelectedProgramId(null);
        }} />}
        <ProgramCheckout
          programId={selectedProgramId}
          onBack={() => {
            setActiveView(returnView || "home");
            setSelectedProgramId(null);
          }}
        />
      </div>
    );
  }

  if (activeView === "wordpress-calendar-widget") {
    return (
      <div className={embedMode ? "bg-[#f8f7f4]" : ""}>
        {!embedMode && (
          <HeaderBar onBack={() => setActiveView("home")} />
        )}
        <div
          className={`min-h-screen ${embedMode ? "bg-[#f8f7f4] py-10" : "bg-background py-24"
            }`}
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <WordPressCalendarWidget
              onNavigateToBooking={(bookingData) => {
                setReturnView("wordpress-calendar-widget");
                setBookingPreselection(bookingData);
                setActiveView("booking");
              }}
            />
          </div>
        </div>
      </div>
    );
  }



  // ... (inside AppContent)

  if (activeView === "user-management") {
    return (
      <UserManagement onBack={() => setActiveView("admin-dashboard")} />
    );
  }

  // Legacy route redirect or keep for direct access if needed
  if (activeView === "team-management") {
    return (
      <UserManagement onBack={() => setActiveView("admin-dashboard")} />
    );
  }

  if (activeView === "team-member-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <TeamMemberDetail />
      </div>
    );
  }

  if (activeView === "services-categories") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <ServicesCategories />
      </div>
    );
  }

  if (activeView === "public-service-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <PublicServiceDetail
          onBack={() => setActiveView("home")}
          onBook={() => setActiveView("booking")}
        />
      </div>
    );
  }

  if (activeView === "service-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <ServiceDetail />
      </div>
    );
  }

  if (activeView === "locations-directory") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <LocationsDirectory />
      </div>
    );
  }

  if (activeView === "location-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <LocationDetail />
      </div>
    );
  }

  if (activeView === "bookings-directory") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <BookingsDirectory />
      </div>
    );
  }

  if (activeView === "booking-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <BookingDetail />
      </div>
    );
  }

  if (activeView === "bundles-directory") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-8">Packages & Bundles</h1>
          <BundlesList onBuy={(id) => {
            setSelectedBundleId(id);
            setActiveView('bundle-checkout');
          }} />
        </div>
      </div>
    );
  }

  if (activeView === "bundle-checkout") {
    return (
      <BundleCheckout
        bundleId={selectedBundleId}
        onBack={() => setActiveView('bundles-directory')}
      />
    );
  }

  if (activeView === "digital-content-management") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <DigitalContentManagement />
      </div>
    );
  }

  if (activeView === "digital-content-detail") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <DigitalContentDetail />
      </div>
    );
  }

  if (activeView === "programs-retreats") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("admin-dashboard")} backLabel="Back to Dashboard" />
        <ProgramsRetreats onBack={() => setActiveView("admin-dashboard")} />
      </div>
    );
  }

  if (activeView === "products-on-demand") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("admin-dashboard")} backLabel="Back to Dashboard" />
        <ProductsOnDemand onBack={() => setActiveView("admin-dashboard")} />
      </div>
    );
  }

  if (activeView === "programs-directory") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <ClientProgramsDirectory
          onNavigate={(route) => setActiveView(route)}
          onSelectProgram={(programId) => {
            setSelectedProgramId(programId);
            setReturnView("programs-directory");
            setActiveView("program-checkout");
          }}
          onBack={() => setActiveView("home")}
        />
      </div>
    );
  }

  if (activeView === "bundle-management") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("admin-dashboard")} backLabel="Back to Dashboard" />
        <BundleManagement onBack={() => setActiveView("admin-dashboard")} />
      </div>
    );
  }

  if (activeView === "settings-page") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <SettingsPage />
      </div>
    );
  }

  if (activeView === "update-password") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <AuthPage mode="update-password" />
      </div>
    );
  }

  if (activeView === "booking-success") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <BookingSuccess onGoToDashboard={() => setActiveView("client-dashboard")} />
      </div>
    );
  }

  // ============================
  // EDUCATION ROUTES
  // ============================
  if (activeView === "admin-education") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("admin-dashboard")} backLabel="Back to Dashboard" />
        <EducationAdmin onBack={() => setActiveView("admin-dashboard")} />
      </div>
    );
  }

  if (activeView === "education-dashboard") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("home")} />
        <EducationDashboard
          onNavigate={(view, id) => {
            if (id) setSelectedEducationId(id);
            setActiveView(view);
          }}
        />
      </div>
    );
  }

  if (activeView === "education-module") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("education-dashboard")} backLabel="Back to Curriculum" />
        <ModuleOverview
          moduleId={selectedEducationId || ""}
          onNavigate={(view, id) => {
            if (id) setSelectedEducationId(id);
            setActiveView(view);
          }}
        />
      </div>
    );
  }

  if (activeView === "education-lesson") {
    return (
      <div>
        <HeaderBar onBack={() => setActiveView("education-module")} backLabel="Back to Module" />
        <LessonPlayer
          lessonId={selectedEducationId || ""}
          onNavigate={(view, id) => {
            if (id) setSelectedEducationId(id);
            setActiveView(view);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar />

      {/* Main Navigation Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2>Platform Access</h2>
            <p className="text-muted-foreground">
              Select your dashboard to get started
            </p>
          </div>


          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

            {/* Admin Dashboard - PRIMARY */}
            {user && (
              user.user_metadata?.role?.toLowerCase() === 'admin' ||
              user.email?.toLowerCase().includes('admin') ||
              user.email?.toLowerCase().includes('fx@fxcreativestudio.com') ||
              user.email?.toLowerCase() === 'contact@mroffbeat.com' ||
              user.email?.toLowerCase() === 'hanna@wezet.xyz'
            ) && (
                <button
                  onClick={() => setActiveView("admin-dashboard")}
                  className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02] border-primary/20 ring-1 ring-primary/10"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3>Admin Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Platform management and analytics
                      </p>
                    </div>
                  </div>
                </button>
              )}

            {/* Public Calendar - Visible to EVERYONE */}
            <button
              onClick={() => setActiveView("calendar")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Public Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    View schedule and book sessions
                  </p>
                </div>
              </div>
            </button>

            {/* Team Dashboard - Admin & Instructors */}
            {user && (
              user.user_metadata?.role?.toLowerCase() === 'admin' ||
              user.user_metadata?.role?.toLowerCase() === 'instructor' ||
              user.user_metadata?.role?.toLowerCase() === 'teacher' ||
              user.email?.toLowerCase().includes('admin') ||
              user.email?.toLowerCase().includes('fx@fxcreativestudio.com') ||
              user.email?.toLowerCase() === 'contact@mroffbeat.com' ||
              user.email?.toLowerCase() === 'hanna@wezet.xyz'
            ) && (
                <button
                  onClick={() => setActiveView("team-dashboard")}
                  className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Wind className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3>Team Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Schedule and session management
                      </p>
                    </div>
                  </div>
                </button>
              )}

            {/* Client Dashboard - Clients (and everyone else who is logged in) */}
            {user && (
              <button
                onClick={() => setActiveView("client-dashboard")}
                className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3>Client Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Your bookings and progress
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Log In / Sign Up - Only if NOT logged in */}
            {!user && (
              <button
                onClick={() => setActiveView("auth")}
                className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02] border-primary/20"
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <LogOut className="h-6 w-6 text-primary rotate-180" />
                  </div>
                  <div className="space-y-2">
                    <h3>Log In / Sign Up</h3>
                    <p className="text-sm text-muted-foreground">
                      Access your account to manage bookings
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Education Module - "Premium" look */}
            {/* Education Module */}
            {/* Education Module - Public Link */}
            <button
              onClick={() => window.location.href = '/?view=sso-authorize&redirect=https://learn.wezet.xyz'}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center transition-colors bg-primary/10 group-hover:bg-primary/20">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3>Wezet Breathwork Education</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">New</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Master the art of breathwork. 6 Modules, 20 Weeks.
                  </p>
                </div>
              </div>
            </button>

            {/* Shop Module - New */}
            <button
              onClick={() => window.location.href = '/?view=sso-authorize&redirect=https://shop.wezet.xyz'}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center transition-colors bg-primary/10 group-hover:bg-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3>Wezet Shop</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Explore our products, retreats, and offerings.
                  </p>
                </div>
              </div>
            </button>

            {/* Packages & Bundles - Everyone */}
            <button
              onClick={() => setActiveView("bundles-directory")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center transition-colors bg-primary/10 group-hover:bg-primary/20">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3>Packages & Bundles</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View and purchase session packages
                  </p>
                </div>
              </div>
            </button>

          </div>
        </div>
      </div>


    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AppContent />
        <Toaster />
      </CurrencyProvider>
    </AuthProvider>
  );
}
