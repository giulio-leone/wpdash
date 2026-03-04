import SignInForm from "@/components/auth/SignInForm";
import { APP_NAME } from "@/lib/branding";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Sign In | ${APP_NAME}`,
  description: `Sign in to ${APP_NAME} — your centralized WordPress management dashboard`,
};

export default function SignIn() {
  return <SignInForm />;
}
