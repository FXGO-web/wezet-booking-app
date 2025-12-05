import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { CalendarDays, Loader2, Trash2, MapPin } from "lucide-react";
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

import { sessionsAPI as servicesAPI, teamMembersAPI, locationsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: any;
}

const categories = [
  "Breathwork",
  "Bodywork",
  "Coaching",
  "Education",
  "Retreats",
  "Meditation",
  "Yoga",
  "Sound Healing",
];

const allowedCurrencies = ["EUR", "DKK"];
const allowedStatus = ["active", "inactive"];

const sanitizeCurrency = (value?: string) =>
  allowedCurrencies.includes(value || "") ? value! : "EUR";

const sanitizeStatus = (value?: string) =>
  allowedStatus.includes(value || "") ? value! : "active";

const sanitizeCategory = (value?: string) =>
  value && categories.includes(value) ? value : "Breathwork";

export function ServiceModal({ isOpen, onClose, onSuccess, service }: ServiceModalProps) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    duration: service?.duration || service?.duration_minutes || 60,
    price: service?.price || 0,
    currency: sanitizeCurrency(service?.currency),
    fixedPrices: service?.fixed_prices || service?.fixedPrices || { EUR: service?.price || 0, DKK: 0 },
    category: sanitizeCategory(service?.category),
    status: sanitizeStatus(service?.status),
    teamMemberId:
      service?.teamMemberId ||
      service?.instructor_id ||
      service?.owner_id ||
      service?.ownerId ||
      service?.created_by ||
      "none",
    locationId: service?.locationId || service?.location_id || "none",
  });

  // Sync when service prop changes
  useEffect(() => {
    setFormData({
      name: service?.name || "",
      description: service?.description || "",
      duration: service?.duration || service?.duration_minutes || 60,
      price: service?.price || 0,
      currency: sanitizeCurrency(service?.currency),
      fixedPrices: service?.fixed_prices || service?.fixedPrices || { EUR: service?.price || 0, DKK: 0 },
      category: sanitizeCategory(service?.category),
      status: sanitizeStatus(service?.status),
      teamMemberId:
        service?.teamMemberId ||
        service?.instructor_id ||
        service?.owner_id ||
        service?.ownerId ||
        service?.created_by ||
        "none",
      locationId: service?.locationId || service?.location_id || "none",
    });
  }, [service]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getAccessToken();
        const [{ teamMembers: members }, { locations: locs }] = await Promise.all([
          teamMembersAPI.getAll({ status: "active" }),
          locationsAPI.getAll()
        ]);

        console.log("ServiceModal: Raw team members:", members);

        // Filter for team roles only
        const teamRoles = ['admin', 'instructor', 'teacher', 'facilitator', 'team member', 'founder & ceo wezet', 'coach'];
        const filteredMembers = (members || []).filter((m: any) =>
          m.role && teamRoles.includes(m.role.toLowerCase())
        );

        console.log("ServiceModal: Filtered members:", filteredMembers);

        setTeamMembers(filteredMembers);
        setLocations(locs || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setTeamMembers([]);
        setLocations([]);
      }
    };
    loadData();
  }, [getAccessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        alert("Please log in to continue");
        return;
      }

      if (!formData.name || !formData.category || !formData.currency) {
        alert("Please fill in all required fields.");
        setLoading(false);
        return;
      }

      if (
        formData.fixedPrices?.EUR === undefined ||
        formData.fixedPrices?.EUR === null ||
        Number.isNaN(Number(formData.fixedPrices?.EUR))
      ) {
        alert("Please set a valid EUR price (0 for free).");
        setLoading(false);
        return;
      }

      if (!formData.duration || Number(formData.duration) <= 0) {
        alert("Please set a duration greater than 0.");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        teamMemberId:
          formData.teamMemberId && formData.teamMemberId !== "none"
            ? formData.teamMemberId
            : undefined,
        locationId:
          formData.locationId && formData.locationId !== "none"
            ? formData.locationId
            : undefined,
      };

      if (service) {
        await servicesAPI.update(service.id, payload, accessToken);
      } else {
        await servicesAPI.create(payload, accessToken);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !service ||
      !window.confirm("Are you sure you want to delete this service? This action cannot be undone.")
    ) {
      return;
    }

    setLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      await servicesAPI.delete(service.id, accessToken);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Session" : "Create New Session"}</DialogTitle>
          <DialogDescription>
            {service
              ? "Update session information and pricing"
              : "Add a new session to your WEZET platform"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Session Name *</Label>
                {service && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => {
                      const origin = window.location.origin;
                      window.location.href = `${origin}/?view=availability-management&serviceId=${service.id}&tab=specific`;
                    }}
                  >
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Manage Availability
                  </Button>
                )}
              </div>

              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Transformational Breathwork"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A powerful session to release stress and connect with your breath..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign to team member</Label>
                <Select
                  value={formData.teamMemberId}
                  onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific location</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                  }
                  placeholder="60"
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceEur">Price (EUR) *</Label>
                <Input
                  id="priceEur"
                  type="number"
                  value={formData.fixedPrices?.EUR ?? formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fixedPrices: { ...(formData.fixedPrices || {}), EUR: parseFloat(e.target.value) || 0 }
                    })
                  }
                  placeholder="100"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceDkk">Price (DKK) *</Label>
                <Input
                  id="priceDkk"
                  type="number"
                  value={formData.fixedPrices?.DKK ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fixedPrices: { ...(formData.fixedPrices || {}), DKK: parseFloat(e.target.value) || 0 }
                    })
                  }
                  placeholder="750"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || ""}
                  onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            {service && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{service ? "Update" : "Create"} Service</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}