const STYLES = {
  pine: "bg-pine-100 text-pine-800",
  clay: "bg-clay-100 text-clay-800",
  sand: "bg-sand-100 text-sand-900",
  gold: "bg-amber-100 text-amber-900",
} as const;

interface BadgeProps {
  children: React.ReactNode;
  tone?: keyof typeof STYLES;
}

export function Badge({ children, tone = "pine" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
