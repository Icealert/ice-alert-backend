module.exports = {
  port: process.env.PORT || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'https://your-frontend-url.vercel.app',
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    service: 'gmail'
  },
  database: {
    url: process.env.DATABASE_URL
  }
}; 