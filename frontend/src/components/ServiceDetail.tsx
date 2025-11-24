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
import { Save, Trash2, Wind, Heart, MessageCircle, BookOpen, Mountain } from "lucide-react";

const iconOptions = [
  { value: "wind", label: "Wind", icon: Wind },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "message", label: "Message", icon: MessageCircle },
  { value: "book", label: "Book", icon: BookOpen },
  { value: "mountain", label: "Mountain", icon: Mountain },
];

const locations = [
  "Studio A - Main Space",
  "Studio B - Quiet Room",
  "Online - Zoom",
  "External Venues",
];

const teamMembers = [
  "Sarah Chen",
  "Marcus Rodriguez",
  "Emma Wilson",
  "Lisa Thompson",
];

export function ServiceDetail() {
  const [selectedIcon, setSelectedIcon] = useState("wind");
  const [selectedLocations, setSelectedLocations] = useState(["Studio A - Main Space", "Online - Zoom"]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState(["Sarah Chen", "Emma Wilson"]);

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const toggleTeamMember = (member: string) => {
    setSelectedTeamMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  const SelectedIcon = iconOptions.find((opt) => opt.value === selectedIcon)?.icon || Wind;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1>Service Details</h1>
          <p className="text-muted-foreground">
            Configure service information, pricing, and availability
          </p>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  placeholder="e.g., Transformational Breathwork"
                  defaultValue="Transformational Breathwork"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 90 min"
                  defaultValue="90 min"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue="breathwork">
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breathwork">Breathwork</SelectItem>
                    <SelectItem value="bodywork">Bodywork</SelectItem>
                    <SelectItem value="coaching">Coaching</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retreats">Retreats</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price</Label>
                <div className="flex gap-2">
                  <Select defaultValue="eur">
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="dkk">DKK</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="150"
                    defaultValue="150"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the service, its benefits, and what clients can expect..."
                defaultValue="A deeply transformative 90-minute breathwork journey designed to release stored emotions, expand consciousness, and facilitate profound healing."
              />
            </div>
          </CardContent>
        </Card>

        {/* Icon Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Icon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {iconOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedIcon(option.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedIcon === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Allowed Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Allowed Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => toggleLocation(location)}
                  />
                  <label
                    htmlFor={`location-${location}`}
                    className="text-sm cursor-pointer"
                  >
                    {location}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allowed Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Allowed Team Members</CardTitle>
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
            Delete Service
          </Button>
        </div>
      </div>
    </div>
  );
}