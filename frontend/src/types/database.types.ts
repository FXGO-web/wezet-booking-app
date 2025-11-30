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
                    profile_id: string
                    day_of_week: number // 0-6
                    start_time: string // HH:MM
                    end_time: string // HH:MM
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    day_of_week?: number
                    start_time?: string
                    end_time?: string
                    created_at?: string
                }
            }
            availability_specific_slots: {
                Row: {
                    id: string
                    profile_id: string
                    date: string // YYYY-MM-DD
                    start_time: string
                    end_time: string
                    is_available: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    date: string
                    start_time: string
                    end_time: string
                    is_available?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    date?: string
                    start_time?: string
                    end_time?: string
                    is_available?: boolean
                    created_at?: string
                }
            }
            availability_blocked_dates: {
                Row: {
                    id: string
                    profile_id: string
                    date: string
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    date: string
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    date?: string
                    reason?: string | null
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    customer_id: string
                    session_template_id: string | null
                    instructor_id: string | null
                    start_time: string
                    end_time: string
                    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    total_price: number
                    currency: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    customer_id: string
                    session_template_id?: string | null
                    instructor_id?: string | null
                    start_time: string
                    end_time: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    total_price: number
                    currency?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string
                    session_template_id?: string | null
                    instructor_id?: string | null
                    start_time?: string
                    end_time?: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
                    total_price?: number
                    currency?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
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
