import { api } from "@/utils/api";
import { type BlockNoteEditor } from "@blocknote/core";
import { useRouter } from "next/router";
import { type ReactNode, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { type Block } from "interfaces/Block";
import { isEqual } from "lodash";
import { isRichTextBlock } from "@/helpers/block";

const ChapterEditorLayoutR = dynamic(
  () => import("@/components/layouts/chapterEditor"),
  {
    ssr: false,
  },
);

const Editor = dynamic(() => import("@/components/BlockEditor"), {
  ssr: false,
});

const ChapterEditor = () => {
  const router = useRouter();
  const { chapter_id: chapterId } = router.query as {
    chapter_id: string;
    id: string;
  };
  const refChapterId = useRef<string>();

  const { data: chapter } = api.courseSectionChapter.get.useQuery({
    chapterId: chapterId,
  });

  const [blocksInit, setBlocksInit] = useState<
    { chapterId: string; blocks: Block[] } | undefined
  >(undefined);

  const { mutateAsync: saveBlocks } =
    api.courseSectionChapter.saveBlocks.useMutation();

  // const { data: course } = api.course.get.useQuery({
  //   id: courseId
  // });

  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  const { view: viewing } = router.query as { view?: boolean };

  const [debouncedBlocks, setDebouncedBlocks] = useState<
    { chapterId: string; blocks: Block[] } | undefined
  >(undefined);

  const saved = isEqual(blocksInit, debouncedBlocks);

  useEffect(() => {
    if (
      editor &&
      !!chapter &&
      chapterId === chapter?.id &&
      !blocksInit &&
      editor.topLevelBlocks.length > 0 &&
      !!editor.topLevelBlocks &&
      !!editor.topLevelBlocks[0] &&
      editor.getBlock(editor.topLevelBlocks[0]?.id ?? "")
    ) {
      const initData = {
        chapterId: chapter?.id,
        blocks: chapter?.blocks,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      editor.replaceBlocks(editor.topLevelBlocks, initData.blocks as any);
      setBlocksInit(initData);
    }
  }, [chapter, blocksInit, editor, chapterId]);

  useEffect(() => {
    setBlocksInit(undefined);
    setDebouncedBlocks(undefined);
    clearTimeout(timer.current);
    refChapterId.current = chapterId;
  }, [chapterId, viewing]);

  useEffect(() => {
    if (
      blocksInit &&
      debouncedBlocks &&
      chapterId &&
      blocksInit.chapterId === debouncedBlocks.chapterId &&
      chapterId === debouncedBlocks.chapterId
    ) {
      if (!saved)
        void saveBlocks(
          {
            blocks: debouncedBlocks.blocks,
            chapterId: debouncedBlocks.chapterId,
          },
          {
            onSuccess: (updatedChapter) => {
              if (updatedChapter) {
                setBlocksInit({
                  chapterId: updatedChapter?.id,
                  blocks: updatedChapter?.blocks,
                });
              }
              void ctx.courseSectionChapter.get.invalidate();
            },
          },
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBlocks, blocksInit, chapterId, saved]);

  const timer = useRef<NodeJS.Timeout>();

  const ctx = api.useContext();

  const handleEditorChange = (innerEditor: BlockNoteEditor) => {
    const chapterId = refChapterId?.current ?? "";
    const getHtmlAttachedBlocks = async () => {
      return await Promise.all(
        innerEditor?.topLevelBlocks.map(async (block, position) => ({
          ...block,
          position,
          html: isRichTextBlock(block.type)
            ? (await innerEditor?.blocksToHTML([block])) ?? ""
            : "",
        })) ?? [],
      );
    };

    const debouncedTimer = (chapterId: string) => {
      clearTimeout(timer.current);

      timer.current = setTimeout(() => {
        void getHtmlAttachedBlocks().then((blocksWithHtml) => {
          if (chapterId)
            setDebouncedBlocks({
              blocks: blocksWithHtml.map((b) => ({
                ...b,
                chapterId,
              })),
              chapterId,
            });
        }); // Update the state after the debounce time
      }, 5000);
    };

    debouncedTimer(chapterId);
  };

  return (
    <div className="relative flex h-full w-full flex-col gap-2 overflow-y-auto bg-neutral-900 px-2 py-4">
      <div
        className={`w-full ${
          !blocksInit ? "h-0 overflow-y-hidden opacity-0" : ""
        }`}
      >
        <Editor
          onChange={handleEditorChange}
          setDynamicEditor={setEditor}
          editable={!viewing}
        />
      </div>
      {!blocksInit ? (
        <div className="flex w-full flex-col gap-4 px-12">
          <div className="h-80 w-full animate-pulse rounded-lg bg-neutral-800" />
          <div className="h-6 w-2/3 animate-pulse rounded-full bg-neutral-800" />
          <div className="h-6 w-1/3 animate-pulse rounded-full bg-neutral-800" />
          <div className="h-6 w-2/5 animate-pulse rounded-full bg-neutral-800" />
          <div className="h-6 w-2/4 animate-pulse rounded-full bg-neutral-800" />
        </div>
      ) : (
        <></>
      )}
      {/* <pre className="h-full w-full overflow-x-hidden text-xs text-green-500">
        {JSON.stringify({ blocks: deboundedBlocks }, null, 2)}
      </pre>
      <pre className="h-full w-full overflow-x-hidden text-xs text-red-500">
        {JSON.stringify(blocksInit, null, 2)}
      </pre> */}
      {/* <pre className="h-full w-full overflow-x-hidden text-xs text-green-500">
        {JSON.stringify(editor?.topLevelBlocks, null, 2)}
      </pre> */}
      {/* <pre className="h-full w-full overflow-x-hidden text-xs text-red-500">
        {JSON.stringify(
          editor?.topLevelBlocks?.find((b) => b.type === "snippet"),
          null,
          2,
        )}
      </pre> */}
      {/* <pre className="h-full w-full overflow-x-hidden text-xs text-green-500">
        {JSON.stringify({ blocksInit, debouncedBlocks, chapterId }, null, 2)}
      </pre> */}
    </div>
  );
};

function ChapterEditorLayout(page: ReactNode) {
  return <ChapterEditorLayoutR>{page}</ChapterEditorLayoutR>;
}

ChapterEditor.getLayout = ChapterEditorLayout;

export default ChapterEditor;
