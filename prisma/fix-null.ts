// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// async function main() {
//   // ===== User =====
//   await prisma.user.updateMany({
//     where: { username: null },
//     data: { username: 'default_user' },
//   });

//   // ===== Category =====
//   const categories = await prisma.category.findMany({
//     where: { categoryname: null },
//   });

//   for (let i = 0; i < categories.length; i++) {
//     const cat = categories[i];
//     // Beri nama unik per record agar tidak melanggar constraint
//     await prisma.category.update({
//       where: { id: cat.id },
//       data: { categoryname: `default_category_${i + 1}` },
//     });
//   }

//   console.log('✅ Semua record lama sudah di-update aman');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
