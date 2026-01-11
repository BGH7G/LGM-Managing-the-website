# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + Vuetify 3 management system for livestock genetic data (LGM - Livestock Genetic Management). It provides data management capabilities for sheep (湖羊/Hu sheep) and cattle (荷斯坦奶牛/Holstein cattle), including individual records, phenotype data, photos, location tracking, and experimental data sheets.

## Common Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Backend Integration
The app expects a backend API running at `http://localhost:3000` (configured in vite.config.js proxy). All API calls use the `/api/v1` base path defined in `.env`.

## Architecture Overview

### Authentication & Authorization

**Token-based Authentication**:
- JWT tokens stored in localStorage via Pinia store (`src/stores/auth.js`)
- Two axios instances in `src/utils/axios.js`:
  - `authApi`: Includes `Authorization: Bearer {token}` header for authenticated requests
  - `baseApi`: Public endpoints (login, register)
- Auto-logout on 401 responses with redirect to login page
- Router guards in `src/router/index.js:168-196` enforce `requiresAuth` and role-based access

**Role System**:
- Two roles: `admin` and `user`
- Role stored in `userInfo.role` (fetched from `/user/profile` endpoint)
- Admin-only routes use `meta: { role: ['admin'] }` in route config
- Navigation menu dynamically adjusts based on role (see `DefaultLayout.vue:120-126`)

### State Management

**Pinia Store** (`src/stores/auth.js`):
- `token`: JWT token from server
- `userInfo`: User profile object with `{ name, role, avatar, ... }`
- `initialize()`: Auto-fetches user profile on app load if token exists
- `setAuth()`: Flexible token extraction supporting multiple response formats (`accessToken`, `token`, `jwt`, `access_token`)
- All state synced to localStorage for persistence

### Routing Structure

**Layout System**:
- All authenticated routes wrapped in `DefaultLayout` component
- DefaultLayout provides:
  - Glass-morphism themed navigation drawer with nested menus (up to 3 levels deep)
  - Theme toggle (light/dark mode)
  - User profile dropdown
  - Responsive sidebar collapse

**Route Organization**:
- `/` - Home dashboard with charts (LocationWithSheep, TagDistributionChart)
- `/dataShow/*` - All data management pages (sheep, cattle, locations, experiments)
- `/webM/*` - Website content management (news, members, publications)
- `/login`, `/register` - Public authentication pages

### Theming System

**Vuetify Theme Configuration** (`src/theme/palette.js` + `src/main.js`):
- Two themes: `brandLight` and `brandDark`
- Theme state persists to localStorage as `selectedTheme`
- Theme applies to entire app via Vuetify's theme system
- Custom CSS variables in `src/styles/theme.css`
- Glass-morphism effects using `.glass-card`, `.glass-app-bar`, `.glass-bg` classes

**Toggle Implementation** (`DefaultLayout.vue:46-53`):
- Theme toggle button in app bar
- Auto-detects system preference on first load
- Handles legacy theme name migration

### API Architecture

**File Organization** (`src/api/*.api.js`):
- Each feature has dedicated API file (e.g., `user.api.js`, `photo.api.js`, `datasheet.api.js`)
- All imports use `authApi` or `baseApi` from `src/utils/axios.js`
- Export individual functions (not default exports)
- FormData support: axios automatically removes Content-Type header for multipart uploads

**API File Pattern**:
```javascript
import { authApi } from '@/utils/axios'

export const fetchItems = () => authApi.get('/items')
export const createItem = (data) => authApi.post('/items', data)
```

### Component Architecture

**Rich Text Editors**:
- Multiple editor implementations available:
  - `Tiptap.vue`, `Tiptap2.vue`, `Tiptap3.vue`: TipTap editor variants with different extension sets
  - `WangEditor.vue`: wangEditor integration
- Used in `textEditor.vue` view for content creation

**Data Visualization**:
- ECharts integration for charts and graphs
- Home dashboard components (`LocationWithSheep.vue`, `TagDistributionChart.vue`) display key metrics

**Image Management**:
- Photo gallery system with album support (`src/api/photo.api.js`, `src/api/album.api.js`)
- Individual photo detail pages at `/photo/:id`

### Data Modules

**Livestock Data Structure**:
1. **Hu Sheep (湖羊)**:
   - Individual records: `/dataShow/huSheep/huSheepIndividual`
   - Phenotype data: `/dataShow/huSheep/huSheepPhenotype`
   - Detail pages: `/dataShow/huSheep/:id`

2. **Holstein Cattle (荷斯坦奶牛)**:
   - Individual records: `/dataShow/holstein/holsteinIndividual`
   - Phenotype data: `/dataShow/holstein/holsteinPhenotype`

3. **Experimental Data Sheets** (`/dataSheet`):
   - Custom database system with experiment tracking
   - Detail view: `/dataSheet/:id`
   - Data-only view: `/dataSheet/:id/data`

**Other Data Features**:
- Location management with geographic data
- Age milestone tracking
- Claims system (`/claim` - 报账申请)
- Goods/materials management (`/goods` - 耗材管理)
- Code sharing platform (`/codeShare`)

### Form Validation

- Uses `vee-validate` library (see package.json)
- Custom validators in `src/utils/validators.js`

### Date Handling

- Uses `dayjs` library throughout the app
- Preferred over native Date objects for consistency

### Icon System

- Material Design Icons (`@mdi/font`)
- Default icon set configured as `mdi` in Vuetify setup
- Usage: `<v-icon>mdi-home</v-icon>` or `:icon="'mdi-home'"`

## Important Patterns

### Path Aliasing
The `@` alias resolves to `src/` directory (configured in vite.config.js). Always use `@/` for imports:
```javascript
import { authApi } from '@/utils/axios'  // Correct
import { authApi } from '../utils/axios' // Avoid
```

### Lazy Loading
All routes except Home use dynamic imports for code splitting:
```javascript
component: () => import('@/views/dataShow/goods.vue')
```

### Backup Files
The codebase contains `~` backup files and a `src/Backup/` directory with archived components. These should generally be ignored.

## Development Notes

- The app uses Vuetify's Material Design 3 (MD3) blueprint for consistent Material Design styling
- Development mode includes Vue DevTools plugin (disabled in production)
- Server proxy configured for `/api` routes to avoid CORS during development
- Navigation drawer supports 3-level nested menus (see DefaultLayout.vue structure)
