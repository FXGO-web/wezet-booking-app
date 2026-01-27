import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { AuthPage } from "./AuthPage";
import { Database } from "../types/database.types";

type Bundle = Database['public']['Tables']['bundles']['Row'];

interface BundleCheckoutProps {
    bundleId: string | null;
    onBack: () => void;
}

export function BundleCheckout({ bundleId, onBack }: BundleCheckoutProps) {
    const { user } = useAuth();
    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    useEffect(() => {
        if (bundleId) {
            loadBundle(bundleId);
        }
    }, [bundleId]);

    const loadBundle = async (id: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bundles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Error loading bundle:", error);
            toast.error("Failed to load bundle details");
        } else {
            setBundle(data);
        }
        setLoading(false);
    };

    const handlePurchase = async () => {
        if (!bundle) return;
        if (!user) {
            setShowAuth(true);
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create Pending Purchase Record
            const { data: purchase, error: purchaseError } = await supabase
                .from('bundle_purchases')
                .insert({
                    user_id: user.id,
                    bundle_id: bundle.id,
                    status: 'pending',
                    currency: bundle.currency,
                    amount_paid: bundle.price, // Storing price at time of purchase intent
                })
                .select()
                .single();

            if (purchaseError) throw purchaseError;

            // 2. Create Stripe Session
            const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
                body: {
                    bundle_purchase_id: purchase.id,
                    return_url: window.location.href, // This might need to be adjusted depending on routing
                    customer_email: user.email,
                }
            });

            if (checkoutError) throw checkoutError;

            if (checkoutData?.url) {
                window.location.href = checkoutData.url;
            } else {
                throw new Error("No checkout URL returned");
            }

        } catch (error: any) {
            console.error("Purchase error:", error);
            toast.error(error.message || "Failed to initiate purchase");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!bundle) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <p>Bundle not found.</p>
                <Button onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    if (showAuth) {
        // If user logs in successfully, AuthPage might redirect or update user state. 
        // We rely on useAuth() updating 'user' which we can watch, but here we cover the screen.
        // Actually, better to just show login prompt inline or overlay.
        return (
            <div className="min-h-screen bg-background relative">
                <Button variant="ghost" className="absolute top-4 left-4 z-50" onClick={() => setShowAuth(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="pt-16 px-4 max-w-md mx-auto">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold">Sign in to continue</h2>
                        <p className="text-muted-foreground">You need an account to access your purchase later.</p>
                    </div>
                    <AuthPage />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col items-center">
            <div className="w-full max-w-2xl space-y-8">
                <Button variant="ghost" onClick={onBack} className="pl-0">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Packages
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Confirm Purchase</h1>
                    <p className="text-muted-foreground">Review your package details</p>
                </div>

                <Card>
                    {bundle.image_url && (
                        <div className="h-48 overflow-hidden rounded-t-xl bg-muted">
                            <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-2xl">{bundle.name}</CardTitle>
                        <CardDescription>{bundle.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-lg font-medium">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: bundle.currency }).format(bundle.price)}</span>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <span>Secure payment via Stripe</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Instant access after payment</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handlePurchase} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: bundle.currency }).format(bundle.price)}`}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
