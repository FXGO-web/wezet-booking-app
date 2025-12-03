import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  CreditCard,
  Lock,
  Sparkles,
  ArrowLeft,
  Loader2,
  MapPin
} from "lucide-react";
import { sessionsAPI as servicesAPI, teamMembersAPI, bookingsAPI } from "../utils/api";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { useAuth } from "../hooks/useAuth";
import { AuthPage } from "./AuthPage";
import { useCurrency } from "../context/CurrencyContext";

type BookingStep = 1 | 2 | 3;

interface BookingFlowProps {
  preselection?: {
    preselectedDate?: string;
    preselectedTime?: string;
    preselectedDateTime?: string;
    preselectedEndTime?: string;
    preselectedTeamMember?: string;
    preselectedService?: string;
    preselectedServiceName?: string;
    preselectedServiceDescription?: string;
    preselectedServicePrice?: number;
    preselectedCurrency?: string;
    preselectedDuration?: number;
  } | null;
}

export function BookingFlow({ preselection }: BookingFlowProps) {
  const { convertAndFormat } = useCurrency();
  const [currentStep, setCurrentStep] = useState<BookingStep>(preselection ? 2 : 1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, getAccessToken } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [allowDateChange, setAllowDateChange] = useState(!preselection);

  // Data from backend
  const [services, setServices] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [prefilledServiceInfo, setPrefilledServiceInfo] = useState<{
    id?: string;
    name?: string;
    description?: string;
    price?: number | null;
    currency?: string;
    duration?: number;
  } | null>(preselection
    ? {
      id: preselection.preselectedService,
      name: preselection.preselectedServiceName,
      description: preselection.preselectedServiceDescription,
      price: preselection.preselectedServicePrice ?? null,
      currency: preselection.preselectedCurrency,
      duration: preselection.preselectedDuration,
    }
    : null);

  // Selections
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

  // Created booking data
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselection?.preselectedService && !selectedService) {
      setSelectedService(preselection.preselectedService);
    }
  }, [preselection?.preselectedService, selectedService]);

  // Auto-advance after login
  useEffect(() => {
    if (user && showAuth) {
      setShowAuth(false);
      setCurrentStep(2);
    }
  }, [user, showAuth]);

  useEffect(() => {
    // If we have preselection data from calendar, apply it and skip to step 2
    if (preselection) {
      // Set preselected service
      if (preselection.preselectedService) {
        setSelectedService(preselection.preselectedService);
      } else if (!selectedService && services.length > 0) {
        // Auto-select first service if none selected
        setSelectedService(services[0].id);
      }

      // Set preselected team member
      if (preselection.preselectedTeamMember) {
        setSelectedTeamMember(preselection.preselectedTeamMember);
      }

      // Set preselected date and time if available
      if (preselection.preselectedDate && preselection.preselectedTime) {
        const parsedDate = parse(preselection.preselectedDate, 'yyyy-MM-dd', new Date());
        setSelectedDate(parsedDate);
        setSelectedTime(preselection.preselectedTime);
      }

      setPrefilledServiceInfo({
        id: preselection.preselectedService,
        name: preselection.preselectedServiceName,
        price: preselection.preselectedServicePrice ?? null,
        currency: preselection.preselectedCurrency,
        duration: preselection.preselectedDuration,
      });

      // If we have all required data (service, team member, date, time), skip to step 2
      if (preselection.preselectedService &&
        preselection.preselectedTeamMember &&
        preselection.preselectedDate &&
        preselection.preselectedTime) {
        setCurrentStep(2);
      }
    }
  }, [preselection, services, teamMembers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, teamRes] = await Promise.all([
        servicesAPI.getAll(),
        teamMembersAPI.getAll({ status: 'active' })
      ]);

      // Filter out null values and ensure we have valid data
      const validServices = (servicesRes.services || []).filter((s: any) => s && s.id);
      const validTeamMembers = (teamRes.teamMembers || []).filter((tm: any) => tm && tm.id);

      setServices(validServices);
      setTeamMembers(validTeamMembers);

    } catch (error) {
      console.error("Error loading booking data:", error);
      // Don't show error toast, just log it and show empty state
      setServices([]);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find(
    (s) => s && String(s.id) === String(selectedService)
  );
  const selectedTeamMemberData = teamMembers.find(
    (tm) => tm && String(tm.id) === String(selectedTeamMember)
  );
  const selectedPrice = useMemo(() => {
    const source = selectedServiceData || prefilledServiceInfo;
    if (!source) return null;
    const raw =
      source.basePrice ??
      source.price ??
      source.rate ??
      null;
    return raw !== null ? Number(raw) : null;
  }, [selectedServiceData, prefilledServiceInfo]);

  const displayService = selectedServiceData || prefilledServiceInfo || null;
  const showSteps = currentStep < 3 && !preselection;
  const selectedTimeRange = useMemo(() => {
    if (!selectedTime) return null;
    if (preselection?.preselectedEndTime) {
      return `${selectedTime} - ${preselection.preselectedEndTime}`;
    }

    const duration = displayService?.duration || selectedServiceData?.duration || 60;
    const [h, m] = selectedTime.split(":").map(Number);
    const start = h * 60 + (m || 0);
    const end = start + duration;
    const endH = Math.floor(end / 60) % 24;
    const endM = end % 60;
    const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    return `${selectedTime} - ${endStr}`;
  }, [selectedTime, displayService?.duration, selectedServiceData?.duration, preselection?.preselectedEndTime]);

  // Available time slots
  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      // Check auth before proceeding to details/payment
      if (!user) {
        setShowAuth(true);
        return;
      }
    }

    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as BookingStep);
    }
  };

  useEffect(() => {
    if (preselection && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [preselection, currentStep]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as BookingStep);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBookingSubmit = async () => {
    setSubmitting(true);
    try {
      if (!selectedDate || !selectedTime) {
        toast.error("Please select a date and time");
        setSubmitting(false);
        return;
      }

      // Format the date and time into ISO string
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dateTime = `${dateStr}T${selectedTime}:00`;

      const bookingData = {
        serviceId: selectedService || displayService?.id,
        serviceName: displayService?.name || selectedServiceData?.name,
        serviceDescription: displayService?.description,
        teamMemberId: selectedTeamMember,
        teamMemberName: selectedTeamMemberData?.name,
        date: dateTime,
        time: selectedTime,
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        notes: formData.notes,
        price: selectedPrice || 0,
        currency: displayService?.currency || selectedServiceData?.currency || 'EUR',
        duration: displayService?.duration || selectedServiceData?.duration,
        status: 'confirmed',
      };

      const bookingRes = await bookingsAPI.create(bookingData, getAccessToken() || '');
      setCreatedBooking(bookingRes.booking);
      toast.success("Booking confirmed!");
      setCurrentStep(3);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {currentStep < 3 && (
            <>
              <h1>Book Your Session</h1>
              <p className="text-muted-foreground">
                A journey to clarity and balance starts here
              </p>
            </>
          )}
        </div>

        {/* Progress Steps - Now only 2 steps */}
        {showSteps && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {[
                  { num: 1, label: "Select Session" },
                  { num: 2, label: "Details & Payment" },
                ].map((step, index) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`
                          h-10 w-10 rounded-full flex items-center justify-center transition-all
                          ${currentStep >= step.num
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted text-muted-foreground"
                          }
                        `}
                      >
                        {currentStep > step.num ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span>{step.num}</span>
                        )}
                      </div>
                      <span className="text-xs mt-2 text-muted-foreground">
                        {step.label}
                      </span>
                    </div>
                    {index < 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 transition-all ${currentStep > step.num ? "bg-primary" : "bg-muted"
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Select Session */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2>Choose Your Session Type</h2>

            {services.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3>No Services Available</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      There are currently no services available for booking. Please check back later or contact support.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedService === service.id
                      ? "border-primary ring-2 ring-primary/20"
                      : ""
                      }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <h3>{service.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          </div>
                          {selectedService === service.id && (
                            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 ml-4" />
                          )}
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {service.duration} min
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {service.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg text-foreground">
                              {service.basePrice ? `${service.currency || 'EUR'} ${service.basePrice}` : 'Price varies'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Mentor Selection */}
            {selectedService && teamMembers.length > 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2>Choose Your Mentor</h2>
                  <p className="text-muted-foreground">Select a practitioner for your session</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teamMembers.map((mentor) => {
                    const serviceData = services.find(s => s.id === selectedService);
                    const isSpecialized = serviceData && mentor.specialties?.some((s: string) =>
                      serviceData.category.toLowerCase().includes(s.toLowerCase()) ||
                      s.toLowerCase().includes(serviceData.category.toLowerCase())
                    );

                    return (
                      <Card
                        key={mentor.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedTeamMember === mentor.id
                          ? "border-primary ring-2 ring-primary/20"
                          : ""
                          }`}
                        onClick={() => setSelectedTeamMember(mentor.id)}
                      >
                        <CardContent className="p-6 space-y-4">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <Avatar className="h-16 w-16">
                              {mentor.photoUrl && <AvatarImage src={mentor.photoUrl} alt={mentor.name} />}
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {mentor.name?.split(' ').map((n: string) => n[0]).join('') || 'WZ'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h4 className="text-sm">{mentor.name}</h4>
                              <p className="text-xs text-muted-foreground">{mentor.role}</p>
                            </div>
                          </div>

                          {mentor.specialties && mentor.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {mentor.specialties.slice(0, 2).map((specialty: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {isSpecialized && (
                            <Badge className="w-full justify-center text-xs" variant="outline">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}

                          {selectedTeamMember === mentor.id && (
                            <div className="flex justify-center">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedService && teamMembers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center space-y-2">
                  <p className="text-muted-foreground">
                    No practitioners are currently available for this service.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!selectedService || !selectedTeamMember}
                className="min-w-[200px]"
              >
                Continue to Details & Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Combined Details & Payment */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="sr-only">Complete Your Booking</h2>

            {/* Compact session header */}
            <Card className="shadow-sm border-muted">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold leading-tight">
                          {displayService?.name || "Selected session"}
                        </h3>
                        {displayService?.category && (
                          <Badge variant="secondary" className="text-xs">
                            {displayService.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>{displayService?.duration || selectedServiceData?.duration || "—"} min</span>
                        <span>•</span>
                        <span>
                          {selectedTimeRange || selectedTime || "Time TBD"}
                        </span>
                        {selectedPrice !== null && (
                          <>
                            <span>•</span>
                            <span className="text-foreground font-medium">
                              {displayService?.currency || selectedServiceData?.currency || "EUR"} {selectedPrice}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedDate && selectedTime && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(selectedDate, 'PPP')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Date & Time Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Date & Time</CardTitle>
                    <CardDescription>
                      {allowDateChange ? "Choose when you'd like your session" : "Locked from your selection"}
                    </CardDescription>
                  </div>
                  {preselection && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAllowDateChange((v) => !v)}
                    >
                      {allowDateChange ? "Keep selection" : "Change date/time"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {allowDateChange ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <div className="flex justify-center">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date: Date) => date < new Date()}
                          className="rounded-xl border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Available Time Slots</Label>
                      {!selectedDate ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                          Please select a date first
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                              className="justify-center"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-foreground">
                      {selectedDate
                        ? `${format(selectedDate, 'EEEE, MMMM d, yyyy')} at ${selectedTimeRange || selectedTime}`
                        : "No date selected"}
                    </span>
                  </div>
                )}

                {selectedDate && selectedTime && allowDateChange && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-foreground">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTimeRange || selectedTime}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information & Payment */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Your Information & Payment</CardTitle>
                  <CardDescription>
                    Fill in your details and payment information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Session Summary */}
                  <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold">{displayService?.name || "Selected session"}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{displayService?.duration || selectedServiceData?.duration || "—"} min</span>
                          </div>
                          {selectedTime && (
                            <>
                              <span>•</span>
                              <span>{selectedTimeRange || selectedTime}</span>
                            </>
                          )}
                          {selectedTeamMemberData && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {selectedTeamMemberData.name}
                              </span>
                            </>
                          )}
                        </div>
                        {selectedDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(selectedDate, 'PPP')}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm text-muted-foreground">Amount</div>
                        <div className="text-lg font-semibold">
                          {selectedPrice !== null
                            ? `${displayService?.currency || selectedServiceData?.currency || 'EUR'} ${selectedPrice}`
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg p-3">
                      {displayService?.description
                        ? displayService.description
                        : "Review your details and confirm your session."}
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Fields */}
                  <div className="space-y-4">
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
                        placeholder="Any specific needs or questions?"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Fields */}
                  <div className="space-y-4">
                    <h4 className="text-sm">Payment Information</h4>

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

                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl mt-4">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Session</span>
                      <span>
                        {selectedPrice !== null
                          ? `${selectedServiceData?.currency || 'EUR'} ${selectedPrice}`
                          : 'Price varies'}
                      </span>
                    </div>
                    {selectedPrice !== null && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span>Total</span>
                          <span className="text-lg">
                            {selectedServiceData?.currency || 'EUR'} {selectedPrice}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Free cancellation up to 24h before
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Instant confirmation
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Secure payment
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleBookingSubmit}
                className="min-w-[200px]"
                disabled={!selectedDate || !selectedTime || !formData.name || !formData.email || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  selectedPrice !== null
                    ? `Confirm & Pay ${displayService?.currency || selectedServiceData?.currency || 'EUR'} ${selectedPrice}`
                    : "Request Booking"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && createdBooking && (
          <div className="space-y-8">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-12 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1>Booking Confirmed!</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your session has been successfully booked. Check your email for confirmation details.
                  </p>
                </div>

                <Card className="max-w-md mx-auto">
                  <CardContent className="p-6 space-y-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Session</span>
                        <span className="text-sm">{createdBooking.serviceName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Practitioner</span>
                        <span className="text-sm">{createdBooking.teamMemberName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <span className="text-sm">
                          {createdBooking.date ? format(new Date(createdBooking.date), 'MMMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time</span>
                        <span className="text-sm">{createdBooking.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="text-sm">{createdBooking.duration} minutes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
                  <Button size="lg" onClick={() => window.location.reload()}>
                    Book Another Session
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => window.location.href = '/'}>
                    Return to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
