const tones = {
  teal: "from-teal-50 to-cyan-50 border-teal-100 text-teal-700",
  indigo: "from-indigo-50 to-violet-50 border-indigo-100 text-indigo-700",
  amber: "from-amber-50 to-orange-50 border-amber-100 text-amber-700",
  rose: "from-rose-50 to-pink-50 border-rose-100 text-rose-700"
};

export function StatCard({ label, value, tone = "teal", icon: Icon }) {
  const toneClass = tones[tone] || tones.teal;
  return (
    <div className={`rounded-lg border bg-gradient-to-br p-3 shadow-sm ring-1 ring-white/70 sm:p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-current shadow-sm sm:h-9 sm:w-9">
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</p>
    </div>
  );
}
