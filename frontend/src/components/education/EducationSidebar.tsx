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
        <div className={cn("w-80 border-r bg-white flex flex-col h-[calc(100vh-64px)]", className)}>
            <div className="p-6 border-b">
                <h2 className="font-semibold text-lg text-gray-900">Breathwork Education</h2>
                <p className="text-xs text-muted-foreground mt-1">20 Weeks • 6 Modules</p>
                {/* Global Progress Bar could go here */}
                <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E87C55] w-[15%]" />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {modules.map((module, index) => (
                        <div key={module.id} className="space-y-2">
                            <div
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                    activeModuleId === module.id ? "bg-orange-50" : "hover:bg-gray-50"
                                )}
                                onClick={() => onNavigate('education-module', module.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border",
                                        activeModuleId === module.id
                                            ? "border-[#E87C55] text-[#E87C55] bg-white"
                                            : "border-gray-300 text-gray-500"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        activeModuleId === module.id ? "text-[#E87C55]" : "text-gray-700"
                                    )}>
                                        {module.title}
                                    </span>
                                </div>
                            </div>

                            {/* Lessons List - Expanded if active module */}
                            {(activeModuleId === module.id || true) && (
                                <div className="pl-9 space-y-1 relative">
                                    {/* Vertical line connector */}
                                    <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />

                                    {module.lessons?.map((lesson: any) => {
                                        const isActive = activeLessonId === lesson.id;
                                        const isCompleted = progress[lesson.id];

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => onNavigate('education-lesson', lesson.id)}
                                                className={cn(
                                                    "w-full text-left flex items-start gap-2 py-2 px-2 rounded text-sm transition-colors relative z-10",
                                                    isActive ? "bg-orange-50/50 text-[#E87C55]" : "text-gray-600 hover:text-gray-900"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                ) : isActive ? (
                                                    <PlayCircle className="w-4 h-4 text-[#E87C55] mt-0.5 shrink-0" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                                                )}
                                                <span className={cn("line-clamp-1", isActive && "font-medium")}>
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
