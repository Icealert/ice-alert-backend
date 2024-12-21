# Ice Alert Frontend

Frontend application for the Ice Alert system, built with React and Vite.

## Technologies Used

- React
- Vite
- TailwindCSS
- Axios
- Chart.js
- React Router DOM

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
VITE_API_URL=your_backend_url
```

## Deployment

The application is automatically deployed when changes are pushed to the main branch:

- Frontend (Vercel): Automatically deploys via GitHub integration
- Backend (Render): Automatically deploys via GitHub integration

### Manual Deployment

You can trigger deployments manually using the deploy hooks:

- Frontend (Vercel):
```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_nYMQ56pMnhe5Jjqk5SJ1gwg3zqqt/XSiRJUcB39
```

- Backend (Render):
```bash
curl -X POST https://api.render.com/deploy/srv-ctemqopu0jms739dmjq0?key=C97EUaWtUaQ
```
  