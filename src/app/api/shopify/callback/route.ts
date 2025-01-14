import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state');
  const hmac = searchParams.get('hmac');

  if (!code || !shop || !state || !hmac) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // Verify the state parameter
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { host } = decodedState;

    // Verify the HMAC
    const message = Object.entries(Object.fromEntries(searchParams))
      .filter(([key]) => key !== 'hmac')
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('&');

    const generatedHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET!)
      .update(message)
      .digest('hex');

    if (generatedHash !== hmac) {
      return NextResponse.json({ error: 'HMAC validation failed' }, { status: 400 });
    }

    // Exchange the authorization code for an access token
    const accessTokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!accessTokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await accessTokenResponse.json();

    // Store the access token and shop information in your backend
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shopify/connect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${req.cookies.get('auth_token')?.value}`,
      },
      body: JSON.stringify({
        shop_domain: shop,
        access_token,
      }),
    });

    if (!backendResponse.ok) {
      throw new Error('Failed to store access token');
    }

    // Redirect back to the app with the host parameter
    const redirectUrl = host
      ? `https://${host}/apps/${process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID}`
      : '/dashboard';

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OAuth callback failed' },
      { status: 500 }
    );
  }
} 