import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { EducationSidebar } from './EducationSidebar';
import { Button } from "../ui/button";
import { Loader2, ArrowLeft, Play } from "lucide-react";

interface ModuleOverviewProps {
    moduleId: string;
    onNavigate: (view: string, id?: string) => void;
}

export function ModuleOverview({ moduleId, onNavigate }: ModuleOverviewProps) {
    const [module, setModule] = useState<any>(null);
    const [modulesList, setModulesList] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                // Load module details
                // Note: We don't have getModuleById in snippet, adding fallback logic or query
                // Assuming we can get context. For now, we load all modules to build sidebar + find active
                // Ideally we fetch courses -> modules
                const courses = await educationAPI.getCourses();
                if (courses[0]) {
                    const m = await educationAPI.getModules(courses[0].id);
                    setModulesList(m);
                    const active = m.find((mod: any) => mod.id === moduleId);
                    setModule(active);

                    if (active) {
                        const l = await educationAPI.getLessons(active.id);
                        setLessons(l);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [moduleId]);

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!module) return <div>Module not found</div>;

    return (
        <div className="flex h-screen bg-[#FDFBF7]">
            <EducationSidebar
                modules={modulesList}
                activeModuleId={moduleId}
                onNavigate={onNavigate}
                className="hidden lg:flex bg-white border-r border-gray-100 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)]"
            />

            <div className="flex-1 overflow-auto">
                <main className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16 space-y-12">

                    {/* Header Nav */}
                    <button
                        onClick={() => onNavigate('education-dashboard')}
                        className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-[#E87C55] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Curriculum</span>
                    </button>

                    {/* Module Hero */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E87C55]/10 text-[#E87C55] rounded-full text-[10px] font-bold tracking-[0.15em] uppercase">
                            Module {module.order_index}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] tracking-tight leading-tight">
                            {module.title}
                        </h1>
                        <p className="text-xl text-muted-foreground font-light leading-relaxed">
                            {module.description || "Delve into the core principles and advanced techniques of professional breathwork facilitation."}
                        </p>

                        <div className="flex items-center gap-6 pt-4">
                            {lessons.length > 0 && (
                                <Button
                                    size="lg"
                                    onClick={() => onNavigate('education-lesson', lessons[0].id)}
                                    className="h-14 px-8 rounded-full bg-[#1A1A1A] hover:bg-[#E87C55] text-white shadow-xl shadow-[#1A1A1A]/10 hover:shadow-[#E87C55]/20 text-sm font-semibold tracking-wide transition-all duration-500"
                                >
                                    <Play className="h-4 w-4 mr-2 fill-current" />
                                    Start Learning
                                </Button>
                            )}
                            <div className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
                                {lessons.length} Lessons • {lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0)} min total
                            </div>
                        </div>
                    </div>

                    {/* Lesson Grid/List */}
                    <div className="space-y-6 pt-12 border-t border-[#1A1A1A]/5">
                        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground ml-1">Lessons included</h2>

                        <div className="grid gap-4">
                            {lessons.map((lesson, idx) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => onNavigate('education-lesson', lesson.id)}
                                    className="group text-left p-6 rounded-2xl border bg-white hover:shadow-xl transition-all hover:scale-[1.01] flex items-center gap-6"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#1A1A1A]/40 font-bold group-hover:bg-[#E87C55]/10 group-hover:text-[#E87C55] transition-colors shrink-0">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <h3 className="text-lg font-semibold text-[#1A1A1A] group-hover:text-[#E87C55] transition-colors">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {lesson.description || `${lesson.duration_minutes || 15} minute video lesson`}
                                        </p>
                                    </div>

                                    <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-muted-foreground group-hover:border-[#E87C55] group-hover:text-[#E87C55] transition-all">
                                        <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                                    </div>
                                </button>
                            ))}

                            {lessons.length === 0 && (
                                <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-muted-foreground italic tracking-wide">Course material is being prepared</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
