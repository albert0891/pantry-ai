"use client";

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronRight, ChevronLeft, Plus, Trash2, Search, Carrot, Edit, ChevronsRight, ChevronsLeft, Wand2, BookOpen, Loader2, LogOut } from 'lucide-react';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// shadcn UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// GraphQL Definitions
const GET_PANTRY_ITEMS = gql`
  query GetMyPantry {
    myPantryItems {
      id
      name
      quantity
      category
      boardState
      expiryDate
    }
    myRecipes {
      id
      title
      ingredients
      instructions
      createdAt
    }
  }
`;

const UPDATE_ITEM_STATE = gql`
  mutation UpdateItemState($id: ID!, $newState: BoardState!) {
    updateItemState(id: $id, newState: $newState) {
      id
      boardState
    }
  }
`;

const ADD_ITEM = gql`
  mutation AddPantryItem($name: String!, $quantity: Int!, $category: Category, $expiryDate: String) {
    addPantryItem(name: $name, quantity: $quantity, category: $category, expiryDate: $expiryDate) {
      id
      name
      quantity
      category
      boardState
      expiryDate
    }
  }
`;

const EDIT_ITEM = gql`
  mutation EditPantryItem($id: ID!, $name: String!, $quantity: Int!, $category: Category!, $expiryDate: String) {
    editPantryItem(id: $id, name: $name, quantity: $quantity, category: $category, expiryDate: $expiryDate) {
      id
      name
      quantity
      category
      expiryDate
    }
  }
`;

const MOVE_ITEM = gql`
  mutation MoveItem($id: ID!, $amount: Int!, $targetState: BoardState!) {
    moveItem(id: $id, amount: $amount, targetState: $targetState) {
      id
      quantity
      boardState
    }
  }
`;

const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) {
    deletePantryItem(id: $id)
  }
`;

const GENERATE_RECIPE = gql`
  mutation GenerateRecipe($mustUseItemIds: [String!]!) {
    generateRecipe(mustUseItemIds: $mustUseItemIds) {
      title
      ingredients
      instructions
    }
  }
`;

const SAVE_RECIPE = gql`
  mutation SaveRecipe($title: String!, $ingredients: [String!]!, $instructions: [String!]!) {
    saveRecipe(title: $title, ingredients: $ingredients, instructions: $instructions) {
      id
    }
  }
