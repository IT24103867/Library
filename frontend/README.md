# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Library Management System Frontend

A modern, responsive React application for managing library operations with role-based access control.

## Features

- **Modern Landing Page**: Beautiful, responsive design with feature highlights
- **Authentication System**: Secure login with role-based access (Admin, Librarian, Member)
- **Protected Routes**: Route protection based on user roles
- **Role-Based Dashboards**: Different interfaces for different user types
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **React Icons**: Modern icon library for better UX

## Tech Stack

- **React 19** - Frontend framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## User Roles & Demo Credentials

### Admin
- **Username**: admin
- **Password**: password
- **Access**: Full system control, user management, system settings

### Librarian
- **Username**: librarian
- **Password**: password
- **Access**: Book management, member services, daily operations

### Member
- **Username**: member
- **Password**: password
- **Access**: Browse books, borrow/return, view history

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.tsx      # Navigation bar
│   └── ProtectedRoute.tsx # Route protection
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── LandingPage.tsx # Landing page
│   ├── LoginPage.tsx   # Login page
│   └── Dashboard.tsx   # Role-based dashboard
├── types/              # TypeScript type definitions
│   └── auth.ts         # Authentication types
└── App.tsx            # Main app component
```

## Features Overview

### Landing Page
- Hero section with call-to-action
- Feature highlights
- User role descriptions
- Modern gradient background

### Authentication
- Secure login form
- Password visibility toggle
- Error handling
- Redirect after login

### Dashboard
- **Admin Dashboard**: System overview, user management, analytics
- **Librarian Dashboard**: Daily operations, book check-in/out, member services
- **Member Dashboard**: Personal book tracking, borrowing history, quick actions

### Navigation
- Responsive navbar
- User info display
- Role badge
- Logout functionality

## Development

This project uses modern React patterns including:
- Functional components with hooks
- Context API for state management
- Protected routes with role-based access
- TypeScript for type safety
- Tailwind CSS for styling
- Component composition for reusability

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
