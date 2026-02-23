import { useEffect, useRef } from "react";
import { supabase } from "../app/supabase";

/**
 * useAutoCancel
 *
 * Hook gọi Supabase RPC `auto_cancel_expired_bookings()` để tự động hủy
 * các đơn đặt xe chưa được duyệt sau khi thời gian đi đã qua 1 ngày (24h).
 *
 * - Chạy 1 lần khi component mount
 * - Chạy lại mỗi 30 phút trong khi app đang mở (interval)
 */
export function useAutoCancel() {
  const lastRunRef = useRef<Date | null>(null);

  const runAutoCancelCheck = async () => {
    try {
      const { data, error } = await supabase.rpc(
        "auto_cancel_expired_bookings",
      );

      if (error) {
        console.warn("[AutoCancel] RPC error:", error.message);
        return;
      }

      const result = data?.[0];
      if (result && result.cancelled_count > 0) {
        console.info(
          `[AutoCancel] Đã tự động hủy ${result.cancelled_count} đơn đặt xe quá hạn.`,
        );
      }

      lastRunRef.current = new Date();
    } catch (err) {
      console.warn("[AutoCancel] Unexpected error:", err);
    }
  };

  useEffect(() => {
    // Run immediately on mount
    runAutoCancelCheck();

    // Then run every 30 minutes
    const interval = setInterval(
      () => {
        runAutoCancelCheck();
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return { runCheck: runAutoCancelCheck };
}
