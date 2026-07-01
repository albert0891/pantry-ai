"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDestructive = true,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgb(0,0,0,0.15)] !rounded-3xl">
        <DialogHeader className="gap-2">
          {isDestructive && (
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          )}
          <DialogTitle className="text-center text-xl font-bold text-slate-800">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-1/2 rounded-full border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 h-11"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            className={`w-full sm:w-1/2 rounded-full font-bold shadow-md h-11 transition-transform hover:scale-105 ${
              isDestructive 
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200" 
                : "bg-sky-500 hover:bg-sky-400 text-white shadow-sky-200"
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
