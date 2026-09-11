import { PrismaClient } from '@prisma/client';
import { problems } from './problems.js';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.evaluation.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.problem.deleteMany();

  // Seed problems
  for (const problem of problems) {
    await prisma.problem.create({
      data: {
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        requirements: JSON.stringify(problem.requirements),
        hints: JSON.stringify(problem.hints),
        rubricTemplate: JSON.stringify(problem.rubricTemplate),
        difficulty: problem.difficulty,
      },
    });
    console.log(`  ✓ Created problem: ${problem.title}`);
  }

  console.log('\nSeeding complete!');
}

seed()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
