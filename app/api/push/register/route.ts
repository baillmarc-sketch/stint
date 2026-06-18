import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Register an Expo push token for the signed-in user (native clients, Bearer auth). */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  if (typeof body.token !== "string" || !body.token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  // Bearer-aware server client → RLS enforces user_id = auth.uid().
  const db = await createSupabaseServerClient();
  const { error } = await db
    .from("push_tokens")
    .upsert({ user_id: user.id, token: body.token }, { onConflict: "user_id,token" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
