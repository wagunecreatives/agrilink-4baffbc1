import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/types/database";

type RealtimeEventCallback = () => void;

/**
 * Subscribes to realtime order changes for a specific farmer (by farmer_id).
 * Calls `onChange()` whenever INSERT/UPDATE/DELETE happens.
 *
 * Note: we intentionally keep callback generic and let the caller refetch
 * with joins to keep listing data accurate.
 */
export function useFarmerOrdersRealtime(params: {
  enabled: boolean;
  farmerId: string | null | undefined;
  onChange: RealtimeEventCallback;
  namespace?: string;
}) {
  const { enabled, farmerId, onChange, namespace = "farmer_orders" } = params;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled || !farmerId) return;

    const channel = supabase
      .channel(`${namespace}_${farmerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `farmer_id=eq.${farmerId}`,
        },
        () => {
          onChangeRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `farmer_id=eq.${farmerId}`,
        },
        () => {
          onChangeRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, farmerId, namespace]);
}

