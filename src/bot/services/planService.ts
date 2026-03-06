/**
 * Plan Service
 * Handles study plan information from plan.json
 */

import planData from "@/data/plans.json" assert { type: "json" };

export interface LocalizedName {
  ar: string;
  en: string;
}

export interface Plan {
  name: LocalizedName;
  file_id_ar: string;
  file_id_en: string;
}

export interface PlansData {
  plan: Plan[];
}

/**
 * Get all plans data
 */
export function getPlansData(): PlansData {
  return planData;
}

/**
 * Get all plan names for a specific language
 */
export function getPlanNames(userLang: "ar" | "en" = "ar"): string[] {
  return planData.plan.map(p => p.name[userLang]);
}

/**
 * Get plan by name (supports both Arabic and English)
 */
export function getPlanByNames(name: string): Plan | undefined {
  return planData.plan.find(p =>
    p.name.ar === name || p.name.en === name
  );
}

/**
 * Get plan by localized name
 */
export function getPlanByLocalizedName(name: string, userLang: "ar" | "en"): Plan | undefined {
  return planData.plan.find(p => p.name[userLang] === name);
}

/**
 * Get file ID for a plan based on language
 */
export function getPlanFileId(planName: string, userLang: "ar" | "en"): string | undefined {
  const plan = getPlanByNames(planName);
  if (!plan) return undefined;
  
  return userLang === "ar" ? plan.file_id_ar : plan.file_id_en;
}

/**
 * Check if a text is a plan name (supports both Arabic and English)
 */
export function isPlanName(text: string): boolean {
  return planData.plan.some(plan =>
    plan.name.ar === text || plan.name.en === text
  );
}
