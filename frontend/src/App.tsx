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

      {/* Demo Data Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Card className="bg-background/80 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-base">
                      First Time Here?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Initialize demo data to populate the
                      calendar with sample services, team
                      members, and locations. This will help you
                      explore all platform features.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="shrink-0"
                  onClick={handleInitializeDemo}
                  disabled={initializingData}
                >
                  {initializingData ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Initialize Demo Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* WEZET Logo */}
            <div className="flex justify-center mb-8">
              <img
                src={wezetLogo}
                alt="WEZET Logo"
                className="h-32 md:h-40 lg:h-48 w-auto"
              />
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-[-0.02em]">
                Wezet | Transformational Breathwork & Education
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Breathwork | Bodywork | Coaching | Education |
                Retreats
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                className="text-lg h-14 px-8"
                onClick={() => setActiveView("calendar")}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Book a Session
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg h-14 px-8"
                onClick={() => setActiveView("design-system")}
              >
                View Design System
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2>Explore the Platform</h2>
            <p className="text-muted-foreground">
              Navigate through different views and experiences
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    Monthly grid view with available slots and
                    team selection
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
                    Upcoming sessions, progress tracking, and
                    quick actions
                  </p>
                </div>
              </div>
            </button>

            {/* Team Directory */}
            <button
              onClick={() => setActiveView("team-directory")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Team Directory</h3>
                  <p className="text-sm text-muted-foreground">
                    Meet our expert practitioners and book
                    sessions
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
                    Weekly schedule, session management, and
                    analytics
                  </p>
                </div>
              </div>
            </button>

            {/* Booking Flow */}
            <button
              onClick={() => setActiveView("booking")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Booking Flow</h3>
                  <p className="text-sm text-muted-foreground">
                    2-step booking process: select session,
                    complete details & payment
                  </p>
                </div>
              </div>
            </button>

            {/* Design System */}
            <button
              onClick={() => setActiveView("design-system")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent"></div>
                </div>
                <div className="space-y-2">
                  <h3>Design System</h3>
                  <p className="text-sm text-muted-foreground">
                    Colors, typography, components, and spacing
                    scales
                  </p>
                </div>
              </div>
            </button>

            {/* Admin Dashboard */}
            <button
              onClick={() => setActiveView("admin-dashboard")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Platform management, analytics, and bookings
                    overview
                  </p>
                </div>
              </div>
            </button>

            {/* Analytics Dashboard */}
            <button
              onClick={() =>
                setActiveView("analytics-dashboard")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed analytics and insights
                  </p>
                </div>
              </div>
            </button>

            {/* Availability Editor */}
            <button
              onClick={() =>
                setActiveView("availability-editor")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Availability Editor</h3>
                  <p className="text-sm text-muted-foreground">
                    Weekly schedule setup and blackout date
                    management
                  </p>
                </div>
              </div>
            </button>

            {/* Availability Management */}
            <button
              onClick={() =>
                setActiveView("availability-management")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Availability Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage availability and schedule
                  </p>
                </div>
              </div>
            </button>

            {/* Digital Content Library */}
            <button
              onClick={() =>
                setActiveView("digital-content-library")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Digital Content Library</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse videos, audio, PDFs, and
                    transformation programs
                  </p>
                </div>
              </div>
            </button>

            {/* Content Viewer */}
            <button
              onClick={() => setActiveView("content-viewer")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Content Viewer</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch videos, listen to audio, and read
                    educational materials
                  </p>
                </div>
              </div>
            </button>

            {/* On-Demand Product */}
            <button
              onClick={() =>
                setActiveView("on-demand-product-detail")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>On-Demand Product</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed page for paid courses and programs
                  </p>
                </div>
              </div>
            </button>

            {/* Retreat Detail */}
            <button
              onClick={() => setActiveView("retreat-detail")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mountain className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Retreat Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    Multi-day retreat page with schedule and
                    booking
                  </p>
                </div>
              </div>
            </button>

            {/* WordPress Calendar Widget */}
            <button
              onClick={() =>
                setActiveView("wordpress-calendar-widget")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Grid3x3 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>WordPress Widget</h3>
                  <p className="text-sm text-muted-foreground">
                    Embeddable calendar widget for WordPress
                    sites
                  </p>
                </div>
              </div>
            </button>

            {/* Team Management */}
            <button
              onClick={() => setActiveView("team-management")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Team Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage team members, roles, and availability
                  </p>
                </div>
              </div>
            </button>

            {/* Team Member Detail */}
            <button
              onClick={() =>
                setActiveView("team-member-detail")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Team Member Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    View and edit team member details
                  </p>
                </div>
              </div>
            </button>

            {/* Services Categories */}
            <button
              onClick={() =>
                setActiveView("services-categories")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Services Categories</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage service categories
                  </p>
                </div>
              </div>
            </button>

            {/* Service Detail */}
            <button
              onClick={() => setActiveView("public-service-detail")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Service Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    View public service page
                  </p>
                </div>
              </div>
            </button>

            {/* Locations Directory */}
            <button
              onClick={() =>
                setActiveView("locations-directory")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Grid3x3 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Locations Directory</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage locations
                  </p>
                </div>
              </div>
            </button>

            {/* Location Detail */}
            <button
              onClick={() => setActiveView("location-detail")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Grid3x3 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Location Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    View and edit location details
                  </p>
                </div>
              </div>
            </button>

            {/* Bookings Directory */}
            <button
              onClick={() =>
                setActiveView("bookings-directory")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Bookings Directory</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage bookings
                  </p>
                </div>
              </div>
            </button>

            {/* Booking Detail */}
            <button
              onClick={() => setActiveView("booking-detail")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Booking Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    View and edit booking details
                  </p>
                </div>
              </div>
            </button>

            {/* Digital Content Management */}
            <button
              onClick={() =>
                setActiveView("digital-content-management")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Digital Content Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage digital content
                  </p>
                </div>
              </div>
            </button>

            {/* Digital Content Detail */}
            <button
              onClick={() =>
                setActiveView("digital-content-detail")
              }
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Digital Content Detail</h3>
                  <p className="text-sm text-muted-foreground">
                    View and edit digital content details
                  </p>
                </div>
              </div>
            </button>

            {/* Settings Page */}
            <button
              onClick={() => setActiveView("settings-page")}
              className="group text-left p-8 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3>Settings Page</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure platform settings
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Meet Our Team */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h2>Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Work with experienced practitioners dedicated to
              your transformation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <Card
                key={member.id}
                className="overflow-hidden hover:shadow-xl transition-all"
              >
                <CardContent className="p-8 space-y-4">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Avatar className="h-24 w-24">
                      {member.avatarUrl && (
                        <AvatarImage
                          src={member.avatarUrl}
                          alt={member.name}
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-base">
                        {member.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 justify-center min-h-[48px]">
                    {member.specialties
                      .slice(0, 3)
                      .map((specialty, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    {member.specialties.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        +{member.specialties.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setActiveView("booking")}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Book a Session
                  </Button>
                </CardContent>
              </Card>
            ))}
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