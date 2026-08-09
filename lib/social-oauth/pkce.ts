import { createHash, randomBytes } from "crypto"

export function createPkcePair() {
    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

    return { 
        codeVerifier, 
        codeChallenge,
        codeChallengeMethod: 'S256'
    }
}

export function getPkceCookieName(state: string) {
    const digest = createHash('sha256').update(state).digest('hex')
    return `oauth_pkce_${digest}`
}
