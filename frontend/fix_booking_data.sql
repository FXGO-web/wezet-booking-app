-- Fix missing serviceId for Hanna Lynggaard's slot on 2025-11-28 at 09:00

UPDATE team_members
SET specific_dates = jsonb_set(
  specific_dates,
  '{2025-11-28,slots}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN slot->>'time' = '09:00' THEN
          jsonb_set(
            jsonb_set(slot, '{serviceId}', '"8311b613-7e4d-4dfe-89e6-06b71ef89ca1"'),
            '{name}', '"Breath Work 75 min Holte"'
          )
        ELSE slot
      END
    )
    FROM jsonb_array_elements(specific_dates->'2025-11-28'->'slots') AS slot
  )
)
WHERE id = '99d0ae95-fbf8-4b77-a377-aaa6bcfa93f1';
