-- Create redemption_codes table
CREATE TABLE IF NOT EXISTS public.redemption_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    bundle_purchase_id UUID REFERENCES public.bundle_purchases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_uses INTEGER NOT NULL DEFAULT 1,
    remaining_uses INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own redemption codes" ON public.redemption_codes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemption codes" ON public.redemption_codes
    FOR SELECT
    USING (public.is_admin());

-- Function to generate random code
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character string (upper case)
        new_code := 'BUN-' || upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if it exists
        SELECT EXISTS (SELECT 1 FROM public.redemption_codes WHERE code = new_code) INTO exists;
        
        EXIT WHEN NOT exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create redemption code on successful purchase
CREATE OR REPLACE FUNCTION handle_new_bundle_purchase()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
BEGIN
    -- Only run when status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Calculate total uses based on bundle items
        -- For now, we sum quantity of all items. 
        -- In future, we might want to distinguish between item types.
        SELECT COALESCE(SUM(quantity), 0) INTO total_items
        FROM public.bundle_items
        WHERE bundle_id = NEW.bundle_id;

        -- Fallback if no items (shouldn't happen for valid bundles, but safety codes)
        IF total_items = 0 THEN
            total_items := 1;
        END IF;

        -- Create redemption code
        INSERT INTO public.redemption_codes (
            code,
            bundle_purchase_id,
            user_id,
            total_uses,
            remaining_uses,
            status
        ) VALUES (
            generate_unique_code(),
            NEW.id,
            NEW.user_id,
            total_items,
            total_items,
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_bundle_purchase_completed ON public.bundle_purchases;
CREATE TRIGGER on_bundle_purchase_completed
    AFTER UPDATE ON public.bundle_purchases
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_bundle_purchase();


-- RPC Function to redeem a code
CREATE OR REPLACE FUNCTION redeem_bundle_code(code_input TEXT)
RETURNS JSONB AS $$
DECLARE
    redemption_record RECORD;
BEGIN
    -- Find the code
    SELECT * INTO redemption_record
    FROM public.redemption_codes
    WHERE code = code_input
    AND status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or inactive code');
    END IF;

    -- Check ownership (optional, depending on if codes are shareable. Assuming strictly personal for now)
    IF redemption_record.user_id != auth.uid() AND NOT public.is_admin() THEN
         RETURN jsonb_build_object('success', false, 'message', 'This code does not belong to you');
    END IF;

    -- Check remaining uses
    IF redemption_record.remaining_uses <= 0 THEN
        UPDATE public.redemption_codes SET status = 'completed' WHERE id = redemption_record.id;
        RETURN jsonb_build_object('success', false, 'message', 'Code has no remaining uses');
    END IF;

    -- Decrement
    UPDATE public.redemption_codes 
    SET 
        remaining_uses = remaining_uses - 1,
        status = CASE WHEN (remaining_uses - 1) <= 0 THEN 'completed' ELSE 'active' END,
        updated_at = now()
    WHERE id = redemption_record.id;

    RETURN jsonb_build_object('success', true, 'message', 'Code redeemed successfully', 'remaining', redemption_record.remaining_uses - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
