import { prisma } from "@/src/lib/prisma";

export type InstagramEmbedItem = {
  id: string;
  title: string | null;
  permalink: string;
  embedUrl: string;
  sortOrder: number;
};

const INSTAGRAM_PERMALINK_PATTERN =
  /https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)(?:\/|[?&#]|$)/i;

export function extractInstagramPermalink(input: string) {
  const match = input.match(INSTAGRAM_PERMALINK_PATTERN);
  if (!match) {
    return null;
  }

  const kind = match[1].toLowerCase();
  const code = match[2];
  return `https://www.instagram.com/${kind}/${code}/`;
}

export function toInstagramEmbedUrl(permalink: string) {
  return `${permalink}embed`;
}

export async function getActiveInstagramEmbeds(): Promise<InstagramEmbedItem[]> {
  const embeds = await prisma.instagramEmbed.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      permalink: true,
      sortOrder: true,
    },
  });

  return embeds.map((item) => ({
    ...item,
    embedUrl: toInstagramEmbedUrl(item.permalink),
  }));
}

