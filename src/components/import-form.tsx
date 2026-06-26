"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { importRoadmapAction } from "@/lib/actions/roadmap";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
    setError(null);
    toast.success(`Loaded ${file.name}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await importRoadmapAction(markdown);
      if (!result.ok) {
        setError(result.error);
        toast.error("Import failed.");
        return;
      }
      toast.success("Roadmap imported.");
      router.push(`/roadmaps/${result.slug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass-panel space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="file">Upload a .md file</Label>
            <input
              id="file"
              ref={fileRef}
              type="file"
              accept=".md,text/markdown,text/plain"
              onChange={handleFile}
              className="block w-full text-sm text-on-surface-variant file:mr-4 file:rounded-md file:border file:border-white/15 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-on-surface hover:file:bg-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="markdown">Or paste Markdown</Label>
            <Textarea
              id="markdown"
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
                setError(null);
              }}
              placeholder={"---\ntitle: My Roadmap\nslug: my-roadmap\n---\n\n## Phase 1 {id: phase-1, type: milestone}\n\n### First task {id: t1, type: task}"}
              className="min-h-64 font-mono text-xs"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setMarkdown("");
            setError(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
        >
          Clear
        </Button>
        <Button
          type="submit"
          className="bg-primary-container font-semibold text-on-primary hover:bg-primary"
          disabled={pending || !markdown.trim()}
        >
          {pending ? "Importing…" : "Import roadmap"}
        </Button>
      </div>
    </form>
  );
}
