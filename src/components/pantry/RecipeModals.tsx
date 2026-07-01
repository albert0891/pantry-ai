"use client";

import React from 'react';
import { Wand2, BookOpen, Loader2, RefreshCw } from 'lucide-react';
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
  
  isMyRecipesOpen: boolean;
  setIsMyRecipesOpen: (val: boolean) => void;
  myRecipes: any[];
}

export function RecipeModals({
  isRecipeModalOpen, setIsRecipeModalOpen,
  isGeneratingRecipe, recipeResult, recipeError, onSaveRecipe, onRegenerate,
  isMyRecipesOpen, setIsMyRecipesOpen, myRecipes
}: RecipeModalsProps) {

  return (
    <>
      {/* Generated Recipe Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-start gap-2 text-sky-700 font-bold pr-14">
              <Wand2 className="text-amber-500 shrink-0 mt-1" />
              <span className="flex-1 min-w-0 break-words leading-tight">{isGeneratingRecipe ? "Generating..." : recipeResult?.title}</span>
              {!isGeneratingRecipe && recipeResult && (
                <Button variant="ghost" size="icon" onClick={onRegenerate} title="Regenerate with different ingredients" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-50 rounded-full shrink-0 -mt-0.5">
                  <RefreshCw size={18} />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRecipeModalOpen(false)} className="text-slate-500">Close</Button>
            {!isGeneratingRecipe && recipeResult && (
              <Button onClick={onSaveRecipe} className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/30 rounded-full px-6">
                💾 Save Recipe
              </Button>
            )}
          </DialogFooter>
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
                <Card key={recipe.id} className="border-sky-100 shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-md rounded-xl overflow-hidden">
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 text-sky-900">{recipe.title}</h3>
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
    </>
  );
}
