require('dotenv').config({ path: '../.env' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { computeAndStoreSnapshots } = require('../src/services/metricsService')

const BUSINESS_ID = process.env.BUSINESS_ID || 'demo-biz-001'
// Demo userId — replace with a real Supabase user UUID after creating a test account
const DEMO_USER_ID = process.env.DEMO_USER_ID || '00000000-0000-0000-0000-000000000001'

const transactions = [
  // Month 1 — Jan
  { date: '2024-01-05', amount: 120000, direction: 'inflow',  category: 'revenue',   description: 'SaaS subscriptions' },
  { date: '2024-01-12', amount: 30000,  direction: 'outflow', category: 'cogs',      description: 'Hosting & infra' },
  { date: '2024-01-15', amount: 55000,  direction: 'outflow', category: 'payroll',   description: 'Salaries' },
  { date: '2024-01-20', amount: 8000,   direction: 'outflow', category: 'marketing', description: 'Ad spend' },
  // Month 2 — Feb
  { date: '2024-02-05', amount: 115000, direction: 'inflow',  category: 'revenue',   description: 'SaaS subscriptions' },
  { date: '2024-02-10', amount: 32000,  direction: 'outflow', category: 'cogs',      description: 'Hosting & infra' },
  { date: '2024-02-15', amount: 55000,  direction: 'outflow', category: 'payroll',   description: 'Salaries' },
  { date: '2024-02-22', amount: 9000,   direction: 'outflow', category: 'marketing', description: 'Ad spend' },
  // Month 3 — Mar (revenue dip)
  { date: '2024-03-05', amount: 98000,  direction: 'inflow',  category: 'revenue',   description: 'SaaS subscriptions' },
  { date: '2024-03-10', amount: 34000,  direction: 'outflow', category: 'cogs',      description: 'Hosting & infra' },
  { date: '2024-03-15', amount: 60000,  direction: 'outflow', category: 'payroll',   description: 'Salaries + new hire' },
  { date: '2024-03-25', amount: 12000,  direction: 'outflow', category: 'marketing', description: 'Ad spend' },
  // Month 4 — Apr (continued decline)
  { date: '2024-04-05', amount: 89000,  direction: 'inflow',  category: 'revenue',   description: 'SaaS subscriptions' },
  { date: '2024-04-10', amount: 34000,  direction: 'outflow', category: 'cogs',      description: 'Hosting & infra' },
  { date: '2024-04-15', amount: 60000,  direction: 'outflow', category: 'payroll',   description: 'Salaries' },
  { date: '2024-04-20', amount: 10000,  direction: 'outflow', category: 'marketing', description: 'Ad spend' },
  // Month 5 — May
  { date: '2024-05-05', amount: 93000,  direction: 'inflow',  category: 'revenue',   description: 'SaaS subscriptions' },
  { date: '2024-05-10', amount: 35000,  direction: 'outflow', category: 'cogs',      description: 'Hosting & infra' },
  { date: '2024-05-15', amount: 60000,  direction: 'outflow', category: 'payroll',   description: 'Salaries' },
  { date: '2024-05-22', amount: 9000,   direction: 'outflow', category: 'marketing', description: 'Ad spend' },
  // Month 6 — Jun
  { date: '2024-06-05', amount: 101000, direction: 'inflow',  category: 'revenue',   description: 'SaaS subscriptions' },
  { date: '2024-06-10', amount: 35000,  direction: 'outflow', category: 'cogs',      description: 'Hosting & infra' },
  { date: '2024-06-15', amount: 62000,  direction: 'outflow', category: 'payroll',   description: 'Salaries' },
  { date: '2024-06-20', amount: 8000,   direction: 'outflow', category: 'marketing', description: 'Ad spend' },
]

async function main() {
  // Upsert business
  await prisma.business.upsert({
    where: { id: BUSINESS_ID },
    update: { cashOnHand: 28000000 }, // $280k in cents
    create: {
      id: BUSINESS_ID,
      userId: DEMO_USER_ID,
      name: 'Demo SaaS Co',
      cashOnHand: 28000000,
    },
  })

  // Clear old transactions for clean seed
  await prisma.transaction.deleteMany({ where: { businessId: BUSINESS_ID } })
  await prisma.monthlySnapshot.deleteMany({ where: { businessId: BUSINESS_ID } })

  // Insert transactions
  await prisma.transaction.createMany({
    data: transactions.map(t => ({
      businessId: BUSINESS_ID,
      date: new Date(t.date),
      amount: t.amount * 100, // to cents
      direction: t.direction,
      category: t.category,
      description: t.description,
      source: 'seed',
    })),
  })

  // Compute snapshots
  await computeAndStoreSnapshots(BUSINESS_ID)

  console.log(`Seeded business ${BUSINESS_ID} with ${transactions.length} transactions`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
