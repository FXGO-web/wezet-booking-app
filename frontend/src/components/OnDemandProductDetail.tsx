import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CurrencySelector } from "./CurrencySelector";
import {
  Play,
  Clock,
  Video,
  Download,
  CheckCircle2,
  Star,
  Users,
  Calendar,
  Share2,
} from "lucide-react";

const whatsIncluded = [
  "8 comprehensive video modules (6+ hours)",
  "Downloadable practice guides (PDF)",
  "Audio-only versions for on-the-go",
  "Private community access",
  "Monthly live Q&A sessions",
  "Certificate of completion",
  "Lifetime access to all content",
  "Future updates included",
];

const curriculum = [
  {
    title: "Module 1: Foundations",
    duration: "45 min",
    lessons: 5,
  },
  {
    title: "Module 2: Breathing Patterns",
    duration: "60 min",
    lessons: 6,
  },
  {
    title: "Module 3: Energy Activation",
    duration: "50 min",
    lessons: 5,
  },
  {
    title: "Module 4: Emotional Release",
    duration: "55 min",
    lessons: 6,
  },
  {
    title: "Module 5: Advanced Techniques",
    duration: "70 min",
    lessons: 7,
  },
  {
    title: "Module 6: Facilitation Skills",
    duration: "65 min",
    lessons: 6,
  },
  {
    title: "Module 7: Integration Practices",
    duration: "40 min",
    lessons: 4,
  },
  {
    title: "Module 8: Leading Sessions",
    duration: "50 min",
    lessons: 5,
  },
];

export function OnDemandProductDetail() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Info */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Video className="h-3 w-3 mr-1" />
                  Online Course
                </Badge>
                <h1 className="text-3xl md:text-4xl">
                  Breathwork Facilitator Training
                </h1>
                <p className="text-lg text-muted-foreground">
                  Complete certification program to become a confident and
                  skilled breathwork facilitator
                </p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>6+ hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span>8 modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>487 enrolled</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary"
                    />
                  ))}
                </div>
                <span className="text-sm">4.9 (124 reviews)</span>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl">3,500</h2>
                  <span className="text-lg text-muted-foreground">DKK</span>
                </div>
                <CurrencySelector />
              </div>

              <div className="flex gap-3">
                <Button size="lg" className="flex-1 h-14">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Purchase & Access
                </Button>
                <Button size="lg" variant="outline" className="h-14">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                30-day money-back guarantee • Instant access • Lifetime updates
              </p>
            </div>

            {/* Right: Preview */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 flex items-center justify-center">
                <Button size="lg" className="h-20 w-20 rounded-full">
                  <Play className="h-8 w-8 ml-1" />
                </Button>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/60 backdrop-blur">
                    Preview Available
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn */}
            <div className="space-y-6">
              <h2>What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Master fundamental breathwork techniques",
                  "Understand the nervous system and breath connection",
                  "Learn to guide safe and effective sessions",
                  "Develop your unique facilitation style",
                  "Create powerful transformational experiences",
                  "Build confidence as a facilitator",
                  "Handle challenging moments in sessions",
                  "Integrate breathwork with other modalities",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Course Content */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2>Course Content</h2>
                <span className="text-sm text-muted-foreground">
                  8 modules • 44 lessons • 6h 15m
                </span>
              </div>
              <div className="space-y-3">
                {curriculum.map((module, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4>{module.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons} lessons • {module.duration}
                          </p>
                        </div>
                        <Badge variant="secondary">{index + 1}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-4">
              <h2>About This Course</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  This comprehensive training program is designed for anyone
                  wanting to facilitate breathwork sessions professionally or
                  integrate conscious breathing into their existing practice.
                </p>
                <p>
                  Over 8 detailed modules, you'll learn everything from
                  foundational breathing patterns to advanced facilitation
                  skills. Each module combines theory, practical exercises, and
                  real-world application to ensure you gain both knowledge and
                  confidence.
                </p>
                <p>
                  Whether you're starting your journey as a facilitator or
                  looking to deepen your existing practice, this course provides
                  the comprehensive foundation you need to guide safe,
                  effective, and transformational breathwork experiences.
                </p>
              </div>
            </div>

            <Separator />

            {/* Teacher Bio */}
            <div className="space-y-6">
              <h2>Your Instructor</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        HML
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3>Hanna Maria Lynggaard</h3>
                        <p className="text-sm text-muted-foreground">
                          Founder & CEO WEZET
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Hanna has trained over 500 breathwork facilitators
                        worldwide and brings 12+ years of experience in
                        transformational practices. Her approach combines
                        ancient wisdom with modern neuroscience, creating a
                        comprehensive and accessible methodology.
                      </p>
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>500+ students</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary fill-primary" />
                          <span>4.9 rating</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Full Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3>What's Included</h3>
                </div>
                <Separator />
                <div className="space-y-3">
                  {whatsIncluded.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Self-paced learning</p>
                      <p className="text-muted-foreground">
                        Access anytime, anywhere
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Downloadable resources</p>
                      <p className="text-muted-foreground">
                        Guides, templates & audio
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Certificate included</p>
                      <p className="text-muted-foreground">
                        Upon course completion
                      </p>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="w-full">
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
