
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TeamManagement } from "./TeamManagement";
import { CustomerList } from "./CustomerList";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface UserManagementProps {
    onBack?: () => void;
}

export function UserManagement({ onBack }: UserManagementProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">
                            Manage your team members and customer base
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="team" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="team">Team Members</TabsTrigger>
                        <TabsTrigger value="customers">Customers & Subscribers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="team" className="space-y-4">
                        <TeamManagement />
                    </TabsContent>

                    <TabsContent value="customers" className="space-y-4">
                        <CustomerList />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
