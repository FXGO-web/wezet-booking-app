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
import { X, Loader2 } from "lucide-react";
import { teamMembersAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member?: any;
}

const availableSpecialties = [
  "Breathwork",
  "Meditation",
  "Bodywork",
  "Coaching",
  "Energy Healing",
  "Somatic Therapy",
  "Yoga",
  "Sound Healing",
];

export function TeamMemberModal({ isOpen, onClose, onSuccess, member }: TeamMemberModalProps) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
    bio: string;
    specialties: string[];
    status: string;
    password?: string;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "Teacher",
    bio: "",
    specialties: [],
    status: "active",
    password: "",
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || member.full_name || "",
        email: member.email || "",
        phone: member.phone || "",
        role: member.role || "Teacher",
        bio: member.bio || "",
        specialties: member.specialties || [],
        status: member.status || "active",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "Teacher",
        bio: "",
        specialties: [],
        status: "active",
        password: "",
      });
    }
  }, [member, isOpen]);

  const handleAddSpecialty = (specialty: string) => {
    if (!formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((s) => s !== specialty),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        alert("Please log in to continue");
        return;
      }

      if (member) {
        // Update existing member
        await teamMembersAPI.update(member.id, formData);
      } else {
        // Create new member
        await teamMembersAPI.create(formData);
      }

      onSuccess();
      onClose();
      toast.success(member ? "Team member updated successfully" : "Team member created successfully");
    } catch (error) {
      console.error("Error saving team member:", error);
      alert("Failed to save team member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member (Verified)" : "Add New Team Member"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Update team member information and specialties"
              : "Fill in the details to add a new team member to your WEZET platform"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sarah Chen"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sarah@wezet.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Field - Only for new members */}
          {/* Password Field */}
          {(showPassword || !member) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password {member ? "(New)" : "*"}</Label>
                {member && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={member ? "Enter new password to change" : "Secret password"}
                required={!member}
              />
            </div>
          )}

          {member && !showPassword && (
            <div className="space-y-2">
              <Label>Password</Label>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPassword(true);
                    setFormData({ ...formData, password: "" });
                  }}
                >
                  Reset Password
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Facilitator">Facilitator</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Subscriber">Subscriber</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about this team member..."
              rows={4}
            />
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <Label>Specialties</Label>
            <Select onValueChange={handleAddSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Add specialty..." />
              </SelectTrigger>
              <SelectContent>
                {availableSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="gap-1">
                    {specialty}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                <>{member ? "Update" : "Create"} Team Member</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
