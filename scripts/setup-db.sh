#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "🔧 BINAIH — Setup de base de datos"
echo ""
echo "1. Generando cliente Prisma..."
npx prisma generate

echo ""
echo "2. Aplicando schema a Supabase..."
npx prisma db push

echo ""
echo "3. Ejecutando seed..."
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

echo ""
echo "✅ Base de datos lista."
echo ""
echo "Usuarios:"
echo "  admin@binaih.co   / admin123"
echo "  auditor@binaih.co / auditor123"
echo "  viewer@binaih.co  / viewer123"
