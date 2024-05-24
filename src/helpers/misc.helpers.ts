import config from "~/config";

export function getResizedImage(imageUrl: string, size = 640) {
  if (!imageUrl) return 'https://paramlabs.fra1.cdn.digitaloceanspaces.com/static/broken-image.png';
  return `${config.publicUrl}/resizer/url=${encodeURIComponent(
    Buffer.from(imageUrl).toString('base64'),
  )}&w=${size}`;
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
