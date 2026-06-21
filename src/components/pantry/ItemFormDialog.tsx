"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({ 
      id: initialData?.id, 
      name, 
      quantity, 
      category, 
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
              <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl" placeholder="e.g. Apples" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right text-slate-700 font-semibold">Quantity</Label>
              <Input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="col-span-3 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-slate-700 font-semibold">Category</Label>
              <div className="col-span-3">
                <Select value={category} onValueChange={(val) => setCategory(val || "OTHER")}>
                  <SelectTrigger className="bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-white/80 rounded-xl shadow-lg">
                    <SelectItem value="PRODUCE">Produce</SelectItem>
                    <SelectItem value="DAIRY">Dairy</SelectItem>
                    <SelectItem value="MEAT">Meat</SelectItem>
                    <SelectItem value="PANTRY">Pantry</SelectItem>
                    <SelectItem value="FROZEN">Frozen</SelectItem>
                    <SelectItem value="BEVERAGE">Beverage</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry" className="text-right text-slate-700 font-semibold">Expiry Date</Label>
              <Input id="expiry" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="col-span-3 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl text-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-full shadow-md shadow-sky-200 px-8 transition-transform hover:scale-105">
              {initialData ? "Save Changes" : "Save to Pantry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
