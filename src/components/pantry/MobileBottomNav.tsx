'use client';

import React from 'react';
import { Home, PlusCircle, BookOpen } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMyRecipes: () => void;
  onOpenAddDialog: () => void;
  onGoHome: () => void;
  activeTab: 'home' | 'recipes' | 'add';
}

export function MobileBottomNav({
  onOpenMyRecipes,
  onOpenAddDialog,
  onGoHome,
  activeTab,
}: MobileBottomNavProps) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around items-center pb-safe pt-2 pb-2 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
      <button
        onClick={onGoHome}
        className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'home' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
      >
        <Home size={24} className={activeTab === 'home' ? 'fill-stone-200' : ''} />
        <span className="text-[10px] font-semibold mt-1">Pantry</span>
      </button>

      <button
        onClick={onOpenAddDialog}
        className="flex flex-col items-center justify-center p-3 -mt-6 bg-amber-700 rounded-full text-white shadow-md border-4 border-white active:scale-95 transition-transform"
      >
        <PlusCircle size={28} />
      </button>

      <button
        onClick={onOpenMyRecipes}
        className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'recipes' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
      >
        <BookOpen size={24} className={activeTab === 'recipes' ? 'fill-stone-200' : ''} />
        <span className="text-[10px] font-semibold mt-1">Recipes</span>
      </button>
    </div>
  );
}
