import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Category, BoardState } from '@prisma/client';

export async function GET(request: Request) {
  // Prevent unauthorized access. Vercel automatically adds an Authorization header to Cron requests.
  // The header value is Bearer <CRON_SECRET> where CRON_SECRET is defined in Vercel Env Vars.
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const demoUserId = 'public-demo-user';

    // 1. Delete existing data for the demo user
    await prisma.$transaction([
      prisma.recipe.deleteMany({ where: { userId: demoUserId } }),
      prisma.pantryItem.deleteMany({ where: { userId: demoUserId } }),
    ]);

    // 2. Insert default ingredients
    await prisma.pantryItem.createMany({
      data: [
        {
          name: 'Fuji Apples',
          quantity: 3,
          unit: 'pcs',
          category: Category.PRODUCE,
          userId: demoUserId,
          boardState: BoardState.IN_PANTRY,
        },
        {
          name: 'Whole Milk',
          quantity: 1,
          unit: 'liter',
          category: Category.DAIRY,
          userId: demoUserId,
          boardState: BoardState.IN_PANTRY,
        },
        {
          name: 'Eggs',
          quantity: 12,
          unit: 'pcs',
          category: Category.DAIRY,
          userId: demoUserId,
          boardState: BoardState.TO_BUY,
        },
      ],
    });

    return NextResponse.json({ success: true, message: 'Demo database reset successfully.' });
  } catch (error: any) {
    console.error('Failed to reset demo DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
