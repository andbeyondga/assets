"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/portal/login");
        router.refresh();
      }}
      className="text-sm font-medium text-ink-soft hover:text-pine-800 hover:underline underline-offset-4"
    >
      Sign out
    </button>
  );
}
