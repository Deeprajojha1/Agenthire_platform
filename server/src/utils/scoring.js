export function scoreCandidate(parsedResume, hiringSpec, matchingSpec) {
  const candidateSkills = new Set((parsedResume.skills || []).map((skill) => skill.toLowerCase()));
  const required = hiringSpec.required_skills || [];
  const preferred = hiringSpec.preferred_skills || [];
  const requiredHits = required.filter((skill) => candidateSkills.has(skill.toLowerCase())).length;
  const preferredHits = preferred.filter((skill) => candidateSkills.has(skill.toLowerCase())).length;
  const weights = matchingSpec.weights;
  const requiredScore = required.length ? (requiredHits / required.length) * weights.required_skills : weights.required_skills;
  const preferredScore = preferred.length ? (preferredHits / preferred.length) * weights.preferred_skills : weights.preferred_skills;
  const minimumExperience = Number(hiringSpec.min_experience || 0);
  const candidateExperience = Number(parsedResume.experience || 0);
  const experienceScore = minimumExperience ? Math.min(candidateExperience / minimumExperience, 1) * weights.experience : weights.experience;
  return {
    match_score: Math.min(100, Math.round(requiredScore + preferredScore + experienceScore)),
    matched_required_skills: required.filter((skill) => candidateSkills.has(skill.toLowerCase())),
    matched_preferred_skills: preferred.filter((skill) => candidateSkills.has(skill.toLowerCase())),
    missing_skills: required.filter((skill) => !candidateSkills.has(skill.toLowerCase())),
    all_skills_matched: required.every((skill) => candidateSkills.has(skill.toLowerCase())),
    experience_met: candidateExperience >= minimumExperience
  };
}

export function decideShortlist(score, rulesSpec) {
  const decision = rulesSpec.decisions.find((rule) => score >= rule.min_score && score <= rule.max_score);
  return decision ? decision.name : "hold";
}
