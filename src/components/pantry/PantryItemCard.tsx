"use client";

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'PRODUCE': return 'bg-green-100/80 text-green-800 border-green-200/50';
    case 'DAIRY': return 'bg-blue-100/80 text-blue-800 border-blue-200/50';
    case 'MEAT': return 'bg-rose-100/80 text-rose-800 border-rose-200/50';
    default: return 'bg-slate-100/80 text-slate-800 border-slate-200/50';
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  if (/^\d+$/.test(dateString)) {
    return new Date(parseInt(dateString, 10)).toLocaleDateString();
  }
  return new Date(dateString).toLocaleDateString();
};

interface PantryItemCardProps {
  item: any;
  colId: string;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onMove: (id: string, amount: number, targetState: string) => void;
  onUpdateState: (id: string, targetState: string) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

export function PantryItemCard({ 
  item, colId, isSelected, onToggleSelection, onMove, onUpdateState, onEdit, onDelete 
}: PantryItemCardProps) {
  
  return (
    <div 
      className={`relative flex flex-col p-4 rounded-2xl transition-all duration-300 ease-out border-2 ${
        isSelected 
          ? 'border-sky-400 bg-sky-50/60 backdrop-blur-2xl shadow-lg z-10' 
          : 'border-white/50 bg-white/40 backdrop-blur-2xl shadow-sm hover:border-white/80 hover:bg-white/50'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-3">
          {colId === 'IN_PANTRY' && (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(item.id)}
              className="mt-1 w-6 h-6 border-2 border-sky-400/70 data-[state=checked]:bg-sky-500 rounded-md transition-all cursor-pointer shadow-sm bg-white/50 backdrop-blur-md"
            />
          )}
          <div>
            <h3 className="font-bold leading-tight text-slate-800 text-lg drop-shadow-sm">{item.name}</h3>
            <p className="text-sm font-semibold text-slate-600 mt-1.5">Qty: {item.quantity}</p>
            {item.expiryDate && (
              <p className="text-[11px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Exp: {formatDate(item.expiryDate)}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${getCategoryColor(item.category)}`}>
          {item.category}
        </Badge>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/40 mt-3">
        <div className="flex gap-1">
          {colId === 'IN_PANTRY' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-700 hover:bg-amber-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, item.quantity, 'TO_BUY')} title="Return All to To Buy">
                <ChevronsLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-700 hover:bg-amber-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, 1, 'TO_BUY')} title="Return 1 to To Buy">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-700 hover:bg-sky-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, 1, 'CONSUMED')} title="Consume 1">
                <ChevronRight size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-700 hover:bg-sky-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, item.quantity, 'CONSUMED')} title="Consume All">
                <ChevronsRight size={16} />
              </Button>
            </>
          )}

          {colId === 'CONSUMED' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-700 hover:bg-amber-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, item.quantity, 'IN_PANTRY')} title="Move All back to Pantry">
                <ChevronsLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-700 hover:bg-amber-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, 1, 'IN_PANTRY')} title="Move 1 back to Pantry">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-700 hover:bg-sky-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, item.quantity, 'TO_BUY')} title="Return to To Buy list">
                <ShoppingCart size={16} />
              </Button>
            </>
          )}

          {colId === 'TO_BUY' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-700 hover:bg-sky-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, 1, 'IN_PANTRY')} title="Move 1 to Pantry">
                <ChevronRight size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-700 hover:bg-sky-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, item.quantity, 'IN_PANTRY')} title="Move All to Pantry">
                <ChevronsRight size={16} />
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-200 hover:scale-110 rounded-full transition-all" onClick={() => onEdit(item)}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-700 hover:bg-rose-100 hover:scale-110 rounded-full transition-all" onClick={() => onDelete(item.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
