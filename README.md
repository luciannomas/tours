# 🚙 Southern Cross Adventure Tours – AI Demo

AI-powered tour management system. Next.js 15 + PostgreSQL + Prisma.

## Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM v5
- **AI Agent**: Keyword-based intent detection + FAQ matching (no LLM cost)

## Pages
| Route | Description |
|-------|-------------|
| `/` | Home – tour catalog |
| `/dashboard` | Monthly stats, revenue by channel, top guide |
| `/bookings` | All reservations with filters |
| `/guides` | 12 guides across 3 cities |
| `/chat` | AI Agent – FAQ, reschedule, cancellation |

## API Routes
| Endpoint | Methods |
|----------|---------|
| `/api/tours` | GET |
| `/api/guides` | GET |
| `/api/extras` | GET |
| `/api/bookings` | GET, POST |
| `/api/bookings/[id]` | GET, PATCH, DELETE |
| `/api/agent` | POST |
| `/api/dashboard` | GET |
| `/api/reminders` | GET, POST |

## Setup

### 1. Database
```bash
# Create PostgreSQL database
createdb demo_tours

# Copy env file
cp .env.example .env
# Edit DATABASE_URL in .env
```

### 2. Install & Run
```bash
npm install
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
npm run db:seed       # Seed with demo data
npm run dev           # Start dev server → http://localhost:3000
```

### 3. Run Tests (no DB needed)
```bash
npm run test:flow
```

## Deploy to Vercel

1. Push to GitHub
2. Connect repo in Vercel
3. Add env variable: `DATABASE_URL` (use Neon, Supabase, or Railway for PostgreSQL)
4. Deploy

## Business Logic

- **Guide Assignment**: Auto-assigns the highest-priority available guide per city/tour/datetime
- **Conflict Detection**: Prevents double-booking same guide at same date/time
- **AI Agent**: Detects intent (FAQ / reschedule / cancel) and responds accordingly
- **Reminders**: Day-of and post-tour messages via WhatsApp/Email (simulated)
- **Dashboard**: Revenue breakdown by channel, city, extras sold, top guide