`;

// Helper: category to badge color
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'PRODUCE': return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
    case 'DAIRY': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
    case 'MEAT': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  if (/^\d+$/.test(dateString)) {
    return new Date(parseInt(dateString, 10)).toLocaleDateString();
  }
  return new Date(dateString).toLocaleDateString();
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery<any>(GET_PANTRY_ITEMS);
  const [updateItemState] = useMutation(UPDATE_ITEM_STATE);
  const [addItem] = useMutation(ADD_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [editItem] = useMutation(EDIT_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [moveItem] = useMutation(MOVE_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [deleteItem] = useMutation(DELETE_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [generateRecipe] = useMutation(GENERATE_RECIPE);
  const [saveRecipe] = useMutation(SAVE_RECIPE, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('TO_BUY');
  
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form States
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newCategory, setNewCategory] = useState("OTHER");
  const [newExpiryDate, setNewExpiryDate] = useState("");

  // AI Recipe States
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipeResult, setRecipeResult] = useState<any>(null);
  const [recipeError, setRecipeError] = useState("");
  const [isMyRecipesOpen, setIsMyRecipesOpen] = useState(false);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading your pantry...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Error loading data: {error.message}</div>;

  const rawItems = data?.myPantryItems || [];
  const myRecipes = data?.myRecipes || [];
  
  const items = rawItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingItemId(null);
    setNewName("");
    setNewQuantity(1);
    setNewCategory("OTHER");
    setNewExpiryDate("");
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItemId(item.id);
    setNewName(item.name);
    setNewQuantity(item.quantity);
    setNewCategory(item.category);
    // Convert numeric timestamp to YYYY-MM-DD for the date input
    if (item.expiryDate) {
      const d = /^\d+$/.test(item.expiryDate) ? new Date(parseInt(item.expiryDate)) : new Date(item.expiryDate);
      setNewExpiryDate(d.toISOString().split('T')[0]);
    } else {
      setNewExpiryDate("");
    }
    setIsAddDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      if (editingItemId) {
        await editItem({
          variables: {
            id: editingItemId,
            name: newName,
            quantity: newQuantity,
            category: newCategory,
            ...(newExpiryDate ? { expiryDate: newExpiryDate } : {})
          }
        });
      } else {
        await addItem({ 
          variables: { 
            name: newName, 
            quantity: newQuantity, 
            category: newCategory,
            ...(newExpiryDate ? { expiryDate: newExpiryDate } : {})
          } 
        });
      }
      setIsAddDialogOpen(false);
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
    } catch (err) {
      console.error("Failed to move item", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem({ variables: { id } });
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const handleLogout = async () => {
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      localStorage.removeItem('mock_logged_in');
      window.location.href = '/login';
      return;
    }
    try { await signOut(); } catch (e) { console.error(e); }
    window.location.href = '/login';
  };

  const handleGenerateRecipe = async () => {
    setIsGeneratingRecipe(true);
    setIsRecipeModalOpen(true);
    setRecipeResult(null);
    setRecipeError("");
    try {
      const res = await generateRecipe({
        variables: { mustUseItemIds: Array.from(selectedItemIds) }
      });
      setRecipeResult((res.data as any).generateRecipe);
    } catch (err: any) {
      console.error("Recipe generation failed", err);
      setRecipeError(err.message || "Unknown error occurred.");
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipeResult) return;
    try {
      await saveRecipe({
        variables: {
          title: recipeResult.title,
          ingredients: recipeResult.ingredients,
          instructions: recipeResult.instructions
        }
      });
      setIsRecipeModalOpen(false);
      setSelectedItemIds(new Set()); // clear selection
      alert("Recipe saved successfully!");
    } catch (err) {
      console.error("Failed to save recipe", err);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItemIds(newSet);
  };

  const columns = [
    { id: 'TO_BUY', title: '🛒 To Buy' },
    { id: 'IN_PANTRY', title: '🧊 In Pantry' },
    { id: 'CONSUMED', title: '🗑️ Consumed' }
  ];

  return (
    <div className="min-h-screen bg-amber-50/50 flex flex-col relative pb-20">
      {/* Top Navbar */}
      <header className="bg-sky-500 text-white border-b border-sky-600 px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 shadow-md">
        {/* Desktop Navbar */}
        <div className="hidden sm:flex justify-between items-center w-full">
          <div className="flex items-center gap-1">
            <Image src="/logo.svg" width={25} height={25} alt="Pantry AI Logo" className="drop-shadow-md" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Pantry AI</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sky-700/50" />
              <Input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-8 bg-white text-gray-800 border-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="secondary" onClick={() => setIsMyRecipesOpen(true)} className="flex items-center gap-1 font-bold text-sky-700 bg-white hover:bg-sky-50 shadow-sm">
              <BookOpen size={16} /> <span>My Recipes</span>
            </Button>

            <Button variant="secondary" onClick={openAddDialog} className="flex items-center gap-1 font-bold text-sky-700 bg-white hover:bg-sky-50 shadow-sm">
              <Plus size={16} /> <span className="hidden sm:inline">Add Item</span>
            </Button>

            <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-sky-600 px-2" title="Logout">
              <LogOut size={20} />
            </Button>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="flex flex-col sm:hidden w-full gap-3">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-1">
              <Image src="/logo.svg" width={25} height={25} alt="Pantry AI Logo" className="drop-shadow-md" />
              <h1 className="text-xl font-bold tracking-tight">Pantry AI</h1>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-white hover:bg-sky-600 px-2" title="Logout">
              <LogOut size={20} />
            </Button>
          </div>
          
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sky-700/50" />
              <Input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-8 bg-white text-gray-800 border-none placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => setIsMyRecipesOpen(true)} className="font-bold text-sky-700 bg-white hover:bg-sky-50 shadow-sm px-3">
              <BookOpen size={16} />
            </Button>
            <Button variant="secondary" onClick={openAddDialog} className="font-bold text-sky-700 bg-white hover:bg-sky-50 shadow-sm px-3">
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </header>

      {/* Item Form Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{editingItemId ? "Edit Item" : "Add New Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newName} onChange={e => setNewName(e.target.value)} className="col-span-3" placeholder="e.g. Apples" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" type="number" min="1" value={newQuantity} onChange={e => setNewQuantity(parseInt(e.target.value) || 1)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <div className="col-span-3">
                  <Select value={newCategory} onValueChange={(val) => setNewCategory(val || "OTHER")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCE">Produce</SelectItem>
                      <SelectItem value="DAIRY">Dairy</SelectItem>
                      <SelectItem value="MEAT">Meat</SelectItem>
                      <SelectItem value="PANTRY">Pantry</SelectItem>
                      <SelectItem value="FROZEN">Frozen</SelectItem>
                      <SelectItem value="BEVERAGE">Beverage</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiry" className="text-right">Expiry Date</Label>
                <Input id="expiry" type="date" value={newExpiryDate} onChange={e => setNewExpiryDate(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingItemId ? "Save Changes" : "Save to Pantry"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated Recipe Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-sky-700">
              <Wand2 className="text-amber-500" />
              {isGeneratingRecipe ? "Generating..." : recipeResult?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {isGeneratingRecipe ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
                <p>Crafting the perfect recipe...</p>
              </div>
            ) : recipeResult ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 border-b pb-1">🛒 Ingredients</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {recipeResult.ingredients.map((ing: string, idx: number) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 border-b pb-1">👨‍🍳 Instructions</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                    {recipeResult.instructions.map((step: string, idx: number) => (
                      <li key={idx} className="pl-1">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg font-mono text-sm break-words">
                Generation failed:<br/><br/>
                {recipeError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecipeModalOpen(false)}>Close</Button>
            {!isGeneratingRecipe && recipeResult && (
              <Button onClick={handleSaveRecipe} className="bg-amber-500 hover:bg-amber-600">
                💾 Save Recipe
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* My Recipes Modal */}
      <Dialog open={isMyRecipesOpen} onOpenChange={setIsMyRecipesOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col bg-slate-100">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2 text-sky-700">
              <BookOpen className="text-sky-500" />
              My Recipes
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {myRecipes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No recipes saved yet!</p>
                <p className="text-sm mt-1">Select ingredients and ask AI to generate one.</p>
              </div>
            ) : (
              myRecipes.map((recipe: any) => (
                <Card key={recipe.id} className="border-sky-200 shadow-md bg-white">
                  <CardContent className="p-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-3">{recipe.title}</h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Ingredients</h4>
                        <ul className="text-sm space-y-1 text-slate-700">
                          {recipe.ingredients.map((ing: string, i: number) => <li key={i}>• {ing}</li>)}
                        </ul>
                      </div>
                      <div className="sm:col-span-2">
                        <h4 className="font-semibold text-sm text-slate-600 mb-2">Instructions</h4>
                        <ol className="text-sm space-y-2 text-slate-700 list-decimal pl-4">
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

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-background border-b sticky top-0 z-10">
        {columns.map(col => (
          <button
            key={`tab-${col.id}`}
            onClick={() => setActiveTab(col.id)}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === col.id 
                ? 'border-sky-500 text-sky-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {col.title}
          </button>
        ))}
      </div>

      {/* Main Kanban Board */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden md:overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-6 h-full min-w-full md:min-w-max">
          {columns.map(col => {
            const colItems = items.filter((item: any) => item.boardState === col.id);
            const isVisibleOnMobile = activeTab === col.id;

            return (
              <div 
                key={col.id} 
                className={`w-full md:w-80 bg-slate-200/80 rounded-xl p-4 flex-col gap-3 border shadow-inner ${isVisibleOnMobile ? 'flex' : 'hidden md:flex'}`}
              >
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="font-semibold text-slate-700 hidden md:block">{col.title}</h2>
                  <Badge variant="secondary" className="ml-auto md:ml-0 bg-white/80 shadow-sm text-slate-600">
                    {colItems.length} items
                  </Badge>
                </div>
                
                {/* Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto pb-4">
                  {colItems.map((item: any) => (
                    <Card 
                      key={item.id} 
                      className={`transition-all duration-200 border-2 ${
                        selectedItemIds.has(item.id) 
                          ? 'border-sky-500 bg-sky-50 shadow-md z-10' 
                          : 'border-slate-200 bg-white hover:border-sky-300'
                      }`}
                    >
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            {/* Checkbox only in IN_PANTRY */}
                            {col.id === 'IN_PANTRY' && (
                              <Checkbox 
                                checked={selectedItemIds.has(item.id)}
                                onCheckedChange={() => toggleSelection(item.id)}
                                className="mt-1 w-6 h-6 border-2 border-sky-400 data-[state=checked]:bg-sky-500 rounded-md transition-all cursor-pointer shadow-sm"
                              />
                            )}
                            <div>
                              <h3 className="font-bold leading-none text-gray-800">{item.name}</h3>
                              <p className="text-sm font-semibold text-slate-600 mt-2">Qty: {item.quantity}</p>
                              {item.expiryDate && (
                                <p className="text-xs font-semibold text-red-500 mt-1">Exp: {formatDate(item.expiryDate)}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs font-bold px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t mt-1">
                          {/* Move Logic for IN_PANTRY */}
                          {col.id === 'IN_PANTRY' ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={() => handleMove(item.id, item.quantity, 'TO_BUY')} title="Return All to To Buy">
                                <ChevronsLeft size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={() => handleMove(item.id, 1, 'TO_BUY')} title="Return 1 to To Buy">
                                <ChevronLeft size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-600" onClick={() => handleMove(item.id, 1, 'CONSUMED')} title="Consume 1">
                                <ChevronRight size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-600" onClick={() => handleMove(item.id, item.quantity, 'CONSUMED')} title="Consume All">
                                <ChevronsRight size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {/* Normal Move Logic for TO_BUY & CONSUMED */}
                              {col.id === 'CONSUMED' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={() => updateItemState({variables: {id: item.id, newState: 'IN_PANTRY'}})} title="Move back to Pantry">
                                  <ChevronLeft size={16} />
                                </Button>
                              )}
                              {col.id === 'TO_BUY' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-600" onClick={() => updateItemState({variables: {id: item.id, newState: 'IN_PANTRY'}})} title="Move to Pantry">
                                  <ChevronRight size={16} />
                                </Button>
                              )}
                            </div>
                          )}

                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-100"
                              onClick={() => openEditDialog(item)}
                              title="Edit item"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id)}
                              title="Delete permanently"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colItems.length === 0 && (
                    <div className="text-center p-6 text-sm font-medium text-muted-foreground border-2 border-dashed border-gray-300 bg-white/50 rounded-lg">
                      No items found
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Action Bar for AI Recipe Generation */}
      {selectedItemIds.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-300 px-4 z-50">
          <Button 
            onClick={handleGenerateRecipe}
            size="lg"
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-2xl shadow-sky-500/50 rounded-full px-6 py-6 border-2 border-sky-400/50 group"
          >
            <Wand2 className="mr-2 h-5 w-5 text-amber-300 group-hover:rotate-12 transition-transform" />
            Inspire Me ({selectedItemIds.size})
          </Button>
        </div>
      )}
    </div>
  );
}
