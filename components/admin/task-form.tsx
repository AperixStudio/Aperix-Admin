"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { createTask, setTaskStatus } from "@/lib/admin-actions";
import { useToast } from "@/components/admin/toast-provider";
import type { TaskItem } from "@/lib/admin-types";

function SubmitButton({ label = "Add task" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function TaskForm({ projectId, defaultOwner }: { projectId: string; defaultOwner: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  return (
    <form
      ref={ref}
      action={async (fd) => {
        try {
          await createTask(fd);
          toast.push("Task added", "success");
          ref.current?.reset();
        } catch (e) {
          toast.push(e instanceof Error ? e.message : "Failed to add task", "error");
        }
      }}
      className="inline-form"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input name="title" placeholder="Task title" required minLength={2} />
      <input name="owner" placeholder="Owner" defaultValue={defaultOwner} required />
      <select name="priority" defaultValue="medium">
        <option>low</option>
        <option>medium</option>
        <option>high</option>
      </select>
      <SubmitButton />
    </form>
  );
}

export function TaskStatusButtons({ projectId, task }: { projectId: string; task: TaskItem }) {
  const toast = useToast();
  const next: TaskItem["status"][] =
    task.status === "open"
      ? ["in-progress", "blocked", "done"]
      : task.status === "in-progress"
      ? ["blocked", "done"]
      : task.status === "blocked"
      ? ["in-progress", "done"]
      : [];
  if (next.length === 0) return null;
  return (
    <div className="task-actions">
      {next.map((s) => (
        <form
          key={s}
          action={async () => {
            try {
              await setTaskStatus(projectId, task.id, s);
              toast.push(`Task → ${s}`, "success");
            } catch (e) {
              toast.push(e instanceof Error ? e.message : "Update failed", "error");
            }
          }}
        >
          <button type="submit" className={`task-action task-action-${s}`}>
            → {s}
          </button>
        </form>
      ))}
    </div>
  );
}
