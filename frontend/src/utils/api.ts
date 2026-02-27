// frontend/src/utils/api.ts
// API central para la UI de WEZET -> Supabase

import { supabase } from "./supabase/client";
import { Database } from "../types/database.types";

/**
 * NOTA GENERAL
 * ------------
 * Tablas disponibles (public):
 * - platform_settings
 * - notifications
 * - profiles
 * - session_templates
 * - sessions
 * - bookings
 * - availability_rules
 * - availability_exceptions
 * - availability_blocked_dates
 * - locations
 * - categories
 *
 * Este archivo expone los siguientes objetos:
 *  - authAPI
 *  - teamMembersAPI
 *  - customersAPI
 *  - servicesAPI / sessionsAPI
 *  - locationsAPI
 *  - bookingsAPI
 *  - digitalContentAPI / productsAPI
 *  - statsAPI
 *  - settingsAPI
 *  - analyticsAPI
 *  - availabilityAPI
 *  - programsAPI
 */

// ===========================================================
// AUTH
// ===========================================================

console.log("WEZET API VERSION: SYNC_FIX_V2");

import { MOCK_COURSE, MOCK_MODULES, MOCK_LESSONS } from "./education-mock-data";

export const authAPI = {
  signup: async (
    email: string,
    password: string,
    name: string,
    role: "admin" | "instructor" | "client" = "client"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
        },
      },
    });
    if (error) throw error;
    return data;
  },
};

// ===========================================================
// PROFILES -> TEAM MEMBERS
// ===========================================================

export const teamMembersAPI = {
  getAll: async (filters?: { role?: string; search?: string; status?: string }) => {
    let query = supabase.from("profiles").select("*");

    if (filters?.role) query = query.ilike("role", filters.role);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Sort by newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return { teamMembers: data ?? [] };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (member: any) => {
    // Use the Edge Function to create the user in auth.users and update the profile
    const { data, error } = await supabase.functions.invoke("create_user", {
      body: {
        email: member.email,
        password: member.password || "TempPassword123!", // Use provided password or fallback
        fullName: member.fullName || member.name || member.full_name,
        role: member.role || "instructor",
        phone: member.phone || null,
        bio: member.bio || null,
        specialties: member.specialties || [],
        status: member.status || "active",
        avatarUrl: member.avatarUrl || member.avatar_url || null,
      },
    });

    if (error) {
      console.error("Invoke error creating team member:", error);
      throw error;
    }

    if (data?.error) {
      console.error("Function error creating team member:", data.error);
      throw new Error(data.error);
    }

    // The function returns { user: ... }, we want to return the profile-like object
    return data.user;
  },

  update: async (id: string, updates: any) => {
    // If password is being updated, we MUST use the Edge Function
    if (updates.password) {
      console.log("Using Edge Function for user update (password change detected)");
      const { data, error } = await supabase.functions.invoke("update_user", {
        body: {
          id,
          updates: updates
        }
      });

      if (error) {
        console.error("Error updating user via Edge Function:", error);
        throw error;
      }
      return data;
    }

    const mapped: any = {};
    if (updates.full_name) mapped.full_name = updates.full_name;
    if (updates.fullName) mapped.full_name = updates.fullName;
    if (updates.name) mapped.full_name = updates.name; // Handle 'name' update
    if (updates.avatar_url) mapped.avatar_url = updates.avatar_url;
    if (updates.avatarUrl) mapped.avatar_url = updates.avatarUrl;
    if (updates.role) mapped.role = updates.role;
    if (updates.bio) mapped.bio = updates.bio;
    // if (updates.email) mapped.email = updates.email; // Avoid updating email directly to prevent sync issues
    if (updates.phone) mapped.phone = updates.phone;
    if (updates.specialties) mapped.specialties = updates.specialties;
    if (updates.status) mapped.status = updates.status;

    console.log("Using Direct DB Update for profile", id, "with payload:", mapped);

    const { data, error } = await supabase
      .from("profiles")
      .update(mapped)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Direct DB Update failed:", error);
      throw error;
    }
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  },

  sendPasswordReset: async (email: string) => {
    const redirectTo = `${window.location.origin}/?view=update-password`;

    // Use the same Custom Edge Function as useAuth.tsx for consistency
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'password_recovery',
        to: email,
        payload: { redirectTo }
      }
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to send reset email via Edge Function');
    }

    return { success: true };
  },
};

// ===========================================================
// CUSTOMERS API
// ===========================================================

