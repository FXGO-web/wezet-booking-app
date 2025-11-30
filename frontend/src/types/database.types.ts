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
        }
        Views: {
            [_: string]: never
        }
        Functions: {
            [_: string]: never
        }
        Enums: {
            [_: string]: never
        }
    }
}
