import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import pool from '@/lib/db';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    console.error('OAuth 2.0 error:', error, errorDescription);
    return new NextResponse(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`, { status: 400 });
  }

  const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;

  if (!code) {
    console.error('Missing authorization code in callback', { 
      url: url.toString(),
      searchParams: Object.fromEntries(url.searchParams.entries())
    });
    return new NextResponse('Missing authorization code', { status: 400 });
  }

  if (!codeVerifier) {
    console.error('Missing code verifier cookie', { 
      cookies: request.cookies.getAll().map(c => c.name),
      url: url.toString()
    });
    return new NextResponse('Missing code verifier. Please try authenticating again.', { status: 400 });
  }

  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    // Use the actual callback URL that was used (from request)
    const isLocal = request.headers.get('host')?.includes('localhost');
    const callbackUrl = isLocal
      ? `${request.nextUrl.protocol}//${request.headers.get('host')}${request.nextUrl.pathname}`
      : process.env.TWITTER_CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      console.error('Missing Twitter OAuth 2.0 configuration');
      return new NextResponse('Missing Twitter OAuth 2.0 configuration', { status: 500 });
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: callbackUrl,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!access_token) {
      console.error('No access token received', tokenResponse.data);
      return new NextResponse('Failed to obtain access token', { status: 500 });
    }

    // Create Twitter API client with OAuth 2.0 access token
    const client = new TwitterApi(access_token);

    // Get user information
    const userData = await client.v2.me({
      'user.fields': ['name', 'username', 'profile_image_url'],
    });

    const userId = userData.data.id;
    const displayName = userData.data.name || '';
    const username = userData.data.username || '';
    const profileImageUrl = userData.data.profile_image_url || '';

    // Calculate token expiration time
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Store tokens in database
    const insertQuery = `
      INSERT INTO users (
        twitter_user_id, display_name, twitter_username, profile_image_url, 
        twitter_access_token, twitter_refresh_token, twitter_token_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (twitter_user_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        twitter_username = EXCLUDED.twitter_username,
        profile_image_url = EXCLUDED.profile_image_url,
        twitter_access_token = EXCLUDED.twitter_access_token,
        twitter_refresh_token = EXCLUDED.twitter_refresh_token,
        twitter_token_expires_at = EXCLUDED.twitter_token_expires_at
      `;

    await pool.query(insertQuery, [
        userId,
      displayName,
      username,
      profileImageUrl,
      access_token,
      refresh_token || null,
      expiresAt,
    ]);

      const response = NextResponse.redirect(new URL('/', request.url));

      response.cookies.set('twitter_user_id', userId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

    response.cookies.delete('oauth_code_verifier');

      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
  } catch (error: any) {
    console.error('Error during OAuth 2.0 callback:', error.response?.data || error.message);
    return new NextResponse('Error during authentication callback', { status: 500 });
  }
}