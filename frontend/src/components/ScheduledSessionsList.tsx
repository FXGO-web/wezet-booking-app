import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, Calendar, ChevronLeft, ChevronRight, Search, Filter, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { availabilityAPI, sessionsAPI } from "../utils/api";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

export function ScheduledSessionsList() {
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState<any[]>([]);
    const [allServices, setAllServices] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<any>(null);

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString("default", { month: "long" });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch all services to have names/templates
                const { services } = await sessionsAPI.getAll();
                setAllServices(services || []);

                // 2. Fetch availability for the current month (system viewpoint)
                const response = await availabilityAPI.getAvailability(year, month);
                const rawSlots = response?.slots || [];
                const members = response?.teamMembers || [];
                setTeamMembers(members);

                // 3. Map slots to a more friendly list format
                const formattedSlots = rawSlots.map((slot: any) => {
                    const service = services?.find((s: any) => String(s.id) === String(slot.template_id));
                    const member = (members as any[])?.find((m: any) => String(m.id) === String(slot.instructor_id));

                    return {
                        id: slot.exception_id || `${slot.date}-${slot.start}-${slot.instructor_id}`,
                        date: slot.date,
                        startTime: slot.start.slice(0, 5),
                        endTime: slot.end ? slot.end.slice(0, 5) : null,
                        instructorName: member ? (member as any).name : "Unknown",
                        instructorId: slot.instructor_id,
                        serviceName: service?.name || "Generic session",
                        serviceId: slot.template_id,
                        source: slot.source || "rule", // rule or exception
                        isException: slot.source === "exception",
                        exception_id: slot.exception_id
                    };
                }).sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date}T${a.startTime}`);
                    const dateB = new Date(`${b.date}T${b.startTime}`);
                    return dateA.getTime() - dateB.getTime();
                });

                setSlots(formattedSlots);
            } catch (error) {
                console.error("Error fetching scheduled sessions:", error);
                toast.error("Failed to load sessions");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentDate, year, month, refreshKey]);

    const handleEdit = (slot: any) => {
        setEditingSlot({
            instructorId: slot.instructorId,
            serviceId: slot.serviceId || "none",
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime || "10:00",
            exception_id: slot.exception_id,
            source: slot.source
        });
        setIsEditOpen(true);
    };

    const handleDelete = async (slot: any) => {
        if (!confirm("Are you sure you want to remove this slot from the calendar?")) return;

        try {
            if (slot.isException && slot.exception_id) {
                await availabilityAPI.deleteException(slot.exception_id);
            } else {
                // Rule: block it by adding a blocking exception
                await availabilityAPI.addException({
                    instructor_id: slot.instructorId,
                    session_template_id: slot.serviceId,
                    date: slot.date,
                    start_time: slot.startTime,
                    end_time: slot.endTime || "23:59",
                    is_available: false
                });
            }
            toast.success("Slot removed successfully");
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            toast.error("Error deleting slot: " + error.message);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingSlot.date || !editingSlot.instructorId) {
            toast.error("Missing required fields");
            return;
        }

        try {
            // Always create/overwrite as an exception
            if (editingSlot.exception_id) {
                await availabilityAPI.deleteException(editingSlot.exception_id);
            }

            await availabilityAPI.addException({
                instructor_id: editingSlot.instructorId,
                session_template_id: editingSlot.serviceId === "none" ? null : editingSlot.serviceId,
                date: editingSlot.date,
                start_time: editingSlot.startTime,
                end_time: editingSlot.endTime,
                is_available: true
            });

            toast.success("Slot updated successfully");
            setIsEditOpen(false);
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            toast.error("Error saving slot: " + error.message);
        }
    };

    const filteredSlots = slots.filter(slot =>
        slot.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.date.includes(searchTerm)
    );

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 2, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month, 1));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Scheduled Sessions (Calendar Slots)</h1>
                    <p className="text-muted-foreground">List of all active booking slots currently visible in the calendar.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setRefreshKey(prev => prev + 1)} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 text-sm font-medium min-w-[120px] text-center">
                            {monthName} {year}
                        </div>
                        <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={() => {
                        setEditingSlot({
                            instructorId: "",
                            serviceId: "none",
                            date: format(new Date(), "yyyy-MM-dd"),
                            startTime: "09:00",
                            endTime: "10:00",
                            is_available: true
                        });
                        setIsEditOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slot
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by session, instructor or date (YYYY-MM-DD)..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Fetching calendar slots for {monthName}...</p>
                        </div>
                    ) : filteredSlots.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">No slots found</h3>
                            <p className="text-muted-foreground">There are no sessions scheduled for this month or matching your search.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Session Template</TableHead>
                                        <TableHead>Instructor</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSlots.map((slot) => (
                                        <TableRow key={slot.id} className="hover:bg-muted/30">
                                            <TableCell className="font-medium">
                                                {new Date(slot.date).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                                <div className="text-[10px] text-muted-foreground font-mono">{slot.date}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono bg-background">
                                                    {slot.startTime} {slot.endTime ? `- ${slot.endTime}` : ""}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{slot.serviceName}</TableCell>
                                            <TableCell>{slot.instructorName}</TableCell>
                                            <TableCell>
                                                <Badge variant={slot.isException ? "default" : "secondary"}>
                                                    {slot.isException ? "Manual Slot" : "Weekly Rule"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(slot)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(slot)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSlot?.exception_id || editingSlot?.source === 'rule' ? "Edit Session Slot" : "Add New Session Slot"}</DialogTitle>
                        <DialogDescription>
                            Configure a specific session time on the calendar.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSlot && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={editingSlot.date}
                                    onChange={(e) => setEditingSlot({ ...editingSlot, date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={editingSlot.startTime}
                                        onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={editingSlot.endTime}
                                        onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Instructor</Label>
                                <Select
                                    value={editingSlot.instructorId}
                                    onValueChange={(val: string) => setEditingSlot({ ...editingSlot, instructorId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select instructor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamMembers.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Service / Template</Label>
                                <Select
                                    value={editingSlot.serviceId || "none"}
                                    onValueChange={(val: string) => setEditingSlot({ ...editingSlot, serviceId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- General --</SelectItem>
                                        {allServices.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                <Filter className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-primary">About this list</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        This list shows all slots generated by the system.
                        <strong>Exceptions</strong>: Manual slots you've created.
                        <strong>Weekly Rules</strong>: Slots automatically repeated based on the instructor's schedule.
                        Editing a Weekly Rule slot will convert it into a manual exception.
                    </p>
                </div>
            </div>
        </div>
    );
}
