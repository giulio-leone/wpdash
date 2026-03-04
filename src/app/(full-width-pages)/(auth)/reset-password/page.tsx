import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | WP Dash",
  description: "Reset your WP Dash account password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
