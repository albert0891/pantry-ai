"use client";

import React from 'react';
import Image from 'next/image';
import { Search, Plus, BookOpen, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from 'aws-amplify/auth';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenMyRecipes: () => void;
  onOpenAddDialog: () => void;
}

export function Navbar({ searchQuery, setSearchQuery, onOpenMyRecipes, onOpenAddDialog }: NavbarProps) {
  const handleLogout = async () => {
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      localStorage.removeItem('mock_logged_in');
      window.location.href = '/login';
      return;
    }
    try { await signOut(); } catch (e) { console.error(e); }
    window.location.href = '/login';
  };

  return (
    <header className="bg-sky-500/90 backdrop-blur-xl border-b border-sky-400/50 px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 shadow-md z-20 sticky top-0">
      {/* Desktop Navbar */}
      <div className="hidden sm:flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={25} height={25} alt="Pantry AI Logo" className="drop-shadow-sm" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">Pantry AI</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search items..." 
              className="w-full pl-9 bg-white text-slate-900 border-none shadow-inner placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-200 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="ghost" onClick={onOpenMyRecipes} className="flex items-center gap-1.5 font-bold text-white hover:bg-white/20 rounded-full px-4 transition-colors">
            <BookOpen size={18} /> <span>My Recipes</span>
          </Button>

          <Button onClick={onOpenAddDialog} className="flex items-center gap-1.5 font-bold text-sky-600 bg-white hover:bg-sky-50 shadow-sm rounded-full px-5 transition-transform hover:scale-105">
            <Plus size={18} /> <span>Add Item</span>
          </Button>

          <Button variant="ghost" onClick={handleLogout} className="text-white/80 hover:bg-white/20 hover:text-white rounded-full h-10 w-10 p-0 transition-colors" title="Logout">
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Mobile Top Navbar (Simplified) */}
      <div className="flex sm:hidden justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={24} height={24} alt="Pantry AI Logo" className="drop-shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Pantry AI</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={handleLogout} className="text-white/80 hover:bg-white/20 hover:text-white rounded-full h-9 w-9 p-0" title="Logout">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
      {/* Mobile Search Bar */}
      <div className="flex sm:hidden w-full mt-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Search items..." 
            className="w-full pl-9 bg-white text-slate-900 border-none shadow-inner placeholder:text-slate-400 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
