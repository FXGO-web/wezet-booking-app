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

console.log("WEZET API VERSION: EDGE_FUNCTION_UPDATE_V1");

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
  getAll: async (filters?: { role?: string; search?: string }) => {
    let query = supabase.from("profiles").select("*");

    if (filters?.role) query = query.eq("role", filters.role);
    if (filters?.search) query = query.ilike("full_name", `%${filters.search}%`);

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
        password: "TempPassword123!", // You might want to generate this or let the user set it
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
      console.error("Error creating team member:", error);
      throw error;
    }

    // The function returns { user: ... }, we want to return the profile-like object
    return data.user;
  },

  update: async (id: string, updates: any) => {
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
};

// ===========================================================
// CUSTOMERS API
// ===========================================================

export const customersAPI = {
  getAll: async (filters?: { search?: string }) => {
    let query = supabase.from("profiles").select("*").eq("role", "client");

    if (filters?.search) query = query.ilike("full_name", `%${filters.search}%`);

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
    };

    const { data, error } = await supabase
      .from("session_templates")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
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

    if (updates.capacity !== undefined) mapped.capacity = updates.capacity;
    if (updates.sessionType ?? updates.session_type)
      mapped.session_type =
        updates.sessionType ?? updates.session_type;
    if (updates.status) mapped.is_active = updates.status === "active";

    console.log("Mapped service update payload:", mapped);

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
    const { data, error } = await supabase
      .from("locations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
        customer:customer_id ( id, full_name, email ),
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
          serviceName: b.session?.template?.name ?? "Unknown service",
          category: b.session?.template?.category?.name ?? "General",
          teamMemberName:
            b.session?.instructor?.full_name ?? "Unknown instructor",
          mentorId: b.session?.instructor?.id,
          practitionerAvatar: b.session?.instructor?.avatar_url,
          date: start ? start.toISOString().slice(0, 10) : "",
          time: start
            ? start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : "",
          price:
            b.price ?? b.session?.template?.price ?? null,
          currency:
            b.currency ??
            b.session?.template?.currency ??
            "EUR",
          status: b.status,
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
    const payload: Database["public"]["Tables"]["bookings"]["Insert"] = {
      customer_id: booking.customerId,
      session_id: booking.sessionId, // Note: bookings table refers to sessions, not templates directly usually? Wait, schema has session_id.
      status: booking.status ?? "pending",
      total_price: booking.price ?? 0, // Schema has total_price, not price
      currency: booking.currency ?? "EUR",
      notes: booking.notes ?? null,
      instructor_id: booking.instructorId ?? null,
      session_template_id: booking.sessionTemplateId ?? null,
      start_time: booking.startTime, // Schema requires start_time
      end_time: booking.endTime, // Schema requires end_time
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
  getAll: async () => ({ content: [] }),
  create: async () => ({}),
  update: async () => ({}),
};

export const productsAPI = digitalContentAPI;

// ===========================================================
// STATS
// ===========================================================

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
    if (settings.testMode !== undefined) mapped.stripe_test_mode = settings.testMode;

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
    const filteredMembers = teamMembers
      .filter((m: any) => m.role && teamRoles.includes(m.role.toLowerCase()))
      .map((m: any) => ({
        ...m,
        name: m.full_name || m.email, // Map full_name to name
      }));

    return { members: filteredMembers };
  },

  get: async (teamMemberId: string, serviceId?: string) => {
    let rulesQuery = supabase
      .from("availability_rules")
      .select("*")
      .eq("instructor_id", teamMemberId);

    if (serviceId) rulesQuery = rulesQuery.eq("session_template_id", serviceId);

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

    if (serviceId) exQuery = exQuery.eq("session_template_id", serviceId);

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

    if (serviceId) {
      del = del.eq("session_template_id", serviceId);
    } else {
      del = del.is("session_template_id", null);
    }

    const { error: delError } = await del;
    if (delError) throw delError;

    if (dates.length === 0) return [];

    const rows: Database["public"]["Tables"]["availability_exceptions"]["Insert"][] = dates.map((d: any) => ({
      instructor_id: teamMemberId,
      session_template_id: serviceId ?? d.sessionTemplateId ?? null,
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

  blockDates: async (teamMemberId: string, dates: any[]) => {
    if (dates.length === 0) return [];

    const rows: Database["public"]["Tables"]["availability_blocked_dates"]["Insert"][] = dates.map((d: any) => ({
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
      name: program.name,
      description: program.description,
      duration_minutes: program.duration ?? program.duration_minutes,
      price: program.basePrice ?? program.price,
      currency: program.currency ?? "EUR",
      category_id: program.categoryId ?? program.category_id ?? null,
      location_id: program.locationId ?? program.location_id ?? null,
      instructor_id: program.instructorId ?? program.instructor_id ?? null,
      capacity: program.capacity ?? null,
      session_type: program.sessionType ?? program.session_type ?? "program",
      is_active: program.status ? program.status === "active" : true,
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
    if (updates.status) mapped.is_active = updates.status === "active";

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