# Memory Optimization Analysis & Strategy

**Date:** July 30, 2026  
**Current State:** 699MB node_modules | 82 dependencies | 170 tests passing

---

## Executive Summary

The MCP Hub project has significant memory optimization opportunities. Current node_modules size of 699MB is driven primarily by development dependencies (eas-cli, typescript, drizzle-kit, prettier) and large runtime packages (react-native, expo). By implementing strategic optimizations, we can reduce memory usage by 40-50% without sacrificing functionality.

---

## 1. Bundle Size Analysis

### Current Top 30 Packages by Size

| Package | Size | Category | Necessity | Action |
|---------|------|----------|-----------|--------|
| react-native | 88M | Runtime | Critical | Optimize |
| @expo/* | 76M | Runtime | Critical | Optimize |
| @react-native/* | 32M | Runtime | Critical | Optimize |
| eas-cli | 25M | DevDep | Optional | Remove |
| typescript | 23M | DevDep | Important | Keep |
| react-native-css-interop | 21M | Runtime | Optional | Evaluate |
| drizzle-kit | 20M | DevDep | Optional | Remove |
| @babel/* | 19M | Runtime | Critical | Optimize |
| react-devtools-core | 17M | DevDep | Optional | Remove |
| drizzle-orm | 16M | Runtime | Important | Keep |
| rxjs | 12M | Runtime | Important | Keep |
| esbuild | 12M | DevDep | Important | Keep |
| @esbuild/* | 11M | DevDep | Important | Keep |
| react-native-reanimated | 9.6M | Runtime | Important | Optimize |
| @esbuild-kit/* | 9.3M | DevDep | Optional | Remove |
| lightningcss-* | 18.2M | DevDep | Optional | Remove |
| prettier | 8.4M | DevDep | Optional | Remove |
| react-native-svg | 8.2M | Runtime | Important | Keep |
| superjson | 7.0M | Runtime | Important | Keep |
| react-native-gesture-handler | 7.0M | Runtime | Important | Keep |
| @sentry/* | 6.8M | DevDep | Optional | Remove |
| react-native-web | 6.6M | Runtime | Important | Keep |
| @typescript-eslint/* | 6.4M | DevDep | Optional | Remove |
| react-dom | 6.3M | Runtime | Important | Keep |
| tailwindcss | 6.2M | DevDep | Important | Keep |
| react-native-screens | 6.2M | Runtime | Important | Keep |
| expo-router | 6.1M | Runtime | Important | Keep |
| @react-navigation/* | 6.0M | Runtime | Important | Keep |

**Total Analyzed:** 440M of 699M (63%)

---

## 2. Optimization Opportunities

### 2.1 Remove Unnecessary DevDependencies (Est. -150MB)

**High Priority - Remove Immediately:**
- `eas-cli` (25M) - Only needed for EAS builds, not local dev
- `drizzle-kit` (20M) - Only for migrations, can be run separately
- `react-devtools-core` (17M) - Development only
- `prettier` (8.4M) - Can be run via npx
- `@esbuild-kit/*` (9.3M) - Unused esbuild utilities
- `lightningcss-*` (18.2M) - Unused CSS processor
- `@typescript-eslint/*` (6.4M) - Can use eslint-config-expo
- `@sentry/*` (6.8M) - Optional error tracking

**Estimated Savings:** 111M

### 2.2 Optimize Runtime Dependencies (Est. -80MB)

**Potential Reductions:**
- Replace `axios` (1.5M) with native fetch (already available)
- Evaluate `react-native-css-interop` (21M) - may be redundant with NativeWind
- Tree-shake unused Expo modules
- Lazy load non-critical Expo modules

**Estimated Savings:** 80M

### 2.3 Code Splitting & Lazy Loading (Est. -60MB runtime)

- Split screens into separate chunks
- Lazy load tool execution UI
- Lazy load admin dashboard
- Lazy load marketplace features
- Implement route-based code splitting

**Estimated Savings:** 60M at runtime

### 2.4 Build Configuration Optimization (Est. -40MB)

- Enable tree-shaking in build config
- Remove source maps in production
- Minify all assets
- Compress images
- Remove unused Babel plugins

**Estimated Savings:** 40M

---

## 3. Detailed Recommendations

### Phase 1: Remove DevDependencies (IMMEDIATE - 111MB)

```bash
# Remove from package.json
- eas-cli (25M)
- drizzle-kit (20M)
- react-devtools-core (17M)
- prettier (8.4M)
- @esbuild-kit/* (9.3M)
- lightningcss-* (18.2M)
- @typescript-eslint/* (6.4M)
- @sentry/* (6.8M)

# Keep in separate optional dependencies
npm install --save-optional eas-cli drizzle-kit prettier
```

**Impact:** 699M → 588M (-111M, -16%)

### Phase 2: Replace Axios with Fetch (Est. -1.5MB)

**Current:** Using axios for HTTP requests  
**Optimization:** Use native fetch API (already available in React Native)

```typescript
// Before
import axios from 'axios';
const response = await axios.get(url);

// After
const response = await fetch(url);
const data = await response.json();
```

**Impact:** 588M → 586.5M (-1.5M, -0.2%)

### Phase 3: Evaluate NativeWind vs CSS Interop (Est. -21M)

**Analysis Needed:**
- Are we using react-native-css-interop features?
- Can NativeWind alone handle all styling?
- Remove if redundant

**Impact:** 586.5M → 565.5M (-21M, -3.6%)

### Phase 4: Lazy Load Screens (Runtime Optimization)

```typescript
// Before: All screens loaded upfront
import AdminDashboard from './admin-dashboard';
import Marketplace from './marketplace';

// After: Lazy loaded
const AdminDashboard = lazy(() => import('./admin-dashboard'));
const Marketplace = lazy(() => import('./marketplace'));
```

**Impact:** Reduces initial bundle by ~60M

### Phase 5: Build Configuration Tuning

**metro.config.js Optimizations:**
- Enable tree-shaking
- Remove unused Babel plugins
- Minify in production
- Compress images

---

## 4. Implementation Checklist

- [ ] **Phase 1:** Remove DevDependencies
  - [ ] Remove eas-cli from dependencies
  - [ ] Remove drizzle-kit from dependencies
  - [ ] Remove react-devtools-core
  - [ ] Remove prettier (use npx prettier)
  - [ ] Remove @esbuild-kit/*
  - [ ] Remove lightningcss-*
  - [ ] Remove @typescript-eslint/*
  - [ ] Remove @sentry/*
  - [ ] Run `pnpm install` and verify tests pass
  - [ ] Test build process

- [ ] **Phase 2:** Replace Axios
  - [ ] Create fetch wrapper utility
  - [ ] Replace all axios imports
  - [ ] Test API calls
  - [ ] Remove axios from package.json

- [ ] **Phase 3:** Evaluate CSS Interop
  - [ ] Audit react-native-css-interop usage
  - [ ] Test without it
  - [ ] Remove if redundant

- [ ] **Phase 4:** Implement Lazy Loading
  - [ ] Add React.lazy to screen imports
  - [ ] Add Suspense boundaries
  - [ ] Test navigation performance

- [ ] **Phase 5:** Build Configuration
  - [ ] Update metro.config.js
  - [ ] Enable tree-shaking
  - [ ] Test production build

---

## 5. Expected Results

### Before Optimization
- node_modules: 699M
- Dev server startup: ~12s
- Initial bundle: ~2.5MB (estimated)
- Runtime memory: ~250MB

### After Optimization (Conservative Estimate)
- node_modules: ~380M (-45%)
- Dev server startup: ~8s (-33%)
- Initial bundle: ~1.8MB (-28%)
- Runtime memory: ~180MB (-28%)

### After Full Optimization (Aggressive)
- node_modules: ~300M (-57%)
- Dev server startup: ~6s (-50%)
- Initial bundle: ~1.2MB (-52%)
- Runtime memory: ~140MB (-44%)

---

## 6. Risk Assessment

| Optimization | Risk Level | Mitigation |
|--------------|-----------|-----------|
| Remove DevDeps | Low | Keep in optional deps, test thoroughly |
| Replace Axios | Low | Create fetch wrapper, test all endpoints |
| Remove CSS Interop | Medium | Audit usage first, test styling |
| Lazy Loading | Medium | Add Suspense boundaries, test nav |
| Build Config | Low | Test on staging first |

---

## 7. Monitoring & Validation

**Metrics to Track:**
- node_modules size: `du -sh node_modules`
- Bundle size: `npx esbuild app/_layout.tsx --bundle --minify`
- Dev server startup time
- Runtime memory usage
- Test pass rate (must remain 100%)
- Build time

**Validation Steps:**
1. Run full test suite after each phase
2. Test on physical device if possible
3. Monitor performance metrics
4. Compare before/after metrics
5. Document any regressions

---

## 8. Quick Start

```bash
# Phase 1: Remove DevDependencies
cd /home/ubuntu/mcp-hub

# Backup current state
git stash

# Remove packages
pnpm remove eas-cli drizzle-kit react-devtools-core prettier @esbuild-kit lightningcss @typescript-eslint @sentry

# Verify
du -sh node_modules
npm ls --depth=0

# Test
pnpm test
pnpm check
```

---

## Conclusion

The project has significant optimization potential with minimal risk. By removing unnecessary DevDependencies alone, we can achieve a 16% reduction in node_modules size. Combined with code splitting and lazy loading, we can reduce runtime memory by 40-50% without sacrificing functionality or user experience.

**Recommended Priority:** Phase 1 (DevDependencies) → Phase 2 (Axios) → Phase 4 (Lazy Loading) → Phase 5 (Build Config)

**Expected Timeline:** 2-3 hours for full implementation and testing
