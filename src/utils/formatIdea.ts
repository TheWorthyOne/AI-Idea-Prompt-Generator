import { Idea, PromptMode } from '../types';

export function getIdeaDisplayName(idea: Idea): string {
  if (idea.name && idea.name.trim()) {
    return idea.name.trim();
  }
  const match = idea.concept.match(/^([A-Z][\w\s&-]{1,28}?)\s+is\s+a[n]?\s+/);
  if (match?.[1]) {
    return match[1].trim();
  }
  return `${idea.category} Concept`;
}

function inferStack(idea: Idea): string {
  if (idea.suggested_stack && idea.suggested_stack.trim()) {
    return idea.suggested_stack.trim();
  }
  const p = idea.platform.toLowerCase();
  if (p.includes('extension')) {
    return 'TypeScript + Vite + Manifest V3 WebExtension + local storage';
  }
  if (p.includes('desktop')) {
    return 'Tauri 2.0 + Rust + React + TypeScript + SQLite';
  }
  if (p.includes('mobile') && !p.includes('web')) {
    return 'React Native (Expo) + TypeScript + SQLite';
  }
  return 'React + TypeScript + Vite + SQLite / PostgreSQL (Supabase)';
}

export function formatIdeaForClipboard(idea: Idea): string {
  const title = getIdeaDisplayName(idea);
  const metaParts = [idea.category, idea.scope, idea.platform].filter(Boolean).join(' · ');
  const notesSection =
    idea.notes && idea.notes.trim()
      ? `\n## Builder Notes\n${idea.notes.trim()}\n`
      : '';

  return `# ${title} (${metaParts})
Generated: ${new Date(idea.timestamp).toLocaleString()}

## Concept
${idea.concept}

## Target Audience
${idea.target_audience}

## Core Features
${idea.key_features.map((feature, index) => `${index + 1}. ${feature}`).join('\n')}

## Monetization Strategy
${idea.monetization}

## Value Proposition
${idea.value_proposition}

## Suggested Stack
${inferStack(idea)}
${notesSection}`;
}

export function buildCodingPrompt(idea: Idea, mode: PromptMode): string {
  const title = getIdeaDisplayName(idea);
  const stack = inferStack(idea);
  const featuresBullets = idea.key_features
    .map((feature, index) => `${index + 1}. ${feature}`)
    .join('\n');
  const customNotes =
    idea.notes && idea.notes.trim()
      ? `\n## Additional Builder Twist & Constraints\n${idea.notes.trim()}\n`
      : '';

  if (mode === 'prd') {
    return `Act as a pragmatic Staff Product Engineer and Startup Architect. Turn the product concept below into an actionable **v1 Product & Technical Specification** that a solo developer can ship quickly.

# Product: ${title}
- **Category:** ${idea.category}
- **Target Scope:** ${idea.scope || 'Focused MVP'}
- **Platform:** ${idea.platform}
- **Target Audience:** ${idea.target_audience}
- **Core Value Proposition:** ${idea.value_proposition}
- **Business Model:** ${idea.monetization}

## Product Summary
${idea.concept}

## Candidate Feature Set
${featuresBullets}
${customNotes}
## Deliverables Requested
1. **Core User Loop (60-Second Aha Moment):** Walk step-by-step through the exact first session from landing/opening to receiving tangible value without friction.
2. **Ruthless MVP Cut:** Split the features above into **Must-Have Day 1 (max 3 features)** vs. **Defer to v1.1**, explaining why.
3. **Data Model & Storage Schema:** Write concrete TypeScript interfaces / SQLite or Postgres tables needed for v1.
4. **Hardest Technical / UX Edge Cases:** Call out the top 3 real-world failure modes (e.g., data import messiness, permissions, cold-start empty state) and how to solve them cleanly.
5. **First 10 Users Validation Plan:** Where this exact audience hangs out and how to test willingness-to-pay in 1 week.`;
  }

  if (mode === 'ui') {
    return `Design and build a high-craft, interactive frontend prototype for **${title}** (${idea.platform}).

## Product Context
- **What it is:** ${idea.concept}
- **Who uses it:** ${idea.target_audience}
- **Why it matters:** ${idea.value_proposition}

## Key Capabilities to Showcase in the UI
${featuresBullets}
${customNotes}
## Design & Implementation Requirements
1. **Visual Direction:** Clean, tactile, domain-appropriate editorial interface—avoid generic purple AI gradients or cookie-cutter SaaS marketing fluff. Open directly into the working product workspace.
2. **Realistic Domain Data:** Pre-populate the workspace with believable, domain-accurate sample items for ${idea.target_audience} (strictly zero "Lorem ipsum" or "Test 123").
3. **Interactive Core Loop:** Make the #1 wedge workflow (${idea.key_features[0] || 'primary action'}) genuinely interactive with state updates, filtering, and feedback.
4. **Thoughtful States:** Include a helpful zero-data state, keyboard-accessible controls, and responsive layout across desktop and mobile viewports.`;
  }

  // Default: 'mvp' — Executable Coding-Agent Scaffold Prompt
  return `You are pair-programming with me to build the v1 MVP of **${title}**, a ${idea.platform.toLowerCase()} application in the ${idea.category} space.

## 1. Product Brief
- **Concept:** ${idea.concept}
- **Target User:** ${idea.target_audience}
- **Value Proposition:** ${idea.value_proposition}
- **Scope Target:** ${idea.scope || 'Lean, shippable MVP'}
- **Monetization Direction:** ${idea.monetization}

## 2. Recommended Tech Stack
- ${stack}
- Prioritize local-first speed, strict TypeScript types, clean modular components, and zero unnecessary dependencies.

## 3. Core MVP Features
${featuresBullets}
${customNotes}
## 4. Explicit Non-Goals for v1 (Keep Scope Tight!)
- Do NOT build complex multi-tenant RBAC, OAuth social login walls, or billing webhooks yet—let the user experience the core workflow immediately on launch.
- Avoid placeholder stubs: every button shown in the UI should perform real state persistence and domain logic.

## 5. Execution Plan — Start with Milestone 1
1. Propose a concise directory structure and core data schema (\`types.ts\` / storage layer) before scaffolding.
2. Scaffold the project and implement **Feature #1 (${idea.key_features[0] || 'core workflow'})** and **Feature #2 (${idea.key_features[1] || 'secondary workflow'})** end-to-end with realistic seed data and persistent local storage.
3. Verify that typechecking, unit tests, and the production build pass cleanly, then summarize how to run and test the MVP.`;
}

export function exportIdeasAsMarkdown(ideas: Idea[]): string {
  const header = `# Idea Generator Notebook
Exported: ${new Date().toLocaleString()} · Total ideas: ${ideas.length}

---

`;

  const body = ideas
    .map((idea) => {
      const star = idea.starred ? '★ ' : '';
      const title = getIdeaDisplayName(idea);
      const meta = [idea.category, idea.scope, idea.platform].filter(Boolean).join(' · ');
      const notes =
        idea.notes && idea.notes.trim()
          ? `\n**Personal Notes:** ${idea.notes.trim()}\n`
          : '';

      return `## ${star}${title}
*${meta} · ${new Date(idea.timestamp).toLocaleDateString()}*

${idea.concept}

- **Target Audience:** ${idea.target_audience}
- **Value Proposition:** ${idea.value_proposition}
- **Business Model:** ${idea.monetization}
- **Suggested Stack:** ${inferStack(idea)}

**First Features:**
${idea.key_features.map((f) => `- ${f}`).join('\n')}
${notes}`;
    })
    .join('\n---\n\n');

  return header + body;
}
