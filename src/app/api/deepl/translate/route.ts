import { NextRequest, NextResponse } from 'next/server';
import { query as deeplQuery } from '@/utils/deepl';

const DEFAULT_DEEPL_FREE_API = 'https://api-free.deepl.com/v2/translate';

const getDeepLAPIKey = (keys: string | undefined) => {
  const keyArray = keys?.split(',') ?? [];
  return keyArray.length ? keyArray[Math.floor(Math.random() * keyArray.length)] : '';
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { DEEPL_FREE_API } = process.env;
    const deepFreeApiUrl = DEEPL_FREE_API || DEFAULT_DEEPL_FREE_API;
    const deeplApiUrl = deepFreeApiUrl;
    const deeplAuthKey = getDeepLAPIKey(process.env['DEEPL_FREE_API_KEYS']);

    const body = await request.json();
    const {
      text,
      source_lang: sourceLang = 'auto',
      target_lang: targetLang = 'en',
    } = body;
    
    const result = await deeplQuery({
      text: text[0] ?? '',
      sourceLang,
      targetLang,
    });
    
    return NextResponse.json(result, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error proxying DeepL request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 