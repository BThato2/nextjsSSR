import { extractSrcFromIframe, isValidCodepenEmbedUrl } from "@/helpers/block";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCodepen } from "@fortawesome/free-brands-svg-icons";
import { type BlockBase } from "interfaces/Block";
import { useEffect, useState } from "react";

export const codepenBlock = createReactBlockSpec({
  type: "codepen",
  propSchema: {
    ...defaultProps,
    codepenUrl: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <CodepenBlockView
        blockBase={block as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <InlineContent />
    </>
  ),
});

// Creates a slash menu item for inserting an image block.
export const insertCodepenBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { codepen: typeof codepenBlock }
> = {
  name: "Insert a Codepen",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "codepen",
          props: {
            codepenUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["code", "codepen", "pen"],
  group: "Embeds",
  icon: <FontAwesomeIcon icon={faCodepen} />,
  hint: "Adds a Codepen embed from url.",
};

type CSBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const CodepenBlockView = ({ blockBase, editor }: CSBProps) => {
  const [inputUrl, setInputUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    setInputUrl(blockBase?.props?.codepenUrl ?? "");
  }, [blockBase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isValidCodepenEmbedUrl(blockBase?.props?.codepenUrl ?? ""))
        editor.updateBlock(blockBase, {
          ...blockBase,
          props: {
            ...blockBase.props,
            // @ts-ignore
            codepenUrl: inputUrl,
          },
        });
    }, 500);
    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputUrl, blockBase]);
  return isValidCodepenEmbedUrl(blockBase?.props?.codepenUrl ?? "") ? (
    <>
      <iframe
        src={blockBase.props.codepenUrl}
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
        placeholder="Paste Codepen embed URL..."
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
        <div className="text-red-500">Invalid Codepen embed URL</div>
      )}
    </div>
  );
};

export const codepenBlockSchema = { codepen: codepenBlock };
