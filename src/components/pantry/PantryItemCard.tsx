"use client";

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Edit, Trash2, ShoppingCart, MoreHorizontal } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

const getExpiryStatus = (dateString: string) => {
  if (!dateString) return 'OK';
  const expiry = /^\d+$/.test(dateString) ? new Date(parseInt(dateString, 10)) : new Date(dateString);
  const now = new Date();
  
  // Set both to midnight to compare just dates
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'EXPIRED'; // Passed
  if (diffDays === 0) return 'TODAY'; // Expires today
  if (diffDays <= 3) return 'SOON';   // Expires in 1-3 days
  return 'OK';
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

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function PantryItemCard({ 
  item, colId, isSelected, onToggleSelection, onMove, onUpdateState, onEdit, onDelete 
}: PantryItemCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const expiryStatus = (item.expiryDate && colId === 'IN_PANTRY') ? getExpiryStatus(item.expiryDate) : 'OK';
  
  let borderStyle = 'border-white/50 hover:border-white/80';
  let bgStyle = 'bg-white/40 hover:bg-white/50';

  if (isSelected) {
    borderStyle = 'border-sky-400';
    bgStyle = 'bg-sky-50/60';
  } else if (expiryStatus === 'EXPIRED' || expiryStatus === 'TODAY') {
    borderStyle = 'border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
    bgStyle = 'bg-rose-50/40 hover:bg-rose-50/60';
  } else if (expiryStatus === 'SOON') {
    borderStyle = 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]';
    bgStyle = 'bg-amber-50/40 hover:bg-amber-50/60';
  }

  return (
    <div 
      className={`relative flex flex-col p-4 rounded-2xl transition-all duration-300 ease-out border-2 backdrop-blur-2xl ${
        isSelected ? 'shadow-lg z-10' : 'shadow-sm'
      } ${borderStyle} ${bgStyle}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-3">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item.id)}
            className="mt-1 w-6 h-6 border-2 border-sky-400/70 data-[state=checked]:bg-sky-500 rounded-md transition-all cursor-pointer shadow-sm bg-white/50 backdrop-blur-md"
          />
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
            </>
          )}

          {colId === 'TO_BUY' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-700 hover:bg-sky-100 hover:scale-110 rounded-full transition-all" onClick={() => onMove(item.id, item.quantity, 'IN_PANTRY')} title="Move All to Pantry">
                <ChevronsRight size={16} />
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-200 hover:scale-110 rounded-full transition-all outline-none">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl border-white/80 shadow-xl rounded-xl p-1.5">
              
              {colId === 'IN_PANTRY' && (
                <>
                  <DropdownMenuItem onClick={() => onMove(item.id, 1, 'TO_BUY')} className="cursor-pointer font-medium text-slate-600 rounded-md">
                    <ChevronLeft className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Return 1 to Buy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(item.id, 1, 'CONSUMED')} className="cursor-pointer font-medium text-slate-600 rounded-md">
                    <ChevronRight className="mr-2 h-4 w-4 text-sky-500" />
                    <span>Consume 1</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200/50 my-1" />
                </>
              )}
              
              {colId === 'CONSUMED' && (
                <>
                  <DropdownMenuItem onClick={() => onMove(item.id, 1, 'IN_PANTRY')} className="cursor-pointer font-medium text-slate-600 rounded-md">
                    <ChevronLeft className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Move 1 back to Pantry</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(item.id, item.quantity, 'TO_BUY')} className="cursor-pointer font-medium text-slate-600 rounded-md">
                    <ShoppingCart className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Move to To Buy</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200/50 my-1" />
                </>
              )}
              
              {colId === 'TO_BUY' && (
                <>
                  <DropdownMenuItem onClick={() => onMove(item.id, 1, 'IN_PANTRY')} className="cursor-pointer font-medium text-slate-600 rounded-md">
                    <ChevronRight className="mr-2 h-4 w-4 text-sky-500" />
                    <span>Move 1 to Pantry</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200/50 my-1" />
                </>
              )}

              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer font-medium text-slate-600 rounded-md">
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Item</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 rounded-md">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Item</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Delete ${item.name}?`}
        description="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={() => onDelete(item.id)}
      />
    </div>
  );
}
