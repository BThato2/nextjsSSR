"use client";
import { type BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import { type Dispatch, type SetStateAction, useEffect } from "react";

// Our <Editor> component that we can now use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RichTextEditor = ({
  onChange,
  setDynamicEditor,
}: {
  onChange: (editor: BlockNoteEditor) => void;
  setDynamicEditor: Dispatch<SetStateAction<BlockNoteEditor | null>>;
}) => {
  const editor: BlockNoteEditor | null = useBlockNote({
    onEditorContentChange: onChange,
    theme: "dark",
  });

  useEffect(() => {
    if (editor) setDynamicEditor(editor);
  }, [editor, setDynamicEditor]);

  return <BlockNoteView editor={editor} />;
};

export default RichTextEditor;
