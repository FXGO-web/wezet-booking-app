-- Seed Data for Breathwork Education
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    course_id uuid;
    mod1_id uuid;
    mod2_id uuid;
    mod3_id uuid;
    mod4_id uuid;
    mod5_id uuid;
    mod6_id uuid;
BEGIN

    -- 1. Create Main Course
    INSERT INTO public.education_courses (title, slug, description, is_published, price_eur, price_dkk)
    VALUES (
        'Wezet Breathwork Education', 
        'breathwork-facilitator-training',
        'A comprehensive 20-week journey to becoming a certified breathwork facilitator. Master the art, science, and trauma-informed practice of breathwork.',
        true,
        2200.00,
        16500.00
    ) RETURNING id INTO course_id;

    -- 2. Create Modules

    -- Module 1
    INSERT INTO public.education_modules (course_id, title, description, order_index, is_locked_by_default)
    VALUES (course_id, 'Module 1: Foundations, Framework & Awareness', 'Establishing the ground for safe practice and self-awareness.', 1, false)
    RETURNING id INTO mod1_id;

    -- Module 2
    INSERT INTO public.education_modules (course_id, title, description, order_index, is_locked_by_default)
    VALUES (course_id, 'Module 2: History, Foundations & Technique Library', 'Deep dive into the origins of breathwork and core techniques.', 2, true)
    RETURNING id INTO mod2_id;

    -- Module 3
    INSERT INTO public.education_modules (course_id, title, description, order_index, is_locked_by_default)
    VALUES (course_id, 'Module 3: Trauma-Informed Breathwork', 'Understanding trauma, safety, and ethical space holding.', 3, true)
    RETURNING id INTO mod3_id;

    -- Module 4
    INSERT INTO public.education_modules (course_id, title, description, order_index, is_locked_by_default)
    VALUES (course_id, 'Module 4: Science, Anatomy & Polyvagal Theory', 'The physiology of breath and the nervous system.', 4, true)
    RETURNING id INTO mod4_id;

    -- Module 5
    INSERT INTO public.education_modules (course_id, title, description, order_index, is_locked_by_default)
    VALUES (course_id, 'Module 5: Techniques, Music & Facilitation', 'Crafting journeys with sound, rhythm, and voice.', 5, true)
    RETURNING id INTO mod5_id;

    -- Module 6
    INSERT INTO public.education_modules (course_id, title, description, order_index, is_locked_by_default)
    VALUES (course_id, 'Module 6: Advanced Facilitation & Mastery', 'Refining your craft and preparing for certification.', 6, true)
    RETURNING id INTO mod6_id;


    -- 3. Create Sample Lessons (Just a few to start)

    -- M1 Lessons
    INSERT INTO public.education_lessons (module_id, title, description, video_url, video_provider, order_index, duration_minutes)
    VALUES 
    (mod1_id, '1.1 Welcome & Orientation', 'Start here. Understand the flow of the next 20 weeks.', 'https://vimeo.com/76979871', 'vimeo', 1, 15),
    (mod1_id, '1.2 What is Breathwork?', 'Defining the practice and its scope.', 'https://vimeo.com/76979871', 'vimeo', 2, 25),
    (mod1_id, '1.3 The Wezet Philosophy', 'Our approach to healing and empowerment.', 'https://vimeo.com/76979871', 'vimeo', 3, 20);

    -- M2 Lessons
    INSERT INTO public.education_lessons (module_id, title, description, video_url, video_provider, order_index, duration_minutes)
    VALUES 
    (mod2_id, '2.1 History of Breath', 'From ancient pranayama to modern rebirthing.', 'https://vimeo.com/76979871', 'vimeo', 1, 45),
    (mod2_id, '2.2 Conscious Connected Breathing', ' The core technique explained.', 'https://vimeo.com/76979871', 'vimeo', 2, 60);

    -- M3 Lessons
    INSERT INTO public.education_lessons (module_id, title, description, video_url, video_provider, order_index, duration_minutes)
    VALUES 
    (mod3_id, '3.1 Defining Trauma', 'Big T and Little t trauma explained.', 'https://vimeo.com/76979871', 'vimeo', 1, 40);

END $$;
