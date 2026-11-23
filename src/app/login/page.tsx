import { Suspense } from "react";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { Card, CardBody } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardBody className="p-6">
            <h1 className="text-lg font-semibold text-fg">Admin sign in</h1>
            <p className="mt-1 mb-5 text-sm text-fg-muted">
              Access is restricted to Nexai administrators.
            </p>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardBody>
        </Card>
        <p className="mt-4 text-center text-xs text-fg-subtle">
          Accounts are provisioned by Nexai. There is no public sign-up.
        </p>
      </div>
    </div>
  );
}
