import { type InlineContent } from "@blocknote/core";
import { z } from "zod";

export type RichTextBlock = {
  id: string;
  type: PARAGRAPH | HEADING | BULLETLISTITEM | NUMBEREDLISTITEM;
  props: Record<string, string>;
  content: InlineContent[];
  children: BlockBase[];
  _html?: string;
};

export type BlockBase = {
  id: string;
  type:
    | PARAGRAPH
    | HEADING
    | BULLETLISTITEM
    | NUMBEREDLISTITEM
    | VIDEO
    | CODESANDBOX
    | FIGMA
    | STACKBLITZ
    | SNIPPET
    | CODEPEN
    | YOUTUBE
    | REPLIT;
  props: Record<string, string>;
  content: InlineContent[];
  children: BlockBase[];
};

export type Block = BlockBase & {
  position: number;
  html?: string;
  chapterId: string;
};

type PARAGRAPH = "paragraph";
type HEADING = "heading";
type BULLETLISTITEM = "bulletListItem";
type NUMBEREDLISTITEM = "numberedListItem";
type VIDEO = "video";
type CODESANDBOX = "codeSandBox";
type STACKBLITZ = "stackBlitz";
type FIGMA = "figma";
type SNIPPET = "snippet";
type CODEPEN = "codepen";
type YOUTUBE = "youtube";
type REPLIT = "replit";

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "paragraph",
    "heading",
    "bulletListItem",
    "numberedListItem",
    "video",
    "codeSandBox",
    "figma",
    "stackBlitz",
    "snippet",
    "codepen",
    "youtube",
    "replit",
  ]),
  props: z.record(z.string()),
  content: z.unknown(),
  children: z.array(z.unknown()),
  html: z.string().optional(),
  chapterId: z.string(),
  position: z.number(),
});
