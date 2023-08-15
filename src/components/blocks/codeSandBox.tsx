import { isValidCodeSandboxEmbedUrl } from "@/helpers/block";
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
import { CubeIcon } from "@heroicons/react/24/outline";
import { type BlockBase } from "interfaces/Block";
import { useEffect, useState } from "react";

export const CodeSandBoxBlock = createReactBlockSpec({
  type: "codeSandBox",
  propSchema: {
    ...defaultProps,
    sandBoxUrl: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <CodeSandBoxBlockView
        blockBase={block as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <InlineContent />
    </>
  ),
});

// Creates a slash menu item for inserting an image block.
export const insertCodeSandBoxBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { codeSandBox: typeof CodeSandBoxBlock }
> = {
  name: "Insert a Code Sandbox",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "codeSandBox",
          props: {
            sandBoxUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["code", "codesandbox", "sandbox", "sand"],
  group: "Embeds",
  icon: <CubeIcon className="w-4" />,
  hint: "Adds a Code Sandbox embed from url.",
};

type CSBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const CodeSandBoxBlockView = ({ blockBase, editor }: CSBProps) => {
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    setInputUrl(blockBase?.props?.sandBoxUrl ?? "");
  }, [blockBase]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!isValidCodeSandboxEmbedUrl(blockBase?.props?.sandBoxUrl ?? ""))
        editor.updateBlock(blockBase, {
          ...blockBase,
          props: {
            ...blockBase.props,
            // @ts-ignore
            sandBoxUrl: inputUrl,
          },
        });
    }, 500);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputUrl, blockBase]);

  return isValidCodeSandboxEmbedUrl(blockBase?.props?.sandBoxUrl ?? "") ? (
    <iframe
      src={blockBase.props.sandBoxUrl}
      className="h-[30rem] w-full overflow-hidden rounded-lg border-none bg-neutral-800"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    ></iframe>
  ) : (
    <input
      className="w-full max-w-xl rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-1 outline-none"
      value={inputUrl}
      placeholder="Paste Code Sandbox embed URL..."
      onChange={(e) => setInputUrl(e.target.value)}
    />
  );
};

export const codeSandboxBlockSchema = { codeSandBox: CodeSandBoxBlock };
