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
  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-w-full md:min-w-max pb-20">
      {COLUMNS.map(col => {
        const colItems = items.filter(item => item.boardState === col.id);
        const isVisibleOnMobile = activeTab === col.id || activeTab === 'home'; // Handle Mobile Nav 'home' state

        // On mobile, if activeTab is 'home', we might show TO_BUY by default, 
        // or we need a sub-tab. For simplicity, if we rely on a sub-tab for mobile Kanban:
        // Actually, let's just make 'home' show IN_PANTRY by default if we haven't implemented sub-tabs,
        // or we can just render the existing mobile tab logic.
        // Let's assume the parent passes the EXACT active column ID if it's mobile.
        const shouldShow = isVisibleOnMobile || (activeTab === 'home' && col.id === 'IN_PANTRY');

        return (
          <div 
            key={col.id} 
            className={`w-full md:w-80 bg-white/40 backdrop-blur-2xl rounded-3xl p-4 flex-col gap-3 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
              shouldShow ? 'flex' : 'hidden md:flex'
            }`}
          >
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
        );
      })}
    </div>
  );
}
