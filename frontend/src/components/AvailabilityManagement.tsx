// Trigger Vercel deployment
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  Check,
  X,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { availabilityAPI, sessionsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface SpecificDateSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

interface BlockedDate {
  id: string;
  date: Date;
  reason: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, slots: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
  tuesday: { enabled: true, slots: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
  wednesday: { enabled: true, slots: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
  thursday: { enabled: true, slots: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
  friday: { enabled: true, slots: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export function AvailabilityManagement() {
  const { getAccessToken } = useAuth();
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [specificDateSlots, setSpecificDateSlots] = useState<SpecificDateSlot[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isBlockDateModalOpen, setIsBlockDateModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState<'vacation' | 'sick' | 'personal' | 'other'>('vacation');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("weekly");

  // Handle URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceIdParam = params.get("serviceId");
    const tabParam = params.get("tab");

    if (serviceIdParam) {
      setSelectedService(serviceIdParam);
    }

    if (tabParam && ["weekly", "specific", "blocked"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  // Logger for debugging user identity
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user) {
      console.log('AvailabilityManagement: Current User:', {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role || user.user_metadata?.role
      });
    }
  }, [user, authLoading]);

  // Fetch Team Members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoading(true);
      try {
        const { members } = await availabilityAPI.getTeamMembers();
        setTeamMembers(members || []);
        if (members && members.length > 0) {
          setSelectedMember(members[0].id);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        setTeamMembers([]);
        setSelectedMember('');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);
  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { services } = await sessionsAPI.getAll();
        setServices(services || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);
  // Fetch availability for selected member
  useEffect(() => {
    if (!selectedMember) return;

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const serviceId = selectedService === 'all' ? undefined : selectedService;
        const { schedule, blockedDates: blocked, specificDates } = await availabilityAPI.get(selectedMember, serviceId);
        if (schedule) setWeeklySchedule(schedule);
        if (blocked) setBlockedDates(blocked.map((b: any) => ({ ...b, date: new Date(b.date) })));
        if (specificDates) {
          const validSpecificDates = specificDates
            .map((s: any) => ({
              ...s,
              date: new Date(s.date),
              isAvailable: s.is_available // Map snake_case to camelCase
            }))
            .filter((s: any) => !isNaN(s.date.getTime()));
          setSpecificDateSlots(validSpecificDates);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        // Use defaults
        setWeeklySchedule(DEFAULT_SCHEDULE);
        setBlockedDates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedMember, selectedService]);

  const handleDayToggle = (day: keyof WeeklySchedule) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleAddSlot = (day: keyof WeeklySchedule) => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '17:00',
    };

    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, newSlot],
      },
    }));
  };

  const handleRemoveSlot = (day: keyof WeeklySchedule, slotId: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter(s => s.id !== slotId),
      },
    }));
  };

  const handleSlotChange = (
    day: keyof WeeklySchedule,
    slotId: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map(slot =>
          slot.id === slotId ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const handleCopyDay = (sourceDay: keyof WeeklySchedule) => {
    const sourceDaySchedule = weeklySchedule[sourceDay];

    const updatedSchedule: WeeklySchedule = { ...weeklySchedule };
    DAYS_OF_WEEK.forEach(day => {
      if (day !== sourceDay) {
        updatedSchedule[day] = {
          enabled: sourceDaySchedule.enabled,
          slots: sourceDaySchedule.slots.map(slot => ({
            ...slot,
            id: `${day}-${Date.now()}-${Math.random()}`,
          })),
        };
      }
    });

    setWeeklySchedule(updatedSchedule);
    toast.success(`Copied ${DAY_LABELS[sourceDay]} schedule to all days`);
  };

  const handleSaveSchedule = async () => {
    if (!selectedMember) {
      toast.error('Please select a team member');
      return;
    }

    setSaving(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        toast.error('You must be logged in to save availability');
        return;
      }

      const serviceId = selectedService === 'all' ? undefined : selectedService;

      // Sanitize weekly schedule: remove temporary IDs
      const sanitizedSchedule: any = { ...weeklySchedule };
      Object.keys(sanitizedSchedule).forEach((day) => {
        const d = day as keyof WeeklySchedule;
        sanitizedSchedule[d] = {
          ...sanitizedSchedule[d],
          slots: sanitizedSchedule[d].slots.map((slot: any) => {
            const isTempId = !slot.id || !String(slot.id).includes('-');
            if (isTempId) {
              const { id, ...rest } = slot;
              return rest;
            }
            return slot;
          }),
        };
      });

      await availabilityAPI.updateSchedule(selectedMember, sanitizedSchedule, accessToken, serviceId);

      // Also save specific dates (even if empty, to clear deletions)
      const validSlots = specificDateSlots
        .filter((s) => s.date && !isNaN(s.date.getTime()))
        .map((s) => {
          const isTempId = !s.id || !String(s.id).includes('-');
          const slotData = {
            ...s,
            date: format(s.date, 'yyyy-MM-dd'),
          };
          if (isTempId) {
            const { id, ...rest } = slotData;
            return rest;
          }
          return slotData;
        });

      await availabilityAPI.updateSpecificDates(
        selectedMember,
        validSlots,
        accessToken,
        serviceId
      );

      toast.success('Availability saved successfully!');
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(`Failed to save schedule: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    if (!blockReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setSaving(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        toast.error('You must be logged in');
        return;
      }

      const newBlocked: BlockedDate[] = selectedDates.map(date => ({
        id: Date.now().toString() + Math.random(),
        date,
        reason: blockReason,
        type: blockType,
      }));

      await availabilityAPI.blockDates(
        selectedMember,
        newBlocked.map(b => ({ date: b.date.toISOString(), reason: b.reason, type: b.type }))
      );

      setBlockedDates(prev => [...prev, ...newBlocked]);
      setSelectedDates([]);
      setBlockReason('');
      setIsBlockDateModalOpen(false);
      toast.success(`Blocked ${newBlocked.length} date(s) successfully`);
    } catch (error) {
      console.error('Error blocking dates:', error);
      toast.error('Failed to block dates');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockDate = async (id: string) => {
    setSaving(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        toast.error('You must be logged in');
        return;
      }

      await availabilityAPI.unblockDate(selectedMember, id);
      setBlockedDates(prev => prev.filter(b => b.id !== id));
      toast.success('Date unblocked successfully');
    } catch (error) {
      console.error('Error unblocking date:', error);
      toast.error('Failed to unblock date');
    } finally {
      setSaving(false);
    }
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-100 text-blue-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'personal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddSpecificDateSlot = (date: Date) => {
    let duration = 60;
    if (selectedService && selectedService !== 'all') {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        duration = service.duration_minutes || service.duration || 60;
      }
    }

    const startTime = '09:00';
    const [h, m] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(h, m + duration, 0, 0);
    const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const newSlot: SpecificDateSlot = {
      id: Date.now().toString(),
      date,
      startTime,
      endTime,
    };
    setSpecificDateSlots(prev => [...prev, newSlot]);
    toast.success(`Added slot for ${format(date, 'MMM d')}`);
  };

  const handleRemoveSpecificDateSlot = (id: string) => {
    setSpecificDateSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleSpecificDateSlotChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setSpecificDateSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  if (loading && !selectedMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1>Availability Management</h1>
            <p className="text-muted-foreground">
              Configure weekly schedules, blocked dates & time slots
            </p>
          </div>
          <Button onClick={handleSaveSchedule} disabled={saving || !selectedMember}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>

        {/* Team Member Selector */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>Select Team Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Selector */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>Select Service (Optional)</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services (Global Availability)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services (Global Availability)</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Set availability specific to a service, or leave as "All Services" for general availability.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="weekly">
              <Clock className="h-4 w-4 mr-2" />
              Weekly Schedule
            </TabsTrigger>
            <TabsTrigger value="specific">
              <CalendarDays className="h-4 w-4 mr-2" />
              Specific Dates
            </TabsTrigger>
            <TabsTrigger value="blocked">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Blocked Dates
            </TabsTrigger>
          </TabsList>

          {/* Weekly Schedule Tab */}
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recurring Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={weeklySchedule[day].enabled}
                          onCheckedChange={() => handleDayToggle(day)}
                        />
                        <Label className="text-base font-medium">
                          {DAY_LABELS[day]}
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyDay(day)}
                          disabled={!weeklySchedule[day].enabled}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy to All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSlot(day)}
                          disabled={!weeklySchedule[day].enabled}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Slot
                        </Button>
                      </div>
                    </div>

                    {weeklySchedule[day].enabled && (
                      <div className="space-y-2 pl-11">
                        {weeklySchedule[day].slots.map(slot => (
                          <div key={slot.id} className="flex items-center gap-3">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                handleSlotChange(day, slot.id, 'startTime', e.target.value)
                              }
                              className="w-32"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                handleSlotChange(day, slot.id, 'endTime', e.target.value)
                              }
                              className="w-32"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSlot(day, slot.id)}
                              disabled={weeklySchedule[day].slots.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specific Dates Tab */}
          <TabsContent value="specific" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Dates</CardTitle>
                  <CardDescription>Click a date to add a specific time slot</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    onSelect={(date: Date | undefined) => date && handleAddSpecificDateSlot(date)}
                    className="rounded-md border"
                    disabled={(date: Date) => date < new Date()}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Specific Date Slots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Added Slots Section (Only show active additions) */}
                  <div className="space-y-4">
                    {specificDateSlots.filter(s => s.isAvailable !== false).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-8">
                        No extra slots added. Used to add specific sessions on top of weekly schedule.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {specificDateSlots
                          .filter(s => s.isAvailable !== false)
                          .sort((a, b) => a.date.getTime() - b.date.getTime())
                          .map(slot => {
                            if (isNaN(slot.date.getTime())) return null;
                            return (
                              <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50">
                                <div className="space-y-1">
                                  <div className="font-medium">{format(slot.date, 'MMM d, yyyy')}</div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => handleSpecificDateSlotChange(slot.id, 'startTime', e.target.value)}
                                      className="w-24 h-8"
                                    />
                                    <span>-</span>
                                    <Input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => handleSpecificDateSlotChange(slot.id, 'endTime', e.target.value)}
                                      className="w-24 h-8"
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSpecificDateSlot(slot.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* 
                      NOTE: Blocked slots (isAvailable: false) are part of specificDateSlots state 
                      but are HIDDEN from the UI as per user request ("Nada de bloqueos"). 
                      They will be preserved and sent back to API on save because handleSaveSchedule 
                      uses the full specificDateSlots array.
                  */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Blocked Dates Tab */}
          <TabsContent value="blocked" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Blocked Dates & Vacations</CardTitle>
                  <Button onClick={() => setIsBlockDateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Block Dates
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {blockedDates.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      No blocked dates. Click "Block Dates" to add vacations or unavailable periods.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedDates
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map(blocked => (
                        <div
                          key={blocked.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(blocked.date, 'MMMM d, yyyy')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {blocked.reason}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getBlockTypeColor(blocked.type)}>
                              {blocked.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnblockDate(blocked.id)}
                              disabled={saving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Block Dates Modal */}
      <Dialog open={isBlockDateModalOpen} onOpenChange={setIsBlockDateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Block Dates</DialogTitle>
            <DialogDescription>
              Select dates to block and provide a reason (vacation, sick leave, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates: Date[] | undefined) => setSelectedDates(dates || [])}
                className="rounded-md border"
                disabled={(date: Date) => date < new Date()}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason Type</Label>
                <Select value={blockType} onValueChange={(v: any) => setBlockType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason / Notes</Label>
                <Input
                  placeholder="e.g., Summer vacation in Bali"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
            </div>

            {selectedDates.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected {selectedDates.length} date(s):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.slice(0, 5).map((date, idx) => (
                    <Badge key={idx} variant="secondary">
                      {format(date, 'MMM d')}
                    </Badge>
                  ))}
                  {selectedDates.length > 5 && (
                    <Badge variant="outline">+{selectedDates.length - 5} more</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBlockDates} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Blocking...
                </>
              ) : (
                'Block Dates'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
