import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronLeft, ChevronRight, Clock, Sparkles, Loader2, ArrowRight, MapPin, Calendar, Video, Package, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { availabilityAPI, programsAPI, productsAPI, sessionsAPI, categoriesAPI } from "../utils/api";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

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
  fixedPrices?: Record<string, number> | null;
}

interface TimeSlot {
  time: string;
  dateTime: string;
  endTime?: string;
  duration?: number;
  available: boolean;
  services: Service[];
  source?: 'rule' | 'exception';
  exception_id?: string;
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
  initialCategory?: string;
  isEmbedded?: boolean;
}

export function PublicCalendar({ onNavigateToBooking, onNavigateToProgram, onNavigateToProduct, initialCategory, isEmbedded }: PublicCalendarProps) {
  const { convertAndFormat, formatFixedPrice } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);

  console.log(`Render PublicCalendar. allServices count: ${allServices.length}`);

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter state
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory || null);

  // Admin / Edit Mode State
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    instructorId: "",
    serviceId: "",
    startTime: "09:00",
    endTime: "10:00",
    date: ""
  });

  useEffect(() => {
    if (user) {
      const email = user.email?.toLowerCase() || "";
      const role = user.user_metadata?.role?.toLowerCase();
      const isAdminEmail = email.includes("admin") ||
        email.includes("fx@fxcreativestudio.com") ||
        email === "contact@mroffbeat.com" ||
        email === "hanna@wezet.xyz";

      setIsAdmin(role === "admin" || isAdminEmail);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleAddSlot = async () => {
    if (!newSlot.instructorId || !newSlot.date) {
      toast.error("Please select an instructor and date");
      return;
    }

    try {
      console.log("Adding slot:", newSlot);
      const serviceIdToSend = (!newSlot.serviceId || newSlot.serviceId === "none") ? null : newSlot.serviceId;
      console.log("Service ID being sent:", serviceIdToSend);

      const result = await availabilityAPI.addException({
        instructor_id: newSlot.instructorId,
        session_template_id: serviceIdToSend,
        date: newSlot.date,
        start_time: newSlot.startTime,
        end_time: newSlot.endTime,
        is_available: true
      });

      console.log("Slot added result:", result);

      if (!result) {
        // Fallback check if result is unexpectedly null but no error thrown
        console.warn("API returned empty result checking for success...");
      }

      toast.success("Slot added successfully");
      setIsAddSlotOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Error adding slot:", error);
      toast.error(`Failed to add slot: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteSlot = async (slot: TimeSlot, instructorId?: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    // We need an instructor ID. 
    // If the slot has multiple services, it might have multiple instructors.
    // The UI renders buttons per (Service + Instructor). 
    // So we should pass the specific instructor ID from the button click context.

    const targetInstructorId = instructorId || (slot.services[0]?.availableWith[0]?.id);

    if (!targetInstructorId) {
      toast.error("Could not identify instructor for this slot");
      return;
    }

    try {
      // Ensure date is YYYY-MM-DD
      const dateOnly = slot.dateTime.includes('T') ? slot.dateTime.split('T')[0] : slot.dateTime;

      console.log("handleDeleteSlot Called. Slot:", slot);
      console.log("Target Instructor ID:", targetInstructorId);
      console.log("Calculated DateOnly:", dateOnly);

      console.log("Deleting slot with data:", {
        instructor_id: targetInstructorId,
        date: dateOnly,
        start_time: slot.time,
        end_time: slot.endTime,
        original_dateTime: slot.dateTime
      });

      // Check if this is an exception (manually added slot) or a weekly rule
      // We assume the slot object now carries this metadata from get_month_calendar
      // The slot object structure in PublicCalendar comes from parsing the API response.
      // We need to ensure we are preserving the 'source' and 'exception_id' in the parsing logic.
      // Let's assume slot has these properties merged in.

      const slotSource = (slot as any).source;
      const slotExceptionId = (slot as any).exception_id;

      if (slotSource === 'exception' && slotExceptionId) {
        console.log("Deleting EXISTING EXCEPTION (removing row):", slotExceptionId);
        await availabilityAPI.deleteException(slotExceptionId);
      } else {
        console.log("Blocking WEEKLY RULE (adding block exception)");
        await availabilityAPI.addException({
          instructor_id: targetInstructorId,
          // If the slot is associated with a specific service (not generic), we should block that service specifically.
          // This ensures AvailabilityManagement filtering by service sees the block.
          // If it's generic, we block generic (null).
          session_template_id: (slot.services?.[0]?.id && !slot.services[0].id.startsWith('generic-'))
            ? slot.services[0].id
            : null,
          date: dateOnly,
          start_time: slot.time,
          end_time: slot.endTime || computeEndTime(slot.time, 60),
          is_available: false // BLOCK IT
        });
      }

      toast.success("Slot removed");
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot");
    }
  };

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

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
        if (response?.debug_exceptions) {
          console.log("DEBUG EXCEPTIONS FROM BACKEND:", response.debug_exceptions);
        }
        console.log("DEBUG: Fetched availability:", { year, month, rawSlots, members });
        setTeamMembers(members);

        let currentAvailability: Record<number, any> = {};

        rawSlots.forEach((slot: any) => {
          let sYear, sMonth, day;
          if (slot.date && slot.date.includes('-')) {
            const parts = slot.date.split('T')[0].split('-');
            sYear = parseInt(parts[0], 10);
            sMonth = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
          } else {
            const slotDate = new Date(slot.date);
            sYear = slotDate.getFullYear();
            sMonth = slotDate.getMonth() + 1;
            day = slotDate.getDate();
          }

          // Ensure we are in the correct month
          if (sMonth !== month || sYear !== year) return;
          const time = slot.start.slice(0, 5); // HH:MM

          if (!currentAvailability[day]) {
            currentAvailability[day] = {
              hasAvailability: true,
              slots: []
            };
          }

          // Find applicable services
          let applicableServices: any[] = [];

          if (slot.template_id) {
            const s = allServices.find((s: any) => String(s.id) === String(slot.template_id));
            if (s) {
              applicableServices.push(s);
            } else {
              console.warn(`Slot ${slot.date} ${slot.start} has template_id ${slot.template_id} but service not found in allServices (count: ${allServices.length})`);
            }
          } else {
            // Generic slot: find all services for this instructor
            applicableServices = allServices.filter((s: any) =>
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
            // FILTER BY CATEGORY IF ACTIVE
            if (activeCategory && serviceDetails) {
              const catName = typeof serviceDetails.category === 'object' ? serviceDetails.category?.name : (serviceDetails.category || "General");

              if (catName?.toLowerCase() !== activeCategory.toLowerCase()) {
                // console.log(`Skipping service ${serviceDetails.name} (Cat: ${catName}) due to filter ${activeCategory}`);
                return;
              }
            }
            // If we are filtering by category and this is a generic fallback (serviceDetails is null), we should probably skip it 
            // OR we risk showing generic slots for correct category queries if we are not careful.
            // Safe bet: if filtering, only show matched services.
            if (activeCategory && !serviceDetails) {
              console.log("Skipping generic slot because activeCategory is set:", activeCategory);
              return;
            }


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
                services: [],
                source: slot.source,
                exception_id: slot.exception_id
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
                availableWith: [],
                fixedPrices: serviceDetails.fixed_prices || serviceDetails.fixedPrices || null
              }
              : {
                id: `generic-${day}-${time}`,
                name: "Session",
                duration: 60,
                basePrice: null,
                currency: "EUR",
                category: "General",
                availableWith: [],
                fixedPrices: null
              };

            // Deduplication Logic:
            // 1. If we are adding a specific service, remove any existing generic services from this slot.
            if (serviceDetails) {
              timeSlot.services = timeSlot.services.filter((s: Service) => !s.id.startsWith('generic-'));
            }

            // 2. If we are adding a generic service, but the slot already has specific services, SKIP adding this generic one.
            if (!serviceDetails && timeSlot.services.some((s: Service) => !s.id.startsWith('generic-'))) {
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

        // Clean up empty slots/days after filtering
        Object.keys(currentAvailability).forEach(dayKey => {
          const d = Number(dayKey);
          currentAvailability[d].slots = currentAvailability[d].slots.filter((s: TimeSlot) => s.services.length > 0);
          if (currentAvailability[d].slots.length === 0) {
            delete currentAvailability[d];
          }
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
  }, [currentDate, allServices, activeCategory, refreshKey]);

  // Debug Availability State changes
  useEffect(() => {
    if (availability) {
      const days = Object.keys(availability).map(Number).sort((a, b) => a - b);
      console.log("Availability Updated. Days with slots:", days);
      days.forEach(d => {
        console.log(`Day ${d}: ${availability[d].slots.length} slots`);
      });
    } else {
      console.log("Availability Updated: null");
    }
  }, [availability]);



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
        console.log("Fetching services...");
        const { services } = await sessionsAPI.getAll();
        console.log("Fetched services:", services?.length);

        if (services?.length > 0) {
          console.log("Loaded Service IDs:", services.map((s: any) => `${s.id} (${s.name})`));
        } else if (!services || services.length === 0) {
          console.warn("Warning: No services returned from API");
          // Only show toast if we expected services and got none (optional, might be annoying if truly empty)
          // toast.error("Warning: No services loaded. Calendar may be empty."); 
        }

        setAllServices(services || []);
      } catch (error: any) {
        console.error("Failed to fetch services:", error);
        toast.error(`System Error: Failed to load services. ${error.message || error}`);
      }
    };
    fetchServices();
  }, []);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { categories } = await categoriesAPI.getAll();
        setCategories(categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
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

    // Get current real date to filter out past days
    const now = new Date();
    const currentRealMonth = now.getMonth() + 1;
    const currentRealYear = now.getFullYear();
    const currentRealDay = now.getDate();

    const slots: { day: number; slot: TimeSlot }[] = [];

    Object.keys(availability)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((day) => {
        // Filter out past days if we are looking at the current month/year
        if (year === currentRealYear && month === currentRealMonth && day < currentRealDay) {
          return;
        }

        // Also don't show availability for past months (though API should handle this, safety check)
        if (year < currentRealYear || (year === currentRealYear && month < currentRealMonth)) {
          return;
        }

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
    <div className={`min-h-screen bg-background ${isEmbedded ? 'p-0' : 'p-6 md:p-12'}`}>
      <div className={`${isEmbedded ? 'w-full' : 'max-w-7xl mx-auto'} space-y-6 md:space-y-12`}>
        {/* Header - Hidden in Embed Mode */}
        {!isEmbedded && (
          <div className="space-y-4">
            <h1 className="text-3xl font-medium tracking-tight capitalize">
              {activeCategory ? `${activeCategory} Sessions` : "Book a Session"}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Explore our programs, digital products, and book a session with our team.
            </p>
          </div>
        )}



        {/* 2. Available Sessions (Calendar) */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>Available Sessions</h2>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground capitalize">
                {activeCategory
                  ? `Sessions for ${activeCategory}`
                  : "Select a date and time to book a session"}
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={activeCategory || "all"}
                  onValueChange={(val: string) => setActiveCategory(val === "all" ? null : val)}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

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

                      const now = new Date();
                      const currentRealMonth = now.getMonth() + 1;
                      const currentRealYear = now.getFullYear();
                      const currentRealDay = now.getDate();

                      const isPast = (year < currentRealYear) ||
                        (year === currentRealYear && (currentDate.getMonth() + 1) < currentRealMonth) ||
                        (year === currentRealYear && (currentDate.getMonth() + 1) === currentRealMonth && day < currentRealDay);

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
                <CardTitle className="text-base flex justify-between items-center">
                  <span>{selectedDay ? `${monthName} ${selectedDay}, ${year}` : "Upcoming Sessions"}</span>
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => {
                      // If selected day, prefill. Else, maybe default to today?
                      if (selectedDay) {
                        const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
                        const dayStr = String(selectedDay).padStart(2, '0');
                        setNewSlot(prev => ({ ...prev, date: `${year}-${monthStr}-${dayStr}` }));
                      } else {
                        // Default to today
                        const now = new Date();
                        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
                        const dayStr = String(now.getDate()).padStart(2, '0');
                        setNewSlot(prev => ({ ...prev, date: `${now.getFullYear()}-${monthStr}-${dayStr}` }));
                      }
                      setIsAddSlotOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                  )}
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
                                        className="w-full relative group"
                                      >
                                        <div
                                          onClick={() => handleServiceSlotClick(slot, service, member)}
                                          className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary hover:shadow-md transition-all text-left"
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
                                                    ? formatFixedPrice(
                                                      service.fixedPrices || null,
                                                      normalizePrice(service) as number,
                                                      service.currency || "EUR"
                                                    )
                                                    : "Price varies"}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {isAdmin && (
                                          <div
                                            className="absolute top-2 right-2 z-10 p-2 cursor-pointer bg-red-100 hover:bg-red-200 rounded-full text-red-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteSlot(slot, member.id);
                                            }}
                                            title="Remover disponibilidad (Admin)"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </div>
                                        )}
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
                                            className="w-full relative group"
                                          >
                                            <div
                                              onClick={() => handleServiceSlotClick(slot, service, member, day)}
                                              className="p-3 rounded-xl bg-card border hover:border-primary hover:shadow-md transition-all text-left"
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
                                                        ? formatFixedPrice(
                                                          service.fixedPrices || null,
                                                          normalizePrice(service) as number,
                                                          service.currency || "EUR"
                                                        )
                                                        : "Price varies"}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            {isAdmin && (
                                              <div
                                                className="absolute top-2 right-2 z-10 p-2 cursor-pointer bg-red-100 hover:bg-red-200 rounded-full text-red-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteSlot(slot, member.id);
                                                }}
                                                title="Remover disponibilidad (Admin)"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </div>
                                            )}
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
                          {formatFixedPrice(product.fixed_prices || product.fixedPrices, product.price || 0, product.currency || "EUR")}
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

      <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Create a one-off availability slot for a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service">Service (Optional)</Label>
              <Select
                value={newSlot.serviceId}
                onValueChange={(val: string) => setNewSlot({ ...newSlot, serviceId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- General Availability --</SelectItem>
                  {allServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructor">Team Member</Label>
              <Select
                value={newSlot.instructorId}
                onValueChange={(val: string) => setNewSlot({ ...newSlot, instructorId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSlotOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSlot}>Save Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
