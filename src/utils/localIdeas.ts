import catalogData from '../data/ideas.json';
import {
  CatalogIdeaProfile,
  GenerationRequestOptions,
  IdeaResponse,
} from '../types';

const IDEA_CATALOG: CatalogIdeaProfile[] = catalogData as CatalogIdeaProfile[];

export const CATALOG_COUNT = IDEA_CATALOG.length;

function matchesPlatform(profilePlatform: string, platformFilter: string): boolean {
  if (!platformFilter || platformFilter === 'Any Platform') return true;
  return profilePlatform.toLowerCase().includes(platformFilter.toLowerCase());
}

function scoreFocusMatch(profile: CatalogIdeaProfile, focus: string): number {
  const tokens = focus
    .toLowerCase()
    .split(/[\s,;/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  if (tokens.length === 0) return 0;

  const haystack = [
    profile.name,
    profile.category,
    profile.scope,
    profile.platform,
    profile.audience,
    profile.challenge,
    profile.outcome,
    profile.monetization,
    profile.suggested_stack,
    ...profile.features,
  ]
    .join(' ')
    .toLowerCase();

  return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
}

export function generateLocalIdeaInBrowser(options: GenerationRequestOptions): IdeaResponse {
  const { category, scope, platformFilter, focus, excludeNames } = options;

  let candidates = IDEA_CATALOG.filter((profile) =>
    category === 'All Categories' ? true : profile.category === category,
  );

  if (candidates.length === 0) {
    throw new Error(`No built-in idea profiles exist for ${category}.`);
  }

  // Apply scope & platform filters, relaxing gracefully if a strict combo has 0 exact hits
  const scopedAndPlatform = candidates.filter(
    (p) =>
      (scope === 'Any Scope' || p.scope === scope) &&
      matchesPlatform(p.platform, platformFilter),
  );

  if (scopedAndPlatform.length > 0) {
    candidates = scopedAndPlatform;
  } else {
    const scopeOnly = candidates.filter((p) => scope === 'Any Scope' || p.scope === scope);
    const platformOnly = candidates.filter((p) => matchesPlatform(p.platform, platformFilter));
    if (scopeOnly.length > 0) {
      candidates = scopeOnly;
    } else if (platformOnly.length > 0) {
      candidates = platformOnly;
    }
  }

  // Prefer unseen ideas not currently in the user's notebook
  const excludedSet = new Set(excludeNames.map((n) => n.trim().toLowerCase()));
  const unseen = candidates.filter(
    (p) => !excludedSet.has(p.name.toLowerCase()) && !excludedSet.has(p.slug.toLowerCase()),
  );
  const pool = unseen.length > 0 ? unseen : candidates;

  // If user entered a focus keyword, prioritize matching profiles if any score > 0
  const trimmedFocus = focus.trim();
  let finalPool = pool;
  if (trimmedFocus) {
    const scored = pool
      .map((profile) => ({ profile, score: scoreFocusMatch(profile, trimmedFocus) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const topScore = scored[0].score;
      finalPool = scored.filter((entry) => entry.score >= topScore).map((entry) => entry.profile);
    }
  }

  // True random pick from the eligible unseen pool
  const randomBuffer = new Uint32Array(2);
  crypto.getRandomValues(randomBuffer);
  const profile = finalPool[randomBuffer[0] % finalPool.length];
  const featureOffset = randomBuffer[1] % profile.features.length;
  const spotlight = profile.features[featureOffset].toLowerCase();

  const key_features = profile.features.map(
    (_, index) => profile.features[(featureOffset + index) % profile.features.length],
  );

  const focusTail =
    trimmedFocus && scoreFocusMatch(profile, trimmedFocus) === 0
      ? ` Tailored specifically around "${trimmedFocus}".`
      : '';

  return {
    slug: profile.slug,
    name: profile.name,
    category: profile.category,
    scope: profile.scope,
    concept: `${profile.name} is a ${profile.platform.toLowerCase()} product (${profile.scope.toLowerCase()}) for ${profile.audience}, anchored by ${spotlight}. It helps them ${profile.challenge}—delivering ${profile.outcome}.${focusTail}`,
    platform: profile.platform,
    target_audience: trimmedFocus && scoreFocusMatch(profile, trimmedFocus) === 0
      ? `${profile.audience} (with a focus on ${trimmedFocus})`
      : profile.audience,
    key_features,
    monetization: profile.monetization,
    value_proposition: `${profile.name} gives ${profile.audience} ${profile.outcome}, centered on ${spotlight}.`,
    suggested_stack: profile.suggested_stack,
    source: 'local',
  };
}

export async function testApiKeyInBrowser(apiKey: string, model?: string): Promise<boolean> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });
  return response.ok;
}

export async function generateAiIdeaInBrowser(
  apiKey: string,
  options: GenerationRequestOptions,
): Promise<IdeaResponse> {
  const { category, scope, platformFilter, focus, excludeNames, model } = options;

  const domainClause =
    category === 'All Categories' ? 'any practical domain or industry' : `the ${category} space`;
  const scopeClause =
    scope === 'Any Scope' ? 'a realistic, buildable MVP scope' : `a "${scope}" build scope`;
  const platformClause =
    platformFilter === 'Any Platform'
      ? 'the best-fit platform (Web, Mobile, Desktop, or Browser Extension)'
      : `the ${platformFilter} platform`;
  const focusClause = focus.trim()
    ? `\nIncorporate this specific angle, audience, or constraint: "${focus.trim()}".`
    : '';
  const avoidClause =
    excludeNames.length > 0
      ? `\nDo NOT repeat or closely imitate these existing ideas: ${excludeNames.slice(0, 25).join(', ')}.`
      : '';

  const prompt = `Generate an original, grounded, genuinely buildable startup or software product idea in ${domainClause}, designed for ${scopeClause} on ${platformClause}.${focusClause}${avoidClause}

Avoid generic "AI wrapper for everything" clichés—anchor the concept in a concrete workflow, sharp target user, and clear wedge feature.

Return ONLY valid JSON matching this exact structure:
{
  "name": "Short memorable product name (1-3 words)",
  "category": "${category === 'All Categories' ? 'Best matching category name' : category}",
  "scope": "${scope === 'Any Scope' ? 'Weekend MVP | Solo SaaS | Tool / Extension | Full Product' : scope}",
  "concept": "2-3 crisp sentences explaining what it is, the painful workflow it fixes, and the outcome.",
  "platform": "Recommended platform",
  "target_audience": "Specific target persona and context",
  "key_features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5", "feature 6"],
  "monetization": "Realistic pricing and business model",
  "value_proposition": "1 punchy sentence stating why users switch to this",
  "suggested_stack": "Concrete recommended tech stack for building v1 fast"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { content?: Array<{ text: string }> };
  const rawText = data.content?.[0]?.text?.trim();
  if (!rawText) {
    throw new Error('Empty response from Claude.');
  }

  const jsonText = rawText.includes('```json')
    ? rawText.split('```json')[1]?.split('```')[0]?.trim() || rawText
    : rawText.includes('```')
      ? rawText.split('```')[1]?.split('```')[0]?.trim() || rawText
      : rawText;

  const parsed = JSON.parse(jsonText) as IdeaResponse;
  return {
    ...parsed,
    category: parsed.category || (category === 'All Categories' ? 'SaaS' : category),
    source: 'ai',
  };
}
