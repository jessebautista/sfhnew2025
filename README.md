# Sing for Hope - Digital Platform
## v0.0.42 - Comprehensive Arts & Community Platform

A modern, full-featured digital platform for Sing for Hope built with Astro, featuring interactive piano discovery, user authentication, program applications, and comprehensive content management.

### 🎯 **Core Features**
- **🎹 Interactive Piano Discovery** with Mapbox-powered mapping and location services
- **🔐 Complete User Authentication** with Supabase SSR, role-based access control
- **📝 Program Application System** for artists and educators with file upload support
- **🛡️ Admin Content Management** with user management and application review workflows
- **🔍 Advanced Search** with Fuse.js-powered site-wide search and filtering
- **💳 Stripe Payment Integration** for secure donations and transactions
- **📱 Mobile-First Responsive Design** optimized for all device types
- **♿ WCAG 2.1 AA Accessibility** with comprehensive keyboard and screen reader support

## 🚀 Quick Start

**Prerequisites**: Node.js 20+ (Node.js 18 and below are deprecated for Supabase compatibility)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Update .env with your API keys
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
/
├── public/           # Static assets
├── src/
│   ├── components/   # React/Astro components
│   │   ├── auth/     # Authentication components
│   │   ├── admin/    # Admin panel components
│   │   ├── dashboard/# User dashboard components
│   │   └── applications/ # Application system components
│   ├── layouts/      # Page layouts (Base, Header, Footer)
│   ├── pages/        # Route pages and API endpoints
│   │   ├── api/      # Serverless API functions
│   │   ├── auth/     # Authentication pages
│   │   └── dashboard/ # Protected user pages
│   ├── lib/          # Utilities, Supabase client, auth helpers
│   ├── middleware.ts # Server-side authentication middleware
│   └── global.css    # Global styles and Tailwind imports
├── astro.config.mjs  # Astro configuration with SSR
└── tailwind.config.mjs # Tailwind CSS configuration
```

## ✨ Key Features

### 🎹 Interactive Piano Discovery
- **Mapbox GL JS v3** integration with custom markers and clustering
- **Mobile-optimized touch controls** with gesture support
- **Real-time location services** with user positioning
- **Advanced filtering** by location, artist, year, and status
- **Detailed piano modals** with comprehensive information and media

### 🔐 User Authentication & Authorization
- **Supabase SSR authentication** with session management
- **Multiple login options**: OAuth (Google, GitHub), magic links, email/password
- **Role-based access control**: User, Admin, Editor permissions
- **Protected routes** with server-side middleware
- **User profile management** with editable information

### 📝 Program Application System
- **Multi-step application forms** with real-time validation
- **File upload support** for portfolios and documents
- **Application status tracking** in user dashboard
- **Admin review workflow** with approval/rejection system
- **Automated email notifications** for status updates

### 🛡️ Admin Content Management
- **Comprehensive admin panel** for platform management
- **User management** with role assignment and moderation
- **Application review dashboard** with filtering and search
- **Content moderation tools** for news and program updates
- **Analytics dashboard** with engagement metrics

### 🔍 Advanced Search System
- **Fuse.js-powered search** with fuzzy matching and scoring
- **Site-wide content indexing** (pianos, news, programs, pages)
- **Autocomplete suggestions** with keyboard navigation
- **Mobile search interface** with full-screen experience
- **Advanced filtering** with category and type selection

### 💳 Payment & Donation Integration
- **Stripe Payment Elements** for secure card processing
- **Donation workflow** with custom amounts and frequencies
- **Receipt generation** and confirmation emails
- **Webhook handling** for payment status updates
- **Shop integration** for merchandise transactions

### 📱 Mobile-First Experience
- **Progressive Web App** features with offline capability
- **Touch-optimized interfaces** for map and form interactions
- **Responsive breakpoints** optimized for all devices
- **Performance-first approach** with code splitting and lazy loading
- **Accessible design** following WCAG 2.1 AA standards

## 🔧 Configuration

### Environment Variables

Required environment variables (see `.env.example`):

#### Core Platform
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase public anonymous key
- `SITE_URL` - Your domain URL (for redirects)

#### Payment & E-commerce
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret
- `PRINTFUL_API_KEY` - Printful API key (optional)
- `PRINTFUL_STORE_ID` - Printful store ID (optional)

#### External Services
- `FUNRAISE_ORG_ID` - Funraise organization ID (optional)
- `RESEND_API_KEY` - Resend email service key (optional)
- `GOOGLE_ANALYTICS_ID` - GA4 measurement ID (optional)

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication providers (Google, GitHub, etc.)
3. Create the required database tables:
   ```sql
   -- Users profiles table
   create table profiles (
     id uuid references auth.users not null primary key,
     username text unique,
     first_name text,
     last_name text,
     full_name text,
     avatar_url text,
     role text default 'user',
     created_at timestamp with time zone default timezone('utc'::text, now()),
     updated_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```
4. Configure Row Level Security (RLS) policies
5. Update environment variables with your project credentials

### Authentication Configuration

The platform supports multiple authentication methods:

- **Email/Password**: Traditional signup with verification
- **Magic Links**: Passwordless email authentication  
- **OAuth Providers**: Google, GitHub, Apple (configurable)
- **Role-based Access**: User, Editor, Admin levels

### Payment Integration

1. **Stripe Setup**:
   - Create Stripe account and get API keys
   - Configure webhook endpoints for payment events
   - Test payment flows in sandbox mode

2. **Donation Configuration**:
   - Customize donation amounts and frequencies
   - Set up receipt email templates
   - Configure success/cancel redirect URLs

## 🎨 Brand Colors

The website uses Sing for Hope's established brand colors:

- **Harmony**: `#339933` (primary green)
- **Melody**: `#DA4680` (accent pink)  
- **Rhythm**: `#54749E` (blue)
- **Sonata**: `#FDD05E` (yellow)
- **Symphony**: `#3A3F42` (dark gray)
- **Resonance**: `#221F20` (near black)

## 🚀 Deployment

The site is configured for deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

For other platforms, update `astro.config.mjs` with the appropriate adapter.

## 📱 Mobile Responsiveness

The site follows a mobile-first approach:

- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Touch-friendly tap targets (minimum 44px)
- Optimized typography and spacing for mobile
- Progressive enhancement for larger screens

## 🧪 Testing

Test the following key user flows:

### Authentication Flows
1. **Registration**: Sign up → email verification → profile completion
2. **Login**: Multiple methods (email, OAuth, magic link) → dashboard access
3. **Password Reset**: Forgot password → email → reset → login
4. **Profile Update**: Edit profile info → save → verify changes

### Piano Discovery
1. **Map Interaction**: View map → click markers → open piano details
2. **Search & Filter**: Use search → apply filters → view results
3. **Mobile Map**: Touch controls → zoom → marker selection
4. **Location Services**: Enable location → find nearby pianos

### Application System
1. **Program Application**: Choose program → fill form → upload files → submit
2. **Application Tracking**: View dashboard → check status → receive notifications
3. **Admin Review**: Login as admin → review applications → approve/reject

### Site-wide Features
1. **Global Search**: Use search bar → view results → navigate to content
2. **Mobile Navigation**: Test responsive menu and touch interactions
3. **Payment Flow**: Donate → enter details → complete transaction
4. **Accessibility**: Test with screen reader and keyboard-only navigation
5. **Performance**: Run Lighthouse audit targeting 95+ scores

## 📞 Support

For questions about this implementation:

- Check the original PRD: `sfh-prd.md`
- Review component documentation in code comments
- Test all integrations in staging environment before going live

## 📋 Pre-Launch Checklist

### Database & Authentication
- [ ] Set up Supabase production project
- [ ] Configure authentication providers (Google, GitHub, etc.)
- [ ] Create database tables and configure RLS policies
- [ ] Set up user roles and permissions
- [ ] Test authentication flows (signup, login, password reset)

### Core Platform Features
- [ ] Configure Mapbox with production access token
- [ ] Import piano data and verify map functionality
- [ ] Test search functionality across all content types
- [ ] Verify responsive design on all device types
- [ ] Test application submission and review workflows

### Payment & Integration
- [ ] Configure Stripe with production API keys
- [ ] Set up donation workflows and receipt emails
- [ ] Test payment processing and webhook handling
- [ ] Configure email service (Resend) for notifications
- [ ] Set up analytics and monitoring (Google Analytics, Vercel)

### Content & SEO
- [ ] Add real content, images, and program information
- [ ] Optimize meta tags and structured data
- [ ] Configure sitemap generation
- [ ] Test SEO performance and page indexing
- [ ] Verify social media sharing functionality

### Performance & Security
- [ ] Run comprehensive accessibility audit (WCAG 2.1 AA)
- [ ] Perform security testing and vulnerability assessment
- [ ] Run performance audit (target: 95+ Lighthouse scores)
- [ ] Test on multiple browsers and devices
- [ ] Configure error monitoring and logging
- [ ] Set up backup and disaster recovery procedures

### Launch Preparation
- [ ] Configure production environment variables
- [ ] Set up custom domain and SSL certificates
- [ ] Test all user journeys end-to-end
- [ ] Prepare launch communications and user documentation
- [ ] Configure monitoring alerts and support workflows

---

Built with ❤️ for the Sing for Hope mission: **Art for All**
