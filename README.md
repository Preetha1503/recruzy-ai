# Samajh Interview Platform

## Overview

Samajh is a comprehensive interview platform designed to streamline the process of creating, administering, and analyzing technical assessments. The platform offers a dual interface for administrators and users (interviewees), with powerful features including AI-generated insights, performance analytics, and PDF report generation.

## Features

### Admin Features

- **Dashboard**: Overview of platform metrics and activity
- **Test Management**: Create, edit, and manage technical assessment tests
- **User Management**: View and manage user accounts and permissions
- **Analytics**: Comprehensive analytics on test performance and user statistics
- **Reports**: Generate detailed reports with AI-powered insights
- **Settings**: Configure platform settings and preferences

### User Features

- **Dashboard**: Personal overview of test history and performance
- **Active Tests**: View and take available tests
- **Test History**: Review past test attempts and results
- **Performance Analytics**: Visualized performance data with AI-generated insights
- **Profile Management**: Update personal information and preferences

### Core Functionality

- **AI-Powered Insights**: Integration with Google's Gemini API for intelligent analysis
- **PDF Report Generation**: Export professional reports in PDF format
- **Real-time Analytics**: Dynamic data visualization of test performance
- **Secure Authentication**: Role-based access control with Supabase authentication

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini API
- **PDF Generation**: React-PDF
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-username/samajh-interview-platform.git
   cd samajh-interview-platform
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Database Setup

The platform uses Supabase as its database. You'll need to set up the following tables:

- users
- tests
- questions
- results
- test_attempts

Detailed SQL schema is available in the `schema.sql` file.

## Usage

### Admin Access

1. Register an admin account or use the default admin credentials
2. Navigate to `/admin/dashboard` to access the admin interface
3. Create tests, manage users, and view analytics

### User Access

1. Register a user account
2. Log in and navigate to the user dashboard
3. Take available tests and view performance analytics

## Project Structure

\`\`\`
samajh-interview-platform/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin pages
│   ├── user/               # User pages
│   ├── api/                # API routes
│   ├── actions/            # Server actions
│   └── ...
├── components/             # Reusable React components
├── lib/                    # Utility functions and services
│   ├── supabase/           # Supabase client configuration
│   └── ...
├── public/                 # Static assets
└── ...
\`\`\`

## API Endpoints

The platform provides several API endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/users` - User management
- `/api/generate-questions` - AI question generation
- `/api/analytics` - Analytics data
- `/api/user/*` - User-specific data

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Google Gemini API](https://ai.google.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
