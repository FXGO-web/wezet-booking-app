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
  Users
} from "lucide-react";
import { MENTORS, getMentorById } from "./mentors-data";
import { useAuth } from "../hooks/useAuth";

const UPCOMING_SESSIONS = [
  {
    id: 1,
    type: "Small Group Breathwork",
    category: "Breathwork",
    practitioner: MENTORS[0].name,
    practitionerInitials: MENTORS[0].initials,
    mentorId: MENTORS[0].id,
    date: "Nov 15, 2025",
    time: "9:00 AM - 10:30 AM",
    status: "confirmed",
    icon: Wind,
    color: "text-[#0D7A7A]",
    bgColor: "bg-[#0D7A7A]/10",
  },
  {
    id: 2,
    type: "Body SDS",
    category: "Bodywork",
    practitioner: MENTORS[1].name,
    practitionerInitials: MENTORS[1].initials,
    mentorId: MENTORS[1].id,
    date: "Nov 18, 2025",
    time: "2:00 PM - 3:30 PM",
    status: "confirmed",
    icon: Heart,
    color: "text-[#4ECDC4]",
    bgColor: "bg-[#4ECDC4]/10",
  },
  {
    id: 3,
    type: "Individual Coaching",
    category: "Coaching",
    practitioner: MENTORS[2].name,
    practitionerInitials: MENTORS[2].initials,
    mentorId: MENTORS[2].id,
    date: "Nov 22, 2025",
    time: "4:00 PM - 5:00 PM",
    status: "confirmed",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const PAST_SESSIONS = [
  {
    id: 4,
    type: "Private Breathwork Session",
    category: "Breathwork",
    date: "Nov 8, 2025",
    completed: true,
  },
  {
    id: 5,
    type: "Bio Integrative Osteopathy",
    category: "Bodywork",
    date: "Nov 1, 2025",
    completed: true,
  },
];

const STATS = [
  { label: "Total Sessions", value: "8", trend: "+2 this month" },
  { label: "Hours Practiced", value: "12.5", trend: "This month" },
  { label: "Favorite Practice", value: "Breathwork", trend: "5 sessions" },
];

interface ClientDashboardProps {
  onNavigate?: (route: string) => void;
  onBookSession?: () => void;
}

export function ClientDashboard({ onNavigate, onBookSession }: ClientDashboardProps) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Guest";

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
          {STATS.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.trend}</p>
                </div>
              </CardContent>
            </Card>
          ))}
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
              {UPCOMING_SESSIONS.map((session) => {
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
                              {(() => {
                                const mentor = getMentorById(session.mentorId);
                                return mentor?.avatarUrl ? (
                                  <AvatarImage src={mentor.avatarUrl} alt={session.practitioner} />
                                ) : null;
                              })()}
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {session.practitionerInitials}
                              </AvatarFallback>
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
              })}
            </div>

            {/* Past Sessions */}
            <div className="space-y-4 mt-12">
              <h3>Recent History</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {PAST_SESSIONS.map((session) => (
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
                        {session.id !== PAST_SESSIONS[PAST_SESSIONS.length - 1].id && (
                          <Separator />
                        )}
                      </div>
                    ))}
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
                    <span>4/6 sessions</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '66%' }}></div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-primary" />
                      <span>Breathwork</span>
                    </div>
                    <span className="text-muted-foreground">3 sessions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#4ECDC4]" />
                      <span>Energy</span>
                    </div>
                    <span className="text-muted-foreground">1 session</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  View Full Stats
                </Button>
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