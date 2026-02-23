import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, Calendar, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { availabilityAPI, sessionsAPI } from "../utils/api";
import { format } from "date-fns";
import { Input } from "./ui/input";

export function ScheduledSessionsList() {
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState<any[]>([]);
    const [allServices, setAllServices] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");

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

                // 3. Map slots to a more friendly list format
                const formattedSlots = rawSlots.map((slot: any) => {
                    const service = services?.find((s: any) => String(s.id) === String(slot.template_id));
                    const member = (members as any[])?.find((m: any) => String(m.id) === String(slot.instructor_id));

                    return {
                        id: `${slot.date}-${slot.start}-${slot.instructor_id}`,
                        date: slot.date,
                        startTime: slot.start.slice(0, 5),
                        endTime: slot.end ? slot.end.slice(0, 5) : null,
                        instructorName: member?.name || "Unknown",
                        serviceName: service?.name || "Generic session",
                        source: slot.source || "rule", // rule or exception
                        isException: slot.source === "exception"
                    };
                }).sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date}T${a.startTime}`);
                    const dateB = new Date(`${b.date}T${b.startTime}`);
                    return dateA.getTime() - dateB.getTime();
                });

                setSlots(formattedSlots);
            } catch (error) {
                console.error("Error fetching scheduled sessions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentDate, year, month]);

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
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[140px] text-center font-medium">
                        {monthName} {year}
                    </div>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                        <ChevronRight className="h-4 w-4" />
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
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Session Template</TableHead>
                                        <TableHead>Instructor</TableHead>
                                        <TableHead>Source</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSlots.map((slot) => (
                                        <TableRow key={slot.id}>
                                            <TableCell className="font-medium">
                                                {new Date(slot.date).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {slot.startTime} {slot.endTime ? `- ${slot.endTime}` : ""}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{slot.serviceName}</TableCell>
                                            <TableCell>{slot.instructorName}</TableCell>
                                            <TableCell>
                                                <Badge variant={slot.isException ? "default" : "secondary"}>
                                                    {slot.isException ? "Manual Slot" : "Weekly Rule"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
                <Filter className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-primary">About this list</p>
                    <p className="text-muted-foreground">
                        This list shows all slots generated by the system. If a session should appear in March but is not in this list,
                        check the <strong>Availability Management</strong> to ensure the weekly rules cover March or that specific exceptions have been added.
                    </p>
                </div>
            </div>
        </div>
    );
}
