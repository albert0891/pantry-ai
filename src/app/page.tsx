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
        {columns.map(col => {
          const colItemsCount = items.filter((item: any) => item.boardState === col.id).length;
          return (
            <button
              key={`tab-${col.id}`}
              onClick={() => setActiveTab(col.id)}
              className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
                activeTab === col.id 
                  ? 'border-sky-500 text-sky-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {col.title} <span className="text-xs opacity-70">({colItemsCount})</span>
            </button>
          );
        })}
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
