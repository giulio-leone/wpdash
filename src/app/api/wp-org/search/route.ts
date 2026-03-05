import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ plugins: [] });
  }

  try {
    const url = new URL("https://api.wordpress.org/plugins/info/1.2/");
    url.searchParams.set("action", "query_plugins");
    url.searchParams.set("search", q);
    url.searchParams.set("per_page", "8");
    url.searchParams.set("fields[short_description]", "1");
    url.searchParams.set("fields[icons]", "1");
    url.searchParams.set("fields[rating]", "1");
    url.searchParams.set("fields[num_ratings]", "1");
    url.searchParams.set("fields[downloaded]", "1");

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: { "User-Agent": "WP-Dash/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ plugins: [] });
    }

    const json = await res.json();
    const plugins = (json.plugins ?? []).map((p: Record<string, unknown>) => ({
      slug: p.slug,
      name: p.name,
      version: p.version,
      author: typeof p.author === "string" ? p.author.replace(/<[^>]*>/g, "") : "",
      rating: p.rating,
      shortDescription: p.short_description,
      icon: (p.icons as Record<string, string> | undefined)?.["1x"] ?? null,
    }));

    return NextResponse.json({ plugins });
  } catch {
    return NextResponse.json({ plugins: [] });
  }
}
