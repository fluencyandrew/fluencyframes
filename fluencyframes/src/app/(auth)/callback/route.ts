import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const redirectTo = url.searchParams.get("redirect") ?? "/";

  if (!code) {
    const loginUrl = new URL("/login", request.url);
    if (error) {
      loginUrl.searchParams.set("error", error);
    }
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: async () =>
        (await cookieStore.getAll()).map((cookie) => ({ name: cookie.name, value: cookie.value })),
      setAll: (cookieList) => {
        cookieList.forEach((cookie) => {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });

  const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", authError.message);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
