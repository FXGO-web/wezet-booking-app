import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Save, Trash2, MapPin } from "lucide-react";

const services = [
  "Transformational Breathwork",
  "Connected Breathing Session",
  "Group Breathwork Circle",
  "Somatic Bodywork",
  "Life Coaching Session",
];

const teamMembers = [
  "Sarah Chen",
  "Marcus Rodriguez",
  "Emma Wilson",
  "Lisa Thompson",
];

export function LocationDetail() {
  const [selectedServices, setSelectedServices] = useState([
    "Transformational Breathwork",
    "Group Breathwork Circle",
  ]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([
    "Sarah Chen",
    "Emma Wilson",
  ]);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const toggleTeamMember = (member: string) => {
    setSelectedTeamMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1>Location Details</h1>
          <p className="text-muted-foreground">
            Configure location information, capacity, and availability
          </p>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name</Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Studio A - Main Space"
                  defaultValue="Studio A - Main Space"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type</Label>
                <Select defaultValue="in-person">
                  <SelectTrigger id="locationType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="external">External Venue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address / URL</Label>
                <Input
                  id="address"
                  placeholder="Physical address or Zoom link"
                  defaultValue="123 Wellness Way, San Francisco, CA 94102"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (optional)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="20"
                  defaultValue="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Opening Hours (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
              (day) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-28">{day}</div>
                  <Input
                    type="time"
                    defaultValue="09:00"
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    defaultValue="17:00"
                    className="w-32"
                  />
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Supported Services */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${service}`}
                    checked={selectedServices.includes(service)}
                    onCheckedChange={() => toggleService(service)}
                  />
                  <label
                    htmlFor={`service-${service}`}
                    className="text-sm cursor-pointer"
                  >
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member} className="flex items-center space-x-2">
                  <Checkbox
                    id={`member-${member}`}
                    checked={selectedTeamMembers.includes(member)}
                    onCheckedChange={() => toggleTeamMember(member)}
                  />
                  <label
                    htmlFor={`member-${member}`}
                    className="text-sm cursor-pointer"
                  >
                    {member}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button variant="destructive" className="sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Location
          </Button>
        </div>
      </div>
    </div>
  );
}
