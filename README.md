# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

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

# Reseller Onboarding Documentation

## STEP 1: Basic Account Setup
Fields:
- Full Name
- Phone Number (OTP verify)
- Email
- Password
- City
- State
- Country

## STEP 2: Reseller Profile (Storefront Identity)
Fields:
- Store Name (required)
- Profile Type:
  - Individual Reseller
  - Business Reseller
- Profile Description (short bio)
- Profile Image / Logo

## STEP 3: Selling Channels
Fields:
- Where do you sell? (multi-select)
  - WhatsApp
  - Instagram
  - Facebook
  - Offline network
  - Amazon / Flipkart / Meesho
  - Personal Website
  - Others (specify)
- Add Links (dynamic based on selection)
  - Instagram link
  - Website link
  - Others (add links)
- Primary Selling Method:
  - Direct to customers
  - To retailers/shopkeepers
  - Both
- Monthly Sales Volume:
  - 0–50 orders
  - 50–200
  - 200–500
  - 500+
- Selling Reach:
  - Local
  - State
  - Pan India
  - International

## STEP 4: Experience & Credibility
Fields:
- Experience:
  - Beginner
  - 1–2 years
  - 3+ years
- Have you sold products before? (Yes/No)

## STEP 5: Payment Setup
Fields:
- Account Holder Name
- Bank Account Number
- IFSC Code
- Bank Name
Optional:
- PAN Number
- GST (if business i.e. optional)

## STEP 6: Verification
Fields:
- ID Proof (optional upload)
- Agreement checkbox:
  - Accept Terms
  - Accept Commission Policy
  - Accept Payment Terms (RTGS)

## STEP 7: Plan Selection
UI Content:
- Starter (Free) → 200 product adds
- Basic → ₹999 → 999 adds
- Standard → ₹1,000 → 1,000 adds
- Premium → ₹5,000 → 5,000 adds + benefits
Fields:
- Select Plan (default = Free)
- Upgrade CTA

## Onboarding Behavior
- Auto-save after each step
- Resume onboarding
- Step tracking

# amj-star-dukandar
# amj-star-dukandar
