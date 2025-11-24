import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Plus, Trash2, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "./ui/badge";

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  location: "studio" | "online";
}

interface DayAvailability {
  day: string;
  blocks: TimeBlock[];
}

interface BlackoutDate {
  id: string;
  date: Date;
  reason: string;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function AvailabilityEditor() {
  const [availability, setAvailability] = useState<DayAvailability[]>(
    daysOfWeek.map((day) => ({ day, blocks: [] }))
  );

  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([
    {
      id: "1",
      date: new Date(2025, 11, 24),
      reason: "Christmas Eve",
    },
    {
      id: "2",
      date: new Date(2025, 11, 25),
      reason: "Christmas Day",
    },
  ]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const addTimeBlock = (dayIndex: number) => {
    const newBlock: TimeBlock = {
      id: `${Date.now()}`,
      startTime: "09:00",
      endTime: "17:00",
      location: "studio",
    };

    setAvailability((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, blocks: [...day.blocks, newBlock] }
          : day
      )
    );
  };

  const removeTimeBlock = (dayIndex: number, blockId: string) => {
    setAvailability((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, blocks: day.blocks.filter((b) => b.id !== blockId) }
          : day
      )
    );
  };

  const updateTimeBlock = (
    dayIndex: number,
    blockId: string,
    field: keyof TimeBlock,
    value: string
  ) => {
    setAvailability((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              blocks: day.blocks.map((block) =>
                block.id === blockId ? { ...block, [field]: value } : block
              ),
            }
          : day
      )
    );
  };

  const addBlackoutDate = () => {
    if (selectedDate) {
      const newBlackout: BlackoutDate = {
        id: `${Date.now()}`,
        date: selectedDate,
        reason: "",
      };
      setBlackoutDates([...blackoutDates, newBlackout]);
      setSelectedDate(undefined);
    }
  };

  const removeBlackoutDate = (id: string) => {
    setBlackoutDates(blackoutDates.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 space-y-12">
        {/* Header */}
        <div>
          <h1>Set Your Weekly Availability</h1>
          <p className="text-muted-foreground mt-2">
            Define when you're available for sessions
          </p>
        </div>

        {/* Weekly Grid */}
        <div className="space-y-4">
          {availability.map((dayAvail, dayIndex) => (
            <Card key={dayAvail.day}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <h3>{dayAvail.day}</h3>
                    <Button
                      onClick={() => addTimeBlock(dayIndex)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Availability
                    </Button>
                  </div>

                  {/* Time Blocks */}
                  {dayAvail.blocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No availability set for this day
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dayAvail.blocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-end gap-4 p-4 rounded-xl border bg-muted/50"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                            {/* Start Time */}
                            <div className="space-y-2">
                              <Label>Start Time</Label>
                              <Input
                                type="time"
                                value={block.startTime}
                                onChange={(e) =>
                                  updateTimeBlock(
                                    dayIndex,
                                    block.id,
                                    "startTime",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            {/* End Time */}
                            <div className="space-y-2">
                              <Label>End Time</Label>
                              <Input
                                type="time"
                                value={block.endTime}
                                onChange={(e) =>
                                  updateTimeBlock(
                                    dayIndex,
                                    block.id,
                                    "endTime",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                              <Label>Location</Label>
                              <Select
                                value={block.location}
                                onValueChange={(value) =>
                                  updateTimeBlock(
                                    dayIndex,
                                    block.id,
                                    "location",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="studio">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Studio
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="online">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      Online
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            onClick={() => removeTimeBlock(dayIndex, block.id)}
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Blackout Dates Section */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2>Blackout Dates / Exceptions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Mark dates when you're unavailable
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar Picker */}
              <div className="space-y-4">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl border"
                />
                <Button
                  onClick={addBlackoutDate}
                  disabled={!selectedDate}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Blackout Date
                </Button>
              </div>

              {/* Blackout Dates List */}
              <div className="space-y-3">
                <Label>Scheduled Blackout Dates</Label>
                {blackoutDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No blackout dates set
                  </p>
                ) : (
                  <div className="space-y-2">
                    {blackoutDates.map((blackout) => (
                      <div
                        key={blackout.id}
                        className="flex items-center justify-between p-4 rounded-xl border bg-card"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {blackout.date.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {blackout.reason && (
                            <p className="text-sm text-muted-foreground">
                              {blackout.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => removeBlackoutDate(blackout.id)}
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button>Save Availability</Button>
        </div>
      </div>
    </div>
  );
}
