import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendBookingEmail, getNotifications, markNotificationAsRead } from "./email-service.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify user authentication
async function verifyAuth(c: any, next: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('user', user);
  c.set('userId', user.id);
  c.set('userEmail', user.email);
  await next();
}

// Health check endpoint
app.get("/make-server-e0d9c111/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// AUTH ROUTES
// ============================================

// Sign up new user
app.post("/make-server-e0d9c111/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = 'client' } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm email since email server hasn't been configured
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user }, 201);
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// ============================================
// TEAM MEMBER ROUTES
// ============================================

// Get all team members (with optional filters)
app.get("/make-server-e0d9c111/team-members", async (c) => {
  try {
    const role = c.req.query('role');
    const status = c.req.query('status');
    const search = c.req.query('search');

    let teamMembers = await kv.getByPrefix("team-member:");

    // Apply filters
    if (status) {
      teamMembers = teamMembers.filter((m: any) => m && m.status === status);
    }
    if (role) {
      teamMembers = teamMembers.filter((m: any) => m && m.role === role);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      teamMembers = teamMembers.filter((m: any) => 
        m && (
          m.name?.toLowerCase().includes(searchLower) ||
          m.email?.toLowerCase().includes(searchLower) ||
          m.specialties?.some((s: string) => s.toLowerCase().includes(searchLower))
        )
      );
    }

    return c.json({ teamMembers });
  } catch (error) {
    console.log('Error fetching team members:', error);
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

// Get all team members (legacy endpoint for backwards compatibility)
app.get("/make-server-e0d9c111/team", verifyAuth, async (c) => {
  try {
    const members = await kv.getByPrefix("team-member:");
    return c.json({ members });
  } catch (error) {
    console.log('Error fetching team members:', error);
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

// Get single team member
app.get("/make-server-e0d9c111/team-members/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const teamMember = await kv.get(`team-member:${id}`);

    if (!teamMember) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    return c.json({ teamMember });
  } catch (error) {
    console.log('Error fetching team member:', error);
    return c.json({ error: 'Failed to fetch team member' }, 500);
  }
});

// Create team member
app.post("/make-server-e0d9c111/team-members", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const teamMember = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`team-member:${id}`, teamMember);
    return c.json({ teamMember }, 201);
  } catch (error) {
    console.log('Error creating team member:', error);
    return c.json({ error: 'Failed to create team member' }, 500);
  }
});

// Update team member
app.put("/make-server-e0d9c111/team-members/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`team-member:${id}`);
    if (!existing) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    const teamMember = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`team-member:${id}`, teamMember);
    return c.json({ teamMember });
  } catch (error) {
    console.log('Error updating team member:', error);
    return c.json({ error: 'Failed to update team member' }, 500);
  }
});

// Delete team member
app.delete("/make-server-e0d9c111/team-members/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`team-member:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting team member:', error);
    return c.json({ error: 'Failed to delete team member' }, 500);
  }
});

// ============================================
// SERVICE ROUTES
// ============================================

// Get all services
app.get("/make-server-e0d9c111/services", async (c) => {
  try {
    const category = c.req.query('category');
    const search = c.req.query('search');

    let services = await kv.getByPrefix('service:');

    if (category) {
      services = services.filter((s: any) => s && s.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      services = services.filter((s: any) => 
        s && (
          s.name?.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower)
        )
      );
    }

    return c.json({ services });
  } catch (error) {
    console.log('Error fetching services:', error);
    return c.json({ error: 'Failed to fetch services' }, 500);
  }
});

// Get single service
app.get("/make-server-e0d9c111/services/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const service = await kv.get(`service:${id}`);

    if (!service) {
      return c.json({ error: 'Service not found' }, 404);
    }

    return c.json({ service });
  } catch (error) {
    console.log('Error fetching service:', error);
    return c.json({ error: 'Failed to fetch service' }, 500);
  }
});

// Create service
app.post("/make-server-e0d9c111/services", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const service = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`service:${id}`, service);
    return c.json({ service }, 201);
  } catch (error) {
    console.log('Error creating service:', error);
    return c.json({ error: 'Failed to create service' }, 500);
  }
});

// Update service
app.put("/make-server-e0d9c111/services/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`service:${id}`);
    if (!existing) {
      return c.json({ error: 'Service not found' }, 404);
    }

    const service = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`service:${id}`, service);
    return c.json({ service });
  } catch (error) {
    console.log('Error updating service:', error);
    return c.json({ error: 'Failed to update service' }, 500);
  }
});

