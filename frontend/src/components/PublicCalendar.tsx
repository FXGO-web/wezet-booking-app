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
  const [currentDate, setCurrentDate] = useState(new Date());
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

        // 1. Fetch calendar availability (real data from edge function)
        const response = await availabilityAPI.getAvailability(year, month);
        const rawSlots = response?.slots || [];
        const members = response?.teamMembers || [];
        console.log("DEBUG: Fetched availability:", { year, month, rawSlots, members });
        setTeamMembers(members);

        let currentAvailability: Record<number, any> = {};

        rawSlots.forEach((slot: any) => {
          const slotDate = new Date(slot.date);
          // Ensure we are in the correct month (edge function should handle this, but safety check)
          if (slotDate.getMonth() + 1 !== month || slotDate.getFullYear() !== year) return;

          const day = slotDate.getDate();
          const time = slot.start.slice(0, 5); // HH:MM

          if (!currentAvailability[day]) {
            currentAvailability[day] = {
              hasAvailability: true,
              slots: []
            };
          }

          // Find applicable services
          let applicableServices: any[] = [];
          let isGenericSlot = false;

          if (slot.template_id) {
            const s = allServices.find(s => String(s.id) === String(slot.template_id));
            if (s) applicableServices.push(s);
          } else {
            // Generic slot: find all services for this instructor
            isGenericSlot = true;
            applicableServices = allServices.filter(s =>
              String(s.instructor?.id) === String(slot.instructor_id) ||
              String(s.instructor_id) === String(slot.instructor_id)
            );
          }

          // If no specific services found for this instructor, and it's a generic slot,
          // we fallback to a generic "Session" marker.
          if (applicableServices.length === 0) {
            applicableServices.push(null); // Marker for fallback
          }

          // Find member or use fallback
          let member = members.find((m: any) => String(m.id) === String(slot.instructor_id));
          if (!member) {
            console.warn(`Member not found for slot instructor_id: ${slot.instructor_id}`);
            member = {
              id: slot.instructor_id,
              name: "Instructor",
              avatarUrl: null
            };
          }

          // Process each applicable service
          applicableServices.forEach(serviceDetails => {
            // Calculate duration/end time based on service or default
            const duration = serviceDetails?.duration_minutes || serviceDetails?.duration || 60;
            const endTime = slot.end ? slot.end.slice(0, 5) : computeEndTime(time, duration);

            // Find or create time slot
            let timeSlot = currentAvailability[day].slots.find((s: TimeSlot) => s.time === time);
            if (!timeSlot) {
              timeSlot = {
                time: time,
                dateTime: slot.date,
                endTime: endTime,
                duration: duration,
                available: true,
                services: []
              };
              currentAvailability[day].slots.push(timeSlot);
              // Sort slots
              currentAvailability[day].slots.sort((a: TimeSlot, b: TimeSlot) =>
                a.time.localeCompare(b.time)
              );
            }

            // Map service details to Service object
            const serviceObj: Service = serviceDetails
              ? {
                id: String(serviceDetails.id),
                name: serviceDetails.name,
                description: serviceDetails.description,
                duration: serviceDetails.duration_minutes || serviceDetails.duration || 60,
                basePrice: serviceDetails.price ?? serviceDetails.basePrice,
                currency: serviceDetails.currency || "EUR",
                category: typeof serviceDetails.category === 'object' ? serviceDetails.category?.name : (serviceDetails.category || "General"),
                availableWith: []
              }
              : {
                id: `generic-${day}-${time}`,
                name: "Session",
                duration: 60,
                basePrice: null,
                currency: "EUR",
                category: "General",
                availableWith: []
              };

            // Deduplication Logic:
            // 1. If we are adding a specific service, remove any existing generic services from this slot.
            if (serviceDetails) {
              timeSlot.services = timeSlot.services.filter(s => !s.id.startsWith('generic-'));
            }

            // 2. If we are adding a generic service, but the slot already has specific services, SKIP adding this generic one.
            if (!serviceDetails && timeSlot.services.some(s => !s.id.startsWith('generic-'))) {
              return; // Skip adding generic service
            }

            let serviceInSlot = timeSlot.services.find((s: Service) => s.id === serviceObj.id);
            if (!serviceInSlot) {
              serviceInSlot = { ...serviceObj, availableWith: [] };
              timeSlot.services.push(serviceInSlot);
            }

            // Add member to service
            if (!serviceInSlot.availableWith.find((m: TeamMember) => m.id === member.id)) {
              serviceInSlot.availableWith.push(member);
            }
          });
        });

        setAvailability(currentAvailability);
      } catch (error) {
        console.error('Error fetching calendar availability:', error);
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

        {/* 1. Programs Section */}
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
                    <div className="h-32 w-full bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg mb-4 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all px-4">
                      <span className="text-base md:text-lg font-semibold text-primary uppercase tracking-widest text-center line-clamp-2 break-words">
                        {program.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                    <CardTitle className="flex items-start justify-between text-lg">
                      <span>{program.name}</span>
                      <Badge variant="secondary" className="font-normal">
                        {program.is_active ? 'Published' : 'Draft'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {program.start_date ? new Date(program.start_date).toLocaleDateString() : 'TBD'}
                          {program.end_date ? ` - ${new Date(program.end_date).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{(program.location && typeof program.location === 'object') ? program.location.name : (program.location || 'Location TBD')}</span>
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

        {/* 2. Available Sessions (Calendar) */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>Available Sessions</h2>
            <p className="text-muted-foreground">
              Select a date and time to book a session
            </p>
          </div>

          {/* No Data Warning - REMOVED */}

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

            {/* Available Services for Selected Day or Upcoming List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDay ? `${monthName} ${selectedDay}, ${year}` : "Upcoming Sessions"}
                </CardTitle>
                <CardDescription>
                  {selectedDay ? "Available sessions for this date" : `All available sessions in ${monthName}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedDay ? (
                      // Single Day View
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
                          No sessions available for this date.
                        </div>
                      )
                    ) : (
                      // All Upcoming Sessions View
                      getUpcomingSlots().length > 0 ? (
                        getUpcomingSlots().map(({ day, slot }, index, array) => {
                          const showDateHeader = index === 0 || array[index - 1].day !== day;
                          return (
                            <div key={`${day}-${slot.time}-${index}`} className="space-y-2">
                              {showDateHeader && (
                                <div className="flex items-center gap-2 pb-2 pt-2 first:pt-0">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <h3 className="text-sm font-medium text-foreground">
                                    {monthName} {day}, {year}
                                  </h3>
                                </div>
                              )}

                              <div className="pl-6 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {slot.time}
                                    {slot.endTime ? ` - ${slot.endTime}` : ""}
                                  </span>
                                </div>

                                {slot.available && slot.services && slot.services.length > 0 ? (
                                  <div className="space-y-2">
                                    {slot.services.map((service: Service) => (
                                      <div key={service.id} className="space-y-2">
                                        {service.availableWith.map((member: TeamMember) => (
                                          <button
                                            key={`${service.id}-${member.id}`}
                                            onClick={() => handleServiceSlotClick(slot, service, member, day)}
                                            className="w-full p-3 rounded-xl bg-card border hover:border-primary hover:shadow-md transition-all text-left group"
                                          >
                                            <div className="space-y-2">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium truncate">{service.name}</p>
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                                                      {service.category}
                                                    </Badge>
                                                  </div>
                                                  <div className="flex items-center gap-2 mt-1.5">
                                                    <Avatar className="h-4 w-4">
                                                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                                                      <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                                                        {member.name.split(' ').map(n => n[0]).join('')}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs text-muted-foreground truncate">{member.name}</span>
                                                  </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                  <span className="text-sm font-medium">
                                                    {normalizePrice(service) !== null
                                                      ? convertAndFormat(
                                                        normalizePrice(service) as number,
                                                        service.currency || "EUR"
                                                      )
                                                      : "Price varies"}
                                                  </span>
                                                  <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No upcoming sessions found for this month.
                        </div>
                      )
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
