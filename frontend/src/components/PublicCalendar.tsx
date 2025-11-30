import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronLeft, ChevronRight, Clock, Sparkles, Loader2, ArrowRight, MapPin, Calendar, Video, Package, PlayCircle } from "lucide-react";
import { availabilityAPI, programsAPI, productsAPI, sessionsAPI } from "../utils/api";
import { useCurrency } from "../context/CurrencyContext";

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  basePrice: number | null;
  currency: string;
  category: string;
  availableWith: TeamMember[];
}

interface TimeSlot {
  time: string;
  dateTime: string;
  endTime?: string;
  duration?: number;
  available: boolean;
  services: Service[];
}

interface PublicCalendarProps {
  onNavigateToBooking?: (bookingData: {
    preselectedDate?: string;
    preselectedTime?: string;
    preselectedDateTime?: string;
    preselectedTeamMember?: string;
    preselectedService?: string;
    preselectedServiceDescription?: string;
    preselectedServiceName?: string;
    preselectedServicePrice?: number;
    preselectedCurrency?: string;
    preselectedDuration?: number;
    preselectedEndTime?: string;
  }) => void;
  onNavigateToProgram?: (programId: string) => void;
  onNavigateToProduct?: (productId: string) => void;
}

export function PublicCalendar({ onNavigateToBooking, onNavigateToProgram, onNavigateToProduct }: PublicCalendarProps) {
  const { convertAndFormat } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // November 2025
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  // Fetch availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        // 1. Fetch calendar availability (currently contains demo slots; we override to avoid fake availability)
        const response = await availabilityAPI.getAvailability(year, month);
        let currentAvailability: Record<number, any> = {}; // ignore demo slots, we'll build from specific dates
        const members = response?.teamMembers || [];
        setTeamMembers(members);

        // 2. Fetch specific dates for each team member
        if (members.length > 0 && allServices.length > 0) {
          const specificDatesPromises = members.map((member: TeamMember) =>
            availabilityAPI
              .get(member.id)
              .then((res: any) => ({
                memberId: member.id,
                specificDates: res.specificDates || []
              }))
              .catch(() => ({
                memberId: member.id,
                specificDates: []
              }))
          );

          const membersSpecificDates = await Promise.all(specificDatesPromises);

          // 3. Merge specific dates into availability
          membersSpecificDates.forEach(({ memberId, specificDates }) => {
            const member = members.find((m: TeamMember) => m.id === memberId);
            if (!member) return;

            specificDates.forEach((dateSlot: any) => {
              // Safely parse YYYY-MM-DD to avoid timezone issues
              let slotDate: Date;
              if (typeof dateSlot.date === 'string' && dateSlot.date.includes('-')) {
                const [y, m, d] = dateSlot.date.split('T')[0].split('-').map(Number);
                slotDate = new Date(y, m - 1, d);
              } else {
                slotDate = new Date(dateSlot.date);
              }

              // Check if date is in current month view
              if (slotDate.getMonth() + 1 === month && slotDate.getFullYear() === year) {
                const day = slotDate.getDate();
                const time = dateSlot.startTime; // Assuming startTime is "HH:MM"

                // Initialize day if not exists
                if (!currentAvailability[day]) {
                  currentAvailability[day] = {
                    hasAvailability: true,
                    slots: []
                  };
                }

                // Calculate duration from time range if not explicitly provided
                let calculatedDuration = dateSlot.duration;
                if (!calculatedDuration && dateSlot.endTime && (dateSlot.startTime || time)) {
                  const startStr = dateSlot.startTime || time;
                  const endStr = dateSlot.endTime;
                  const [startH, startM] = startStr.split(':').map(Number);
                  const [endH, endM] = endStr.split(':').map(Number);
                  const diff = (endH * 60 + endM) - (startH * 60 + startM);
                  if (diff > 0) calculatedDuration = diff;
                }

                // Price/duration normalization
                let serviceDetails = dateSlot.serviceId
                  ? allServices.find((s) => String(s.id) === String(dateSlot.serviceId))
                  : null;

                // Smart fallback: if no service found by ID, try matching by duration only (heuristic)
                if (!serviceDetails && (dateSlot.duration || calculatedDuration)) {
                  const durationToMatch = Number(dateSlot.duration || calculatedDuration);
                  serviceDetails = allServices.find(s => Number(s.duration) === durationToMatch);
                }

                const normalizedPrice =
                  normalizePrice(serviceDetails) ??
                  normalizePrice(dateSlot);

                const normalizedCurrency =
                  serviceDetails?.currency ||
                  serviceDetails?.pricing?.currency ||
                  dateSlot.currency ||
                  "EUR";

                const normalizedDuration =
                  serviceDetails?.duration ||
                  calculatedDuration ||
                  60;

                const normalizedEndTime = computeEndTime(
                  dateSlot.startTime || dateSlot.time || time,
                  normalizedDuration,
                  dateSlot.endTime,
                );

                // Find or create time slot
                let slot = currentAvailability[day].slots.find((s: TimeSlot) => s.time === time);
                if (!slot) {
                  slot = {
                    time: time,
                    dateTime: dateSlot.date, // Or construct full ISO string
                    endTime: normalizedEndTime,
                    duration: normalizedDuration,
                    available: true,
                    services: []
                  };
                  currentAvailability[day].slots.push(slot);
                  // Sort slots by time
                  currentAvailability[day].slots.sort((a: TimeSlot, b: TimeSlot) =>
                    a.time.localeCompare(b.time)
                  );
                } else {
                  slot.endTime = slot.endTime || normalizedEndTime;
                  slot.duration = slot.duration || normalizedDuration;
                }

                const fallbackService = allServices.length === 1 ? allServices[0] : null;

                const serviceObj: Service = serviceDetails || fallbackService
                  ? {
                    ...(serviceDetails || fallbackService),
                    id: String((serviceDetails || fallbackService)?.id || dateSlot.serviceId || `generic-${day}-${time}-${member.id}`),
                    name: (serviceDetails || fallbackService)?.name || dateSlot.serviceName || dateSlot.title || dateSlot.name || "Session",
                    basePrice: (normalizedPrice ?? normalizePrice(fallbackService)) ?? null,
                    currency: (serviceDetails || fallbackService)?.currency || normalizedCurrency,
                    description: (serviceDetails || fallbackService)?.description || dateSlot.description || dateSlot.notes || "Session",
                    duration: (serviceDetails || fallbackService)?.duration || normalizedDuration,
                    category: (serviceDetails || fallbackService)?.category || dateSlot.category || "Breathwork",
                    availableWith: [],
                  }
                  : {
                    id: String(dateSlot.serviceId || `generic-${day}-${time}-${member.id}`),
                    name: dateSlot.serviceName || dateSlot.title || dateSlot.name || "Session",
                    description: dateSlot.description || dateSlot.notes || "Session",
                    duration: normalizedDuration,
                    basePrice: normalizedPrice ?? null,
                    currency: normalizedCurrency,
                    category: dateSlot.category || "Breathwork",
                    availableWith: [],
                  };

                // Check if service already in slot
                let serviceInSlot = slot.services.find((s: Service) => s.id === serviceObj.id);
                if (!serviceInSlot) {
                  serviceInSlot = { ...serviceObj, availableWith: [] };
                  slot.services.push(serviceInSlot);
                }

                // Add member to service
                if (!serviceInSlot.availableWith.find((m: TeamMember) => m.id === member.id)) {
                  serviceInSlot.availableWith.push(member);
                }
              }
            });
          });
        }

        setAvailability(currentAvailability);
      } catch (error) {
        console.error('Error fetching calendar availability:', error);
        // Set empty data instead of showing error
        setAvailability({});
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [currentDate, allServices]); // Add allServices dependency

  // Fetch Programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const data = await programsAPI.getAll();
        if (data && data.programs) {
          setPrograms(data.programs);
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, []);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await productsAPI.getAll();
        if (data && data.content) {
          setProducts(data.content);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch Services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { services } = await sessionsAPI.getAll();
        setAllServices(services || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    fetchServices();
  }, []);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDay(null);
  };

  const normalizePrice = (service: any): number | null => {
    const candidates = [
      service?.basePrice,
      service?.price,
      service?.rate,
      service?.amount,
      service?.price_cents ? service.price_cents / 100 : null,
      service?.amount_cents ? service.amount_cents / 100 : null,
      service?.cost,
      service?.defaultPrice,
      service?.pricing?.price,
      service?.pricing?.amount,
      typeof service?.amount_cents === "number" ? service.amount_cents / 100 : null,
    ];
    const found = candidates.find((v) => v !== undefined && v !== null);
    const numeric = found !== undefined ? Number(found) : null;
    return Number.isFinite(numeric) ? numeric : null;
  };

  const computeEndTime = (startTime: string, durationMinutes?: number, explicitEnd?: string) => {
    if (explicitEnd) return explicitEnd;
    const [h, m] = startTime.split(":").map(Number);
    const start = h * 60 + (m || 0);
    const duration = durationMinutes || 60;
    const endMinutes = start + duration;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const getDaySlots = (day: number): TimeSlot[] => {
    if (!availability || !availability[day]) {
      return [];
    }

    const dayData = availability[day];
    return dayData.slots || [];
  };

  // Build upcoming sessions when no date selected
  const getUpcomingSlots = () => {
    if (!availability) return [];
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const slots: { day: number; slot: TimeSlot }[] = [];

    Object.keys(availability)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((day) => {
        (availability[day]?.slots || []).forEach((slot: TimeSlot) => {
          slots.push({ day, slot });
        });
      });

    return slots;
  };

  const hasAvailableSlots = (day: number) => {
    if (!availability || !availability[day]) return false;
    return availability[day].hasAvailability;
  };

  const handleServiceSlotClick = (
    slot: TimeSlot,
    service: Service,
    teamMember: TeamMember,
    dayOverride?: number
  ) => {
    if (!slot.available) return;

    const dayToUse = dayOverride ?? selectedDay;
    if (!dayToUse) return;

    // Format the selected date
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`;

    // Navigate to booking flow with all pre-selected data - skip directly to step 2
    if (onNavigateToBooking) {
      const priceValue = normalizePrice(service);
      onNavigateToBooking({
        preselectedDate: dateStr,
        preselectedTime: slot.time,
        preselectedDateTime: slot.dateTime,
        preselectedService: String(service.id),
        preselectedTeamMember: teamMember.id,
        preselectedServiceName: service.name,
        preselectedServiceDescription: service.description,
        preselectedServicePrice: priceValue ?? undefined,
        preselectedCurrency: service.currency || "EUR",
        preselectedDuration: service.duration,
        preselectedEndTime: slot.endTime,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1>Book a Session</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore our programs, digital products, and book a session with our team.
          </p>
        </div>

        {/* 1. Available Sessions (Calendar) */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>Available Sessions</h2>
            <p className="text-muted-foreground">
              Select a date and time to book a session
            </p>
          </div>

          {/* No Data Warning */}
          {!loading && teamMembers.length === 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-base">No Demo Data Available</h3>
                    <p className="text-sm text-muted-foreground">
                      Please click the "Initialize Demo Data" button on the home page to populate the calendar with sample services and team members.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.location.href = '/'}
                    >
                      Go to Home Page
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {monthName} {year}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Select a date to view available sessions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                      <div key={`empty-${index}`} className="aspect-square"></div>
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const isSelected = selectedDay === day;
                      const isAvailable = hasAvailableSlots(day);
                      const isPast = day < 5; // Mock: first few days are past

                      return (
                        <button
                          key={day}
                          onClick={() => !isPast && setSelectedDay(day)}
                          disabled={isPast}
                          className={`
                            aspect-square rounded-xl p-2 transition-all relative
                            ${isPast ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                            ${isSelected
                              ? "bg-primary text-primary-foreground shadow-lg scale-105"
                              : isAvailable
                                ? "bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border border-primary/20 hover:border-primary/40"
                                : "bg-muted/30 hover:bg-muted/50"
                            }
                          `}
                        >
                          <span className="text-sm">{day}</span>
                          {isAvailable && !isSelected && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                              <div className="h-1 w-1 rounded-full bg-primary"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Services for Selected Day */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDay ? `${monthName} ${selectedDay}, ${year}` : "Select a Date"}
                </CardTitle>
                <CardDescription>Available sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDay ? (
                      getDaySlots(selectedDay).length > 0 ? (
                        getDaySlots(selectedDay).map((slot, slotIndex) => (
                          <div key={slotIndex} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {slot.time}
                                {slot.endTime ? ` - ${slot.endTime}` : ""}
                              </span>
                            </div>


                            {slot.available && slot.services && slot.services.length > 0 ? (
                              <div className="space-y-2 pl-6">
                                {slot.services.map((service: Service) => (
                                  <div key={service.id} className="space-y-2">
                                    {service.availableWith.map((member: TeamMember) => (
                                      <button
                                        key={`${service.id}-${member.id}`}
                                        onClick={() => handleServiceSlotClick(slot, service, member)}
                                        className="w-full p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary hover:shadow-md transition-all text-left group"
                                      >
                                        <div className="space-y-2">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm truncate">{service.name}</p>
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                  {service.category}
                                                </Badge>
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Avatar className="h-5 w-5">
                                                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground truncate">{member.name}</span>
                                              </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                              <span className="text-sm">
                                                {normalizePrice(service) !== null
                                                  ? convertAndFormat(
                                                    normalizePrice(service) as number,
                                                    service.currency || "EUR"
                                                  )
                                                  : "Price varies"}
                                              </span>
                                              <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="pl-6 py-2 text-xs text-muted-foreground">
                          No sessions available
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        {getUpcomingSlots().length === 0 && (
                          <div className="text-sm text-muted-foreground">No upcoming sessions</div>
                        )}
                        {getUpcomingSlots().map(({ day, slot }, idx) => (
                          <div key={`${day}-${idx}`} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                {monthName} {day}, {year} — {slot.time}
                                {slot.endTime ? ` - ${slot.endTime}` : ""}
                              </span>
                            </div>
                            {slot.services && slot.services.length > 0 ? (
                              <div className="space-y-2 pl-6">
                                {slot.services.map((service: Service) => (
                                  <div key={service.id} className="space-y-2">
                                    {service.availableWith.map((member: TeamMember) => (
                                      <button
                                        key={`${service.id}-${member.id}-${day}-${slot.time}`}
                                        onClick={() => handleServiceSlotClick(slot, service, member, day)}
                                        className="w-full p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary hover:shadow-md transition-all text-left group"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm truncate">{service.name}</p>
                                              <Badge variant="secondary" className="text-xs shrink-0">
                                                {service.category}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Avatar className="h-5 w-5">
                                                {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                                  {member.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span className="text-xs text-muted-foreground truncate">{member.name}</span>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-sm">
                                              {normalizePrice(service) !== null
                                                ? convertAndFormat(
                                                  normalizePrice(service) as number,
                                                  service.currency || "EUR"
                                                )
                                                : "Price varies"}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="pl-6 py-2 text-xs text-muted-foreground">No sessions available</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 flex items-center justify-center">
                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Available slots</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary"></div>
                  <span className="text-sm text-muted-foreground">Selected date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 opacity-50"></div>
                  <span className="text-sm text-muted-foreground">No availability</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Programs Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>Programs & Retreats</h2>
            <p className="text-muted-foreground">
              Join our transformative multi-day experiences
            </p>
          </div>

          {loadingPrograms ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Card
                  key={program.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onNavigateToProgram && onNavigateToProgram(program.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="h-40 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                      <MapPin className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="flex items-start justify-between text-lg">
                      <span>{program.title}</span>
                      <Badge variant="secondary" className="font-normal">
                        {program.status || 'Open'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {program.startDate ? new Date(program.startDate).toLocaleDateString() : 'TBD'}
                          {program.endDate ? ` - ${new Date(program.endDate).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{program.location || 'Location TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <span>{convertAndFormat(program.price || 0, program.currency || "EUR")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              No programs available at the moment.
            </div>
          )}
        </div>

        {/* 3. Products Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>Products & On Demand</h2>
            <p className="text-muted-foreground">
              Access digital content and video courses anytime
            </p>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onNavigateToProduct && onNavigateToProduct(product.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="h-40 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative overflow-hidden">
                      {product.type === 'video_course' ? (
                        <Video className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                        {product.type === 'video_course' ? (
                          <PlayCircle className="h-3 w-3" />
                        ) : (
                          <Package className="h-3 w-3" />
                        )}
                        <span>{product.type === 'video_course' ? 'Video Course' : 'Digital Product'}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="line-clamp-2">{product.description || 'No description'}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="font-medium text-foreground">
                          {convertAndFormat(product.price || 0, product.currency || "EUR")}
                        </span>
                        <span>•</span>
                        <span>{product.itemCount || 0} Items</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              No products available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
