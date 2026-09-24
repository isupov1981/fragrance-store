"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, FormEvent } from "react";

function pathFromForm(form: HTMLFormElement) {
  const action = form.getAttribute("action") || form.action || window.location.pathname;
  const url = new URL(action, window.location.origin);
  const params = new URLSearchParams();
  const data = new FormData(form);
  for (const [key, value] of data.entries()) {
    if (typeof value === "string" && value !== "") params.set(key, value);
  }
  url.search = params.toString();
  return `${url.pathname}${url.search}`;
}

/** GET forms that update the URL via the App Router instead of a full document reload. */
export function AutoSubmitForm({ children, ...props }: ComponentProps<"form">) {
  const router = useRouter();

  function navigate(form: HTMLFormElement) {
    router.push(pathFromForm(form));
  }

  return (
    <form
      {...props}
      method="get"
      onChange={(event) => navigate(event.currentTarget)}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        navigate(event.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
