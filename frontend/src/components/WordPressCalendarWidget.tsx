import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from "lucide-react";

interface Session {
  id: string;
  title: string;
  teacher: string;
  date: Date;
  time: string;
  available: boolean;
}

const upcomingSessions: Session[] = [
  {
    id: "1",
    title: "Breathwork - Individual",
    teacher: "Hanna",
    date: new Date(2025, 10, 25),
    time: "10:00",
    available: true,
  },
  {
    id: "2",
    title: "Bodywork Session",
    teacher: "Saszeline",
    date: new Date(2025, 10, 25),
    time: "14:00",
    available: true,
  },
  {
    id: "3",
    title: "Group Breathwork",
    teacher: "Paco",
    date: new Date(2025, 10, 26),
    time: "16:00",
    available: true,
  },
  {
    id: "4",
    title: "Coaching Session",
    teacher: "Sami",
    date: new Date(2025, 10, 27),
    time: "09:00",
    available: true,
  },
  {
    id: "5",
    title: "Breathwork - Individual",
    teacher: "Hanna",
    date: new Date(2025, 10, 28),
    time: "11:00",
    available: false,
  },
];

export function WordPressCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));

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

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const hasSession = upcomingSessions.some(
      (s) => s.date.toDateString() === date.toDateString()
    );
    const isToday = date.toDateString() === new Date().toDateString();

    days.push(
      <button
        key={day}
        className={`
          aspect-square rounded-lg flex items-center justify-center text-sm transition-colors relative
          ${hasSession ? "bg-primary/10 text-primary font-medium hover:bg-primary/20" : "hover:bg-muted"}
          ${isToday ? "ring-2 ring-primary" : ""}
        `}
      >
        {day}
        {hasSession && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
        )}
      </button>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Book a Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={previousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div
                key={`day-${index}`}
                className="text-xs text-center text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            {days}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="space-y-3">
          <h4 className="text-sm">Next Available Sessions</h4>
          <div className="space-y-2">
            {upcomingSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className={`
                  p-3 rounded-lg border text-xs space-y-2 transition-all
                  ${session.available ? "bg-card hover:shadow-md cursor-pointer" : "bg-muted/50 opacity-60"}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium line-clamp-1">{session.title}</p>
                  {session.available ? (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Full
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {session.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{session.teacher}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Full Calendar */}
        <Button className="w-full" size="sm">
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}