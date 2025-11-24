import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CurrencySelector } from "./CurrencySelector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  MapPin,
  Calendar,
  Users,
  Coffee,
  Home,
  Utensils,
  Wind,
  Sparkles,
  CheckCircle2,
  Info,
} from "lucide-react";

const schedule = [
  {
    day: "Day 1 - Arrival & Opening",
    activities: [
      { time: "14:00", title: "Check-in & Welcome Tea", icon: Coffee },
      { time: "16:00", title: "Opening Circle", icon: Users },
      { time: "17:30", title: "Gentle Breathwork Session", icon: Wind },
      { time: "19:00", title: "Dinner", icon: Utensils },
      { time: "20:30", title: "Evening Integration", icon: Sparkles },
    ],
  },
  {
    day: "Day 2 - Deep Dive",
    activities: [
      { time: "07:00", title: "Morning Movement", icon: Wind },
      { time: "08:30", title: "Breakfast", icon: Utensils },
      { time: "10:00", title: "Breathwork Journey", icon: Wind },
      { time: "13:00", title: "Lunch & Rest", icon: Utensils },
      { time: "16:00", title: "Bodywork Session", icon: Sparkles },
      { time: "19:00", title: "Dinner", icon: Utensils },
      { time: "20:30", title: "Sound Bath", icon: Sparkles },
    ],
  },
  {
    day: "Day 3 - Integration",
    activities: [
      { time: "07:00", title: "Sunrise Breathwork", icon: Wind },
      { time: "08:30", title: "Breakfast", icon: Utensils },
      { time: "10:00", title: "Integration Workshop", icon: Users },
      { time: "13:00", title: "Closing Lunch", icon: Utensils },
      { time: "15:00", title: "Closing Circle & Departure", icon: Users },
    ],
  },
];

const faqs = [
  {
    question: "What experience level is required?",
    answer:
      "This retreat is suitable for all levels, from complete beginners to experienced practitioners. Our facilitators will guide you through each practice with care and attention.",
  },
  {
    question: "What should I bring?",
    answer:
      "Comfortable clothing for movement and breathwork, a water bottle, journal, and any personal items you need. Yoga mats and props are provided.",
  },
  {
    question: "What's the accommodation like?",
    answer:
      "Beautiful shared and private rooms in a peaceful retreat center, all with ensuite bathrooms and views of nature. Bedding and towels included.",
  },
  {
    question: "What food is provided?",
    answer:
      "All meals are included - healthy, organic, vegetarian cuisine prepared with love. We can accommodate dietary restrictions with advance notice.",
  },
  {
    question: "What's the cancellation policy?",
    answer:
      "Full refund if cancelled 60+ days before. 50% refund 30-59 days before. No refund within 30 days, but you can transfer to a future retreat.",
  },
];

const included = [
  "2 nights accommodation (shared or private room options)",
  "All meals - breakfast, lunch, dinner & snacks",
  "6 guided breathwork sessions",
  "Bodywork & somatic practices",
  "Sound healing ceremony",
  "Integration workshops",
  "All materials and props",
  "Welcome gift bag",
];

const teachers = [
  {
    name: "Hanna Maria Lynggaard",
    role: "Lead Facilitator",
    initials: "HML",
  },
  {
    name: "Saszeline Emmanuellee",
    role: "Bodywork Specialist",
    initials: "SE",
  },
  {
    name: "Paco Hurricane",
    role: "Movement Guide",
    initials: "PH",
  },
];

import { useCurrency } from "../context/CurrencyContext";

export function RetreatDetail() {
  const { convertAndFormat } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-[60vh] bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 w-full">
          <div className="space-y-4 text-white">
            <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
              <Calendar className="h-3 w-3 mr-1" />
              3-Day Retreat
            </Badge>
            <h1 className="text-4xl md:text-5xl">
              Breathwork & Transformation Retreat
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Jan 15-17, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Vejle, Denmark</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Max 16 participants</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview */}
            <div className="space-y-4">
              <h2>About This Retreat</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Join us for a transformational 3-day journey into the power of
                  conscious breathing. This immersive retreat combines powerful
                  breathwork sessions with bodywork, movement, and deep
                  integration practices in a beautiful natural setting.
                </p>
                <p>
                  Away from daily distractions, you'll have space to release
                  what no longer serves you, connect with your authentic self,
                  and cultivate practices that support lasting transformation.
                </p>
                <p>
                  Whether you're new to breathwork or deepening an existing
                  practice, this retreat offers a safe, supportive container for
                  profound personal growth and healing.
                </p>
              </div>
            </div>

            <Separator />

            {/* What's Included */}
            <div className="space-y-6">
              <h2>What's Included</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {included.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-6">
              <h2>Schedule Overview</h2>
              <div className="space-y-4">
                {schedule.map((day, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h3 className="mb-4">{day.day}</h3>
                      <div className="space-y-3">
                        {day.activities.map((activity, actIndex) => {
                          const Icon = activity.icon;
                          return (
                            <div
                              key={actIndex}
                              className="flex items-center gap-4 py-2"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {activity.title}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="flex-shrink-0">
                                {activity.time}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                Schedule may be adjusted based on weather and group needs
              </p>
            </div>

            <Separator />

            {/* Teachers */}
            <div className="space-y-6">
              <h2>Your Teachers</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {teachers.map((teacher, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {teacher.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4>{teacher.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {teacher.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* FAQ */}
            <div className="space-y-6">
              <h2>Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border rounded-xl px-6 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <Separator />

            {/* Cancellation Policy */}
            <div className="space-y-4">
              <h2>Cancellation Policy</h2>
              <Card className="bg-muted/50">
                <CardContent className="p-6 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">60+ days before</p>
                      <p className="text-muted-foreground">
                        Full refund minus processing fee
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">30-59 days before</p>
                      <p className="text-muted-foreground">50% refund</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Less than 30 days</p>
                      <p className="text-muted-foreground">
                        No refund, but transferable to future retreat
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Price per person
                    </p>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-3xl">{convertAndFormat(5800, 'DKK')}</h2>
                    </div>
                  </div>
                  <CurrencySelector />
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Accommodation
                    </span>
                    <Badge variant="secondary">
                      <Home className="h-3 w-3 mr-1" />
                      Shared/Private
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Availability</span>
                    <Badge className="bg-green-500">7 spots left</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dates</span>
                    <span>Jan 15-17, 2026</span>
                  </div>
                </div>

                <Button size="lg" className="w-full h-14">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Book Your Spot
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure your spot with a 50% deposit
                </p>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm">Questions?</h4>
                  <Button variant="outline" className="w-full">
                    Contact Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
