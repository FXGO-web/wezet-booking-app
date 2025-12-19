import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { EducationSidebar } from './EducationSidebar';
import { Button } from "../ui/button";
import { Loader2, CheckCircle, ChevronRight, FileText, FileVideo } from "lucide-react";
import { cn } from "../ui/utils";
import { useAuth } from '../../hooks/useAuth';

interface LessonPlayerProps {
    lessonId: string;
    onNavigate: (view: string, id?: string) => void;
}

export function LessonPlayer({ lessonId, onNavigate }: LessonPlayerProps) {
    const { user } = useAuth();
    const [lesson, setLesson] = useState<any | null>(null);
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
        <div className="flex h-screen bg-[#FDFBF7]">
            {/* Sidebar */}
            <EducationSidebar
                modules={modulesList}
                activeModuleId={activeModuleId}
                activeLessonId={lessonId}
                onNavigate={onNavigate}
                className="hidden lg:flex bg-white border-r border-gray-100 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)]"
                progress={{ [lessonId]: isCompleted }}
            />

            <div className="flex-1 overflow-auto flex flex-col items-center">
                {/* Video Stage - Seamless and Elegant */}
                <div className="w-full bg-[#1A1A1A] h-[55vh] md:h-[70vh] flex items-center justify-center relative shadow-2xl overflow-hidden">
                    {lesson.video_url ? (
                        <div className="w-full h-full max-w-[1600px] mx-auto relative group">
                            {(lesson.video_url.includes('vimeo.com') || lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be')) ? (
                                <iframe
                                    src={lesson.video_url.replace('vimeo.com/', 'player.vimeo.com/video/').replace('watch?v=', 'embed/')}
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (lesson.video_url.includes('bunny.net') || lesson.video_url.includes('mediadelivery.net')) ? (
                                <iframe
                                    src={lesson.video_url}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    controls
                                    className="w-full h-full object-contain"
                                    src={lesson.video_url}
                                    controlsList="nodownload"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {/* Subtle Glass Overlay for Header Feel */}
                            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    ) : (
                        <div className="text-white/20 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6">
                                <FileVideo className="w-8 h-8" />
                            </div>
                            <p className="text-xs tracking-widest uppercase font-medium">Session awaiting video upload</p>
                        </div>
                    )}
                </div>

                {/* Lesson Details Area */}
                <div className="w-full max-w-5xl px-6 md:px-12 py-12 md:py-20 mb-20 overflow-x-hidden">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-16 pb-12 border-b border-[#1A1A1A]/5">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-[#E87C55]/10 text-[#E87C55] rounded-full text-[10px] font-bold tracking-[0.15em] uppercase">
                                    Module {activeModuleId ? 'Current' : 'N/A'}
                                </div>
                                <span className="text-xs text-gray-400 font-light">•</span>
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{lesson.duration_minutes || 20} min duration</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-light text-[#1A1A1A] tracking-tight leading-tight">
                                {lesson.title}
                            </h1>
                        </div>

                        <Button
                            size="lg"
                            className={cn(
                                "h-14 px-8 rounded-full text-sm font-semibold tracking-wide transition-all duration-500 shadow-lg",
                                !isCompleted
                                    ? "bg-[#1A1A1A] hover:bg-[#E87C55] text-white shadow-[#1A1A1A]/10 hover:shadow-[#E87C55]/20"
                                    : "bg-white border border-green-100 text-green-600 shadow-green-600/5"
                            )}
                            onClick={handleComplete}
                            disabled={marking}
                        >
                            {marking ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : isCompleted ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Lesson Completed</span>
                                </div>
                            ) : (
                                "Complete Lesson"
                            )}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="prose prose-stone max-w-none">
                                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#E87C55] mb-8">
                                    Lesson Overview
                                </h3>
                                <div className="text-gray-600 text-lg font-light leading-relaxed whitespace-pre-line space-y-6">
                                    {lesson.description || "In this session, we explore the foundational elements and core philosophies of the practice."}
                                    <div className="mt-8 border-t border-gray-50 pt-8 italic text-gray-400 font-light">
                                        {lesson.content_markdown}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Resources */}
                        <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit">
                            <div className="bg-white rounded-[2rem] p-10 border border-[#1A1A1A]/5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-8">
                                <div>
                                    <h4 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A] mb-2">Resources</h4>
                                    <p className="text-xs text-gray-400 font-light">Materials & downloads for this session</p>
                                </div>

                                {lesson.resources && lesson.resources.length > 0 ? (
                                    <ul className="space-y-4">
                                        {lesson.resources.map((res: any, i: number) => (
                                            <li key={i}>
                                                <a
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-4 group transition-all"
                                                >
                                                    <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border border-gray-100 flex items-center justify-center group-hover:bg-[#E87C55] group-hover:border-[#E87C55] transition-all duration-300">
                                                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#E87C55] transition-colors">{res.title}</span>
                                                        <span className="text-[10px] text-gray-400 font-light uppercase tracking-tighter">Downloadable PDF</span>
                                                    </div>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-100 rounded-2xl">
                                        <p className="text-xs text-gray-300 italic">No additional resources</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
