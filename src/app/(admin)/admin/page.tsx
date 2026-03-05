import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { adminUsers } from "@/infrastructure/database/schemas";
import { eq } from "drizzle-orm";
import {
  adminGetAllUsers,
  adminGetStats,
  adminChangePlan,
  adminToggleAdmin,
} from "@/application/admin/admin-actions";

export const metadata: Metadata = {
  title: "Admin | WP Dash",
  description: "Platform administration",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const adminRows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.userId, user.id));
  if (!adminRows[0]) redirect("/");

  const [usersResult, statsResult] = await Promise.all([
    adminGetAllUsers(),
    adminGetStats(),
  ]);

  const users = usersResult.success ? usersResult.data : [];
  const stats = statsResult.success ? statsResult.data : null;

  async function handleChangePlan(formData: FormData) {
    "use server";
    const userId = formData.get("userId")?.toString() ?? "";
    const plan = formData.get("plan")?.toString() ?? "free";
    const sitesLimit = parseInt(formData.get("sitesLimit")?.toString() ?? "3", 10);
    await adminChangePlan(userId, plan, sitesLimit);
  }

  async function handleToggleAdmin(formData: FormData) {
    "use server";
    const userId = formData.get("userId")?.toString() ?? "";
    const isAdmin = formData.get("isAdmin") === "true";
    await adminToggleAdmin(userId, isAdmin);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Platform Administration
      </h1>

      {/* Stats cards */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Users", value: stats.totalUsers },
            { label: "Total Sites", value: stats.totalSites },
            { label: "Total Orgs", value: stats.totalOrgs },
            {
              label: "Free / Pro",
              value: `${stats.planCounts["free"] ?? 0} / ${stats.planCounts["pro"] ?? 0}`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            Users ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Sites</th>
                <th className="px-6 py-3">Admin</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-3 text-gray-900 dark:text-white">{u.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                    {u.siteCount} / {u.sitesLimit === -1 ? "∞" : u.sitesLimit}
                  </td>
                  <td className="px-6 py-3">
                    {u.isAdmin ? (
                      <span className="text-xs font-medium text-brand-500">Admin</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {/* Change plan */}
                      <form action={handleChangePlan} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <select
                          name="plan"
                          defaultValue={u.plan}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="free">Free (3 sites)</option>
                          <option value="pro">Pro (unlimited)</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <input
                          type="hidden"
                          name="sitesLimit"
                          value={u.plan === "pro" ? -1 : 3}
                        />
                        <button
                          type="submit"
                          className="rounded bg-brand-500 px-2 py-1 text-xs text-white hover:bg-brand-600"
                        >
                          Save
                        </button>
                      </form>
                      {/* Toggle admin */}
                      <form action={handleToggleAdmin}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="hidden"
                          name="isAdmin"
                          value={(!u.isAdmin).toString()}
                        />
                        <button
                          type="submit"
                          className={`rounded px-2 py-1 text-xs ${
                            u.isAdmin
                              ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {u.isAdmin ? "Revoke Admin" : "Make Admin"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
