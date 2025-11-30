// frontend/src/utils/api.ts
// API central para la UI de WEZET -> Supabase

import { supabase } from "./supabase/client";

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
    const { data, error } = await supabase
      .from("profiles")
      .insert(member)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
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
    const mapped: any = {};
    if (updates.name) mapped.name = updates.name;
    if (updates.description) mapped.description = updates.description;
    if (updates.duration ?? updates.duration_minutes)
      mapped.duration_minutes =
        updates.duration ?? updates.duration_minutes;
    if (updates.basePrice ?? updates.price)
      mapped.price = updates.basePrice ?? updates.price;
    if (updates.currency) mapped.currency = updates.currency;
    if (updates.categoryId ?? updates.category_id)
      mapped.category_id = updates.categoryId ?? updates.category_id;
    if (updates.locationId ?? updates.location_id)
      mapped.location_id = updates.locationId ?? updates.location_id;
    if (updates.instructorId ?? updates.instructor_id)
      mapped.instructor_id =
        updates.instructorId ?? updates.instructor_id;
    if (updates.capacity !== undefined) mapped.capacity = updates.capacity;
    if (updates.sessionType ?? updates.session_type)
      mapped.session_type =
        updates.sessionType ?? updates.session_type;
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
    const payload = {
      name: location.name,
      address: location.address ?? null,
      city: location.city ?? null,
      country: location.country ?? null,
      timezone: location.timezone ?? "Europe/Madrid",
    };

    const { data, error } = await supabase
      .from("locations")
      .insert(payload)
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
          instructor:instructor_id ( id, full_name ),
          template:session_template_id ( id, name, price, currency, duration_minutes ),
          location:location_id ( id, name )
        )
      `
      );

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.teamMemberId)
      query = query.eq("session.instructor_id", filters.teamMemberId);
    if (filters?.serviceId)
      query = query.eq("session.session_template_id", filters.serviceId);

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
          teamMemberName:
            b.session?.instructor?.full_name ?? "Unknown instructor",
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
    const payload = {
      customer_id: booking.customerId,
      session_id: booking.sessionId,
      status: booking.status ?? "pending",
      price: booking.price ?? null,
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
// SETTINGS — FIX CORS + invoke() forever
// ===========================================================

const SETTINGS_URL =
  "https://aadzzhdouuxkvelxyoyf.supabase.co/functions/v1/settings";

export const settingsAPI = {
  get: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No valid session found. User must be logged in.");
    }

    const res = await fetch(SETTINGS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Settings GET failed: ${res.status} - ${text}`);
    }

    return res.json();
  },

  update: async (settings: any) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No valid session found. User must be logged in.");
    }

    const res = await fetch(SETTINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Settings update failed: ${res.status} - ${text}`);
    }

    return res.json();
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
    const { teamMembers } = await teamMembersAPI.getAll({
      role: "instructor",
    });
    return { members: teamMembers };
  },

  get: async (teamMemberId: string, serviceId?: string) => {
    let rulesQuery = supabase
      .from("availability_rules")
      .select("*")
      .eq("instructor_id", teamMemberId);

    if (serviceId) rulesQuery = rulesQuery.eq("session_template_id", serviceId);

    const { data: rules, error: rulesError } = await rulesQuery;
    if (rulesError) throw rulesError;

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
      schedule: rules ?? [],
      specificDates: exceptions ?? [],
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
    schedule: any[],
    _accessToken?: string,
    serviceId?: string
  ) => {
    let del = supabase
      .from("availability_rules")
      .delete()
      .eq("instructor_id", teamMemberId);
    if (serviceId) del = del.eq("session_template_id", serviceId);
    const { error: delError } = await del;
    if (delError) throw delError;

    if (schedule.length === 0) return [];

    const rows = schedule.map((s: any) => ({
      instructor_id: teamMemberId,
      session_template_id: serviceId ?? s.sessionTemplateId ?? null,
      weekday: s.dayOfWeek ?? s.weekday,
      start_time: s.startTime ?? s.start_time,
      end_time: s.endTime ?? s.end_time,
      location_id: s.locationId ?? s.location_id ?? null,
    }));

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
    if (dates.length === 0) return [];

    const rows = dates.map((d: any) => ({
      instructor_id: teamMemberId,
      session_template_id: serviceId ?? d.sessionTemplateId ?? null,
      date: d.date,
      start_time: d.startTime ?? d.start_time ?? null,
      end_time: d.endTime ?? d.end_time ?? null,
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
    const { data, error } = await supabase
      .from("session_templates")
      .insert(program)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("session_templates")
      .update(updates)
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