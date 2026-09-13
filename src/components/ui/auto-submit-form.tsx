"use client";

import type { ComponentProps } from "react";

export function AutoSubmitForm({ children, ...props }: ComponentProps<"form">) {
  return (
    <form {...props} onChange={(event) => event.currentTarget.requestSubmit()}>
      {children}
    </form>
  );
}
