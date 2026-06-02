import fs from "fs";
import pdf from "pdf-parse";

export async function resumeParserAgent(input) {
  const parserSpec = input.parserSpec;
  const buffer = fs.readFileSync(input.resumePath);
  const parsed = await pdf(buffer);
  const text = parsed.text || "";
  const knownSkills = [...new Set([
    ...(parserSpec.known_skills || []),
    ...(input.hiringSpec.required_skills || []),
    ...(input.hiringSpec.preferred_skills || [])
  ])];
  const skills = knownSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));
  const yearsMatch = (parserSpec.experience_patterns || []).map((pattern) => text.match(new RegExp(pattern, "i"))).find(Boolean);
  const education = (parserSpec.education_keywords || []).find((keyword) => text.toLowerCase().includes(keyword.toLowerCase())) || "Not detected";
  const projects = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => (parserSpec.project_keywords || []).some((keyword) => line.toLowerCase().includes(keyword.toLowerCase())))
    .slice(0, 5);
  return {
    success: true,
    data: {
      name: input.candidate.name,
      skills,
      experience: yearsMatch ? Number(yearsMatch[1]) : 0,
      education,
      projects,
      raw_text: text.slice(0, 4000)
    }
  };
}
