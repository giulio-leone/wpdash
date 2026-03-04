import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Sign Up | WPDash`,
  description: `Create your WPDash account — centralized WordPress management dashboard`,
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
