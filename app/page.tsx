export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdForUser, getHouseholdPreferences } from "@/lib/supabase/queries";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const membership = await getHouseholdForUser(supabase, user.id);
  if (!membership) {
    redirect("/household/create");
  }

  const { data: prefs } = await getHouseholdPreferences(supabase, membership.household_id);
  if (!prefs) {
    redirect("/onboarding/staples");
  }

  redirect("/home");
}
