import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { CalendarIcon, Clock, MapPin, Users, DollarSign } from "lucide-react";

const serviceTypes = [
  "Breathwork - Individual",
  "Breathwork - Group",
  "Bodywork - Deep Tissue",
  "Bodywork - Somatic",
  "Coaching - Career",
  "Coaching - Personal",
  "Education - Workshop",
  "Education - Teacher Training",
];

const locations = [
  "WEZET Studio - Copenhagen",
  "WEZET Studio - Aarhus",
  "Online - Zoom",
  "Online - Google Meet",
  "Custom Location",
];

export function AdvancedCreateSessionModal() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    serviceType: "",
    startTime: "09:00",
    endTime: "10:00",
    capacity: "1",
    price: "",
    location: "",
    notes: "",
    visibility: true, // true = public, false = private
  });

  const handleCreate = () => {
    console.log("Creating session:", { ...formData, date });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Session</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Set up a new session with custom details and availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
            >
              <SelectTrigger id="service-type">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
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

          {/* Time Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">
                <Clock className="inline h-4 w-4 mr-1" />
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">
                <Clock className="inline h-4 w-4 mr-1" />
                End Time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">
              <Users className="inline h-4 w-4 mr-1" />
              Capacity
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              placeholder="Maximum number of participants"
            />
          </div>

          {/* Price Override */}
          <div className="space-y-2">
            <Label htmlFor="price">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Price Override (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="Leave empty for default price"
              />
              <Select defaultValue="DKK">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DKK">DKK</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              If left empty, the default service price will be used
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </Label>
            <Select
              value={formData.location}
              onValueChange={(value) =>
                setFormData({ ...formData, location: value })
              }
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any special notes or requirements for this session"
              rows={3}
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="visibility" className="cursor-pointer">
                Session Visibility
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.visibility
                  ? "Public - Visible in calendar"
                  : "Private - Only visible to you"}
              </p>
            </div>
            <Switch
              id="visibility"
              checked={formData.visibility}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, visibility: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}