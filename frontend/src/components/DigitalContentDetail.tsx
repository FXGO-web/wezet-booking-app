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
import { Badge } from "./ui/badge";
import { Save, Trash2, Upload, Video } from "lucide-react";

export function DigitalContentDetail() {
  const [tags, setTags] = useState(["Breathwork", "Beginner", "Transformation"]);
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1>Digital Content Details</h1>
          <p className="text-muted-foreground">
            Edit content information, metadata, and access rules
          </p>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center">
              <Video className="h-16 w-16 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Breathwork"
                defaultValue="Introduction to Breathwork"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the content and what viewers will learn..."
                defaultValue="A comprehensive introduction to breathwork techniques for beginners. Learn the fundamentals of conscious breathing and its transformative effects on mind and body."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select defaultValue="video">
                  <SelectTrigger id="contentType">
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
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 15:30 or 30 min"
                  defaultValue="15:30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <p>Current file: <span className="text-muted-foreground">breathwork-intro.mp4</span></p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click to upload or drag and drop
                </p>
              </div>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Replace File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teacher/Author */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher / Author</CardTitle>
          </CardHeader>
          <CardContent>
            <Select defaultValue="sarah">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sarah">Sarah Chen</SelectItem>
                <SelectItem value="marcus">Marcus Rodriguez</SelectItem>
                <SelectItem value="emma">Emma Wilson</SelectItem>
                <SelectItem value="lisa">Lisa Thompson</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Access Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Access Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="accessType">Access Type</Label>
              <Select defaultValue="free">
                <SelectTrigger id="accessType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium Only</SelectItem>
                  <SelectItem value="included">Included in Programs</SelectItem>
                  <SelectItem value="paid">One-Time Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Publication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select defaultValue="published">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
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
            Delete Content
          </Button>
        </div>
      </div>
    </div>
  );
}
