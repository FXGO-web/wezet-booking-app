-- Add credits field to bundles table to define how many sessions/credits it contains
ALTER TABLE public.bundles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add remaining_credits field to bundle_purchases to track usage
ALTER TABLE public.bundle_purchases 
ADD COLUMN IF NOT EXISTS remaining_credits INTEGER DEFAULT 0;

-- Optional: Update existing bundles to have 0 credits if needed (default handles it)
