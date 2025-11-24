import { useState } from "react";
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
import { NotificationCenter } from "./components/NotificationCenter";
import {
  Wind,
  Sparkles,
  Users,
  LogOut,
  Loader2,
  Database,
} from "lucide-react";
import wezetLogo from "figma:asset/cad8962e9e4e19ad0957fc3b983cea5aa5970651.png";
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
} from "lucide-react";

function AppContent() {
  const { user, loading, signOut, getAccessToken } = useAuth();
  const [activeView, setActiveView] = useState("home");
  const [initializingData, setInitializingData] =
    useState(false);
  const [bookingPreselection, setBookingPreselection] =
    useState<any>(null);

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

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  if (activeView === "design-system") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <DesignSystem />
      </div>
    );
  }

  if (activeView === "calendar") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <PublicCalendar
          onNavigateToBooking={(bookingData) => {
            // Store booking data for BookingFlow
            console.log(
              "Navigating to booking with data:",
              bookingData,
            );
            setBookingPreselection(bookingData);
            setActiveView("booking");
          }}
        />
      </div>
    );
  }

  if (activeView === "booking") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setActiveView("home");
                setBookingPreselection(null);
              }}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <BookingFlow preselection={bookingPreselection} />
      </div>
    );
  }

  if (activeView === "client-dashboard") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
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
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <TeamDashboard />
      </div>
    );
  }

  if (activeView === "team-directory") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <TeamDirectory />
      </div>
    );
  }

  if (activeView === "admin-dashboard") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <AdminDashboard
          onNavigate={(route) => setActiveView(route)}
        />
      </div>
    );
  }

  if (activeView === "analytics-dashboard") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <AnalyticsDashboard />
      </div>
    );
  }

  if (activeView === "availability-editor") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <AvailabilityEditor />
      </div>
    );
  }

  if (activeView === "availability-management") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <AvailabilityManagement />
      </div>
    );
  }

  if (activeView === "digital-content-library") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <DigitalContentLibrary />
      </div>
    );
  }

  if (activeView === "content-viewer") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <ContentViewer />
      </div>
    );
  }

  if (activeView === "on-demand-product-detail") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <OnDemandProductDetail />
      </div>
    );
  }

  if (activeView === "retreat-detail") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <RetreatDetail />
      </div>
    );
  }

  if (activeView === "wordpress-calendar-widget") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <div className="min-h-screen bg-background py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="max-w-md mx-auto">
              <WordPressCalendarWidget />
            </div>
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
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <TeamMemberDetail />
      </div>
    );
  }

  if (activeView === "services-categories") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <ServicesCategories />
      </div>
    );
  }

  if (activeView === "public-service-detail") {
    return (
      <PublicServiceDetail
        onBack={() => setActiveView("home")}
        onBook={() => setActiveView("booking")}
      />
    );
  }

  if (activeView === "service-detail") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <ServiceDetail />
      </div>
    );
  }

  if (activeView === "locations-directory") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <LocationsDirectory />
      </div>
    );
  }

  if (activeView === "location-detail") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <LocationDetail />
      </div>
    );
  }

  if (activeView === "bookings-directory") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <BookingsDirectory />
      </div>
    );
  }

  if (activeView === "booking-detail") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <BookingDetail />
      </div>
    );
  }

  if (activeView === "digital-content-management") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <DigitalContentManagement />
      </div>
    );
  }

  if (activeView === "digital-content-detail") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <DigitalContentDetail />
      </div>
    );
  }

  if (activeView === "settings-page") {
    return (
      <div>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setActiveView("home")}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
        <SettingsPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar - Only visible when logged in */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={wezetLogo}
              alt="WEZET"
              className="h-8 w-auto object-contain"
            />
            <Badge variant="secondary" className="text-xs">
              {user.user_metadata?.role || "Client"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {user.user_metadata?.name || user.email}
            </div>
            <CurrencySelector />
            <NotificationCenter />
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

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
                    Platform management, analytics, and bookings overview
                  </p>
                </div>
              </div>
            </button>

            {/* Public Calendar */}
            <button
              onClick={() => setActiveView("calendar")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1 w-1 rounded-full bg-primary"
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3>Public Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    Monthly grid view with available slots and team selection
                  </p>
                </div>
              </div>
            </button>

            {/* Team Dashboard */}
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
                    Weekly schedule, session management, and analytics
                  </p>
                </div>
              </div>
            </button>

            {/* Client Dashboard */}
            <button
              onClick={() => setActiveView("client-dashboard")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <div className="space-y-1">
                    <div className="h-2 w-8 rounded bg-primary"></div>
                    <div className="h-2 w-6 rounded bg-primary/60"></div>
                    <div className="h-2 w-4 rounded bg-primary/30"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3>Client Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Upcoming sessions, progress tracking, and quick actions
                  </p>
                </div>
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20">
          <div className="flex flex-col items-center justify-center space-y-6">
            <img
              src={wezetLogo}
              alt="WEZET"
              className="h-12 md:h-16 w-auto object-contain"
            />
            <p className="text-muted-foreground text-center">
              Wezet | Transformational Breathwork & Education
            </p>
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