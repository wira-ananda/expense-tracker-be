import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'lia@wmail.com' },
    update: {},
    create: {
      name: 'Lia',
      email: 'lia@wmail.com',
      password: await bcrypt.hash('apabagus', 10),
    },
  });

  const incomeCategories = [
    'Gaji',
    'Bonus',
    'Hadiah',
    'Investasi',
    'Penjualan Produk',
  ];
  for (const name of incomeCategories) {
    await prisma.category.upsert({
      where: { name_userId: { name, userId: user.id } },
      update: {},
      create: {
        name,
        type: 'income',
        userId: user.id,
      },
    });
  }

  const expenseCategories = [
    'Makan',
    'Transportasi',
    'Tagihan Listrik',
    'Internet',
    'Belanja',
    'Hiburan',
  ];
  for (const name of expenseCategories) {
    await prisma.category.upsert({
      where: { name_userId: { name, userId: user.id } },
      update: {},
      create: {
        name,
        type: 'expense',
        userId: user.id,
      },
    });
  }

  console.log('✅ Seeder finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
