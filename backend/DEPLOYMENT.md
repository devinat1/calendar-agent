# Vercel Deployment Guide - Ensuring Event URLs Work

## Quick Fix for Missing URLs

If your events don't have clickable URLs on Vercel, follow these steps:

### 1. **Immediate Fix - Deploy the Latest Code**

The latest version now **automatically generates URLs** for all events, even without API keys:

```bash
cd backend
npm run build
# Push to GitHub - Vercel will auto-deploy
```

### 2. **Set Required Environment Variable**

In your Vercel dashboard, add this environment variable:

**Required:**
- `PERPLEXITY_API_KEY` = `your-perplexity-api-key`

This is the only required key. The system will now generate fallback URLs automatically.

### 3. **Optional: Add Event Source APIs for Better URLs**

For even better URL accuracy, add these optional API keys in Vercel:

**Optional but Recommended:**
- `EVENTBRITE_TOKEN` = [Get from Eventbrite](https://www.eventbrite.com/platform/api-keys)
- `TICKETMASTER_API_KEY` = [Get from Ticketmaster](https://developer.ticketmaster.com/)
- `GOOGLE_PLACES_API_KEY` = [Get from Google Cloud](https://console.cloud.google.com/apis/credentials)

### 4. **Verify It's Working**

After deployment, check the Vercel logs:
- Look for: `"URL generation complete: X/Y events now have URLs"`
- All events should now have clickable URLs

## How URL Generation Works Now

### Without API Keys (Basic)
✅ **Fallback URLs**: Smart search links to Eventbrite, Google, etc.
✅ **Always works**: No API keys needed
✅ **User-friendly**: Searches for the specific event

Example URL: `https://www.eventbrite.com/d/san-francisco/jazz-night-blue-note/`

### With API Keys (Enhanced)
✅ **Direct event links**: Real URLs to actual event pages
✅ **Verified events**: Confidence scores and verification status
✅ **Multiple sources**: Eventbrite, Ticketmaster, etc.

## Troubleshooting

### "No links showing up"
1. Check that you've deployed the latest code with `UrlGeneratorService`
2. Verify `PERPLEXITY_API_KEY` is set in Vercel environment variables
3. Check Vercel logs for URL generation messages

### "Links go to search pages, not direct events"
This is expected behavior when API keys aren't configured. Add the optional API keys above for direct event links.

### "Verification status not showing"
Make sure the frontend sends `enableVerification: true` in requests. The latest code enables this by default.

## Environment Variables Setup in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add the required variables:

| Variable | Value | Required |
|----------|-------|----------|
| `PERPLEXITY_API_KEY` | Your Perplexity API key | ✅ Yes |
| `EVENTBRITE_TOKEN` | Your Eventbrite token | ⚠️ Optional |
| `TICKETMASTER_API_KEY` | Your Ticketmaster key | ⚠️ Optional |
| `GOOGLE_PLACES_API_KEY` | Your Google Places key | ⚠️ Optional |

4. **Redeploy** after adding environment variables

## Testing

After deployment, test by:
1. Creating a new event search
2. Checking that events have blue "View Event Details" buttons
3. Clicking the buttons should open relevant search pages or direct event links

The system is now designed to **always provide URLs**, even on a fresh Vercel deployment with minimal configuration. 