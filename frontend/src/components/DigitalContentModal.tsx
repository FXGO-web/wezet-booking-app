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
import { digitalContentAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

interface DigitalContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  content?: any;
}

const contentCategories = [
  "Breathwork",
  "Meditation",
  "Education",
  "Bodywork",
  "Programs",
  "Coaching",
  "Yoga",
  "Sound Healing",
];

export function DigitalContentModal({
  isOpen,
  onClose,
  onSuccess,
  content,
}: DigitalContentModalProps) {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: content?.title || "",
    type: content?.type || "video",
    category: content?.category || "Breathwork",
    description: content?.description || "",
    duration: content?.duration || "",
    url: content?.url || "",
    thumbnailUrl: content?.thumbnailUrl || "",
    status: content?.status || "draft",
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

      if (content) {
        await digitalContentAPI.update(content.id, formData, accessToken);
      } else {
        await digitalContentAPI.create(formData, accessToken);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving digital content:", error);
      alert("Failed to save content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content ? "Edit Content" : "Create New Content"}</DialogTitle>
          <DialogDescription>
            {content
              ? "Update digital content information"
              : "Add new digital content to your WEZET platform"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Content Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Introduction to Breathwork"
                required
              />
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Content Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="program">Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    {contentCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A comprehensive guide to breathwork fundamentals..."
                rows={4}
              />
            </div>

            {/* Duration and URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder={formData.type === "program" ? "30 days" : "15:30"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Content URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Thumbnail and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                />
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
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
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
                <>{content ? "Update" : "Create"} Content</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