// Delete service
app.delete("/make-server-e0d9c111/services/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`service:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting service:', error);
    return c.json({ error: 'Failed to delete service' }, 500);
  }
});

// ============================================
// LOCATION ROUTES
// ============================================

// Get all locations
app.get("/make-server-e0d9c111/locations", async (c) => {
  try {
    const type = c.req.query('type');
    const search = c.req.query('search');

    let locations = await kv.getByPrefix('location:');

    if (type) {
      locations = locations.filter((l: any) => l && l.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      locations = locations.filter((l: any) => 
        l && (
          l.name?.toLowerCase().includes(searchLower) ||
          l.address?.toLowerCase().includes(searchLower)
        )
      );
    }

    return c.json({ locations });
  } catch (error) {
    console.log('Error fetching locations:', error);
    return c.json({ error: 'Failed to fetch locations' }, 500);
  }
});

// Create location
app.post("/make-server-e0d9c111/locations", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const location = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`location:${id}`, location);
    return c.json({ location }, 201);
  } catch (error) {
    console.log('Error creating location:', error);
    return c.json({ error: 'Failed to create location' }, 500);
  }
});

// Update location
app.put("/make-server-e0d9c111/locations/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`location:${id}`);
    if (!existing) {
      return c.json({ error: 'Location not found' }, 404);
    }

    const location = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`location:${id}`, location);
    return c.json({ location });
  } catch (error) {
    console.log('Error updating location:', error);
    return c.json({ error: 'Failed to update location' }, 500);
  }
});

// ============================================
// BOOKING ROUTES
// ============================================

// Get all bookings
app.get("/make-server-e0d9c111/bookings", async (c) => {
  try {
    const status = c.req.query('status');
    const teamMemberId = c.req.query('teamMemberId');
    const serviceId = c.req.query('serviceId');
    const search = c.req.query('search');

    let bookings = await kv.getByPrefix('booking:');

    if (status && status !== 'all') {
      bookings = bookings.filter((b: any) => b && b.status === status);
    }

    if (teamMemberId) {
      bookings = bookings.filter((b: any) => b && b.teamMemberId === teamMemberId);
    }

    if (serviceId) {
      bookings = bookings.filter((b: any) => b && b.serviceId === serviceId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter((b: any) => 
        b && (
          b.clientName?.toLowerCase().includes(searchLower) ||
          b.clientEmail?.toLowerCase().includes(searchLower)
        )
      );
    }

    return c.json({ bookings });
  } catch (error) {
    console.log('Error fetching bookings:', error);
    return c.json({ error: 'Failed to fetch bookings' }, 500);
  }
});

// Get single booking
app.get("/make-server-e0d9c111/bookings/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const booking = await kv.get(`booking:${id}`);

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    return c.json({ booking });
  } catch (error) {
    console.log('Error fetching booking:', error);
    return c.json({ error: 'Failed to fetch booking' }, 500);
  }
});

// Create booking
app.post("/make-server-e0d9c111/bookings", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const booking = {
      id,
      ...body,
      status: body.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`booking:${id}`, booking);
    
    // Send email notification
    try {
      await sendBookingEmail('BOOKING_CONFIRMATION', {
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        teamMemberName: booking.teamMemberName,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        location: booking.location || 'To be confirmed',
        price: booking.price,
        currency: booking.currency || 'USD',
        bookingId: id,
      });
    } catch (emailError) {
      console.log('Email notification failed (non-critical):', emailError);
    }
    
    return c.json({ booking }, 201);
  } catch (error) {
    console.log('Error creating booking:', error);
    return c.json({ error: 'Failed to create booking' }, 500);
  }
});

// Update booking
app.put("/make-server-e0d9c111/bookings/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`booking:${id}`);
    if (!existing) {
      return c.json({ error: 'Booking not found' }, 404);
    }

    const booking = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`booking:${id}`, booking);
    
    // Send email if status changed to cancelled
    if (existing.status !== 'canceled' && booking.status === 'canceled') {
      try {
        await sendBookingEmail('BOOKING_CANCELLED', {
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          teamMemberName: booking.teamMemberName,
          serviceName: booking.serviceName,
          date: booking.date,
          time: booking.time,
          location: booking.location || 'N/A',
          price: booking.price,
          currency: booking.currency || 'USD',
          bookingId: id,
        });
      } catch (emailError) {
        console.log('Email notification failed (non-critical):', emailError);
      }
    }
    
    return c.json({ booking });
  } catch (error) {
    console.log('Error updating booking:', error);
    return c.json({ error: 'Failed to update booking' }, 500);
  }
});

