import { type RichTextBlock } from "interfaces/Block";

export const blocksToHTML = (blocks: RichTextBlock[]) => {
  let HTML = "";

  if (blocks)
    blocks.forEach((block) => {
      HTML += blockToHTML(block);
    });

  return HTML;
};

export const blockToHTML = (block: RichTextBlock) => {
  if (block._html) return block._html;

  return "";
};
