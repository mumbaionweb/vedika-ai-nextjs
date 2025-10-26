import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vedika.ai.in';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/routing/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // If endpoint doesn't exist yet (404), return empty array
      if (response.status === 404) {
        console.warn('⚠️ Models endpoint not found (404). Returning empty array.');
        return NextResponse.json({ models: [] });
      }
      
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [API Route] Fetched models:', data.models?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Error fetching models:', error);
    
    // Return empty array instead of error to keep UI working
    return NextResponse.json({ models: [] });
  }
}
