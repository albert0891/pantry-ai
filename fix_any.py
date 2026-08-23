import os
import re

def fix_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Catch blocks
    content = re.sub(r'catch \(err: any\)', 'catch (err: unknown)', content)
    content = re.sub(r'catch \(error: any\)', 'catch (error: unknown)', content)

    # err.message patterns (simple fix by casting to Error)
    content = re.sub(r'err\.message', '(err instanceof Error ? err.message : String(err))', content)
    content = re.sub(r'error\.message', '(error instanceof Error ? error.message : String(error))', content)
    
    # Specific file fixes
    if "KanbanBoard.tsx" in path:
        content = content.replace("import React, { useMemo, useState } from 'react';", "import React, { useMemo, useState } from 'react';\nimport { PantryItem } from '@prisma/client';")
        content = content.replace("items: any[];", "items: PantryItem[];")
        content = content.replace("onEdit: (item: any) => void;", "onEdit: (item: PantryItem) => void;")
        content = content.replace("Record<string, any[]>", "Record<string, PantryItem[]>")
        content = content.replace("(item: any)", "(item: PantryItem)")
        
    if "PantryItemCard.tsx" in path:
        content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { PantryItem } from '@prisma/client';")
        content = content.replace("item: any;", "item: PantryItem;")
        content = content.replace("onEdit: (item: any) => void;", "onEdit: (item: PantryItem) => void;")
        
    if "usePantry.ts" in path:
        content = content.replace("import { useQuery, useMutation } from '@apollo/client';", "import { useQuery, useMutation } from '@apollo/client';\nimport { PantryItem } from '@prisma/client';")
        content = content.replace("useQuery<any>", "useQuery<{ myPantryItems: PantryItem[] }>")
        
    if "app/page.tsx" in path:
        content = content.replace("import { KanbanBoard } from '@/components/pantry/KanbanBoard';", "import { KanbanBoard } from '@/components/pantry/KanbanBoard';\nimport { PantryItem } from '@prisma/client';")
        content = content.replace("useState<any>(null)", "useState<PantryItem | null>(null)")
        content = content.replace("(item: any)", "(item: PantryItem)")
        content = content.replace("(data: any)", "(data: Omit<PantryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string })")
        
    if "AIRecipeManager.tsx" in path:
        content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { Recipe } from '@prisma/client';")
        content = content.replace("useState<any>(null)", "useState<any>(null) // TODO fix")
        content = content.replace("useState<any | null>(null)", "useState<Recipe | null>(null)")
        content = content.replace("(recipe: any)", "(recipe: Recipe)")
        
    if "AuthProvider.tsx" in path:
        content = content.replace("as any", "as unknown as { username: string; userId: string }")
        
    if "resolvers.ts" in path:
        content = content.replace("args: any", "args: Record<string, unknown>")
        
    with open(path, 'w') as f:
        f.write(content)

files = [
    "src/app/login/page.tsx",
    "src/app/api/cron/reset-demo/route.ts",
    "src/graphql/resolvers.ts",
    "src/lib/ai/recipeGenerator.ts",
    "src/components/pantry/KanbanBoard.tsx",
    "src/components/pantry/PantryItemCard.tsx",
    "src/hooks/usePantry.ts",
    "src/app/page.tsx",
    "src/components/pantry/AIRecipeManager.tsx",
    "src/components/providers/AuthProvider.tsx"
]

for f in files:
    fix_file(f)
