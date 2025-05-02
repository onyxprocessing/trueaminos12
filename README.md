# TrueAminoStore Repository Import

This project successfully imported the TrueAminoStore repository from GitHub without any modifications. The repository contains a full-stack e-commerce website for TrueAminos, a company selling research peptides, SARMs, and research supplies.

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

## Getting Started

To run the application, follow these steps:

1. Navigate to the TrueAminoStore directory:
   ```
   cd TrueAminoStore
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with required API keys (see TrueAminoStore/README.md for details)

4. Start the development server:
   ```
   npm run dev
   ```

## Further Information

For more detailed information about the project, refer to the README.md file inside the TrueAminoStore directory.