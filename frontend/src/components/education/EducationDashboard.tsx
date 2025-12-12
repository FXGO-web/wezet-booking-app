import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { Button } from "../ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "../ui/utils";

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
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="max-w-3xl mb-12">
                    <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-4">
                        Breathwork Education Curriculum
                    </h1>
                    <p className="text-lg text-gray-500 font-light">
                        Your journey to mastering breathwork starts here. 20 weeks of theory, practice, and transformation.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                        >
                            {/* Image Area - Double Exposure Style Placeholder */}
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                                {module.image_url ? (
                                    <img src={module.image_url} alt={module.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform duration-700">
                                        <span className="text-gray-300 font-bold text-6xl opacity-20">{module.order_index}</span>
                                    </div>
                                )}
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-60" />

                                <div className="absolute bottom-4 left-4 text-white">
                                    <span className="text-xs font-bold tracking-widest uppercase opacity-80 mb-1 block">Module {module.order_index}</span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-[#E87C55] transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                                    {module.description || "Foundations of conscious breathing and physiology."}
                                </p>

                                <Button
                                    onClick={() => onNavigate('education-module', module.id)}
                                    className="w-full bg-white text-[#E87C55] border border-[#E87C55] hover:bg-[#E87C55] hover:text-white transition-all rounded-full"
                                >
                                    View Module
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Fallback if no modules loaded */}
                    {modules.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed">
                            <p className="text-gray-400">No modules found. Database migraion required.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
