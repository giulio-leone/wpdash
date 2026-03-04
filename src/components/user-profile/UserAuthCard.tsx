"use client";

import React from "react";
import { signOut } from "@/application/user/auth-actions";

interface UserAuthCardProps {
  email: string;
  fullName: string;
  createdAt: string;
}

export default function UserAuthCard({ email, fullName, createdAt }: UserAuthCardProps) {
  const joinedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Account Information
          </h4>
          <div className="mt-3 space-y-1">
            {fullName && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-700 dark:text-gray-200">Name:</span>{" "}
                {fullName}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-700 dark:text-gray-200">Email:</span> {email}
            </p>
            {joinedDate && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-700 dark:text-gray-200">Joined:</span>{" "}
                {joinedDate}
              </p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="shadow-theme-xs flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
