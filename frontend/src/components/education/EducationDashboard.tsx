import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { Button } from "../ui/button";
import { Loader2, ArrowRight, GraduationCap } from "lucide-react";
import { cn } from "../ui/utils";

interface Course {
    id: string;
    // Add other course properties if known
}

interface Module {
    id: string;
    order_index: number;
    title: string;
    description: string;
    // Add other module properties if known
}

interface EducationDashboardProps {
    onNavigate: (view: string, id?: string) => void;
}

export function EducationDashboard({ onNavigate }: EducationDashboardProps) {
    const [courses, setCourses] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const c = await educationAPI.getCourses();
                if (c && c.length > 0) {
                    // Assuming single course for now "Breathwork Education"
                    const mainCourse = c[0];
                    setCourses(c);

                    if (mainCourse) {
                        const m = await educationAPI.getModules(mainCourse.id);
                        setModules(m);
                    }
                }
            } catch (err) {
                console.error("Failed to load education data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#E87C55]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-[#1A1A1A]">E-Learning Curriculum</h1>
                        <p className="text-muted-foreground text-lg">
                            Master the art and science of Breathwork with our 20-week program.
                        </p>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                        <button
                            key={module.id}
                            onClick={() => onNavigate('education-module', module.id)}
                            className="group text-left p-8 rounded-2xl border bg-white hover:shadow-xl transition-all hover:scale-[1.01] flex flex-col h-full space-y-6"
                        >
                            <div className="flex items-start justify-between w-full">
                                <div className="h-12 w-12 rounded-xl bg-[#E87C55]/10 flex items-center justify-center group-hover:bg-[#E87C55]/20 transition-colors">
                                    <span className="text-[#E87C55] font-bold">
                                        {String(module.order_index).padStart(2, '0')}
                                    </span>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#E87C55] transition-colors" />
                            </div>

                            <div className="space-y-2 flex-1">
                                <h3 className="text-xl font-semibold text-[#1A1A1A] group-hover:text-[#E87C55] transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                    {module.description || "Explore the core foundations and advanced techniques of professional breathwork facilitation."}
                                </p>
                            </div>

                            <div className="pt-4 border-t flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-[#E87C55] transition-colors">
                                <GraduationCap className="h-4 w-4" />
                                <span>Start Module</span>
                            </div>
                        </button>
                    ))}

                    {/* Empty State */}
                    {modules.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Loader2 className="w-8 h-8 text-[#E87C55] animate-spin mb-4" />
                            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Loading curriculum content...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
