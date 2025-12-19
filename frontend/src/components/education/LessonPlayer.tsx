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
        <div className="flex h-screen bg-[#FDFBF7]">
            <EducationSidebar
                modules={modulesList}
                activeModuleId={activeModuleId}
                activeLessonId={lessonId}
                onNavigate={onNavigate}
                className="hidden lg:flex bg-white border-r border-gray-100 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)]"
                progress={{ [lessonId]: isCompleted }}
            />

            <div className="flex-1 overflow-auto flex flex-col items-center">

                {/* Video Stage - High-End Presentation */}
                <div className="w-full bg-[#FDFBF7] flex items-center justify-center relative shadow-sm overflow-hidden border-b border-gray-100">
                    {lesson.video_url ? (
                        <div className="w-full max-w-[1600px] mx-auto relative group aspect-video">
                            {(lesson.video_url.includes('vimeo.com') || lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be')) ? (
                                <iframe
                                    src={lesson.video_url.replace('vimeo.com/', 'player.vimeo.com/video/').replace('watch?v=', 'embed/')}
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (lesson.video_url.includes('bunny.net') || lesson.video_url.includes('mediadelivery.net')) ? (
                                <iframe
                                    src={lesson.video_url.replace('/play/', '/embed/')}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    controls
                                    className="absolute inset-0 w-full h-full object-contain"
                                    src={lesson.video_url}
                                    controlsList="nodownload"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}

                            {/* Subtle Glass Fade */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </div>
                    ) : (
                        <div className="h-[40vh] md:h-[60vh] flex flex-col items-center justify-center bg-white/40 w-full">
                            <div className="w-20 h-20 rounded-[2rem] border border-gray-100 bg-white flex items-center justify-center mb-6 shadow-sm">
                                <FileVideo className="w-8 h-8 text-[#E87C55]/40" />
                            </div>
                            <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-gray-400">Preparing session...</p>
                        </div>
                    )}
                </div>

                {/* Lesson Info Section */}
                <div className="w-full max-w-6xl px-4 md:px-12 py-10 md:py-20 mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-24">

                        {/* Main Content Pane */}
                        <div className="lg:col-span-8 space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-[#E87C55]/10 text-[#E87C55] rounded-full text-[10px] font-bold tracking-[0.15em] uppercase">
                                        Active Lesson
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-gray-200" />
                                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">{lesson.duration_minutes || 20} min</span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] tracking-tight leading-tight">
                                    {lesson.title}
                                </h1>
                                <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                                    {lesson.description || "Take a deep dive into the practice with this session's core concepts."}
                                </p>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div className="prose prose-stone max-w-none">
                                <div className="text-gray-600 text-base md:text-lg font-light leading-relaxed whitespace-pre-line space-y-8">
                                    {lesson.content_markdown}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Resources Pane */}
                        <div className="lg:col-span-4 space-y-8">
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-16 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all duration-500",
                                    !isCompleted
                                        ? "bg-[#E87C55] hover:bg-[#D96C3B] text-white shadow-xl shadow-[#E87C55]/20"
                                        : "bg-white border-2 border-green-100 text-green-600 shadow-none hover:bg-green-50"
                                )}
                                onClick={handleComplete}
                                disabled={marking}
                            >
                                {marking ? (
                                    <Loader2 className="animate-spin w-5 h-5 text-white" />
                                ) : isCompleted ? (
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6" />
                                        <span>Lesson Completed</span>
                                    </div>
                                ) : (
                                    "Mark as Complete"
                                )}
                            </Button>

                            <div className="p-8 pb-10 rounded-2xl border bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] space-y-8">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold tracking-widest uppercase text-[#1A1A1A]">Session Toolkit</h4>
                                    <p className="text-xs text-muted-foreground font-light">Materials to support your practice</p>
                                </div>

                                {lesson.resources && lesson.resources.length > 0 ? (
                                    <div className="space-y-3">
                                        {lesson.resources.map((res: any, i: number) => (
                                            <a
                                                key={i}
                                                href={res.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-[#FDFBF7] hover:border-[#E87C55]/30 hover:bg-[#E87C55]/5 group transition-all"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-muted-foreground group-hover:text-[#E87C55] transition-colors shrink-0">
                                                    <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-semibold text-[#1A1A1A] truncate">{res.title}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Handout • PDF</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-xl space-y-3">
                                        <FileText className="w-8 h-8 text-gray-100" />
                                        <p className="text-[10px] text-gray-300 italic">No resources for this session</p>
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
