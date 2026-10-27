import { VerdictStatus } from '../design-system/colors';

export type AppLanguage = 'en' | 'hi';

export const SUPPORTED_LANGUAGES: Array<{ code: AppLanguage; label: string; sub: string }> = [
  { code: 'en', label: 'English', sub: 'English (UK/US)' },
  { code: 'hi', label: 'हिंदी', sub: 'Hindi — V1 supported' },
];

interface VerdictStrings {
  label: string;
  description: string;
  badge: string;
}

export const STRINGS: Record<AppLanguage, { verdicts: Record<VerdictStatus, VerdictStrings> }> = {
  en: {
    verdicts: {
      vegetarian: {
        label: 'Vegetarian',
        description: 'No identified animal-derived ingredient',
        badge: 'Verified Veg',
      },
      nonVegetarian: {
        label: 'Non-Vegetarian',
        description: 'Evidence indicates animal-derived ingredient',
        badge: 'Animal Derived',
      },
      sourceDependent: {
        label: 'Source Dependent',
        description: 'Ingredient can have plant or animal origins',
        badge: 'Origin Ambiguous',
      },
      sourceUndisclosed: {
        label: 'Source Undisclosed',
        description: 'Relevant source information is not disclosed by manufacturer',
        badge: 'Known ≠ Assumed',
      },
      unknown: {
        label: 'Unknown',
        description: 'Insufficient evidence to determine source origin',
        badge: 'Data Incomplete',
      },
    },
  },
  hi: {
    verdicts: {
      vegetarian: {
        label: 'शाकाहारी',
        description: 'पशु-व्युत्पन्न घटक की पहचान नहीं हुई',
        badge: 'शाकाहारी सत्यापित',
      },
      nonVegetarian: {
        label: 'मांसाहारी',
        description: 'साक्ष्य पशु-व्युत्पन्न घटक दर्शाते हैं',
        badge: 'पशु व्युत्पन्न',
      },
      sourceDependent: {
        label: 'स्रोत-निर्भर',
        description: 'घटक वनस्पति या पशु मूल का हो सकता है',
        badge: 'मूल अस्पष्ट',
      },
      sourceUndisclosed: {
        label: 'स्रोत अज्ञात',
        description: 'निर्माता ने स्रोत की जानकारी उपलब्ध नहीं कराई है',
        badge: 'ज्ञात ≠ अनुमानित',
      },
      unknown: {
        label: 'अज्ञात',
        description: 'स्रोत निर्धारित करने हेतु पर्याप्त साक्ष्य नहीं',
        badge: 'जानकारी अपूर्ण',
      },
    },
  },
};

export function getVerdictStrings(language: AppLanguage): Record<VerdictStatus, VerdictStrings> {
  return (STRINGS[language] || STRINGS.en).verdicts;
}
