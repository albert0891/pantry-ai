"use client";

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronRight, ChevronLeft, Plus, Trash2, Search } from 'lucide-react';

// shadcn UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) {
    deletePantryItem(id: $id)
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

// Helper: format date string from timestamp or ISO
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  // If it's a numeric timestamp string (e.g., "1783036800000")
  if (/^\d+$/.test(dateString)) {
    return new Date(parseInt(dateString, 10)).toLocaleDateString();
  }
  // Otherwise parse as standard date string
  return new Date(dateString).toLocaleDateString();
};

export default function DashboardPage() {
  const { data, loading, error } = useQuery<{ myPantryItems: any[] }>(GET_PANTRY_ITEMS);
  const [updateItemState] = useMutation(UPDATE_ITEM_STATE);
  const [addItem] = useMutation(ADD_ITEM, {
    refetchQueries: [{ query: GET_PANTRY_ITEMS }]
  });
  const [deleteItem] = useMutation(DELETE_ITEM, {
    refetchQueries: [{ query: GET_PANTRY_ITEMS }]
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('TO_BUY');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Add Item Form States
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newCategory, setNewCategory] = useState("OTHER");
  const [newExpiryDate, setNewExpiryDate] = useState("");

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading your pantry...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Error loading data: {error.message}</div>;

  const rawItems = (data as any)?.myPantryItems || [];
  
  // Filter items based on search query
  const items = rawItems.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMove = async (id: string, newState: string) => {
    try {
      await updateItemState({
        variables: { id, newState },
        optimisticResponse: {
          updateItemState: {
            __typename: "PantryItem",
            id,
            boardState: newState
          }
        }
      });
    } catch (err) {
      console.error("Failed to move item", err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addItem({ 
        variables: { 
          name: newName, 
          quantity: newQuantity, 
          category: newCategory,
          ...(newExpiryDate ? { expiryDate: newExpiryDate } : {})
        } 
      });
      // Reset form and close dialog
      setNewName("");
      setNewQuantity(1);
      setNewCategory("OTHER");
      setNewExpiryDate("");
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem({ variables: { id } });
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const columns = [
    { id: 'TO_BUY', title: '🛒 To Buy', next: 'IN_PANTRY', prev: null },
    { id: 'IN_PANTRY', title: '🧊 In Pantry', next: 'CONSUMED', prev: 'TO_BUY' },
    { id: 'CONSUMED', title: '🗑️ Consumed', next: null, prev: 'IN_PANTRY' }
  ];

  return (
    <div className="min-h-screen bg-amber-50/50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-sky-500 text-white border-b border-sky-600 px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 shadow-md">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Pantry AI</h1>
          
          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sky-700/50" />
              <Input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-8 bg-white text-gray-800 border-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="secondary" onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-1 font-bold text-sky-700 bg-white hover:bg-sky-50 shadow-sm">
              <Plus size={16} /> <span className="hidden sm:inline">Add Item</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search (Hidden on Desktop) */}
        <div className="relative w-full sm:hidden">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sky-700/50" />
          <Input 
            type="text" 
            placeholder="Search items..." 
            className="w-full pl-8 bg-white text-gray-800 border-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Global Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
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
              <Button type="submit">Save to Pantry</Button>
            </DialogFooter>
          </form>
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
                ? 'border-primary text-primary' 
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
                <div className="flex flex-col gap-3 overflow-y-auto">
                  {colItems.map((item: any) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow border-border/50 bg-white">
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold leading-none text-gray-800">{item.name}</h3>
                            <p className="text-sm font-semibold text-slate-600 mt-2">Qty: {item.quantity}</p>
                            {item.expiryDate && (
                              <p className="text-xs font-semibold text-red-500 mt-1">Exp: {formatDate(item.expiryDate)}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={`text-xs font-bold px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t mt-1">
                          <div className="flex gap-1">
                            {col.prev && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary bg-gray-50"
                                onClick={() => handleMove(item.id, col.prev!)}
                                title="Move back"
                              >
                                <ChevronLeft size={16} />
                              </Button>
                            )}
                            {col.next && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary bg-gray-50"
                                onClick={() => handleMove(item.id, col.next!)}
                                title="Move forward"
                              >
                                <ChevronRight size={16} />
                              </Button>
                            )}
                          </div>
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
                      </CardContent>
                    </Card>
                  ))}
                  {colItems.length === 0 && (
                    <div className="text-center p-6 text-sm font-medium text-muted-foreground border-2 border-dashed border-gray-200/50 bg-white/50 rounded-lg">
                      No items found
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
