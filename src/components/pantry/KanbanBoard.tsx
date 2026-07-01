"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { PantryItemCard } from './PantryItemCard';

const COLUMNS = [
  { id: 'TO_BUY', title: '🛒 To Buy' },
  { id: 'IN_PANTRY', title: '🧊 In Pantry' },
  { id: 'CONSUMED', title: '🗑️ Consumed' }
];

interface KanbanBoardProps {
  items: any[];
  activeTab: string;
  selectedItemIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onMove: (id: string, amount: number, targetState: string) => void;
  onUpdateState: (id: string, targetState: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function KanbanBoard({
  items, activeTab, selectedItemIds, onToggleSelection, onMove, onUpdateState, onEdit, onDelete
}: KanbanBoardProps) {
  
  // Resolve the active column index for the mobile sliding animation
  let activeIndex = COLUMNS.findIndex(c => c.id === activeTab);
  if (activeIndex === -1) activeIndex = 1; // Default to IN_PANTRY if "home" or unknown

  return (
    <div className="w-full h-full pb-20 overflow-hidden md:overflow-visible">
      <div 
        className="flex flex-row h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:gap-6 md:translate-x-0"
        style={{ transform: `translateX(calc(-100% * ${activeIndex}))` }}
      >
        {COLUMNS.map(col => {
          const colItems = items.filter(item => item.boardState === col.id);

          return (
            <div 
              key={col.id} 
              className="w-full shrink-0 md:min-w-[320px] md:w-80 flex flex-col h-full"
            >
              <div className="flex-1 bg-white/40 backdrop-blur-2xl rounded-3xl p-4 flex flex-col gap-3 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-1 md:mx-0 h-full">
            <div className="flex justify-between items-center mb-3 px-2">
              <h2 className="font-bold text-slate-700 text-lg hidden md:block">{col.title}</h2>
              <Badge variant="secondary" className="ml-auto md:ml-0 bg-white/90 shadow-sm text-slate-600 font-bold border-white">
                {colItems.length} items
              </Badge>
            </div>
            
            <div className="flex flex-col gap-3 overflow-y-auto pb-4 custom-scrollbar">
              {colItems.map(item => (
                <PantryItemCard 
                  key={item.id}
                  item={item}
                  colId={col.id}
                  isSelected={selectedItemIds.has(item.id)}
                  onToggleSelection={onToggleSelection}
                  onMove={onMove}
                  onUpdateState={onUpdateState}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              
              {colItems.length === 0 && (
                <div className="text-center p-8 text-sm font-medium text-slate-400 border-2 border-dashed border-white/60 bg-white/30 rounded-xl">
                  No items found
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })}
    </div>
  </div>
  );
}
