import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format } from "date-fns";

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SERVICE_TYPES = [
  { value: "breathwork", label: "Breathwork" },
  { value: "bodywork", label: "Bodywork" },
  { value: "coaching", label: "Coaching" },
  { value: "education", label: "Education" },
  { value: "retreat", label: "Retreat" },
];

const LOCATIONS = [
  { value: "studio-a", label: "Studio A" },
  { value: "studio-b", label: "Studio B" },
  { value: "online", label: "Online Session (Zoom/Meet)" },
];

const TAGS = [
  "Energy",
  "Somatic",
  "Movement",
  "Intro Level",
  "Advanced",
  "Group",
  "1:1",
  "Beginners Welcome",
];

const SERVICE_PRICES: Record<string, number> = {
  breathwork: 900,
  bodywork: 1200,
  coaching: 1500,
  education: 800,
  retreat: 5000,
};

export function CreateSessionModal({ open, onOpenChange }: CreateSessionModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [unlimitedCapacity, setUnlimitedCapacity] = useState(false);
  const [basePrice, setBasePrice] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [description, setDescription] = useState("");
  const [onlineLink, setOnlineLink] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleServiceTypeChange = (value: string) => {
    setServiceType(value);
    setBasePrice(SERVICE_PRICES[value]?.toString() || "");
  };

  const handleLocationChange = (value: string) => {
    if (value === "create_new") {
      setIsCreatingLocation(true);
      setLocation("");
    } else {
      setIsCreatingLocation(false);
      setLocation(value);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateSession = () => {
    // Handle session creation logic here
    console.log({
      title,
      duration,
      serviceType,
      location: isCreatingLocation ? newLocation : location,
      date,
      startTime,
      endTime,
      capacity: unlimitedCapacity ? "unlimited" : capacity,
      price: overridePrice || basePrice,
      description,
      onlineLink,
      tags: selectedTags,
      isRecurring,
      isPrivate,
    });

    // Reset form and close modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Set up a new session with all the details for booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Session Details */}
          <div className="space-y-4">
            <h3 className="text-lg">Session Details</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Morning Breathwork Flow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type *</Label>
              <Select value={serviceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger id="service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g. 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any specific notes or description for this session..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg">Schedule</h3>
              <span className="text-xs text-muted-foreground">Optional - can be set later</span>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg">Location</h3>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={isCreatingLocation ? "create_new" : location} onValueChange={handleLocationChange}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                  <Separator className="my-2" />
                  <SelectItem value="create_new" className="font-medium text-primary">
                    + Create new location
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCreatingLocation && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="new-location">New Location Name</Label>
                <Input
                  id="new-location"
                  placeholder="e.g. Main Hall, Room 303"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {location === "online" && (
              <div className="space-y-2">
                <Label htmlFor="online-link">Online Meeting Link</Label>
                <Input
                  id="online-link"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={onlineLink}
                  onChange={(e) => setOnlineLink(e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg">Capacity</h3>

            <div className="space-y-2">
              <Label htmlFor="capacity">Maximum Participants</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                disabled={unlimitedCapacity}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="unlimited"
                checked={unlimitedCapacity}
                onCheckedChange={(checked: boolean) => setUnlimitedCapacity(checked)}
              />
              <Label
                htmlFor="unlimited"
                className="text-sm cursor-pointer"
              >
                Unlimited capacity (for special events)
              </Label>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-price">Base Price (DKK)</Label>
                <Input
                  id="base-price"
                  type="number"
                  value={basePrice}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled from service type
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="override-price">Override Price (optional)</Label>
                <Input
                  id="override-price"
                  type="number"
                  placeholder="Leave empty to use base price"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-4">
            <h3 className="text-lg">Additional Options</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked: boolean) => setIsRecurring(checked)}
                />
                <Label htmlFor="recurring" className="text-sm cursor-pointer">
                  Recurring session (repeat weekly)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={(checked: boolean) => setIsPrivate(checked)}
                />
                <Label htmlFor="private" className="text-sm cursor-pointer">
                  Private/Hidden (not visible in public calendar)
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateSession}>
            Create Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
