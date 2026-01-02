import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    // Use localhost callback for local development, production URL otherwise
    const isLocal = request.headers.get('host')?.includes('localhost');
    const callbackUrl = isLocal 
      ? `${request.nextUrl.protocol}//${request.headers.get('host')}/api/callback`
      : process.env.TWITTER_CALLBACK_URL;

    if (!clientId || !callbackUrl) {
      console.error('Missing Twitter OAuth 2.0 configuration', { clientId: !!clientId, callbackUrl: !!callbackUrl });
      return new NextResponse('Missing Twitter OAuth 2.0 configuration', { status: 500 });
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Build OAuth 2.0 authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', randomBytes(16).toString('base64url'));

    const response = NextResponse.redirect(authUrl.toString());

    // Store code verifier in cookie for later use in callback
    response.cookies.set('oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error generating OAuth 2.0 authorization URL:', error);
    return new NextResponse('Error generating authentication link', { status: 500 });
  }
}