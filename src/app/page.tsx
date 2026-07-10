'use client';

import React, { useState, useCallback } from 'react';

// Custom Hooks & Components
import { usePantry } from '@/hooks/usePantry';
import { Navbar } from '@/components/pantry/Navbar';
import { MobileBottomNav } from '@/components/pantry/MobileBottomNav';
import { KanbanBoard } from '@/components/pantry/KanbanBoard';
import { ItemFormDialog } from '@/components/pantry/ItemFormDialog';
import { AIRecipeManager } from '@/components/pantry/AIRecipeManager';

export default function DashboardPage() {
  const {
    items: rawItems,
    loading,
    error,
    addItem,
    editItem,
    moveItem,
    deleteItem,
    updateItemState,
  } = usePantry();

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavTab, setMobileNavTab] = useState<'home' | 'recipes' | 'add'>('home');

  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // AI Recipe States
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isMyRecipesOpen, setIsMyRecipesOpen] = useState(false);

  // Filter items
  const items = rawItems.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handlers
  const handleOpenAddDialog = useCallback(() => {
    setEditingItem(null);
    setIsAddDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((item: any) => {
    setEditingItem(item);
    setIsAddDialogOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: any) => {
      try {
        if (data.id) {
          await editItem({ variables: data });
        } else {
          await addItem({ variables: data });
        }
      } catch (err) {
        console.error('Failed to save item', err);
      }
    },
    [editItem, addItem],
  );

  const handleMove = useCallback(
    async (id: string, amount: number, targetState: string) => {
      try {
        await moveItem({ variables: { id, amount, targetState } });
        // Note: Deliberately removed setSelectedItemIds(prev => prev.delete(id)) here
        // so users can check items, move them to pantry, and immediately use them in AI generation.
      } catch (err) {
        console.error('Failed to move item', err);
      }
    },
    [moveItem],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteItem({ variables: { id } });
      } catch (err) {
        console.error('Failed to delete item', err);
      }
    },
    [deleteItem],
  );

  const handleUpdateState = useCallback(
    async (id: string, targetState: string) => {
      try {
        await updateItemState({ variables: { id, newState: targetState } });
      } catch (err) {
        console.error('Failed to update item state', err);
      }
    },
    [updateItemState],
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading your premium pantry...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-rose-500 font-medium">
        Error loading data: {error.message}
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col relative pb-20 overflow-hidden">
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
