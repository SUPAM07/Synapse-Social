import { ChannelTypeEnum } from "@/constants/channels";
import { OAuthProvider, OAuthTokenResponse } from "./types";

function getEnv(key: string) {
  const value = process.env[key]
  if (!value) throw new Error(`${key} is missing.`)
  return value
}

function getConfig(type:ChannelTypeEnum) {
    return {
        authUrl: getEnv(`${type}_AUTH_URL`),
        tokenUrl: getEnv(`${type}_TOKEN_URL`),
        profileUrl: getEnv(`${type}_PROFILE_URL`),
        clientId: getEnv(`${type}_CLIENT_ID`),
        clientSecret: getEnv(`${type}_CLIENT_SECRET`),
        scope: getEnv(`${type}_SCOPES`).split(',').map(s => s.trim()).filter(Boolean),
    }
}



async function requestToken(
    type:ChannelTypeEnum,
    body: URLSearchParams,
){
    const config = getConfig(type);
const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  }

  if(type === ChannelTypeEnum.TWITTER && config.clientSecret){
     const auth_header = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
     headers.Authorization = `Basic ${auth_header}`
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body,
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || `Token exchange failed: ${response.statusText}`)
  }

  return data
}


function createProvider(type:ChannelTypeEnum,opts: { pkce?: boolean} = {}): OAuthProvider {
   return {
    type,
    getAuthorizationUrl: ({state, redirectUri, codeChallenge, codeChallengeMethod}) => {
       const config = getConfig(type)
       // Build authorization URL with query parameters
       const params = new URLSearchParams({
         client_id: config.clientId,
         redirect_uri: redirectUri,
         response_type: 'code',
         scope: config.scope.join(' '),
         state,
       })
       if (opts.pkce && codeChallenge && codeChallengeMethod) {
         params.append('code_challenge', codeChallenge)
         params.append('code_challenge_method', codeChallengeMethod)
       }
       return `${config.authUrl}?${params.toString()}`
    },
    exchangeCodeForToken: async ({ code, redirectUri, codeVerifier }):Promise<OAuthTokenResponse> => {
       const params = new URLSearchParams({
         grant_type: 'authorization_code',
         code,
         redirect_uri: redirectUri,
         client_id: getConfig(type).clientId,
       })

       if(!opts.pkce){
         params.append('client_secret', getConfig(type).clientSecret)
       }
       if(codeVerifier){
         params.append('code_verifier', codeVerifier)
       }

       const data = await requestToken(type, params)

       const seconds = Number(data.expires_in)
       const expiresAt = seconds > 0 ? new Date(Date.now() + seconds * 1000).toISOString(): null

       return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
       }
      
    },
    refreshToken: async ({ refreshToken, redirectUri }) => {
      const config = getConfig(type);
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
      })

      if(config.clientSecret){
        params.append('client_secret', config.clientSecret)
      }
      if(redirectUri){
        params.append('redirect_uri', redirectUri)
      }

      const data = await requestToken(type, params)
      
      const seconds = Number(data.expires_in)
      const expiresAt = seconds > 0 ? new Date(Date.now() + seconds * 1000).toISOString(): null
      
      return {
       accessToken: data.access_token,
       refreshToken: data.refresh_token ?? null,
       expiresAt,
      }
    },
    getProfile: async ({ accessToken }) => {
      const config = getConfig(type);
      const response = await fetch(config.profileUrl,{
        headers:{
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
        }
      })
      if(!response.ok){
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()

      const profileData = data?.data ?? data?.user ?? data
      const providerAccountId = profileData?.id ?? profileData?.sub ?? profileData?.user_id ?? null;
      
      const handle = profileData?.username ?? profileData?.screen_name ?? profileData?.handle  ?? profileData?.name ?? null;

      const profileImage = profileData?.thread_profile_picture ?? profileData?.profile_image_url ?? profileData?.avatar_url ?? profileData?.profile_image ?? profileData?.picture?.data?.url ?? profileData?.picture?.url ?? profileData?.picture ?? null

      console.log(providerAccountId, handle, "providerAccountId")
     
      return {
        providerAccountId,
        handle,
        profileImage,
      }
    },
   }
}


const PROVIDERS: Record<ChannelTypeEnum, any> = {
    [ChannelTypeEnum.TWITTER]: createProvider(ChannelTypeEnum.TWITTER,{ pkce: true }),
    [ChannelTypeEnum.LINKEDIN]: createProvider(ChannelTypeEnum.LINKEDIN),
    [ChannelTypeEnum.INSTAGRAM]: createProvider(ChannelTypeEnum.INSTAGRAM),
    [ChannelTypeEnum.FACEBOOK]: createProvider(ChannelTypeEnum.FACEBOOK),
    [ChannelTypeEnum.THREADS]: createProvider(ChannelTypeEnum.THREADS),
    [ChannelTypeEnum.BLUESKY]: createProvider(ChannelTypeEnum.BLUESKY),
    [ChannelTypeEnum.YOUTUBE]: createProvider(ChannelTypeEnum.YOUTUBE),
    [ChannelTypeEnum.TIKTOK]: createProvider(ChannelTypeEnum.TIKTOK),
}

export function getOAuthProvider(type:ChannelTypeEnum) {
   return PROVIDERS[type];
}

export async function refreshOauthToken(
  type:ChannelTypeEnum,
  refreshToken:string,
  redirectUri:string,
){
  console.log("refreshing token", type, refreshToken, redirectUri)
  const provider = getOAuthProvider(type);
  if(!provider.refreshToken){
    throw new Error('Refresh token not supported for this provider');
  }
  const result = await provider.refreshToken({refreshToken, redirectUri});
  return result;
}
