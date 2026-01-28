import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Bundle {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
}

interface AssignBundleModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    userName: string | null;
    onSuccess: () => void;
}

export function AssignBundleModal({ isOpen, onClose, userId, userName, onSuccess }: AssignBundleModalProps) {
    const [loading, setLoading] = useState(false);
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [selectedBundleId, setSelectedBundleId] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            fetchBundles();
            setSelectedBundleId("");
        }
    }, [isOpen]);

    const fetchBundles = async () => {
        const { data, error } = await supabase
            .from('bundles')
            .select('id, name, credits, price, currency')
            .eq('is_active', true)
            .order('price', { ascending: true });

        if (error) {
            console.error('Error fetching bundles:', error);
            toast.error('Failed to load bundles');
        } else {
            setBundles(data || []);
        }
    };

    const handleAssign = async () => {
        if (!userId || !selectedBundleId) return;

        setLoading(true);
        try {
            const selectedBundle = bundles.find(b => b.id === selectedBundleId);
            if (!selectedBundle) throw new Error("Bundle not found");

            const { error } = await supabase
                .from('bundle_purchases')
                .insert({
                    user_id: userId,
                    bundle_id: selectedBundleId,
                    status: 'completed',
                    amount_paid: 0, // Admin assignment implies free/manual payment
                    currency: selectedBundle.currency,
                    remaining_credits: selectedBundle.credits,
                    stripe_payment_id: 'manual_admin_assignment'
                });

            if (error) throw error;

            toast.success(`Bundle assigned to ${userName}`);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error assigning bundle:', error);
            toast.error(error.message || 'Failed to assign bundle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Bundle</DialogTitle>
                    <DialogDescription>
                        Assign a package manually to <span className="font-medium text-foreground">{userName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="bundle">Select Bundle</Label>
                        <Select value={selectedBundleId} onValueChange={setSelectedBundleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a bundle..." />
                            </SelectTrigger>
                            <SelectContent>
                                {bundles.map((bundle) => (
                                    <SelectItem key={bundle.id} value={bundle.id}>
                                        {bundle.name} ({bundle.credits} credits)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedBundleId || loading}
                        className="bg-[#ef7c48] hover:bg-[#ef7c48]/90 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Assign Bundle
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
