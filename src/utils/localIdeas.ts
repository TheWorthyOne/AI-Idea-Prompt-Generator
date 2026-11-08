import { IdeaResponse } from '../types';

interface IdeaProfile {
  category: string;
  name: string;
  audience: string;
  challenge: string;
  outcome: string;
  platform: string;
  monetization: string;
  features: [string, string, string, string, string];
}

const IDEA_PROFILES: IdeaProfile[] = [
  {
    category: 'Fintech',
    name: 'Rill',
    audience: 'independent workers with uneven income',
    challenge: 'plan around unpredictable paydays and scattered bills',
    outcome: 'a calmer view of what is safe to spend and save',
    platform: 'Mobile',
    monetization: 'A free personal plan with a paid tier for tax estimates and shared household budgets.',
    features: ['Income-aware spending limits', 'Upcoming bill timeline', 'Tax set-aside suggestions', 'Low-balance forecasts', 'Monthly cash-flow recap'],
  },
  {
    category: 'Healthcare',
    name: 'Carepath',
    audience: 'people coordinating ongoing care for a family member',
    challenge: 'keep appointments, care notes, and family updates in sync',
    outcome: 'one dependable handoff between everyone involved in care',
    platform: 'Mobile and Web',
    monetization: 'A free care circle with an optional family plan for expanded storage and reminders.',
    features: ['Shared care calendar', 'Visit note templates', 'Medication reminders', 'Family task handoffs', 'Exportable care summary'],
  },
  {
    category: 'E-commerce',
    name: 'Second Shelf',
    audience: 'small online shops with limited inventory',
    challenge: 'decide what to restock before cash is tied up in slow sellers',
    outcome: 'smarter small-batch buying based on real customer interest',
    platform: 'Web',
    monetization: 'A monthly subscription scaled by active products and connected sales channels.',
    features: ['Low-stock watchlist', 'Waitlist demand signals', 'Small-batch order planner', 'Product interest tracking', 'Supplier lead-time notes'],
  },
  {
    category: 'Education',
    name: 'Recall Room',
    audience: 'students preparing for cumulative exams',
    challenge: 'turn class notes into a realistic, spaced study routine',
    outcome: 'short practice sessions that focus on what is not sticking yet',
    platform: 'Web and Mobile',
    monetization: 'A free student plan with a paid version for course packs and study groups.',
    features: ['Notes-to-question cards', 'Confidence-based review queue', 'Study session planner', 'Topic progress map', 'Shared class decks'],
  },
  {
    category: 'SaaS',
    name: 'Tandem Notes',
    audience: 'small service teams juggling client conversations',
    challenge: 'remember decisions and follow-ups across scattered meetings',
    outcome: 'a lightweight record of what was decided and who owns the next step',
    platform: 'Web',
    monetization: 'A per-seat subscription with a free plan for small teams.',
    features: ['Client decision log', 'Follow-up owner tracking', 'Meeting note templates', 'Searchable project timeline', 'Weekly open-loop digest'],
  },
  {
    category: 'Entertainment',
    name: 'SceneScout',
    audience: 'friends trying to choose something to watch together',
    challenge: 'find a good pick everyone can actually access',
    outcome: 'fewer searches and more shared watch nights',
    platform: 'Mobile and Web',
    monetization: 'A free discovery app with optional premium watchlists and partner referrals.',
    features: ['Shared mood board', 'Streaming availability filters', 'Group voting', 'Spoiler-safe recommendations', 'Watch-night queue'],
  },
  {
    category: 'Social Media',
    name: 'Small Circle',
    audience: 'neighbors and local groups who want useful updates',
    challenge: 'find trustworthy local information without a noisy public feed',
    outcome: 'a more useful, close-knit place to share what is happening nearby',
    platform: 'Mobile',
    monetization: 'Optional paid group tools for local organizers and community spaces.',
    features: ['Invite-only neighborhood groups', 'Local request board', 'Event coordination', 'Helpful update digest', 'Community resource map'],
  },
  {
    category: 'Productivity',
    name: 'One Clear Thing',
    audience: 'people whose task lists grow faster than their available time',
    challenge: 'choose a meaningful next task when everything feels urgent',
    outcome: 'a realistic daily plan with room for interruptions',
    platform: 'Desktop and Mobile',
    monetization: 'A free personal planner with paid cross-device sync and team spaces.',
    features: ['Daily capacity planner', 'Task time estimates', 'Focus session timer', 'Carryover review', 'Calendar-aware suggestions'],
  },
  {
    category: 'Gaming',
    name: 'Party Finder',
    audience: 'players looking for teammates with a compatible play style',
    challenge: 'find a good group without awkward matchmaking',
    outcome: 'more welcoming sessions built around shared goals and availability',
    platform: 'Web and Mobile',
    monetization: 'Free matching with optional community and tournament tools.',
    features: ['Play-style profiles', 'Availability matching', 'Beginner-friendly tags', 'Session scheduling', 'Post-game group notes'],
  },
  {
    category: 'Travel',
    name: 'Layover Local',
    audience: 'travelers with a few free hours between connections',
    challenge: 'plan a low-stress outing that fits the time and airport distance',
    outcome: 'a useful mini-adventure with a safe return buffer',
    platform: 'Mobile',
    monetization: 'Free itineraries with optional booking referrals and offline city packs.',
    features: ['Time-aware outing plans', 'Transit time estimates', 'Return-to-gate buffer', 'Luggage-friendly places', 'Offline itinerary'],
  },
  {
    category: 'Food & Beverage',
    name: 'Pantry Loop',
    audience: 'households trying to waste less food during busy weeks',
    challenge: 'remember what is at home and use it before it goes bad',
    outcome: 'simple meals shaped around ingredients already on hand',
    platform: 'Mobile',
    monetization: 'A free pantry tool with a paid meal-planning and household sharing tier.',
    features: ['Quick pantry capture', 'Use-soon reminders', 'Leftover meal ideas', 'Shared shopping list', 'Weekly waste recap'],
  },
  {
    category: 'Real Estate',
    name: 'Open House Notes',
    audience: 'first-time home buyers comparing several properties',
    challenge: 'remember how each place felt after a packed day of viewings',
    outcome: 'clear, side-by-side comparisons grounded in personal priorities',
    platform: 'Mobile',
    monetization: 'A free buyer notebook with optional paid sharing for households and advisors.',
    features: ['Room-by-room notes', 'Photo annotations', 'Priority scorecards', 'Offer question checklist', 'Household comparison view'],
  },
  {
    category: 'Transportation',
    name: 'Parkside',
    audience: 'commuters who combine driving with public transit',
    challenge: 'find a reliable parking and transit combination for the day',
    outcome: 'a less stressful door-to-door commute plan',
    platform: 'Mobile',
    monetization: 'A free commuter planner with optional employer and parking-provider integrations.',
    features: ['Park-and-ride options', 'Departure time comparison', 'Parking availability notes', 'Transit disruption alerts', 'Saved commute plans'],
  },
  {
    category: 'Environment',
    name: 'Repair Map',
    audience: 'people who want to fix everyday items instead of replacing them',
    challenge: 'find a nearby repair option and understand what to bring',
    outcome: 'more useful things repaired, with less guesswork',
    platform: 'Web and Mobile',
    monetization: 'Free local listings with optional tools for repair shops and community groups.',
    features: ['Searchable repair directory', 'Item-specific prep guides', 'Repair event calendar', 'Community repair notes', 'Reuse impact log'],
  },
  {
    category: 'AI & Machine Learning',
    name: 'Model Ledger',
    audience: 'small teams experimenting with multiple AI tools',
    challenge: 'understand which model works best for a recurring task',
    outcome: 'a practical record of quality, speed, and cost for each workflow',
    platform: 'Web',
    monetization: 'A free evaluation workspace with paid team history and reporting.',
    features: ['Prompt version history', 'Side-by-side result review', 'Latency and cost tracking', 'Reusable evaluation sets', 'Team decision notes'],
  },
];

let counter = 0;

export function generateLocalIdeaInBrowser(category: string): IdeaResponse {
  const profiles =
    category === 'All Categories'
      ? IDEA_PROFILES
      : IDEA_PROFILES.filter((profile) => profile.category === category);

  if (profiles.length === 0) {
    throw new Error(`No built-in idea profile exists for ${category}.`);
  }

  const seed = Date.now() + counter++;
  const profile = profiles[seed % profiles.length];
  const featureOffset = Math.floor(seed / profiles.length) % profile.features.length;
  const spotlight = profile.features[featureOffset].toLowerCase();
  const key_features = profile.features.map(
    (_, index) => profile.features[(featureOffset + index) % profile.features.length]
  );

  return {
    category: profile.category,
    concept: `${profile.name} is a ${profile.platform.toLowerCase()} tool for ${profile.audience}, built around ${spotlight}. It helps them ${profile.challenge}, so they can reach ${profile.outcome}.`,
    platform: profile.platform,
    target_audience: profile.audience,
    key_features,
    monetization: profile.monetization,
    value_proposition: `${profile.name} helps ${profile.audience} reach ${profile.outcome}, with ${spotlight} at the center.`,
  };
}
