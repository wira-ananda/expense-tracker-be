import { Prisma } from '@prisma/client';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../constants/default-categories';

export function buildDefaultCategories(
  userId: string,
): Prisma.CategoryCreateManyInput[] {
  return [
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
      categoryname: name,
      type: 'income' as const,
      userId,
      isDefault: true,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      categoryname: name,
      type: 'expense' as const,
      userId,
      isDefault: true,
    })),
  ];
}
