export interface Idea {
  id: string;
  timestamp: number;
  name?: string;
  slug?: string;
  category: string;
  scope?: string;
  concept: string;
  platform: string;
  target_audience: string;
  key_features: string[];
  monetization: string;
  value_proposition: string;
  suggested_stack?: string;
  starred?: boolean;
  notes?: string;
  source?: 'local' | 'ai';
}

export interface IdeaResponse {
  slug?: string;
  name?: string;
  category?: string;
  scope?: string;
  concept: string;
  platform: string;
  target_audience: string;
  key_features: string[];
  monetization: string;
  value_proposition: string;
  suggested_stack?: string;
  source?: 'local' | 'ai';
}

export interface CatalogIdeaProfile {
  slug: string;
  category: string;
  name: string;
  scope: string;
  platform: string;
  audience: string;
  challenge: string;
  outcome: string;
  monetization: string;
  features: string[];
  suggested_stack: string;
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

export const SCOPES = [
  'Any Scope',
  'Weekend MVP',
  'Solo SaaS',
  'Tool / Extension',
  'Full Product',
] as const;

export type ScopeFilter = typeof SCOPES[number];

export const PLATFORM_FILTERS = [
  'Any Platform',
  'Web',
  'Mobile',
  'Desktop',
  'Browser Extension',
] as const;

export type PlatformFilter = typeof PLATFORM_FILTERS[number];

export const AI_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)' },
  { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Fastest)' },
] as const;

export type AiModelId = typeof AI_MODELS[number]['id'];

export interface GenerationRequestOptions {
  category: Category;
  scope: ScopeFilter;
  platformFilter: PlatformFilter;
  focus: string;
  excludeNames: string[];
  model?: string;
}

export type PromptMode = 'mvp' | 'prd' | 'ui';
