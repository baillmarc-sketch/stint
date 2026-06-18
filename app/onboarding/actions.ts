"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "provider"
  );
}

/**
 * "I'm a provider" — in DB mode this creates (once) a `providers` row owned by the
 * signed-in user and marks their profile as a provider, then sends them to the
 * dashboard. In the demo it just routes to the dashboard.
 */
export async function becomeProvider(): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!existing) {
    const meta = user.user_metadata ?? {};
    const displayName: string = meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "New provider";
    const { error } = await supabase.from("providers").insert({
      owner_id: user.id,
      business_name: displayName,
      slug: `${slugify(displayName)}-${nanoid(6).toLowerCase()}`,
    });
    if (error) throw new Error(`Could not create your storefront: ${error.message}`);
  }

  await supabase.from("profiles").update({ role: "provider", onboarded: true }).eq("id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
