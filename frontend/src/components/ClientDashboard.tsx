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
  Mountain,
  GraduationCap,
  Plus,
  Users,
  Loader2,
  ArrowRight
} from "lucide-react";
import { bookingsAPI, sessionsAPI, availabilityAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { useCurrency } from "../context/CurrencyContext";

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
  const { convertAndFormat } = useCurrency();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Guest";

  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    hoursPracticed: 0,
    favoritePractice: "None"
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 1. Fetch Bookings
        const { bookings } = await bookingsAPI.getAll({ customerId: user.id });

        // 2. Fetch Services (for mapping available slots)
        const { services }: { services: any[] } = await sessionsAPI.getAll();

        // 3. Fetch Availability (for suggestions)
        const availabilityData = await availabilityAPI.getAvailability(currentYear, currentMonth);

        // Process Bookings
        const upcoming: any[] = [];
        const past: any[] = [];
        let totalMinutes = 0;
        const categoryCounts: Record<string, number> = {};

        bookings.forEach((booking: any) => {
          // Use robust startTime if available, else fallback
          const bookingDate = booking.startTime
            ? new Date(booking.startTime)
            : new Date(`${booking.date}T${booking.time}`);

          const style = getCategoryStyle(booking.category);

          const sessionObj = {
            ...booking,
            type: booking.serviceName,
            practitioner: booking.teamMemberName,
            practitionerInitials: booking.teamMemberName.split(' ').map((n: string) => n[0]).join(''),
            icon: style.icon,
            color: style.color,
            bgColor: style.bgColor,
            // Ensure date object is available for sorting
            _dateObj: bookingDate
          };

          if (bookingDate >= now) {
            upcoming.push(sessionObj);
          } else {
            past.push(sessionObj);
            totalMinutes += 60; // Default to 60 if not available
            const cat = booking.category || "General";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        });

        // Sort bookings using the pre-calculated date object
        upcoming.sort((a, b) => a._dateObj.getTime() - b._dateObj.getTime());
        past.sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime());

        setUpcomingSessions(upcoming);
        setPastSessions(past);

        // Process Availability for "Available Slots" (if no upcoming bookings)
        const slots: any[] = [];
        const rawSlots = availabilityData?.slots || [];
        const teamMembers = availabilityData?.teamMembers || [];

        rawSlots.forEach((slot: any) => {
          const slotDate = new Date(`${slot.date}T${slot.start}`);
          if (slotDate < now) return; // Skip past slots

          // Find instructor
          const instructor = teamMembers.find((m: any) => String(m.id) === String(slot.instructor_id));
          if (!instructor) return;

          // Find service details
          let service = null;
          if (slot.template_id) {
            service = services.find((s: any) => String(s.id) === String(slot.template_id));
          } else {
            // Generic slot - try to find any service for this instructor or default
            service = services.find((s: any) => String(s.instructor_id) === String(slot.instructor_id));
          }

          const category = service?.category?.name || "General";
          const style = getCategoryStyle(category);

          slots.push({
            id: `avail-${slot.date}-${slot.start}-${slot.instructor_id}`,
            date: slot.date,
            time: slot.start.slice(0, 5),
            type: service?.name || "Available Session",
            category: category,
            practitioner: instructor.name || instructor.full_name,
            practitionerInitials: (instructor.name || instructor.full_name || "?").split(' ').map((n: string) => n[0]).join(''),
            practitionerAvatar: instructor.avatar_url,
            price: service?.price || service?.basePrice,
            currency: service?.currency || 'EUR',
            icon: style.icon,
            color: style.color,
            bgColor: style.bgColor,
            isAvailable: true // Flag to distinguish from booked
          });
        });

        // Sort available slots
        slots.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        // Deduplicate slots (simple dedup by date/time/practitioner)
        const uniqueSlots = slots.filter((slot, index, self) =>
          index === self.findIndex((t) => (
            t.date === slot.date && t.time === slot.time && t.practitioner === slot.practitioner
          ))
        );

        setAvailableSlots(uniqueSlots);

        // Set Recommendation
        // Pick the first available slot that isn't in the "upcoming" display list (if we are showing available slots there)
        // If user has bookings, we show bookings in main list, so recommendation can be the first available slot.
        // If user has NO bookings, we show top 3 available slots in main list, so recommendation should be the 4th one or a random one.

        let rec = null;
        if (upcoming.length > 0) {
          rec = uniqueSlots[0];
        } else {
          rec = uniqueSlots[3] || uniqueSlots[0]; // Pick 4th if showing top 3, else fallback
        }

        // If still no slot (e.g. no availability), pick a random service
        if (!rec && services.length > 0) {
          const randomService = services[0];
          const style = getCategoryStyle(randomService.category?.name);
          rec = {
            type: randomService.name,
            category: randomService.category?.name || "General",
            description: "Book a session now",
            price: randomService.price || randomService.basePrice,
            currency: randomService.currency || 'EUR',
            icon: style.icon,
            color: style.color,
            bgColor: style.bgColor,
            isService: true // Flag to indicate it's just a service, not a specific slot
          };
        }

        setRecommendation(rec);

        // Calculate Stats
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
        console.error("Error fetching client dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleBookSlot = (slot: any) => {
    // Navigate to calendar with pre-selected date if possible, or just calendar
    if (onNavigate) {
      // In a real app we might pass params to pre-select, for now just go to calendar
      onNavigate('calendar');
    }
  };

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
          {/* Upcoming Sessions (or Available Slots) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2>
                {upcomingSessions.length > 0 ? "Upcoming Sessions" : "Available Sessions Today"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate?.('calendar')}>
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingSessions.length > 0 ? (
                // Show Booked Sessions
                upcomingSessions.map((session) => {
                  const Icon = session.icon;
                  return (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
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
              ) : availableSlots.length > 0 ? (
                // Show Available Slots (if no bookings)
                availableSlots.slice(0, 3).map((slot) => {
                  const Icon = slot.icon;
                  return (
                    <Card key={slot.id} className="hover:shadow-lg transition-shadow border-dashed border-primary/20 bg-primary/5">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl ${slot.bgColor}`}>
                                <Icon className={`h-6 w-6 ${slot.color}`} />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-base font-medium">{slot.type}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {slot.date}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {slot.time}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary">
                              Available
                            </Badge>
                          </div>
                          <Separator className="bg-primary/10" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {slot.practitionerAvatar ? (
                                  <AvatarImage src={slot.practitionerAvatar} alt={slot.practitioner} />
                                ) : (
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {slot.practitionerInitials}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="text-sm text-muted-foreground">with {slot.practitioner}</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleBookSlot(slot)}>
                              Book Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                // Fallback if no bookings AND no availability
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <p className="text-muted-foreground">No sessions available at the moment.</p>
                    <Button variant="outline" onClick={() => onNavigate?.('calendar')}>
                      Check Calendar
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
                  Book a Session
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate?.('calendar')}>
                  <Mountain className="mr-2 h-4 w-4" />
                  Programs & Retreats
                </Button>
                <Separator />
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/?view=sso-authorize&redirect=https://shop.wezet.xyz'}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Wezet Shop (Home)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/?view=sso-authorize&redirect=https://learn.wezet.xyz'}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Wezet Learning (Courses)
                </Button>
                <Separator />
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
                {recommendation ? (
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">{recommendation.type}</p>
                    </div>
                    {recommendation.date && (
                      <p className="text-xs text-muted-foreground">
                        Next available: {recommendation.date} at {recommendation.time}
                      </p>
                    )}
                    {recommendation.price && (
                      <p className="text-xs font-medium">
                        {convertAndFormat(recommendation.price, recommendation.currency)}
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => onNavigate?.('calendar')}>
                      Explore
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Check back later for recommendations.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}