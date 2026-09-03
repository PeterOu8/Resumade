export type TailoredExperience = {
  company: string;
  title: string;
  dates?: string;
  bullets: string[];
};

export type TailorResult = {
  summary: string;
  keySkills: string[];
  experience: TailoredExperience[];
  education?: string[];
  atsHints: string[];
  coverLetter: string;
};
