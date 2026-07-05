'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2, Mic } from 'lucide-react';
import { categorizeItem, parseVoiceInput } from '@/app/actions/ai';

const BOARD_STATE_LABELS: Record<string, string> = {
  TO_BUY: '🛒 To Buy',
  IN_PANTRY: '🧊 In Pantry',
  CONSUMED: '🗑️ Consumed',
};

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCE: 'Produce',
  DAIRY: 'Dairy',
  MEAT: 'Meat',
  PANTRY: 'Pantry',
  FROZEN: 'Frozen',
  BEVERAGE: 'Beverage',
  OTHER: 'Other',
};

interface ItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export function ItemFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
}: ItemFormDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [category, setCategory] = useState(initialData?.category || 'OTHER');
  const [boardState, setBoardState] = useState(initialData?.boardState || 'TO_BUY');
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Format expiry date correctly for input type="date"
  let initialExpiry = '';
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
      setName(initialData?.name || '');
      setQuantity(initialData?.quantity || 1);
      setCategory(initialData?.category || 'OTHER');
      setBoardState(initialData?.boardState || 'TO_BUY');

      let exp = '';
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
      console.error('Failed to auto categorize', err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW'; // Defaults to Chinese (which naturally supports mixed English words)
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event: any) => {
      recognition.stop();
      setIsListening(false);
      const transcript = event.results[0][0].transcript;

      setIsParsingVoice(true);
      setErrorMsg(null);
      try {
        const result = await parseVoiceInput(transcript);
        if (result && result.success) {
          const parsed = result.data;
          if (parsed.name) setName(parsed.name);
          if (parsed.quantity) setQuantity(parsed.quantity);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.expiryDate) setExpiryDate(parsed.expiryDate);
        } else {
          // If Zod or Gemini threw an error, display it directly
          const errMsg = result && 'error' in result ? result.error : 'AI 聽不懂，請再試一次';
          console.error('Voice parse failed:', errMsg);
          setErrorMsg(errMsg);
          setTimeout(() => setErrorMsg(null), 5000);
        }
      } catch (err) {
        console.error('Parse voice failed completely:', err);
        setErrorMsg('系統發生錯誤，請稍後再試');
        setTimeout(() => setErrorMsg(null), 5000);
      } finally {
        setIsParsingVoice(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setIsParsingVoice(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
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
      expiryDate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_10px_40px_rgb(0,0,0,0.1)] !rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 drop-shadow-sm">
              {initialData ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening || isParsingVoice}
              className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl transition-all shadow-sm border font-semibold text-sm ${
                isListening
                  ? 'bg-rose-50/50 text-rose-500 border-rose-200/60 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                  : isParsingVoice
                    ? 'bg-sky-50/50 text-sky-500 border-sky-200/60'
                    : 'bg-white/40 hover:bg-white/60 text-slate-600 border-white/50 hover:border-white/80 hover:shadow-md'
              } backdrop-blur-md`}
            >
              {isParsingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
              )}
              {isListening
                ? 'Listening...'
                : isParsingVoice
                  ? 'Parsing...'
                  : 'Tap to Smart Voice Fill'}
            </button>

            {errorMsg && (
              <div className="text-sm font-medium text-rose-500 text-center animate-in fade-in slide-in-from-top-1">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-slate-700 font-semibold">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl"
                  placeholder="e.g. Apples"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right text-slate-700 font-semibold">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="col-span-3 h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boardState" className="text-right text-slate-700 font-semibold">
                Target
              </Label>
              <div className="col-span-3">
                <Select value={boardState} onValueChange={(val) => setBoardState(val || 'TO_BUY')}>
                  <SelectTrigger className="w-full h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl">
                    <SelectValue placeholder="Select target board">
                      {BOARD_STATE_LABELS[boardState as keyof typeof BOARD_STATE_LABELS]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-white/80 rounded-xl shadow-lg">
                    {Object.entries(BOARD_STATE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-slate-700 font-semibold">
                Category
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Select value={category} onValueChange={(val) => setCategory(val || 'OTHER')}>
                  <SelectTrigger className="flex-1 h-10 bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl">
                    <SelectValue placeholder="Select category">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 backdrop-blur-xl border-white/80 rounded-xl shadow-lg">
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={handleAutoCategorize}
                  disabled={isAutoCategorizing || !name.trim()}
                  className="shrink-0 text-xs flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 h-10 px-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 shadow-sm"
                  title="Auto Categorize"
                >
                  {isAutoCategorizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  )}
                  {isAutoCategorizing ? 'Wait' : 'Auto'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry" className="text-right text-slate-700 font-semibold">
                Expiry Date
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-10 block w-full bg-white/70 border-white/60 shadow-inner focus-visible:ring-sky-400 rounded-xl text-slate-700 appearance-none pr-10"
                />
                {expiryDate && (
                  <button
                    type="button"
                    onClick={() => setExpiryDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-full shadow-md shadow-sky-200 px-8 transition-transform hover:scale-105"
            >
              {initialData ? 'Save Changes' : 'Save Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
