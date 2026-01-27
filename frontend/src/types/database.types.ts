export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'instructor' | 'client'
                    bio: string | null
                    avatar_url: string | null
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'instructor' | 'client'
                    bio?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'instructor' | 'client'
                    bio?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            session_templates: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    duration_minutes: number
                    price: number
                    currency: string
                    category: string | null
                    image_url: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    duration_minutes: number
                    price: number
                    currency?: string
                    category?: string | null
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    duration_minutes?: number
                    price?: number
                    currency?: string
                    category?: string | null
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            locations: {
                Row: {
                    id: string
                    name: string
                    address: string | null
                    type: 'in-person' | 'online'
                    capacity: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    address?: string | null
                    type: 'in-person' | 'online'
                    capacity?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string | null
                    type?: 'in-person' | 'online'
                    capacity?: number | null
                    created_at?: string
                }
            }
            availability_rules: {
                Row: {
                    id: string
                    instructor_id: string
                    session_template_id: string | null
                    weekday: number // 0-6
                    start_time: string // HH:MM
                    end_time: string // HH:MM
                    location_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    instructor_id: string
                    session_template_id?: string | null
                    weekday: number
                    start_time: string
                    end_time: string
                    location_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    instructor_id?: string
                    session_template_id?: string | null
                    weekday?: number
                    start_time?: string
                    end_time?: string
                    location_id?: string | null
                    created_at?: string
                }
            }
            availability_exceptions: {
                Row: {
                    id: string
                    instructor_id: string
                    session_template_id: string | null
                    date: string // YYYY-MM-DD
                    start_time: string
                    end_time: string
                    location_id: string | null
                    is_available: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    instructor_id: string
                    session_template_id?: string | null
                    date: string
                    start_time: string
                    end_time: string
                    location_id?: string | null
                    is_available?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    instructor_id?: string
                    session_template_id?: string | null
                    date?: string
                    start_time?: string
                    end_time?: string
                    location_id?: string | null
                    is_available?: boolean
                    created_at?: string
                }
            }
            availability_blocked_dates: {
                Row: {
                    id: string
                    instructor_id: string
                    date: string
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    instructor_id: string
                    date: string
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    instructor_id?: string
                    date?: string
                    reason?: string | null
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    session_id: string
                    customer_id: string | null
                    status: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
                    price: number | null
                    currency: string
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    customer_id?: string | null
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
                    price?: number | null
                    currency?: string
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    customer_id?: string | null
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'no_show'
                    price?: number | null
                    currency?: string
                    notes?: string | null
                    created_at?: string
                }
            }
            sessions: {
                Row: {
                    id: string
                    session_template_id: string
                    instructor_id: string | null
                    location_id: string | null
                    category_id: string | null
                    start_time: string
                    end_time: string
                    capacity: number | null
                    booked_count: number
                    status: 'scheduled' | 'cancelled' | 'completed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_template_id: string
                    instructor_id?: string | null
                    location_id?: string | null
                    category_id?: string | null
                    start_time: string
                    end_time: string
                    capacity?: number | null
                    booked_count?: number
                    status?: 'scheduled' | 'cancelled' | 'completed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_template_id?: string
                    instructor_id?: string | null
                    location_id?: string | null
                    category_id?: string | null
                    start_time?: string
                    end_time?: string
                    capacity?: number | null
                    booked_count?: number
                    status?: 'scheduled' | 'cancelled' | 'completed'
                    created_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string | null
                    applies_to: 'session' | 'program' | 'product' | 'all'
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug?: string | null
                    applies_to?: 'session' | 'program' | 'product' | 'all'
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string | null
                    applies_to?: 'session' | 'program' | 'product' | 'all'
                    description?: string | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: string | null
                    title: string
                    message: string
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type?: string | null
                    title: string
                    message: string
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string | null
                    title?: string
                    message?: string
                    read?: boolean
                    created_at?: string
                }
            }
            education_courses: {
                Row: {
                    id: string
                    title: string
                    slug: string
                    description: string | null
                    thumbnail_url: string | null
                    price_eur: number | null
                    price_dkk: number | null
                    is_published: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    slug: string
                    description?: string | null
                    thumbnail_url?: string | null
                    price_eur?: number | null
                    price_dkk?: number | null
                    is_published?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    slug?: string
                    description?: string | null
                    thumbnail_url?: string | null
                    price_eur?: number | null
                    price_dkk?: number | null
                    is_published?: boolean
                    created_at?: string
                }
            }
            education_modules: {
                Row: {
                    id: string
                    course_id: string
                    title: string
                    description: string | null
                    order_index: number
                    theme_color: string | null
                    image_url: string | null
                    is_locked_by_default: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    title: string
                    description?: string | null
                    order_index: number
                    theme_color?: string | null
                    image_url?: string | null
                    is_locked_by_default?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    title?: string
                    description?: string | null
                    order_index?: number
                    theme_color?: string | null
                    image_url?: string | null
                    is_locked_by_default?: boolean
                    created_at?: string
                }
            }
            education_lessons: {
                Row: {
                    id: string
                    module_id: string
                    title: string
                    description: string | null
                    video_url: string | null
                    video_provider: 'vimeo' | 'youtube' | 'custom'
                    duration_minutes: number | null
                    content_markdown: string | null
                    order_index: number
                    resources: Json[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    module_id: string
                    title: string
                    description?: string | null
                    video_url?: string | null
                    video_provider?: 'vimeo' | 'youtube' | 'custom'
                    duration_minutes?: number | null
                    content_markdown?: string | null
                    order_index: number
                    resources?: Json[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    module_id?: string
                    title?: string
                    description?: string | null
                    video_url?: string | null
                    video_provider?: 'vimeo' | 'youtube' | 'custom'
                    duration_minutes?: number | null
                    content_markdown?: string | null
                    order_index?: number
                    resources?: Json[] | null
                    created_at?: string
                }
            }
            education_enrollments: {
                Row: {
                    id: string
                    user_id: string
                    course_id: string
                    status: string
                    enrolled_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    course_id: string
                    status?: string
                    enrolled_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    course_id?: string
                    status?: string
                    enrolled_at?: string
                }
            }
            education_progress: {
                Row: {
                    user_id: string
                    lesson_id: string
                    is_completed: boolean
                    completed_at: string | null
                    last_watched_position_seconds: number | null
                }
                Insert: {
                    user_id: string
                    lesson_id: string
                    is_completed?: boolean
                    completed_at?: string | null
                    last_watched_position_seconds?: number | null
                }
                Update: {
                    user_id?: string
                    lesson_id?: string
                    is_completed?: boolean
                    completed_at?: string | null
                    last_watched_position_seconds?: number | null
                }
            }
            platform_settings: {
                Row: {
                    id: string
                    key: string
                    value: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            bundles: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price: number
                    currency: string
                    image_url: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price: number
                    currency?: string
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    currency?: string
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            bundle_items: {
                Row: {
                    id: string
                    bundle_id: string
                    item_type: 'session' | 'course' | 'product'
                    item_id: string
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    bundle_id: string
                    item_type: 'session' | 'course' | 'product'
                    item_id: string
                    quantity?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    bundle_id?: string
                    item_type?: 'session' | 'course' | 'product'
                    item_id?: string
                    quantity?: number
                    created_at?: string
                }
            }
            bundle_purchases: {
                Row: {
                    id: string
                    user_id: string
                    bundle_id: string | null
                    purchase_date: string
                    status: 'pending' | 'completed' | 'refunded' | 'failed'
                    stripe_payment_id: string | null
                    stripe_session_id: string | null
                    amount_paid: number | null
                    currency: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    bundle_id?: string | null
                    purchase_date?: string
                    status?: 'pending' | 'completed' | 'refunded' | 'failed'
                    stripe_payment_id?: string | null
                    stripe_session_id?: string | null
                    amount_paid?: number | null
                    currency?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    bundle_id?: string | null
                    purchase_date?: string
                    status?: 'pending' | 'completed' | 'refunded' | 'failed'
                    stripe_payment_id?: string | null
                    stripe_session_id?: string | null
                    amount_paid?: number | null
                    currency?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            redemption_codes: {
                Row: {
                    id: string
                    code: string
                    bundle_purchase_id: string | null
                    user_id: string
                    total_uses: number
                    remaining_uses: number
                    status: 'active' | 'completed' | 'expired'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    code: string
                    bundle_purchase_id?: string | null
                    user_id: string
                    total_uses?: number
                    remaining_uses?: number
                    status?: 'active' | 'completed' | 'expired'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    code?: string
                    bundle_purchase_id?: string | null
                    user_id?: string
                    total_uses?: number
                    remaining_uses?: number
                    status?: 'active' | 'completed' | 'expired'
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_: string]: never
        }
        Functions: {
            redeem_bundle_code: {
                Args: {
                    code_input: string
                }
                Returns: Json
            }
        }
        Enums: {
            [_: string]: never
        }
    }
}
