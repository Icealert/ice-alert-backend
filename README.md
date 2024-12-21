# Ice Alert Frontend

Frontend application for the Ice Alert system, built with React and Vite.

## Technologies Used

- React
- Vite
- TailwindCSS
- Axios
- Chart.js
- React Router DOM
- Supabase (Backend & Database)

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env.development` or `.env.production` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture

The application uses:
- Vercel for frontend hosting
- Supabase for backend services:
  - PostgreSQL Database
  - Real-time updates
  - Authentication
  - API endpoints

## Deployment

The application is automatically deployed when changes are pushed to the main branch:

- Frontend (Vercel): Automatically deploys via GitHub integration
- Backend (Supabase): No deployment needed - changes are immediate via the Supabase dashboard

### Manual Deployment

You can trigger frontend deployments manually using the Vercel deploy hook:

```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_nYMQ56pMnhe5Jjqk5SJ1gwg3zqqt/XSiRJUcB39
```
  