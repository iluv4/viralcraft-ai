export type ScenarioScene = {
  time: string;
  description: string;
  visualConcept: string;
  imageUrl?: string;
};

export type ViralAnalysis = {
  originalLink: string;
  thumbnailUrl?: string;
  hook: string;
  structure: string;
  tempo: string;
  cta: string;
  viralPoints: string[];
  keyTimestamps?: { 
    time: string; 
    label: string;
    screenshotUrl?: string;
    visualConcept?: string; // Used to generate the screenshot if not captured
  }[];
  scenario?: ScenarioScene[];
};

export type RemakeOutput = {
  narration: string;
  shootingAngles: {
    type: string;
    description: string;
  }[];
  editFormat: string;
  viralScore: number;
  tips: string[];
  remakeScenario?: ScenarioScene[];
};

export type Project = {
  id: string;
  title: string;
  originalLink: string;
  originalAnalysis?: ViralAnalysis;
  remakeOutput?: RemakeOutput;
  brandImage?: string;
  userPhoto?: string;
  createdAt: any; // Using any for Timestamp/Date compatibility
};
