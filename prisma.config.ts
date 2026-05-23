import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: 'postgresql://postgres.njendauzjikgbguowaah:G2rm1n7.777@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
  },
})
