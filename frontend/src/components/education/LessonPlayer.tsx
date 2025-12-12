import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { EducationSidebar } from './EducationSidebar';
import { Button } from "../ui/button";
import { Loader2, CheckCircle, ChevronRight, FileText } from "lucide-react";
import { cn } from "../ui/utils";
import { useAuth } from '../../hooks/useAuth';

interface LessonPlayerProps {
    lessonId: string;
    onNavigate: (view: string, id?: string) => void;
}

export function LessonPlayer({ lessonId, onNavigate }: LessonPlayerProps) {
    const { user } = useAuth();
    const [lesson, setLesson] = useState<any>(null);
    const [modulesList, setModulesList] = useState<any[]>([]);
    const [activeModuleId, setActiveModuleId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                // Load Lesson Details
                const l = await educationAPI.getLesson(lessonId);
                setLesson(l);
                setActiveModuleId(l.module_id);

                // Progress check (requires manual progress fetch or join, snippet has it flattened in getLessons list but getLesson is single)
                // Ideally we fetch progress separately.
                // Quick hack: Use the list endpoint to find completion status or create a specific getProgress endpoint.
                // For now, assume false until user action or better API.

                // Load Sidebar
                const courses = await educationAPI.getCourses();
                if (courses[0]) {
                    const m = await educationAPI.getModules(courses[0].id);
                    // Hydrate modules with lessons for sidebar... Expensive?
                    // Sidebar needs lessons inside modules.
                    const modulesWithLessons = await Promise.all(m.map(async (mod: any) => {
                        const lessons = await educationAPI.getLessons(mod.id);
                        if (mod.id === l.module_id) {
                            const currentL = lessons.find((x: any) => x.id === lessonId);
                            if (currentL?.isCompleted) setIsCompleted(true);
                        }
                        return { ...mod, lessons };
                    }));
                    setModulesList(modulesWithLessons);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [lessonId]);

    const handleComplete = async () => {
        if (!user) return;
        try {
            setMarking(true);
            await educationAPI.markLessonComplete(lessonId, user.id, !isCompleted);
            setIsCompleted(!isCompleted);
        } catch (e) {
            console.error(e);
        } finally {
            setMarking(false);
        }
    }

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!lesson) return <div>Lesson not found</div>;

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <EducationSidebar
                modules={modulesList}
                activeModuleId={activeModuleId}
                activeLessonId={lessonId}
                onNavigate={onNavigate}
                className="hidden md:flex bg-white"
                progress={{ [lessonId]: isCompleted }} // Pass generic map
            />

            <div className="flex-1 overflow-auto flex flex-col">
                {/* Video Stage */}
                <div className="bg-black w-full aspect-video max-h-[70vh] flex items-center justify-center relative shadow-xl z-10">
                    {lesson.video_url ? (
                        lesson.video_url.includes('vimeo') || lesson.video_url.includes('youtube') ? (
                            <iframe
                                src={lesson.video_url}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <video controls className="w-full h-full" src={lesson.video_url} />
                        )
                    ) : (
                        <div className="text-white/50 flex flex-col items-center">
                            <p>Video Placeholder</p>
                            <p className="text-xs mt-2">No URL configured in database</p>
                        </div>
                    )}
                </div>

                {/* Lesson Content */}
                <div className="flex-1 bg-white p-8 md:p-12 max-w-5xl mx-auto w-full">
                    <div className="flex items-start justify-between gap-8 mb-8 border-b pb-8">
                        <div>
                            <h1 className="text-2xl font-medium text-gray-900 mb-2">{lesson.title}</h1>
                            <p className="text-gray-500">Module {activeModuleId ? 'Current' : ''} • {lesson.duration_minutes || 20} min</p>
                        </div>

                        <Button
                            size="lg"
                            variant={isCompleted ? "outline" : "default"}
                            className={cn(
                                "min-w-[180px] transition-all",
                                !isCompleted && "bg-[#E87C55] hover:bg-[#d66c45] text-white",
                                isCompleted && "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            )}
                            onClick={handleComplete}
                            disabled={marking}
                        >
                            {marking ? <Loader2 className="animate-spin w-4 h-4" /> : isCompleted ? (
                                <><CheckCircle className="w-4 h-4 mr-2" /> Completed</>
                            ) : (
                                "Mark as Complete"
                            )}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 prose prose-stone max-w-none">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">About this lesson</h3>
                            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {lesson.description || "No description provided."}
                                {lesson.content_markdown}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-4">Resources</h4>
                                {lesson.resources && lesson.resources.length > 0 ? (
                                    <ul className="space-y-3">
                                        {lesson.resources.map((res: any, i: number) => (
                                            <li key={i}>
                                                <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#E87C55] transition-colors group">
                                                    <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center group-hover:border-[#E87C55]/30">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    {res.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No resources attached.</p>
                                )}
                            </div>

                            {/* Next up snippet could go here */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
