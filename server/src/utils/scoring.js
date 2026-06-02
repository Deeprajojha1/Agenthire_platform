export function scoreCandidate(parsedResume, hiringSpec) {
  const candidateSkills = new Set((parsedResume.skills || []).map((skill) => skill.toLowerCase()));
  const required = hiringSpec.required_skills || [];
  const preferred = hiringSpec.preferred_skills || [];
  const requiredHits = required.filter((skill) => candidateSkills.has(skill.toLowerCase())).length;
  const preferredHits = preferred.filter((skill) => candidateSkills.has(skill.toLowerCase())).length;
  const requiredScore = required.length ? (requiredHits / required.length) * 70 : 70;
  const preferredScore = preferred.length ? (preferredHits / preferred.length) * 20 : 20;
  const experienceScore = Number(parsedResume.experience || 0) > 0 ? 10 : 0;
  return Math.min(100, Math.round(requiredScore + preferredScore + experienceScore));
}

export function decideShortlist(score, rulesSpec) {
  const decision = rulesSpec.decisions.find((rule) => score >= rule.min_score && score <= rule.max_score);
  return decision ? decision.name : "hold";
}
