import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Sparkles, Calendar, Star, Award } from "lucide-react";
import { TEAM_MEMBERS } from "./team-data";

export function TeamDirectory() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1>Meet Our Team</h1>
          <p className="text-muted-foreground max-w-2xl">
            Meet our experienced practitioners who guide your wellness journey with expertise, 
            compassion, and transformational practices.
          </p>
        </div>

        {/* Stats Banner */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <p className="text-3xl">{TEAM_MEMBERS.length}</p>
                <p className="text-sm text-muted-foreground">Expert Practitioners</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl">15+</p>
                <p className="text-sm text-muted-foreground">Years Combined Experience</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl">500+</p>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-3xl">4.9</p>
                  <Star className="h-6 w-6 text-primary fill-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TEAM_MEMBERS.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-xl transition-all">
              <CardContent className="p-0">
                <div className="p-8 space-y-6">
                  {/* Team Member Header */}
                  <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24 flex-shrink-0">
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <h2 className="text-xl">{member.name}</h2>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      
                      {member.bio && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Specialties */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-medium">Specialties</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button className="flex-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Calendar
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Book Session
                    </Button>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">Sessions</p>
                      <p className="text-lg">120+</p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-lg">4.9</p>
                        <Star className="h-4 w-4 text-primary fill-primary" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">Reviews</p>
                      <p className="text-lg">45</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-12 text-center space-y-6">
            <div className="space-y-3">
              <h2>Ready to Begin Your Journey?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose a team member and book your first session to experience transformational 
                wellness practices tailored to your needs.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Book Your First Session
              </Button>
              <Button size="lg" variant="outline">
                Learn More About Our Services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
