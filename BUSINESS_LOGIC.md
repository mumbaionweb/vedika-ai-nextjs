# Vedika AI - Business Logic Document

**Version:** 2.0  
**Last Updated:** October 19, 2025  
**Document Purpose:** Central source of truth for project scope, boundaries, and business requirements

---

## 1. PROJECT OVERVIEW

### 1.1 Product Name
**Vedika AI** - Chat-based Agentic AI Solution

### 1.2 Product Vision
Enterprise-grade conversational AI platform similar to Google Gemini or Perplexity, targeting enterprise customers and MSMEs with RAG (Retrieval-Augmented Generation) architecture.

### 1.3 Platform Context
- **Part of:** Vedika Platform ecosystem
- **Version:** 2.0 (Previous: React.js, Current: Next.js)
- **Type:** Frontend Application
- **Target Users:** Enterprise customers and MSMEs

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Technology Stack
- **Frontend Framework:** Next.js (with Server-Side Rendering)
- **Backend Services:** vedika-backend (AWS Lambda + API Gateway)
- **Authentication:** vedika-sso (SSO Gateway)
- **Admin Panel:** vedika-admin (separate frontend)
- **API Documentation:** http://localhost:8000/openapi.json

### 2.2 Infrastructure
- **Cloud Provider:** AWS
- **Architecture Pattern:** Serverless Architecture
- **Key Services:**
  - AWS Lambda (compute)
  - AWS API Gateway (API management)
  - AWS Amplify (CI/CD)
- **Version Control:** GitHub
- **CI/CD Pipeline:** GitHub → AWS Amplify (automated)

### 2.3 AI Architecture
- **Pattern:** RAG (Retrieval-Augmented Generation)
- **Purpose:** Context-aware conversational AI with enterprise data integration

---

## 3. PROJECT SCOPE & BOUNDARIES

### 3.1 In Scope
- ✅ Chat-based AI interface
- ✅ RAG architecture implementation
- ✅ SSO authentication integration (vedika-sso)
- ✅ Backend API integration (vedika-backend)
- ✅ Responsive design (desktop + mobile)
- ✅ Full-width/height layout (no browser scrollbars)
- ✅ Server-side rendering (Next.js)

### 3.2 Out of Scope
- ❌ Backend API development (handled by vedika-backend)
- ❌ Admin functionalities (handled by vedika-admin)
- ❌ Authentication logic (handled by vedika-sso)
- ❌ Infrastructure setup (handled by AWS Amplify)

### 3.3 Future Considerations
- 🔮 Mobile app development (using responsive layout as base)
- 🔮 Advanced analytics and reporting
- 🔮 Multi-language support
- 🔮 Voice interaction capabilities

---

## 4. UI/UX REQUIREMENTS

### 4.1 Layout Structure
The application uses a **fixed viewport layout** with four main sections:

#### 4.1.1 Sidebar (3% width on desktop)
- **Desktop:** Fixed left sidebar occupying 3% of screen width
- **Mobile:** Collapsible burger menu
- **Purpose:** Navigation and quick access to features
- **State:** To be defined

#### 4.1.2 Header
- **Status:** Placeholder (blank for now)
- **Future Use:** Branding, user profile, notifications, etc.

#### 4.1.3 Main Content Area (Dynamic)
- **Rendering:** Server-Side Rendering (SSR)
- **Behavior:** Independent scroll (if content exceeds viewport)
- **Purpose:** Primary content display area

#### 4.1.4 Footer
- **Homepage:** Blank/minimal
- **Other Pages:** Contains AI Chatbox for interaction
- **Position:** Fixed at bottom of viewport

### 4.2 Responsive Design Principles
- **Desktop First:** Optimize for desktop, adapt for mobile
- **Breakpoints:** To be defined based on standard practices
- **No Browser Scrollbars:** All scrolling happens within sections
- **Full Viewport:** 100vw × 100vh layout

### 4.3 Design Philosophy
- Modern, clean interface with gold accent colors
- Enterprise-grade aesthetics
- Premium look with gold/yellow color palette
- Intuitive navigation
- Accessibility considerations

---

## 5. INTEGRATION POINTS

### 5.1 vedika-backend
- **Type:** RESTful API
- **Purpose:** All business logic and data operations
- **Documentation:** OpenAPI spec available
- **Authentication:** Token-based (via vedika-sso)

### 5.2 vedika-sso
- **Type:** SSO Gateway
- **Purpose:** User authentication and authorization
- **Flow:** OAuth 2.0 / SAML (to be confirmed)

### 5.3 vedika-admin
- **Relationship:** Separate application
- **Shared Resources:** Backend APIs, SSO
- **Purpose:** Administrative operations

---

## 6. DEVELOPMENT PHASES

### Phase 1: Foundation (Current)
- ✅ Project initialization
- ✅ Layout structure
- ✅ Basic UI components
- ⏳ Responsive design implementation

### Phase 2: Backend Integration (Upcoming)
- ⏳ API client setup
- ⏳ Authentication flow
- ⏳ Data fetching and state management

### Phase 3: AI Features (Upcoming)
- ⏳ Chat interface
- ⏳ RAG implementation
- ⏳ Streaming responses

### Phase 4: Polish & Deploy (Upcoming)
- ⏳ Testing
- ⏳ Performance optimization
- ⏳ CI/CD setup
- ⏳ Production deployment

---

## 7. BUSINESS RULES & CONSTRAINTS

### 7.1 Technical Constraints
- Must use serverless architecture
- Must integrate with existing Vedika ecosystem
- Must support SSR for SEO and performance
- Must be mobile-responsive

### 7.2 Business Constraints
- Enterprise-grade security requirements
- Scalability for multiple concurrent users
- Cost-effective serverless deployment
- Fast time-to-market

---

## 8. OPEN QUESTIONS & DECISIONS NEEDED

- [ ] Specific color scheme and branding guidelines?
- [ ] SSO integration details (OAuth flow, endpoints)?
- [ ] API authentication token storage strategy?
- [ ] State management library (Redux, Zustand, Context)?
- [ ] Styling approach (CSS Modules, Tailwind, Styled Components)?
- [ ] Error handling and logging strategy?
- [ ] Analytics and monitoring tools?

---

## 9. REVISION HISTORY

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-19 | 1.0 | Initial document creation | Team |

---

## 10. NOTES & REMINDERS

- Always validate against this document before implementing features
- Update this document when scope changes
- All team members must refer to this for decisions
- Backend API: http://localhost:8000/openapi.json