// ============================================
// DIGITAL CONTENT ROUTES
// ============================================

// Get all digital content
app.get("/make-server-e0d9c111/digital-content", async (c) => {
  try {
    const type = c.req.query('type');
    const search = c.req.query('search');

    let content = await kv.getByPrefix('content:');

    if (type) {
      content = content.filter((ct: any) => ct && ct.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      content = content.filter((ct: any) => 
        ct && (
          ct.title?.toLowerCase().includes(searchLower) ||
          ct.description?.toLowerCase().includes(searchLower)
        )
      );
    }

    return c.json({ content });
  } catch (error) {
    console.log('Error fetching digital content:', error);
    return c.json({ error: 'Failed to fetch digital content' }, 500);
  }
});

// Create digital content
app.post("/make-server-e0d9c111/digital-content", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const content = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`content:${id}`, content);
    return c.json({ content }, 201);
  } catch (error) {
    console.log('Error creating digital content:', error);
    return c.json({ error: 'Failed to create digital content' }, 500);
  }
});

// Update digital content
app.put("/make-server-e0d9c111/digital-content/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existing = await kv.get(`content:${id}`);
    if (!existing) {
      return c.json({ error: 'Content not found' }, 404);
    }

    const content = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`content:${id}`, content);
    return c.json({ content });
  } catch (error) {
    console.log('Error updating digital content:', error);
    return c.json({ error: 'Failed to update digital content' }, 500);
  }
});

// ============================================
// SETTINGS ROUTES
// ============================================

