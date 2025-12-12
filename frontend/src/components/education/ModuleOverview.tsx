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
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <EducationSidebar
                modules={modulesList}
                activeModuleId={moduleId}
                onNavigate={onNavigate}
                className="hidden md:flex"
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Hero Header */}
                <div className="bg-[#f8f7f4] border-b p-8 md:p-12">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent text-gray-500 mb-4" onClick={() => onNavigate('education-dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>

                    <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                        {module.title}
                    </h1>
                    <p className="text-gray-600 max-w-2xl text-lg font-light leading-relaxed">
                        {module.description}
                    </p>

                    <div className="mt-8 flex items-center gap-4">
                        {lessons.length > 0 && (
                            <Button
                                size="lg"
                                className="bg-[#E87C55] hover:bg-[#d66c45] text-white rounded-full px-8 shadow-lg shadow-orange-200"
                                onClick={() => onNavigate('education-lesson', lessons[0].id)}
                            >
                                <Play className="w-4 h-4 mr-2" fill="currentColor" /> Start Module
                            </Button>
                        )}
                        <span className="text-sm text-gray-500">{lessons.length} Lessons</span>
                    </div>
                </div>

                {/* Lesson List Body */}
                <div className="p-8 md:p-12 max-w-3xl">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Curriculum</h3>

                    <div className="space-y-4">
                        {lessons.map((lesson, idx) => (
                            <div
                                key={lesson.id}
                                onClick={() => onNavigate('education-lesson', lesson.id)}
                                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all bg-white"
                            >
                                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-[#E87C55] font-medium shrink-0 group-hover:bg-[#E87C55] group-hover:text-white transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 group-hover:text-[#E87C55] transition-colors">{lesson.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-1">{lesson.description || `${lesson.duration_minutes || 15} min video`}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-5 h-5 text-[#E87C55]" fill="currentColor" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
