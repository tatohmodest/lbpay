"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEGAL_NOTE } from "@/lib/flags";
import { useApp } from "@/lib/store";

export default function ProfilePage() {
  const { state, logout } = useApp();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6 text-center">
        <Image
          src={state.user.avatar}
          alt=""
          width={96}
          height={96}
          className="mx-auto h-24 w-24 rounded-full object-cover"
        />
        <h1 className="mt-4 text-2xl font-black">{state.user.name}</h1>
        <p className="font-mono text-brand">@{state.user.lbpayId}</p>
        <p className="mt-1 text-sm text-muted">{state.user.phone} · KYC {state.user.kycStatus}</p>
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </Card>
      <p className="mt-4 text-xs text-muted">{LEGAL_NOTE}</p>
    </div>
  );
}
