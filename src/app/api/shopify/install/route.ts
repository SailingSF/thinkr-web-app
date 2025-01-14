import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Construct the OAuth URL
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/callback`;
  const scopes = [
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_customers',
    'write_customers',
    'read_inventory',
    'write_inventory',
    'read_analytics'
  ].join(',');

  const installUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID!,
    scope: scopes,
    redirect_uri: redirectUri,
    state: Buffer.from(JSON.stringify({ shop, host })).toString('base64'),
  }).toString();

  return NextResponse.redirect(installUrl);
} 