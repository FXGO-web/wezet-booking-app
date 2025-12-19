import React from 'react';
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { CheckCircle2, Circle, Lock, PlayCircle, BookOpen } from "lucide-react";

interface EducationSidebarProps {
    modules: any[];
    activeModuleId?: string;
    activeLessonId?: string;
    onNavigate: (view: string, id: string) => void;
    className?: string;
    progress?: Record<string, boolean>; // map lessonId -> isCompleted
}

export function EducationSidebar({
    modules,
    activeModuleId,
    activeLessonId,
    onNavigate,
    className,
    progress = {}
}: EducationSidebarProps) {
    return (
        <div className={cn("w-80 bg-white flex flex-col h-[calc(100vh-64px)] relative z-20", className)}>
            <div className="p-8 border-b border-gray-50 space-y-4">
                <div className="space-y-1">
                    <h2 className="font-bold text-xl text-[#1A1A1A] tracking-tight">Curriculum</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Breathwork Education</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-[#E87C55] uppercase tracking-widest">Progress</span>
                        <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">15%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div className="h-full bg-[#E87C55] w-[15%] rounded-full shadow-[0_0_10px_rgba(232,124,85,0.3)]" />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {modules.map((module, index) => (
                        <div key={module.id} className="space-y-4">
                            <div
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group",
                                    activeModuleId === module.id
                                        ? "bg-[#E87C55]/5 border border-[#E87C55]/10"
                                        : "hover:bg-gray-50 border border-transparent"
                                )}
                                onClick={() => onNavigate('education-module', module.id)}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold border transition-all duration-300",
                                    activeModuleId === module.id
                                        ? "border-[#E87C55] text-white bg-[#E87C55] shadow-lg shadow-[#E87C55]/20"
                                        : "border-gray-200 text-[#1A1A1A]/30 bg-white group-hover:border-[#E87C55] group-hover:text-[#E87C55]"
                                )}>
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold tracking-tight transition-colors",
                                    activeModuleId === module.id ? "text-[#E87C55]" : "text-[#1A1A1A]/70 group-hover:text-[#1A1A1A]"
                                )}>
                                    {module.title}
                                </span>
                            </div>

                            {/* Lessons List */}
                            {(activeModuleId === module.id) && (
                                <div className="pl-6 space-y-1 relative">
                                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-gray-100 via-gray-100 to-transparent" />

                                    {module.lessons?.map((lesson: any) => {
                                        const isActive = activeLessonId === lesson.id;
                                        const isCompleted = progress[lesson.id];

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => onNavigate('education-lesson', lesson.id)}
                                                className={cn(
                                                    "w-full text-left flex items-start gap-3 py-3 px-4 rounded-xl text-xs transition-all duration-300 relative z-10 group",
                                                    isActive
                                                        ? "bg-white shadow-md shadow-gray-200/50 text-[#E87C55] border border-gray-100"
                                                        : "text-muted-foreground hover:text-[#1A1A1A] border border-transparent"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                ) : isActive ? (
                                                    <PlayCircle className="w-4 h-4 text-[#E87C55] mt-0.5 shrink-0 animate-pulse" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-gray-200 mt-0.5 shrink-0 group-hover:text-gray-400 group-hover:scale-110 transition-all" />
                                                )}
                                                <span className={cn("line-clamp-2 leading-relaxed transition-all", isActive && "font-bold tracking-tight")}>
                                                    {lesson.title}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
