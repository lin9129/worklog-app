import { PrismaConfig } from '@prisma/client'

export default {
  datasourceUrl: process.env.DATABASE_URL,
} satisfies PrismaConfig
