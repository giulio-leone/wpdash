"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { fetchUsers, manageUser } from "@/application/user/wp-user-actions";
import type { BridgeUserInfo } from "@/infrastructure/wp-bridge/types";

interface Props {
  siteId: string;
}

const ROLE_COLORS: Record<string, "error" | "info" | "warning" | "dark" | "light"> = {
  administrator: "error",
  editor: "info",
  author: "warning",
  contributor: "dark",
  subscriber: "light",
};

const WP_ROLES = ["administrator", "editor", "author", "contributor", "subscriber"];

export default function UsersList({ siteId }: Props) {
  const [users, setUsers] = useState<BridgeUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addRole, setAddRole] = useState("subscriber");
  const [addLoading, setAddLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchUsers(siteId);
    if (result.success) {
      setUsers(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (user: BridgeUserInfo) => {
      if (!window.confirm(`Delete user "${user.display_name}" (${user.login})? This cannot be undone.`)) return;
      setActionLoading(user.id);
      await manageUser(siteId, "delete", { user_id: user.id });
      setActionLoading(null);
      await load();
    },
    [siteId, load],
  );

  const handleRoleChange = useCallback(
    async (userId: number, role: string) => {
      setActionLoading(userId);
      await manageUser(siteId, "change_role", { user_id: userId, role });
      setActionLoading(null);
      await load();
    },
    [siteId, load],
  );

  const submitAddUser = useCallback(async () => {
    setAddLoading(true);
    setError(null);
    const result = await manageUser(siteId, "create", {
      email: addEmail,
      username: addUsername,
      role: addRole,
    });
    setAddLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setShowAddForm(false);
      setAddEmail("");
      setAddUsername("");
      setAddRole("subscriber");
      await load();
    }
  }, [siteId, addEmail, addUsername, addRole, load]);

  const handleAddUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void submitAddUser();
    },
    [submitAddUser],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
        <Button
          size="sm"
          variant="primary"
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <form
          onSubmit={handleAddUser}
          className={cn(
            "rounded-xl border border-gray-200 bg-gray-50 p-4",
            "dark:border-gray-800 dark:bg-gray-800/30",
          )}
        >
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Add New User
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              type="email"
              placeholder="Email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className={cn(
                "rounded-lg border border-gray-300 px-3 py-2 text-sm",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
              )}
            />
            <input
              required
              type="text"
              placeholder="Username"
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              className={cn(
                "rounded-lg border border-gray-300 px-3 py-2 text-sm",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
              )}
            />
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
              className={cn(
                "rounded-lg border border-gray-300 px-3 py-2 text-sm",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
              )}
            >
              {WP_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" type="button" onClick={() => void submitAddUser()} disabled={addLoading}>
              {addLoading ? "Adding…" : "Add User"}
            </Button>
            <Button size="sm" variant="outline" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">User</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Login</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Registered</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                  {/* Avatar + Display Name */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.display_name}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.display_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{user.login}</td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                  {/* Role inline select */}
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} size="sm" color={ROLE_COLORS[role] ?? "light"}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                    <select
                      className={cn(
                        "mt-1 rounded border border-gray-300 px-2 py-0.5 text-xs",
                        "dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                        "focus:border-brand-500 focus:outline-none",
                      )}
                      defaultValue={user.roles[0] ?? "subscriber"}
                      disabled={actionLoading === user.id}
                      onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                    >
                      {WP_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                    {new Date(user.registered_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === user.id}
                      onClick={() => handleDelete(user)}
                    >
                      {actionLoading === user.id ? (
                        <span className="flex items-center gap-1">
                          <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                          Working…
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