// Get settings
app.get("/make-server-e0d9c111/settings", verifyAuth, async (c) => {
  try {
    const settings = await kv.get('platform_settings') || {
      defaultCurrency: 'EUR',
      multiCurrency: true,
      taxRate: 8.5,
      platformName: 'WEZET',
    };

    return c.json({ settings });
  } catch (error) {
    console.log('Error fetching settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Update settings
app.put("/make-server-e0d9c111/settings", verifyAuth, async (c) => {
  try {
    const body = await c.req.json();
    
    // Get existing settings
    const existingSettings = await kv.get('platform_settings') || {
      defaultCurrency: 'EUR',
      multiCurrency: true,
      taxRate: 8.5,
      platformName: 'WEZET',
    };
    
    // Merge with new settings
    const settings = {
      ...existingSettings,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set('platform_settings', settings);
    return c.json({ settings });
  } catch (error) {
    console.log('Error updating settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// ============================================
// STATS/DASHBOARD ROUTES
// ============================================

// Get dashboard stats
app.get("/make-server-e0d9c111/stats", verifyAuth, async (c) => {
  try {
    const bookings = await kv.getByPrefix('booking:');
    const teamMembers = await kv.getByPrefix('team-member:');

    const confirmedBookings = bookings.filter((b: any) => b && b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    const stats = {
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      totalRevenue,
      activeTeamMembers: teamMembers.filter((tm: any) => tm && tm.status === 'active').length,
    };

    return c.json({ stats });
  } catch (error) {
    console.log('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// ============================================
// CALENDAR AVAILABILITY ROUTES
// ============================================

// Get calendar availability for a specific month
app.get("/make-server-e0d9c111/calendar/availability", async (c) => {
  try {
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const month = parseInt(c.req.query('month') || (new Date().getMonth() + 1).toString());
    const teamMemberId = c.req.query('teamMemberId');

    console.log('Fetching calendar availability for:', { year, month, teamMemberId });

    // Get all bookings
    const bookingsResults = await kv.getByPrefix('booking:');
    let bookings = bookingsResults.map(r => r.value);

    console.log('Total bookings found:', bookings.length);

    // Filter bookings for the specified month/year
    bookings = bookings.filter((booking: any) => {
      if (!booking.date) return false;
      try {
        const bookingDate = new Date(booking.date);
        return bookingDate.getFullYear() === year && 
               bookingDate.getMonth() + 1 === month;
      } catch (e) {
        console.log('Invalid booking date:', booking.date);
        return false;
      }
    });

    console.log('Filtered bookings for month:', bookings.length);

    // Filter by team member if specified
    if (teamMemberId) {
      bookings = bookings.filter((b: any) => b.teamMemberId === teamMemberId);
    }

    // Get team members
    const teamResults = await kv.getByPrefix('team_member:');
    const teamMembers = teamResults.map(r => r.value).filter((tm: any) => tm.status === 'active');

    console.log('Active team members:', teamMembers.length);

    // Generate available slots for each day of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const availability: any = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayBookings = bookings.filter((b: any) => {
        if (!b.date || typeof b.date !== 'string') return false;
        return b.date.startsWith(dateKey);
      });
      
      // Define standard time slots (9 AM to 6 PM)
      const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', 
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
      ];

      const availableSlots = timeSlots.map(time => {
        const slotDateTime = `${dateKey}T${time}:00`;
        const isBooked = dayBookings.some((b: any) => 
          b.date && typeof b.date === 'string' && b.date.includes(time)
        );

        return {
          time,
          available: !isBooked,
          dateTime: slotDateTime,
        };
      });

      availability[day] = {
        date: dateKey,
        hasAvailability: availableSlots.some(slot => slot.available),
        slots: availableSlots,
        bookingsCount: dayBookings.length,
      };
    }

    console.log('Calendar availability generated successfully');

    return c.json({ 
      availability,
      teamMembers: teamMembers.map((tm: any) => ({
        id: tm.id,
        name: tm.name,
        role: tm.role,
        specialties: tm.specialties || [],
        initials: tm.initials || tm.name.split(' ').map((n: string) => n[0]).join(''),
      })),
      month,
      year,
    });
  } catch (error) {
    console.log('Error fetching calendar availability:', error);
    console.log('Error details:', error.message, error.stack);
    return c.json({ error: 'Failed to fetch calendar availability', details: error.message }, 500);
  }
});

// Get notifications for current user
app.get("/make-server-e0d9c111/notifications", verifyAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');
    
    const notifications = await getNotifications(userEmail);
    return c.json({ notifications });
  } catch (error) {
    console.log('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Mark notification as read
app.put("/make-server-e0d9c111/notifications/:id", verifyAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const success = await markNotificationAsRead(id);
    
    if (!success) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

app.get("/make-server-e0d9c111/analytics/overview", async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '30d';
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch all bookings in the time range
    const allBookings = await kv.getByPrefix('booking:');
    const filteredBookings = allBookings.filter((booking: any) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startDate && bookingDate <= now;
    });

    // Calculate metrics
    const totalRevenue = filteredBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
    const totalBookings = filteredBookings.length;
    const uniqueClients = new Set(filteredBookings.map((b: any) => b.clientEmail)).size;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate changes (mock for now - would need historical data)
    const metrics = [
      {
        title: 'Total Revenue',
        value: `$${totalRevenue.toLocaleString()}`,
        change: 12.5,
        changeLabel: 'vs last period',
        icon: 'DollarSign',
        trend: 'up',
      },
      {
        title: 'Total Bookings',
        value: totalBookings.toString(),
        change: 8.2,
        changeLabel: 'vs last period',
        icon: 'Calendar',
        trend: 'up',
      },
      {
        title: 'Active Clients',
        value: uniqueClients.toString(),
        change: 5.1,
        changeLabel: 'vs last period',
        icon: 'Users',
        trend: 'up',
      },
      {
        title: 'Avg. Booking Value',
        value: `$${Math.round(avgBookingValue)}`,
        change: 4.3,
        changeLabel: 'vs last period',
        icon: 'Activity',
        trend: 'up',
      },
    ];

    // Generate revenue data by day
    const revenueByDay = new Map();
    filteredBookings.forEach((booking: any) => {
      const date = new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!revenueByDay.has(date)) {
        revenueByDay.set(date, { revenue: 0, bookings: 0 });
      }
      const current = revenueByDay.get(date);
      revenueByDay.set(date, {
        revenue: current.revenue + (booking.price || 0),
        bookings: current.bookings + 1,
      });
    });

    const revenueData = Array.from(revenueByDay.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      bookings: data.bookings,
    }));

    // Category breakdown
    const categoryCount = new Map();
    filteredBookings.forEach((booking: any) => {
      const category = booking.serviceCategory || 'Other';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    const totalCategoryBookings = filteredBookings.length;
    const categoryData = Array.from(categoryCount.entries()).map(([name, count]) => ({
      name,
      value: Math.round((count / totalCategoryBookings) * 100),
      color: '#EF7C48',
    }));

    // Team performance
    const teamStats = new Map();
    filteredBookings.forEach((booking: any) => {
      const teamMember = booking.teamMemberName || 'Unknown';
      if (!teamStats.has(teamMember)) {
        teamStats.set(teamMember, { bookings: 0, revenue: 0 });
      }
      const stats = teamStats.get(teamMember);
      teamStats.set(teamMember, {
        bookings: stats.bookings + 1,
        revenue: stats.revenue + (booking.price || 0),
      });
    });

    const teamPerformance = Array.from(teamStats.entries()).map(([name, stats]) => ({
      name,
      bookings: stats.bookings,
      revenue: stats.revenue,
      rating: 4.8, // Mock rating
    }));

    return c.json({
      success: true,
      data: {
        metrics,
        revenueData,
        categoryData,
        teamPerformance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics overview:', error);
    return c.json({ error: 'Failed to fetch analytics', details: error.message }, 500);
  }
});

app.get("/make-server-e0d9c111/analytics/revenue", async (c) => {
  try {
    const start = c.req.query('start');
    const end = c.req.query('end');

    if (!start || !end) {
      return c.json({ error: 'Start and end dates are required' }, 400);
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const allBookings = await kv.getByPrefix('booking:');
    const filteredBookings = allBookings.filter((booking: any) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startDate && bookingDate <= endDate;
    });

    const totalRevenue = filteredBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
    const totalBookings = filteredBookings.length;

    return c.json({
      success: true,
      data: {
        totalRevenue,
        totalBookings,
        period: { start, end },
      },
    });
  } catch (error: any) {
    console.error('Error fetching revenue report:', error);
    return c.json({ error: 'Failed to fetch revenue report', details: error.message }, 500);
  }
});

app.get("/make-server-e0d9c111/analytics/team", async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '30d';
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const allBookings = await kv.getByPrefix('booking:');
    const filteredBookings = allBookings.filter((booking: any) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startDate;
    });

    const teamStats = new Map();
    filteredBookings.forEach((booking: any) => {
      const teamMember = booking.teamMemberName || 'Unknown';
      if (!teamStats.has(teamMember)) {
        teamStats.set(teamMember, { bookings: 0, revenue: 0 });
      }
      const stats = teamStats.get(teamMember);
      teamStats.set(teamMember, {
        bookings: stats.bookings + 1,
        revenue: stats.revenue + (booking.price || 0),
      });
    });

    const teamPerformance = Array.from(teamStats.entries()).map(([name, stats]) => ({
      name,
      bookings: stats.bookings,
      revenue: stats.revenue,
    }));

    return c.json({
      success: true,
      data: teamPerformance,
    });
  } catch (error: any) {
    console.error('Error fetching team performance:', error);
    return c.json({ error: 'Failed to fetch team performance', details: error.message }, 500);
  }
});

// ============================================
// AVAILABILITY ENDPOINTS
// ============================================

app.get("/make-server-e0d9c111/availability/team-members", async (c) => {
  try {
    const allMembers = await kv.getByPrefix('team-member:');
    const activeMembers = allMembers.filter((m: any) => m.status === 'active');
    
    return c.json({
      success: true,
      members: activeMembers.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching team members for availability:', error);
    return c.json({ error: 'Failed to fetch team members', details: error.message }, 500);
  }
});

app.get("/make-server-e0d9c111/availability/calendar", async (c) => {
  try {
    const year = parseInt(c.req.query('year') || '');
    const month = parseInt(c.req.query('month') || '');

    if (!year || !month) {
      return c.json({ error: 'Year and month are required' }, 400);
    }

    console.log(`📅 Calendar request for ${year}-${month}`);

    // Get all team members and services
    const allMembers = await kv.getByPrefix('team-member:');
    const activeMembers = allMembers.filter((m: any) => m && m.status === 'active');
    const allServices = await kv.getByPrefix('service:');
    const activeServices = allServices.filter((s: any) => s && s.status === 'active');

    console.log(`Found ${activeMembers.length} active members, ${activeServices.length} active services`);

    // Get all bookings for the month
    const allBookings = await kv.getByPrefix('booking:');
    const monthBookings = allBookings.filter((b: any) => {
      if (!b || !b.date) return false;
      const bookingDate = new Date(b.date);
      return bookingDate.getMonth() + 1 === month && 
             bookingDate.getFullYear() === year;
    });

    console.log(`Found ${monthBookings.length} bookings for this month`);

    // Build availability map by day with services
    const availability: any = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    // Time slots configuration
    const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Skip past days (before day 5 for demo purposes)
      if (day < 5) {
        availability[day] = {
          hasAvailability: false,
          slots: [],
        };
        continue;
      }
      
      // Build slots with available services and team members
      const slots = timeSlots.map(time => {
        const dateTime = `${dateStr}T${time}:00`;
        
        // Check which team members are available at this time
        const bookedAtThisTime = monthBookings.filter((b: any) => {
          if (!b || !b.date || !b.time) return false;
          return b.date === dateStr && b.time === time;
        });
        
        const bookedMemberIds = bookedAtThisTime.map((b: any) => b.teamMemberId).filter(Boolean);
        const availableMembers = activeMembers.filter((m: any) => 
          m && m.id && !bookedMemberIds.includes(m.id)
        );
        
        // For each service, show which members can provide it
        const availableServicesForSlot: any[] = [];
        
        for (const service of activeServices) {
          if (!service || !service.id) continue;
          
          // For demo: show each service with up to 2 available members
          const membersForService = availableMembers
            .slice(0, 2)
            .map((m: any) => ({
              id: m.id,
              name: m.name || 'Unknown',
              avatarUrl: m.avatarUrl || null,
            }));
          
          if (membersForService.length > 0) {
            availableServicesForSlot.push({
              id: service.id,
              name: service.name || 'Unnamed Service',
              duration: service.duration || 60,
              basePrice: service.basePrice || 0,
              currency: service.currency || 'EUR',
              category: service.category || 'General',
              availableWith: membersForService,
            });
          }
        }

        return {
          time,
          dateTime,
          available: availableServicesForSlot.length > 0,
          services: availableServicesForSlot,
        };
      });
      
      const hasAvailability = slots.some(slot => slot.available);
      
      availability[day] = {
        hasAvailability,
        slots,
      };
    }

    const teamMembersResponse = activeMembers.map((m: any) => ({
      id: m.id,
      name: m.name || 'Unknown',
      role: m.role || 'Team Member',
      avatarUrl: m.avatarUrl || null,
      initials: m.name?.split(' ').map((n: string) => n[0]).join('') || 'TM',
      specialties: m.specialties || [],
    }));

    console.log(`✅ Returning calendar with ${daysInMonth} days`);

    return c.json({
      success: true,
      availability,
      teamMembers: teamMembersResponse,
    });
  } catch (error: any) {
    console.error('❌ Error fetching calendar availability:', error);
    return c.json({ error: 'Failed to fetch calendar availability', details: error.message }, 500);
  }
});

app.get("/make-server-e0d9c111/availability/:teamMemberId", async (c) => {
  try {
    const teamMemberId = c.req.param('teamMemberId');
    
    // Get weekly schedule
    const scheduleKey = `availability:schedule:${teamMemberId}`;
    const schedule = await kv.get(scheduleKey);
    
    // Get blocked dates
    const blockedDatesKey = `availability:blocked:${teamMemberId}`;
    const blockedDates = await kv.get(blockedDatesKey) || [];

    return c.json({
      success: true,
      schedule: schedule || null,
      blockedDates: blockedDates,
    });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return c.json({ error: 'Failed to fetch availability', details: error.message }, 500);
  }
});

app.put("/make-server-e0d9c111/availability/:teamMemberId/schedule", verifyAuth, async (c) => {
  try {
    const teamMemberId = c.req.param('teamMemberId');
    const { schedule } = await c.req.json();

    if (!schedule) {
      return c.json({ error: 'Schedule data is required' }, 400);
    }

    const scheduleKey = `availability:schedule:${teamMemberId}`;
    await kv.set(scheduleKey, schedule);

    console.log(`Availability schedule updated for team member ${teamMemberId}`);

    return c.json({
      success: true,
      message: 'Weekly schedule updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return c.json({ error: 'Failed to update schedule', details: error.message }, 500);
  }
});

app.post("/make-server-e0d9c111/availability/:teamMemberId/block", verifyAuth, async (c) => {
  try {
    const teamMemberId = c.req.param('teamMemberId');
    const { dates } = await c.req.json();

    if (!dates || !Array.isArray(dates)) {
      return c.json({ error: 'Dates array is required' }, 400);
    }

    const blockedDatesKey = `availability:blocked:${teamMemberId}`;
    const existingBlocked = await kv.get(blockedDatesKey) || [];
    
    // Add new blocked dates
    const updatedBlocked = [...existingBlocked, ...dates.map((d: any) => ({
      id: `${Date.now()}-${Math.random()}`,
      date: d.date,
      reason: d.reason,
      type: d.type,
    }))];

    await kv.set(blockedDatesKey, updatedBlocked);

    console.log(`Blocked ${dates.length} dates for team member ${teamMemberId}`);

    return c.json({
      success: true,
      message: `Blocked ${dates.length} date(s) successfully`,
    });
  } catch (error: any) {
    console.error('Error blocking dates:', error);
    return c.json({ error: 'Failed to block dates', details: error.message }, 500);
  }
});

app.delete("/make-server-e0d9c111/availability/:teamMemberId/unblock/:dateId", verifyAuth, async (c) => {
  try {
    const teamMemberId = c.req.param('teamMemberId');
    const dateId = c.req.param('dateId');

    const blockedDatesKey = `availability:blocked:${teamMemberId}`;
    const existingBlocked = await kv.get(blockedDatesKey) || [];
    
    // Remove the specified blocked date
    const updatedBlocked = existingBlocked.filter((d: any) => d.id !== dateId);

    await kv.set(blockedDatesKey, updatedBlocked);

    console.log(`Unblocked date ${dateId} for team member ${teamMemberId}`);

    return c.json({
      success: true,
      message: 'Date unblocked successfully',
    });
  } catch (error: any) {
    console.error('Error unblocking date:', error);
    return c.json({ error: 'Failed to unblock date', details: error.message }, 500);
  }
});

app.get("/make-server-e0d9c111/availability/:teamMemberId/slots", async (c) => {
  try {
    const teamMemberId = c.req.param('teamMemberId');
    const date = c.req.query('date');

    if (!date) {
      return c.json({ error: 'Date parameter is required' }, 400);
    }

    const requestDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestDate.getDay()];

    // Get weekly schedule
    const scheduleKey = `availability:schedule:${teamMemberId}`;
    const schedule = await kv.get(scheduleKey);

    if (!schedule || !schedule[dayOfWeek] || !schedule[dayOfWeek].enabled) {
      return c.json({
        success: true,
        slots: [],
        message: 'No availability for this day',
      });
    }

    // Get blocked dates
    const blockedDatesKey = `availability:blocked:${teamMemberId}`;
    const blockedDates = await kv.get(blockedDatesKey) || [];
    
    const isBlocked = blockedDates.some((b: any) => {
      const blockedDate = new Date(b.date);
      return blockedDate.toDateString() === requestDate.toDateString();
    });

    if (isBlocked) {
      return c.json({
        success: true,
        slots: [],
        message: 'This date is blocked',
      });
    }

    // Get existing bookings for this date
    const allBookings = await kv.getByPrefix('booking:');
    const dateBookings = allBookings.filter((b: any) => 
      b.teamMemberId === teamMemberId && 
      b.date === date &&
      b.status !== 'cancelled'
    );

    const bookedTimes = dateBookings.map((b: any) => b.time);

    // Generate available slots from schedule
    const daySchedule = schedule[dayOfWeek];
    const availableSlots = daySchedule.slots
      .flatMap((slot: any) => {
        const slots = [];
        let currentTime = slot.startTime;
        
        // Generate 30-minute slots
        while (currentTime < slot.endTime) {
          if (!bookedTimes.includes(currentTime)) {
            slots.push(currentTime);
          }
          // Add 30 minutes
          const [hours, minutes] = currentTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + 30;
          const newHours = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        }
        
        return slots;
      });

    return c.json({
      success: true,
      slots: availableSlots,
      date: date,
    });
  } catch (error: any) {
    console.error('Error fetching available slots:', error);
    return c.json({ error: 'Failed to fetch available slots', details: error.message }, 500);
  }
});

Deno.serve(app.fetch);