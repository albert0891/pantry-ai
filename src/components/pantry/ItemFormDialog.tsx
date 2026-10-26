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
import { CATEGORY_DEFINITIONS, CATEGORY_LIST } from '@/lib/constants/categories';
import { CategoryGuidePopover } from './CategoryGuidePopover';

const BOARD_STATE_LABELS: Record<string, string> = {
  TO_BUY: '🛒 To Buy',
  IN_PANTRY: '🧊 In Pantry',
  CONSUMED: '🗑️ Consumed',
};

const FORM_LABEL_CLASS =
  'text-left justify-start text-stone-700 font-semibold sm:text-right sm:justify-end';

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
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-[425px] bg-white border-stone-200 shadow-2xl !rounded-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-stone-800">
              {initialData ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:gap-5 sm:py-6">
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

            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="name" className={FORM_LABEL_CLASS}>
                Name
              </Label>
              <div className="sm:col-span-3">
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

            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="quantity" className={FORM_LABEL_CLASS}>
                Quantity
              </Label>
              <div className="sm:col-span-3">
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

            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="boardState" className={FORM_LABEL_CLASS}>
                Target
              </Label>
              <div className="sm:col-span-3">
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

            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="category" className={FORM_LABEL_CLASS}>
                Category
              </Label>
              <div className="flex min-w-0 items-center gap-2 sm:col-span-3">
                <Select value={category} onValueChange={(val) => setCategory(val || 'OTHER')}>
                  <SelectTrigger className="flex-1 h-10 bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl text-stone-800">
                    <SelectValue placeholder="Select category">
                      {CATEGORY_DEFINITIONS[category]
                        ? `${CATEGORY_DEFINITIONS[category].icon} ${CATEGORY_DEFINITIONS[category].name}`
                        : 'Select category'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 rounded-xl shadow-lg max-h-72">
                    {CATEGORY_LIST.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        className="text-stone-700 font-medium py-1.5"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                          </span>
                          <span className="text-[11px] text-stone-400 font-normal truncate max-w-[130px]">
                            {item.examples.slice(0, 3).join(', ')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CategoryGuidePopover
                  selectedCategory={category}
                  onSelectCategory={(selected) => setCategory(selected)}
                />
                <button
                  type="button"
                  onClick={handleAutoCategorize}
                  disabled={isAutoCategorizing || !name.trim()}
                  className="shrink-0 text-xs flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 h-10 px-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-stone-200 shadow-sm"
                  title="Auto Categorize with AI"
                >
                  {isAutoCategorizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  )}
                  {isAutoCategorizing ? 'Wait' : 'Auto'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="expiry" className={FORM_LABEL_CLASS}>
                Expiry Date
              </Label>
              <div className="relative sm:col-span-3">
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-10 block w-full bg-white border-stone-200 shadow-sm focus-visible:ring-amber-400 rounded-xl text-stone-800 appearance-none pr-10"
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
