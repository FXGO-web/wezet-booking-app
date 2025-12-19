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
                <div className="max-w-3xl mb-16">
                    <h1 className="text-5xl md:text-7xl font-light text-[#1A1A1A] tracking-tight leading-[1.1] mb-6">
                        Breathwork Education <br />
                        <span className="text-[#E87C55] font-normal italic">Curriculum</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-light leading-relaxed max-w-2xl border-l-2 border-[#E87C55]/20 pl-6">
                        A transformational 20-week journey into the art and science of breath.
                        Master the physiology, psychology, and facilitation of conscious breathing.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => onNavigate('education-module', module.id)}
                            className="group relative bg-white rounded-[2rem] overflow-hidden cursor-pointer border border-[#1A1A1A]/5 hover:border-[#E87C55]/20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(232,124,85,0.15)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col h-full"
                        >
                            {/* Image Area */}
                            <div className="h-72 relative overflow-hidden bg-[#F8F5F0]">
                                {module.image_url ? (
                                    <img
                                        src={module.image_url}
                                        alt={module.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-[#F8F5F0]">
                                        <div className="text-[140px] font-extrabold text-[#E87C55] opacity-[0.03] leading-none select-none group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-1000">
                                            {String(module.order_index).padStart(2, '0')}
                                        </div>
                                    </div>
                                )}

                                {/* Subtle Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />

                                {/* Module Number Badge */}
                                <div className="absolute top-8 left-8">
                                    <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#E87C55]">
                                            Module {module.order_index}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-10 flex-1 flex flex-col bg-white">
                                <div className="mb-8">
                                    <h3 className="text-2xl font-normal text-[#1A1A1A] mb-4 group-hover:text-[#E87C55] transition-colors duration-500 leading-snug">
                                        {module.title}
                                    </h3>
                                    <p className="text-gray-500 font-light leading-relaxed text-sm line-clamp-3">
                                        {module.description || "Delve into the core principles and advanced techniques of professional breathwork facilitation."}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A]/40 group-hover:text-[#E87C55] transition-colors duration-500">
                                        Explore Module
                                    </span>
                                    <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#E87C55] group-hover:border-[#E87C55] transition-all duration-500">
                                        <ArrowRight className="w-4 h-4 text-[#1A1A1A]/40 group-hover:text-white transition-all duration-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {modules.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border border-dashed border-[#E87C55]/20 backdrop-blur-sm">
                            <div className="w-16 h-16 bg-[#E87C55]/10 rounded-full flex items-center justify-center mb-6">
                                <Loader2 className="w-6 h-6 text-[#E87C55] animate-spin" />
                            </div>
                            <p className="text-gray-400 font-light tracking-wide uppercase text-xs">Awaiting curriculum data</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
