import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import { api } from "@/utils/api";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars2Icon,
  EyeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { type CourseSection, type BlocksChapter } from "@prisma/client";
import {
  type KeyboardEvent,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  useState,
} from "react";
import { Loader } from "./Loader";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import Link from "next/link";
// import Link from "next/link";

type Props = {
  chapter: BlocksChapter;
  setDeleteChapterIdx: Dispatch<SetStateAction<{ cIdx: number; sIdx: number }>>;
  cIdx: number;
  sIdx: number;
  id: string;
  titleLimit: number;
  getPrevAccumulatedChapters: (sectionIdx: number) => number;
  setSections: Dispatch<
    SetStateAction<
      (CourseSection & {
        _count: { chapters: number };
        chapters: BlocksChapter[];
      })[]
    >
  >;
  sections: (CourseSection & {
    _count: { chapters: number };
    chapters: BlocksChapter[];
  })[];
};

const ChapterManageItem = ({
  chapter,
  setDeleteChapterIdx,
  cIdx,
  sIdx,
  id,
  titleLimit,
  getPrevAccumulatedChapters,
  sections,
  setSections,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const [editChapterTitle, setEditChapterTitle] = useState<string | undefined>(
    undefined,
  );

  const router = useRouter();
  const { id: courseId } = router.query as { id: string };

  const { data: course } = api.course.get.useQuery({
    id: courseId,
  });

  const {
    mutateAsync: editChapterTitleMutation,
    isLoading: editingChapterTitle,
  } = api.courseSection.editChapterTitle.useMutation({
    onMutate: () => {
      // edit chapter title in state
      const newSections = sections?.map((s) => s);
      const newChapters = sections[sIdx]?.chapters.map((c) => c) ?? [];

      newChapters[cIdx] = { ...chapter, title: editChapterTitle ?? "" };

      newSections[sIdx] = {
        ...(sections[sIdx] as CourseSection),
        chapters: newChapters,
        _count: {
          chapters: sections[sIdx]?.chapters?.length ?? 0,
        },
      };

      if (course)
        ctx.course.get.setData(
          { id },
          {
            ...course,
            sections: newSections,
          },
        );

      setSections(newSections);
    },
  });

  const revalidate = useRevalidateSSG();

  const ctx = api.useContext();

  return (
    <div
      style={style}
      ref={setNodeRef}
      className="group flex w-full justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-200/5 px-4 py-2"
    >
      {editChapterTitle !== undefined ? (
        <form
          className="flex w-full gap-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (editChapterTitle.length > 3)
              void editChapterTitleMutation(
                {
                  title: editChapterTitle,
                  id: chapter?.id,
                },
                {
                  onSuccess: () => {
                    void ctx.course.get.invalidate();
                    void revalidate(
                      `/${course?.creator?.creatorProfile ?? ""}`,
                    );
                    void revalidate(
                      `/${course?.creator?.creatorProfile ?? ""}/course/${
                        course?.id ?? ""
                      }`,
                    );
                  },
                },
              );

            setEditChapterTitle(undefined);
          }}
        >
          <div className="relative flex w-full items-center justify-end">
            <input
              autoFocus
              onClick={(e) => {
                e.preventDefault();
              }}
              value={editChapterTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEditChapterTitle(e.target?.value.substring(0, titleLimit));
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Escape") {
                  setEditChapterTitle(undefined);
                }
              }}
              placeholder="Enter chapter title..."
              className="w-full rounded bg-neutral-200/5 px-3 py-1 pr-6 font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500"
            />
            {
              <p className="absolute px-2 text-end text-xs text-neutral-400">
                {editChapterTitle?.length ?? 0}/{titleLimit}
              </p>
            }
          </div>
          <button
            type="submit"
            disabled={(editChapterTitle?.length ?? 0) <= 3}
            className="m-0 flex aspect-square w-8 min-w-[2rem] items-center justify-center rounded bg-neutral-200 p-1 backdrop-blur disabled:bg-neutral-200/50"
          >
            {editingChapterTitle ? (
              <Loader black />
            ) : (
              <CheckIcon className="w-5 text-neutral-900" />
            )}
          </button>
        </form>
      ) : (
        <>
          {" "}
          <div className="flex w-full items-center gap-3">
            <button className="cursor-grabbing" {...attributes} {...listeners}>
              <Bars2Icon className="w-4 text-neutral-400 opacity-0 duration-150 hover:text-neutral-300 group-hover:opacity-100" />
            </button>{" "}
            <div className="flex flex-col items-start gap-1">
              <p className="text-xs">
                Chapter {cIdx + getPrevAccumulatedChapters(sIdx) + 1}
              </p>

              <div className="flex items-center gap-2">
                <h5 className="line-clamp-1 w-full overflow-hidden text-ellipsis text-left text-sm font-bold">
                  {chapter.title}
                </h5>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setEditChapterTitle(chapter?.title);
                  }}
                >
                  <PencilSquareIcon className="w-4 text-neutral-400 opacity-0 duration-150 hover:text-neutral-300 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                setDeleteChapterIdx({
                  cIdx,
                  sIdx,
                });
              }}
            >
              <TrashIcon className="w-4 text-neutral-400 opacity-0 duration-150 hover:text-neutral-300 group-hover:opacity-100" />
            </button>
            <button>
              {!chapter.locked ? (
                <EyeIcon className="w-4 text-neutral-400 hover:text-neutral-300" />
              ) : (
                <LockClosedIcon className="w-4 text-neutral-400 hover:text-neutral-300" />
              )}
            </button>
            {/* hide from staging */}
            <Link
              href={`/creator/dashboard/course/${course?.id ?? ""}/manage/${
                chapter.id ?? ""
              }`}
              className="m-0 p-0 text-sm font-bold leading-none text-neutral-400 hover:text-neutral-300"
            >
              Edit
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ChapterManageItem;
