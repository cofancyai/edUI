# PrepNX - AI-Powered Educational Platform

## Project Overview

PrepNX is a comprehensive educational platform designed for exam preparation, particularly focused on Indian competitive examinations (UPSC, government schemes, etc.). The platform features AI-powered tutoring, quiz generation, flashcards, mock tests, and multi-language support for 10 Indian languages.

**Project Name:** prepnx-dashboard
**Type:** Single Page Application (SPA)
**Primary Purpose:** AI-enhanced learning and exam preparation platform

---

## Technology Stack

### Frontend Core
- **React:** 18.2.0 (UI framework)
- **TypeScript:** 5.0.2 (type safety)
- **Vite:** 4.4.5 (build tool and dev server)
- **React Router DOM:** 6.8.1 (client-side routing)

### UI & Styling
- **Styling Approach:** Inline styles (no CSS modules or styled-components)
- **Icons:** Lucide React 0.263.1
- **Design System:** Custom gradient-based theme with purple/gold color scheme
- **Fonts:** Montserrat (Google Fonts)

### Additional Libraries
- **jsPDF:** 3.0.3 (PDF generation for reports/flashcards)

### Development Tools
- **ESLint:** Code linting with TypeScript support
- **TypeScript ESLint:** Parser and plugin for TS-specific rules
- **Vite Plugin React:** Fast refresh and JSX transformation

---

## Project Structure

```
edUI/
├── frontend/                          # Main application directory
│   ├── src/                          # Source code
│   │   ├── components/               # React components
│   │   │   ├── quiz/                # Quiz-specific components
│   │   │   │   └── Quiz.tsx         # Quiz generation & validation
│   │   │   ├── AITutor.tsx          # Main AI tutor with streaming
│   │   │   ├── StudentDashboard.tsx  # Main dashboard container
│   │   │   ├── Navigation.tsx        # Top navigation menu
│   │   │   ├── FlashCardTab.tsx     # Flashcard functionality
│   │   │   ├── ComingSoon.tsx       # Placeholder component
│   │   │   ├── ErrorMessage.tsx     # Error display component
│   │   │   ├── LoadingIndicator.tsx # Loading states
│   │   │   └── RefreshButton.tsx    # Refresh functionality
│   │   ├── constants/
│   │   │   └── languages.ts         # Supported language definitions
│   │   ├── App.tsx                  # Root component with routing
│   │   ├── main.tsx                 # Application entry point
│   │   └── index.css                # Global styles & animations
│   ├── dist/                        # Build output (generated)
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite configuration
│   └── README.md                    # Basic project info
└── CLAUDE.md                         # This file
```

### Important Files Outside src/components

The frontend directory contains many additional component files at the root level (not in src/components/):
- Authentication components: `StudentAuth.tsx`, `AdminLogin.tsx`, `TutorAuth.tsx`
- Dashboard variants: `AdminDashboard.tsx`, `TutorDashboard.tsx`, `ManualLearningDashboard.tsx`
- Feature modules: `JobTable.tsx`, `VideoPlayer.tsx`, `SearchBar.tsx`, `ExamSelector.tsx`
- Alternative entry points: `index.tsx`, `index2.tsx` through `index9.tsx`

**Note:** The current active structure uses `src/` directory, but many components exist at `frontend/` root level for flexibility.

---

## Architecture & Design Patterns

### Component Architecture

1. **Container Components:**
   - `StudentDashboard.tsx` - Main container managing navigation state
   - `AITutor.tsx` - Feature container with tab management

2. **Feature Components:**
   - `Quiz.tsx` - Complete quiz lifecycle (setup → active → results)
   - `FlashCardTab.tsx` - Flashcard generation and display
   - `Navigation.tsx` - Menu with visual feedback

3. **Utility Components:**
   - `LoadingIndicator.tsx` - Reusable loading states
   - `ErrorMessage.tsx` - Error display with retry
   - `ComingSoon.tsx` - Feature placeholders

### State Management
- **Local State:** React hooks (`useState`, `useCallback`, `useRef`)
- **No Global State Library:** All state is component-local or prop-drilled
- **State Patterns:**
  - Quiz state machine: `setup` → `loading` → `active` → `results`
  - Streaming state: `isLoading` + `isStreaming` + `streamingContent`
  - Form states with controlled inputs

### Routing
```typescript
// App.tsx
<Router>
  <Routes>
    <Route path="/" element={<StudentDashboard />} />
    <Route path="/dashboard" element={<StudentDashboard />} />
  </Routes>
</Router>
```

Currently minimal routing - single dashboard with tab-based navigation.

---

## Key Features & Implementation

### 1. AI Tutor (Streaming Response)

**Location:** `frontend/src/components/AITutor.tsx`

