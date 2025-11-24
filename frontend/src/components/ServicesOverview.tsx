import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Wind,
  Heart,
  Users,
  BookOpen,
  Palmtree,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { CurrencySelector } from "./CurrencySelector";

const SERVICES = [
  {
    id: "breathwork",
    name: "Breathwork",
    icon: Wind,
    description: "Breathing techniques to reduce stress, regulate the nervous system, and improve wellbeing.",
    color: "text-[#0D7A7A]",
    bgColor: "bg-[#0D7A7A]/10",
    benefits: [
      "Reduce stress and anxiety",
      "Improve sleep",
      "Increase energy",
      "Emotional release",
      "Regulate the nervous system"
    ],
    sessionTypes: [
      { name: "Small Group (6 pax max)", price: 295, currency: "DKK", duration: "90 min" },
      { name: "Private Breathwork Session (1:1)", price: 1495, currency: "DKK", duration: "90 min" },
      { name: "Corporate Breathwork", price: "On request", duration: "Custom" },
      { name: "Cognitive Coaching + Breathwork", price: 1495, currency: "DKK", duration: "1.5h" }
    ]
  },
  {
    id: "bodywork",
    name: "Bodywork",
    icon: Heart,
    description: "Holistic treatment to release tension, improve mobility, and restore body balance.",
    color: "text-[#4ECDC4]",
    bgColor: "bg-[#4ECDC4]/10",
    benefits: [
      "Pain relief",
      "Stress reduction",
      "Tension release",
      "Mobility improvement",
      "Emotional & physical reset"
    ],
    sessionTypes: [
      {
        name: "Body SDS",
        description: "Danish body therapy combining massage, joint release, breathwork and dialogue",
        price: "On request"
      },
      {
        name: "Bio Integrative Osteopathy",
        description: "Integrates emotional and physical treatment of pain",
        price: "On request"
      }
    ]
  },
  {
    id: "coaching",
    name: "Coaching",
    icon: Users,
    description: "Personal, couples, youth, and corporate coaching to build clarity and emotional resilience.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    benefits: [
      "Clarity & decision-making",
      "Emotional resilience",
      "Relationship support",
      "Performance coaching"
    ],
    sessionTypes: [
      { name: "Individual Coaching", description: "Navigate life transitions, anxiety, goals", price: "On request" },
      { name: "Couples Coaching", description: "Improve connection, communication, intimacy", price: "On request" },
      { name: "Young Adults (18–29)", description: "Stress, direction, confidence, life skills", price: "On request" },
      { name: "Children & Family", description: "Emotional regulation, routines, mindful parenting", price: "On request" },
      { name: "Corporate & Group Coaching", description: "Team performance, leadership, wellbeing", price: "On request" }
    ]
  },
  {
    id: "education",
    name: "Education",
    icon: BookOpen,
    description: "Professional 200h Breathwork Certification combining online theory and retreats.",
    color: "text-[#E8DDD0]",
    bgColor: "bg-[#E8DDD0]/30",
    sessionTypes: [
      {
        name: "200h Breathwork Certification",
        description: "Comprehensive professional training with online theory and retreat components",
        price: "On request"
      }
    ]
  },
  {
    id: "retreats",
    name: "Retreats",
    icon: Palmtree,
    description: "7-day transformational retreat in Tarifa with breathwork, training, and holistic practices.",
    color: "text-[#0A5F5F]",
    bgColor: "bg-[#0A5F5F]/10",
    sessionTypes: [
      {
        name: "7-Day Transformational Retreat",
        description: "Tarifa, Spain · Breathwork, training, and holistic practices",
        price: "On request"
      }
    ]
  }
];

interface ServicesOverviewProps {
  onSelectService?: (serviceId: string) => void;
}

export function ServicesOverview({ onSelectService }: ServicesOverviewProps) {
  const { convertAndFormat } = useCurrency();

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h1>Our Services</h1>
          <p className="text-muted-foreground text-lg">
            Transformational breathwork, holistic bodywork, personal coaching, professional education, and immersive retreats
          </p>
          <div className="flex justify-center pt-2">
            <CurrencySelector />
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.slice(0, 3).map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="group hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                onClick={() => onSelectService?.(service.id)}
              >
                <CardHeader>
                  <div className={`h-14 w-14 rounded-xl ${service.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-7 w-7 ${service.color}`} />
                  </div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                    Explore {service.name}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {SERVICES.slice(3).map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="group hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                onClick={() => onSelectService?.(service.id)}
              >
                <CardHeader>
                  <div className={`h-14 w-14 rounded-xl ${service.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-7 w-7 ${service.color}`} />
                  </div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                    Explore {service.name}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Service Sections */}
        <div className="space-y-16 mt-20">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.id} className="space-y-6" id={service.id}>
                {/* Service Header */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className={`h-12 w-12 rounded-xl ${service.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <div className="flex-1">
                    <h2>{service.name}</h2>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                </div>

                {/* Benefits & Session Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Benefits Column */}
                  {service.benefits && (
                    <Card className="lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-base">Benefits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {service.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Session Types Column */}
                  <div className={`${service.benefits ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
                    {service.sessionTypes.map((session, idx) => (
                      <Card key={idx} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="text-base">{session.name}</h3>
                                {session.price && (
                                  <Badge variant="secondary" className="flex-shrink-0">
                                    {typeof session.price === 'number'
                                      ? convertAndFormat(session.price, session.currency)
                                      : session.price}
                                  </Badge>
                                )}
                              </div>
                              {session.description && (
                                <p className="text-sm text-muted-foreground">
                                  {session.description}
                                </p>
                              )}
                              {session.duration && (
                                <p className="text-xs text-muted-foreground">
                                  Duration: {session.duration}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => onSelectService?.(service.id)}
                            >
                              Book
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 mt-20">
          <CardContent className="p-12 text-center space-y-6">
            <div className="space-y-2">
              <h2>Ready to Begin?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose the service that resonates with your journey and book your session
              </p>
            </div>
            <Button size="lg" onClick={() => onSelectService?.("breathwork")}>
              Book Your First Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
