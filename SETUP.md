# BINAIH — Guía de Setup

## Pre-requisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## 1. Instalar dependencias
```bash
npm install
```

## 2. Variables de entorno
El archivo `.env.local` ya está incluido con las credenciales de Supabase.
> ⚠️ **Rota las claves en Supabase después del primer deploy** (Settings → API → Regenerate)

## 3. Setup de base de datos (una sola vez)
```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en Supabase
npx prisma db push

# Poblar con datos de demo
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

O en un solo comando:
```bash
bash scripts/setup-db.sh
```

## 4. Activar API routes con BD real
Una vez ejecutado el seed, reemplazar en los 3 archivos:
- `app/api/stores/route.ts`
- `app/api/kpis/route.ts`  
- `app/api/findings/route.ts`

El comentario `// TODO: reemplazar con prisma...` indica exactamente dónde.

## 5. Levantar en desarrollo
```bash
npm run dev
```
Abre http://localhost:3000

## Usuarios de demo
| Rol     | Email                | Contraseña  |
|---------|----------------------|-------------|
| Admin   | admin@binaih.co      | admin123    |
| Auditor | auditor@binaih.co    | auditor123  |
| Viewer  | viewer@binaih.co     | viewer123   |

## Comandos útiles
```bash
npx prisma studio   # UI visual de la BD
npx prisma db push  # Aplicar cambios al schema
npm run build       # Build de producción
```
