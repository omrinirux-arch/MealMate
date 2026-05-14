"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tokens } from "@/lib/tokens";

export function GroceryNavBadge() {
  const [checked, setChecked] = useState(0);
  const [total, setTotal] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    async function fetchCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();
      if (!member) return;

      const { data: plan } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("household_id", member.household_id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!plan) return;

      const { data: list } = await supabase
        .from("grocery_lists")
        .select("id")
        .eq("meal_plan_id", plan.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!list) return;

      const { data: items } = await supabase
        .from("grocery_items")
        .select("is_checked")
        .eq("grocery_list_id", list.id);
      if (!items || items.length === 0) {
        setTotal(0);
        setChecked(0);
        return;
      }

      setTotal(items.length);
      setChecked(items.filter((i) => i.is_checked).length);
    }

    fetchCounts();
    window.addEventListener("groceryItemsChanged", fetchCounts);
    return () => window.removeEventListener("groceryItemsChanged", fetchCounts);
  }, [pathname]);

  if (total === 0) return null;

  return (
    <span style={{
      position: "absolute",
      top: 6,
      right: "50%",
      transform: "translateX(14px)",
      minWidth: 16,
      height: 16,
      borderRadius: tokens.radius.pill,
      background: checked === total ? tokens.colors.primary[500] : tokens.colors.secondary[500],
      color: "#fff",
      fontSize: "9px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 4px",
      lineHeight: 1,
      pointerEvents: "none",
    }}>
      {checked}/{total}
    </span>
  );
}
