import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const run = async () => {
  await prisma.ad.deleteMany();
  await prisma.ad.createMany({
    data: [
      {
        title: 'Премиум доступ к урокам',
        body: 'Учитесь без лимитов и рекламы.',
        cta: 'Открыть VIP'
      },
      {
        title: 'Персональный трек',
        body: 'AI подстраивает задания под ваш уровень.',
        cta: 'Подробнее'
      }
    ]
  });
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
