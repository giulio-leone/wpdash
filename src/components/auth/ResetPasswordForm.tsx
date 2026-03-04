"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { resetPassword } from "@/application/user/auth-actions";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useActionState } from "react";

export default function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, {});

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to sign in
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="text-title-sm sm:text-title-md mb-2 font-semibold text-gray-800 dark:text-white/90">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          <div>
            {state.error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {state.error}
              </div>
            )}
            {state.success && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                Check your email for a password reset link.
              </div>
            )}
            <form action={formAction}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input placeholder="info@gmail.com" type="email" name="email" />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white transition"
                  >
                    {isPending ? "Sending…" : "Send Reset Link"}
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
