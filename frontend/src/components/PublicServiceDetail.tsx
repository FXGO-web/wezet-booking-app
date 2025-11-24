import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Calendar, Clock, MapPin, Users, Check, ArrowLeft, Sparkles } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

interface PublicServiceDetailProps {
    onBack: () => void;
    onBook: () => void;
}

export function PublicServiceDetail({ onBack, onBook }: PublicServiceDetailProps) {
    const { convertAndFormat } = useCurrency();

    // Mock data for demonstration
    const service = {
        name: "Transformational Breathwork",
        description: "A powerful journey into your subconscious through the power of breath. This session helps release trapped emotions, reduce stress, and gain clarity.",
        duration: 90,
        price: 150,
        currency: "EUR",
        category: "Wellness",
        location: "Studio A - Main Space",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
        benefits: [
            "Stress and anxiety reduction",
            "Emotional release and healing",
            "Deep relaxation and nervous system regulation",
            "Enhanced mental clarity and focus",
            "Connection to inner wisdom"
        ],
        team: [
            { name: "Sarah Chen", role: "Lead Facilitator", image: null, initials: "SC" },
            { name: "Marcus Rodriguez", role: "Breathwork Guide", image: null, initials: "MR" }
        ]
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 z-20">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-background/20 backdrop-blur-md border-white/20 text-white hover:bg-background/30"
                        onClick={onBack}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 bg-gradient-to-t from-background to-transparent">
                    <div className="max-w-7xl mx-auto space-y-4">
                        <Badge className="bg-primary/80 backdrop-blur-sm text-primary-foreground hover:bg-primary/90">
                            {service.category}
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                            {service.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                <span>{service.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                <span>{service.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <span>Group Session</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">About this Session</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {service.description}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">What to Expect</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {service.benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <span>{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">Your Guides</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {service.team.map((member, index) => (
                                    <Card key={index} className="border-none bg-muted/30">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {member.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{member.name}</div>
                                                <div className="text-sm text-muted-foreground">{member.role}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <Card className="border-primary/20 shadow-lg overflow-hidden">
                                <div className="h-2 bg-primary" />
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <div className="text-sm text-muted-foreground">Price per session</div>
                                        <div className="text-3xl font-bold">
                                            {convertAndFormat(service.price, service.currency)}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Duration</span>
                                            <span className="font-medium">{service.duration} min</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Location</span>
                                            <span className="font-medium text-right max-w-[150px] truncate">
                                                {service.location}
                                            </span>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 text-lg" onClick={onBook}>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Book Now
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">
                                        Free cancellation up to 24 hours before the session
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
