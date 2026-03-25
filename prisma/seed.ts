import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Buat default user
  const user = await prisma.user.upsert({
    where: { email: 'lia@wmail.com' },
    update: {},
    create: {
      username: 'Lia',
      email: 'lia@wmail.com',
      password: await bcrypt.hash('apabagus', 10),
    },
  });

  // 2️⃣ Default income categories
  const incomeCategories = [
    'Gaji',
    'Bonus',
    'Freelance',
    'Investasi',
    'Penjualan Produk',
  ];
  for (const name of incomeCategories) {
    await prisma.category.upsert({
      // Gunakan field unik baru: categoryname + userId
      where: { category_userId: { categoryname: name, userId: user.id } },
      update: {},
      create: {
        categoryname: name,
        type: 'income',
        userId: user.id,
      },
    });
  }

  // 3️⃣ Default expense categories
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
      where: { category_userId: { categoryname: name, userId: user.id } },
      update: {},
      create: {
        categoryname: name,
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
