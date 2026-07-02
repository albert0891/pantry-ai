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
import { AIRecipeManager } from '@/components/pantry/AIRecipeManager';

export default function DashboardPage() {
  const { 
    items: rawItems, loading, error, 
    addItem, editItem, moveItem, deleteItem, updateItemState
  } = usePantry();

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavTab, setMobileNavTab] = useState<'home' | 'recipes' | 'add'>('home');
  
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // AI Recipe States
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isMyRecipesOpen, setIsMyRecipesOpen] = useState(false);

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

      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden md:overflow-x-auto">
        <KanbanBoard 
          items={items}
          selectedItemIds={selectedItemIds}
          onToggleSelection={toggleSelection}
          onMove={handleMove}
          onUpdateState={handleUpdateState}
          onEdit={handleOpenEditDialog}
          onDelete={handleDelete}
        />
      </main>



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

      <AIRecipeManager 
        selectedItemIds={selectedItemIds}
        isMyRecipesOpen={isMyRecipesOpen}
        setIsMyRecipesOpen={setIsMyRecipesOpen}
      />
    </div>
  );
}
