import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { overallProgress, type ProgressNode } from "@/lib/roadmap/progress";
import { buildHeatmap } from "@/lib/roadmap/activity";
import { MaterialIcon } from "@/components/material-icon";
import { ProgressBar } from "@/components/progress-bar";
import { ActivityHeatmap } from "@/components/activity-heatmap";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;
  const user = session.user;

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { nodes: { include: { progress: { where: { userId } } } } },
  });

  const summaries = roadmaps.map((roadmap) => {
    const progressNodes: ProgressNode[] = roadmap.nodes.map((n) => ({
      id: n.id,
      nodeKey: n.nodeKey,
      parentKey: n.parentKey,
      type: n.type,
      optional: n.optional,
      status: n.progress[0]?.status ?? "not_started",
    }));
    return { roadmap, summary: overallProgress(progressNodes) };
  });

  const completed = summaries.filter((s) => s.summary.total > 0 && s.summary.pct >= 100);
  const inProgress = summaries.filter(
    (s) => s.summary.total > 0 && s.summary.pct > 0 && s.summary.pct < 100
  );
  const tasksDone = roadmaps.reduce(
    (acc, r) => acc + r.nodes.filter((n) => n.progress[0]?.status === "done").length,
    0
  );
  const timestamps = roadmaps.flatMap((r) =>
    r.nodes
      .filter((n) => n.progress[0] && n.progress[0].status !== "not_started")
      .map((n) => n.progress[0]!.updatedAt)
  );
  const activeDays = new Set(timestamps.map((d) => d.toISOString().slice(0, 10))).size;
  const { columns } = buildHeatmap(timestamps, new Date(), 13);
  const interests = Array.from(new Set(roadmaps.flatMap((r) => r.tags))).slice(0, 8);

  const name = user.name ?? user.email?.split("@")[0] ?? "Learner";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      {/* Emerald gradient banner */}
      <div className="absolute inset-x-0 top-0 -z-10 h-24 rounded-xl bg-linear-to-r from-primary/5 via-primary-container/10 to-primary-container/25" />

      <div className="grid grid-cols-1 items-stretch gap-5 pt-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          {/* Profile identity */}
          <div className="flex flex-col items-center glass-panel p-6 text-center shadow-sm">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="size-20 rounded-full border-4 border-surface object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border-4 border-surface bg-primary-container text-4xl font-bold text-on-primary shadow-sm">
                {initial}
              </div>
            )}
            <h2 className="mt-3 font-headline-md text-headline-md text-on-surface">{name}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{user.email}</p>
          </div>

          {/* Interests */}
          <div className="glass-panel p-5 shadow-sm">
            <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">Interests</h3>
            {interests.length === 0 ? (
              <p className="font-metadata text-metadata text-on-surface-variant">
                Tags from your roadmaps will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary-container bg-primary-container/15 px-3 py-1.5 font-label-caps text-label-caps text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Learning activity */}
          <div className="flex flex-1 flex-col glass-panel p-5 shadow-sm">
            <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">
              Learning Activity
            </h3>
            <div className="flex flex-1 items-center">
              <ActivityHeatmap columns={columns} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-4">
            <StatTile
              icon="trophy"
              label="Completed"
              value={completed.length}
              unit="Roadmaps"
            />
            <StatTile icon="task_alt" label="Tasks Done" value={tasksDone} unit="Total" accent />
            <StatTile
              icon="local_fire_department"
              label="Active Days"
              value={activeDays}
              unit="Days"
              warm
            />
          </div>

          {/* In Progress */}
          <div className="glass-panel p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">In Progress</h3>
              <Link
                href="/roadmaps"
                className="font-metadata text-metadata text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {inProgress.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Nothing in progress yet. Open a roadmap and start checking off tasks.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {inProgress.map(({ roadmap, summary }) => (
                  <Link
                    key={roadmap.id}
                    href={`/roadmaps/${roadmap.slug}`}
                    className="glass-inset group flex flex-col p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <h4 className="font-body-lg text-body-lg font-medium text-on-surface group-hover:text-primary">
                      {roadmap.title}
                    </h4>
                    <div className="mb-4 mt-2 flex flex-wrap gap-1.5">
                      {roadmap.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary-container/15 px-2 py-0.5 font-metadata text-[11px] text-primary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <div className="mb-1 flex justify-between font-metadata text-metadata text-on-surface-variant">
                        <span>{summary.pct}% Completed</span>
                        <span>
                          {summary.done}/{summary.total}
                        </span>
                      </div>
                      <ProgressBar value={summary.pct} trackClassName="h-1.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Archive — grows to fill the column */}
          <div className="flex flex-1 flex-col glass-panel shadow-sm">
            <div className="border-b border-white/10 p-5">
              <h3 className="font-headline-md text-headline-md text-on-surface">Archive</h3>
              <p className="font-metadata text-metadata text-on-surface-variant">
                Your completed learning journeys.
              </p>
            </div>
            {completed.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-white/5 text-primary">
                  <MaterialIcon name="workspace_premium" className="text-[28px]" />
                </div>
                <p className="max-w-[22rem] font-body-md text-body-md text-on-surface-variant">
                  Finish a roadmap to add it to your archive. Keep going!
                </p>
              </div>
            ) : (
              <div>
                {completed.map(({ roadmap }) => (
                  <Link
                    key={roadmap.id}
                    href={`/roadmaps/${roadmap.slug}`}
                    className="group flex items-center justify-between gap-md border-b border-white/10 p-5 transition-colors last:border-b-0 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <MaterialIcon name="workspace_premium" className="text-on-surface-variant" />
                      </div>
                      <div>
                        <h4 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary">
                          {roadmap.title}
                        </h4>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {roadmap.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="font-metadata text-metadata text-on-surface-variant"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <MaterialIcon
                      name="arrow_forward"
                      className="text-on-surface-variant transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  unit,
  accent,
  warm,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  accent?: boolean;
  warm?: boolean;
}) {
  const color = warm
    ? "text-secondary-container"
    : accent
      ? "text-primary-container"
      : "text-primary";
  return (
    <div className="flex flex-col glass-panel p-4 shadow-sm">
      <div className={`mb-2 flex items-center gap-1.5 ${color}`}>
        <MaterialIcon name={icon} fill className="text-[20px]" />
        <span className="truncate font-label-caps text-label-caps uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="font-display text-[2.5rem] leading-none text-on-surface">{value}</span>
      <span className="mt-1.5 font-metadata text-metadata text-on-surface-variant">{unit}</span>
    </div>
  );
}
