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
        <div className="min-h-screen bg-[#FDFBF7]"> {/* Warm premium background */}
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">

                {/* Header */}
                <div className="max-w-3xl mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tighter">
                        Breathwork Education <span className="text-[#E87C55] font-normal">Curriculum</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-light leading-relaxed max-w-2xl">
                        A transformational 20-week journey into the art and science of breath.
                        Master the physiology, psychology, and facilitation of conscious breathing.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => onNavigate('education-module', module.id)}
                            className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer border border-transparent hover:border-[#E87C55]/20 shadow-sm hover:shadow-2xl hover:shadow-[#E87C55]/10 transition-all duration-500 ease-out flex flex-col h-full"
                        >
                            {/* Image Area */}
                            <div className="h-64 relative overflow-hidden bg-gray-100">
                                {module.image_url ? (
                                    <img src={module.image_url} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF5F1] to-[#FFE4D6] group-hover:scale-105 transition-transform duration-700">
                                        <div className="text-[120px] font-bold text-[#E87C55] opacity-10 leading-none select-none">
                                            {module.order_index}
                                        </div>
                                    </div>
                                )}

                                {/* Overlay / Status */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                                {/* Module Number Badge */}
                                <div className="absolute top-6 left-6">
                                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase text-gray-900 shadow-sm">
                                        Module {module.order_index}
                                    </span>
                                </div>

                                {module.is_locked_by_default && (
                                    <div className="absolute top-6 right-6">
                                        <div className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white">
                                            {/* Lock icon would go here if we imported lock, for now text implies it */}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content Area */}
                            <div className="p-8 flex-1 flex flex-col justify-between bg-white relative">
                                <div>
                                    <h3 className="text-2xl font-medium text-gray-900 mb-3 group-hover:text-[#E87C55] transition-colors leading-tight">
                                        {module.title}
                                    </h3>
                                    <p className="text-gray-500 font-light leading-relaxed mb-6">
                                        {module.description || "Explore the depths of breathwork."}
                                    </p>
                                </div>

                                <div className="flex items-center text-[#E87C55] font-medium group-hover:translate-x-2 transition-transform duration-300">
                                    Start Learning <ArrowRight className="ml-2 w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Fallback */}
                    {modules.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="p-4 bg-orange-50 rounded-full mb-4">
                                <Loader2 className="w-6 h-6 text-[#E87C55] animate-spin" />
                            </div>
                            <p className="text-gray-400 font-light">Loading curriculum content...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
