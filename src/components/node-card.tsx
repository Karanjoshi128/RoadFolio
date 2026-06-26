"use client";

import { useState, useTransition } from "react";
import type { Difficulty, NodeType, ProgressStatus } from "@prisma/client";
import { toast } from "sonner";

import { setNodeStatusAction } from "@/lib/actions/roadmap";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "@/components/material-icon";
import { DifficultyBadge } from "@/components/difficulty-badge";

export interface NodeCardData {
  id: string;
  type: NodeType;
  title: string;
  difficulty: Difficulty | null;
  estimate: string | null;
  optional: boolean;
  status: ProgressStatus;
  hasContent: boolean;
}

export function NodeCard({
  node,
  children,
}: {
  node: NodeCardData;
  children?: React.ReactNode;
}) {
  const [status, setStatus] = useState<ProgressStatus>(node.status);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const done = status === "done";
  const skipped = status === "skipped";
  const active = status === "in_progress";
  const complete = done || skipped;

  function update(next: ProgressStatus) {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await setNodeStatusAction(node.id, next);
      } catch {
        setStatus(prev);
        toast.error("Could not update status.");
      }
    });
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg p-sm transition-colors",
        active
          ? "border border-tertiary/30 bg-white/[0.04]"
          : "hover:bg-white/5"
      )}
    >
      {active && (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-tertiary" />
      )}
      <div className={cn("flex items-start gap-md", active && "pl-1")}>
        {/* Status checkbox */}
        <button
          type="button"
          disabled={pending}
          onClick={() => update(complete ? "not_started" : "done")}
          aria-label={complete ? "Mark not started" : "Mark done"}
          className="mt-0.5 shrink-0"
        >
          <StatusBox status={status} />
        </button>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-sm sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-sm">
              <button
                type="button"
                onClick={() => node.hasContent && setOpen((v) => !v)}
                className={cn(
                  "text-left font-body-md text-body-md",
                  complete
                    ? "text-on-surface-variant line-through opacity-70"
                    : "font-medium text-on-surface",
                  node.hasContent && "hover:underline"
                )}
              >
                {node.title}
              </button>
              {node.type === "project" && (
                <span className="rounded bg-primary-container/15 px-2 py-0.5 font-metadata text-[11px] font-medium text-primary">
                  Project
                </span>
              )}
              {node.difficulty && <DifficultyBadge difficulty={node.difficulty} />}
              {node.optional && (
                <span className="rounded border border-outline-variant px-2 py-0.5 font-metadata text-[11px] text-on-surface-variant">
                  optional
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-xs opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              {!complete && !active && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update("in_progress")}
                  className="rounded px-2 py-1 font-metadata text-[12px] font-semibold text-on-surface-variant hover:text-primary"
                >
                  Start
                </button>
              )}
              {active && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update("done")}
                  className="rounded bg-primary-container px-2 py-1 font-metadata text-[12px] font-semibold text-on-primary transition-colors hover:bg-primary"
                >
                  Mark Done
                </button>
              )}
              {!complete && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update("skipped")}
                  title="Skip"
                  className="rounded p-1 text-on-surface-variant transition-colors hover:text-error"
                >
                  <MaterialIcon name="skip_next" className="text-[16px]" />
                </button>
              )}
              {complete && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update("not_started")}
                  className="rounded px-2 py-1 font-metadata text-[12px] text-on-surface-variant hover:text-primary"
                >
                  Undo
                </button>
              )}
              {node.hasContent && (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="rounded p-1 text-on-surface-variant hover:bg-surface-container"
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  <MaterialIcon
                    name="expand_more"
                    className={cn("text-[18px] transition-transform", open && "rotate-180")}
                  />
                </button>
              )}
            </div>
          </div>

          {open && node.hasContent && (
            <div className="mt-2 border-t border-outline-variant/60 pt-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBox({ status }: { status: ProgressStatus }) {
  if (status === "done") {
    return (
      <div className="flex size-5 items-center justify-center rounded-md bg-primary-container text-on-primary">
        <MaterialIcon name="check" className="text-[16px]" />
      </div>
    );
  }
  if (status === "skipped") {
    return (
      <div className="flex size-5 items-center justify-center rounded-md bg-white/10 text-on-surface-variant">
        <MaterialIcon name="remove" className="text-[16px]" />
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="flex size-5 items-center justify-center rounded-md border-2 border-tertiary bg-tertiary/10">
        <div className="size-2 rounded-sm bg-tertiary" />
      </div>
    );
  }
  return <div className="size-5 rounded-md border-2 border-outline-variant" />;
}
