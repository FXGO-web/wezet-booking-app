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
    const [modulesList, setModulesList] = useState<any[]>([]); // For sidebar
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
            {/* Sidebar - Hidden on mobile, can use drawer later */}
            <EducationSidebar
                modules={modulesList}
                activeModuleId={moduleId}
                onNavigate={onNavigate}
                className="hidden lg:flex"
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16">

                    {/* Back Nav */}
                    <div className="mb-8">
                        <div
                            className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                            onClick={() => onNavigate('education-dashboard')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> All Modules
                        </div>
                    </div>

                    {/* Hero Header */}
                    <div className="mb-16">
                        <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-[#E87C55] text-xs font-bold tracking-widest uppercase mb-6">
                            Module {module.order_index}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight leading-tight">
                            {module.title}
                        </h1>
                        <p className="text-xl text-gray-500 font-light leading-relaxed max-w-3xl">
                            {module.description}
                        </p>

                        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center gap-6">
                            {lessons.length > 0 && (
                                <Button
                                    size="lg"
                                    className="bg-[#E87C55] hover:bg-[#D66C45] text-white rounded-full px-8 h-12 text-base shadow-xl shadow-orange-200/50 transition-transform hover:scale-105"
                                    onClick={() => onNavigate('education-lesson', lessons[0].id)}
                                >
                                    <Play className="w-4 h-4 mr-2 fill-current" /> Start Learning
                                </Button>
                            )}
                            <div className="text-sm font-medium text-gray-400">
                                {lessons.length} Lessons • {lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0)} Minutes Total
                            </div>
                        </div>
                    </div>

                    {/* Curriculum List */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 pl-2">Lessons in this module</h3>

                        {lessons.map((lesson, idx) => (
                            <div
                                key={lesson.id}
                                onClick={() => onNavigate('education-lesson', lesson.id)}
                                className="group flex items-center gap-6 p-6 rounded-2xl bg-white border border-transparent hover:border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                            >
                                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-mono text-lg group-hover:bg-[#E87C55] group-hover:text-white transition-colors shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-medium text-gray-900 group-hover:text-[#E87C55] transition-colors mb-1">{lesson.title}</h4>
                                    <p className="text-sm text-gray-400 font-light">{lesson.description || `${lesson.duration_minutes || 15} min video`}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:border-[#E87C55] group-hover:text-[#E87C55] transition-colors">
                                    <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                                </div>
                            </div>
                        ))}

                        {lessons.length === 0 && (
                            <div className="text-center py-12 text-gray-300 italic">No lessons available yet.</div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
