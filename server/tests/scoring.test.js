import { decideShortlist, scoreCandidate } from "../src/utils/scoring.js";

test("scores against a hiring spec without hardcoded thresholds", () => {
  const score = scoreCandidate({ skills: ["React", "JavaScript", "CSS"], experience: 2 }, {
    required_skills: ["React", "JavaScript", "CSS"],
    preferred_skills: ["Next.js"]
  });
  expect(score).toBeGreaterThanOrEqual(80);
});

test("decides from supplied rules", () => {
  expect(decideShortlist(61, { decisions: [{ name: "hold", min_score: 60, max_score: 79 }] })).toBe("hold");
});
