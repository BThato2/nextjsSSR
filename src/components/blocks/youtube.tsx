import { extractSrcFromIframe, isValidYouTubeEmbedUrl } from "@/helpers/block";
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
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { type BlockBase } from "interfaces/Block";
import { useEffect, useState } from "react";

export const youtubeBlock = createReactBlockSpec({
  type: "youtube",
  propSchema: {
    ...defaultProps,
    youtubeUrl: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <YoutubeBlockView
        blockBase={block as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <InlineContent />
    </>
  ),
});

// Creates a slash menu item for inserting an image block.
export const insertYoutubeBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { youtube: typeof youtubeBlock }
> = {
  name: "Insert a Youtube",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "youtube",
          props: {
            youtubeUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["youtube", "tube", "video"],
  group: "Media",
  icon: <FontAwesomeIcon icon={faYoutube} />,
  hint: "Adds a Youtube embed from url.",
};

type CSBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const YoutubeBlockView = ({ blockBase, editor }: CSBProps) => {
  const [inputUrl, setInputUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    setInputUrl(blockBase?.props?.youtubeUrl ?? "");
  }, [blockBase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isValidYouTubeEmbedUrl(blockBase?.props?.youtubeUrl ?? ""))
        editor.updateBlock(blockBase, {
          ...blockBase,
          props: {
            ...blockBase.props,
            // @ts-ignore
            youtubeUrl: inputUrl,
          },
        });
    }, 500);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputUrl, blockBase]);

  return isValidYouTubeEmbedUrl(blockBase?.props?.youtubeUrl ?? "") ? (
    <>
      <iframe
        src={blockBase.props.youtubeUrl}
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
        placeholder="Paste Youtube embed URL..."
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
        <div className="text-red-500">Invalid Youtube embed URL</div>
      )}
    </div>
  );
};

export const youtubeBlockSchema = { youtube: youtubeBlock };
