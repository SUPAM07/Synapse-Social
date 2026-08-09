import { ChannelTypeEnum } from "@/constants/channels";
import { encrypt } from "@/lib/encryption";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { getOAuthProvider } from "@/lib/social-oauth";
import { getPkceCookieName } from "@/lib/social-oauth/pkce";
import { verifyOAuthState } from "@/lib/social-oauth/state";
import { OAuthProvider } from "@/lib/social-oauth/types";
import { NextRequest, NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

function buildRedirectUrl(
    appUrl: string,
    redirectTo: string,
    params: Record<string, string>) {

    const url = new URL(redirectTo, appUrl);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateParams = searchParams.get('state');
    const providerError = searchParams.get('error');

    if (!stateParams) {
        return buildRedirectUrl(APP_URL, '/settings', {
            connected: "false",
            error: "missing_state"
        });
    }
    try {
        const state = verifyOAuthState(stateParams);
        const redirectTo = state?.redirectTo || `${APP_URL}/settings`;
        const pkceCookieName = getPkceCookieName(stateParams);
        const codeVerifier = state.channelType === ChannelTypeEnum.TWITTER ? request.cookies.get(pkceCookieName)?.value : undefined

        if (providerError) {
            const response = buildRedirectUrl(APP_URL, redirectTo, {
                connected: "false",
                error: providerError
            })
            response.cookies.delete(pkceCookieName)
            return response
        }

        if (!code) {
            const response = buildRedirectUrl(APP_URL, redirectTo, {
                connected: "false",
                error: "missing_code"
            })
            response.cookies.delete(pkceCookieName)
            return response
        }

        const { insforge, userId } = await getInsforgeServerClient()

        if (!userId || userId !== state.userId) {
            const response = buildRedirectUrl(APP_URL, redirectTo, {
                connected: "false",
                error: "missing_user"
            })
            response.cookies.delete(pkceCookieName)
            return response
        }

        const provider = getOAuthProvider(state.channelType) as OAuthProvider;
        const redirectUri = `${APP_URL}/api/channel/callback`;

        const token = await provider.exchangeCodeForToken({
            code,
            redirectUri,
            codeVerifier
        })

        const profile = await provider.getProfile({
            accessToken: token.accessToken
        })

        console.log("callback", JSON.stringify(profile, null, 2))


        const payload = {
            user_id: state.userId,
            channel_type_id: state.channelTypeId,
            provider_account_id: profile.providerAccountId ?? null,
            handle: profile.handle ?? null,
            profile_image: profile.profileImage ?? null,
            access_token: encrypt(token.accessToken),
            refresh_token: encrypt(token.refreshToken ?? null),
            token_expires_at: token.expiresAt ?? null,
            is_connected: true,
            is_active: true,
        }

        const { error } = await insforge.database
            .from("user_channels")
            .upsert(payload, {
                onConflict: "user_id,channel_type_id"
            })

        if (error) {
            const response = buildRedirectUrl(APP_URL, redirectTo, {
                connected: "false",
                error: "failed_to_upsert_user_channel"
            })
            response.cookies.delete(pkceCookieName)
            return response
        }

        const response = buildRedirectUrl(APP_URL, redirectTo, {
            connected: "true",
            channelType: state.channelType,
        })
        response.cookies.delete(pkceCookieName)
        return response
    } catch (error) {
        console.error('OAuth callback error:', error);
        const response = buildRedirectUrl(APP_URL, '/settings', {
            connected: "false",
            error: "oauth_callback_failed"
        });
        
        const stateParams = new URL(request.url).searchParams.get('state');
        if (stateParams) {
            const pkceCookieName = getPkceCookieName(stateParams);
            response.cookies.delete(pkceCookieName);
        }
        return response;
    }
}
