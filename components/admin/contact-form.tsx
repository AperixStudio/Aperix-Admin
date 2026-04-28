"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { createContact } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Add contact"}</button>;
}

export function ContactForm({ projectId }: { projectId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  return (
    <form
      ref={ref}
      action={async (fd) => {
        try { await createContact(fd); toast.push("Contact added", "success"); ref.current?.reset(); }
        catch (e) { toast.push(e instanceof Error ? e.message : "Failed", "error"); }
      }}
      className="inline-form"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input name="name" placeholder="Name" required />
      <input name="role" placeholder="Role" required />
      <input name="email" placeholder="Email (optional)" type="email" />
      <Submit />
    </form>
  );
}