**Key Features:**
- Real-time streaming AI responses using Server-Sent Events (SSE)
- Typewriter effect with queue-based rendering
- Multi-language support (10 Indian languages)
- Tab-based interface: Search, Quiz, FlashCards, Infographic, YouTube
- Markdown-style content formatting (headings, lists, paragraphs)

**API Integration:**
```typescript
POST https://prepnx-backend.vercel.app/api/research/stream
Headers:
  - Content-Type: application/json
  - x-api-key: a1b2c3d4e5f6g7h8i9j0
Body: {
  query: string,
  language: string,
  query_type: 'educational'
}
```

**Streaming Implementation:**
- Uses `ReadableStream` with `TextDecoder`
- Processes SSE data chunks line-by-line
- Implements typewriter effect with 10ms delay between chunks
- Handles completion and error events

### 2. Quiz System

**Location:** `frontend/src/components/quiz/Quiz.tsx`

**Quiz Lifecycle:**
1. **Setup:** Topic, difficulty (easy/medium/hard), question count (3/5/10/15)
2. **Generation:** API call to generate questions
3. **Active:** Question-by-question navigation with explanations
4. **Results:** Score, grade, detailed feedback

**API Endpoints:**

Generation:
```typescript
POST https://prepnx-backend.vercel.app/api/quiz/practice
Body: {
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  num_questions: number
}
```

Validation:
```typescript
POST https://prepnx-backend.vercel.app/api/quiz/validate
Body: {
  questions: Question[],
  answers: string[]
}
```

**Question Interface:**
```typescript
interface Question {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}
```

### 3. FlashCards

**Location:** `frontend/src/components/FlashCardTab.tsx`

**Features:**
- AI-generated flashcards from search content
- Flip animation for front/back
- PDF export functionality (using jsPDF)
- Multi-language support

### 4. Multi-Language Support

**Location:** `frontend/src/constants/languages.ts`

**Supported Languages:**
- English, Hindi, Tamil, Telugu, Marathi
- Gujarati, Kannada, Malayalam, Punjabi, Bengali

All using Indian flag emoji (🇮🇳) in UI.

---

## Styling & Design System

### Color Palette
```css
--primary-bg: #2E1A47        /* Deep purple */
--secondary-bg: #1a1a4e      /* Dark blue-purple */
--accent-gold: #FFD700       /* Gold/yellow */
--accent-purple: #B19CD9     /* Light purple */
--text-primary: #EDEDED      /* Off-white */
--text-secondary: #E5E7EB    /* Light gray */
--border-color: rgba(255, 215, 0, 0.2)  /* Gold with transparency */
```

### Design Patterns

1. **Gradient Backgrounds:**
   ```typescript
   background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)'
   ```

2. **Glassmorphism:**
   ```typescript
   background: 'rgba(255, 255, 255, 0.05)'
   backdropFilter: 'blur(10px)'
   border: '1px solid rgba(255, 215, 0, 0.2)'
   ```

3. **Button States:**
   - Active: Gold-purple gradient
   - Hover: Transform + shadow increase
   - Disabled: Low opacity, grayscale

4. **Animations (index.css):**
   - `@keyframes spin` - Loading spinners
   - `@keyframes pulse` - Pulsing elements
   - `@keyframes slideIn` - Entrance animations
   - `@keyframes fadeIn` - Fade transitions
   - `@keyframes shake` - Error states

### Typography
- **Font Family:** 'Montserrat', sans-serif
- **Heading Sizes:** 1.2rem - 2rem
- **Body Text:** 1rem - 1.1rem
- **Font Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

---

## Development Workflow

### Available Scripts

```bash
# Development server (opens browser at localhost:3000)
npm run dev

# Production build (TypeScript compilation + Vite build)
npm run build

# Code linting
npm run lint

# Preview production build
npm run preview
```

### TypeScript Configuration

**Compiler Options:**
- **Target:** ES2020
- **Module:** ESNext with bundler resolution
- **JSX:** react-jsx (automatic runtime)
- **Strict Mode:** Enabled
- **Linting:** noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true  // Auto-opens browser
  }
})
```

---

## API Integration Guidelines

### Backend Base URL
```
https://prepnx-backend.vercel.app
```

### Authentication
All API requests require header:
```typescript
'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
```

### API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/research/stream` | POST | AI content streaming |
| `/api/quiz/practice` | POST | Generate quiz questions |
| `/api/quiz/validate` | POST | Validate quiz answers |
| (FlashCards - check component for endpoint) | POST | Generate flashcards |

