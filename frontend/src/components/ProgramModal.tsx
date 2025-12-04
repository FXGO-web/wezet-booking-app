import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Loader2 } from "lucide-react";
import { programsAPI, categoriesAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

interface ProgramModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    program?: any;
}

export function ProgramModal({ isOpen, onClose, onSuccess, program }: ProgramModalProps) {
    const { getAccessToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: program?.name || program?.title || "",
        description: program?.description || "",
        location: program?.location || "",
        startDate: program?.startDate || "",
        endDate: program?.endDate || "",
        price: program?.price || 0,
        currency: program?.currency || "EUR",
        status: program?.status || "draft",
        duration_minutes: program?.duration_minutes || 60, // Default duration
        categoryId: program?.category_id || program?.categoryId || "",
    });
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { categories } = await categoriesAPI.getAll({ appliesTo: 'program' });
                setCategories(categories);
                // Set default category if none selected and categories exist
                if (!formData.categoryId && categories.length > 0) {
                    // Prefer "Retreats" or "Education"
                    const defaultCat = categories.find((c: any) => c.name === "Retreats") ||
                        categories.find((c: any) => c.name === "Education") ||
                        categories[0];
                    if (defaultCat) {
                        setFormData(prev => ({ ...prev, categoryId: defaultCat.id }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isOpen) {
            const newFormData = {
                name: program?.name || program?.title || "",
                description: program?.description || "",
                location: program?.location || "",
                startDate: program?.startDate || "",
                endDate: program?.endDate || "",
                price: program?.price || 0,
                currency: program?.currency || "EUR",
                status: program?.status || "draft",
                duration_minutes: program?.duration_minutes || 60,
                categoryId: program?.category_id || program?.categoryId || "",
            };

            if (!newFormData.categoryId && categories.length > 0) {
                const defaultCat = categories.find((c: any) => c.name === "Retreats") ||
                    categories.find((c: any) => c.name === "Education") ||
                    categories[0];
                if (defaultCat) {
                    newFormData.categoryId = defaultCat.id;
                }
            }
            setFormData(newFormData);
        }
    }, [isOpen, program, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                alert("Please log in to continue");
                return;
            }

            if (program) {
                await programsAPI.update(program.id, formData);
            } else {
                await programsAPI.create(formData);
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving program:", error);
            alert(`Failed to save program: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{program ? "Edit Program" : "Create New Program"}</DialogTitle>
                    <DialogDescription>
                        {program
                            ? "Update program details"
                            : "Add a new retreat or educational sequence"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Program Title *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Bali Wellness Retreat"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detailed description of the program..."
                                rows={4}
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ubud, Bali"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value: string) => setFormData({ ...formData, categoryId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Price and Currency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="1500"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value: string) => setFormData({ ...formData, currency: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="DKK">DKK (kr)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>{program ? "Update" : "Create"} Program</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
