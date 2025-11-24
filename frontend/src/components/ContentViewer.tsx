import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  Download,
  Share2,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface ContentViewerProps {
  contentType?: "video" | "audio" | "pdf";
}

const relatedContent = [
  {
    id: "1",
    title: "Advanced Breathwork Series",
    type: "video",
    duration: "90 min",
    thumbnail: "advanced",
  },
  {
    id: "2",
    title: "Morning Energy Boost",
    type: "audio",
    duration: "15 min",
    thumbnail: "morning",
  },
  {
    id: "3",
    title: "Evening Wind Down",
    type: "audio",
    duration: "20 min",
    thumbnail: "evening",
  },
  {
    id: "4",
    title: "Breathwork Fundamentals Guide",
    type: "pdf",
    duration: "24 pages",
    thumbnail: "guide",
  },
];

export function ContentViewer({ contentType = "video" }: ContentViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(42);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Back Button */}
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Library
            </Button>

            {/* Video/Audio Player */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center">
                {contentType === "pdf" ? (
                  <div className="absolute inset-0 bg-white p-8 overflow-y-auto">
                    <div className="max-w-3xl mx-auto space-y-4">
                      <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <h2>Introduction to Conscious Breathwork</h2>
                      </div>
                      <Separator />
                      <div className="space-y-4 text-sm">
                        <p>
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Sed do eiusmod tempor incididunt ut labore et
                          dolore magna aliqua. Ut enim ad minim veniam, quis
                          nostrud exercitation ullamco laboris.
                        </p>
                        <p>
                          Duis aute irure dolor in reprehenderit in voluptate
                          velit esse cillum dolore eu fugiat nulla pariatur.
                          Excepteur sint occaecat cupidatat non proident, sunt
                          in culpa qui officia deserunt mollit anim id est
                          laborum.
                        </p>
                        <h3>Key Techniques</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                          <li>Conscious breathing patterns</li>
                          <li>Breath retention techniques</li>
                          <li>Energy activation methods</li>
                          <li>Integration practices</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="h-20 w-20 rounded-full"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8 ml-1" />
                      )}
                    </Button>

                    {/* Player Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 space-y-3">
                      <Progress
                        value={progress}
                        className="h-1 cursor-pointer hover:h-2 transition-all"
                      />
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 ml-0.5" />
                            )}
                          </Button>
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            <div className="w-24 h-1 bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full w-3/4 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-sm">12:45 / 30:00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                          >
                            <Maximize className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Content Info */}
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl">
                      Introduction to Conscious Breathwork
                    </h1>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Clock className="h-3 w-3 mr-1" />
                      45 min
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Learn the fundamentals of conscious breathing and discover
                    how to transform your nervous system, emotional state, and
                    overall wellbeing through powerful breathwork practices.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {contentType === "pdf" && (
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {contentType !== "pdf" && (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Your Progress</span>
                      </div>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Continue where you left off
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              <div className="space-y-3">
                <h3>Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Breathwork",
                    "Beginner Friendly",
                    "Nervous System",
                    "Stress Relief",
                    "Energy Work",
                  ].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-primary/5 border-primary/20 text-primary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Teacher Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <h3>Taught by</h3>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          HML
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h4>Hanna Maria Lynggaard</h4>
                          <p className="text-sm text-muted-foreground">
                            Founder & CEO WEZET
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Hanna is a certified breathwork facilitator and
                          transformational coach with over 10 years of
                          experience guiding thousands through conscious
                          breathing practices.
                        </p>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What's Included */}
              <div className="space-y-4">
                <h3>What's Included</h3>
                <div className="grid gap-3">
                  {[
                    "45-minute guided video session",
                    "Downloadable practice guide (PDF)",
                    "Integration exercises",
                    "Lifetime access to content",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Related Content */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3>Purchase Status</h3>
                  <Badge className="bg-green-500">Included</Badge>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    This content is included in your subscription
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3>Related Content</h3>
              <div className="space-y-3">
                {relatedContent.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="relative h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 flex items-center justify-center">
                          <Play className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-sm line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