### Error Handling Pattern

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'success') {
    // Handle success
  } else {
    throw new Error(data.message || 'Operation failed');
  }
} catch (err) {
  console.error('Operation failed:', err);
  setError(err instanceof Error ? err.message : 'Operation failed');
}
```

---

## Code Conventions & Best Practices

### Component Structure
1. **Imports** - React, third-party, local components, constants
2. **Interfaces/Types** - Component props, data models
3. **Component Definition** - Functional component with FC type
4. **State Declarations** - All useState/useRef at top
5. **Effects/Callbacks** - useCallback, useEffect
6. **Event Handlers** - Handler functions
7. **Render Logic** - Conditional rendering
8. **JSX Return** - Main component JSX
9. **Styles** - Inline style tag if needed
10. **Export** - Default export at bottom

### Naming Conventions

**Files:**
- Components: PascalCase (e.g., `AITutor.tsx`, `StudentDashboard.tsx`)
- Constants: camelCase (e.g., `languages.ts`)

**Variables:**
- State: descriptive camelCase (e.g., `selectedLanguage`, `isLoading`)
- Booleans: `is`, `has`, `should` prefix (e.g., `isStreaming`, `hasError`)
- Handlers: `handle` prefix (e.g., `handleSearch`, `handleAnswerSelect`)

**Components:**
- PascalCase for component names
- Descriptive, feature-based names
- Props interfaces: `ComponentNameProps`

### TypeScript Patterns

```typescript
// Interface for component props
interface MyComponentProps {
  title: string;
  onAction?: () => void;  // Optional with ?
  count: number;
}

// Functional component with typed props
const MyComponent: React.FC<MyComponentProps> = ({ title, onAction, count }) => {
  // Component logic
};

// State with type inference
const [data, setData] = useState<DataType[]>([]);

// Event handlers with proper types
const handleClick = (e: React.MouseEvent) => { };
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { };
```

### Inline Styling Pattern

```typescript
// Object-based inline styles
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '2rem',
  background: 'linear-gradient(145deg, #1a1a4e, #2E1A47)',
  borderRadius: '1rem',
  border: '1px solid rgba(255, 215, 0, 0.2)'
}}>
  {/* Content */}
</div>
```

**Style Units:**
- Use `rem` for spacing/sizing (1rem = 16px default)
- Use `px` only for borders, shadows, small values
- Use percentages for widths
- Use viewport units (`vh`, `vw`) sparingly

---

## Common Patterns & Snippets

### Loading State Pattern

```typescript
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return <LoadingIndicator message="Loading..." />;
}
```

### Error Handling Pattern

```typescript
const [error, setError] = useState<string | null>(null);

{error && (
  <ErrorMessage message={error} onRetry={handleRetry} />
)}
```

### Conditional Tab Rendering

```typescript
const [activeTab, setActiveTab] = useState('search');

{activeTab === 'search' && <SearchContent />}
{activeTab === 'quiz' && <QuizContent />}
{activeTab === 'flashcards' && <FlashcardsContent />}
```

### API Call with Loading/Error

```typescript
const fetchData = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'a1b2c3d4e5f6g7h8i9j0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    // Process data

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

## Testing & Debugging

### Current Testing Setup
- **Status:** No test framework currently configured
- **Linting:** ESLint enabled with TypeScript rules

### Debugging Tips

1. **Component State:** Use React DevTools browser extension
2. **API Calls:** Check Network tab in browser DevTools
3. **Streaming Issues:** Look for SSE data format in Network → EventStream
4. **TypeScript Errors:** Run `npm run build` to see compilation errors
5. **Console Logs:** Component uses `console.error` and `console.warn` extensively

### Common Issues & Solutions

**Issue:** Streaming not working
- **Check:** Network tab shows streaming response
- **Check:** SSE format is `data: {json}\n\n`
- **Check:** API key is correct

**Issue:** Quiz not generating
- **Check:** Topic field is not empty
- **Check:** Backend API is accessible
- **Check:** Response format matches Question interface

**Issue:** Styles not applying
- **Check:** Inline styles use string values with units
- **Check:** Color values are valid CSS
- **Check:** No typos in style property names

---

## Git Workflow & Conventions

### Branch Strategy
- **Main Branch:** Stable production code
- **Feature Branches:** `claude/claude-md-mi2xq4k8po84hiz5-01PJsv9hscMfueQj3MR1Jnbo`
- **Pattern:** `claude/[session-id]` for AI-assisted development

### Commit Message Guidelines

**Format:**
```
<type>: <description>

[optional body]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: Add flashcard PDF export functionality
fix: Resolve streaming timeout in AITutor component
docs: Update API integration guidelines in CLAUDE.md
refactor: Extract quiz validation logic to separate hook
```

### Git Push Requirements
- Always use: `git push -u origin <branch-name>`
- Branch must start with `claude/` and match session ID
- Retry up to 4 times with exponential backoff if network fails

---

## Environment & Configuration

### Development Environment
- **Node Version:** Compatible with ES2020
- **Package Manager:** npm (package-lock.json present)
- **Port:** 3000 (configured in vite.config.ts)
- **Auto-open:** Browser opens automatically on dev server start

