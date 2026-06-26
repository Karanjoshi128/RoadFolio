import { cn } from "@/lib/utils";

/**
 * Renders a Material Symbols Outlined icon (the icon set used in the Stitch design).
 * The font is loaded via a <link> in the root layout.
 */
export function MaterialIcon({
  name,
  className,
  fill = false,
  style,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("material-symbols-outlined select-none", fill && "fill", className)}
      style={style}
    >
      {name}
    </span>
  );
}
