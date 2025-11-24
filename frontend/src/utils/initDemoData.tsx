/**
 * Initialize demo data in Supabase
 * 
 * This script populates the database with demo team members, services, locations, and bookings.
 * Call this function once after authentication to set up the demo environment.
 */

import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e0d9c111`;

export async function initializeDemoData(accessToken: string) {
  console.log('🚀 Starting demo data initialization...');

  try {
    // Check if data already exists
    const checkResponse = await fetch(`${API_BASE_URL}/team-members`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    const checkData = await checkResponse.json();
    
    if (checkData.teamMembers && checkData.teamMembers.length > 0) {
      console.log('✅ Demo data already exists, skipping initialization');
      return { success: true, message: 'Demo data already exists' };
    }

    // 1. Create Team Members
    console.log('📝 Creating team members...');
    const teamMembers = [
      {
        name: 'Marcus Rodriguez',
        email: 'marcus@wezet.com',
        role: 'Teacher',
        bio: 'Certified breathwork facilitator with 10+ years of experience',
        phone: '+45 12 34 56 78',
        specialties: ['Breathwork', 'Meditation', 'Somatic Healing'],
        services: ['breathwork-group', 'breathwork-1on1'],
        status: 'active',
        photoUrl: null,
      },
      {
        name: 'Emma Wilson',
        email: 'emma@wezet.com',
        role: 'Facilitator',
        bio: 'Life coach and transformation specialist',
        phone: '+45 23 45 67 89',
        specialties: ['Coaching', 'Breathwork', 'Energy Work'],
        services: ['coaching-breathwork', 'breathwork-1on1'],
        status: 'active',
        photoUrl: null,
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@wezet.com',
        role: 'Teacher',
        bio: 'Somatic bodywork practitioner and yoga instructor',
        phone: '+45 34 56 78 90',
        specialties: ['Bodywork', 'Yoga', 'Trauma Release'],
        services: ['breathwork-group'],
        status: 'active',
        photoUrl: null,
      },
      {
        name: 'Lisa Thompson',
        email: 'lisa@wezet.com',
        role: 'Admin',
        bio: 'Platform administrator and wellness coordinator',
        phone: '+45 45 67 89 01',
        specialties: ['Operations', 'Client Support'],
        services: [],
        status: 'active',
        photoUrl: null,
      },
    ];

    for (const member of teamMembers) {
      await fetch(`${API_BASE_URL}/team-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(member),
      });
    }
    console.log('✅ Team members created');

    // 2. Create Services
    console.log('📝 Creating services...');
    const services = [
      {
        name: 'Group Breathwork',
        category: 'Breathwork',
        duration: 90,
        basePrice: 295,
        currency: 'EUR',
        description: 'Experience transformational breathwork in a group setting',
        icon: 'wind',
        allowedLocations: ['studio-a', 'online'],
        status: 'active',
      },
      {
        name: '1-on-1 Breathwork',
        category: 'Breathwork',
        duration: 90,
        basePrice: 150,
        currency: 'EUR',
        description: 'Personal breathwork session tailored to your needs',
        icon: 'user',
        allowedLocations: ['studio-a', 'studio-b', 'online'],
        status: 'active',
      },
      {
        name: 'Coaching + Breathwork',
        category: 'Coaching',
        duration: 90,
        basePrice: 180,
        currency: 'EUR',
        description: 'Integrated coaching and breathwork for transformation',
        icon: 'sparkles',
        allowedLocations: ['online', 'studio-b'],
        status: 'active',
      },
      {
        name: 'Somatic Bodywork',
        category: 'Bodywork',
        duration: 60,
        basePrice: 120,
        currency: 'EUR',
        description: 'Release trauma and tension through bodywork',
        icon: 'activity',
        allowedLocations: ['studio-b'],
        status: 'active',
      },
    ];

    for (const service of services) {
      await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(service),
      });
    }
    console.log('✅ Services created');

    // 3. Create Locations
    console.log('📝 Creating locations...');
    const locations = [
      {
        name: 'Studio A',
        type: 'in-person',
        address: 'Vesterbrogade 123, 1620 Copenhagen',
        capacity: 15,
        openingHours: 'Mon-Fri: 9:00-21:00, Sat-Sun: 10:00-18:00',
        status: 'active',
      },
      {
        name: 'Studio B',
        type: 'in-person',
        address: 'Nørrebrogade 45, 2200 Copenhagen',
        capacity: 8,
        openingHours: 'Mon-Sun: 8:00-20:00',
        status: 'active',
      },
      {
        name: 'Zoom Room',
        type: 'online',
        address: 'https://zoom.us/j/wezet-sessions',
        capacity: null,
        openingHours: '24/7',
        status: 'active',
      },
    ];

    for (const location of locations) {
      await fetch(`${API_BASE_URL}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(location),
      });
    }
    console.log('✅ Locations created');

    // Skip creating bookings - start with clean calendar

    // 4. Create digital content
    console.log('📝 Creating digital content...');
    const digitalContent = [
      {
        title: 'Introduction to Breathwork',
        description: 'Learn the fundamentals of transformational breathwork',
        type: 'video',
        duration: '45 min',
        thumbnailUrl: null,
        fileUrl: null,
        teacher: 'Marcus Rodriguez',
        tags: ['Breathwork', 'Beginner', 'Education'],
        accessLevel: 'free',
        status: 'published',
      },
      {
        title: 'Morning Breathwork Practice',
        description: 'Start your day with this energizing breathwork session',
        type: 'audio',
        duration: '15 min',
        thumbnailUrl: null,
        fileUrl: null,
        teacher: 'Emma Wilson',
        tags: ['Breathwork', 'Morning', 'Energy'],
        accessLevel: 'free',
        status: 'published',
      },
      {
        title: 'Somatic Healing Guide',
        description: 'Comprehensive PDF guide to somatic practices',
        type: 'pdf',
        duration: null,
        thumbnailUrl: null,
        fileUrl: null,
        teacher: 'Sarah Chen',
        tags: ['Bodywork', 'Healing', 'Guide'],
        accessLevel: 'premium',
        status: 'published',
      },
    ];

    for (const content of digitalContent) {
      await fetch(`${API_BASE_URL}/digital-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(content),
      });
    }
    console.log('✅ Digital content created');

    console.log('🎉 Demo data initialization complete!');
    return { success: true, message: 'Demo data initialized successfully' };

  } catch (error) {
    console.error('❌ Error initializing demo data:', error);
    return { success: false, error: error.message };
  }
}