# AgrilinkAI System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Routing System](#routing-system)
4. [Navigation Components](#navigation-components)
5. [Authentication Flow](#authentication-flow)
6. [How to Modify Links](#how-to-modify-links)
7. [Database & Backend](#database--backend)
8. [Styling System](#styling-system)

---

## Overview

**AgrilinkAI** is a full-stack agricultural marketplace application built with:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (via Lovable Cloud)
- **State Management**: TanStack React Query
- **Routing**: React Router DOM v6

---

## Project Architecture

```
src/
├── components/           # Reusable UI components
│   ├── auth/             # Authentication-related components
│   │   ├── LoginForm.tsx       # User login form
│   │   ├── SignupForm.tsx      # User registration form
│   │   └── ProtectedRoute.tsx  # Route guard for authenticated users
│   ├── layout/           # Layout components
│   │   ├── Navbar.tsx          # Main navigation bar
│   │   └── Footer.tsx          # Site footer with links
│   ├── marketplace/      # Marketplace-specific components
│   │   ├── ProductCard.tsx     # Individual product display
│   │   ├── CreateListingForm.tsx # Form to create new listings
│   │   ├── ImageUpload.tsx     # Image upload component
│   │   └── MarketplaceFilters.tsx # Filtering controls
│   └── ui/               # shadcn/ui base components
├── contexts/             # React Context providers
│   └── AuthContext.tsx         # Authentication state management
├── hooks/                # Custom React hooks
├── integrations/         # External service integrations
│   └── supabase/
│       ├── client.ts           # Supabase client instance (DO NOT EDIT)
│       └── types.ts            # Auto-generated database types (DO NOT EDIT)
├── lib/                  # Utility libraries
├── pages/                # Route page components
│   ├── LandingPage.tsx         # Homepage (/)
│   ├── Login.tsx               # Login page (/login)
│   ├── Signup.tsx              # Registration page (/signup)
│   ├── Dashboard.tsx           # User dashboard (/dashboard)
│   ├── Marketplace.tsx         # Product listings (/marketplace)
│   ├── ProductDetail.tsx       # Single product view (/marketplace/:id)
│   ├── CreateListing.tsx       # Create new listing (/marketplace/new)
│   ├── CropDiagnosis.tsx       # AI crop diagnosis (/crop-diagnosis)
│   ├── FarmingTips.tsx         # Farming tips page (/tips)
│   ├── DirectMessages.tsx      # User messaging (/messages)
│   ├── About.tsx               # About page (/about)
│   └── NotFound.tsx            # 404 error page (*)
├── types/                # TypeScript type definitions
└── App.tsx               # Main application component with routes
```

---

## Routing System

### How React Router Works

The application uses **React Router DOM v6** for client-side routing. Routes are defined in `src/App.tsx`.

### Current Routes Configuration

```tsx
// src/App.tsx - Main routing configuration

<Routes>
  {/* ========== PUBLIC ROUTES ========== */}
  {/* These routes are accessible to everyone, logged in or not */}
  
  <Route path="/" element={<LandingPage />} />
  {/* Homepage - The main landing page of the application */}
  
  <Route path="/login" element={<Login />} />
  {/* Login page - Users can sign in with email/password */}
  
  <Route path="/signup" element={<Signup />} />
  {/* Signup page - New users can create an account */}
  
  <Route path="/marketplace" element={<Marketplace />} />
  {/* Marketplace - Browse all active product listings */}
  
  <Route path="/marketplace/:id" element={<ProductDetail />} />
  {/* Product Detail - View a specific product (":id" is a dynamic parameter) */}
  
  <Route path="/crop-diagnosis" element={<CropDiagnosis />} />
  {/* AI Diagnosis - Upload crop images for disease detection */}
  
  <Route path="/about" element={<About />} />
  {/* About page - Information about the platform */}

  {/* ========== PROTECTED ROUTES ========== */}
  {/* These routes require user authentication */}
  
  <Route path="/marketplace/new" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
  {/* Create Listing - Only authenticated farmers can create new product listings */}
  
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  {/* Dashboard - User's personal dashboard with their data */}
  
  <Route path="/tips" element={<ProtectedRoute><FarmingTips /></ProtectedRoute>} />
  {/* Farming Tips - Community tips page (requires login) */}
  
  <Route path="/messages" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
  {/* Direct Messages - User-to-user messaging system */}

  {/* ========== CATCH-ALL ROUTE ========== */}
  <Route path="*" element={<NotFound />} />
  {/* 404 Page - Shown when no other route matches */}
</Routes>
```

### Route Parameters

- **Static routes**: `/login`, `/about`, `/marketplace`
- **Dynamic routes**: `/marketplace/:id` where `:id` is replaced with an actual product ID
  - Example: `/marketplace/550e8400-e29b-41d4-a716-446655440000`

---

## Navigation Components

### Navbar (src/components/layout/Navbar.tsx)

The main navigation bar with desktop and mobile versions.

```tsx
// Navigation links array - EDIT THIS TO CHANGE MAIN NAV LINKS
const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },   // Link to marketplace
  { href: '/crop-diagnosis', label: 'AI Diagnosis' }, // Link to AI diagnosis
  { href: '/tips', label: 'Farming Tips' },          // Link to farming tips
  { href: '/about', label: 'About' },                // Link to about page
];
```

**To add a new link:**
```tsx
const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/crop-diagnosis', label: 'AI Diagnosis' },
  { href: '/tips', label: 'Farming Tips' },
  { href: '/about', label: 'About' },
  { href: '/new-page', label: 'New Page' },  // ADD YOUR NEW LINK HERE
];
```

**Dropdown Menu Links (for authenticated users):**
```tsx
// These are in the user dropdown menu
<DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
<DropdownMenuItem onClick={() => navigate('/admin')}>Admin Panel</DropdownMenuItem>  // Only for admins
<DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
<DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
```

### Footer (src/components/layout/Footer.tsx)

The site footer with quick links and contact info.

```tsx
// Quick Links array - EDIT THIS TO CHANGE FOOTER LINKS
{[
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/diagnosis', label: 'AI Diagnosis' },  // Note: Different path than navbar
  { href: '/tips', label: 'Farming Tips' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },  // This page may not exist yet
].map((link) => (
  <Link to={link.href}>{link.label}</Link>
))}

// Social Media Links - Currently placeholder (#)
<a href="#">Facebook</a>
<a href="#">Twitter</a>
<a href="#">Instagram</a>
<a href="#">Youtube</a>

// Policy Links
<Link to="/privacy">Privacy Policy</Link>
<Link to="/terms">Terms of Service</Link>
```

---

## How to Modify Links

### 1. Adding a New Page Route

**Step 1:** Create the page component in `src/pages/`
```tsx
// src/pages/NewPage.tsx
const NewPage = () => {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
};

export default NewPage;
```

**Step 2:** Add the route in `src/App.tsx`
```tsx
import NewPage from "./pages/NewPage";

// Inside <Routes>:
<Route path="/new-page" element={<NewPage />} />

// Or for protected route:
<Route path="/new-page" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
```

**Step 3:** Add navigation link (optional)
```tsx
// In Navbar.tsx
const navLinks = [
  // ... existing links
  { href: '/new-page', label: 'New Page' },
];
```

### 2. Changing an Existing Route Path

**Example:** Change `/crop-diagnosis` to `/diagnosis`

**Step 1:** Update `src/App.tsx`
```tsx
// Change this:
<Route path="/crop-diagnosis" element={<CropDiagnosis />} />

// To this:
<Route path="/diagnosis" element={<CropDiagnosis />} />
```

**Step 2:** Update all navigation links
```tsx
// In Navbar.tsx
{ href: '/diagnosis', label: 'AI Diagnosis' },  // Changed from /crop-diagnosis

// In Footer.tsx (already uses /diagnosis)
{ href: '/diagnosis', label: 'AI Diagnosis' },
```

### 3. Linking Methods

**Using `<Link>` component (recommended for internal navigation):**
```tsx
import { Link } from 'react-router-dom';

<Link to="/marketplace">Go to Marketplace</Link>
<Link to={`/marketplace/${productId}`}>View Product</Link>  // Dynamic route
```

**Using `navigate()` hook (for programmatic navigation):**
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');           // Go to dashboard
navigate('/marketplace');         // Go to marketplace
navigate(-1);                     // Go back one page
navigate('/product', { state: { data: someData } });  // Pass state
```

**Using `<a>` tag (for external links only):**
```tsx
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Site
</a>
```

### 4. Social Media Links

Currently in Footer.tsx, social links are placeholders. To add real links:

```tsx
// Change from:
<a href="#">Facebook</a>

// To:
<a href="https://facebook.com/agrilinkai" target="_blank" rel="noopener noreferrer">
  Facebook
</a>
```

---

## Authentication Flow

### AuthContext (src/contexts/AuthContext.tsx)

Manages user authentication state globally.

```tsx
const { user, profile, signOut, hasRole } = useAuth();

// Check if user is logged in
if (user) { /* user is authenticated */ }

// Check user role
if (hasRole('farmer')) { /* user is a farmer */ }
if (hasRole('admin')) { /* user is an admin */ }

// Sign out
await signOut();
```

### ProtectedRoute Component

Wraps routes that require authentication:
```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

If user is not logged in, they are redirected to `/login`.

---

## Database & Backend

### Supabase Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile information |
| `user_roles` | User role assignments (farmer, customer, admin) |
| `market_listings` | Product listings in the marketplace |
| `direct_conversations` | Conversation threads between users |
| `direct_messages` | Individual messages in conversations |
| `farming_tips_chat` | Community farming tips |
| `diagnosis_logs` | AI crop diagnosis history |
| `ai_model_config` | AI model configuration (admin only) |

### Row Level Security (RLS)

All tables have RLS policies that control data access:
- Users can only see/edit their own data
- Market listings with `status = 'active'` are visible to everyone
- Admins have elevated access to manage content

---

## Styling System

### Tailwind CSS Configuration

The project uses semantic design tokens defined in:
- `src/index.css` - CSS variables for colors
- `tailwind.config.ts` - Tailwind configuration

### Color Usage

```tsx
// ✅ CORRECT - Use semantic tokens
className="text-foreground bg-background"
className="text-primary hover:text-primary/80"
className="border-border"

// ❌ WRONG - Don't use direct colors
className="text-white bg-black"
className="text-green-500"
```

### Common Utility Classes

```tsx
// Gradients
className="gradient-hero"      // Primary gradient
className="glass"              // Glassmorphism effect

// Containers
className="container"          // Max-width centered container

// Spacing
className="py-12 md:py-16"     // Responsive padding
```

---

## Quick Reference: All Current Routes

| Path | Page Component | Protected | Description |
|------|----------------|-----------|-------------|
| `/` | LandingPage | No | Homepage |
| `/login` | Login | No | User login |
| `/signup` | Signup | No | User registration |
| `/marketplace` | Marketplace | No | Browse listings |
| `/marketplace/:id` | ProductDetail | No | View single product |
| `/marketplace/new` | CreateListing | **Yes** | Create new listing |
| `/dashboard` | Dashboard | **Yes** | User dashboard |
| `/crop-diagnosis` | CropDiagnosis | No | AI diagnosis tool |
| `/tips` | FarmingTips | **Yes** | Farming tips community |
| `/messages` | DirectMessages | **Yes** | User messaging |
| `/about` | About | No | About page |
| `*` | NotFound | No | 404 catch-all |

---

## Common Modifications

### Add External API Link
```tsx
// For external links, use <a> with security attributes
<a 
  href="https://api.example.com" 
  target="_blank" 
  rel="noopener noreferrer"
>
  External API
</a>
```

### Add Conditional Link (based on user role)
```tsx
const { hasRole } = useAuth();

{hasRole('farmer') && (
  <Link to="/marketplace/new">Create Listing</Link>
)}

{hasRole('admin') && (
  <Link to="/admin">Admin Panel</Link>
)}
```

### Add Link with Query Parameters
```tsx
<Link to="/marketplace?category=vegetables&sort=price">
  View Vegetables
</Link>

// Reading query params in the destination page:
import { useSearchParams } from 'react-router-dom';
const [searchParams] = useSearchParams();
const category = searchParams.get('category');  // "vegetables"
```

---

## Files You Should NOT Edit

These files are auto-generated and managed by the system:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`
- `supabase/config.toml`

---

*Documentation generated for AgrilinkAI project*
