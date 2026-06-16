import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  // 303 so the browser issues a GET to the homepage after the POST.
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
