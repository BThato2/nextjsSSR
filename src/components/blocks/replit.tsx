import { isValidReplitEmbedUrl } from "@/helpers/block";
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
import { type BlockBase } from "interfaces/Block";
import { useEffect, useState } from "react";
import { CommandLineIcon } from "@heroicons/react/20/solid";

export const replitBlock = createReactBlockSpec({
  type: "replit",
  propSchema: {
    ...defaultProps,
    replitUrl: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <ReplitBlockView
        blockBase={block as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <InlineContent />
    </>
  ),
});

// Creates a slash menu item for inserting an image block.
export const insertReplitBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { replit: typeof replitBlock }
> = {
  name: "Insert a Replit",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "replit",
          props: {
            replitUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["replit", "code", "repl"],
  group: "Embeds",
  icon: <CommandLineIcon className="w-4" />,
  hint: "Adds a Replit embed from url.",
};

type CSBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const ReplitBlockView = ({ blockBase, editor }: CSBProps) => {
  const [inputUrl, setInputUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    setInputUrl(blockBase?.props?.replitUrl ?? "");
  }, [blockBase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isValidReplitEmbedUrl(blockBase?.props?.replitUrl ?? ""))
        editor.updateBlock(blockBase, {
          ...blockBase,
          props: {
            ...blockBase.props,
            // @ts-ignore
            replitUrl: inputUrl,
          },
        });
    }, 500);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputUrl, blockBase]);

  return isValidReplitEmbedUrl(blockBase?.props?.replitUrl ?? "") ? (
    <>
      <iframe
        src={blockBase.props.replitUrl}
        className="h-[30rem] w-full overflow-hidden rounded-lg border-none bg-neutral-800"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      ></iframe>
    </>
  ) : (
    <div className="flex items-center gap-2">
      <input
        className="w-full max-w-xl rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-1 outline-none"
        value={inputUrl}
        placeholder="Paste Replit embed URL..."
        onChange={(e) => {
          const url = `${e.target.value}?embed=true`;
          if (!url) {
            setIsValidUrl(false);
            return;
          }
          setInputUrl(url);
        }}
      />
      {!isValidUrl && (
        <div className="text-red-500">Invalid Replit embed URL</div>
      )}
    </div>
  );
};

export const replitBlockSchema = { replit: replitBlock };
