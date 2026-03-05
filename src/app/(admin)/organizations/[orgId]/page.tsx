import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import {
  organizations,
  orgMembers,
} from "@/infrastructure/database/schemas";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq, and, sql } from "drizzle-orm";
import { inviteMember, removeMember } from "@/application/organization/organization-actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Organization | WP Dash",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const orgRows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  const org = orgRows[0];
  if (!org) notFound();

  // Verify current user is a member
  const memberRows = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, user.id)));
  const currentMember = memberRows[0];
  if (!currentMember) notFound();

  const canManage = currentMember.role === "owner" || currentMember.role === "admin";

  const members = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId));

  const [siteCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites)
    .where(eq(sites.orgId, orgId));
  const siteCount = siteCountRow?.count ?? 0;

  async function handleInvite(formData: FormData) {
    "use server";
    const email = formData.get("email")?.toString().trim() ?? "";
    await inviteMember(orgId, email);
  }

  async function handleRemove(formData: FormData) {
    "use server";
    const memberId = formData.get("memberId")?.toString() ?? "";
    await removeMember(orgId, memberId);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/organizations"
          className="text-sm text-brand-500 hover:underline"
        >
          ← Organizations
        </Link>
      </div>

      {/* Org header */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl dark:bg-brand-900">
            {org.avatarUrl ?? org.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              /{org.slug}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Plan: <strong className="capitalize text-gray-900 dark:text-white">{org.plan}</strong>
          </span>
          <span>
            Sites:{" "}
            <strong className="text-gray-900 dark:text-white">
              {siteCount} / {org.sitesLimit === -1 ? "∞" : org.sitesLimit}
            </strong>
          </span>
          <span>
            Members: <strong className="text-gray-900 dark:text-white">{members.length}</strong>
          </span>
        </div>
      </div>

      {/* Members table */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-white">Members</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {m.inviteAccepted ? m.userId : (m.inviteEmail ?? "Pending invite")}
                </p>
                {!m.inviteAccepted && m.inviteEmail && (
                  <p className="text-xs text-gray-400">Invite pending · {m.inviteEmail}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${ROLE_COLORS[m.role] ?? ROLE_COLORS.member}`}
                >
                  {m.role}
                </span>
                {canManage && m.userId !== user.id && (
                  <form action={handleRemove}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}
      {canManage && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-800 dark:text-white">Invite Member</h2>
          <form action={handleInvite} className="flex gap-3">
            <input
              type="email"
              name="email"
              required
              placeholder="colleague@example.com"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none"
            >
              Invite
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
