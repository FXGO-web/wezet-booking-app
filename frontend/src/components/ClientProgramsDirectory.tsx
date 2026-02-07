import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import {
    MapPin,
    Calendar,
    Loader2,
    ArrowRight,
    Info
} from "lucide-react";
import { programsAPI } from "../utils/api";
import { useCurrency } from "../context/CurrencyContext";

interface ClientProgramsDirectoryProps {
    onNavigate?: (route: string) => void;
    onSelectProgram?: (programId: string) => void;
    onBack?: () => void;
}

export function ClientProgramsDirectory({ onNavigate, onSelectProgram, onBack }: ClientProgramsDirectoryProps) {
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { convertAndFormat } = useCurrency();

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                setLoading(true);
                const data = await programsAPI.getAll();
                if (data && data.programs) {
                    // Filter for active/published programs only
                    const activePrograms = data.programs.filter((p: any) => p.is_active);
                    setPrograms(activePrograms);
                }
            } catch (error) {
                console.error("Failed to fetch programs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrograms();
    }, []);

    const handleProgramClick = (program: any) => {
        if (onSelectProgram) {
            onSelectProgram(program.id);
        } else if (onNavigate) {
            // Fallback if no specific handler
            onNavigate('program-checkout');
        }
    };

    if (loading) {
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
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="sm" onClick={onBack} className="pl-0 hover:pl-2 transition-all">
                                ← Back
                            </Button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Programs & Retreats</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Immerse yourself in our curated multi-day experiences designed for deep transformation and learning.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {programs.length > 0 ? (
                        programs.map((program) => (
                            <Card
                                key={program.id}
                                className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full border-border/50 hover:border-primary/20 overflow-hidden"
                            >
                                {/* Image Placeholder or Actual Image */}
                                <div className="h-48 w-full bg-muted/50 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                                    {program.image_url ? (
                                        <img
                                            src={program.image_url}
                                            alt={program.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-secondary/30">
                                            <MapPin className="h-12 w-12 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-background/80 backdrop-blur text-foreground hover:bg-background">
                                            {program.category?.name || "Retreat"}
                                        </Badge>
                                    </div>
                                </div>

                                <CardHeader className="pb-3">
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                        {program.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span>
                                            {(program.location && typeof program.location === 'object')
                                                ? program.location.name
                                                : (program.location || 'Location TBD')}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-grow space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {program.description || "Join us for this transformative experience."}
                                    </p>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-primary/70" />
                                            <span>
                                                {program.start_date ? new Date(program.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date TBD'}
                                                {program.end_date ? ` - ${new Date(program.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-4 border-t bg-muted/5 flex items-center justify-between">
                                    <div className="font-semibold text-lg">
                                        {convertAndFormat(program.price || program.basePrice, program.currency || 'EUR')}
                                    </div>
                                    <Button onClick={() => handleProgramClick(program)} className="group-hover:bg-primary group-hover:text-primary-foreground">
                                        View Details
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-6 bg-muted/10 rounded-2xl border-dashed border-2">
                            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Info className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-medium">No programs available yet</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    We are currently curating new experiences for you. Check back soon for upcoming retreats and programs.
                                </p>
                            </div>
                            {onBack && (
                                <Button variant="outline" onClick={onBack}>
                                    Return to Dashboard
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
