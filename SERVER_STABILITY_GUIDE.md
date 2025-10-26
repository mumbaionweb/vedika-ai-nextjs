# Server Stability Troubleshooting Guide

## ✅ Server is Currently Working

The server is responding with **HTTP 200 OK** on `http://localhost:3000`.

## Quick Fix Commands

### If Server Crashes

```bash
# Option 1: Clean restart (recommended)
npm run dev:clean

# Option 2: Manual clean restart
pkill -f "next dev" && sleep 2 && rm -rf .next .turbo && npm run dev

# Option 3: Full clean (if still having issues)
rm -rf .next .turbo node_modules/.cache && npm run dev
```

## Common Issues & Solutions

### 1. Internal Server Error (500)

**Symptoms:**
- Browser shows "Internal Server Error"
- Console shows `GET / 500 (Internal Server Error)`

**Fix:**
```bash
npm run dev:clean
```

### 2. Build Manifest Errors

**Symptoms:**
- `ENOENT: no such file or directory, open '.next/static/development/_buildManifest.js'`
- Cache corruption errors

**Fix:**
```bash
rm -rf .next .turbo
npm run dev
```

### 3. Portal Rendering Crashes

**Symptoms:**
- Server crashes when opening model dropdown
- Errors related to `getBoundingClientRect()`

**Fix:**
Already fixed with try-catch error handling in `app/page.tsx`

### 4. Port Already in Use

**Symptoms:**
- `⚠ Port 3000 is in use by process 61356, using available port 3001 instead.`

**Fix:**
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Or kill specific port
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

## New NPM Scripts

Added to `package.json`:

```json
{
  "dev:clean": "rm -rf .next && npm run dev"
}
```

Usage:
```bash
npm run dev:clean
```

## Development Best Practices

1. **Always kill old processes before starting new ones**
   ```bash
   pkill -f "next dev"
   ```

2. **Clean cache after major changes**
   ```bash
   rm -rf .next .turbo
   ```

3. **If server keeps crashing, use the clean command**
   ```bash
   npm run dev:clean
   ```

4. **Check for background processes**
   ```bash
   ps aux | grep "next dev"
   ```

## Server Status Check

To verify the server is working:

```bash
# Check HTTP response
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Should return: 200

# Check if process is running
ps aux | grep "next dev" | grep -v grep
```

## Performance Tips

- **Use Turbopack** (already enabled with `--turbopack` flag)
- **Clean cache regularly** if experiencing slowness
- **Monitor memory usage** on macOS:
  ```bash
  ps aux | grep "next dev" | awk '{print $3}'
  ```

## When to Contact Support

Contact support if:
- All troubleshooting steps fail
- Server crashes consistently every time
- Port cannot be freed
- Build errors persist after full clean
