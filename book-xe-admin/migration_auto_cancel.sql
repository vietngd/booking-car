-- ============================================================
-- Migration: Auto-cancel expired/unapproved bookings
-- Logic: If travel_time + 1 day has passed and status is still
--        in a pending state (not approved/rejected/cancelled/completed),
--        automatically cancel the booking.
-- ============================================================

-- 1. Create the auto-cancel function
--    This can be called via RPC from the frontend or via pg_cron.
CREATE OR REPLACE FUNCTION public.auto_cancel_expired_bookings()
RETURNS TABLE(cancelled_count INTEGER, cancelled_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Find and cancel bookings where:
  --   - travel_time has passed by more than 1 day (24 hours)
  --   - Status is still "pending" in some form (not yet resolved)
  UPDATE public.bookings
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE
    status IN ('pending', 'pending_viet', 'pending_korea', 'pending_admin')
    AND travel_time < NOW() - INTERVAL '1 day'
  RETURNING id INTO v_cancelled_ids;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count, v_cancelled_ids;
END;
$$;

-- Grant execution permission to authenticated users
-- (function uses SECURITY DEFINER so it bypasses RLS)
GRANT EXECUTE ON FUNCTION public.auto_cancel_expired_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_cancel_expired_bookings() TO anon;


-- 2. (Optional) Enable pg_cron to run this automatically every hour.
--    NOTE: pg_cron must be enabled in Supabase. 
--    Go to: Database → Extensions → pg_cron → Enable
--    Then run the following:

-- Enable pg_cron extension (run this separately in Supabase SQL editor if needed):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every hour:
-- SELECT cron.schedule(
--   'auto-cancel-expired-bookings',  -- job name
--   '0 * * * *',                     -- every hour at minute 0
--   $$SELECT public.auto_cancel_expired_bookings()$$
-- );

-- To view scheduled jobs: SELECT * FROM cron.job;
-- To remove the job: SELECT cron.unschedule('auto-cancel-expired-bookings');


-- 3. Also update the RLS policy so users can see their own cancelled bookings
--    (this should already work with existing policies)

-- 4. Create an index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_bookings_travel_time_status
ON public.bookings(travel_time, status)
WHERE status IN ('pending', 'pending_viet', 'pending_korea', 'pending_admin');

-- 5. Verify: Check which bookings would be cancelled right now (dry-run):
-- SELECT id, requester_name, destination, travel_time, status
-- FROM public.bookings
-- WHERE status IN ('pending', 'pending_viet', 'pending_korea', 'pending_admin')
--   AND travel_time < NOW() - INTERVAL '1 day'
-- ORDER BY travel_time ASC;
