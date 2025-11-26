import { projectId, publicAnonKey, edgeFunctionName } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/${edgeFunctionName}`;

interface RequestOptions {
  method?: string;
  body?: any;
  requiresAuth?: boolean;
  accessToken?: string;
}

async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const {
    method = 'GET',
    body,
    requiresAuth = false,
    accessToken,
  } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Use access token if provided, otherwise use public anon key
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (!requiresAuth) {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error (${endpoint}):`, data.error || 'Unknown error');
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Request Failed (${endpoint}):`, error);
    throw error;
  }
}

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  signup: async (email: string, password: string, name: string, role: string = 'client') => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: { email, password, name, role },
    });
  },
};

// ============================================
// TEAM MEMBERS API
// ============================================

export const teamMembersAPI = {
  getAll: async (filters?: { role?: string; status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/team-members${query}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/team-members/${id}`);
  },

  create: async (teamMember: any, accessToken: string) => {
    return apiRequest('/team-members', {
      method: 'POST',
      body: teamMember,
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return apiRequest(`/team-members/${id}`, {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
      accessToken,
    });
  },

  delete: async (id: string, accessToken: string) => {
    return apiRequest(`/team-members/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// SERVICES API
// ============================================

export const servicesAPI = {
  getAll: async (filters?: { category?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/services${query}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/services/${id}`);
  },

  create: async (service: any, accessToken: string) => {
    return apiRequest('/services', {
      method: 'POST',
      body: service,
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return apiRequest(`/services/${id}`, {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
      accessToken,
    });
  },

  delete: async (id: string, accessToken: string) => {
    return apiRequest(`/services/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// LOCATIONS API
// ============================================

export const locationsAPI = {
  getAll: async (filters?: { type?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/locations${query}`);
  },

  create: async (location: any, accessToken: string) => {
    return apiRequest('/locations', {
      method: 'POST',
      body: location,
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return apiRequest(`/locations/${id}`, {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// BOOKINGS API
// ============================================

export const bookingsAPI = {
  getAll: async (filters?: {
    status?: string;
    teamMemberId?: string;
    serviceId?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.teamMemberId) params.append('teamMemberId', filters.teamMemberId);
    if (filters?.serviceId) params.append('serviceId', filters.serviceId);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/bookings${query}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/bookings/${id}`);
  },

  create: async (booking: any, accessToken: string) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: booking,
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return apiRequest(`/bookings/${id}`, {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// DIGITAL CONTENT API
// ============================================

export const digitalContentAPI = {
  getAll: async (filters?: { type?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/digital-content${query}`);
  },

  create: async (content: any, accessToken: string) => {
    return apiRequest('/digital-content', {
      method: 'POST',
      body: content,
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return apiRequest(`/digital-content/${id}`, {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// STATS API
// ============================================

export const statsAPI = {
  getDashboard: async (accessToken: string) => {
    return apiRequest('/stats', {
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// SETTINGS API
// ============================================

export const settingsAPI = {
  get: async (accessToken: string) => {
    return apiRequest('/settings', {
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (settings: any, accessToken: string) => {
    return apiRequest('/settings', {
      method: 'PUT',
      body: settings,
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// ANALYTICS API
// ============================================

export const analyticsAPI = {
  getOverview: async (timeRange: string = '30d') => {
    return apiRequest(`/analytics/overview?timeRange=${timeRange}`);
  },

  getRevenueReport: async (startDate: string, endDate: string) => {
    return apiRequest(`/analytics/revenue?start=${startDate}&end=${endDate}`);
  },

  getTeamPerformance: async (timeRange: string = '30d') => {
    return apiRequest(`/analytics/team?timeRange=${timeRange}`);
  },

  getCategoryBreakdown: async (timeRange: string = '30d') => {
    return apiRequest(`/analytics/categories?timeRange=${timeRange}`);
  },

  exportReport: async (type: 'revenue' | 'bookings' | 'team', timeRange: string = '30d') => {
    return apiRequest(`/analytics/export?type=${type}&timeRange=${timeRange}`);
  },
};

// ============================================
// AVAILABILITY API
// ============================================

export const availabilityAPI = {
  getTeamMembers: async () => {
    return apiRequest('/availability/team-members');
  },

  get: async (teamMemberId: string) => {
    return apiRequest(`/availability/${teamMemberId}`);
  },

  getAvailability: async (year: number, month: number) => {
    return apiRequest(`/availability/calendar?year=${year}&month=${month}`);
  },

  updateSchedule: async (teamMemberId: string, schedule: any, accessToken: string) => {
    return apiRequest(`/availability/${teamMemberId}/schedule`, {
      method: 'PUT',
      body: { schedule },
      requiresAuth: true,
      accessToken,
    });
  },

  blockDates: async (teamMemberId: string, dates: any[], accessToken: string) => {
    return apiRequest(`/availability/${teamMemberId}/block`, {
      method: 'POST',
      body: { dates },
      requiresAuth: true,
      accessToken,
    });
  },

  unblockDate: async (teamMemberId: string, dateId: string, accessToken: string) => {
    return apiRequest(`/availability/${teamMemberId}/unblock/${dateId}`, {
      method: 'DELETE',
      requiresAuth: true,
      accessToken,
    });
  },

  getAvailableSlots: async (teamMemberId: string, date: string) => {
    return apiRequest(`/availability/${teamMemberId}/slots?date=${date}`);
  },
};

// ============================================
// PROGRAMS API
// ============================================

export const programsAPI = {
  getAll: async (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/programs${query}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/programs/${id}`);
  },

  create: async (program: any, accessToken: string) => {
    return apiRequest('/programs', {
      method: 'POST',
      body: program,
      requiresAuth: true,
      accessToken,
    });
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return apiRequest(`/programs/${id}`, {
      method: 'PUT',
      body: updates,
      requiresAuth: true,
      accessToken,
    });
  },

  delete: async (id: string, accessToken: string) => {
    return apiRequest(`/programs/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
      accessToken,
    });
  },
};

// ============================================
// PRODUCTS API (Alias for Digital Content)
// ============================================

export const productsAPI = {
  getAll: async (filters?: { type?: string; search?: string }) => {
    return digitalContentAPI.getAll(filters);
  },

  getById: async (id: string) => {
    // Assuming digitalContentAPI doesn't have getById yet, let's add it or use generic request
    return apiRequest(`/digital-content/${id}`);
  },

  create: async (product: any, accessToken: string) => {
    return digitalContentAPI.create(product, accessToken);
  },

  update: async (id: string, updates: any, accessToken: string) => {
    return digitalContentAPI.update(id, updates, accessToken);
  },

  delete: async (id: string, accessToken: string) => {
    // Assuming digitalContentAPI doesn't have delete yet
    return apiRequest(`/digital-content/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
      accessToken,
    });
  },
};