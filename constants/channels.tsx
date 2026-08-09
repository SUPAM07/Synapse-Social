import { InstagramIcon, NewTwitterIcon, FacebookIcon, TiktokIcon, ThreadsIcon, YoutubeIcon, LinkedinIcon, BlueskyIcon } from '@hugeicons/core-free-icons'

export enum ChannelTypeEnum {
  TWITTER = "TWITTER",
  INSTAGRAM = "INSTAGRAM",
  THREADS = "THREADS",
  FACEBOOK = "FACEBOOK",
  LINKEDIN = "LINKEDIN",
  BLUESKY = "BLUESKY",
  YOUTUBE = "YOUTUBE",
  TIKTOK = "TIKTOK"
}

export const CHANNEL_TYPE_ICONS: Record<ChannelTypeEnum, any> = {
  [ChannelTypeEnum.TWITTER]: NewTwitterIcon,
  [ChannelTypeEnum.LINKEDIN]: LinkedinIcon,
  [ChannelTypeEnum.INSTAGRAM]: InstagramIcon,
  [ChannelTypeEnum.THREADS]: ThreadsIcon,
  [ChannelTypeEnum.FACEBOOK]: FacebookIcon,
  [ChannelTypeEnum.BLUESKY]: BlueskyIcon,
  [ChannelTypeEnum.YOUTUBE]: YoutubeIcon,
  [ChannelTypeEnum.TIKTOK]: TiktokIcon,
}

export const CHANNEL_TYPE_URLS: Record<ChannelTypeEnum, string> = {
  [ChannelTypeEnum.TWITTER]: "https://x.com",
  [ChannelTypeEnum.LINKEDIN]: "https://linkedin.com",
  [ChannelTypeEnum.INSTAGRAM]: "https://instagram.com",
  [ChannelTypeEnum.THREADS]: "https://threads.com",
  [ChannelTypeEnum.FACEBOOK]: "https://facebook.com",
  [ChannelTypeEnum.BLUESKY]: "https://bluesky.com",
  [ChannelTypeEnum.YOUTUBE]: "https://youtube.com",
  [ChannelTypeEnum.TIKTOK]: "https://tiktok.com",
}


export function getChannelUrl(type: ChannelTypeEnum | undefined) {
  if (!type) return ""
  return CHANNEL_TYPE_URLS[type]
}


export function getChannelIcon(type: ChannelTypeEnum | undefined) {
  if (!type) return null
  return CHANNEL_TYPE_ICONS[type]
}