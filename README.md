# thinkr

**thinkr** is a Next.js-based frontend web application that serves as the customer-facing portal for our commercial product, the AI Autopilot for Shopify stores. This app provides an intuitive dashboard and a suite of tools that leverage AI agents to help Shopify store owners optimize their operations—from inventory management and analytics to marketing and customer insights.

The frontend dynamically interacts with our backend API, which handles all core functionalities. From connecting your Shopify store securely via OAuth to processing deep research requests and managing onboarding flows, every function is powered by our robust API infrastructure.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Build in Public](#build-in-public)

---

## Features

- **Shopify Integration:** Seamless OAuth flow and connection with Shopify stores.
- **AI Autopilot:** Automates essential tasks like analytics, inventory management, and research prompts using cutting-edge AI.
- **Real-Time Analytics:** Provides up-to-date insights into sales, customer behavior, and inventory levels.
- **Onboarding Flow:** Guided onboarding steps to connect stores, set goals, and manage time investment.
- **Adaptive Design:** Responsive UI built using Next.js, React, and Tailwind CSS.
- **Error Handling & Debugging:** Integrated error modals and status indicators to ensure a smooth user experience.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Language:** TypeScript & JavaScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Analytics:** Vercel Analytics
- **API Communication:** Fetch API with custom hooks for authentication and error handling
- **Authentication:** Shopify OAuth, Token-based authentication

---

## Getting Started

### Prerequisites

Before running this project locally, ensure you have the following installed:

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/thinkr.git
   cd thinkr
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file at the root of the project and include your environment-specific variables (see [Environment Variables](#environment-variables)).

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

---

## Environment Variables

Create a `.env.local` file in the root of your project and define the following variables:

- `NEXT_PUBLIC_API_URL` – The URL of your backend API server.
- `NEXT_PUBLIC_APP_URL` – The URL of your thinkr frontend application.
- `NEXT_PUBLIC_SHOPIFY_CLIENT_ID` – Your Shopify app client ID.
- `SHOPIFY_CLIENT_SECRET` – Your Shopify app client secret.

Example:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://thinkr.yourdomain.com
NEXT_PUBLIC_SHOPIFY_CLIENT_ID=your-shopify-client-id
SHOPIFY_CLIENT_SECRET=your-shopify-client-secret
```

---

## Development

This project is bootstrapped with [create-next-app](https://nextjs.org/docs/api-reference/cli/create-next-app). It is powered by Next.js and leverages both server and client components for enhanced performance and SEO.

- **Linting:** Run `npm run lint` to check for and fix code issues.
- **Type Checking:** Run `npm run typecheck` to perform TypeScript checks.
- **Testing:** Add your tests in the project and run them with your preferred test runner.

---

## Deployment

Thinkr is meant for production and is deployed on solutions like Vercel for optimum performance and scalability.

1. Commit your changes and push to your Git repository.
2. Connect your repository to Vercel.
3. Configure your environment variables in the Vercel dashboard.
4. Deploy your application using Vercel's CI/CD pipeline.

For more details, refer to the [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## Contributing

We welcome contributions from the community as we build in public! Feel free to open issues, submit pull requests, or share ideas. Please follow these guidelines:

- Fork the repository and create your branch from `main`.
- Ensure your code follows the project's style guidelines.
- Add tests for any new features or bug fixes.
- Update documentation as needed.

---

## Build in Public

thinkr is open-sourced as part of our "build in public" initiative. We believe in transparent development processes and welcome community involvement throughout the product lifecycle. Follow our journey on GitHub and join us in shaping the future of AI autopilot tools for Shopify stores.

---

© {new Date().getFullYear()} thinkr. All rights reserved.
