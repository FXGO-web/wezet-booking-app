
import React from 'react';
import { Button } from "./ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface BookingSuccessProps {
    onGoToDashboard: () => void;
}

export function BookingSuccess({ onGoToDashboard }: BookingSuccessProps) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">

            <div className="bg-green-100 rounded-full p-6 ring-8 ring-green-50 shadow-xl">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>

            <div className="space-y-4 max-w-md">
                <h1 className="text-3xl font-serif font-medium tracking-tight">Payment Successful</h1>
                <p className="text-muted-foreground text-lg">
                    Your booking has been confirmed! We have sent a confirmation email with all the details to your inbox.
                </p>
            </div>

            <div className="pt-4">
                <Button
                    size="lg"
                    onClick={onGoToDashboard}
                    className="group"
                >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-8">
                Reference ID: {new URLSearchParams(window.location.search).get('session_id') || 'Unknown'}
            </p>

        </div>
    );
}
