import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, MapPin, Calendar } from "lucide-react";

interface ProgramsRetreatsProps {
    onBack?: () => void;
}

export function ProgramsRetreats({ onBack }: ProgramsRetreatsProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <Button variant="ghost" size="sm" onClick={onBack}>
                                    ← Back
                                </Button>
                            )}
                            <h1 className="text-3xl font-bold">Programs & Retreats</h1>
                        </div>
                        <p className="text-muted-foreground ml-20">
                            Manage your multi-day retreats and educational sequences
                        </p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New
                    </Button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Placeholder Card 1 */}
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-4">
                            <div className="h-48 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                                <MapPin className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <CardTitle className="flex items-start justify-between">
                                <span>Bali Wellness Retreat</span>
                                <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                                    Draft
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Oct 15 - Oct 22, 2025</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>Ubud, Bali</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Empty State / Placeholder */}
                    <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium">Create New Program</h3>
                            <p className="text-sm text-muted-foreground">
                                Add a new retreat or educational sequence
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
