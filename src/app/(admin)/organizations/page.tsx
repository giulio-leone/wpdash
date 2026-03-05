import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getUserOrgs, createOrg } from "@/application/organization/organization-actions";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Organizations | WP Dash",
  description: "Manage your organizations",
};

export default async function OrganizationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const orgs = await getUserOrgs();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
      </div>

      {/* Create org form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Create New Organization
        </h2>
        <form
          action={async (fd) => {
            "use server";
            await createOrg(fd);
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            name="name"
            required
            placeholder="Organization name"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none"
          >
            Create
          </button>
        </form>
      </div>

      {/* Orgs list */}
      {orgs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You don&apos;t belong to any organizations yet.
        </p>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-lg dark:bg-brand-900">
                  {org.avatarUrl ?? org.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    /{org.slug} · {org.plan}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {org.role}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
