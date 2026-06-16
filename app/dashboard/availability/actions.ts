"use server";

import { revalidatePath } from "next/cache";
import { getProviderContext } from "@/lib/auth";
import { availabilitySchema } from "@/lib/validations/availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/** Replace the provider's weekly availability rules and blackout dates. */
export async function saveAvailability(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const provider = await getProviderContext();
  if (!provider) return { error: "Sign in as a provider to edit availability." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Could not read the form." };
  }

  const parsed = availabilitySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { rules, blocks } = parsed.data;

  const db = await createSupabaseServerClient();

  {
    const { error } = await db.from("availability_rules").delete().eq("provider_id", provider.id);
    if (error) return { error: error.message };
  }
  if (rules.length) {
    const { error } = await db.from("availability_rules").insert(
      rules.map((r) => ({
        provider_id: provider.id,
        weekday: r.weekday,
        start_time: r.startTime,
        end_time: r.endTime,
      })),
    );
    if (error) return { error: error.message };
  }

  {
    const { error } = await db.from("availability_blocks").delete().eq("provider_id", provider.id);
    if (error) return { error: error.message };
  }
  if (blocks.length) {
    const { error } = await db.from("availability_blocks").insert(
      blocks.map((b) => ({ provider_id: provider.id, date: b.date, is_available: b.isAvailable })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/availability");
  revalidatePath(`/providers/${provider.slug}`);
  return { ok: true };
}
