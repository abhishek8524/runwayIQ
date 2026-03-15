// Single shared Prisma instance — prevents "max clients reached" on Supabase pooler
const { PrismaClient } = require('@prisma/client')

const prisma = global._prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global._prisma = prisma

module.exports = prisma
