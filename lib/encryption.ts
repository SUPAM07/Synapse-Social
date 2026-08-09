import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

const ENCRYPTION_KEY = process.env.CHANNEL_TOKEN_ENCRYPTION_KEY!
if(!ENCRYPTION_KEY){
    throw new Error("CHANNEL_TOKEN_ENCRYPTION_KEY is not defined")
}

export function encrypt(text: string | null | undefined){
    if(!text) return null
     const iv = randomBytes(12);

     const encryptionKey = createHash("sha256").update(ENCRYPTION_KEY).digest();
     const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv)

     const encryted = Buffer.concat([
        cipher.update(text, "utf-8"),
        cipher.final()
     ])

     const tag = cipher.getAuthTag()

     const result = [iv.toString("base64url"), tag.toString("base64url"), encryted.toString("base64url")].join(".")
    return result
}

export function decrypt(encrypted: string | null | undefined){
    if(!encrypted) return null;

    const [iv, tag, encryted] = encrypted.split(".")

    if(!iv || !tag || !encryted) return null;

    const encryptionKey = createHash("sha256").update(ENCRYPTION_KEY).digest()

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey, Buffer.from(iv, "base64url"))

    decipher.setAuthTag(Buffer.from(tag, "base64url"))
    
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryted, "base64url")),
        decipher.final()
    ])
    return decrypted.toString("utf-8")
}