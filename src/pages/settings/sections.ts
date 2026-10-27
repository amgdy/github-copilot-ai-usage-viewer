import { BookOpen, Cpu, HardDrive, Palette, SlidersHorizontal, Users, Wallet, type LucideIcon } from 'lucide-react';
import { msg } from '../../i18n';

export interface SectionDef {
  id: string;
  /** Short name for the in-page navigation. English; show it with t(). */
  label: string;
  /** Heading of the section. English; show it with t(). */
  title: string;
  Icon: LucideIcon;
}

/** In the order a manager works through them: money first, then who has a license, then how users are grouped. */
export const SECTIONS = [
  { id: 'budget', label: msg('Budget'), title: msg('Budget'), Icon: Wallet },
  { id: 'roster', label: msg('License list'), title: msg('License list and extra seats'), Icon: Users },
  { id: 'thresholds', label: msg('Classification'), title: msg('Classification thresholds'), Icon: SlidersHorizontal },
  { id: 'models', label: msg('Model prices'), title: msg('Model pricing and tiers'), Icon: Cpu },
  { id: 'data', label: msg('Data on this device'), title: msg('Data on this device'), Icon: HardDrive },
  { id: 'appearance', label: msg('Appearance'), title: msg('Appearance'), Icon: Palette },
  { id: 'glossary', label: msg('Glossary'), title: msg('How the numbers are defined'), Icon: BookOpen },
] as const satisfies readonly SectionDef[];

export type SectionId = (typeof SECTIONS)[number]['id'];

export const SECTION_IDS: readonly SectionId[] = SECTIONS.map((section) => section.id);

export const domId = (id: SectionId): string => `settings-${id}`;
