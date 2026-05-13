import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGroceryList } from "@/lib/generate-grocery-list";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { plan_id?: string; household_id?: string };
    const { plan_id, household_id } = body;
    if (!plan_id || !household_id) {
      return NextResponse.json({ message: "plan_id and household_id required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the caller has access to this plan
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("id", plan_id)
      .eq("household_id", household_id)
      .eq("status", "confirmed")
      .single();

    if (!plan) {
      return NextResponse.json({ message: "Plan not found or not confirmed" }, { status: 404 });
    }

    await generateGroceryList(supabase, plan_id, household_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[generate-grocery-list]", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
