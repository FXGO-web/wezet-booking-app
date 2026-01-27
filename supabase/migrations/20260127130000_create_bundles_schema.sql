-- Create bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'EUR',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS public.bundle_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('session', 'course', 'product')),
    item_id UUID NOT NULL, -- Logical FK, resolved dynamically
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bundle_purchases table
CREATE TABLE IF NOT EXISTS public.bundle_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL,
    purchase_date TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
    stripe_payment_id TEXT,
    stripe_session_id TEXT,
    amount_paid NUMERIC,
    currency TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

-- Helper function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for bundles
CREATE POLICY "Public can view active bundles" ON public.bundles
    FOR SELECT
    USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage bundles" ON public.bundles
    FOR ALL
    USING (is_admin());

-- Policies for bundle_items
CREATE POLICY "Public can view bundle items" ON public.bundle_items
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.bundles
        WHERE bundles.id = bundle_items.bundle_id AND (bundles.is_active = true OR is_admin())
    ));

CREATE POLICY "Admins can manage bundle items" ON public.bundle_items
    FOR ALL
    USING (is_admin());

-- Policies for bundle_purchases
CREATE POLICY "Users can view own purchases" ON public.bundle_purchases
    FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create pending purchases" ON public.bundle_purchases
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role or Admin can update purchases" ON public.bundle_purchases
    FOR UPDATE
    USING (is_admin() OR auth.role() = 'service_role');
