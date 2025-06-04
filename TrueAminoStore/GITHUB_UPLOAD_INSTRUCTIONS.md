# TrueAminos Project - GitHub Upload Instructions

## Project Overview
This is a complete e-commerce platform for TrueAminos nutritional supplements with:
- React frontend with TypeScript and Tailwind CSS
- Node.js backend with Express
- Drizzle ORM with PostgreSQL database
- Stripe payment integration
- Airtable product management and order processing
- Advanced performance optimizations

## Files to Upload to GitHub

Upload all files and folders from the TrueAminoStore directory to your GitHub repository:
https://github.com/onyxprocessing/trueaminos909

### Key Project Structure:
```
TrueAminoStore/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── shared/                 # Shared types and schemas
├── static/                 # Static assets
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS config
└── README.md              # Project documentation
```

### Environment Variables Needed:
Create a `.env` file in your repository with:
```
DATABASE_URL=your_postgresql_url
STRIPE_SECRET_KEY=your_stripe_secret
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
```

### Deployment Instructions:
1. Install dependencies: `npm install`
2. Set up environment variables
3. Push database schema: `npm run db:push`
4. Start development: `npm run dev`
5. Build for production: `npm run build`

## Upload Method:
1. Download/copy all files from this TrueAminoStore folder
2. Go to your GitHub repository: https://github.com/onyxprocessing/trueaminos909
3. Upload files via GitHub web interface or clone locally and push