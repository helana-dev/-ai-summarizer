export interface SummaryResult {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  studyQA: {
    question: string;
    answer: string;
  }[];
  date: string;
  originalText: string;
  style: "short" | "medium" | "detailed";
}

export type Screen = "welcome" | "home" | "summary" | "history" | "settings";

export interface AppSettings {
  darkMode: boolean;
}
