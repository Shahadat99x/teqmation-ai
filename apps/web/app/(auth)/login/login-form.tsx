"use client";

import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  type LoginActionState,
  signInAction,
} from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginActionState = {};

type LoginFormProps = {
  nextPath: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full rounded-2xl" size="lg" type="submit">
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="next" type="hidden" value={nextPath} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="email"
            className="pl-10"
            id="email"
            name="email"
            placeholder="owner@consultancy.com"
            required
            type="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            autoComplete="current-password"
            className="pl-10"
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </div>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}

