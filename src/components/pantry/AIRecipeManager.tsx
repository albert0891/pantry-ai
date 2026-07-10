'use client';

import React, { useState } from 'react';
import { Wand2, BookOpen, Loader2, RefreshCw, X, Heart, Trash2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePantry } from '@/hooks/usePantry';

interface AIRecipeManagerProps {
  selectedItemIds: Set<string>;
  isMyRecipesOpen: boolean;
  setIsMyRecipesOpen: (val: boolean) => void;
}

export function AIRecipeManager({
  selectedItemIds,
  isMyRecipesOpen,
  setIsMyRecipesOpen,
}: AIRecipeManagerProps) {
  const { myRecipes, generateRecipe, saveRecipe, deleteRecipe } = usePantry();

  // Internal AI Generation States
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipeResult, setRecipeResult] = useState<any>(null);
  const [recipeError, setRecipeError] = useState('');
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<any | null>(null);

  const handleGenerateRecipe = async () => {
    setIsGeneratingRecipe(true);
    setIsRecipeModalOpen(true);
    setRecipeResult(null);
    setRecipeError('');
    setSavedRecipeId(null);
    try {
      const res = await generateRecipe({
        variables: { mustUseItemIds: Array.from(selectedItemIds) },
      });
      setRecipeResult((res.data as any).generateRecipe);
    } catch (err: any) {
      setRecipeError(err.message || 'Unknown error occurred.');
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleRegenerateRecipe = async () => {
    if (!recipeResult) return;
    setIsGeneratingRecipe(true);
    const previousIngredients = recipeResult.ingredients;
    setRecipeResult(null);
    setRecipeError('');
    setSavedRecipeId(null);
    try {
      const res = await generateRecipe({
        variables: {
          mustUseItemIds: Array.from(selectedItemIds),
          previouslyUsedIngredients: previousIngredients,
        },
      });
      setRecipeResult((res.data as any).generateRecipe);
    } catch (err: any) {
      setRecipeError(err.message || 'Unknown error occurred.');
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipeResult) return;

    if (savedRecipeId) {
      // Toggle off (delete)
      try {
        await deleteRecipe({ variables: { id: savedRecipeId } });
        setSavedRecipeId(null);
      } catch (err) {
        console.error('Failed to remove saved recipe', err);
      }
      return;
    }

    // Toggle on (save)
    try {
      const res = await saveRecipe({
        variables: {
          title: recipeResult.title,
          ingredients: recipeResult.ingredients,
          instructions: recipeResult.instructions,
        },
      });
      setSavedRecipeId((res.data as any).saveRecipe.id);
    } catch (err) {
      console.error('Failed to save recipe', err);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipe({ variables: { id } });
    } catch (err) {
      console.error('Failed to delete recipe', err);
    }
  };

  return (
    <>
      {/* Floating Action Bar for AI Recipe Generation */}
      {selectedItemIds.size > 0 && (
        <div className="fixed bottom-24 md:bottom-10 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-300 px-4 z-40">
          <Button
            onClick={handleGenerateRecipe}
            size="lg"
            className="bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-lg rounded-full px-8 py-7 border border-amber-800 group transition-colors"
          >
            <Wand2 className="mr-2 h-6 w-6 text-amber-300" />
            <span className="text-lg">Inspire Me ({selectedItemIds.size})</span>
          </Button>
        </div>
      )}

      {/* Generated Recipe Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden bg-white shadow-2xl rounded-2xl border border-stone-200">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-2xl flex items-start gap-2 text-stone-800 font-bold pr-14">
              <Wand2 className="text-amber-600 shrink-0 mt-1" />
              <span className="flex-1 min-w-0 break-words leading-tight">
                {isGeneratingRecipe ? 'Generating...' : recipeResult?.title}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 px-2 sm:px-4 flex-1 overflow-y-auto custom-scrollbar pb-24 relative">
            {isGeneratingRecipe ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-stone-500">
                <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                <p className="font-medium animate-pulse">Crafting the perfect recipe...</p>
              </div>
            ) : recipeResult ? (
              <div className="space-y-6">
                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                  <h3 className="text-lg font-bold text-stone-800 mb-3 border-b border-stone-200 pb-2">
                    🛒 Ingredients
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-700 font-medium">
                    {recipeResult.ingredients.map((ing: string, idx: number) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                  <h3 className="text-lg font-bold text-stone-800 mb-3 border-b border-stone-200 pb-2">
                    👨‍🍳 Instructions
                  </h3>
                  <ol className="list-decimal pl-5 space-y-3 text-stone-700 leading-relaxed">
                    {recipeResult.instructions.map((step: string, idx: number) => (
                      <li key={idx} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-rose-600 bg-rose-50 border border-rose-200 p-4 rounded-lg font-mono text-sm break-words">
                Generation failed:
                <br />
                <br />
                {recipeError}
              </div>
            )}
          </div>

          {/* Responsive Floating Pill Action Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 bg-white border border-stone-200 shadow-xl rounded-full p-2 z-50 transition-all">
            <Button
              variant="ghost"
              onClick={() => setIsRecipeModalOpen(false)}
              className="h-12 w-12 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-800 p-0 shrink-0 transition-colors"
              title="Close"
            >
              <X size={24} />
            </Button>

            {isGeneratingRecipe ? (
              <>
                <div className="w-px h-8 bg-stone-200 mx-1"></div>
                <Button
                  disabled
                  className="h-12 bg-stone-50 text-stone-400 border border-stone-200 rounded-full font-bold px-4 sm:px-6 transition-all shrink-0 sm:shrink"
                >
                  <Loader2 size={20} className="sm:mr-2 animate-spin shrink-0" />
                  <span className="hidden sm:inline">Generating...</span>
                </Button>
              </>
            ) : recipeResult ? (
              <>
                <div className="w-px h-8 bg-stone-200 mx-1"></div>
                <Button
                  onClick={handleRegenerateRecipe}
                  className="h-12 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-full font-bold px-4 sm:px-6 transition-colors shrink-0 sm:shrink"
                >
                  <RefreshCw size={20} className="sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>
                <Button
                  onClick={handleSaveRecipe}
                  className={`h-12 rounded-full font-bold px-4 sm:px-8 transition-colors shrink-0 sm:shrink ${
                    savedRecipeId
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-700'
                      : 'bg-amber-700 hover:bg-amber-800 text-white shadow-sm border border-amber-800'
                  }`}
                >
                  {savedRecipeId ? (
                    <>
                      <Check size={20} className="sm:mr-2 shrink-0" />
                      <span className="hidden sm:inline text-base">Saved!</span>
                    </>
                  ) : (
                    <>
                      <Heart size={20} className="sm:mr-2 shrink-0" />
                      <span className="hidden sm:inline text-base">Save Recipe</span>
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
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col bg-white border border-stone-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-stone-800 font-bold">
              <BookOpen className="text-amber-600" />
              My Recipes
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6 space-y-5">
            {myRecipes.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <div className="bg-stone-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-200">
                  <BookOpen className="w-12 h-12 text-stone-300" />
                </div>
                <p className="font-bold text-lg text-stone-500">No recipes saved yet!</p>
                <p className="text-sm mt-1">Select ingredients and ask AI to generate one.</p>
              </div>
            ) : (
              myRecipes.map((recipe: any) => (
                <Card
                  key={recipe.id}
                  className="border-stone-200 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden relative group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 text-stone-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={() => setRecipeToDelete(recipe)}
                    title="Delete recipe"
                  >
                    <Trash2 size={16} />
                  </Button>
                  <CardContent className="p-5 pt-6">
                    <h3 className="text-xl font-bold text-stone-800 mb-4 pr-8">{recipe.title}</h3>
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="sm:col-span-1 bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <h4 className="font-bold text-sm text-stone-800 mb-3 border-b border-stone-200 pb-1">
                          Ingredients
                        </h4>
                        <ul className="text-sm space-y-1.5 text-stone-600">
                          {recipe.ingredients.map((ing: string, i: number) => (
                            <li key={i}>• {ing}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="sm:col-span-2 bg-stone-50 p-4 rounded-xl border border-stone-100">
                        <h4 className="font-bold text-sm text-stone-800 mb-3 border-b border-stone-200 pb-1">
                          Instructions
                        </h4>
                        <ol className="text-sm space-y-2.5 text-stone-600 list-decimal pl-4">
                          {recipe.instructions.map((inst: string, i: number) => (
                            <li key={i}>{inst}</li>
                          ))}
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
            Are you sure you want to delete <strong>{recipeToDelete?.title}</strong>? This action
            cannot be undone.
          </span>
        }
        onConfirm={() => {
          if (recipeToDelete) {
            handleDeleteRecipe(recipeToDelete.id);
          }
        }}
      />
    </>
  );
}
