'use client';

import React from 'react';
import { Flame, Sparkles, Lightbulb, Leaf } from 'lucide-react';
import { NutritionInfo } from '@/lib/ai/recipeGenerator';

interface RecipeNutritionCardProps {
  nutrition?: NutritionInfo | null;
}

interface MacroItemConfig {
  key: 'protein' | 'carbs' | 'fat' | 'fiber';
  label: string;
  unit: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const MACRO_CONFIGS: readonly MacroItemConfig[] = [
  {
    key: 'protein',
    label: 'Protein',
    unit: 'g',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200/60',
  },
  {
    key: 'carbs',
    label: 'Carbs',
    unit: 'g',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50/70',
    borderColor: 'border-amber-200/60',
  },
  {
    key: 'fat',
    label: 'Fat',
    unit: 'g',
    textColor: 'text-rose-700',
    bgColor: 'bg-rose-50/70',
    borderColor: 'border-rose-200/60',
  },
  {
    key: 'fiber',
    label: 'Fiber',
    unit: 'g',
    textColor: 'text-sky-700',
    bgColor: 'bg-sky-50/70',
    borderColor: 'border-sky-200/60',
  },
] as const;

export function RecipeNutritionCard({ nutrition }: RecipeNutritionCardProps) {
  if (!nutrition) return null;

  const validSwaps = nutrition.healthy_swaps?.filter((swap) => Boolean(swap && swap.trim())) || [];

  return (
    <div className="space-y-4 rounded-2xl bg-white/60 backdrop-blur-md border border-stone-200/80 p-5 shadow-xs">
      {/* Nutrition Header: Calorie pill & servings */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/80 text-amber-700">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-stone-800">
              {nutrition.calories}{' '}
              <span className="text-sm font-semibold text-stone-500">kcal</span>
            </span>
            <span className="text-xs text-stone-400 block font-medium">
              Per serving (serves {nutrition.servings})
            </span>
          </div>
        </div>

        {/* Dietary Tags */}
        {nutrition.dietary_tags && nutrition.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {nutrition.dietary_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
              >
                <Leaf className="h-3 w-3 text-emerald-600 shrink-0" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Macronutrients Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {MACRO_CONFIGS.map((macro) => {
          const rawValue = nutrition[macro.key];
          const displayValue = rawValue != null ? `${rawValue}${macro.unit}` : 'N/A';

          return (
            <div
              key={macro.key}
              className={`rounded-xl border p-2.5 text-center transition-all ${macro.bgColor} ${macro.borderColor}`}
            >
              <div className="text-xs font-medium text-stone-500">{macro.label}</div>
              <div className={`text-base font-bold tracking-tight ${macro.textColor}`}>
                {displayValue}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Nutritionist Insight Note */}
      <div className="rounded-xl border border-teal-200/70 bg-gradient-to-br from-teal-50/50 via-emerald-50/30 to-white/60 p-3.5 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-teal-900 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>AI Nutritionist Insight</span>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed font-normal">
          {nutrition.dietitian_tip}
        </p>

        {/* Healthy Swaps / Optimization suggestions */}
        {validSwaps.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-teal-100/80">
            <div className="flex items-center gap-1 text-xs font-semibold text-stone-600 mb-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
              <span>Healthy Swaps & Tweaks:</span>
            </div>
            <ul className="space-y-1 text-xs text-stone-600 pl-4 list-disc">
              {validSwaps.map((swap, idx) => (
                <li key={idx} className="leading-snug">
                  {swap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Professional Medical / Nutritional Disclaimer */}
      <p className="text-[10px] text-stone-400 text-center tracking-tight">
        Nutritional estimates are AI-generated for general guidance and do not replace professional
        medical or clinical advice.
      </p>
    </div>
  );
}
