"use client";

const roles = [
  { value: "recruiter", label: "Recruiter" },
  { value: "candidate", label: "Candidate" }
];

export default function RoleToggle({ value, onChange, className = "" }) {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 rounded-lg border border-slate-600/50 bg-slate-700/30 p-1 backdrop-blur-sm">
        {roles.map((role) => {
          const active = value === role.value;
          return (
            <button
              key={role.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(role.value)}
              className={`h-10 rounded-md text-sm font-semibold transition-all ${
                active 
                  ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg hover:from-teal-600 hover:to-teal-700" 
                  : "text-slate-300 hover:text-white hover:bg-slate-600/30"
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
