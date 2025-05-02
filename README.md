# TrueAminoStore - TrueAminos E-commerce Platform

This project contains a full-stack e-commerce website for TrueAminos, a company selling research peptides, SARMs, and research supplies.

## Repository Information

- **Source**: [https://github.com/onyxprocessing/TrueAminoStore.git](https://github.com/onyxprocessing/TrueAminoStore.git)
- **Location**: The repository has been imported to the `TrueAminoStore` directory in this project.

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - TailwindCSS for styling
  - Shadcn UI components
  - React Query for data fetching
  - Wouter for routing

- **Backend**:
  - Express.js
  - In-memory storage for cart functionality
  - Airtable SDK for product data

## Project Structure

The imported repository has the following structure:
- `/client`: Contains the React frontend code
- `/server`: Contains the Express.js backend code
- `/shared`: Contains shared schemas and types
- `/public`: Contains static assets
- `/attached_assets`: Contains additional assets

## Requirements

- Node.js 16+
- Airtable API Key (for accessing product data)

## Environment Variables

The application requires the following environment variables:
- `AIRTABLE_API_KEY`: Your Airtable API key for accessing product data
- `SESSION_SECRET`: A secret string for session management (auto-generated during deployment)
- `PORT`: The port to run the server on (default: 5000)
- `HOST`: The host to bind to (default: 0.0.0.0)
- `NODE_ENV`: The environment to run in (development/production)

## Deployment Instructions

To deploy the TrueAminoStore application, follow these steps:

1. **Set up the Replit Secrets**:
   - Add your `AIRTABLE_API_KEY` as a secret in the Replit environment
   - The deployment script will automatically generate a `SESSION_SECRET` if not provided

2. **Run the Deployment Script**:
   - Use the `replit.deploy` script to automatically clone the repository and set up the environment
   - The script will install dependencies and start the server in production mode

3. **Deployment Settings**:
   - In the Replit deployment settings, set the run command to: `./replit.deploy`
   - This ensures the application starts properly during deployment

## Local Development

To run the application locally, follow these steps:

1. Navigate to the TrueAminoStore directory:
   ```
   cd TrueAminoStore
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with required API keys:
   ```
   AIRTABLE_API_KEY=your_airtable_api_key
   SESSION_SECRET=your_session_secret
   PORT=5000
   HOST=0.0.0.0
   NODE_ENV=development
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Features Implemented

- Full e-commerce functionality with product browsing and cart management
- Integration with Airtable for product data storage
- Mobile-responsive design with modern UI components
- SEO optimization with product-specific meta descriptions
- Instagram social media integration
- Complete set of legal pages (Privacy Policy, Terms of Service, Shipping Policy)

## Troubleshooting Deployment

If you encounter deployment issues:
1. Check that the `AIRTABLE_API_KEY` is correctly set in your Replit secrets
2. Ensure the deployment script (`replit.deploy`) has executable permissions
3. Verify that the deployment command is set to `./replit.deploy`
4. Check the deployment logs for any specific errors