import { isValidStackBlitzEmbedUrl } from "@/helpers/block";
import {
  defaultProps,
  type DefaultBlockSchema,
  type BlockNoteEditor,
} from "@blocknote/core";
import {
  type ReactSlashMenuItem,
  createReactBlockSpec,
  InlineContent,
} from "@blocknote/react";
import { BoltIcon } from "@heroicons/react/20/solid";
import { type BlockBase } from "interfaces/Block";
import { useEffect, useState } from "react";

export const StackBlitzBlock = createReactBlockSpec({
  type: "stackBlitz",
  propSchema: {
    ...defaultProps,
    stackBlitzUrl: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <StackBlitzBlockView
        blockBase={block as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <InlineContent />
    </>
  ),
});

// Creates a slash menu item for inserting an image block.
export const insertStackBlitzBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { stackBlitz: typeof StackBlitzBlock }
> = {
  name: "Insert a Stack Blitz",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "stackBlitz",
          props: {
            stackBlitzUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["code", "stackBlitz", "blitz"],
  group: "Embeds",
  icon: <BoltIcon className="w-4" />,
  hint: "Adds a Stack Blitz embed from url.",
};

type CSBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const StackBlitzBlockView = ({ blockBase, editor }: CSBProps) => {
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    setInputUrl(blockBase?.props?.stackBlitzUrl ?? "");
  }, [blockBase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isValidStackBlitzEmbedUrl(blockBase?.props?.stackBlitzUrl ?? ""))
        editor.updateBlock(blockBase, {
          ...blockBase,
          props: {
            ...blockBase.props,
            // @ts-ignore
            stackBlitzUrl: inputUrl,
          },
        });
    }, 500);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputUrl, blockBase]);

  return isValidStackBlitzEmbedUrl(blockBase?.props?.stackBlitzUrl ?? "") ? (
    <iframe
      src={blockBase.props.stackBlitzUrl}
      className="h-[30rem] w-full overflow-hidden rounded-lg border-none bg-neutral-800"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    ></iframe>
  ) : (
    <input
      className="w-full max-w-xl rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-1 outline-none"
      value={inputUrl}
      placeholder="Paste StackBlitz embed URL..."
      onChange={(e) => setInputUrl(e.target.value)}
    />
  );
};

export const stackBlitzBlockSchema = { stackBlitz: StackBlitzBlock };
