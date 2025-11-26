import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Settings,
  MapPin,
  Video,
  Folder,
  ChevronRight,
  Loader2,
  TrendingUp,
  Layers,
} from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";
import { statsAPI, bookingsAPI, settingsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { convertCurrency, formatCurrency } from "../utils/currency";
import { useCurrency } from "../context/CurrencyContext";

interface RecentBooking {
  id: string;
  client: string;
  teamMember: string;
  service: string;
  date: string;
  time: string;
  price: number;
  currency: string;
  status: "confirmed" | "pending" | "cancelled";
}

const recentBookings: RecentBooking[] = [
  {
    id: "1",
    client: "Sarah Anderson",
    service: "Breathwork Session",
    teamMember: "Marcus Rodriguez",
    date: "Nov 23, 2025",
    time: "10:00",
    price: 750,
    currency: "EUR",
    status: "confirmed",
  },
  {
    id: "2",
    client: "John Smith",
    service: "Coaching Call",
    teamMember: "Emma Wilson",
    date: "Nov 24, 2025",
    time: "14:00",
    price: 900,
    currency: "EUR",
    status: "confirmed",
  },
  {
    id: "3",
    client: "Lisa Chen",
    service: "Somatic Bodywork",
    teamMember: "Sarah Chen",
    date: "Nov 25, 2025",
    time: "09:00",
    price: 1200,
    currency: "EUR",
    status: "pending",
  },
  {
    id: "4",
    client: "Michael Brown",
    service: "Group Breathwork",
    teamMember: "Marcus Rodriguez",
    date: "Nov 26, 2025",
    time: "16:00",
    price: 400,
    currency: "EUR",
    status: "confirmed",
  },
  {
    id: "5",
    client: "Emma Williams",
    service: "Transformation Program",
    teamMember: "Emma Wilson",
    date: "Nov 27, 2025",
    time: "3500",
    price: 3500,
    currency: "EUR",
    status: "confirmed",
  },
];

const overviewStats = [
  {
    title: "Total Sessions This Week",
    value: "47",
    icon: Calendar,
    change: "+12%",
  },
  {
    title: "Total Bookings",
    value: "124",
    icon: BarChart3,
    change: "+8%",
  },
  {
    title: "Revenue",
    value: "45,200",
    currency: "DKK",
    icon: DollarSign,
    change: "+15%",
  },
  {
    title: "Active Team Members",
    value: "4",
    icon: Users,
    change: "+1",
  },
];

interface NavigationCard {
  title: string;
  description: string;
  icon: any;
  route: string;
  status?: "OK" | "SHOULD IMPLEMENT";
  statusColor?: string;
  extraText?: string;
  extraTextColor?: string;
}

const navigationCards: NavigationCard[] = [
  {
    title: "Platform Settings",
    description: "Configure platform preferences",
    icon: Settings,
    route: "settings-page",
    status: "OK",
    statusColor: "text-red-500",
  },
  {
    title: "User Management",
    description: "Manage team members & customers",
    icon: Users,
    route: "user-management",
    status: "OK",
    statusColor: "text-red-500",
  },
  {
    title: "Bookings",
    description: "View and manage all bookings",
    icon: Calendar,
    route: "bookings-directory",
    status: "OK",
    statusColor: "text-red-500",
  },
  {
    title: "Services & Categories",
    description: "Configure services, pricing & categories",
    icon: Layers,
    route: "services-categories",
    status: "OK",
    statusColor: "text-red-500",
    extraText: "Any time-slot based session like it is currently",
    extraTextColor: "text-red-400",
  },
  {
    title: "Programs & Retreats",
    description: "Any multi-day-dates Retreats or educational sequence",
    icon: MapPin,
    route: "programs-retreats", // Placeholder route
    status: "SHOULD IMPLEMENT",
    statusColor: "text-red-500",
    extraText: "Programs & Retreats", // Title is already this, but the red text in image says "Programs & Retreats" again? No, it says "Programs & Retreats" in red below description? Actually looking at image: Title "Programs & Retreats" (Red), Description "Any multi-day...". Wait.
    // Re-reading image:
    // Card 5:
    // Icon: Pin
    // Status: SHOULD IMPLEMENT (Red)
    // Title: Programs & Retreats (Red)
    // Description: Any multi-day-dates Retreats or educational sequence (Red/Orange?)
    // Actually, let's look at the structure.
    // The "Services & Categories" card has: Title Black, Description Gray, Extra Text Red.
    // The "Programs & Retreats" card has: Title Red, Description Red? Or maybe the Title IS "Programs & Retreats" and it's red.
    // Let's assume standard Title/Description structure but allow coloring.
  },
  {
    title: "Products & On Demand",
    description: "Any product of several categories & on demand streaming content",
    icon: Video,
    route: "products-on-demand", // Placeholder
    status: "SHOULD IMPLEMENT",
    statusColor: "text-red-500",
  },
  {
    title: "Availability",
    description: "Manage schedule & blackout dates",
    icon: Calendar,
    route: "availability-management",
    status: "OK",
    statusColor: "text-red-500",
  },
  {
    title: "Locations",
    description: "Manage studios and session venues",
    icon: MapPin,
    route: "locations-directory",
    status: "OK",
    statusColor: "text-red-500",
  },
  {
    title: "Analytics & Reports",
    description: "View metrics, revenue trends & team performance",
    icon: TrendingUp,
    route: "analytics-dashboard",
    status: "OK",
    statusColor: "text-red-500",
  },
];

interface AdminDashboardProps {
  onNavigate?: (route: string) => void;
}



// ... inside component
export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { getAccessToken } = useAuth();
  const { currency: selectedCurrency } = useCurrency();
  const [stats, setStats] = useState(overviewStats);
  const [bookings, setBookings] = useState(recentBookings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // ... (existing fetch logic using selectedCurrency)
      setLoading(true);
      try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          console.warn('No access token available, using default stats');
          setLoading(false);
          return;
        }

        // Fetch platform settings for default currency
        // Note: We might want to SET the global currency based on backend settings here?
        // For now, let's just use the global currency preference.

        // Fetch stats
        try {
          const { stats: statsData } = await statsAPI.getDashboard(accessToken);
          if (statsData) {
            const newStats = [
              {
                title: "Total Bookings",
                value: String(statsData.totalBookings || 0),
                icon: BarChart3,
                change: "+8%",
              },
              {
                title: "Confirmed Bookings",
                value: String(statsData.confirmedBookings || 0),
                icon: Calendar,
                change: "+12%",
              },
              {
                title: "Revenue",
                value: String(Math.round(statsData.totalRevenue || 0)),
                currency: selectedCurrency,
                icon: DollarSign,
                change: "+15%",
              },
              {
                title: "Active Team Members",
                value: String(statsData.activeTeamMembers || 0),
                icon: Users,
                change: "+1",
              },
            ];
            setStats(newStats);
          }
        } catch (error) {
          console.warn('Stats endpoint not available, using defaults');
        }

        // Fetch recent bookings
        try {
          const { bookings: bookingsData } = await bookingsAPI.getAll({ status: 'confirmed' });
          if (bookingsData && bookingsData.length > 0) {
            const formattedBookings = bookingsData.slice(0, 5).map((b: any) => ({
              id: b.id,
              client: b.clientName,
              teamMember: b.teamMemberName,
              service: b.serviceName,
              date: b.date,
              time: b.time,
              price: b.price,
              currency: b.currency,
              status: b.status,
            }));
            setBookings(formattedBookings);
          }
        } catch (error) {
          console.warn('Bookings endpoint not available, using defaults');
        }
      } catch (error) {
        console.warn('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getAccessToken, selectedCurrency]);

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your WEZET platform
            </p>
          </div>
          <CurrencySelector />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-3xl">
                        {stat.value}
                      </h2>
                      {stat.currency && (
                        <span className="text-lg text-muted-foreground">
                          {stat.currency}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationCards.map((card) => (
              <button
                key={card.title}
                className="group text-left p-6 rounded-2xl border bg-card hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between h-full"
                onClick={() => handleNavigate(card.route)}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-10 w-10 rounded-lg ${card.status === 'SHOULD IMPLEMENT' ? 'bg-red-50' : 'bg-primary/10'} flex items-center justify-center group-hover:bg-primary/20 transition-colors`}>
                      <card.icon className={`h-5 w-5 ${card.status === 'SHOULD IMPLEMENT' ? 'text-red-500' : 'text-primary'}`} />
                    </div>
                    {card.status && (
                      <span className={`text-xl font-bold italic ${card.statusColor}`}>
                        {card.status}
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <div className="space-y-1">
                    <h3 className={`text-base font-medium ${card.status === 'SHOULD IMPLEMENT' ? 'text-red-500 italic' : ''}`}>
                      {card.title}
                    </h3>
                    <p className={`text-sm ${card.status === 'SHOULD IMPLEMENT' ? 'text-red-400 italic' : 'text-muted-foreground'}`}>
                      {card.description}
                    </p>
                    {card.extraText && (
                      <p className={`text-xs mt-2 ${card.extraTextColor}`}>
                        {card.extraText}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.client}</TableCell>
                        <TableCell>{booking.teamMember}</TableCell>
                        <TableCell>{booking.service}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {new Date(booking.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(convertCurrency(booking.price, booking.currency, selectedCurrency), selectedCurrency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}