import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Loader2, ArrowLeft, Calendar, MapPin, CheckCircle2, CreditCard, Clock, User } from "lucide-react";
import { programsAPI, bookingsAPI } from "../utils/api";
import { supabase } from "../utils/supabase/client";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../hooks/useAuth";
import { AuthPage } from "./AuthPage";

interface ProgramCheckoutProps {
    programId: string | null;
    onBack: () => void;
}

export function ProgramCheckout({ programId, onBack }: ProgramCheckoutProps) {
    const { convertAndFormat, formatFixedPrice } = useCurrency();
    const { user, getAccessToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [program, setProgram] = useState<any>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [step, setStep] = useState<"details" | "confirmation">("details");

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
        cardNumber: "",
        expiry: "",
        cvc: "",
    });

    useEffect(() => {
        if (programId) {
            loadProgram(programId);
        }
    }, [programId]);

    // Handle return from Stripe
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("success") === "true") {
            setStep("confirmation");
            toast.success("Payment successful! You are booked.");
        }
        if (params.get("canceled") === "true") {
            toast.error("Payment was cancelled.");
        }
    }, []);

    // Pre-fill user data if logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.user_metadata?.full_name || user.user_metadata?.name || "",
                email: user.email || "",
            }));
        }
    }, [user]);

    const loadProgram = async (id: string) => {
        setLoading(true);
        try {
            const data = await programsAPI.getById(id);
            setProgram(data);
        } catch (error) {
            console.error("Error loading program:", error);
            toast.error("Failed to load program details");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!program) return;

        setSubmitting(true);
        try {
            // 1. Create Booking in Pending Status
            const bookingData = {
                serviceId: program.id,
                serviceName: program.name,
                serviceDescription: program.description,
                teamMemberId: program.instructor_id,
                date: program.start_date ? `${program.start_date}T09:00:00` : new Date().toISOString(),
                time: "09:00",
                clientName: formData.name,
                clientEmail: formData.email,
                clientPhone: formData.phone,
                notes: formData.notes,
                price: program.price || 0,
                currency: program.currency || 'EUR',
                status: 'pending',
            };

            const booking: any = await bookingsAPI.create(bookingData);

            // 2. Create Stripe Checkout Session
            // Use fixed price if available for the currency, otherwise base price
            // Warning: frontend validation logic should match backend/program logic
            const finalPrice = program.fixed_prices?.[program.currency] || program.price || 0;

            const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
                body: {
                    price: finalPrice,
                    currency: program.currency || 'EUR',
                    description: `Booking: ${program.name}`,
                    booking_id: booking.id,
                    return_url: window.location.href, // Returns to this page
                    customer_email: formData.email,
                }
            });

            if (checkoutError) {
                console.error("Stripe Checkout Error:", checkoutError);
                throw new Error("Failed to initialize payment");
            }

            if (checkoutData?.url) {
                // Redirect to Stripe
                window.location.href = checkoutData.url;
            } else {
                throw new Error("No checkout URL returned from payment server");
            }

        } catch (error) {
            console.error("Error submitting booking:", error);
            toast.error("Failed to submit booking. please try again.");
            setSubmitting(false); // Only stop loading if error, otherwise we are redirecting
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-background p-12 flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-semibold">Program not found</h2>
                <Button onClick={onBack}>Back to Calendar</Button>
            </div>
        );
    }

    if (showAuth) {
        return (
            <div className="min-h-screen bg-background relative">
                <Button
                    variant="ghost"
                    className="absolute top-4 left-4 z-50"
                    onClick={() => setShowAuth(false)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Booking
                </Button>
                <AuthPage />
            </div>
        );
    }

    if (step === "confirmation") {
        return (
            <div className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                            <p className="text-muted-foreground">
                                Thank you for booking <strong>{program.name}</strong>.
                                We have sent a confirmation email to {formData.email}.
                            </p>
                        </div>
                        <Button className="w-full" onClick={onBack}>
                            Return to Calendar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <Button variant="ghost" onClick={onBack} className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Calendar
                    </Button>
                    <h1>Book Your Program</h1>
                    <p className="text-muted-foreground">
                        Complete your registration for this transformative experience
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Your Information</CardTitle>
                                <CardDescription>
                                    Enter your details to register
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!user && (
                                    <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between mb-4">
                                        <span className="text-sm">Already have an account?</span>
                                        <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
                                            Log In
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Special Requests (Optional)</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Dietary requirements, accessibility needs, etc."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Payment Details</CardTitle>
                                <CardDescription>
                                    Secure payment processing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <div className="relative">
                                        <Input
                                            id="cardNumber"
                                            placeholder="1234 5678 9012 3456"
                                            value={formData.cardNumber}
                                            onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                                        />
                                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry">Expiry Date</Label>
                                        <Input
                                            id="expiry"
                                            placeholder="MM/YY"
                                            value={formData.expiry}
                                            onChange={(e) => handleInputChange("expiry", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvc">CVC</Label>
                                        <Input
                                            id="cvc"
                                            placeholder="123"
                                            value={formData.cvc}
                                            onChange={(e) => handleInputChange("cvc", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={submitting || !formData.name || !formData.email}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `Pay ${formatFixedPrice(program.fixed_prices || program.fixedPrices, program.price || 0, program.currency || "EUR")}`
                            )}
                        </Button>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <Card className="bg-muted/30 border-muted">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">{program.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {program.start_date ? format(new Date(program.start_date), 'PPP') : 'Date TBD'}
                                                {program.end_date && ` - ${format(new Date(program.end_date), 'PPP')}`}
                                            </span>
                                        </div>
                                        {program.location && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>{typeof program.location === 'object' ? program.location.name : program.location}</span>
                                            </div>
                                        )}

                                        {program.instructor && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                <span>{typeof program.instructor === 'object' ? program.instructor.full_name : 'Instructor'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Description</div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {program.description}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span>{convertAndFormat(program.price || 0, program.currency || "EUR")}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 mt-0.5" />
                                    <span>Free cancellation up to 30 days before start</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 mt-0.5" />
                                    <span>Secure payment processing</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 mt-0.5" />
                                    <span>Instant confirmation email</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
