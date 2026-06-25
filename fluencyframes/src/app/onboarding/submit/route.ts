import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, gender, role, avatarUrl } = body;

  if (!name?.trim() || !gender || !role?.trim()) {
    return NextResponse.json({ error: "Missing required onboarding fields." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(cookies());
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: "Unable to authenticate user." }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: existingProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (existingProfile) {
    return NextResponse.json({ error: "Profile already exists." }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("user_profiles").insert({
    user_id: userId,
    name: name.trim(),
    gender,
    role: role.trim(),
    avatar_url: avatarUrl || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
