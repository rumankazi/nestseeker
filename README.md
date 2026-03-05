# NestSeeker

A house hunting application designed to help manage and track your search for rental properties in the Netherlands.

## Project Goal

Finding a rental home in the Netherlands is highly competitive. NestSeeker aims to:
- **Track listings** from multiple sources (Funda, Pararius, HousingAnywhere, Kamernet, Huurwoningen)
- **Score properties** based on customizable criteria (balcony, bedrooms, energy rating, etc.)
- **Manage the viewing process** from request to decision
- **Notify you instantly** when new matching listings appear
- **Sync with Google Calendar** for viewing appointments
- **Draft viewing request emails** with AI assistance

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Database | Supabase (PostgreSQL, Auth, Realtime) |
| Deployment | Vercel |
| AI | Claude API |
| Integrations | Google Gmail & Calendar via MCP |
| Scraping | Puppeteer + Stealth (on home server) |
| Notifications | Supabase Realtime + Web Push + Email |

## Features

### Listing Management
- Import listings from URL or add manually
- Status workflow: `new` → `interested` → `viewing_requested` → `viewing_scheduled` → `viewed` → `accepted/rejected`
- Track source, price, size, location, and features

### Scoring System
Customizable criteria with weights:
- Balcony, Garden, Parking (Boolean)
- Bedrooms, Square Meters (Numeric)
- Energy Rating (A-G scale)
- Price (lower is better)

### Multi-User Support
- Invite partner to share listings
- Collaborative notes and decisions
- Activity tracking

### AI Features
- Proactive notifications for matching listings
- Automatic feature extraction from listing descriptions
- Viewing request email drafting (Dutch/English)

### Google Integration
- Calendar sync for viewing appointments
- Gmail integration for sending/receiving viewing requests

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Supabase account
- Google Cloud project (for Gmail/Calendar)
- Anthropic API key (for Claude)

### Installation

```bash
# Clone the repository
git clone https://github.com/rumankazi/nestseeker.git
cd nestseeker

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, signup pages
│   ├── (dashboard)/       # Protected app pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── listings/          # Listing components
│   ├── scoring/           # Scoring components
│   └── shared/            # Shared components
├── lib/
│   ├── supabase/          # Database client
│   ├── ai/                # Claude integration
│   └── scoring/           # Score calculation
├── hooks/                 # React hooks
└── stores/                # Zustand stores
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Claude AI
ANTHROPIC_API_KEY=

# Web Push (generate with web-push library)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Email (Resend)
RESEND_API_KEY=
```

## Deployment

### Vercel (Frontend)
Connect your GitHub repo to Vercel and configure environment variables.

### Scraper (Home Server)
The scraper runs separately on a MacBook Pro:
```bash
cd scraper
pnpm install
pnpm start
```
Use Cloudflare Tunnel to expose the webhook endpoint.

## License

MIT License - see [LICENSE](LICENSE) for details.
