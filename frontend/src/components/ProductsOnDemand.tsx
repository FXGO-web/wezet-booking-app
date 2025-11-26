import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, Video, Package, PlayCircle } from "lucide-react";

interface ProductsOnDemandProps {
    onBack?: () => void;
}

export function ProductsOnDemand({ onBack }: ProductsOnDemandProps) {
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
                            <h1 className="text-3xl font-bold">Products & On Demand</h1>
                        </div>
                        <p className="text-muted-foreground ml-20">
                            Manage your digital products and streaming content
                        </p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New
                    </Button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Placeholder Card 1 - Video Course */}
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-4">
                            <div className="h-48 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative overflow-hidden">
                                <Video className="h-12 w-12 text-muted-foreground" />
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <PlayCircle className="h-3 w-3" />
                                    <span>Video Course</span>
                                </div>
                            </div>
                            <CardTitle className="flex items-start justify-between">
                                <span>Breathwork Fundamentals</span>
                                <span className="text-sm font-normal text-muted-foreground bg-green-100 text-green-700 px-2 py-1 rounded">
                                    Active
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>A comprehensive guide to basic breathwork techniques.</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="font-medium text-foreground">€49.00</span>
                                    <span>•</span>
                                    <span>12 Lessons</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder Card 2 - Digital Product */}
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-4">
                            <div className="h-48 w-full bg-muted rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative overflow-hidden">
                                <Package className="h-12 w-12 text-muted-foreground" />
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>Digital Product</span>
                                </div>
                            </div>
                            <CardTitle className="flex items-start justify-between">
                                <span>Meditation Bundle</span>
                                <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                                    Draft
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>Pack of 5 guided meditations for daily practice.</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="font-medium text-foreground">€29.00</span>
                                    <span>•</span>
                                    <span>5 Files</span>
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
                            <h3 className="font-medium">Add New Item</h3>
                            <p className="text-sm text-muted-foreground">
                                Create a product or upload content
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
