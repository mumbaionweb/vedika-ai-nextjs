# Local Development Memory Optimization Guide

## 🔴 Issue
Next.js development server (`next-server`) consuming **3.5 GB+ of memory**, causing MacBook to slow down.

## 🎯 Root Causes Identified

### 1. **Turbopack Memory Usage**
- Turbopack (enabled with `--turbopack` flag) uses more memory than Webpack
- Better for build speed but higher memory footprint

### 2. **Icon.svg Repetitive Requests**
- Terminal shows thousands of `GET /icon.svg 200` requests
- Browser constantly re-requesting the favicon
- Each request creates a new connection/response cycle

### 3. **React 19 + Next.js 15**
- Latest versions are more memory-intensive in development
- Fast Refresh watches all files continuously

### 4. **File Watching**
- Next.js watches all files for changes
- Large node_modules can increase memory usage

## ✅ Optimizations Applied

### 1. Updated `next.config.js`
Added development-specific optimizations:

```javascript
// Development optimizations for memory
experimental: {
  // Reduce memory usage in development
  optimizePackageImports: ['lucide-react', 'react-markdown'],
},

// Webpack optimizations for development
webpack: (config, { dev, isServer }) => {
  if (dev) {
    // Reduce memory usage in development mode
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.git', '**/.next'],
    };
    
    // Optimize cache for development
    config.cache = {
      type: 'filesystem',
      compression: 'gzip',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };
  }
  return config;
},
```

### 2. Updated `package.json` Scripts
**Changed from:**
```json
"dev": "next dev --turbopack"
```

**Changed to:**
```json
"dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev",
"dev:turbo": "NODE_OPTIONS='--max-old-space-size=4096' next dev --turbopack"
```

**Benefits:**
- Default `npm run dev` now uses **Webpack** (lower memory) instead of Turbopack
- Added Node.js memory limit of 4GB (prevents crashes, allows garbage collection)
- Use `npm run dev:turbo` only when you need faster builds

### 3. File Watching Optimization
- Ignored `node_modules`, `.git`, and `.next` from file watching
- Reduced polling frequency to save memory

## 🚀 How to Apply Changes

### Step 1: Restart Development Server
```bash
# Stop the current server (Ctrl+C)

# Clean build cache
npm run clean

# Start with new optimized settings
npm run dev
```

### Step 2: Monitor Memory Usage
- **Before**: ~3.5 GB
- **Expected After**: ~1.5-2 GB (50% reduction)

## 📊 Additional Memory-Saving Tips

### 1. Close Unused Browser Tabs
Each browser tab with dev tools open adds ~200-300 MB of memory.

### 2. Use `dev:clean` When Switching Branches
```bash
npm run dev:clean
```
This clears the `.next` cache and starts fresh.

### 3. Restart Dev Server Periodically
If you've been developing for hours, restart the server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4. Disable Browser DevTools When Not Debugging
DevTools (especially with React DevTools) add significant memory overhead.

### 5. Use Turbopack Only When Needed
```bash
# Normal development (lower memory)
npm run dev

# Fast builds when needed (higher memory)
npm run dev:turbo
```

### 6. Clean All Caches Occasionally
```bash
npm run clean:all
```

## 🔍 Monitoring Commands

### Check .next folder size
```bash
du -sh .next
```
**Expected**: 50-100 MB

### Monitor Node Process Memory
```bash
ps aux | grep next-server
```

### Check for Memory Leaks
If memory keeps growing:
1. Stop the dev server
2. Run `npm run clean`
3. Restart with `npm run dev`

## ⚠️ Icon.svg Issue

The repetitive `GET /icon.svg` requests in your terminal are concerning. This suggests:

### Possible Causes:
1. **Browser Cache Disabled**: Check if "Disable cache" is enabled in DevTools
2. **Fast Refresh Reloading**: Each code change triggers a full page reload
3. **Icon Format Issue**: SVG icons can sometimes cause caching issues

### Solutions:
1. **Enable Browser Cache**: In DevTools → Network tab, uncheck "Disable cache"
2. **Use PNG/ICO Instead**: If issue persists, consider converting icon.svg to icon.ico
3. **Add Cache Headers**: (Already configured in next.config.js)

## 📈 Expected Results

### Memory Usage
- **Before**: 3.5 GB
- **After**: 1.5-2 GB
- **Improvement**: ~50% reduction

### Build Speed
- **Webpack (default)**: Slower builds, lower memory
- **Turbopack (optional)**: Faster builds, higher memory

### Development Experience
- Smoother MacBook performance
- Less fan noise
- Longer battery life
- No crashes due to memory limits

## 🔄 Reverting Changes (If Needed)

If you prefer the old setup:

```json
// package.json
"dev": "next dev --turbopack"
```

And remove the webpack configuration from `next.config.js`.

## ✅ Checklist

- [x] Updated `next.config.js` with memory optimizations
- [x] Updated `package.json` dev scripts
- [x] Added Node.js memory limit (4GB)
- [x] Optimized file watching
- [x] Configured webpack caching
- [ ] Restart dev server and test
- [ ] Monitor memory usage
- [ ] Commit changes to git

## 📞 Next Steps

1. **Restart your development server now**
2. **Monitor memory usage** for the next hour
3. **Report back** if memory is still high

If memory usage is still above 2.5 GB after 30 minutes, we may need to:
- Investigate specific components causing memory leaks
- Consider using production build for testing (`npm run build && npm start`)
- Check for memory leaks in WebSocket connections

---

**Status**: ✅ Optimizations Applied  
**Action Required**: Restart dev server with `npm run dev`  
**Expected Outcome**: 50% memory reduction (3.5GB → 1.5-2GB)

