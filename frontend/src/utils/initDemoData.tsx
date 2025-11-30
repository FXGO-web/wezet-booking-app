/**
 * Initialize demo data in Supabase
 * 
 * This script populates the database with demo team members, services, locations, and bookings.
 * Call this function once after authentication to set up the demo environment.
 */

import { supabase } from './supabase/client';

export async function initializeDemoData(accessToken: string) {
  console.log('🚀 Starting demo data initialization...');

  try {
    // Check if data already exists
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (checkError) throw checkError;

    if (checkData && checkData.length > 0) {
      console.log('✅ Demo data already exists, skipping initialization');
      return { success: true, message: 'Demo data already exists' };
    }

    // 1. Create Team Members (Profiles)
    console.log('📝 Creating team members...');
    const teamMembers = [
      {
        full_name: 'Marcus Rodriguez',
        email: 'marcus@wezet.com',
        role: 'instructor',
        bio: 'Certified breathwork facilitator with 10+ years of experience',
        phone: '+45 12 34 56 78',
        // specialties: ['Breathwork', 'Meditation', 'Somatic Healing'], // Needs separate table or JSON column
        // services: ['breathwork-group', 'breathwork-1on1'], // Needs relation
      },
      {
        full_name: 'Emma Wilson',
        email: 'emma@wezet.com',
        role: 'instructor',
        bio: 'Life coach and transformation specialist',
        phone: '+45 23 45 67 89',
      },
      {
        full_name: 'Sarah Chen',
        email: 'sarah@wezet.com',
        role: 'instructor',
        bio: 'Somatic bodywork practitioner and yoga instructor',
        phone: '+45 34 56 78 90',
      },
      {
        full_name: 'Lisa Thompson',
        email: 'lisa@wezet.com',
        role: 'admin',
        bio: 'Platform administrator and wellness coordinator',
        phone: '+45 45 67 89 01',
      },
    ];

    for (const member of teamMembers) {
      // In a real app, we'd create Auth users. Here we just insert profiles for demo purposes
      // if RLS allows it, or if we are using a service role (which we aren't here).
      // Assuming the user running this has admin rights or RLS is open for demo.
      const { error } = await supabase.from('profiles').insert(member);
      if (error) console.error('Error creating member:', member.email, error);
    }
    console.log('✅ Team members created');

    // 2. Create Services (Session Templates)
    console.log('📝 Creating services...');
    const services = [
      {
        name: 'Group Breathwork',
        category: 'Breathwork',
        duration_minutes: 90,
        price: 295,
        currency: 'EUR',
        description: 'Experience transformational breathwork in a group setting',
        image_url: 'wind',
        is_active: true,
      },
      {
        name: '1-on-1 Breathwork',
        category: 'Breathwork',
        duration_minutes: 90,
        price: 150,
        currency: 'EUR',
        description: 'Personal breathwork session tailored to your needs',
        image_url: 'user',
        is_active: true,
      },
      {
        name: 'Coaching + Breathwork',
        category: 'Coaching',
        duration_minutes: 90,
        price: 180,
        currency: 'EUR',
        description: 'Integrated coaching and breathwork for transformation',
        image_url: 'sparkles',
        is_active: true,
      },
      {
        name: 'Somatic Bodywork',
        category: 'Bodywork',
        duration_minutes: 60,
        price: 120,
        currency: 'EUR',
        description: 'Release trauma and tension through bodywork',
        image_url: 'activity',
        is_active: true,
      },
    ];

    for (const service of services) {
      const { error } = await supabase.from('session_templates').insert(service);
      if (error) console.error('Error creating service:', service.name, error);
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
      },
      {
        name: 'Studio B',
        type: 'in-person',
        address: 'Nørrebrogade 45, 2200 Copenhagen',
        capacity: 8,
      },
      {
        name: 'Zoom Room',
        type: 'online',
        address: 'https://zoom.us/j/wezet-sessions',
      },
    ];

    for (const location of locations) {
      const { error } = await supabase.from('locations').insert(location);
      if (error) console.error('Error creating location:', location.name, error);
    }
    console.log('✅ Locations created');

    console.log('🎉 Demo data initialization complete!');
    return { success: true, message: 'Demo data initialized successfully' };

  } catch (error: any) {
    console.error('❌ Error initializing demo data:', error);
    return { success: false, error: error.message };
  }
}