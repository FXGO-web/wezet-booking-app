import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  User,
  ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { availabilityAPI, sessionsAPI } from "../utils/api";
import { useCurrency } from "../context/CurrencyContext";
import { Skeleton } from "./ui/skeleton";

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  basePrice: number | null;
  currency: string;
  category: string;
  description?: string;
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

interface WordPressCalendarWidgetProps {
  onNavigateToBooking?: (bookingData: {
    preselectedDate?: string;
    preselectedTime?: string;
    preselectedDateTime?: string;
    preselectedTeamMember?: string;
    preselectedService?: string;
    preselectedServiceDescription?: string;
    preselectedServiceName?: string;
    preselectedServicePrice?: number | null;
    preselectedCurrency?: string;
    preselectedDuration?: number;
    preselectedEndTime?: string;
  }) => void;
}

type AvailabilityMap = Record<
  number,
  {
    hasAvailability: boolean;
    slots: TimeSlot[];
  }
>;

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

export function WordPressCalendarWidget({
  onNavigateToBooking,
}: WordPressCalendarWidgetProps) {
  const { convertAndFormat } = useCurrency();
  const now = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

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

  // Load services and team members once
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [servicesRes, membersRes] = await Promise.all([
          sessionsAPI.getAll(),
          availabilityAPI.getTeamMembers().catch(() => null),
        ]);
        setAllServices(servicesRes?.services || []);
        setTeamMembers(membersRes?.teamMembers || []);
      } catch (error) {
        console.error("Failed to fetch services/team members:", error);
        setAllServices([]);
        setTeamMembers([]);
      } finally {
        setLoadingServices(false);
      }
    };

    loadStaticData();
  }, []);

  // Load availability for the visible month
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const response = await availabilityAPI.getAvailability(year, month);
        const members =
          (response?.teamMembers as TeamMember[] | undefined)?.filter(Boolean) ||
          teamMembers;

        const specificDates = await Promise.all(
          members.map((member) =>
            availabilityAPI
              .get(member.id)
              .then((res: any) => ({
                memberId: member.id,
                specificDates: res?.specificDates || [],
              }))
              .catch(() => ({
                memberId: member.id,
                specificDates: [],
              }))
          )
        );

        const map: AvailabilityMap = {};

        specificDates.forEach(({ memberId, specificDates: dates }) => {
          const member = members.find((m) => m.id === memberId);
          if (!member) return;

          dates.forEach((dateSlot: any) => {
            let slotDate: Date;
            if (typeof dateSlot.date === "string" && dateSlot.date.includes("-")) {
              const [y, m, d] = dateSlot.date.split("T")[0].split("-").map(Number);
              slotDate = new Date(y, m - 1, d);
            } else {
              slotDate = new Date(dateSlot.date);
            }

            if (
              slotDate.getMonth() + 1 !== month ||
              slotDate.getFullYear() !== year
            ) {
              return;
            }

            const day = slotDate.getDate();
            const time = dateSlot.startTime || dateSlot.time;
            if (!time) return;

            if (!map[day]) {
              map[day] = { hasAvailability: true, slots: [] };
            }

            const serviceDetails = dateSlot.serviceId
              ? allServices.find((s) => String(s.id) === String(dateSlot.serviceId))
              : null;

            const normalizedPrice =
              normalizePrice(serviceDetails) ?? normalizePrice(dateSlot);
            const normalizedCurrency =
              serviceDetails?.currency ||
              serviceDetails?.pricing?.currency ||
              dateSlot.currency ||
              "EUR";
            const normalizedDuration =
              serviceDetails?.duration || dateSlot.duration || 60;
            const endTime = computeEndTime(time, normalizedDuration, dateSlot.endTime);

            let slot = map[day].slots.find((s) => s.time === time);
            if (!slot) {
              slot = {
                time,
                dateTime: dateSlot.date,
                endTime,
                duration: normalizedDuration,
                available: true,
                services: [],
              };
              map[day].slots.push(slot);
              map[day].slots.sort((a, b) => a.time.localeCompare(b.time));
            } else {
              slot.endTime = slot.endTime || endTime;
              slot.duration = slot.duration || normalizedDuration;
            }

            const fallbackService = allServices.length === 1 ? allServices[0] : null;
            const baseService = serviceDetails || fallbackService;

            const serviceObj: Service = baseService
              ? {
                ...(baseService as any),
                id: String(baseService?.id || dateSlot.serviceId || `generic-${day}-${time}-${member.id}`),
                name:
                  baseService?.name ||
                  dateSlot.serviceName ||
                  dateSlot.title ||
                  "Session",
                basePrice:
                  (normalizedPrice ?? normalizePrice(fallbackService)) ?? null,
                currency: baseService?.currency || normalizedCurrency,
                description:
                  baseService?.description ||
                  dateSlot.description ||
                  dateSlot.notes ||
                  "",
                duration: baseService?.duration || normalizedDuration,
                category: baseService?.category || dateSlot.category || "Session",
                availableWith: [],
              }
              : {
                id: String(dateSlot.serviceId || `generic-${day}-${time}-${member.id}`),
                name: dateSlot.serviceName || dateSlot.title || "Session",
                description: dateSlot.description || dateSlot.notes || "",
                duration: normalizedDuration,
                basePrice: normalizedPrice ?? null,
                currency: normalizedCurrency,
                category: dateSlot.category || "Session",
                availableWith: [],
              };

            let serviceInSlot = slot.services.find((s) => s.id === serviceObj.id);
            if (!serviceInSlot) {
              serviceInSlot = { ...serviceObj, availableWith: [] };
              slot.services.push(serviceInSlot);
            }

            if (
              !serviceInSlot.availableWith.find(
                (tm: TeamMember) => tm.id === member.id
              )
            ) {
              serviceInSlot.availableWith.push(member);
            }
          });
        });

        setAvailability(map);

        if (selectedDay === null || !map[selectedDay]) {
          const firstAvailable = Object.keys(map)
            .map(Number)
            .sort((a, b) => a - b)[0];
          setSelectedDay(firstAvailable || null);
        }
      } catch (error) {
        console.error("Error fetching calendar availability:", error);
        setAvailability({});
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [currentDate, allServices, teamMembers]);

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

  const getDaySlots = (day: number): TimeSlot[] => {
    if (!availability || !availability[day]) return [];
    return availability[day].slots || [];
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
    if (!onNavigateToBooking) return;
    const dayToUse = dayOverride ?? selectedDay;
    if (!dayToUse) return;

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      dayToUse
    ).padStart(2, "0")}`;
    const priceValue = normalizePrice(service);

    onNavigateToBooking({
      preselectedDate: dateStr,
      preselectedTime: slot.time,
      preselectedDateTime: slot.dateTime,
      preselectedService: String(service.id),
      preselectedTeamMember: teamMember.id,
      preselectedServiceName: service.name,
      preselectedServiceDescription: service.description,
      preselectedServicePrice: priceValue,
      preselectedCurrency: service.currency || "EUR",
      preselectedDuration: service.duration,
      preselectedEndTime: slot.endTime,
    });
  };

  const today = new Date();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return getDaySlots(selectedDay).flatMap((slot) =>
      slot.services.flatMap((service) =>
        service.availableWith.map((member) => ({
          slot,
          service,
          member,
        }))
      )
    );
  }, [selectedDay, availability]);

  return (
    <div className="w-full">
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="bg-[#e36b35] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold tracking-wide uppercase text-xs">
              <CalendarIcon className="h-4 w-4" />
              Book a Session
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <span>{monthName}</span>
              <span className="opacity-80">{year}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 p-6">
          <Card className="shadow-none border border-border/60">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                <div className="font-semibold text-sm">
                  {monthName} {year}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="aspect-square" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const isSelected = selectedDay === day;
                    const isAvailable = hasAvailableSlots(day);
                    const dayDate = new Date(year, currentDate.getMonth(), day, 12, 0, 0);
                    const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && setSelectedDay(day)}
                        disabled={isPast}
                        className={`
                          aspect-square rounded-md text-sm flex items-center justify-center relative transition-all
                          ${isPast ? "text-muted-foreground/60 cursor-not-allowed" : "hover:bg-primary/5"}
                          ${isSelected ? "bg-[#e36b35] text-white shadow-sm" : "bg-white border border-border/70"}
                        `}
                      >
                        {day}
                        {isAvailable && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#e36b35]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border border-border/60 min-h-[420px]">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                <div className="text-sm font-semibold uppercase tracking-wide">Events</div>
                {selectedDay && (
                  <div className="text-xs text-muted-foreground">
                    {monthName} {selectedDay}, {year}
                  </div>
                )}
              </div>

              {loading || loadingServices ? (
                <div className="divide-y animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : eventsForSelectedDay.length > 0 ? (
                <div className="divide-y">
                  {eventsForSelectedDay.map(({ slot, service, member }, idx) => (
                    <div key={`${service.id}-${member.id}-${idx}`} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {slot.time}
                              {slot.endTime ? ` - ${slot.endTime}` : ""}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 mt-0.5">
                              {member.avatarUrl && (
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                              )}
                              <AvatarFallback className="bg-[#e36b35]/10 text-[#e36b35]">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm leading-tight">{service.name}</p>
                                <Badge variant="outline" className="text-[11px]">
                                  {service.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-tight">
                                {member.name}
                              </p>
                              {service.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-semibold">
                            {normalizePrice(service) !== null
                              ? convertAndFormat(
                                normalizePrice(service) as number,
                                service.currency || "EUR"
                              )
                              : "Price varies"}
                          </span>
                          {onNavigateToBooking && (
                            <Button
                              size="sm"
                              className="bg-[#e36b35] hover:bg-[#c55e2c]"
                              onClick={() => handleServiceSlotClick(slot, service, member)}
                            >
                              Book
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Session — in person or online</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="text-sm text-muted-foreground">No sessions for this date.</div>
                  <Separator className="w-1/2" />
                  <div className="text-xs text-muted-foreground">Select another day on the calendar.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
