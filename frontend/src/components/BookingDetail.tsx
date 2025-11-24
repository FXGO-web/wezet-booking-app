import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Save, User, Calendar as CalendarIcon, Clock, MapPin, CreditCard } from "lucide-react";

export function BookingDetail() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1>Booking Details</h1>
          <p className="text-muted-foreground">
            View and manage booking information and status
          </p>
        </div>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-base">John Doe</h3>
                <p className="text-sm text-muted-foreground">john.doe@email.com</p>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="teamMember">Team Member</Label>
                <Select defaultValue="sarah">
                  <SelectTrigger id="teamMember">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah">Sarah Chen</SelectItem>
                    <SelectItem value="marcus">Marcus Rodriguez</SelectItem>
                    <SelectItem value="emma">Emma Wilson</SelectItem>
                    <SelectItem value="lisa">Lisa Thompson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select defaultValue="breathwork">
                  <SelectTrigger id="service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breathwork">Transformational Breathwork</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                    <SelectItem value="bodywork">Somatic Bodywork</SelectItem>
                    <SelectItem value="coaching">Life Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" defaultValue="2025-11-25" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" defaultValue="10:00" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select defaultValue="studio-a">
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio-a">Studio A - Main Space</SelectItem>
                    <SelectItem value="studio-b">Studio B - Quiet Room</SelectItem>
                    <SelectItem value="online">Online - Zoom</SelectItem>
                    <SelectItem value="external">External Venue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="confirmed">
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-base px-4 py-1.5">
                    EUR €150.00
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Paid
                </Badge>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Payment Method</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Visa ending in 4242</span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Transaction ID</Label>
                <Input
                  defaultValue="ch_3MtwBwLkdIwHu7ix0snN0B15"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              placeholder="Add any special notes or instructions for this booking..."
              defaultValue="Client requested a focus on releasing anxiety and stress. First-time breathwork session."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button variant="outline" className="sm:w-auto">
            Send Reminder Email
          </Button>
        </div>
      </div>
    </div>
  );
}