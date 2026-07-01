"use client";

import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Custom Hooks & Components
import { usePantry } from '@/hooks/usePantry';
import { Navbar } from '@/components/pantry/Navbar';
import { MobileBottomNav } from '@/components/pantry/MobileBottomNav';
import { KanbanBoard } from '@/components/pantry/KanbanBoard';
import { ItemFormDialog } from '@/components/pantry/ItemFormDialog';
import { RecipeModals } from '@/components/pantry/RecipeModals';

export default function DashboardPage() {
  const { 
    items: rawItems, myRecipes, loading, error, 
    addItem, editItem, moveItem, deleteItem, updateItemState, 
    generateRecipe, saveRecipe, deleteRecipe
  } = usePantry();

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('IN_PANTRY'); // Controls mobile Kanban col
  const [mobileNavTab, setMobileNavTab] = useState<'home' | 'recipes' | 'add'>('home');
  
  // Swipe Handlers for Mobile Tabs
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;
  
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // AI Recipe States
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipeResult, setRecipeResult] = useState<any>(null);
  const [recipeError, setRecipeError] = useState("");
  const [isMyRecipesOpen, setIsMyRecipesOpen] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading your premium pantry...</div>;
  if (error) return <div className="p-8 text-center text-rose-500 font-medium">Error loading data: {error.message}</div>;

  // Filter items
  const items = rawItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (item: any) => {
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (data.id) {
        await editItem({ variables: data });
      } else {
        await addItem({ variables: data });
      }
    } catch (err) {
      console.error("Failed to save item", err);
    }
  };

  const handleMove = async (id: string, amount: number, targetState: string) => {
    try {
      await moveItem({ variables: { id, amount, targetState } });
      setSelectedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) { console.error("Failed to move item", err); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteItem({ variables: { id } }); } 
    catch (err) { console.error("Failed to delete item", err); }
  };

  const handleUpdateState = async (id: string, targetState: string) => {
    try { await updateItemState({ variables: { id, newState: targetState } }); } 
    catch (err) { console.error("Failed to update item state", err); }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedItemIds(newSet);
  };

  const handleGenerateRecipe = async () => {
    setIsGeneratingRecipe(true);
    setIsRecipeModalOpen(true);
    setRecipeResult(null);
    setRecipeError("");
    setSavedRecipeId(null);
    try {
      const res = await generateRecipe({
        variables: { mustUseItemIds: Array.from(selectedItemIds) }
      });
      setRecipeResult((res.data as any).generateRecipe);
    } catch (err: any) {
      setRecipeError(err.message || "Unknown error occurred.");
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleRegenerateRecipe = async () => {
    if (!recipeResult) return;
    setIsGeneratingRecipe(true);
    const previousIngredients = recipeResult.ingredients;
    setRecipeResult(null);
    setRecipeError("");
    setSavedRecipeId(null);
    try {
      const res = await generateRecipe({
        variables: { 
          mustUseItemIds: Array.from(selectedItemIds),
          previouslyUsedIngredients: previousIngredients
        }
      });
      setRecipeResult((res.data as any).generateRecipe);
    } catch (err: any) {
      setRecipeError(err.message || "Unknown error occurred.");
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
      } catch (err) { console.error("Failed to remove saved recipe", err); }
      return;
    }

    // Toggle on (save)
    try {
      const res = await saveRecipe({
        variables: {
          title: recipeResult.title,
          ingredients: recipeResult.ingredients,
          instructions: recipeResult.instructions
        }
      });
      setSavedRecipeId((res.data as any).saveRecipe.id);
    } catch (err) { console.error("Failed to save recipe", err); }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipe({ variables: { id } });
    } catch (err) { console.error("Failed to delete recipe", err); }
  };

  const columns = [
    { id: 'TO_BUY', title: '🛒 To Buy' },
    { id: 'IN_PANTRY', title: '🧊 In Pantry' },
    { id: 'CONSUMED', title: '🗑️ Consumed' }
  ];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = columns.findIndex(c => c.id === activeTab);
      if (isLeftSwipe && currentIndex < columns.length - 1) {
        setActiveTab(columns[currentIndex + 1].id);
      }
      if (isRightSwipe && currentIndex > 0) {
        setActiveTab(columns[currentIndex - 1].id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-20 overflow-hidden">
      
      {/* Fixed Dynamic Background Blobs for Glassmorphism to Blur Against */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-300/40 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-300/40 blur-[100px] pointer-events-none" />
      <div className="fixed top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-indigo-300/30 blur-[100px] pointer-events-none" />

      <Navbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenMyRecipes={() => setIsMyRecipesOpen(true)}
        onOpenAddDialog={handleOpenAddDialog}
      />

      {/* Mobile Tab Navigation for Kanban Columns */}
      <div className="flex md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        {columns.map(col => (
          <button
            key={`tab-${col.id}`}
            onClick={() => setActiveTab(col.id)}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              activeTab === col.id 
                ? 'border-sky-500 text-sky-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {col.title}
          </button>
        ))}
      </div>

      <main 
        className="flex-1 p-4 sm:p-6 overflow-x-hidden md:overflow-x-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndEvent}
      >
        <KanbanBoard 
          items={items}
          activeTab={activeTab}
          selectedItemIds={selectedItemIds}
          onToggleSelection={toggleSelection}
          onMove={handleMove}
          onUpdateState={handleUpdateState}
          onEdit={handleOpenEditDialog}
          onDelete={handleDelete}
        />
      </main>

      {/* Floating Action Bar for AI Recipe Generation */}
      {selectedItemIds.size > 0 && (
        <div className="fixed bottom-24 md:bottom-10 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-300 px-4 z-40">
          <Button 
            onClick={handleGenerateRecipe}
            size="lg"
            className="bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-[0_10px_40px_rgba(14,165,233,0.5)] rounded-full px-8 py-7 border-2 border-white/50 group backdrop-blur-md transition-all hover:scale-105"
          >
            <Wand2 className="mr-2 h-6 w-6 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="text-lg">Inspire Me ({selectedItemIds.size})</span>
          </Button>
        </div>
      )}

      <MobileBottomNav 
        activeTab={mobileNavTab}
        onGoHome={() => setMobileNavTab('home')}
        onOpenAddDialog={handleOpenAddDialog}
        onOpenMyRecipes={() => setIsMyRecipesOpen(true)}
      />

      <ItemFormDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      <RecipeModals 
        isRecipeModalOpen={isRecipeModalOpen}
        setIsRecipeModalOpen={setIsRecipeModalOpen}
        isGeneratingRecipe={isGeneratingRecipe}
        recipeResult={recipeResult}
        recipeError={recipeError}
        onSaveRecipe={handleSaveRecipe}
        onRegenerate={handleRegenerateRecipe}
        savedRecipeId={savedRecipeId}
        isMyRecipesOpen={isMyRecipesOpen}
        setIsMyRecipesOpen={setIsMyRecipesOpen}
        myRecipes={myRecipes}
        onDeleteRecipe={handleDeleteRecipe}
      />
    </div>
  );
}
