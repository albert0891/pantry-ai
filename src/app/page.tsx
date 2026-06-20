"use client";

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';

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
  mutation AddPantryItem($name: String!, $quantity: Int!, $category: Category) {
    addPantryItem(name: $name, quantity: $quantity, category: $category) {
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
    case 'PRODUCE': return 'bg-green-100 text-green-800';
    case 'DAIRY': return 'bg-blue-100 text-blue-800';
    case 'MEAT': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
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

  const [newItemName, setNewItemName] = useState("");
  // RWD: State to track which column to show on mobile screens
  const [activeTab, setActiveTab] = useState('TO_BUY');

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your pantry...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading data: {error.message}</div>;

  const items = data?.myPantryItems || [];

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      await addItem({ variables: { name: newItemName, quantity: 1, category: "OTHER" } });
      setNewItemName("");
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

  // Group items by boardState
  const columns = [
    { id: 'TO_BUY', title: '🛒 To Buy', next: 'IN_PANTRY', prev: null },
    { id: 'IN_PANTRY', title: '🧊 In Pantry', next: 'CONSUMED', prev: 'TO_BUY' },
    { id: 'CONSUMED', title: '🗑️ Consumed', next: null, prev: 'IN_PANTRY' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">Pantry AI Dashboard</h1>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight sm:hidden">Pantry AI</h1>
        <form onSubmit={handleAdd} className="flex gap-2 w-full sm:w-auto ml-4 sm:ml-0">
          <input 
            type="text" 
            placeholder="Add new item..." 
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1 transition-colors">
            <Plus size={16} /> <span className="hidden sm:inline">Add</span>
          </button>
        </form>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        {columns.map(col => (
          <button
            key={`tab-${col.id}`}
            onClick={() => setActiveTab(col.id)}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === col.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {col.title}
          </button>
        ))}
      </div>

      {/* Main Kanban Board */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden md:overflow-x-auto">
        {/* On mobile: items flow vertically. On desktop: columns flex horizontally */}
        <div className="flex flex-col md:flex-row gap-6 h-full min-w-full md:min-w-max">
          {columns.map(col => {
            const colItems = items.filter((item: any) => item.boardState === col.id);
            // In mobile view (md:hidden), only show the active tab. In desktop view (md:flex), show all.
            const isVisibleOnMobile = activeTab === col.id;

            return (
              <div 
                key={col.id} 
                className={`w-full md:w-80 bg-gray-100 rounded-xl p-4 flex-col gap-3 ${isVisibleOnMobile ? 'flex' : 'hidden md:flex'}`}
              >
                <div className="flex justify-between items-center mb-2 px-1">
                  <h2 className="font-semibold text-gray-700 hidden md:block">{col.title}</h2>
                  <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-medium ml-auto md:ml-0">
                    {colItems.length} items
                  </span>
                </div>
                
                {/* Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto">
                  {colItems.map((item: any) => (
                    <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800">{item.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>

                      {/* Action Buttons instead of Drag and Drop */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-1">
                        <div className="flex gap-1">
                          {col.prev && (
                            <button 
                              onClick={() => handleMove(item.id, col.prev!)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Move back"
                            >
                              <ChevronLeft size={20} />
                            </button>
                          )}
                          {col.next && (
                            <button 
                              onClick={() => handleMove(item.id, col.next!)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Move forward"
                            >
                              <ChevronRight size={20} />
                            </button>
                          )}
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <div className="text-center p-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      No items
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
