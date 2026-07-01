"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Loader2 } from 'lucide-react';
import { categorizeItem } from '@/app/actions/ai';

const BOARD_STATE_LABELS: Record<string, string> = {
  TO_BUY: "🛒 To Buy",
  IN_PANTRY: "🧊 In Pantry",
  CONSUMED: "🗑️ Consumed"
};

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCE: "Produce",
  DAIRY: "Dairy",
  MEAT: "Meat",
  PANTRY: "Pantry",
  FROZEN: "Frozen",
  BEVERAGE: "Beverage",
  OTHER: "Other"
};

interface ItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export function ItemFormDialog({ isOpen, onOpenChange, onSubmit, initialData }: ItemFormDialogProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [category, setCategory] = useState(initialData?.category || "OTHER");
  const [boardState, setBoardState] = useState(initialData?.boardState || "TO_BUY");
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  
  // Format expiry date correctly for input type="date"
  let initialExpiry = "";
  if (initialData?.expiryDate) {
    const d = /^\d+$/.test(initialData.expiryDate) 
      ? new Date(parseInt(initialData.expiryDate)) 
      : new Date(initialData.expiryDate);
    initialExpiry = d.toISOString().split('T')[0];
  }
  const [expiryDate, setExpiryDate] = useState(initialExpiry);

  // Update local state when initialData changes (e.g. switching from Add to Edit)
  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setQuantity(initialData?.quantity || 1);
      setCategory(initialData?.category || "OTHER");
      setBoardState(initialData?.boardState || "TO_BUY");
      
      let exp = "";
      if (initialData?.expiryDate) {
        const d = /^\d+$/.test(initialData.expiryDate) 
          ? new Date(parseInt(initialData.expiryDate)) 
          : new Date(initialData.expiryDate);
        exp = d.toISOString().split('T')[0];
      }
      setExpiryDate(exp);
    }
  }, [isOpen, initialData]);

  const handleAutoCategorize = async () => {
    if (!name.trim()) return;
    setIsAutoCategorizing(true);
    try {
      const suggestedCategory = await categorizeItem(name);
      setCategory(suggestedCategory);
    } catch (err) {
      console.error("Failed to auto categorize", err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({ 
      id: initialData?.id, 
      name, 
      quantity, 
      category, 
      boardState,
      expiryDate 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_10px_40px_rgb(0,0,0,0.1)] !rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 drop-shadow-sm">{initialData ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-slate-700 font-semibold">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3 h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl" placeholder="e.g. Apples" required />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right text-slate-700 font-semibold">Quantity</Label>
              <Input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="col-span-3 h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boardState" className="text-right text-slate-700 font-semibold">Target</Label>
              <div className="col-span-3">
                <Select value={boardState} onValueChange={(val) => setBoardState(val || "TO_BUY")}>
                  <SelectTrigger className="w-full h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl">
                    <SelectValue placeholder="Select target board">
                      {BOARD_STATE_LABELS[boardState as keyof typeof BOARD_STATE_LABELS]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-white/80 rounded-xl shadow-lg">
                    {Object.entries(BOARD_STATE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right flex flex-col items-end gap-1.5">
                <Label htmlFor="category" className="text-slate-700 font-semibold">Category</Label>
                <button 
                  type="button" 
                  onClick={handleAutoCategorize} 
                  disabled={isAutoCategorizing || !name.trim()}
                  className="text-[10px] flex items-center justify-center w-fit gap-1 bg-sky-100 hover:bg-sky-200 text-sky-700 py-0.5 px-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-sky-200"
                >
                  {isAutoCategorizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isAutoCategorizing ? "Wait" : "Auto"}
                </button>
              </div>
              <div className="col-span-3">
                <Select value={category} onValueChange={(val) => setCategory(val || "OTHER")}>
                  <SelectTrigger className="w-full h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl">
                    <SelectValue placeholder="Select category">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-white/80 rounded-xl shadow-lg">
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry" className="text-right text-slate-700 font-semibold">Expiry Date</Label>
              <div className="col-span-3 relative">
                <Input id="expiry" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-10 block w-full bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl text-slate-700 appearance-none pr-10" />
                {expiryDate && (
                  <button type="button" onClick={() => setExpiryDate("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-full shadow-md shadow-sky-200 px-8 transition-transform hover:scale-105">
              {initialData ? "Save Changes" : "Save Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
