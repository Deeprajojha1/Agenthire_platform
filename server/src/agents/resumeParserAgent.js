import fs from "fs";
import pdf from "pdf-parse";

export async function resumeParserAgent(input) {
  const buffer = fs.readFileSync(input.resumePath);
  const parsed = await pdf(buffer);
  const text = parsed.text || "";
  const knownSkills = [...(input.hiringSpec.required_skills || []), ...(input.hiringSpec.preferred_skills || [])];
  const skills = knownSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()));
  const yearsMatch = text.match(/(\d+)\+?\s+years?/i);
  return {
    success: true,
    data: {
      name: input.candidate.name,
      skills,
      experience: yearsMatch ? Number(yearsMatch[1]) : 0,
      education: /b\.?tech|bachelor|degree/i.test(text) ? "Degree mentioned" : "Not detected",
      raw_text: text.slice(0, 4000)
    }
  };
}
