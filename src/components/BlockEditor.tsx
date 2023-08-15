"use client";
import {
  defaultBlockSchema,
  type BlockNoteEditor,
  type BlockSchema,
} from "@blocknote/core";
import {
  BlockNoteView,
  getDefaultReactSlashMenuItems,
  useBlockNote,
} from "@blocknote/react";
import "@blocknote/core/style.css";
import { type Dispatch, type SetStateAction, useEffect } from "react";
import { insertVideo, videoBlockSchema } from "./blocks/video";
import {
  codeSandboxBlockSchema,
  insertCodeSandBoxBlock,
} from "./blocks/codeSandBox";
import { codeBlockSchema, insertCodeBlock } from "./blocks/code";
import {
  insertStackBlitzBlock,
  stackBlitzBlockSchema,
} from "./blocks/stackBlitz";
import { figmaBlockSchema, insertFigmaBlock } from "./blocks/figma";
import { codepenBlockSchema, insertCodepenBlock } from "./blocks/codepen";
import { youtubeBlockSchema, insertYoutubeBlock } from "./blocks/youtube";
import { replitBlockSchema, insertReplitBlock } from "./blocks/replit";

// Our <Editor> component that we can now use
// eslint-disable-next-line @typescript-eslint/no-explicit-any

const customSchema = {
  // Adds all default blocks.
  ...defaultBlockSchema,
  // Adds the custom image block.
  ...videoBlockSchema,
  ...codeSandboxBlockSchema,
  ...stackBlitzBlockSchema,
  ...figmaBlockSchema,
  ...codeBlockSchema,
  ...codepenBlockSchema,
  ...youtubeBlockSchema,
  ...replitBlockSchema,
} satisfies BlockSchema;

const Editor = ({
  onChange,
  setDynamicEditor,
  editable,
}: {
  onChange: (editor: BlockNoteEditor) => void;
  setDynamicEditor: Dispatch<SetStateAction<BlockNoteEditor | null>>;
  editable: boolean;
}) => {
  const editor = useBlockNote(
    {
      onEditorContentChange: onChange,
      editable,
      theme: "dark",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      blockSchema: customSchema as any,
      slashMenuItems: [
        ...getDefaultReactSlashMenuItems(customSchema),
        insertVideo,
        insertStackBlitzBlock,
        insertCodeSandBoxBlock,
        insertFigmaBlock,
        insertCodepenBlock,
        insertCodeBlock,
        insertYoutubeBlock,
        insertReplitBlock,
      ],
    },
    [editable],
  );

  useEffect(() => {
    if (editor) setDynamicEditor(editor);
  }, [editor, setDynamicEditor]);

  // useEffect(() => {
  //   refViewing.current = viewing;
  //   console.log("viewing", viewing, refViewing.current);
  // }, [viewing]);

  return (
    <div data-theme="dark" className="w-full">
      <BlockNoteView editor={editor} />
    </div>
  );
};

export default Editor;
