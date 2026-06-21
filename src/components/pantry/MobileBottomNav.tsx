"use client";

import React from 'react';
import { Home, PlusCircle, BookOpen } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMyRecipes: () => void;
  onOpenAddDialog: () => void;
  onGoHome: () => void;
  activeTab: 'home' | 'recipes' | 'add';
}

export function MobileBottomNav({ onOpenMyRecipes, onOpenAddDialog, onGoHome, activeTab }: MobileBottomNavProps) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around items-center pb-safe pt-2 pb-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <button 
        onClick={onGoHome}
        className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'home' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Home size={24} className={activeTab === 'home' ? 'fill-sky-100' : ''} />
        <span className="text-[10px] font-semibold mt-1">Pantry</span>
      </button>

      <button 
        onClick={onOpenAddDialog}
        className="flex flex-col items-center justify-center p-3 -mt-6 bg-sky-500 rounded-full text-white shadow-lg shadow-sky-500/40 border-4 border-amber-50 active:scale-95 transition-transform"
      >
        <PlusCircle size={28} />
      </button>

      <button 
        onClick={onOpenMyRecipes}
        className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'recipes' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <BookOpen size={24} className={activeTab === 'recipes' ? 'fill-sky-100' : ''} />
        <span className="text-[10px] font-semibold mt-1">Recipes</span>
      </button>
    </div>
  );
}
