import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { servicesAPI } from "../utils/api";
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

export function ServiceModal({ isOpen, onClose, onSuccess, service }: ServiceModalProps) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    duration: service?.duration || 60,
    price: service?.price || 0,
    currency: service?.currency || "USD",
    category: service?.category || "Breathwork",
    status: service?.status || "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        alert("Please log in to continue");
        return;
      }

      if (service) {
        await servicesAPI.update(service.id, formData, accessToken);
      } else {
        await servicesAPI.create(formData, accessToken);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Create New Service"}</DialogTitle>
          <DialogDescription>
            {service
              ? "Update service information and pricing"
              : "Add a new service to your WEZET platform"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Transformational Breathwork"
                required
              />
            </div>

            {/* Description */}
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

            {/* Duration, Price, Currency */}
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
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="150"
                  required
                  min="0"
                  step="0.01"
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
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
