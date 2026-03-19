"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full sm:w-auto" type="submit" variant="secondary">
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out..." : "Log out"}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}

