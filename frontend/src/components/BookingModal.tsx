import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  UserCheck,
  CreditCard,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock4
} from "lucide-react";
import { bookingsAPI, sessionsAPI as servicesAPI, teamMembersAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  booking?: any;
}

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800",
  },
  pending: {
    label: "Pending",
    icon: Clock4,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 text-yellow-800",
  },
  canceled: {
    label: "Canceled",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-800",
  },
};

export function BookingModal({ isOpen, onClose, onSuccess, booking }: BookingModalProps) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientName: booking?.clientName || "",
    clientEmail: booking?.clientEmail || "",
    clientPhone: booking?.clientPhone || "",
    serviceId: booking?.serviceId || "",
    teamMemberId: booking?.teamMemberId || "",
    date: booking?.date || "",
    time: booking?.time || "",
    location: booking?.location || "",
    price: booking?.price || "",
    currency: booking?.currency || "USD",
    status: booking?.status || "pending",
    notes: booking?.notes || "",
  });

  // Sync formData with booking prop changes
  useEffect(() => {
    if (booking) {
      setFormData({
        clientName: booking.clientName || "",
        clientEmail: booking.clientEmail || "",
        clientPhone: booking.clientPhone || "",
        serviceId: booking.serviceId || "",
        teamMemberId: booking.teamMemberId || "",
        date: booking.date || "",
        time: booking.time || "",
        location: booking.location || "",
        price: booking.price || "",
        currency: booking.currency || "USD",
        status: booking.status || "pending",
        notes: booking.notes || "",
      });
    } else if (isOpen) {
      // Reset for new booking
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        serviceId: "",
        teamMemberId: "",
        date: "",
        time: "",
        location: "",
        price: "",
        currency: "USD",
        status: "pending",
        notes: "",
      });
    }
  }, [booking, isOpen]);

  // Fetch services and team members
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, teamRes] = await Promise.all([
          servicesAPI.getAll({}),
          teamMembersAPI.getAll({}),
        ]);
        setServices(servicesRes.services || []);
        setTeamMembers(teamRes.teamMembers || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Update price when service changes
  useEffect(() => {
    if (formData.serviceId && !booking) {
      const selectedService = services.find(s => s.id === formData.serviceId);
      if (selectedService) {
        setFormData(prev => ({
          ...prev,
          price: selectedService.price || "",
          currency: selectedService.currency || "USD",
        }));
      }
    }
  }, [formData.serviceId, services, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        alert("Please log in to continue");
        return;
      }

      // Format data for API
      const bookingData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
      };

      if (booking) {
        // Update existing booking
        await bookingsAPI.update(booking.id, bookingData);
      } else {
        // Create new booking
        await bookingsAPI.create(bookingData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;

    setLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        alert("Please log in to continue");
        return;
      }

      await bookingsAPI.update(booking.id, { status: newStatus });
      setFormData({ ...formData, status: newStatus });
      onSuccess();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update booking status.");
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = booking ? statusConfig[booking.status as keyof typeof statusConfig]?.icon : Clock4;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {booking ? "Booking Details" : "Create New Booking"}
              </DialogTitle>
              <DialogDescription>
                {booking
                  ? "View and manage booking information"
                  : "Schedule a new session booking"}
              </DialogDescription>
            </div>
            {booking && (
              <Badge
                variant="secondary"
                className={statusConfig[booking.status as keyof typeof statusConfig]?.bgColor}
              >
                {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                {statusConfig[booking.status as keyof typeof statusConfig]?.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <h3 className="font-medium text-foreground">Client Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="John Doe"
                  required
                  disabled={!!booking}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="john@example.com"
                  required
                  disabled={!!booking}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                disabled={!!booking}
              />
            </div>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <h3 className="font-medium text-foreground">Booking Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value: string) => setFormData({ ...formData, serviceId: value })}
                  disabled={!!booking}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamMember">Team Member *</Label>
                <Select
                  value={formData.teamMemberId}
                  onValueChange={(value: string) => setFormData({ ...formData, teamMemberId: value })}
                  disabled={!!booking}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Studio A, Online, etc."
                required
              />
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <h3 className="font-medium text-foreground">Payment Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status and Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-medium text-foreground">Additional Information</h3>
            </div>

            {booking && (
              <div className="space-y-2">
                <Label htmlFor="status">Booking Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) => handleStatusChange(value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any special notes or requirements..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {booking ? "Close" : "Cancel"}
            </Button>
            {!booking && (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
