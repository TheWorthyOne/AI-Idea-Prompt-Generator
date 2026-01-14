import { Idea } from '../types';

export function formatIdeaForClipboard(idea: Idea): string {
  return `# ${idea.category} Startup Idea
Generated: ${new Date(idea.timestamp).toLocaleString()}

## Concept
${idea.concept}

## Platform
${idea.platform}

## Target Audience
${idea.target_audience}

## Key Features
${idea.key_features.map((feature, index) => `${index + 1}. ${feature}`).join('\n')}

## Monetization Strategy
${idea.monetization}

## Value Proposition
${idea.value_proposition}
`;
}
