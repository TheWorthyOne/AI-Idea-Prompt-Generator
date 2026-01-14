export interface Idea {
  id: string;
  timestamp: number;
  category: string;
  concept: string;
  platform: string;
  target_audience: string;
  key_features: string[];
  monetization: string;
  value_proposition: string;
}

export interface IdeaResponse {
  concept: string;
  platform: string;
  target_audience: string;
  key_features: string[];
  monetization: string;
  value_proposition: string;
}

export const CATEGORIES = [
  'All Categories',
  'Fintech',
  'Healthcare',
  'E-commerce',
  'Education',
  'SaaS',
  'Entertainment',
  'Social Media',
  'Productivity',
  'Gaming',
  'Travel',
  'Food & Beverage',
  'Real Estate',
  'Transportation',
  'Environment',
  'AI & Machine Learning',
] as const;

export type Category = typeof CATEGORIES[number];
