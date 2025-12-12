export interface EducationCourse {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    price_eur: number | null;
    price_dkk: number | null;
    is_published: boolean;
    created_at: string;
}

export interface EducationModule {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    order_index: number;
    theme_color: string;
    image_url: string | null;
    is_locked_by_default: boolean;
    created_at: string;
}

export interface EducationLesson {
    id: string;
    module_id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    video_provider: 'vimeo' | 'youtube' | 'custom';
    duration_minutes: number | null;
    content_markdown: string | null;
    order_index: number;
    resources: any[]; // JSONB array
    created_at: string;
}

export interface EducationEnrollment {
    id: string;
    user_id: string;
    course_id: string;
    status: 'active' | 'completed' | 'expired';
    enrolled_at: string;
}

export interface EducationProgress {
    user_id: string;
    lesson_id: string;
    is_completed: boolean;
    completed_at: string | null;
    last_watched_position_seconds: number;
}
