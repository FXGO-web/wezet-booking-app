import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Loader2, Plus, ArrowLeft, Trash2, Edit } from "lucide-react";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
import { useCurrency } from "../context/CurrencyContext";

interface Bundle {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    credits: number;
    is_active: boolean;
}

export function BundleManagement({ onBack }: { onBack: () => void }) {
    const { currency } = useCurrency();
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: undefined as string | undefined,
        name: "",
        description: "",
        price: 0,
        currency: "EUR",
        credits: 1,
        is_active: true,
    });

    // Sync formData currency with global currency ONLY when creating new (no ID)
    // If editing, we might want to preserve the original currency or warn. 
    // For simplicity following user request: strict sync with global switcher.
    useEffect(() => {
        setFormData(prev => ({ ...prev, currency }));
    }, [currency]);

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bundles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Failed to load bundles");
            console.error(error);
        } else {
            setBundles(data || []);
        }
        setLoading(false);
    };

    const handleSaveBundle = async () => {
        if (!formData.name) {
            toast.error("Name is required");
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            currency: formData.currency,
            credits: formData.credits,
            is_active: formData.is_active,
        };

        let error;
        if (formData.id) {
            const { error: updateError } = await supabase
                .from('bundles')
                .update(payload)
                .eq('id', formData.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('bundles')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            toast.error("Failed to save bundle");
            console.error(error);
        } else {
            toast.success("Bundle saved successfully");
            setIsEditing(false);
            resetForm();
            fetchBundles();
        }
    };

    const handleDeleteBundle = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bundle?")) return;

        const { error } = await supabase
            .from('bundles')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Failed to delete bundle");
            console.error(error);
        } else {
            toast.success("Bundle deleted");
            fetchBundles();
        }
    };

    const resetForm = () => {
        setFormData({
            id: undefined,
            name: "",
            description: "",
            price: 0,
            currency: currency, // Reset to current global currency
            credits: 1,
            is_active: true,
        });
    };

    const startEdit = (bundle: Bundle) => {
        setFormData({
            id: bundle.id,
            name: bundle.name,
            description: bundle.description || "",
            price: bundle.price,
            currency: bundle.currency,
            credits: bundle.credits,
            is_active: bundle.is_active,
        });
        setIsEditing(true);
    };

    if (loading && !isEditing) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => { setIsEditing(false); resetForm(); }}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">{formData.id ? "Edit Bundle" : "Create Bundle"}</h2>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bundle Details</CardTitle>
                        <CardDescription>Basic information about this package</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. 10 Class Pass"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what's included..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">
                                        {formData.currency}
                                    </span>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        className="pl-12"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="credits">Credits / Sessions</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={formData.credits}
                                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                    placeholder="e.g. 10"
                                />
                            </div>
                        </div>


                        {/* Image URL Removed as requested */}
                        {/* Currency is handled automatically via context and prefix */}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => { setIsEditing(false); resetForm(); }}>Cancel</Button>
                            <Button
                                onClick={handleSaveBundle}
                                className="hover:opacity-90 text-white border-none"
                                style={{ backgroundColor: '#ef7c48' }}
                            >
                                Save Bundle
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Bundles</h1>
                        <p className="text-muted-foreground">Manage your packages and bundles</p>
                    </div>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsEditing(true); }}
                    className="hover:opacity-90 text-white border-none"
                    style={{ backgroundColor: '#ef7c48' }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Bundle
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bundles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No bundles found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bundles.map((bundle) => (
                                    <TableRow key={bundle.id}>
                                        <TableCell className="font-medium">{bundle.name}</TableCell>
                                        <TableCell>{bundle.price} {bundle.currency}</TableCell>
                                        <TableCell>{bundle.is_active ? "Yes" : "No"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => startEdit(bundle)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteBundle(bundle.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
