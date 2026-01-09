import React, { useEffect, useState } from 'react';
import { educationAPI } from '../../utils/api';
import { EducationSidebar } from './EducationSidebar';
import { Button } from "../ui/button";
import { Loader2, CheckCircle, ChevronRight, FileText, FileVideo, HelpCircle, AlertCircle, CheckCircle2, ChevronLeft, Maximize2, Minimize2, PlayCircle } from "lucide-react";
import { cn } from "../ui/utils";
import { useAuth } from '../../hooks/useAuth';

// --- DEMO CONTENT ---
const DEMO_QUIZ = {
    id: "demo-quiz-1",
    passing_score: 80,
    questions: [
        {
            question: "Hvad er det primære formål med Modul 1?",
            options: [
                "At lære avancerede åndedrætsteknikker",
                "At etablere et fundament af indre sikkerhed og somatisk bevidsthed",
                "At markedsføre sig selv som facilitator",
                "At lære om lungernes anatomi i detaljer"
            ],
            correctAnswerIndex: 1
        },
        {
            question: "Hvilket nervesystem aktiveres typisk ved hurtig, overfladisk vejrtrækning?",
            options: [
                "Det parasympatiske nervesystem (Ro & Hvile)",
                "Det enteriske nervesystem (Fordøjelse)",
                "Det sympatiske nervesystem (Kamp & Flugt)",
                "Det centrale nervesystem"
            ],
            correctAnswerIndex: 2
        },
        {
            question: "Hvad indebærer 'Somatisk Orientering'?",
            options: [
                "At tænke positivt om kroppen",
                "At mærke og navigere ud fra kroppens sansninger frem for kun tanker",
                "At ignorere kroppens signaler for at præstere",
                "At analysere følelser intellektuelt"
            ],
            correctAnswerIndex: 1
        }
    ]
};