export const customersAPI = {
  getAll: async (filters?: { search?: string }) => {
    let query = supabase.from("profiles").select("*").ilike("role", "client");

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    // Sort by newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return { customers: data ?? [] };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
};

// ===========================================================
// SERVICES / SESSION_TEMPLATES
// ===========================================================

export const servicesAPI = {
  getAll: async (filters?: { category?: string; search?: string }) => {
    let query = supabase
      .from("session_templates")
      .select(
        `
        *,
        instructor:instructor_id ( id, full_name ),
        category:category_id ( id, name ),
        location:location_id ( id, name )
      `
      );

    if (filters?.category) query = query.eq("category_id", filters.category);
    if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return { services: data ?? [] };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("session_templates")
      .select(
        `
        *,
        instructor:instructor_id ( id, full_name ),
        category:category_id ( id, name ),
        location:location_id ( id, name )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (service: any) => {
    const payload: any = {
      name: service.name,
      description: service.description,
      duration_minutes: service.duration ?? service.duration_minutes,
      price: service.basePrice ?? service.price,
      currency: service.currency ?? "EUR",
      category_id: service.categoryId ?? service.category_id ?? null,
      location_id: service.locationId ?? service.location_id ?? null,
      instructor_id: service.instructorId ?? service.instructor_id ?? null,
      capacity: service.capacity ?? null,
      session_type:
        service.sessionType ?? service.session_type ?? "class_group",
      is_active: service.status ? service.status === "active" : true,
      // fixed_prices: service.fixedPrices || service.fixed_prices || null, // REMOVED to avoid PGRST204
    };

    const fixedPrices = service.fixedPrices || service.fixed_prices || null;

    const { data, error } = await supabase
      .from("session_templates")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    if (fixedPrices) {
      // Use V2 RPC to bypass cache issues
      const { error: rpcError } = await supabase.rpc('update_session_prices_v2', {
        p_id: data.id,
        p_fixed_prices: fixedPrices
      });
      if (rpcError) {
        console.error("Error saving fixed prices via RPC v2:", rpcError);
      }
    }

    return data;
  },

  update: async (id: string, updates: any) => {
    console.log("Updating service", id, "with payload:", updates);
    const mapped: any = {};
    if (updates.name) mapped.name = updates.name;
    if (updates.description) mapped.description = updates.description;

    // Handle duration (check for 0 as well)
    if (updates.duration !== undefined || updates.duration_minutes !== undefined) {
      mapped.duration_minutes = updates.duration ?? updates.duration_minutes;
    }

    if (updates.basePrice ?? updates.price)
      mapped.price = updates.basePrice ?? updates.price;
    if (updates.currency) mapped.currency = updates.currency;
    if (updates.categoryId ?? updates.category_id)
      mapped.category_id = updates.categoryId ?? updates.category_id;
    if (updates.locationId ?? updates.location_id)
      mapped.location_id = updates.locationId ?? updates.location_id;

    // Map teamMemberId/instructorId to instructor_id
    if (updates.instructorId ?? updates.instructor_id ?? updates.teamMemberId)
      mapped.instructor_id =
        updates.instructorId ?? updates.instructor_id ?? updates.teamMemberId;

    if (updates.categoryId !== undefined || updates.category_id !== undefined) {
      mapped.category_id = updates.categoryId ?? updates.category_id;
      // Convert empty string to null if needed, though usually we want a valid UUID
      if (mapped.category_id === "") mapped.category_id = null;
    }

    if (updates.locationId !== undefined || updates.location_id !== undefined) {
      const locId = updates.locationId ?? updates.location_id;
      mapped.location_id = locId === "" || locId === "none" ? null : locId;
    }
    if (updates.sessionType ?? updates.session_type)
      mapped.session_type =
        updates.sessionType ?? updates.session_type;
    if (updates.status) mapped.is_active = updates.status === "active";

    // Extract fixed prices for RPC
    const fixedPrices = updates.fixedPrices || updates.fixed_prices;

    console.log("Mapped service update payload (excluding fixed_prices):", mapped);

    const { data, error } = await supabase
      .from("session_templates")
      .update(mapped)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (fixedPrices) {
      console.log("Updating fixed prices via RPC v2 for", id);
      const { error: rpcError } = await supabase.rpc('update_session_prices_v2', {
        p_id: id,
        p_fixed_prices: fixedPrices
      });
      if (rpcError) {
        console.error("Error updating fixed prices via RPC v2:", rpcError);
      }
    }

    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("session_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  },
};

export const sessionsAPI = servicesAPI;

// ===========================================================
// LOCATIONS
// ===========================================================

export const locationsAPI = {
  getAll: async (filters?: { search?: string }) => {
    let query = supabase.from("locations").select("*");

    if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return { locations: data ?? [] };
  },

  create: async (location: any) => {
    // Strict payload for locations
    const payload = {
      name: location.name,
      address: location.address || null,
      type: location.type || "in-person",
      capacity: location.capacity ? Number(location.capacity) : null,
      description: location.description || null,
      status: location.status || "active",
    };

    console.log("Creating location with payload:", payload);

    const { data, error } = await supabase
      .from("locations")
      .insert(payload as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.address) payload.address = updates.address;
    if (updates.type) payload.type = updates.type;
    if (updates.capacity !== undefined) payload.capacity = Number(updates.capacity) || null;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status) payload.status = updates.status;

    console.log("Updating location", id, "with payload:", payload);

    const { data, error } = await supabase
      .from("locations")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ===========================================================
// CATEGORIES
// ===========================================================

export const categoriesAPI = {
  getAll: async (filters?: { appliesTo?: string }) => {
    let query = supabase.from("categories").select("*").order("name");

    if (filters?.appliesTo) {
      query = query.or(`applies_to.eq.${filters.appliesTo},applies_to.eq.all`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { categories: data ?? [] };
  },
};

// ===========================================================
// BOOKINGS
// ===========================================================

export const bookingsAPI = {
  getAll: async (filters?: {
    status?: string;
    teamMemberId?: string;
    serviceId?: string;
    customerId?: string;
  }) => {
    let query = supabase
      .from("bookings")
      .select(
        `
        *,
        customer:customer_id ( id, full_name, email, phone ),
        session:sessions!bookings_session_id_fkey (
          id,
          start_time,
          end_time,
          instructor:instructor_id ( id, full_name, avatar_url ),
          template:session_template_id ( id, name, price, currency, duration_minutes, category:category_id(name) ),
          location:location_id ( id, name )
        )
      `
      );

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.teamMemberId)
      query = query.eq("session.instructor_id", filters.teamMemberId);
    if (filters?.serviceId)
      query = query.eq("session.session_template_id", filters.serviceId);
    if (filters?.customerId)
      query = query.eq("customer_id", filters.customerId);

    const { data, error } = await query;
    if (error) throw error;

    const mapped =
      data?.map((b: any) => {
        const start = b.session?.start_time
          ? new Date(b.session.start_time)
          : null;

        return {
          id: b.id,
          clientName: b.customer?.full_name ?? "Unknown client",
          clientEmail: b.customer?.email ?? "",
          clientPhone: b.customer?.phone ?? "",
          serviceName: b.session?.template?.name ?? "Unknown service",
          serviceId: b.session?.template?.id ?? "",
          category: b.session?.template?.category?.name ?? "General",
          teamMemberName:
            b.session?.instructor?.full_name ?? "Unknown instructor",
          teamMemberId: b.session?.instructor?.id ?? "",
          mentorId: b.session?.instructor?.id,
          practitionerAvatar: b.session?.instructor?.avatar_url,
          startTime: start ? start.toISOString() : null, // Added for robust date handling
          date: start ? start.toISOString().slice(0, 10) : "",
          time: start
            ? start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : "",
          location: b.session?.location?.name ?? "",
          price:
            b.price ?? b.session?.template?.price ?? null,
          currency:
            b.currency ??
            b.session?.template?.currency ??
            "EUR",
          status: b.status,
          notes: b.notes ?? "",
        };
      }) ?? [];

    return { bookings: mapped };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        customer:customer_id ( id, full_name, email ),
        session:sessions!bookings_session_id_fkey (
          id,
          start_time,
          end_time,
          instructor:instructor_id ( id, full_name ),
          template:session_template_id ( id, name, price, currency, duration_minutes ),
          location:location_id ( id, name )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (booking: any) => {
    // If we have a sessionId, we can try direct insert (if RLS allows, but safer to use RPC if possible or just rely on old logic)
    // But our improved logic relies on template_id + time if session doesn't exist.

    if (booking.serviceId && booking.date) {
      try {
        // Preferred path: DB RPC
        const { data, error } = await supabase.rpc('create_booking_from_template', {
          p_template_id: booking.serviceId,
          p_start_time: booking.date, // BookingFlow sends ISO string
          p_customer_id: booking.customer_id || booking.customerId,
          p_status: booking.status || 'confirmed',
          p_price: booking.price || 0,
          p_currency: booking.currency || 'EUR',
          p_notes: booking.notes || null
        });

        if (error) {
          throw error;
        }
        return data;
      } catch (rpcError: any) {
        console.warn("RPC create_booking_from_template failed, trying edge function fallback:", rpcError);

        // Fallback path: Edge Function with service role backing (works even if RPC is missing in this environment)
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('create-booking', {
          body: {
            template_id: booking.serviceId,
            start_time: booking.date,
            customer_id: booking.customer_id || booking.customerId || null,
            status: booking.status || 'confirmed',
            price: booking.price || 0,
            currency: booking.currency || 'EUR',
            notes: booking.notes || null,
          }
        });

        if (fallbackError || fallbackData?.error) {
          console.error("Error creating booking via fallback function:", fallbackError || fallbackData);
          throw fallbackError || new Error(fallbackData?.error || "Booking creation failed");
        }

        return fallbackData;
      }
    }

    // Fallback for direct session ID (legacy or specific use case)
    const payload: Database["public"]["Tables"]["bookings"]["Insert"] = {
      customer_id: booking.customerId,
      session_id: booking.sessionId,
      status: booking.status ?? "pending",
      price: booking.price ?? 0,
      currency: booking.currency ?? "EUR",
      notes: booking.notes ?? null,
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.currency) payload.currency = updates.currency;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ===========================================================
// DIGITAL CONTENT
// ===========================================================

export const digitalContentAPI = {
  getAll: async (filters?: { search?: string }) => {
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });

    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching products:", error);
      // Return empty if table doesn't exist yet to avoid crashing app
      return { content: [] };
    }
    return { content: data ?? [] };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (product: any) => {
    const payload = {
      title: product.title,
      description: product.description,
      type: product.type || "video_course",
      fixed_prices: product.fixedPrices || { EUR: product.price || 0, DKK: 0 },
      item_count: product.itemCount || 1,
      status: product.status || "active",
      image_url: product.imageUrl || null,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const mapped: any = {};
    if (updates.title) mapped.title = updates.title;
    if (updates.description) mapped.description = updates.description;
    if (updates.type) mapped.type = updates.type;
    if (updates.fixedPrices) mapped.fixed_prices = updates.fixedPrices;
    if (updates.itemCount) mapped.item_count = updates.itemCount;
    if (updates.status) mapped.status = updates.status;
    if (updates.imageUrl) mapped.image_url = updates.imageUrl;

    const { data, error } = await supabase
      .from("products")
      .update(mapped)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  }
};

export const productsAPI = digitalContentAPI;

// ===========================================================
// STATS
// ===========================================================

// ===========================================================
// BUNDLES
// ===========================================================

export const bundlesAPI = {
  getMyBundles: async (userId: string) => {
    const { data, error } = await supabase
      .from("bundle_purchases")
      .select(
        `
        *,
        bundle:bundle_id ( name, description, credits )
        `
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .gt("remaining_credits", 0);

    if (error) throw error;
    return { myBundles: data || [] };
  },
};

export const statsAPI = {
  getDashboard: async () => {
    const { count: bookingsCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { data: bookingRows, error } = await supabase
      .from("bookings")
      .select("price");

    if (error) throw error;

    const revenue =
      bookingRows?.reduce(
        (acc: number, b: any) => acc + (Number(b.price) || 0),
        0
      ) ?? 0;

    return {
      stats: {
        totalBookings: bookingsCount ?? 0,
        totalUsers: usersCount ?? 0,
        revenue,
      },
    };
  },
};

// ===========================================================
// SETTINGS (Custom Vercel API Route)
// ===========================================================

export const settingsAPI = {
  get: async () => {
    // Direct DB call - RLS allows public read
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Settings fetch error:", error);
      throw new Error(`Settings fetch failed: ${error.message}`);
    }

    // Map snake_case from DB to camelCase for Frontend
    const s = data || {};
    const mappedSettings = {
      platformName: s.platform_name,
      supportEmail: s.support_email,
      timezone: s.timezone,
      defaultCurrency: s.default_currency,
      taxRate: s.tax_rate,
      minAdvance: s.min_booking_advance_hours,
      maxAdvance: s.max_booking_advance_days,
      cancelWindow: s.cancellation_window_hours,
      requireApproval: s.require_approval,
      stripePublic: s.stripe_public_key,
      stripeSecret: s.stripe_secret_key,
      stripeWebhookSecret: s.stripe_webhook_secret,
      resendApiKey: s.resend_api_key, // Added Resend Key
      testMode: s.stripe_test_mode,
      bookingConfirm: s.email_template_confirmation,
      bookingReminder: s.email_template_reminder,
      cancellation: s.email_template_cancellation,
      newBookingNotify: s.notify_new_bookings,
      cancelNotify: s.notify_cancellations,
      dailySummary: s.notify_daily_summary,
      notifyEmail: s.notify_email,
    };

    return { settings: mappedSettings };
  },

  update: async (settings: any) => {
    const mapped: any = {};

    // General
    if (settings.platformName) mapped.platform_name = settings.platformName;
    if (settings.supportEmail) mapped.support_email = settings.supportEmail;
    if (settings.timezone) mapped.timezone = settings.timezone;

    // Currency
    if (settings.defaultCurrency) mapped.default_currency = settings.defaultCurrency;
    if (settings.taxRate !== undefined) mapped.tax_rate = settings.taxRate;

    // Booking Rules
    if (settings.minAdvance !== undefined) mapped.min_booking_advance_hours = settings.minAdvance;
    if (settings.maxAdvance !== undefined) mapped.max_booking_advance_days = settings.maxAdvance;
    if (settings.cancelWindow !== undefined) mapped.cancellation_window_hours = settings.cancelWindow;
    if (settings.requireApproval !== undefined) mapped.require_approval = settings.requireApproval;

    // Payment
    if (settings.stripePublic) mapped.stripe_public_key = settings.stripePublic;
    if (settings.stripeSecret) mapped.stripe_secret_key = settings.stripeSecret;
    if (settings.stripeWebhookSecret) mapped.stripe_webhook_secret = settings.stripeWebhookSecret;
    if (settings.testMode !== undefined) mapped.stripe_test_mode = settings.testMode;

    // Email (Resend)
    if (settings.resendApiKey) mapped.resend_api_key = settings.resendApiKey;

    // Email Templates
    if (settings.bookingConfirm) mapped.email_template_confirmation = settings.bookingConfirm;
    if (settings.bookingReminder) mapped.email_template_reminder = settings.bookingReminder;
    if (settings.cancellation) mapped.email_template_cancellation = settings.cancellation;

    // Notifications
    if (settings.newBookingNotify !== undefined) mapped.notify_new_bookings = settings.newBookingNotify;
    if (settings.cancelNotify !== undefined) mapped.notify_cancellations = settings.cancelNotify;
    if (settings.dailySummary !== undefined) mapped.notify_daily_summary = settings.dailySummary;
    if (settings.notifyEmail) mapped.notify_email = settings.notifyEmail;

    // Direct DB update - RLS allows admin update
    const { data, error } = await supabase
      .from("platform_settings")
      .update(mapped)
      .eq("id", 1)
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      throw new Error(`Settings update failed: ${error.message}`);
    }

    return data;
  },

  testEmail: async (email: string) => {
    const { data, error } = await supabase.functions.invoke("send-test-email", {
      body: { to: email },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data;
  },
};

// ===========================================================
// ANALYTICS (placeholder)
// ===========================================================

export const analyticsAPI = {
  getOverview: async () => ({ revenue: [], bookings: [] }),
  getRevenueReport: async () => ({ revenue: 0, breakdown: [] }),
  getTeamPerformance: async () => ({ team: [] }),
  getCategoryBreakdown: async () => ({ categories: [] }),
  exportReport: async () => ({ url: "" }),
};

// ===========================================================
// AVAILABILITY
// ===========================================================

export const availabilityAPI = {
  getTeamMembers: async () => {
    // Fetch all profiles first
    const { teamMembers } = await teamMembersAPI.getAll({});

    // Define valid team roles
    const teamRoles = [
      'admin',
      'instructor',
      'teacher',
      'facilitator',
      'team member',
      'founder & ceo wezet',
      'coach'
    ];

    // Filter for team members only (case-insensitive)
    // Relaxed filter: Allow admins, instructors, and explicit team roles
    const filteredMembers = teamMembers
      .filter((m: any) => {
        if (!m.role) return false;

        // Explicitly allow specific emails (case-insensitive)
        const email = (m.email || '').toLowerCase();
        if (email.includes('hanna@wezet.xyz')) return true;

        const r = m.role.toLowerCase();
        // Always include admins and instructors
        if (r === 'admin' || r === 'instructor' || r === 'teacher') return true;
        // Include other team-like roles
        return teamRoles.includes(r);
      })
      .map((m: any) => ({
        ...m,
        name: m.full_name || m.email, // Map full_name to name
      }));

    console.log("Team Members loaded:", filteredMembers.length, filteredMembers);
    return { members: filteredMembers };

    return { members: filteredMembers };
  },

  get: async (teamMemberId: string, serviceId?: string) => {
    let rulesQuery = supabase
      .from("availability_rules")
      .select("*")
      .eq("instructor_id", teamMemberId);

    if (serviceId) {
      rulesQuery = rulesQuery.or(`session_template_id.eq.${serviceId},session_template_id.is.null`);
    }

    const { data: rules, error: rulesError } = await rulesQuery;
    if (rulesError) throw rulesError;

    // Transform rules array to WeeklySchedule object
    const schedule: any = {
      monday: { enabled: false, slots: [] },
      tuesday: { enabled: false, slots: [] },
      wednesday: { enabled: false, slots: [] },
      thursday: { enabled: false, slots: [] },
      friday: { enabled: false, slots: [] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    };

    const dayMap: Record<number, string> = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

    if (rules) {
      rules.forEach((rule: any) => {
        const dayName = dayMap[rule.weekday];
        if (dayName && schedule[dayName]) {
          schedule[dayName].enabled = true;
          schedule[dayName].slots.push({
            id: rule.id,
            startTime: rule.start_time.slice(0, 5), // HH:MM
            endTime: rule.end_time.slice(0, 5),
          });
        }
      });
    }

    let exQuery = supabase
      .from("availability_exceptions")
      .select("*")
      .eq("instructor_id", teamMemberId);

    if (serviceId) {
      exQuery = exQuery.or(`session_template_id.eq.${serviceId},session_template_id.is.null`);
    }

    const { data: exceptions, error: exError } = await exQuery;
    if (exError) throw exError;

    const { data: blocked, error: blockedError } = await supabase
      .from("availability_blocked_dates")
      .select("*")
      .eq("instructor_id", teamMemberId);

    if (blockedError) throw blockedError;

    return {
      schedule,
      specificDates: exceptions?.map((e: any) => ({
        ...e,
        startTime: e.start_time?.slice(0, 5),
        endTime: e.end_time?.slice(0, 5),
        sessionTemplateId: e.session_template_id,
        isAvailable: e.is_available,
        locationId: e.location_id,
      })) ?? [],
      blockedDates: blocked ?? [],
    };
  },

  getAvailability: async (year: number, month: number) => {
    const { data, error } = await supabase.functions.invoke(
      "get_month_calendar",
      {
        body: { year, month },
      }
    );
    if (error) throw error;
    return data;
  },

  updateSchedule: async (
    teamMemberId: string,
    scheduleObj: any,
    _accessToken?: string,
    serviceId?: string
  ) => {
    // Transform WeeklySchedule object to rules array
    const rows: any[] = [];
    const dayMapReverse: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    Object.keys(scheduleObj).forEach((dayName) => {
      const dayData = scheduleObj[dayName];
      if (dayData.enabled && dayData.slots.length > 0) {
        dayData.slots.forEach((slot: any) => {
          rows.push({
            instructor_id: teamMemberId,
            session_template_id: serviceId ?? null,
            weekday: dayMapReverse[dayName],
            start_time: slot.startTime,
            end_time: slot.endTime,
          });
        });
      }
    });

    // Delete existing rules for this instructor (and service if applicable)
    let del = supabase
      .from("availability_rules")
      .delete()
      .eq("instructor_id", teamMemberId);

    if (serviceId) {
      del = del.eq("session_template_id", serviceId);
    } else {
      del = del.is("session_template_id", null); // Only delete global rules if serviceId is not provided
    }

    const { error: delError } = await del;
    if (delError) throw delError;

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from("availability_rules")
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  },

  updateSpecificDates: async (
    teamMemberId: string,
    dates: any[],
    _accessToken?: string,
    serviceId?: string
  ) => {
    // Delete existing exceptions for this instructor (and service if applicable)
    let del = supabase
      .from("availability_exceptions")
      .delete()
      .eq("instructor_id", teamMemberId);

    if (serviceId && serviceId !== 'all') {
      del = del.or(`session_template_id.eq.${serviceId},session_template_id.is.null`);
    } else if (serviceId !== 'all' && serviceId !== undefined) {
      // Explicit check for non-all, non-undefined to target only global slots if strictly requested
      // But based on usage, serviceId='all' skips this and deletes everything
      del = del.is("session_template_id", null);
    }

    const { error: delError } = await del;
    if (delError) throw delError;

    if (dates.length === 0) return [];

    const rows: Database["public"]["Tables"]["availability_exceptions"]["Insert"][] = dates.map((d: any) => ({
      instructor_id: teamMemberId,
      session_template_id: (serviceId && serviceId !== 'all') ? serviceId : (d.sessionTemplateId ?? null),
      date: d.date,
      start_time: d.startTime ?? d.start_time ?? "00:00", // Ensure valid time
      end_time: d.endTime ?? d.end_time ?? "23:59", // Ensure valid time
      is_available: d.isAvailable ?? d.is_available ?? true,
      location_id: d.locationId ?? d.location_id ?? null,
    }));

    const { data, error } = await supabase
      .from("availability_exceptions")
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  },

  addException: async (exception: {
    instructor_id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    session_template_id?: string | null;
  }) => {
    // Ensure times are HH:MM
    const payload = {
      instructor_id: exception.instructor_id,
      date: exception.date,
      start_time: exception.start_time.slice(0, 5),
      end_time: exception.end_time.slice(0, 5),
      is_available: exception.is_available,
      session_template_id: exception.session_template_id || null
    };

    console.log("Adding availability exception:", payload);

    // CLEANUP: Remove any blocking exceptions (is_available: false) at this time
    // This prevents "Ghost Blocks" from hiding the new slot
    await supabase.from("availability_exceptions")
      .delete()
      .eq("instructor_id", exception.instructor_id)
      .eq("date", exception.date)
      .eq("start_time", exception.start_time.slice(0, 5))
      .eq("is_available", false);

    const { data, error } = await supabase
      .from("availability_exceptions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteException: async (id: string) => {
    console.log("Deleting exception with ID:", id);
    const { error } = await supabase
      .from("availability_exceptions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  },

  blockDates: async (teamMemberId: string, dates: any[]) => {
    if (dates.length === 0) return [];

    const rows = dates.map((d: any) => ({
      instructor_id: teamMemberId,
      date: d.date,
      reason: d.reason ?? null,
    }));

    const { data, error } = await supabase
      .from("availability_blocked_dates")
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  },

  unblockDate: async (_teamMemberId: string, dateId: string) => {
    const { error } = await supabase
      .from("availability_blocked_dates")
      .delete()
      .eq("id", dateId);
    if (error) throw error;
    return { success: true };
  },

  getAvailableSlots: async () => {
    return { slots: [] };
  },
};

// ===========================================================
// PROGRAMS
// ===========================================================

export const programsAPI = {
  getAll: async (filters?: { search?: string }) => {
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .in("name", ["Education", "Retreats"]);

    if (catError) throw catError;

    const categoryIds = (categories ?? []).map((c) => c.id);

    if (categoryIds.length === 0) return { programs: [] };

    let query = supabase
      .from("session_templates")
      .select(
        `
        *,
        location:location_id ( id, name )
      `
      )
      .in("category_id", categoryIds);

    if (filters?.search)
      query = query.ilike("name", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return { programs: data ?? [] };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("session_templates")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (program: any) => {
    // Strict payload for programs (session_templates)
    const payload = {
      name: program.name || "",
      description: program.description,
      duration_minutes: program.duration ?? program.duration_minutes,
      price: program.basePrice ?? program.price,
      currency: program.currency ?? "EUR",
      category_id: program.categoryId || program.category_id || null,
      location_id: program.locationId || program.location_id || null,
      instructor_id: program.instructorId || program.instructor_id || null,
      capacity: program.capacity ?? null,
      session_type: program.sessionType ?? program.session_type ?? "class_group",
      is_active: program.status ? program.status === "published" : true,
      start_date: program.startDate || null,
      end_date: program.endDate || null,
      fixed_prices: program.fixedPrices || program.fixed_prices || null,
    };

    console.log("Creating program with payload:", payload);

    const { data, error } = await supabase
      .from("session_templates")
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const mapped: any = {};
    if (updates.name) mapped.name = updates.name;
    if (updates.description) mapped.description = updates.description;
    if (updates.duration ?? updates.duration_minutes)
      mapped.duration_minutes = updates.duration ?? updates.duration_minutes;
    if (updates.basePrice ?? updates.price)
      mapped.price = updates.basePrice ?? updates.price;
    if (updates.currency) mapped.currency = updates.currency;
    if (updates.categoryId ?? updates.category_id)
      mapped.category_id = updates.categoryId ?? updates.category_id;
    if (updates.locationId ?? updates.location_id)
      mapped.location_id = updates.locationId ?? updates.location_id;
    if (updates.instructorId ?? updates.instructor_id)
      mapped.instructor_id = updates.instructorId ?? updates.instructor_id;
    if (updates.capacity !== undefined) mapped.capacity = updates.capacity;
    if (updates.sessionType ?? updates.session_type)
      mapped.session_type = updates.sessionType ?? updates.session_type;
    if (updates.status) mapped.is_active = updates.status === "published";
    if (updates.startDate) mapped.start_date = updates.startDate;
    if (updates.endDate) mapped.end_date = updates.endDate;
    if (updates.fixedPrices || updates.fixed_prices)
      mapped.fixed_prices = updates.fixedPrices || updates.fixed_prices;

    const { data, error } = await supabase
      .from("session_templates")
      .update(mapped)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("session_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  },
};
// ===========================================================
// EDUCATION (E-LEARNING)
// ===========================================================

export const educationAPI = {
  getCourses: async () => {
    const { data, error } = await supabase
      .from("education_courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at");

    if (error) {
      console.warn("Education tables likely missing:", error);
      return [];
    }
    return data ?? [];
  },

  getCourseBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from("education_courses")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  },

  getModules: async (courseId: string) => {
    const { data, error } = await supabase
      .from("education_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");

    if (error) throw error;
    return data ?? [];
  },

  getLessons: async (moduleId: string) => {
    const { data, error } = await supabase
      .from("education_lessons")
      .select("*, progress:education_progress(is_completed)")
      .eq("module_id", moduleId)
      .order("order_index");

    if (error) throw error;

    // Flatten progress
    return (data ?? []).map((l: any) => ({
      ...l,
      isCompleted: l.progress?.[0]?.is_completed ?? false
    }));
  },

  getLesson: async (lessonId: string) => {
    const { data, error } = await supabase
      .from("education_lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (error) throw error;
    return data;
  },

  enroll: async (courseId: string, userId: string) => {
    const { data, error } = await supabase
      .from("education_enrollments")
      .insert({ course_id: courseId, user_id: userId, status: 'active' })
      .select()
      .single();

    if (error) {
      // Ignore duplicate key error (already enrolled)
      if (error.code === '23505') return { status: 'already_enrolled' };
      throw error;
    }
    return data;
  },

  getEnrollments: async (userId: string) => {
    const { data, error } = await supabase
      .from("education_enrollments")
      .select("*, course:education_courses(*)")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  },

  markLessonComplete: async (lessonId: string, userId: string, isCompleted: boolean) => {
    const { data, error } = await supabase
      .from("education_progress")
      .upsert({
        lesson_id: lessonId,
        user_id: userId,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin / CRUD Methods
  updateCourse: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("education_courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  createModule: async (module: any) => {
    const { data, error } = await supabase
      .from("education_modules")
      .insert(module)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateModule: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("education_modules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteModule: async (id: string) => {
    const { error } = await supabase
      .from("education_modules")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  createLesson: async (lesson: any) => {
    const { data, error } = await supabase
      .from("education_lessons")
      .insert(lesson)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateLesson: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("education_lessons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteLesson: async (id: string) => {
    const { error } = await supabase
      .from("education_lessons")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // Quizzes
  getQuizByLessonId: async (lessonId: string) => {
    const { data, error } = await supabase
      .from("education_quizzes")
      .select("*")
      .eq("lesson_id", lessonId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  createQuiz: async (quiz: any) => {
    const { data, error } = await supabase
      .from("education_quizzes")
      .insert(quiz)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateQuiz: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("education_quizzes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  submitQuiz: async (submission: any) => {
    const { data, error } = await supabase
      .from("education_quiz_submissions")
      .upsert(submission, { onConflict: 'user_id, quiz_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getSubmission: async (quizId: string, userId: string) => {
    const { data, error } = await supabase
      .from("education_quiz_submissions")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Storage
  uploadResource: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('education')
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('education')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
