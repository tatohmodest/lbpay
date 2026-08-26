"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { DEMO_PASSWORD } from "@/lib/demo/seed";
import { useApp } from "@/lib/store";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, state } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState(state.user.email);
  const [password, setPassword] = useState(DEMO_PASSWORD);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-soft lg:block">
        <Image
          src="/illustrations/hero-send-money.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <Logo />
        <h1 className="mt-10 text-3xl font-bold tracking-tight">
          {mode === "login" ? "Sign in to LBPay" : "Create your LBPay wallet"}
        </h1>
        <p className="mt-2 text-muted">
          Demo mode is on. Continue as Modest or use {state.user.email} / {DEMO_PASSWORD}.
        </p>
        <Card className="mt-8 p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              login();
              router.push("/wallet");
            }}
          >
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button type="submit">{mode === "login" ? "Sign in" : "Create account"}</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                login();
                router.push("/wallet");
              }}
            >
              Continue as @{state.user.lbpayId}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-sm text-muted">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-semibold text-brand">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
