import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Loader2, Check } from "lucide-react";
import { supabase } from "../utils/supabase/client";
import { Database } from "../types/database.types";
import { useCurrency } from "../context/CurrencyContext";

type Bundle = Database['public']['Tables']['bundles']['Row'];

interface BundlesListProps {
    onBuy: (bundleId: string) => void;
}

export function BundlesList({ onBuy }: BundlesListProps) {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatFixedPrice } = useCurrency(); // Using context for formatting, though bundle usually has fixed currency/price.

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bundles')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setBundles(data || []);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (bundles.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No packages currently available.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
                <Card key={bundle.id} className="flex flex-col h-full hover:shadow-lg transition-all">
                    {bundle.image_url && (
                        <div className="h-48 overflow-hidden rounded-t-xl bg-muted">
                            <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle className="text-xl">{bundle.name}</CardTitle>
                        <CardDescription>{bundle.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: bundle.currency }).format(bundle.price)}
                            </span>
                        </div>
                        {/* Placeholder for items list if we were fetching bundle_items */}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => onBuy(bundle.id)}>
                            Buy Package
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
