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

const TIME = /^\d{2}:\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Add one bookable slot (specific date + time window). */
export async function addAvailabilitySlot(formData: FormData): Promise<void> {
  const provider = await getProviderContext();
  if (!provider) return;

  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  if (!DATE.test(date) || !TIME.test(startTime) || !TIME.test(endTime) || endTime <= startTime) return;

  const db = await createSupabaseServerClient();
  await db.from("availability_slots").insert({
    provider_id: provider.id,
    slot_date: date,
    start_time: startTime,
    end_time: endTime,
  });

  revalidatePath("/dashboard/availability");
  revalidatePath(`/providers/${provider.slug}`);
}

/** Remove a slot the owner created (only if it isn't already booked). */
export async function deleteAvailabilitySlot(formData: FormData): Promise<void> {
  const provider = await getProviderContext();
  if (!provider) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const db = await createSupabaseServerClient();
  await db
    .from("availability_slots")
    .delete()
    .eq("id", id)
    .eq("provider_id", provider.id)
    .eq("is_booked", false);

  revalidatePath("/dashboard/availability");
  revalidatePath(`/providers/${provider.slug}`);
}
