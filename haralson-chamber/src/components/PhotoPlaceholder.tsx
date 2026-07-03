import { initials } from "@/lib/format";

const PALETTES = [
  "from-pine-700 to-pine-900",
  "from-clay-600 to-clay-800",
  "from-sand-500 to-sand-700",
  "from-pine-500 to-pine-700",
  "from-clay-500 to-clay-700",
];

interface PhotoPlaceholderProps {
  /** Text the placeholder stands in for (business name, event title...). */
  label: string;
  /** Show initials over the gradient (default true). */
  showInitials?: boolean;
  className?: string;
}

/**
 * Stands in wherever real photography will eventually go. Deterministic
 * warm-toned gradient per label so cards stay stable across renders.
 * Replace by rendering an <img>/<Image> when imageUrl is present.
 */
export function PhotoPlaceholder({
  label,
  showInitials = true,
  className = "",
}: PhotoPlaceholderProps) {
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const palette = PALETTES[hash % PALETTES.length];

  return (
    <div
      aria-hidden
      className={`grid place-items-center bg-gradient-to-br ${palette} ${className}`}
    >
      {showInitials && (
        <span className="font-display text-3xl font-semibold text-white/60">
          {initials(label)}
        </span>
      )}
    </div>
  );
}
