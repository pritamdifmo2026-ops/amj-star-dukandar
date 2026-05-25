# AMJSTAR Dukandar Frontend 🌟

Welcome to the **AMJSTAR Dukandar Frontend** repository! This is the client-side application for the AMJSTAR B2B E-commerce platform, enabling seamless interactions between Suppliers, Resellers, and Administrators.

## 🚀 Features

- **Multi-Role Authentication**: Dedicated portals for Suppliers, Resellers, and Admin with robust Role-Based Access Control (RBAC).
- **Supplier Dashboard**: Comprehensive product catalog management, order processing, inventory tracking, and analytics.
- **Reseller Dashboard**: Streamlined product curation, customized public storefronts, and simplified order tracking.
- **Premium Storefronts**: Publicly shareable, SEO-optimized, beautifully designed storefronts for both Suppliers and Resellers.
- **Real-Time Capabilities**: Integrated real-time chat, notifications, and live product status updates.
- **Modern Tech Stack**: Built with React, TypeScript, Vite, Tailwind CSS, and Redux Toolkit.

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Lightning fast HMR)
- **State Management**: Redux Toolkit & React Query (Server state)
- **Styling**: Tailwind CSS & Vanilla CSS (Custom Design System)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **API Calls**: Axios with automated interceptors

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

- `src/api` - Axios configurations and interceptors
- `src/app` - Main application routing and core layouts
- `src/features` - Feature-based module architecture (Auth, Admin, Supplier, Reseller, Product, Chat)
- `src/pages` - Standalone pages (Public Storefronts, Landing)
- `src/shared` - Reusable UI components, hooks, utils, and constants
- `src/store` - Redux Toolkit global store configuration

## 🌟 Reseller Onboarding Flow

1. **Basic Setup**: Contact info & location.
2. **Profile**: Store name & identity.
3. **Selling Channels**: WhatsApp, Instagram, Offline, etc.
4. **Experience**: Past selling history.
5. **Payment Setup**: Bank account & optional GST.
6. **Verification**: Agreements & ID Proof.
7. **Plan Selection**: Free starter tier or premium upgrades.

## 🤝 Contribution Guidelines

- Follow the established feature-based architecture.
- Ensure all new components are strictly typed with TypeScript.
- Use `Tailwind CSS` for utility classes and refer to `index.css` for core design tokens.

---
*Built with ❤️ for the AMJSTAR Ecosystem*
