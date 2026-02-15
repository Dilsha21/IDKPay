'use client';

import { useState } from 'react';
import { useAuth } from '@/app/auth-provider';
import { resendVerificationEmail, signOutAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, RefreshCw, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function VerifyEmailPage() {
    const { user, refreshAuth } = useAuth();
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleResend = async () => {
        setIsResending(true);
        const result = await resendVerificationEmail();
        setIsResending(false);

        if (result.success) {
            toast({
                title: 'Email Sent',
                description: 'A new verification email has been sent to your inbox.',
            });
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to resend verification email.',
                variant: 'destructive',
            });
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshAuth();
        setIsRefreshing(false);

        // AuthProvider will handle redirection if verified
        toast({
            title: 'Status Checked',
            description: 'We checked your verification status.',
        });
    };

    if (!user) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30">
            <div className="mb-8 flex flex-col items-center">
                <Logo size="lg" className="mb-4" />
                <h1 className="text-3xl font-bold">IDKPay</h1>
            </div>

            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Verify Your Email</CardTitle>
                    <CardDescription>
                        We've sent a verification link to <span className="font-semibold text-foreground">{user.email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-sm space-y-2 p-4 bg-muted rounded-md border border-border/50">
                        <p>Please check your inbox for the link to activate your account.</p>
                        <p className="font-medium text-destructive/80">
                            Important: Check your <span className="underline">Spam</span> or <span className="underline">Promotions</span> folder if you don't see it in your Inbox.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleRefresh}
                            className="w-full"
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    I've Verified My Email
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleResend}
                            className="w-full"
                            disabled={isResending}
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resending...
                                </>
                            ) : (
                                'Resend Verification Email'
                            )}
                        </Button>
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => signOutAction()}
                            className="w-full text-muted-foreground"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out and try a different email
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <p className="mt-8 text-sm text-muted-foreground">
                Having trouble? Contact support@idkpay.example.com
            </p>
        </div>
    );
}
