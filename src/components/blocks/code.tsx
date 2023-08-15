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
import CodeTextArea from "../CodeTextArea";
import { CodeBracketIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";

export const CodeBlock = createReactBlockSpec({
  type: "snippet",
  propSchema: {
    ...defaultProps,
    code: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <>
      <CodeBlockView
        blockBase={block as unknown as BlockBase}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        editor={editor as any}
      />
      <div className="hidden h-0 w-0 opacity-0">
        <InlineContent />
      </div>
    </>
  ),
});

export const insertCodeBlock: ReactSlashMenuItem<
  DefaultBlockSchema & { snippet: typeof CodeBlock }
> = {
  name: "Insert a Code block.",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "snippet",
          props: {
            code: "",
          },
        },
      ],
    );
  },
  aliases: ["code", "program", "snippet", "syntax", "language"],
  group: "Code",
  icon: <CodeBracketIcon className="w-4" />,
  hint: "Adds a Code Syntax block.",
};

type CBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const CodeBlockView = ({ blockBase, editor }: CBProps) => {
  const setCode = (code: string) => {
    editor.updateBlock(blockBase, {
      ...blockBase,
      props: {
        ...blockBase.props,
        // @ts-ignore
        code,
      },
    });
  };

  const router = useRouter();

  const viewing = !!(router.query as { view?: boolean }).view;

  return (
    <div className="relative w-full">
      <CodeTextArea
        code={blockBase?.props?.code ?? ""}
        setCode={setCode}
        editable={!viewing}
      />
    </div>
  );
};

export const codeBlockSchema = { snippet: CodeBlock };
