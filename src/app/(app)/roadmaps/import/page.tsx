import { ImportForm } from "@/components/import-form";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import a roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Upload a <code>.md</code> file or paste Markdown. Must follow the
          RoadFolio format (see <code>docs/roadmap-format.md</code>).
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
