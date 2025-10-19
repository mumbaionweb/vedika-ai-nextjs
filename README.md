# Vedika AI - Next.js Frontend

Enterprise-grade chat-based Agentic AI solution built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Responsive Layout**: Full-width/height layout with no browser scrollbars
- **SSR Support**: Server-side rendering for optimal performance
- **Mobile-First**: Responsive design with burger menu for mobile devices
- **Enterprise-Ready**: Built for scalability and performance

## 📋 Project Structure

```
vedika-ai-nextjs/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles with Tailwind
├── components/            # React components
│   └── layout/           # Layout components
│       ├── MainLayout.tsx   # Main layout wrapper
│       ├── Sidebar.tsx      # Sidebar with navigation
│       ├── Header.tsx       # Header component
│       └── Footer.tsx       # Footer with chatbox
├── types/                 # TypeScript type definitions
│   └── index.ts
├── BUSINESS_LOGIC.md      # Project scope and requirements
└── package.json           # Dependencies
```

## 🎨 Layout Structure

The application uses a **4-section layout**:

1. **Sidebar** (3% width on desktop)
   - Logo (V.ai)
   - New Chat icon (golden +)
   - Guest user profile at bottom
   - Collapses to burger menu on mobile (<768px)

2. **Header** (Placeholder)
   - Hamburger menu button (mobile only)
   - Future: breadcrumbs, search, notifications

3. **Main Content** (Dynamic SSR)
   - Scrollable content area with custom scrollbar
   - Full viewport height minus header/footer

4. **Footer** (Conditional)
   - Hidden on homepage
   - AI chatbox on all other pages
   - Fixed at bottom

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎨 Design System

### Colors
- **Primary**: Gold/Yellow shades (Premium gold palette)
- **Secondary**: Gray shades (Slate palette)
- **Modern professional aesthetic with premium gold accents**

### Responsive Breakpoints
- Mobile: < 768px (Sidebar becomes burger menu)
- Desktop: ≥ 768px (Fixed sidebar at 3% width)

## 🔗 Integration Points

- **vedika-backend**: RESTful API (AWS Lambda + API Gateway)
- **vedika-sso**: SSO authentication gateway
- **vedika-admin**: Separate admin frontend

## 📦 Tech Stack

- **Framework**: Next.js 14.2
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4
- **Font**: Inter (Google Fonts)
- **Deployment**: AWS Amplify (planned)

## 🏗️ Architecture

- **Frontend**: Next.js (this repository)
- **Backend**: Serverless (AWS Lambda)
- **Authentication**: vedika-sso
- **Infrastructure**: AWS (Amplify, Lambda, API Gateway)
- **CI/CD**: GitHub → AWS Amplify

## 📝 Development Notes

- No browser scrollbars - all scrolling happens within sections
- Full viewport layout (100vw × 100vh)
- Custom scrollbar styling for internal sections
- Server-side rendering enabled by default
- Mobile-responsive with hamburger menu

## 🔐 Environment Variables

To be added when integrating with backend:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SSO_URL=
```

## 📚 Documentation

- [Business Logic Document](./BUSINESS_LOGIC.md) - Project scope and boundaries
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

This is a private enterprise project. For questions or contributions, contact the development team.

## 📄 License

Proprietary - Vedika Platform

---

**Built with ❤️ for Enterprise AI Solutions**

