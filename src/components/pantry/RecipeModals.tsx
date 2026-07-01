"use client";

import React from 'react';
import { Wand2, BookOpen, Loader2, RefreshCw, X, Heart, Trash2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RecipeModalsProps {
  isRecipeModalOpen: boolean;
  setIsRecipeModalOpen: (val: boolean) => void;
  isGeneratingRecipe: boolean;
  recipeResult: any;
  recipeError: string;
  onSaveRecipe: () => void;
  onRegenerate: () => void;
  savedRecipeId: string | null;
  
  isMyRecipesOpen: boolean;
  setIsMyRecipesOpen: (val: boolean) => void;
  myRecipes: any[];
  onDeleteRecipe?: (id: string) => void;
}

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RecipeModals({
  isRecipeModalOpen, setIsRecipeModalOpen,
  isGeneratingRecipe, recipeResult, recipeError, onSaveRecipe, onRegenerate, savedRecipeId,
  isMyRecipesOpen, setIsMyRecipesOpen, myRecipes, onDeleteRecipe
}: RecipeModalsProps) {
  const [recipeToDelete, setRecipeToDelete] = React.useState<any | null>(null);

  return (
    <>
      {/* Generated Recipe Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl border-white shadow-2xl rounded-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-2xl flex items-start gap-2 text-sky-700 font-bold pr-14">
              <Wand2 className="text-amber-500 shrink-0 mt-1" />
              <span className="flex-1 min-w-0 break-words leading-tight">{isGeneratingRecipe ? "Generating..." : recipeResult?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-2 flex-1 overflow-y-auto pr-4 -mr-4 custom-scrollbar pb-24 relative">
            {isGeneratingRecipe ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
                <p className="font-medium animate-pulse">Crafting the perfect recipe...</p>
              </div>
            ) : recipeResult ? (
              <div className="space-y-6">
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 border-b border-amber-200 pb-2">🛒 Ingredients</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
                    {recipeResult.ingredients.map((ing: string, idx: number) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 border-b border-sky-200 pb-2">👨‍🍳 Instructions</h3>
                  <ol className="list-decimal pl-5 space-y-3 text-slate-700 leading-relaxed">
                    {recipeResult.instructions.map((step: string, idx: number) => (
                      <li key={idx} className="pl-1">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-rose-600 bg-rose-50 border border-rose-200 p-4 rounded-lg font-mono text-sm break-words">
                Generation failed:<br/><br/>
                {recipeError}
              </div>
            )}
          </div>

          {/* Responsive Floating Pill Action Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-sky-900/20 rounded-full p-2 z-50 transition-all">
            <Button variant="ghost" onClick={() => setIsRecipeModalOpen(false)} className="h-12 w-12 rounded-full text-slate-300 hover:bg-white/20 hover:text-white p-0 shrink-0 transition-colors" title="Close">
              <X size={24} />
            </Button>
            
            {isGeneratingRecipe ? (
              <>
                <div className="w-px h-8 bg-white/20 mx-1"></div>
                <Button disabled className="h-12 bg-sky-500/10 text-sky-200/50 border border-sky-400/10 rounded-full font-bold px-4 sm:px-6 transition-all shrink-0 sm:shrink">
                  <Loader2 size={20} className="sm:mr-2 animate-spin shrink-0" />
                  <span className="hidden sm:inline">Generating...</span>
                </Button>
              </>
            ) : recipeResult ? (
              <>
                <div className="w-px h-8 bg-white/20 mx-1"></div>
                <Button onClick={onRegenerate} className="h-12 bg-sky-500/20 hover:bg-sky-500/40 text-sky-100 border border-sky-400/30 rounded-full font-bold px-4 sm:px-6 transition-all group shrink-0 sm:shrink">
                  <RefreshCw size={20} className="sm:mr-2 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>
                <Button 
                  onClick={onSaveRecipe} 
                  className={`h-12 rounded-full font-bold px-4 sm:px-8 transition-all group shrink-0 sm:shrink ${
                    savedRecipeId 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/50'
                  }`}
                >
                  {savedRecipeId ? (
                    <>
                      <Check size={20} className="sm:mr-2 shrink-0 drop-shadow-md" />
                      <span className="hidden sm:inline text-base drop-shadow-sm">Saved!</span>
                    </>
                  ) : (
                    <>
                      <Heart size={20} className="sm:mr-2 group-hover:scale-110 transition-transform duration-300 shrink-0 drop-shadow-md" />
                      <span className="hidden sm:inline text-base drop-shadow-sm">Save Recipe</span>
                    </>
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* My Recipes Modal */}
      <Dialog open={isMyRecipesOpen} onOpenChange={setIsMyRecipesOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col bg-slate-50/95 backdrop-blur-xl border-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-sky-700 font-bold">
              <BookOpen className="text-sky-500" />
              My Recipes
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
            {myRecipes.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <BookOpen className="w-12 h-12 text-slate-300" />
                </div>
                <p className="font-bold text-lg text-slate-500">No recipes saved yet!</p>
                <p className="text-sm mt-1">Select ingredients and ask AI to generate one.</p>
              </div>
            ) : (
              myRecipes.map((recipe: any) => (
                <Card key={recipe.id} className="border-sky-100 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-md rounded-xl overflow-hidden relative group">
                  {onDeleteRecipe && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-8 w-8 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => setRecipeToDelete(recipe)}
                      title="Delete recipe"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                  <CardContent className="p-5 pt-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 text-sky-900 pr-8">{recipe.title}</h3>
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="sm:col-span-1 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        <h4 className="font-bold text-sm text-amber-800 mb-2">Ingredients</h4>
                        <ul className="text-sm space-y-1.5 text-slate-700">
                          {recipe.ingredients.map((ing: string, i: number) => <li key={i}>• {ing}</li>)}
                        </ul>
                      </div>
                      <div className="sm:col-span-2">
                        <h4 className="font-bold text-sm text-sky-800 mb-2">Instructions</h4>
                        <ol className="text-sm space-y-2.5 text-slate-700 list-decimal pl-4">
                          {recipe.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!recipeToDelete}
        onOpenChange={(open) => !open && setRecipeToDelete(null)}
        title="Delete Recipe?"
        description={
          <span>
            Are you sure you want to delete <strong>{recipeToDelete?.title}</strong>? This action cannot be undone.
          </span>
        }
        onConfirm={() => {
          if (recipeToDelete && onDeleteRecipe) {
            onDeleteRecipe(recipeToDelete.id);
          }
        }}
      />
    </>
  );
}
