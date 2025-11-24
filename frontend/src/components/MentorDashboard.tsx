import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  Video,
  MessageCircle,
  Settings,
  ChevronRight,
  Star,
  CalendarPlus
} from "lucide-react";
import { CreateSessionModal } from "./CreateSessionModal";

const WEEKLY_SCHEDULE = [
  { day: "Mon", date: "Nov 11", slots: [
    { time: "9:00 AM", client: "Alex K.", type: "Breathwork", status: "confirmed" },
    { time: "2:00 PM", client: "Jamie L.", type: "Energy", status: "confirmed" },
  ]},
  { day: "Tue", date: "Nov 12", slots: [
    { time: "10:00 AM", client: "Sam R.", type: "Movement", status: "confirmed" },
  ]},
  { day: "Wed", date: "Nov 13", slots: [
    { time: "9:00 AM", client: "Available", type: "Open", status: "available" },
    { time: "4:00 PM", client: "Morgan T.", type: "Breathwork", status: "pending" },
  ]},
  { day: "Thu", date: "Nov 14", slots: [
    { time: "11:00 AM", client: "Casey P.", type: "Energy", status: "confirmed" },
    { time: "3:00 PM", client: "Available", type: "Open", status: "available" },
  ]},
  { day: "Fri", date: "Nov 15", slots: [
    { time: "2:00 PM", client: "Alex K.", type: "Breathwork", status: "confirmed" },
    { time: "5:00 PM", client: "Jordan M.", type: "Movement", status: "confirmed" },
  ]},
];

const UPCOMING_SESSIONS = [
  {
    id: 1,
    client: "Alex K.",
    initials: "AK",
    type: "Breathwork Foundations",
    date: "Nov 15, 2025",
    time: "2:00 PM",
    duration: "60 min",
    status: "confirmed",
    price: 120,
    notes: "First session, new client",
  },
  {
    id: 2,
    client: "Jordan M.",
    initials: "JM",
    type: "Movement & Flow",
    date: "Nov 15, 2025",
    time: "5:00 PM",
    duration: "45 min",
    status: "confirmed",
    price: 100,
    notes: "",
  },
  {
    id: 3,
    client: "Morgan T.",
    initials: "MT",
    type: "Breathwork Foundations",
    date: "Nov 13, 2025",
    time: "4:00 PM",
    duration: "60 min",
    status: "pending",
    price: 120,
    notes: "Requested focus on stress relief",
  },
];

const STATS = [
  { label: "This Week", value: "$840", icon: DollarSign, trend: "+12%" },
  { label: "Total Clients", value: "24", icon: Users, trend: "+3 new" },
  { label: "Sessions This Week", value: "7", icon: Calendar, trend: "2 pending" },
  { label: "Avg Rating", value: "4.9", icon: Star, trend: "18 reviews" },
];

export function MentorDashboard() {
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                SC
              </AvatarFallback>
            </Avatar>
            <div>
              <h1>Sarah Chen</h1>
              <p className="text-muted-foreground">Breathwork Specialist</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="mr-2 h-5 w-5" />
              Manage Availability
            </Button>
            <Button size="lg" onClick={() => setIsCreateSessionOpen(true)}>
              <CalendarPlus className="mr-2 h-5 w-5" />
              Create Session
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl tracking-tight">{stat.value}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Weekly Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2>This Week's Schedule</h2>
                <Button variant="ghost" size="sm">
                  View Calendar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {WEEKLY_SCHEDULE.map((day) => (
                      <div key={day.day} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm w-16">
                            <p className="font-medium">{day.day}</p>
                            <p className="text-muted-foreground">{day.date}</p>
                          </div>
                          <div className="flex-1 space-y-2">
                            {day.slots.map((slot, idx) => (
                              <div
                                key={idx}
                                className={`
                                  p-3 rounded-xl flex items-center justify-between
                                  ${slot.status === 'available' 
                                    ? 'bg-muted/30 border border-dashed border-muted-foreground/30' 
                                    : slot.status === 'pending'
                                    ? 'bg-amber-500/10 border border-amber-500/30'
                                    : 'bg-primary/5 border border-primary/20'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-sm min-w-[80px]">
                                    <Clock className="h-4 w-4" />
                                    {slot.time}
                                  </div>
                                  <div className="text-sm">
                                    <p className="font-medium">{slot.client}</p>
                                    <p className="text-xs text-muted-foreground">{slot.type}</p>
                                  </div>
                                </div>
                                {slot.status === 'confirmed' && (
                                  <Badge className="bg-[#0D7A7A] text-white">Confirmed</Badge>
                                )}
                                {slot.status === 'pending' && (
                                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                                    Pending
                                  </Badge>
                                )}
                                {slot.status === 'available' && (
                                  <Badge variant="secondary">Open Slot</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {day.day !== WEEKLY_SCHEDULE[WEEKLY_SCHEDULE.length - 1].day && (
                          <Separator />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Sessions Table */}
            <div className="space-y-4">
              <h2>Upcoming Sessions</h2>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Session Type</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {UPCOMING_SESSIONS.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-muted text-xs">
                                  {session.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{session.client}</span>
                            </div>
                          </TableCell>
                          <TableCell>{session.type}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{session.date}</p>
                              <p className="text-xs text-muted-foreground">{session.time}</p>
                            </div>
                          </TableCell>
                          <TableCell>{session.duration}</TableCell>
                          <TableCell>
                            {session.status === 'confirmed' ? (
                              <Badge className="bg-[#0D7A7A] text-white">Confirmed</Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500 text-amber-700">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>${session.price}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost">
                                <Video className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="text-base">Today's Sessions</CardTitle>
                <CardDescription>Friday, Nov 15</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { time: "2:00 PM", client: "Alex K.", type: "Breathwork" },
                    { time: "5:00 PM", client: "Jordan M.", type: "Movement" },
                  ].map((session, idx) => (
                    <div key={idx} className="p-4 bg-card rounded-xl border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{session.time}</span>
                          <Badge variant="secondary" className="text-xs">
                            {session.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-muted">
                              {session.client.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{session.client}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  View Full Day
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { action: "New booking", client: "Morgan T.", time: "2h ago" },
                    { action: "Session completed", client: "Sam R.", time: "5h ago" },
                    { action: "Payment received", client: "Casey P.", time: "1d ago" },
                    { action: "New review", client: "Alex K.", time: "2d ago" },
                  ].map((activity, idx) => (
                    <div key={idx}>
                      <div className="flex items-start gap-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.client} · {activity.time}
                          </p>
                        </div>
                      </div>
                      {idx < 3 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Strength</CardTitle>
                <CardDescription>Complete your profile to attract more clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profile Complete</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                    <span>Add certifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                    <span>Upload introduction video</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Complete Profile
                </Button>
              </CardContent>
            </Card>

            {/* Earnings Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
                <CardDescription>Revenue overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Earnings</span>
                    <span className="text-2xl">$3,240</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessions</span>
                    <span>27</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg per session</span>
                    <span>$120</span>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full">
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Financial Details
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal 
        open={isCreateSessionOpen}
        onOpenChange={setIsCreateSessionOpen}
      />
    </div>
  );
}
