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
    const [view, setView] = useState<"courses" | "modules" | "lessons" | "edit-lesson" | "edit-module">("courses");

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
        if (view === "edit-module") {
            setIsEditing(false);
            setView("modules");
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

    // CRUD Handlers
    const startEditLesson = (lesson: any = null) => {
        setSelectedLesson(lesson);
        setEditForm(lesson || { title: "", description: "", video_url: "", order_index: lessons.length + 1 });
        setIsEditing(true);
        setView("edit-lesson");
    };

    const startEditModule = (module: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedModule(module);
        setEditForm({ ...module });
        setIsEditing(true);
        setView("edit-module");
    };

    const saveLesson = async () => {
        if (!selectedModule) return;
        setSaving(true);
        try {
            let finalUrl = editForm.video_url || "";

            // Auto-extract URL if a full HTML embed code is pasted (iframe or div)
            if (finalUrl.includes('<iframe') || finalUrl.includes('<div')) {
                const srcMatch = finalUrl.match(/src=["']([^"']+)["']/);
                if (srcMatch && srcMatch[1]) {
                    finalUrl = srcMatch[1];
                }
            }

            const payload = {
                ...editForm,
                video_url: finalUrl,
                module_id: selectedModule.id,
                video_provider: finalUrl.includes('vimeo') ? 'vimeo' :
                    (finalUrl.includes('bunny.net') || finalUrl.includes('mediadelivery.net')) ? 'bunny' : 'custom'
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

    const saveModule = async () => {
        if (!selectedModule) return;
        setSaving(true);
        try {
            await educationAPI.updateModule(selectedModule.id, {
                title: editForm.title,
                description: editForm.description,
                image_url: editForm.image_url
            });
            // Reload all modules to update list
            if (activeCourseId) await loadModules(activeCourseId);
            else if (selectedCourse) await loadModules(selectedCourse.id);
            // Fallback reload logic if state is tricky

            setView("modules");
            setIsEditing(false);
        } catch (e) {
            alert("Error saving module");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const activeCourseId = selectedCourse?.id; // Helper

    const deleteLessonItem = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await educationAPI.deleteLesson(id);
            await loadLessons(selectedModule.id);
        } catch (e) { console.error(e); }
    }

    const toggleModuleLock = async (mod: any, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the module
        try {
            const newStatus = !mod.is_locked_by_default;
            await educationAPI.updateModule(mod.id, { is_locked_by_default: newStatus });
            // Optimistic update
            const updated = modules.map(m => m.id === mod.id ? { ...m, is_locked_by_default: newStatus } : m);
            setModules(updated);
        } catch (err) {
            console.error("Failed to toggle lock", err);
        }
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
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={m.is_locked_by_default ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-gray-300 hover:text-green-600"}
                                    onClick={(e) => toggleModuleLock(m, e)}
                                    title={m.is_locked_by_default ? "Locked (Click to Unlock)" : "Unlocked (Click to Lock)"}
                                >
                                    {m.is_locked_by_default ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={(e) => startEditModule(m, e)} title="Edit Module Settings"><Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => openModule(m)}>Manage Lessons <ChevronRight className="w-4 h-4 ml-1" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Lessons View */}
            {!loading && view === "lessons" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                        <div>
                            <h3 className="font-medium text-lg">Module Content</h3>
                            <p className="text-sm text-muted-foreground">Manage the videos and lessons for this module.</p>
                        </div>
                        <Button onClick={() => startEditLesson(null)}><Plus className="w-4 h-4 mr-2" /> Add Lesson</Button>
                    </div>

                    {lessons.length === 0 && <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">No lessons added yet. Click above to add one.</div>}

                    <div className="space-y-3">
                        {lessons.map((l) => (
                            <div key={l.id} className="border p-4 rounded-xl bg-card flex justify-between items-center hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center text-muted-foreground font-mono text-sm bg-muted rounded-md">
                                        {l.order_index}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{l.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            {l.video_url ? <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Play className="w-3 h-3 mr-1" /> Video Set</span> : <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">No Video</span>}
                                            <span>• {l.duration_minutes} min</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => startEditLesson(l)}><Edit2 className="w-4 h-4 text-primary" /></Button>
                                    <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-700 hover:bg-red-50" onClick={() => deleteLessonItem(l.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Lesson Form */}
            {!loading && view === "edit-lesson" && (
                <div className="max-w-2xl mx-auto space-y-6 bg-card p-8 rounded-xl border shadow-sm">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lesson Title</label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="e.g. 1.1 Welcome to Breathwork"
                                className="text-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Order Index</label>
                                <Input
                                    type="number"
                                    value={editForm.order_index}
                                    onChange={(e) => setEditForm({ ...editForm, order_index: parseInt(e.target.value) })}
                                />
                                <p className="text-[10px] text-muted-foreground">Determines the sequence in the module.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (min)</label>
                                <Input
                                    type="number"
                                    value={editForm.duration_minutes || 0}
                                    onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Brief summary of what this lesson covers..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                                <FileVideo className="w-4 h-4 text-primary" />
                                <label className="text-sm font-medium">Video Content</label>
                            </div>

                            <Input
                                value={editForm.video_url || ''}
                                onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                                placeholder="https://..."
                            />
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Supported formats:</p>
                                <ul className="list-disc list-inside ml-1">
                                    <li><strong>Bunny.net (Vaninet):</strong> Paste the embed URL (e.g. from Stream {'>'} Embed)</li>
                                    <li><strong>WordPress / Direct MP4:</strong> Paste the full URL ending in .mp4</li>
                                    <li><strong>Vimeo / YouTube:</strong> Paste the shareable link</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button variant="outline" onClick={goBack}>Cancel</Button>
                        <Button onClick={saveLesson} disabled={saving} className="min-w-[120px]">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {selectedLesson ? "Save Changes" : "Create Lesson"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Module Form */}
            {!loading && view === "edit-module" && (
                <div className="max-w-2xl mx-auto space-y-6 bg-card p-8 rounded-xl border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Edit Module</h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Module Title</label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="e.g. Module 1: Foundations"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cover Image URL</label>
                            <div className="flex gap-2">
                                <Input
                                    value={editForm.image_url || ''}
                                    onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Paste a direct link to an image (e.g. from WordPress media library).</p>
                        </div>

                        {editForm.image_url && (
                            <div className="mt-4 rounded-xl overflow-hidden border h-48 w-full bg-gray-100 relative">
                                <img src={editForm.image_url} alt="Preview" className="h-full w-full object-cover" />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Preview</div>
                            </div>
                        )}

                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button variant="outline" onClick={goBack}>Cancel</Button>
                        <Button onClick={saveModule} disabled={saving} className="min-w-[120px]">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}
