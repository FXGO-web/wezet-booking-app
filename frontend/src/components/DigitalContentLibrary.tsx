import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Search,
  Video,
  Headphones,
  FileText,
  Play,
  BookOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  type: "video" | "audio" | "pdf" | "program";
  duration: string;
  description: string;
  thumbnail: string;
  tags: string[];
  progress?: number;
  completed?: boolean;
}

const contentItems: ContentItem[] = [
  {
    id: "1",
    title: "Introduction to Conscious Breathwork",
    type: "video",
    duration: "45 min",
    description:
      "Learn the fundamentals of conscious breathing and how it can transform your life",
    thumbnail: "breathwork-intro",
    tags: ["breathwork", "beginner", "fundamentals"],
    progress: 60,
  },
  {
    id: "2",
    title: "Deep Relaxation Guided Session",
    type: "audio",
    duration: "30 min",
    description: "A guided audio journey into deep relaxation and inner peace",
    thumbnail: "relaxation-audio",
    tags: ["relaxation", "meditation", "stress-relief"],
    completed: true,
  },
  {
    id: "3",
    title: "Somatic Release Techniques PDF",
    type: "pdf",
    duration: "12 pages",
    description:
      "Comprehensive guide to somatic bodywork and emotional release practices",
    thumbnail: "somatic-pdf",
    tags: ["somatic", "bodywork", "techniques"],
  },
  {
    id: "4",
    title: "21-Day Breathwork Journey",
    type: "program",
    duration: "21 days",
    description: "Complete transformation program with daily guided sessions",
    thumbnail: "21-day-program",
    tags: ["breathwork", "program", "transformation"],
    progress: 33,
  },
  {
    id: "5",
    title: "Emotional Release Through Movement",
    type: "video",
    duration: "60 min",
    description:
      "Learn how to release stored emotions through conscious movement",
    thumbnail: "emotional-movement",
    tags: ["movement", "emotional-release", "bodywork"],
  },
  {
    id: "6",
    title: "Morning Energy Activation",
    type: "audio",
    duration: "15 min",
    description: "Start your day with this energizing breathwork session",
    thumbnail: "morning-energy",
    tags: ["breathwork", "energy", "morning-routine"],
  },
  {
    id: "7",
    title: "Teacher Training Manual",
    type: "pdf",
    duration: "48 pages",
    description: "Complete guide for aspiring breathwork facilitators",
    thumbnail: "teacher-manual",
    tags: ["education", "teacher-training", "facilitation"],
  },
  {
    id: "8",
    title: "Advanced Breathwork Techniques",
    type: "video",
    duration: "90 min",
    description: "Deep dive into advanced breathing practices and patterns",
    thumbnail: "advanced-breathwork",
    tags: ["breathwork", "advanced", "techniques"],
    progress: 20,
  },
];

const filterTypes = [
  { value: "all", label: "All", icon: BookOpen },
  { value: "video", label: "Video", icon: Video },
  { value: "audio", label: "Audio", icon: Headphones },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "program", label: "Programs", icon: CheckCircle2 },
];

const tags = [
  "breathwork",
  "somatic",
  "emotional-release",
  "meditation",
  "movement",
  "beginner",
  "advanced",
  "teacher-training",
];

export function DigitalContentLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredContent = contentItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || item.type === activeFilter;
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => item.tags.includes(tag));

    return matchesSearch && matchesFilter && matchesTags;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "audio":
        return Headphones;
      case "pdf":
        return FileText;
      case "program":
        return CheckCircle2;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div>
          <h1>Digital Content Library</h1>
          <p className="text-muted-foreground mt-2">
            Access videos, audio sessions, and educational materials
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2">
          {filterTypes.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "outline"}
                onClick={() => setActiveFilter(filter.value)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Tag Filters */}
        <div className="space-y-3">
          <Label className="text-sm">Filter by Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
              >
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                  {item.completed && (
                    <div className="absolute top-3 right-3 z-20">
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base line-clamp-2">{item.title}</h3>
                      <Badge variant="secondary" className="flex-shrink-0">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {item.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{item.duration}</span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {item.progress !== undefined && !item.completed && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs bg-primary/5 border-primary/20 text-primary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredContent.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3>No content found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
