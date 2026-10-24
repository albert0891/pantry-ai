'use client';

import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from '@/components/ui/popover';
import { HelpCircle, X, Check } from 'lucide-react';
import { CATEGORY_LIST } from '@/lib/constants/categories';

interface CategoryGuidePopoverProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryGuidePopover({
  selectedCategory,
  onSelectCategory,
}: CategoryGuidePopoverProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (categoryId: string) => {
    onSelectCategory(categoryId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        title="Category guide & examples"
        aria-label="Category guide and examples"
      >
        <HelpCircle className="w-4 h-4 text-stone-500 hover:text-amber-600 transition-colors" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-[330px] sm:w-[380px] max-h-[430px] overflow-hidden flex flex-col p-0 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur-md shadow-2xl z-[100]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/80">
          <div>
            <h4 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <span>Category Guide</span>
            </h4>
            <p className="text-[11px] text-stone-500">
              Click any category below to select it directly
            </p>
          </div>
          <PopoverClose
            type="button"
            className="rounded-lg p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
            aria-label="Close category guide"
          >
            <X className="w-4 h-4" />
          </PopoverClose>
        </div>

        {/* Scrollable category list */}
        <div className="overflow-y-auto p-3 space-y-2 flex-1 divide-y divide-stone-50">
          {CATEGORY_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 group cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50/60 shadow-xs ring-1 ring-amber-400/40'
                    : 'border-stone-100 hover:border-amber-200 hover:bg-stone-50/80'
                }`}
              >
                {/* Title & Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{cat.icon}</span>
                    <span className="text-sm font-semibold text-stone-800 group-hover:text-amber-800 transition-colors">
                      {cat.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Selected
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 leading-relaxed font-normal">{cat.tagline}</p>

                {/* Example Pills */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {cat.examples.slice(0, 5).map((example) => (
                    <span
                      key={example}
                      className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded-md font-medium"
                    >
                      {example}
                    </span>
                  ))}
                  {cat.examples.length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-stone-400 font-medium">
                      +{cat.examples.length - 5} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