### Build Output
- **Directory:** `frontend/dist/`
- **Assets:** Hashed filenames for cache busting
- **HTML:** `index.html` with injected script tags
- **TypeScript:** Compiled to JavaScript (ES2020)

---

## Future Development Guidelines

### Adding New Features

1. **Create Component File:** `frontend/src/components/FeatureName.tsx`
2. **Define Props Interface:** `interface FeatureNameProps`
3. **Implement Component:** Follow structure pattern above
4. **Add to Navigation:** Update `Navigation.tsx` menuItems
5. **Wire to Dashboard:** Add route in `StudentDashboard.tsx`
6. **Test Locally:** `npm run dev`
7. **Lint Code:** `npm run lint`
8. **Commit:** Follow commit message guidelines

### Adding New API Endpoint

1. **Document in this file:** Add to API Endpoints Reference table
2. **Create type interface:** Define request/response types
3. **Implement fetch logic:** Use error handling pattern
4. **Add loading state:** Use loading indicator
5. **Handle errors:** Display user-friendly error messages

### Adding New Language

1. **Update constants:** Add to `frontend/src/constants/languages.ts`
2. **Format:** `{ code: 'language', name: 'Display (Script)', flag: '🇮🇳' }`
3. **Test:** Verify in AITutor language selector

### Performance Optimization Opportunities

1. **Code Splitting:** Implement React.lazy() for route-based splitting
2. **Memoization:** Use React.memo for heavy components
3. **State Management:** Consider Zustand or Context for shared state
4. **API Caching:** Implement response caching for repeated queries
5. **Image Optimization:** Add image compression if images are used

---

## AI Assistant Guidelines

### When Working on This Codebase

**DO:**
- ✅ Use inline styles matching existing pattern
- ✅ Follow TypeScript strict mode requirements
- ✅ Include proper error handling for all API calls
- ✅ Use Lucide React for icons
- ✅ Match color scheme (purple/gold gradient theme)
- ✅ Test streaming functionality thoroughly
- ✅ Provide loading states for async operations
- ✅ Use descriptive variable names
- ✅ Comment complex logic (especially streaming/queue logic)
- ✅ Maintain component structure pattern

**DON'T:**
- ❌ Add new dependencies without justification
- ❌ Use class components (functional components only)
- ❌ Introduce global state library without discussion
- ❌ Change API endpoints without backend coordination
- ❌ Remove TypeScript types (keep strict mode)
- ❌ Use CSS modules or styled-components
- ❌ Hardcode strings that should be configurable
- ❌ Skip error handling on API calls
- ❌ Create components without TypeScript interfaces

### Understanding User Intent

**"Add a feature"** → Follow "Adding New Features" workflow above
**"Fix the quiz"** → Check Quiz.tsx, API endpoint, Question interface
**"Improve styling"** → Match existing gradient/glassmorphism patterns
**"Add API integration"** → Use backend URL, API key, error handling pattern
**"Optimize performance"** → Check "Performance Optimization Opportunities"

### Code Review Checklist

Before suggesting/committing code:
- [ ] TypeScript types are properly defined
- [ ] Error states are handled
- [ ] Loading states are shown
- [ ] Inline styles use rem/consistent units
- [ ] Colors match design system
- [ ] API calls include error handling
- [ ] Component follows structure pattern
- [ ] No console.log in production code (use console.error/warn)
- [ ] Responsive design considerations
- [ ] Accessibility (ARIA labels where needed)

---

## Troubleshooting Reference

### Build Errors

**"Cannot find module"**
- Run `npm install`
- Check import path capitalization

**TypeScript errors**
- Check `tsconfig.json` is not modified
- Verify all types are defined
- Run `npm run build` for full type checking

**Vite errors**
- Clear cache: `rm -rf node_modules/.vite`
- Restart dev server

### Runtime Errors

**"Failed to fetch"**
- Check backend API is accessible
- Verify API key is correct
- Check CORS settings (if running locally)

**Streaming not working**
- Verify SSE format from backend
- Check `ReadableStream` browser support
- Look for errors in Network tab

**Quiz not loading**
- Verify Question interface matches API response
- Check API endpoint URL
- Verify response format is JSON

---

## Additional Resources

### Documentation Links
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)

### Project-Specific
- **Backend API:** https://prepnx-backend.vercel.app
- **Frontend Port:** localhost:3000 (dev)
- **Repository:** edUI/

---

## Changelog

### 2024-11-17
- Initial CLAUDE.md creation
- Documented complete codebase structure
- Added comprehensive API integration guidelines
- Defined code conventions and best practices
- Established development workflows

---

## Contact & Support

For questions about this codebase:
1. Check this document first
2. Review inline code comments
3. Check component-specific documentation in file headers
4. Consult API endpoint documentation

**Note:** This is a living document. Update it when adding significant features or changing architecture.
