'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PantryItemCard } from './PantryItemCard';
import { useSwipe } from '@/hooks/useSwipe';

const COLUMNS = [
  { id: 'TO_BUY', title: '🛒 To Buy' },
  { id: 'IN_PANTRY', title: '🧊 In Pantry' },
  { id: 'CONSUMED', title: '🗑️ Consumed' },
];

const CATEGORY_FILTERS = [
  { id: 'ALL', label: '🌟 All' },
  { id: 'PRODUCE', label: '🍎 Produce' },
  { id: 'DAIRY', label: '🧀 Dairy' },
  { id: 'MEAT', label: '🥩 Meat' },
  { id: 'PANTRY', label: '🥫 Pantry' },
  { id: 'FROZEN', label: '❄️ Frozen' },
  { id: 'BEVERAGE', label: '🥤 Beverage' },
  { id: 'OTHER', label: '📦 Other' },
];

interface KanbanBoardProps {
  items: any[];
  selectedItemIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onMove: (id: string, amount: number, targetState: string) => void;
  onUpdateState: (id: string, targetState: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function KanbanBoard({
  items,
  selectedItemIds,
  onToggleSelection,
  onMove,
  onUpdateState,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const [activeFilter, setActiveFilter] = React.useState('ALL');
  const [activeTab, setActiveTab] = React.useState('IN_PANTRY');

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      const currentIndex = COLUMNS.findIndex((c) => c.id === activeTab);
      if (currentIndex < COLUMNS.length - 1) setActiveTab(COLUMNS[currentIndex + 1].id);
    },
    onSwipeRight: () => {
      const currentIndex = COLUMNS.findIndex((c) => c.id === activeTab);
      if (currentIndex > 0) setActiveTab(COLUMNS[currentIndex - 1].id);
    },
  });

  // Resolve the active column index for the mobile sliding animation
  let activeIndex = COLUMNS.findIndex((c) => c.id === activeTab);
  if (activeIndex === -1) activeIndex = 1;

  // Group items by column ID at the top level to prevent useMemo inside .map()
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const col of COLUMNS) {
      groups[col.id] = items.filter(
        (item) =>
          item.boardState === col.id && (activeFilter === 'ALL' || item.category === activeFilter),
      );
    }
    return groups;
  }, [items, activeFilter]);

  return (
    <div
      className="w-full h-full flex flex-col pb-20 md:pb-0 overflow-hidden md:overflow-visible relative"
      {...swipeHandlers}
    >
      {/* Mobile Tab Navigation for Kanban Columns */}
      <div className="flex md:hidden bg-stone-50 sticky -top-4 sm:-top-6 z-10 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6 mb-4">
        {COLUMNS.map((col) => {
          const colItemsCount = items.filter((item: any) => item.boardState === col.id).length;
          return (
            <button
              key={`tab-${col.id}`}
              onClick={() => setActiveTab(col.id)}
              className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                activeTab === col.id
                  ? 'border-amber-700 text-amber-700'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              {col.title} <span className="text-xs opacity-70">({colItemsCount})</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Filter (Select) */}
      <div className="md:hidden px-4 mb-4">
        <Select value={activeFilter} onValueChange={(val) => setActiveFilter(val || 'ALL')}>
          <SelectTrigger className="w-full h-10 bg-white border-stone-200 shadow-sm focus-visible:ring-amber-600 rounded-xl font-bold text-stone-700">
            <SelectValue>{CATEGORY_FILTERS.find((f) => f.id === activeFilter)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border-stone-200 rounded-xl shadow-xl">
            {CATEGORY_FILTERS.map((filter) => (
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
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap snap-center shadow-sm border ${
                activeFilter === filter.id
                  ? 'bg-amber-700 text-white border-amber-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
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
          {COLUMNS.map((col) => {
            const colItems = groupedItems[col.id] || [];

            return (
              <div
                key={col.id}
                className="w-full shrink-0 md:min-w-[320px] md:w-80 flex flex-col h-full"
              >
                <div className="flex-1 bg-[#F9F8F6] p-2 sm:p-4 flex flex-col gap-3 h-full border border-stone-200/60 rounded-3xl mx-1 md:mx-0 shadow-sm">
                  <div className="hidden md:flex justify-between items-center mb-3 px-2">
                    <h2 className="font-bold text-stone-800 text-lg">{col.title}</h2>
                    <Badge
                      variant="secondary"
                      className="bg-white shadow-sm text-stone-600 font-bold border-stone-200"
                    >
                      {colItems.length} items
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto pb-4 custom-scrollbar">
                    {colItems.map((item) => (
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
                      <div className="text-center p-8 text-sm font-medium text-stone-400 border-2 border-dashed border-stone-200 bg-stone-100 rounded-xl">
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
