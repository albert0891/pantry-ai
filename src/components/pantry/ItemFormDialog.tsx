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
import { CATEGORY_LIST, getCategoryDefinition } from '@/lib/constants/categories';

const BOARD_STATE_LABELS: Record<string, string> = {
  TO_BUY: '🛒 To Buy',
  IN_PANTRY: '🧊 In Pantry',
  CONSUMED: '🗑️ Consumed',
};

const FORM_LABEL_CLASS = 'text-right justify-end text-stone-700 font-semibold whitespace-nowrap';
// Fixed label column (fits 'Expiry Date') so labels never overflow on 320px phones.
const FORM_ROW_CLASS =
  'grid grid-cols-[5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3';

export interface ItemFormData {
  id?: string;
  name: string;
  quantity: number;
  category: string;
  boardState: string;
  expiryDate: string;
}

interface ItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ItemFormData) => Promise<void>;
  initialData?: Partial<ItemFormData>;
}

export function ItemFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
}: ItemFormDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [quantity, setQuantity] = useState<number | ''>(initialData?.quantity || 1);
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
  const selectedCategory = getCategoryDefinition(category);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Ensure quantity is a valid number before submitting
    const parsedQuantity = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 1;

    await onSubmit({
      id: initialData?.id,
      name,
      quantity: parsedQuantity,
      category,
      boardState,
      expiryDate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border-stone-200 shadow-2xl !rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-stone-800">
              {initialData ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening || isParsingVoice}
              className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl transition-colors shadow-sm border font-semibold text-sm ${
                isListening
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : isParsingVoice
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
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

            <div className={`${FORM_ROW_CLASS} items-center`}>
              <Label htmlFor="name" className={FORM_LABEL_CLASS}>
                Name
              </Label>
              <div className="min-w-0">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl"
                  placeholder="e.g. Apples"
                  required
                />
              </div>
            </div>

            <div className={`${FORM_ROW_CLASS} items-center`}>
              <Label htmlFor="quantity" className={FORM_LABEL_CLASS}>
                Quantity
              </Label>
              <div className="min-w-0">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val === '' ? '' : parseInt(val, 10));
                  }}
                  className="w-full h-10 bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className={`${FORM_ROW_CLASS} items-center`}>
              <Label htmlFor="boardState" className={FORM_LABEL_CLASS}>
                Target
              </Label>
              <div className="min-w-0">
                <Select value={boardState} onValueChange={(val) => setBoardState(val || 'TO_BUY')}>
                  <SelectTrigger className="w-full h-10 bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl text-stone-800">
                    <SelectValue placeholder="Select target board">
                      {BOARD_STATE_LABELS[boardState as keyof typeof BOARD_STATE_LABELS]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 rounded-xl shadow-lg">
                    {Object.entries(BOARD_STATE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-stone-700 font-medium">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={`${FORM_ROW_CLASS} items-start`}>
              <Label htmlFor="category" className={`${FORM_LABEL_CLASS} h-10`}>
                Category
              </Label>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Select value={category} onValueChange={(val) => setCategory(val || 'OTHER')}>
                    <SelectTrigger
                      id="category"
                      className="h-10 flex-1 min-w-0 bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl text-stone-800"
                    >
                      <SelectValue placeholder="Select category">
                        {`${selectedCategory.icon} ${selectedCategory.name}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-auto min-w-(--anchor-width) max-w-[min(20rem,calc(100vw-2rem))] bg-white border-stone-200 rounded-xl shadow-lg">
                      {CATEGORY_LIST.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="items-start py-2">
                          <span className="flex min-w-0 flex-col gap-0.5 whitespace-normal">
                            <span className="font-semibold text-stone-800">
                              {item.icon} {item.name}
                            </span>
                            <span className="text-xs leading-snug text-stone-500">
                              {item.tagline}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={handleAutoCategorize}
                    disabled={isAutoCategorizing || !name.trim()}
                    className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Suggest category from name (AI)"
                    aria-label="Suggest category from name"
                  >
                    {isAutoCategorizing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 px-1 text-xs leading-snug text-stone-500">
                  {selectedCategory.tagline}
                </p>
              </div>
            </div>

            <div className={`${FORM_ROW_CLASS} items-center`}>
              <Label htmlFor="expiry" className={FORM_LABEL_CLASS}>
                Expiry Date
              </Label>
              <div className="min-w-0 relative">
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={`h-10 block w-full bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl text-stone-800 appearance-none ${expiryDate ? 'pr-10' : ''}`}
                />
                {expiryDate && (
                  <button
                    type="button"
                    onClick={() => setExpiryDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-rose-500 transition-colors"
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
              className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-full shadow-sm px-8 transition-colors"
            >
              {initialData ? 'Save Changes' : 'Save Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
