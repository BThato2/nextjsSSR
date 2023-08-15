import { extractSrcFromIframe, isValidFigmaEmbedUrl } from "@/helpers/block";
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
import { Square3Stack3DIcon } from "@heroicons/react/20/solid";
import { type BlockBase } from "interfaces/Block";
import { useEffect, useState } from "react";

export const FigmaBlock = createReactBlockSpec({
  type: "figma",
  propSchema: {
    ...defaultProps,
    figmaUrl: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <FigmaBlockView
        blockBase={block as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <InlineContent />
    </>
  ),
});

// Creates a slash menu item for inserting an image block.
export const insertFigmaBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { figma: typeof FigmaBlock }
> = {
  name: "Insert a Figma Design",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "figma",
          props: {
            figmaUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["design", "figma"],
  group: "Embeds",
  icon: <Square3Stack3DIcon className="w-4" />,
  hint: "Adds a Figma embed from url.",
};

type CSBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const FigmaBlockView = ({ blockBase, editor }: CSBProps) => {
  const [inputUrl, setInputUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    setInputUrl(blockBase?.props?.figmaUrl ?? "");
  }, [blockBase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isValidFigmaEmbedUrl(blockBase?.props?.figmaUrl ?? ""))
        editor.updateBlock(blockBase, {
          ...blockBase,
          props: {
            ...blockBase.props,
            // @ts-ignore
            figmaUrl: inputUrl,
          },
        });
    }, 500);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputUrl, blockBase]);

  return isValidFigmaEmbedUrl(blockBase?.props?.figmaUrl ?? "") ? (
    <iframe
      src={blockBase.props.figmaUrl}
      className="h-[30rem] w-full overflow-hidden rounded-lg border-none bg-neutral-800"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    ></iframe>
  ) : (
    <div className="flex items-center gap-2">
      <input
        className="w-full max-w-xl rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-1 outline-none"
        value={inputUrl}
        placeholder="Paste Figma embed URL..."
        onChange={(e) => {
          const url = extractSrcFromIframe(e.target.value);
          if (!url) {
            setIsValidUrl(false);
            return;
          }
          setInputUrl(url);
        }}
      />
      {!isValidUrl && (
        <div className="text-red-500">Invalid Figma embed URL</div>
      )}
    </div>
  );
};

export const figmaBlockSchema = { figma: FigmaBlock };
