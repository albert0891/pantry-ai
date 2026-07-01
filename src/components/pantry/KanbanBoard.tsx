"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PantryItemCard } from './PantryItemCard';

const COLUMNS = [
  { id: 'TO_BUY', title: '🛒 To Buy' },
  { id: 'IN_PANTRY', title: '🧊 In Pantry' },
  { id: 'CONSUMED', title: '🗑️ Consumed' }
];

const CATEGORY_FILTERS = [
  { id: 'ALL', label: '🌟 All' },
  { id: 'PRODUCE', label: '🍎 Produce' },
  { id: 'DAIRY', label: '🧀 Dairy' },
  { id: 'MEAT', label: '🥩 Meat' },
  { id: 'PANTRY', label: '🥫 Pantry' },
  { id: 'FROZEN', label: '❄️ Frozen' },
  { id: 'BEVERAGE', label: '🥤 Beverage' },
  { id: 'OTHER', label: '📦 Other' }
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
  const [activeFilter, setActiveFilter] = React.useState('ALL');
  
  // Resolve the active column index for the mobile sliding animation
  let activeIndex = COLUMNS.findIndex(c => c.id === activeTab);
  if (activeIndex === -1) activeIndex = 1; // Default to IN_PANTRY if "home" or unknown

  return (
    <div className="w-full h-full flex flex-col pb-20 md:pb-0 overflow-hidden md:overflow-visible">
      {/* Mobile Filter (Select) */}
      <div className="md:hidden px-4 mb-4">
        <Select value={activeFilter} onValueChange={(val) => setActiveFilter(val || 'ALL')}>
          <SelectTrigger className="w-full h-10 bg-white/70 border-white/60 shadow-sm focus-visible:ring-sky-400 rounded-xl font-bold text-slate-700">
            <SelectValue>
              {CATEGORY_FILTERS.find(f => f.id === activeFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-xl border-white/80 rounded-xl shadow-xl">
            {CATEGORY_FILTERS.map(filter => (
              <SelectItem key={filter.id} value={filter.id} className="font-medium">
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Filters (Pills) */}
      <div className="hidden md:block flex-none overflow-x-auto custom-scrollbar mb-4 py-2 px-1">
        <div className="flex gap-2 w-max px-1">
          {CATEGORY_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap snap-center shadow-sm border ${
                activeFilter === filter.id 
                  ? 'bg-sky-500 text-white border-sky-400 scale-105' 
                  : 'bg-white/70 text-slate-600 border-white/60 hover:bg-white hover:-translate-y-0.5'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div 
          className="flex flex-row h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] translate-x-[var(--mobile-translate)] md:translate-x-0 md:gap-6"
          style={{ '--mobile-translate': `calc(-100% * ${activeIndex})` } as React.CSSProperties}
        >
          {COLUMNS.map(col => {
            const colItems = items.filter(item => 
              item.boardState === col.id && 
              (activeFilter === 'ALL' || item.category === activeFilter)
            );

            return (
              <div 
                key={col.id} 
                className="w-full shrink-0 md:min-w-[320px] md:w-80 flex flex-col h-full"
              >
              <div className="flex-1 bg-white/40 backdrop-blur-2xl rounded-3xl p-4 flex flex-col gap-3 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-1 md:mx-0 h-full">
            <div className="hidden md:flex justify-between items-center mb-3 px-2">
              <h2 className="font-bold text-slate-700 text-lg">{col.title}</h2>
              <Badge variant="secondary" className="bg-white/90 shadow-sm text-slate-600 font-bold border-white">
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
    </div>
  );
}
