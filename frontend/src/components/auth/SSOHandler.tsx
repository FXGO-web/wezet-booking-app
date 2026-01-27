import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase/client';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { AuthPage } from '../AuthPage';

export function SSOHandler() {
    const { session, loading: authLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('Initializing secure connection...');

    useEffect(() => {
        const handleSSO = async () => {
            if (authLoading) return;

            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect');

            if (!redirectUrl) {
                setError("Missing 'redirect' parameter.");
                return;
            }

            // Security: Whitelist allowed domains
            const allowedDomains = ['learn.wezet.xyz', 'shop.wezet.xyz', 'localhost', '127.0.0.1'];
            try {
                const url = new URL(redirectUrl);
                const hostname = url.hostname;
                const isAllowed = allowedDomains.some(domain =>
                    hostname === domain || hostname.endsWith('.' + domain)
                );

                if (!isAllowed) {
                    setError(`Security Warning: Redirection to ${hostname} is not authorized.`);
                    return;
                }
            } catch (e) {
                setError("Invalid redirect URL provided.");
                return;
            }

            if (!session) {
                // User is not logged in.
                // The App's main routing should have likely redirected to /login by now if this route is protected,
                // but if it's a public route, we show a message.
                // We will rely on the parent component to render <AuthPage /> if !session, 
                // OR we can manually trigger a "Login required" state here.
                setStatus("Authentication required. Please sign in to continue.");
                return;
            }

            setStatus(`Authenticating with ${new URL(redirectUrl).hostname}...`);

            // 1. Get a fresh access token
            const { data, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !data.session) {
                setError("Could not retrieve active session. Please log in again.");
                return;
            }

            const accessToken = data.session.access_token;
            const refreshToken = data.session.refresh_token;

            // 2. Redirect back to the external app with the token
            // We append it as a query param. 
            // WARNING: Implicit flow (token in URL) has risks. 
            // Ensure the receiving end consumes it immediately and redirects to a clean URL.
            const targetUrl = new URL(redirectUrl);
            targetUrl.searchParams.set('wezet_sso_token', accessToken);
            // targetUrl.searchParams.set('wezet_refresh_token', refreshToken); // Optional: if we want long-lived sessions on the other side

            window.location.href = targetUrl.toString();
        };

        handleSSO();
    }, [session, authLoading]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <Card className="w-full max-w-md border-destructive/20">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                            <CardTitle>SSO Error</CardTitle>
                        </div>
                        <CardDescription>Authentication could not be completed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm font-mono bg-muted p-2 rounded text-destructive">{error}</p>
                        <Button onClick={() => window.location.href = '/'} variant="outline">
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If session is missing, we render the AuthPage directly so the user can sign in.
    // Once they sign in, `session` will update, and the useEffect above will trigger the redirect.
    if (!session && !authLoading) {
        return <AuthPage mode="signin" />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
                <ShieldCheck className="h-5 w-5" />
                {status}
            </div>
        </div>
    );
}
