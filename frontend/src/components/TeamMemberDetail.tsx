import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { 
  Save, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock,
  MapPin 
} from "lucide-react";

interface Session {
  id: string;
  date: string;
  time: string;
  service: string;
  client: string;
  location: string;
  status: string;
}

const mockSessions: Session[] = [
  {
    id: "1",
    date: "2025-11-25",
    time: "10:00 AM",
    service: "Breathwork Session",
    client: "John Doe",
    location: "Studio A",
    status: "confirmed",
  },
  {
    id: "2",
    date: "2025-11-26",
    time: "2:00 PM",
    service: "Meditation",
    client: "Jane Smith",
    location: "Online",
    status: "confirmed",
  },
  {
    id: "3",
    date: "2025-11-20",
    time: "11:00 AM",
    service: "Breathwork Session",
    client: "Mike Johnson",
    location: "Studio B",
    status: "completed",
  },
];

const availableServices = [
  "Breathwork",
  "Meditation",
  "Bodywork",
  "Coaching",
  "Education",
  "Retreats",
];

const specialtiesOptions = [
  "Transformational Breathwork",
  "Conscious Connected Breathing",
  "Somatic Healing",
  "Energy Work",
  "Trauma-Informed Practice",
  "Group Facilitation",
];

export function TeamMemberDetail() {
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedServices, setSelectedServices] = useState(["Breathwork", "Meditation"]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([
    "Transformational Breathwork",
    "Somatic Healing",
  ]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const upcomingSessions = mockSessions.filter(
    (s) => new Date(s.date) >= new Date()
  );
  const pastSessions = mockSessions.filter((s) => new Date(s.date) < new Date());

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  SC
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <h1>Sarah Chen</h1>
                <Badge variant="secondary">Teacher</Badge>
                <p className="text-muted-foreground">
                  Experienced breathwork facilitator specializing in transformational healing
                  and somatic practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue="Sarah Chen" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="sarah@wezet.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue="teacher">
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="facilitator">Facilitator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    defaultValue="Experienced breathwork facilitator specializing in transformational healing and somatic practices."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Specialties</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specialtiesOptions.map((specialty) => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={`specialty-${specialty}`}
                          checked={selectedSpecialties.includes(specialty)}
                          onCheckedChange={() => toggleSpecialty(specialty)}
                        />
                        <label
                          htmlFor={`specialty-${specialty}`}
                          className="text-sm cursor-pointer"
                        >
                          {specialty}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {availableServices.map((service) => (
                    <div
                      key={service}
                      className="flex items-center justify-between p-4 border rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`service-${service}`}
                          checked={selectedServices.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                        />
                        <label
                          htmlFor={`service-${service}`}
                          className="cursor-pointer"
                        >
                          {service}
                        </label>
                      </div>
                      {selectedServices.includes(service) && (
                        <Input
                          type="number"
                          placeholder="Price override"
                          className="w-32"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Button className="w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save Services
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                    <div key={day} className="flex items-center gap-4 p-4 border rounded-xl">
                      <div className="w-24">{day}</div>
                      <Badge variant="outline">9:00 AM - 5:00 PM</Badge>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Edit Weekly Availability
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-xl"
                    >
                      <div className="space-y-1">
                        <p>{session.service}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </span>
                        </div>
                      </div>
                      <Badge>{session.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Past Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-xl opacity-60"
                    >
                      <div className="space-y-1">
                        <p>{session.service}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.time}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">{session.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Account Status</Label>
                    <Select defaultValue="active">
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="destructive" className="w-full md:w-auto">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
