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
import { sessionsAPI as servicesAPI, teamMembersAPI, bookingsAPI, bundlesAPI } from "../utils/api";
import { toast } from "sonner";
import { format, parse, addMinutes, isBefore, startOfDay } from "date-fns";
import { supabase } from "../utils/supabase/client";
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
    preselectedFixedPrices?: Record<string, number> | null;
    preselectedLocationName?: string;
    preselectedLocationAddress?: string;
  } | null;
}

export function BookingFlow({ preselection }: BookingFlowProps) {
  const { convertAndFormat, formatFixedPrice, currency } = useCurrency();
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
    fixedPrices?: Record<string, number> | null;
    locationName?: string;
    locationAddress?: string;
  } | null>(preselection
    ? {
      id: preselection.preselectedService,
      name: preselection.preselectedServiceName,
      description: preselection.preselectedServiceDescription,
      price: preselection.preselectedServicePrice ?? null,
      currency: preselection.preselectedCurrency,
      duration: preselection.preselectedDuration,
      fixedPrices: preselection.preselectedFixedPrices,
      locationName: preselection.preselectedLocationName,
      locationAddress: preselection.preselectedLocationAddress,
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

  // Bundle Handling
  const [myBundles, setMyBundles] = useState<any[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  // Redemption Code State (Legacy/Alternative)
  const [redemptionCode, setRedemptionCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<any>(null);
  const [codeChecking, setCodeChecking] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]); // Add user dep to reload bundles if auth changes

  useEffect(() => {
    if (preselection?.preselectedService && !selectedService) {
      setSelectedService(preselection.preselectedService);
    }
  }, [preselection?.preselectedService, selectedService]);

  useEffect(() => {
    if (myBundles.length > 0 && !selectedBundleId && !appliedCode) {
      // Auto-select first bundle if available? Maybe better to let user choose
    }
  }, [myBundles]);

  // Auto-advance after login
  useEffect(() => {
    if (user && showAuth) {
      setShowAuth(false);
      // Stay on step 1 if no preselection, otherwise go to step 2?
      // Actually if we just logged in, we should check if we have enough info to proceed.
      if (preselection) {
        setCurrentStep(2);
      }
    }
  }, [user, showAuth, preselection]);

  // Force Auth if arriving with preselection but not logged in
  useEffect(() => {
    if (preselection && !user && !loading) {
      console.log("Forcing auth for booking");
      setShowAuth(true);
    }
  }, [preselection, user, loading]);

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
        fixedPrices: preselection.preselectedFixedPrices,
        locationName: preselection.preselectedLocationName,
        locationAddress: preselection.preselectedLocationAddress,
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
      const promises: Promise<any>[] = [
        servicesAPI.getAll(),
        teamMembersAPI.getAll({ status: 'active' })
      ];

      if (user?.id) {
        promises.push(bundlesAPI.getMyBundles(user.id));
      }

      const results = await Promise.all(promises);
      const servicesRes = results[0];
      const teamRes = results[1];
      const bundlesRes = results[2];

      // Filter out null values and ensure we have valid data
      const validServices = (servicesRes.services || []).filter((s: any) => s && s.id);
      const validTeamMembers = (teamRes.teamMembers || []).filter((tm: any) => tm && tm.id);

      setServices(validServices);
      setTeamMembers(validTeamMembers);

      if (bundlesRes?.myBundles) {
        setMyBundles(bundlesRes.myBundles);
      }

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

  const effectivePrice = (appliedCode || selectedBundleId) ? 0 : selectedPrice;

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

  const selectedLocationLabel = useMemo(() => {
    if (preselection?.preselectedLocationName) {
      return preselection.preselectedLocationName;
    }

    const source = selectedServiceData || displayService || prefilledServiceInfo;
    const rawLocation =
      source?.locationName ||
      source?.location_name ||
      source?.location;

    if (typeof rawLocation === "string" && rawLocation.trim()) {
      return rawLocation.trim();
    }

    if (rawLocation && typeof rawLocation === "object" && rawLocation.name) {
      return rawLocation.name;
    }

    const rawAddress =
      source?.locationAddress ||
      source?.location_address ||
      (typeof source?.location === "object" ? source?.location?.address : undefined);

    if (typeof rawAddress === "string" && rawAddress.trim()) {
      return "Location";
    }

    return "Location to be confirmed";
  }, [selectedServiceData, displayService, prefilledServiceInfo, preselection?.preselectedLocationName]);

  const selectedLocationAddress = useMemo(() => {
    if (preselection?.preselectedLocationAddress) {
      return preselection.preselectedLocationAddress;
    }

    const source = selectedServiceData || displayService || prefilledServiceInfo;
    const rawAddress =
      source?.locationAddress ||
      source?.location_address ||
      (typeof source?.location === "object" ? source?.location?.address : undefined);

    if (typeof rawAddress === "string" && rawAddress.trim()) {
      return rawAddress.trim();
    }

    return "";
  }, [selectedServiceData, displayService, prefilledServiceInfo, preselection?.preselectedLocationAddress]);

  const selectedLocationDisplay = useMemo(() => {
    return selectedLocationAddress
      ? `${selectedLocationLabel} · ${selectedLocationAddress}`
      : selectedLocationLabel;
  }, [selectedLocationLabel, selectedLocationAddress]);

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

      const isFree = (effectivePrice || 0) === 0;
      const bookingData = {
        serviceId: selectedService || displayService?.id,
        serviceName: displayService?.name || selectedServiceData?.name,
        serviceDescription: displayService?.description,
        teamMemberId: selectedTeamMember,
        teamMemberName: selectedTeamMemberData?.name,
        date: dateTime,
        time: selectedTime,
        customerId: user?.id,
        customer_id: user?.id, // Redundant but safe for API handling
        userId: user?.id,
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        notes: formData.notes + (appliedCode ? `\n[Redeemed Bundle: ${appliedCode.code}]` : ""),
        price: effectivePrice || 0,
        currency: displayService?.currency || selectedServiceData?.currency || 'EUR',
        duration: displayService?.duration || selectedServiceData?.duration,
        status: (appliedCode || isFree) ? 'confirmed' : 'pending',
      };

      // Handle Bundle Redemption Flow (Legacy Code or Active Bundle)
      if (appliedCode || selectedBundleId) {

        if (selectedBundleId) {
          // 1. Deduct Credit from Bundle Purchase
          // @ts-ignore - RPC not yet in types
          const { data: useResult, error: useError } = await supabase.rpc('use_bundle_credit', {
            p_purchase_id: selectedBundleId
          });

          const result = useResult as { success: boolean; message: string } | null;

          if (useError || !result?.success) {
            throw new Error(result?.message || useError?.message || "Failed to use bundle credit");
          }
        } else if (appliedCode) {
          // 1. Redeem Code via RPC
          // @ts-ignore - RPC not yet in types
          const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_bundle_code', {
            code_input: appliedCode.code
          });

          const result = redeemResult as { success: boolean; message: string } | null;

          if (redeemError || !result?.success) {
            throw new Error(result?.message || redeemError?.message || "Redemption failed");
          }
        }

        // 2. Create Booking (Confirmed)
        const bookingRes: any = await bookingsAPI.create(bookingData);
        setCreatedBooking(bookingRes);

        // Trigger Email for Bundle/Free booking
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'booking_confirmation',
              to: formData.email,
              payload: {
                clientName: formData.name,
                sessionName: bookingData.serviceName,
                date: format(selectedDate, 'PPPP'),
                time: selectedTimeRange || selectedTime,
                instructorName: bookingData.teamMemberName,
                locationName: selectedLocationLabel,
                address: selectedLocationAddress,
                price: `${bookingData.price} ${bookingData.currency}`,
                bookingId: bookingRes.id
              }
            }
          });
        } catch (e) {
          console.error("Error sending confirmation email:", e);
        }

        toast.success("Booking confirmed!");
        setCurrentStep(3);
        return; // Exit, no Stripe needed
      }

      const bookingRes: any = await bookingsAPI.create(bookingData);

      // If price > 0, redirect to Stripe
      if (!isFree) {
        toast.loading("Redirecting to payment...");
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            price: effectivePrice,
            currency: displayService?.currency || selectedServiceData?.currency || 'EUR',
            description: `${bookingData.serviceName} with ${selectedTeamMemberData?.name}`,
            booking_id: bookingRes.id,
            return_url: window.location.href.split('?')[0], // Current page URL base
            customer_email: formData.email
          }
        });

        if (error) {
          console.error("Checkout invoke error:", error);
          toast.error("Connection error: " + error.message);
          throw error;
        }

        // Check for logical error returned with 200 status
        if (data?.error) {
          console.error("Stripe error:", data);
          toast.error(`Payment Error: ${data.message || data.error}`);
          throw new Error(data.error);
        }

        if (data?.url) {
          window.location.href = data.url;
          return; // Stop execution, redirecting
        }
      }

      // If free booking (not bundle, but service price is 0)
      if (isFree) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'booking_confirmation',
              to: formData.email,
              payload: {
                clientName: formData.name,
                sessionName: bookingData.serviceName,
                date: format(selectedDate, 'PPPP'),
                time: selectedTimeRange || selectedTime,
                instructorName: bookingData.teamMemberName,
                locationName: selectedLocationLabel,
                address: selectedLocationAddress,
                price: `${bookingData.price} ${bookingData.currency}`,
                bookingId: bookingRes.id
              }
            }
          });
        } catch (e) {
          console.error("Error sending confirmation email:", e);
        }
      }

      setCreatedBooking(bookingRes);
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
                              {typeof service.category === 'object' ? service.category?.name : service.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg text-foreground">
                              {service.basePrice ? formatFixedPrice(service.fixed_prices || service.fixedPrices, service.basePrice, service.currency || 'EUR') : 'Price varies'}
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
                    const categoryName = serviceData ? (typeof serviceData.category === 'object' ? serviceData.category?.name : serviceData.category) : "";
                    const isSpecialized = serviceData && mentor.specialties?.some((s: string) =>
                      categoryName?.toLowerCase().includes(s.toLowerCase()) ||
                      s.toLowerCase().includes(categoryName?.toLowerCase())
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
                            {typeof displayService.category === 'object' ? displayService.category?.name : displayService.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>{displayService?.duration || selectedServiceData?.duration || "—"} min</span>
                        <span>•</span>
                        <span>
                          {selectedTimeRange || selectedTime || "Time TBD"}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {selectedLocationDisplay}
                        </span>
                        {selectedPrice !== null && (
                          <>
                            <span>•</span>
                            <span className="text-foreground font-medium">
                              {formatFixedPrice(displayService?.fixedPrices || displayService?.fixed_prices || null, selectedPrice, displayService?.currency || selectedServiceData?.currency || "EUR")}
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
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-foreground">
                        {selectedDate
                          ? `${format(selectedDate, 'EEEE, MMMM d, yyyy')} at ${selectedTimeRange || selectedTime}`
                          : "No date selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{selectedLocationLabel}</span>
                    </div>
                    {!!selectedLocationAddress && (
                      <div className="pl-6 text-xs text-muted-foreground">
                        {selectedLocationAddress}
                      </div>
                    )}
                  </div>
                )}

                {selectedDate && selectedTime && allowDateChange && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-foreground">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTimeRange || selectedTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{selectedLocationLabel}</span>
                    </div>
                    {!!selectedLocationAddress && (
                      <div className="pl-6 text-xs text-muted-foreground">
                        {selectedLocationAddress}
                      </div>
                    )}
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
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {selectedLocationDisplay}
                            </span>
                          </>
                        </div>
                        {selectedDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(selectedDate, 'PPP')}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>{displayService?.duration || selectedServiceData?.duration || "—"} min</span>
                          <span>•</span>
                          <span>
                            {selectedTimeRange || selectedTime || "Time TBD"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedDate && selectedTime && (
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(selectedDate, 'PPP')}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center md:hidden">
                    <span className="font-medium text-sm">Total</span>
                    <span className="font-semibold text-sm">
                      {effectivePrice !== null
                        ? formatFixedPrice(displayService?.fixedPrices || displayService?.fixed_prices || null, effectivePrice, currency)
                        : '—'}
                    </span>
                  </div>

                  <Separator />

                  {/* Bundle Usage Options */}
                  {myBundles.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <Label>Use Active Bundle</Label>
                      <div className="space-y-2">
                        {myBundles.map(bundle => (
                          <div
                            key={bundle.id}
                            className={`
                                        flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                                        ${selectedBundleId === bundle.id ? "border-[#0D7A7A] bg-[#0D7A7A]/5 ring-1 ring-[#0D7A7A]" : "border-border hover:border-[#0D7A7A]/50"}
                                    `}
                            onClick={() => {
                              if (selectedBundleId === bundle.id) {
                                setSelectedBundleId(null);
                              } else {
                                setSelectedBundleId(bundle.id);
                                setAppliedCode(null); // Clear code if bundle is selected
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                            h-4 w-4 rounded-full border flex items-center justify-center
                                            ${selectedBundleId === bundle.id ? "border-[#0D7A7A]" : "border-muted-foreground"}
                                        `}>
                                {selectedBundleId === bundle.id && <div className="h-2 w-2 rounded-full bg-[#0D7A7A]" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{bundle.bundle?.name}</p>
                                <p className="text-xs text-muted-foreground">{bundle.remaining_credits} credits remaining</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[#0D7A7A] border-[#0D7A7A]/20">
                              Free
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  )}

                  {/* Redemption Code Input */}
                  <div className="space-y-4 pt-2">
                    <Label>Have a Bundle Code? (Gift/Promo)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code (e.g. BUN-XXXX)"
                        value={redemptionCode}
                        onChange={(e) => setRedemptionCode(e.target.value)}
                        disabled={!!appliedCode || !!selectedBundleId}
                        className="font-mono uppercase"
                      />
                      <Button
                        variant={appliedCode ? "secondary" : "outline"}
                        onClick={async () => {
                          if (appliedCode) {
                            setAppliedCode(null);
                            setRedemptionCode("");
                            return;
                          }
                          if (!redemptionCode.trim()) return;
                          setCodeChecking(true);
                          // Unselect active bundle if strict code is applied
                          setSelectedBundleId(null);

                          const { data, error } = await supabase
                            .from('redemption_codes')
                            .select('*')
                            .eq('code', redemptionCode.trim())
                            .single();

                          setCodeChecking(false);

                          if (error || !data) {
                            toast.error("Invalid code");
                            return;
                          }
                          const codeData = data as any;
                          if (codeData.status !== 'active' || codeData.remaining_uses <= 0) {
                            toast.error("Code is expired or fully used");
                            return;
                          }
                          // Optional: Check ownership if you enabled that policy
                          if (codeData.user_id !== user?.id) {
                            toast.error("This code belongs to another user");
                            return;
                          }

                          setAppliedCode(codeData);
                          toast.success("Bundle applied! Amount to pay: €0");
                        }}
                        disabled={codeChecking || !!selectedBundleId}
                      >
                        {codeChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : (appliedCode ? "Remove" : "Apply")}
                      </Button>
                    </div>
                    {appliedCode && (
                      <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Bundle applied! {appliedCode.remaining_uses} uses remaining.</span>
                      </div>
                    )}
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

                  {/* Payment Fields REMOVED - Using Stripe Checkout */}
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-xl mt-4">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      You will be redirected to a secure payment page
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{displayService?.name || "Session"}</span>
                    <span className="font-medium">
                      {selectedPrice !== null
                        ? formatFixedPrice(displayService?.fixedPrices || displayService?.fixed_prices || null, selectedPrice, currency) // Use global currency
                        : 'Price varies'}
                    </span>
                  </div>

                  {(appliedCode || selectedBundleId) && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Bundle/Code applied</span>
                      <span>
                        -{selectedPrice !== null
                          ? formatFixedPrice(displayService?.fixedPrices || displayService?.fixed_prices || null, selectedPrice, currency) // Use global currency
                          : ''}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <div className="text-lg font-bold">
                      {effectivePrice !== null
                        ? formatFixedPrice(displayService?.fixedPrices || displayService?.fixed_prices || null, effectivePrice, currency) // Use global currency
                        : '—'}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground pt-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Free cancellation up to 24h before
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
                    ? `Confirm & Pay ${formatFixedPrice(displayService?.fixedPrices || displayService?.fixed_prices || null, effectivePrice!, currency)}`
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
