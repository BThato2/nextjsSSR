import { BlockType } from "@prisma/client";

export const isRichTextBlock = (blockType: string) => {
  return (
    blockType === BlockType.paragraph ||
    blockType === BlockType.heading ||
    blockType === BlockType.bulletListItem ||
    blockType === BlockType.numberedListItem
  );
};

export const isValidCodeSandboxEmbedUrl = (url: string): boolean => {
  const pattern = /^(https:\/\/codesandbox\.io\/embed\/)(\w+)/;
  return pattern.test(url);
};

export const isValidStackBlitzEmbedUrl = (url: string): boolean => {
  const stackBlitzRegex =
    /^https:\/\/stackblitz\.com\/(?:edit|embed)\/(?:@[\w-]+\/)?[\w-]+\?(?:.*&)?embed=1/;
  return stackBlitzRegex.test(url);
};

export const extractSrcFromIframe = (iframeCode: string): string | null => {
  const srcRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/;
  const match = iframeCode.match(srcRegex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

export const isValidFigmaEmbedUrl = (url: string): boolean => {
  const figmaEmbedRegex =
    /^https:\/\/www\.figma\.com\/embed\?embed_host=share&url=/;
  return figmaEmbedRegex.test(url);
};

export const isValidCodepenEmbedUrl = (url: string): boolean => {
  const codepenEmbedRegex =
    /^https:\/\/codepen\.io\/[^\/]+\/embed\/[^\/?#?]+(\?.*)?$/;
  return codepenEmbedRegex.test(url);
};

// export const isValidYouTubeEmbedUrl = (url: string): boolean => {
//   const youTubeEmbedRegex =
//     /^https:\/\/www\.youtube\.com\/embed\/[^\/?#?]+(\?.*)?$/;
//   return youTubeEmbedRegex.test(url);
// };

export const isValidYouTubeEmbedUrl = (url: string): boolean => {
  const youTubeEmbedRegex =
    /^https:\/\/www\.youtube\.com\/(embed\/[^\/?#?]+|watch\?v=[^\/?#&]+)(\?.*)?$/;
  return youTubeEmbedRegex.test(url);
};

export const isValidReplitEmbedUrl = (url: string): boolean => {
  const replitEmbedRegex = /^https:\/\/replit\.com\/@[^\/]+\/[^\/?#?]+(\?.*)?$/;
  return replitEmbedRegex.test(url);
};
