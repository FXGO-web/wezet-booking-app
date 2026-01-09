import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { EducationSidebar } from './EducationSidebar';
import { Button } from "../ui/button";
import { Loader2, CheckCircle, ChevronRight, FileText, FileVideo, HelpCircle, AlertCircle, CheckCircle2 } from "lucide-react";
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
    const [quiz, setQuiz] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                // Load Lesson Details
                const l = await educationAPI.getLesson(lessonId);
                setLesson(l);
                setActiveModuleId(l.module_id);

                // Load Quiz
                const q = await educationAPI.getQuizByLessonId(lessonId);
                setQuiz(q);

                if (q && user) {
                    const sub = await educationAPI.getSubmission(q.id, user.id);
                    setSubmission(sub);
                    if (sub?.is_passed) {
                        setQuizResult({ score: sub.score, passed: true });
                    }
                }

                // Load Sidebar
                const courses = await educationAPI.getCourses();
                if (courses[0]) {
                    const m = await educationAPI.getModules(courses[0].id);
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
    }, [lessonId, user?.id]);

    const handleSubmitQuiz = async () => {
        if (!quiz || !user) return;

        let correctCount = 0;
        quiz.questions.forEach((q: any, idx: number) => {
            if (quizAnswers[idx] === q.correctAnswerIndex) correctCount++;
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        const passed = score >= (quiz.passing_score || 80);

        try {
            setMarking(true);
            await educationAPI.submitQuiz({
                user_id: user.id,
                quiz_id: quiz.id,
                score,
                is_passed: passed,
                answers: quizAnswers
            });

            setQuizResult({ score, passed });

            if (passed) {
                await educationAPI.markLessonComplete(lessonId, user.id, true);
                setIsCompleted(true);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to submit quiz");
        } finally {
            setMarking(false);
        }
    };

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

                            {/* PPTX Viewer - Image 2 Style */}
                            {lesson.presentation_url && (
                                <div className="space-y-6 pt-12 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[#E87C55] rounded-full" />
                                        <h3 className="text-xl font-bold text-[#1A1A1A]">Lesson Presentation</h3>
                                    </div>
                                    <div className="aspect-[16/10] bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden relative group">
                                        <iframe
                                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(lesson.presentation_url)}&embedded=true`}
                                            className="w-full h-full border-none"
                                            title="Presentation Viewer"
                                        />
                                        <a
                                            href={lesson.presentation_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute bottom-6 right-6 px-4 py-2 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                                        >
                                            View Fullscreen
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Quiz Interface - NEW */}
                            {quiz && (
                                <div id="lesson-quiz" className="space-y-8 pt-12 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-[#E87C55] rounded-full" />
                                            <h3 className="text-xl font-bold text-[#1A1A1A]">Lesson Quiz</h3>
                                        </div>
                                        {quizResult?.passed && (
                                            <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest bg-green-50 px-4 py-2 rounded-full">
                                                <CheckCircle2 className="w-4 h-4" /> Passed
                                            </div>
                                        )}
                                    </div>

                                    {!quizResult?.passed ? (
                                        <div className="space-y-10 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                            {quiz.questions.map((q: any, idx: number) => (
                                                <div key={idx} className="space-y-6">
                                                    <h4 className="text-lg font-semibold text-[#1A1A1A]">
                                                        <span className="text-[#E87C55] mr-2">{idx + 1}.</span>
                                                        {q.question}
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {q.options.map((opt: string, optIdx: number) => (
                                                            <button
                                                                key={optIdx}
                                                                onClick={() => {
                                                                    const newAns = [...quizAnswers];
                                                                    newAns[idx] = optIdx;
                                                                    setQuizAnswers(newAns);
                                                                }}
                                                                className={cn(
                                                                    "p-6 text-left rounded-2xl border transition-all duration-300",
                                                                    quizAnswers[idx] === optIdx
                                                                        ? "bg-[#E87C55] border-[#E87C55] text-white shadow-lg shadow-[#E87C55]/20"
                                                                        : "bg-[#FDFBF7] border-gray-100 text-gray-600 hover:border-[#E87C55]/30 hover:bg-white"
                                                                )}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                size="lg"
                                                className="w-full h-16 rounded-2xl bg-[#1A1A1A] hover:bg-[#E87C55] text-white font-bold tracking-[0.2em] uppercase transition-all duration-500 mt-8 disabled:opacity-30"
                                                disabled={quizAnswers.length < quiz.questions.length || marking}
                                                onClick={handleSubmitQuiz}
                                            >
                                                {marking ? <Loader2 className="animate-spin" /> : "Submit Quiz & Complete Lesson"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 p-12 rounded-3xl border border-green-100 flex flex-col items-center justify-center text-center space-y-4">
                                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
                                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-green-900">Well Done!</h4>
                                            <p className="text-green-700 max-w-md">
                                                You've successfully mastered the key concepts of this lesson with a score of {quizResult.score}%.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions & Resources Pane */}
                        <div className="lg:col-span-4 space-y-8">
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-16 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all duration-500",
                                    !isCompleted
                                        ? "bg-[#E87C55] hover:bg-[#D96C3B] text-white shadow-xl shadow-[#E87C55]/20"
                                        : "bg-white border-2 border-green-100 text-green-600 shadow-none hover:bg-green-50 cursor-default"
                                )}
                                onClick={quiz && !isCompleted ? () => document.getElementById('lesson-quiz')?.scrollIntoView({ behavior: 'smooth' }) : handleComplete}
                                disabled={marking || (quiz && !isCompleted && !quizResult?.passed)}
                            >
                                {marking ? (
                                    <Loader2 className="animate-spin w-5 h-5 text-white" />
                                ) : isCompleted ? (
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6" />
                                        <span>Lesson Completed</span>
                                    </div>
                                ) : quiz ? (
                                    "Jump to Quiz"
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
