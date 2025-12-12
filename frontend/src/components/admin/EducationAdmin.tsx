import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { educationAPI } from "../../utils/api";
import { Loader2, Plus, ArrowLeft, Trash2, Edit2, Play, ChevronRight, Lock, Unlock, LayoutList, FileVideo } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface EducationAdminProps {
    onBack?: () => void;
}

export function EducationAdmin({ onBack }: EducationAdminProps) {
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [view, setView] = useState<"courses" | "modules" | "lessons" | "edit-lesson">("courses");

    // Selection State
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);

    // Data State
    const [modules, setModules] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await educationAPI.getCourses();
            setCourses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadModules = async (courseId: string) => {
        setLoading(true);
        try {
            const data = await educationAPI.getModules(courseId);
            setModules(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadLessons = async (moduleId: string) => {
        setLoading(true);
        try {
            const data = await educationAPI.getLessons(moduleId);
            setLessons(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Navigation Handlers
    const openCourse = (course: any) => {
        setSelectedCourse(course);
        loadModules(course.id);
        setView("modules");
    };

    const openModule = (mod: any) => {
        setSelectedModule(mod);
        loadLessons(mod.id);
        setView("lessons");
    };

    const goBack = () => {
        if (view === "edit-lesson") {
            setIsEditing(false);
            setView("lessons");
            return;
        }
        if (view === "lessons") {
            setSelectedModule(null);
            setLessons([]);
            setView("modules");
            return;
        }
        if (view === "modules") {
            setSelectedCourse(null);
            setModules([]);
            setView("courses");
            return;
        }
        if (onBack) onBack();
    };

    // CRUD Handlers (Simplyfied for brevity, normally modals)
    // For this MVP, we will assume standard CRUD logic or inline editing not fully fleshed out 
    // unless requesting specific "Edit Lesson" screen. 
    // Let's build a simple Edit Form for Lesson only, as that's the priority (video uploads).

    const startEditLesson = (lesson: any = null) => {
        setSelectedLesson(lesson);
        setEditForm(lesson || { title: "", description: "", video_url: "", order_index: lessons.length + 1 });
        setIsEditing(true);
        setView("edit-lesson");
    };

    const saveLesson = async () => {
        if (!selectedModule) return;
        setSaving(true);
        try {
            const payload = {
                ...editForm,
                module_id: selectedModule.id,
                video_provider: editForm.video_url?.includes('vimeo') ? 'vimeo' : 'custom'
            };

            if (selectedLesson) {
                await educationAPI.updateLesson(selectedLesson.id, payload);
            } else {
                await educationAPI.createLesson(payload);
            }
            await loadLessons(selectedModule.id);
            setView("lessons");
            setIsEditing(false);
        } catch (e) {
            alert("Error saving lesson");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const deleteLessonItem = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await educationAPI.deleteLesson(id);
            await loadLessons(selectedModule.id);
        } catch (e) { console.error(e); }
    }


    return (
        <div className="min-h-screen bg-background p-6 md:p-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={goBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">E-Learning Management</h1>
                    <p className="text-muted-foreground text-sm">
                        {view === "courses" && "Manage Courses"}
                        {view === "modules" && `Manage Modules for ${selectedCourse?.title}`}
                        {view === "lessons" && `Manage Lessons for ${selectedModule?.title}`}
                        {view === "edit-lesson" && (selectedLesson ? "Edit Lesson" : "New Lesson")}
                    </p>
                </div>
            </div>

            {loading && <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>}

            {!loading && view === "courses" && (
                <div className="grid gap-4">
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        Note: Currently managing the single main course. To add more courses, use the database or request feature expansion.
                    </p>
                    {courses.map((c) => (
                        <div key={c.id} className="border p-6 rounded-xl bg-card hover:shadow-md cursor-pointer flex justify-between items-center" onClick={() => openCourse(c)}>
                            <div>
                                <h3 className="font-semibold text-lg">{c.title}</h3>
                                <p className="text-muted-foreground">{c.slug}</p>
                            </div>
                            <ChevronRight className="text-muted-foreground" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && view === "modules" && (
                <div className="space-y-4">
                    {/* Add Module Button Placeholder */}
                    <div className="flex justify-end"><Button variant="outline" disabled>Add Module (DB Only)</Button></div>

                    {modules.map((m) => (
                        <div key={m.id} className="border p-4 rounded-xl bg-card hover:bg-muted/50 transition-colors flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {m.order_index}
                                </div>
                                <div>
                                    <h3 className="font-medium">{m.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {m.is_locked_by_default && <Lock className="w-4 h-4 text-muted-foreground" />}
                                <Button size="sm" variant="ghost" onClick={() => openModule(m)}>Manage Lessons <ChevronRight className="w-4 h-4 ml-1" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && view === "lessons" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => startEditLesson(null)}><Plus className="w-4 h-4 mr-2" /> Add Lesson</Button>
                    </div>

                    {lessons.length === 0 && <div className="text-center py-12 text-muted-foreground">No lessons allowed yet.</div>}

                    {lessons.map((l) => (
                        <div key={l.id} className="border p-4 rounded-xl bg-card flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 flex items-center justify-center text-muted-foreground font-mono text-sm">
                                    {l.order_index}
                                </div>
                                <div>
                                    <h3 className="font-medium">{l.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {l.video_url ? <span className="flex items-center text-green-600"><Play className="w-3 h-3 mr-1" /> Video Set</span> : <span className="text-red-400">No Video</span>}
                                        <span>• {l.duration_minutes} min</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" onClick={() => startEditLesson(l)}><Edit2 className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteLessonItem(l.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && view === "edit-lesson" && (
                <div className="max-w-2xl mx-auto space-y-6 bg-card p-8 rounded-xl border">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Lesson Title</label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="e.g. 1.1 Welcome"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Order Index</label>
                                <Input
                                    type="number"
                                    value={editForm.order_index}
                                    onChange={(e) => setEditForm({ ...editForm, order_index: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Duration (min)</label>
                                <Input
                                    type="number"
                                    value={editForm.duration_minutes || 0}
                                    onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <Textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Brief summary..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Video URL (WordPress MP4 or Vimeo)</label>
                            <Input
                                value={editForm.video_url || ''}
                                onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                                placeholder="https://wezet.xyz/.../video.mp4"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Paste the full direct link for WordPress files, or the Vimeo/YouTube URL.
                            </p>
                        </div>

                        {/* Markdown content could be added here later */}

                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="ghost" onClick={goBack}>Cancel</Button>
                        <Button onClick={saveLesson} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Lesson
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}
