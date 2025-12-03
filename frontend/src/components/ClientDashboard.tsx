import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Heart,
  Wind,
  Zap,
  Sparkles,
  ChevronRight,
  Plus,
  Users,
  Loader2
} from "lucide-react";
import { bookingsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

const getCategoryStyle = (category: string) => {
  const lower = category?.toLowerCase() || "";
  if (lower.includes("breath")) return { icon: Wind, color: "text-[#0D7A7A]", bgColor: "bg-[#0D7A7A]/10" };
  if (lower.includes("body")) return { icon: Heart, color: "text-[#4ECDC4]", bgColor: "bg-[#4ECDC4]/10" };
  if (lower.includes("energy")) return { icon: Zap, color: "text-amber-500", bgColor: "bg-amber-500/10" };
  return { icon: Users, color: "text-primary", bgColor: "bg-primary/10" };
};

interface ClientDashboardProps {
  onNavigate?: (route: string) => void;
  onBookSession?: () => void;
}

export function ClientDashboard({ onNavigate, onBookSession }: ClientDashboardProps) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Guest";

  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    hoursPracticed: 0,
    favoritePractice: "None"
  });

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { bookings } = await bookingsAPI.getAll({ customerId: user.id });

        const now = new Date();
        const upcoming: any[] = [];
        const past: any[] = [];
        let totalMinutes = 0;
        const categoryCounts: Record<string, number> = {};

        bookings.forEach((booking: any) => {
          const bookingDate = new Date(`${booking.date}T${booking.time}`);
          const style = getCategoryStyle(booking.category);

          const sessionObj = {
            ...booking,
            type: booking.serviceName,
            practitioner: booking.teamMemberName,
            practitionerInitials: booking.teamMemberName.split(' ').map((n: string) => n[0]).join(''),
            icon: style.icon,
            color: style.color,
            bgColor: style.bgColor,
          };

          if (bookingDate >= now) {
            upcoming.push(sessionObj);
          } else {
            past.push(sessionObj);
            // Only count past sessions for stats
            // Assuming 60 mins if duration not available (API doesn't return duration yet, defaulting to 60)
            // Wait, API returns template which has duration_minutes. But mapped object doesn't have it.
            // I'll default to 60 for now or fetch it.
            totalMinutes += 60;

            const cat = booking.category || "General";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        });

        // Sort upcoming by date asc
        upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        // Sort past by date desc
        past.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

        setUpcomingSessions(upcoming);
        setPastSessions(past);

        // Calculate favorite practice
        let fav = "None";
        let max = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > max) {
            max = count;
            fav = cat;
          }
        });

        setStats({
          totalSessions: past.length,
          hoursPracticed: Math.round(totalMinutes / 60 * 10) / 10,
          favoritePractice: fav
        });

      } catch (error) {
        console.error("Error fetching client bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground tracking-tight">
              Welcome back, {userName}
            </h1>
            <p className="text-muted-foreground text-lg">
              Your wellness journey continues
            </p>
          </div>
          <Button
            size="lg"
            className="md:w-auto"
            onClick={() => onNavigate?.('calendar')}
          >
            <Plus className="mr-2 h-5 w-5" />
            Book a Session
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-3xl tracking-tight">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Completed sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Hours Practiced</p>
                <p className="text-3xl tracking-tight">{stats.hoursPracticed}</p>
                <p className="text-xs text-muted-foreground">Total time invested</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Favorite Practice</p>
                <p className="text-3xl tracking-tight truncate">{stats.favoritePractice}</p>
                <p className="text-xs text-muted-foreground">Most frequent category</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2>Upcoming Sessions</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.('calendar')}>
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => {
                  const Icon = session.icon;
                  return (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl ${session.bgColor}`}>
                                <Icon className={`h-6 w-6 ${session.color}`} />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-base">{session.type}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {session.date}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {session.time}
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-[#0D7A7A] text-white">
                              {session.status}
                            </Badge>
                          </div>

                          <Separator />

                          {/* Practitioner & Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {session.practitionerAvatar ? (
                                  <AvatarImage src={session.practitionerAvatar} alt={session.practitioner} />
                                ) : (
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {session.practitionerInitials}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="text-sm">{session.practitioner}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.category}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="icon" variant="outline" onClick={() => onNavigate?.('messages')}>
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => alert("Joining session...")}>
                                <Video className="mr-2 h-4 w-4" />
                                Join Session
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
                    <Button variant="outline" onClick={() => onNavigate?.('calendar')}>
                      Book your first session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Past Sessions */}
            <div className="space-y-4 mt-12">
              <h3>Recent History</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {pastSessions.length > 0 ? (
                      pastSessions.map((session, index) => (
                        <div key={session.id}>
                          <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Wind className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm">{session.type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.category} · {session.date}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                          {index < pastSessions.length - 1 && (
                            <Separator />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No past sessions found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate?.('calendar')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => alert("Favorites feature coming soon")}>
                  <Heart className="mr-2 h-4 w-4" />
                  My Favorites
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate?.('messages')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Your Progress</CardTitle>
                <CardDescription>This month's journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Goal</span>
                    <span>{stats.totalSessions} sessions</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((stats.totalSessions / 4) * 100, 100)}%` }}></div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Keep going! Consistency is key.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended for You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm">Deep Energy Work</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on your recent sessions
                  </p>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    Explore
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}