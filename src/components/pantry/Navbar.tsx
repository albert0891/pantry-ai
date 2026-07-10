'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Plus, BookOpen, LogOut, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { signOut } from 'aws-amplify/auth';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenMyRecipes: () => void;
  onOpenAddDialog: () => void;
}

export function Navbar({
  searchQuery,
  setSearchQuery,
  onOpenMyRecipes,
  onOpenAddDialog,
}: NavbarProps) {
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const handleLogout = async () => {
    const isMockLoggedIn = localStorage.getItem('mock_logged_in');
    if (isMockLoggedIn) {
      localStorage.removeItem('mock_logged_in');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return;
    }
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/login';
  };

  return (
    <header className="bg-amber-700 border-b border-amber-800 px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 shadow-md z-20 sticky top-0">
      {/* Desktop Navbar */}
      <div className="hidden sm:flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={25} height={25} alt="Pantry AI Logo" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Pantry AI</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <Input
              type="text"
              placeholder="Search items..."
              className="w-full pl-9 bg-white text-stone-900 border-none placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-amber-300 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            variant="ghost"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 font-bold text-white hover:bg-white/20 rounded-full px-4 transition-colors"
          >
            <HelpCircle size={18} /> <span className="hidden lg:inline">Guide</span>
          </Button>

          <Button
            variant="ghost"
            onClick={onOpenMyRecipes}
            className="flex items-center gap-1.5 font-bold text-white hover:bg-white/20 rounded-full px-4 transition-colors"
          >
            <BookOpen size={18} /> <span>My Recipes</span>
          </Button>

          <Button
            onClick={onOpenAddDialog}
            className="flex items-center gap-1.5 font-bold text-amber-700 bg-white hover:bg-amber-50 rounded-full px-5 transition-colors"
          >
            <Plus size={18} /> <span>Add Item</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-white/80 hover:bg-white/20 hover:text-white rounded-full h-10 w-10 p-0 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Mobile Top Navbar (Simplified) */}
      <div className="flex sm:hidden justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" width={24} height={24} alt="Pantry AI Logo" />
          <h1 className="text-xl font-bold tracking-tight text-white">Pantry AI</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => setIsGuideOpen(true)}
            className="text-white/80 hover:bg-white/20 hover:text-white rounded-full h-9 w-9 p-0"
            title="Guide"
          >
            <HelpCircle size={18} />
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-white/80 hover:bg-white/20 hover:text-white rounded-full h-9 w-9 p-0"
            title="Logout"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
      {/* Mobile Search Bar */}
      <div className="flex sm:hidden w-full mt-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search items..."
            className="w-full pl-9 bg-white text-stone-900 border-none placeholder:text-stone-400 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-stone-200 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-stone-800 font-bold">
              <HelpCircle className="text-amber-600" />
              Welcome to Pantry AI!
            </DialogTitle>
            <DialogDescription className="text-stone-500 font-medium pt-2">
              Your smart, AI-powered kitchen assistant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-stone-700">
            <div className="flex gap-3 items-start">
              <div className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <p>
                Type a name and hit <strong className="text-amber-700">✨ Auto</strong> to let AI
                auto-categorize it.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-amber-100 text-amber-600 rounded-full w-6 h-6 flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <p>
                Check the boxes on multiple items and click{' '}
                <strong className="text-amber-600">Inspire Me</strong> to let AI craft a recipe.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-emerald-100 text-emerald-600 rounded-full w-6 h-6 flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <p>
                Filter your board instantly using the{' '}
                <strong className="text-emerald-600">Category Pills</strong> at the top.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-rose-100 text-rose-600 rounded-full w-6 h-6 flex items-center justify-center font-bold shrink-0">
                4
              </div>
              <div className="flex-1">
                <p className="mb-1">
                  <strong className="text-rose-600">Quick Movement Arrows:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-stone-600">
                  <li>
                    <strong>
                      Single Arrow ( {'>'} or {'<'} )
                    </strong>
                    : Move 1 unit.
                  </li>
                  <li>
                    <strong>
                      Double Arrow ( {'>>'} or {'<<'} )
                    </strong>
                    : Move ALL units.
                  </li>
                  <li>
                    <strong>Shopping Cart ( 🛒 )</strong>: Send all units to the To Buy list.
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center font-bold shrink-0">
                5
              </div>
              <div className="flex-1">
                <p className="mb-1">
                  <strong className="text-amber-700">Smart Voice Fill 🎙️:</strong>
                </p>
                <p className="text-xs text-stone-600">
                  Tap the mic and speak naturally (e.g.{' '}
                  <strong className="text-amber-600">
                    &quot;3 apples expiring next week&quot;
                  </strong>{' '}
                  or <strong className="text-amber-600">&quot;250g minced pork&quot;</strong>). AI
                  handles the rest!
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsGuideOpen(false)}
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-full w-full"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
