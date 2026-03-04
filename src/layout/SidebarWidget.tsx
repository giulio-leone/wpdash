import React from "react";

export default function SidebarWidget() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "WPDash";
  return (
    <div
      className={`mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        {appName}
      </h3>
      <p className="text-theme-sm mb-4 text-gray-500 dark:text-gray-400">
        Centralized WordPress monitoring &amp; maintenance dashboard.
      </p>
    </div>
  );
}