function NativeSlideViewer({ lessonId }: { lessonId: string }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Enhanced Slide Content with Layouts & Placeholders
    // REPLACE these URLs with the user's uploaded images later
    const slides = [
        {
            layout: "title",
            title: "Modul 1, lektion 1",
            subtitle: "GRUNDLAG, RAMME & BEVIDSTHED",
            content: "Breathwork Facilitator Uddannelsen\nWezet Breathwork Education\nUdgave 2026",
            image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2000&auto=format&fit=crop", // Placeholder: Abstract/Calm
        },
        {
            layout: "content-right",
            title: "1. Foremål med Modul 1",
            point: "Modul 1 er dit landingspunkt og fundament.",
            details: [
                "Inner understanding (Indre forståelse)",
                "Safety principles (Sikkerhedsprincipper)",
                "Session structure (Sessionsstruktur)",
                "Somatic orientation (Somatisk orientering)"
            ],
            image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2000&auto=format&fit=crop", // Placeholder: Meditation/Focus
        },
        {
            layout: "list",
            title: "2. Lektionsoversigt – Modul 1",
            items: [
                "1.1: Welcome, tradition & platform navigation",
                "1.2: Why breathwork works (Physiology, ANS)",
                "1.3: Natural patterns (Diaphragmatic vs Chest)",
                "1.4: Wezet 10-step session frame architecture",
                "1.5: The 4 Pillars (Awareness, Technique, Capacity, Integration)",
                "1.6: Safety and self-regulation (Contraindications)"
            ],
            image: "https://images.unsplash.com/photo-1484069560501-87d72b0c3669?q=80&w=2000&auto=format&fit=crop" // Placeholder: Structure/Books
        },
        {
            layout: "split",
            title: "3. Hvad denne uddannelse handler om",
            content: "Disciplin, metode og relation. Ikke blot øvelser, men videnskabelige principper, historie og moderne fysiologi.",
            emphasis: "Målet er at guide andre sikkert, etisk og ansvarligt.",
            image: "https://images.unsplash.com/photo-1515023663285-11035f965660?q=80&w=2000&auto=format&fit=crop" // Placeholder: Group/Teaching
        },
        {
            layout: "content-left",
            title: "4. Grundlaget for åndedrætsarbejde",
            content: "Forstå åndedrættet udover trends.",
            focus: ["Somatisk bevidsthed", "Indre sikkerhed", "Nervesystemsorientering"],
            image: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?q=80&w=2000&auto=format&fit=crop" // Placeholder: Lungs/Breathing
        },
        {
            layout: "list",
            title: "5. Åndedrættet som bro",
            items: [ // Using 'items' for consistency with 'bridges'
                "Body / Mind",
                "Conscious / Unconscious",
                "Physiology / Emotions",
                "Activation / Regulation",
                "Trauma / Integration"
            ],
            image: "https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=2000&auto=format&fit=crop" // Placeholder: Bridge/Connection
        },
        {
            layout: "table",
            title: "6. Åndedrættet afspejler din tilstand",
            patterns: [
                { state: "Stress", pattern: "Fast, shallow, chest-based" },
                { state: "Calm", pattern: "Long exhale, diaphragmatic" },
                { state: "Freeze", pattern: "Little to no breathing" },
                { state: "Anxiety", pattern: "Short inhale, high chest" },
                { state: "Grief", pattern: "Long, heavy exhale" }
            ],
            image: "" // No image for table view, background pattern only
        },
        {
            layout: "pillars",
            title: "8. Ravene krav",
            subtitle: "(Hvad uddannelsen kræver af dig)",
            pillars: [
                { name: "Ærlighed", desc: "Møde dig selv som du er" },
                { name: "Konsistens", desc: "Ét åndedrag ad gangen" },
                { name: "Ansvar", desc: "Selvregulering før facilitering" }
            ]
        },
        {
            layout: "quote",
            title: "9. Misforståelser",
            content: "Det handler ikke om præstation, intensitet eller at flygte fra følelser.",
            citation: "Det er en relationspraksis med din krop og historie.",
            image: "https://images.unsplash.com/photo-1518531933037-91b2f5d2294c?q=80&w=2000&auto=format&fit=crop"
        },
        {
            layout: "progression",
            title: "10. Sådan arbejder du",
            items: ["Awareness", "Technique", "Capacity", "Integration", "Facilitation"]
        },
        {
            layout: "landing",
            title: "Et øjeblik til at lande",
            exercise: "Observér åndedrættets bevægelse, luftens temperatur og tempo. Uden at ændre noget.",
            image: "https://images.unsplash.com/photo-1528319725582-ddc096101511?q=80&w=2000&auto=format&fit=crop" // Placeholder: Nature/Peace
        }
    ];

    const next = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    const prev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const slide = slides[currentSlide];

    return (
        <div
            ref={containerRef}
            className={cn(
                "group relative overflow-hidden transition-all duration-500 bg-[#FDFBF7]",
                isFullscreen ? "h-screen w-screen rounded-none" : "aspect-video rounded-[32px] shadow-2xl"
            )}
        >
            {/* Background Image (with Fade) */}
            <div className="absolute inset-0 z-0">
                {slide.image && (
                    <>
                        <img
                            src={slide.image}
                            alt="Background"
                            className={cn(
                                "w-full h-full object-cover transition-opacity duration-700",
                                slide.layout === 'title' || slide.layout === 'landing' ? "opacity-30 blur-sm" :
                                    slide.layout === 'quote' ? "opacity-20 grayscale" : "opacity-10"
                            )}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent" />
                    </>
                )}
                {/* Decorative Abstract Shapes (Wezet feel) */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E87C55]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E87C55]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Slide Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col p-8 md:p-12 lg:p-20">

                {/* Header / Top Bar */}
                <div className="flex justify-between items-start mb-8">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#E87C55] bg-[#E87C55]/10 px-3 py-1 rounded-full">
                        {slide.layout !== 'title' ? `Module 1 • ${slides[0].title}` : 'Wezet Education'}
                    </span>
                </div>

                {/* DYNAMIC LAYOUTS */}
                <div className="flex-1 flex flex-col justify-center">

                    {/* TITLE LAYOUT */}
                    {slide.layout === 'title' && (
                        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="block text-[#E87C55] text-sm font-bold tracking-[0.3em] uppercase">{slide.title}</span>
                            <h1 className="text-5xl md:text-7xl font-light text-[#1A1A1A] tracking-tight leading-tight">
                                {slide.subtitle}
                            </h1>
                            <div className="w-24 h-1 bg-[#E87C55] mx-auto rounded-full" />
                            <p className="text-lg md:text-xl text-gray-500 font-light whitespace-pre-line leading-relaxed">
                                {slide.content}
                            </p>
                        </div>
                    )}

                    {/* CONTENT RIGHT / LEFT / SPLIT */}
                    {(slide.layout === 'content-right' || slide.layout === 'content-left' || slide.layout === 'split') && (
                        <div className={cn("grid gap-12 items-center", slide.image ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                            <div className={cn("space-y-6 order-2", slide.layout === 'content-right' ? "md:order-1" : "md:order-2")}>
                                <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight">{slide.title}</h2>
                                {slide.point && <p className="text-[#E87C55] text-xl font-medium">{slide.point}</p>}
                                {slide.content && <p className="text-lg text-gray-600 leading-relaxed font-light">{slide.content}</p>}
                                {slide.details && (
                                    <ul className="space-y-3">
                                        {slide.details.map((d: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#E87C55] shrink-0" />
                                                <span>{d}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {slide.emphasis && <p className="text-[#1A1A1A] italic font-medium border-l-4 border-[#E87C55] pl-4">{slide.emphasis}</p>}
                            </div>

                            {/* Optional Image Panel in Split View */}
                            {slide.image && (
                                <div className={cn("relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl rotate-1 order-1", slide.layout === 'content-right' ? "md:order-2" : "md:order-1")}>
                                    <img src={slide.image} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* LIST OR PILLARS */}
                    {(slide.layout === 'list' || slide.layout === 'pillars') && (
                        <div className="space-y-8 max-w-4xl mx-auto w-full">
                            <h2 className="text-3xl font-bold text-[#1A1A1A] text-center mb-12">{slide.title} <span className="text-gray-400 font-light block text-lg mt-2">{slide.subtitle}</span></h2>

                            {slide.items && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {slide.items.map((item: string, i: number) => (
                                        <div key={i} className="flex items-center gap-4 bg-white/60 p-4 rounded-xl shadow-sm border border-white hover:border-[#E87C55]/30 transition-all">
                                            <div className="w-8 h-8 rounded-full bg-[#E87C55]/10 text-[#E87C55] flex items-center justify-center font-bold text-sm shrink-0">
                                                {i + 1}
                                            </div>
                                            <span className="text-gray-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {slide.pillars && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {slide.pillars.map((p: any, i: number) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] text-center space-y-4 hover:-translate-y-1 transition-transform duration-300">
                                            <div className="w-12 h-12 mx-auto bg-[#E87C55] rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                {p.name[0]}
                                            </div>
                                            <h3 className="font-bold text-[#1A1A1A]">{p.name}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TABLE LAYOUT */}
                    {slide.layout === 'table' && (
                        <div className="max-w-3xl mx-auto w-full space-y-8">
                            <h2 className="text-3xl font-bold text-[#1A1A1A] text-center">{slide.title}</h2>
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                {slide.patterns?.map((p: any, i: number) => (
                                    <div key={i} className="grid grid-cols-3 p-6 border-b border-gray-100 last:border-0 hover:bg-[#FDFBF7] transition-colors">
                                        <span className="font-bold text-[#E87C55] uppercase tracking-widest text-xs self-center">{p.state}</span>
                                        <span className="col-span-2 text-gray-600 font-light text-lg">{p.pattern}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* QUOTE / LANDING */}
                    {(slide.layout === 'quote' || slide.layout === 'landing') && (
                        <div className="text-center max-w-4xl mx-auto space-y-10">
                            {slide.layout === 'landing' && (
                                <div className="w-20 h-20 rounded-full border-2 border-[#E87C55] flex items-center justify-center mx-auto animate-pulse text-[#E87C55]">
                                    <PlayCircle className="w-10 h-10" />
                                </div>
                            )}
                            <h2 className="text-4xl md:text-5xl font-light text-[#1A1A1A] leading-tight">
                                "{slide.content || slide.exercise}"
                            </h2>
                            {slide.citation && <p className="text-[#E87C55] font-bold tracking-widest uppercase text-sm">— {slide.citation}</p>}
                            {slide.layout === 'landing' && <p className="text-gray-400 uppercase tracking-widest text-xs">Take a moment to arrive</p>}
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="mt-8 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="text-gray-400 hover:text-[#1A1A1A] hover:bg-black/5 rounded-full"
                        >
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </Button>
                        <span className="text-[10px] text-gray-300 font-mono hidden md:inline-block">
                            {currentSlide + 1} / {slides.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={prev}
                            disabled={currentSlide === 0}
                            className="rounded-full w-12 h-12 border-gray-200 bg-white hover:bg-[#E87C55] hover:text-white hover:border-[#E87C55] transition-all duration-300 shadow-md flex items-center justify-center p-0 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-300"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={next}
                            disabled={currentSlide === slides.length - 1}
                            className="rounded-full w-12 h-12 border-gray-200 bg-white hover:bg-[#E87C55] hover:text-white hover:border-[#E87C55] transition-all duration-300 shadow-md flex items-center justify-center p-0 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-300"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
                    <div
                        className="h-full bg-[#E87C55] transition-all duration-500 ease-out"
                        style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

interface LessonPlayerProps {
    lessonId: string;
    onNavigate: (view: string, id?: string) => void;
}

interface Lesson {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    presentation_url?: string;
    video_url?: string;
    content_markdown?: string;
    duration_minutes?: number;
    isCompleted?: boolean;
}

interface Quiz {
    id: string;
    lesson_id: string;
    questions: any[];
    passing_score?: number;
}

interface Submission {
    id: string;
    is_passed: boolean;
    score: number;
}

interface Lesson {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    presentation_url?: string;
    video_url?: string;
    content_markdown?: string;
    duration_minutes?: number;
    resources?: any[];
    isCompleted?: boolean;
}

interface Quiz {
    id: string;
    lesson_id: string;
    questions: any[];
    passing_score?: number;
}

interface Submission {
    id: string;
    is_passed: boolean;
    score: number;
}

export function LessonPlayer({ lessonId, onNavigate }: LessonPlayerProps) {
    const { user } = useAuth();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [modulesList, setModulesList] = useState<any[]>([]);
    const [activeModuleId, setActiveModuleId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                // Load Lesson Details
                const l = (await educationAPI.getLesson(lessonId)) as Lesson | null;
                if (l) {
                    setLesson(l);
                    setActiveModuleId(l.module_id);
                }

                // Load Quiz (Isolated to prevent blocking the whole page)
                try {
                    const q = (await educationAPI.getQuizByLessonId(lessonId)) as Quiz | null;
                    if (q) {
                        setQuiz(q);
                        if (user) {
                            const sub = (await educationAPI.getSubmission(q.id, user.id)) as Submission | null;
                            if (sub) {
                                setSubmission(sub);
                                if (sub.is_passed) {
                                    setQuizResult({ score: sub.score, passed: true });
                                }
                            }
                        }
                    } else if (lessonId && lesson?.title?.toLowerCase().includes("1.1")) {
                        // Fallback to DEMO QUIZ only for Lesson 1.1 if no DB quiz exists
                        console.log("Using Demo Quiz");
                        setQuiz(DEMO_QUIZ as any);
                    }
                } catch (quizError) {
                    console.error("Quiz load error:", quizError);
                    setQuiz(null);
                }

                // Load Sidebar
                try {
                    const coursesData = (await educationAPI.getCourses()) as any[];
                    if (coursesData && coursesData[0]) {
                        const m = (await educationAPI.getModules(coursesData[0].id)) as any[];
                        const modulesWithLessons = await Promise.all(m.map(async (mod: any) => {
                            const lessonsData = (await educationAPI.getLessons(mod.id)) as any[];
                            if (l && mod.id === l.module_id) {
                                const currentL = lessonsData.find((x: any) => x.id === lessonId);
                                if (currentL?.isCompleted) setIsCompleted(true);
                            }
                            return { ...mod, lessons: lessonsData };
                        }));
                        setModulesList(modulesWithLessons);
                    }
                } catch (sidebarError) {
                    console.error("Sidebar load error:", sidebarError);
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
        const questions = quiz.questions || [];
        questions.forEach((q: any, idx: number) => {
            if (quizAnswers[idx] === q.correctAnswerIndex) correctCount++;
        });

        const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
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
                // Also update local modules list for sidebar
                setModulesList(prev => prev.map(m => ({
                    ...m,
                    lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, isCompleted: true } : l)
                })));
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

        // Final safety check: if lesson is 1.1 and not completed, require quiz
        if (lesson?.title?.toLowerCase().includes("1.1") && !isCompleted && !quizResult?.passed) {
            document.getElementById('lesson-quiz')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

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

                            {/* Native Slide Viewer or PPTX Viewer */}
                            {(lesson.title?.toLowerCase().includes("1.1") || lesson.id === "69177a6a-d9de-4475-802c-559d877a5e8c" || lesson.presentation_url === "native") ? (
                                <div className="space-y-6 pt-12 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[#E87C55] rounded-full" />
                                        <h3 className="text-xl font-bold text-[#1A1A1A]">Lesson Presentation</h3>
                                    </div>
                                    <NativeSlideViewer lessonId={lesson.id} />
                                </div>
                            ) : lesson.presentation_url ? (
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
                            ) : null}

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
                                                className="w-full h-16 rounded-2xl hover:bg-[#E87C55] text-white font-bold tracking-[0.2em] uppercase transition-all duration-500 mt-8 disabled:opacity-30"
                                                style={{ backgroundColor: '#1A1A1A' }}
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
                                disabled={marking || (quiz && !isCompleted && !quizResult?.passed) || (lesson?.title?.toLowerCase().includes("1.1") && !isCompleted && !quizResult?.passed)}
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
