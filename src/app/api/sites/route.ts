import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { createSiteSchema } from "@/application/site/validation";
import { generateSiteToken, hashToken } from "@/application/site/token-service";

const repo = new DrizzleSiteRepository();

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sites = await repo.findByUserId(user.id);
  return NextResponse.json(sites);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { name, url } = parsed.data;

  const existing = await repo.findByUrl(url, user.id);
  if (existing) {
    return NextResponse.json({ error: "A site with this URL already exists" }, { status: 409 });
  }

  const token = await generateSiteToken();
  const tokenHash = await hashToken(token);
  const site = await repo.create({ userId: user.id, name, url }, tokenHash);

  return NextResponse.json({ site, token }, { status: 201 });
}
