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
import { Database } from "../types/database.types";

type Bundle = Database['public']['Tables']['bundles']['Row'];

interface BundleManagementProps {
    onBack: () => void;
}

export function BundleManagement({ onBack }: BundleManagementProps) {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBundle, setCurrentBundle] = useState<Partial<Bundle>>({});

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
        if (!currentBundle.name || !currentBundle.price) {
            toast.error("Name and Price are required");
            return;
        }

        const bundleData = {
            name: currentBundle.name,
            description: currentBundle.description,
            price: currentBundle.price,
            currency: currentBundle.currency || 'EUR',
            image_url: currentBundle.image_url,
            is_active: currentBundle.is_active ?? true,
        };

        let error;
        if (currentBundle.id) {
            const { error: updateError } = await supabase
                .from('bundles')
                .update(bundleData)
                .eq('id', currentBundle.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('bundles')
                .insert(bundleData);
            error = insertError;
        }

        if (error) {
            toast.error("Failed to save bundle");
            console.error(error);
        } else {
            toast.success("Bundle saved successfully");
            setIsEditing(false);
            setCurrentBundle({});
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
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">{currentBundle.id ? "Edit Bundle" : "Create Bundle"}</h2>
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
                                value={currentBundle.name || ""}
                                onChange={(e) => setCurrentBundle({ ...currentBundle, name: e.target.value })}
                                placeholder="e.g. 10 Class Pass"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={currentBundle.description || ""}
                                onChange={(e) => setCurrentBundle({ ...currentBundle, description: e.target.value })}
                                placeholder="Describe what's included..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={currentBundle.price || ""}
                                    onChange={(e) => setCurrentBundle({ ...currentBundle, price: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Input
                                    id="currency"
                                    value={currentBundle.currency || "EUR"}
                                    onChange={(e) => setCurrentBundle({ ...currentBundle, currency: e.target.value })}
                                    placeholder="EUR"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_url">Image URL</Label>
                            <Input
                                id="image_url"
                                value={currentBundle.image_url || ""}
                                onChange={(e) => setCurrentBundle({ ...currentBundle, image_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSaveBundle}>Save Bundle</Button>
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
                <Button onClick={() => { setCurrentBundle({ currency: 'EUR', is_active: true }); setIsEditing(true); }}>
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
                                            <Button variant="ghost" size="icon" onClick={() => { setCurrentBundle(bundle); setIsEditing(true); }}>
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
