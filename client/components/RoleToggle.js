"use client";

const roles = [
  { value: "recruiter", label: "Recruiter" },
  { value: "candidate", label: "Candidate" }
];

export default function RoleToggle({ value, onChange, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">Continue as</label>
      <div className="mt-2 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
        {roles.map((role) => {
          const active = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(role.value)}
              className={`h-10 rounded-[4px] text-sm font-semibold transition ${
                active ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
            >
              {role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
