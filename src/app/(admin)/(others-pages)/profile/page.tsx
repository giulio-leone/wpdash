import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserAuthCard from "@/components/user-profile/UserAuthCard";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Profile | WP Dash",
  description: "Your WP Dash profile",
};

export default async function Profile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 lg:mb-7 dark:text-white/90">
          Profile
        </h3>
        <div className="space-y-6">
          <UserAuthCard
            email={user?.email ?? ""}
            fullName={user?.user_metadata?.full_name ?? ""}
            createdAt={user?.created_at ?? ""}
          />
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}
