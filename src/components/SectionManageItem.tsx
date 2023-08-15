import { Disclosure } from "@headlessui/react";
import {
  ChevronDownIcon,
  PlusIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";
import {
  Bars2Icon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  type Dispatch,
  type ChangeEvent,
  type SetStateAction,
  type KeyboardEvent,
  useState,
} from "react";
import { Loader } from "./Loader";
import { type BlocksChapter, type CourseSection } from "@prisma/client";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import { useDroppable } from "@dnd-kit/core";
import dynamic from "next/dynamic";

const ChapterManageItem = dynamic(
  () => import("@/components/ChapterManageItem"),
  {
    ssr: false,
  },
);

type Props = {
  sIdx: number;
  id: string;
  section: CourseSection & {
    chapters: BlocksChapter[];
  };
  setDeleteSectionIdx: Dispatch<SetStateAction<number>>;
  setDeleteChapterIdx: Dispatch<SetStateAction<{ sIdx: number; cIdx: number }>>;
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

const SectionManageItem = ({
  sIdx,
  id,
  section,
  setDeleteSectionIdx,
  setDeleteChapterIdx,
  titleLimit,
  getPrevAccumulatedChapters,
  setSections,
  sections,
}: Props) => {
  const [chapterTitle, setChapterTitle] = useState<string | undefined>(
    undefined,
  );

  const [editSectionTitle, setEditSectionTitle] = useState<string | undefined>(
    undefined,
  );

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: section?.id,
  });

  const {
    mutateAsync: editSectionTitleMutation,
    isLoading: editingSectionTitle,
  } = api.courseSection.editSectionTitle.useMutation({
    onMutate: () => {
      // edit section title in state
      const newSections = sections?.map((s) => s);

      newSections[sIdx] = {
        ...section,
        title: editSectionTitle ?? "",
        _count: {
          chapters: section?.chapters?.length ?? 0,
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

  const { mutateAsync: addChapterMutation, isLoading: addingChapter } =
    api.courseSection.addChapter.useMutation({
      onMutate: () => {
        // add chapter in state

        void ctx.course.get.cancel();
        const newSections = sections?.map((s) => s);

        newSections[sIdx] = {
          ...section,
          chapters: [
            ...(section?.chapters ?? []),
            {
              title: chapterTitle ?? "",
              id: "",
              position: section?.chapters?.length ?? 0,
              locked: true,
              sectionId: section?.id,
              videoUrl: "",
              courseId: id,
            },
          ],
          _count: {
            chapters: (section?.chapters?.length ?? 0) + 1,
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

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const router = useRouter();
  const { id: courseId } = router.query as { id: string };

  const { data: course } = api.course.get.useQuery({
    id: courseId,
  });

  const revalidate = useRevalidateSSG();

  const ctx = api.useContext();

  const handleEditSectionTitleSubmit = () => {
    if (editSectionTitle && editSectionTitle.length > 3)
      void editSectionTitleMutation(
        {
          title: editSectionTitle,
          id: section?.id,
        },
        {
          onSuccess: () => {
            void revalidate(`/${course?.creator?.creatorProfile ?? ""}`);
            void revalidate(
              `/${course?.creator?.creatorProfile ?? ""}/course/${
                course?.id ?? ""
              }`,
            );

            void ctx.course.get.invalidate();
          },
        },
      );
    setEditSectionTitle(undefined);
  };

  return (
    <>
      <Disclosure>
        {({ open }) => (
          <div
            ref={setNodeRef}
            className={`flex w-full flex-col rounded-lg border border-neutral-700 bg-neutral-200/5 backdrop-blur-sm duration-150 ${
              sIdx === 0 ? "" : ""
            }`}
            style={style}
          >
            <Disclosure.Button
              disabled={editSectionTitle !== undefined}
              className="group z-10 w-full"
            >
              {editSectionTitle !== undefined ? (
                <div className="flex w-full gap-2 p-4">
                  <div className="relative flex w-full items-center justify-end">
                    <input
                      // autoFocus
                      // onClick={(e) => {
                      //   e.preventDefault();
                      // }}
                      value={editSectionTitle}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setEditSectionTitle(
                          e.target?.value.substring(0, titleLimit),
                        );
                      }}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        // e.preventDefault();

                        if (e.key === "Enter") {
                          handleEditSectionTitleSubmit();
                        }

                        if (e.key === "Escape") {
                          setEditSectionTitle(undefined);
                        }
                      }}
                      placeholder="Enter section title..."
                      className="w-full rounded bg-neutral-200/5 px-3 py-1 pr-6 font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500"
                    />
                    {
                      <p className="absolute px-2 text-end text-xs text-neutral-400">
                        {editSectionTitle?.length ?? 0}/{titleLimit}
                      </p>
                    }
                  </div>
                  <button
                    type="button"
                    disabled={(editSectionTitle?.length ?? 0) <= 3}
                    onClick={handleEditSectionTitleSubmit}
                    className="m-0 flex aspect-square w-8 min-w-[2rem] items-center justify-center rounded bg-neutral-200 p-1 backdrop-blur disabled:bg-neutral-200/50"
                  >
                    {editingSectionTitle ? (
                      <Loader black />
                    ) : (
                      <CheckIcon className="w-5 text-neutral-900" />
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex w-full items-center justify-between gap-3 p-3 px-5 pl-3">
                    <div className="flex w-full items-center gap-3">
                      <button
                        className="cursor-grabbing"
                        {...attributes}
                        {...listeners}
                      >
                        <Bars2Icon className="w-4 text-neutral-400 opacity-0 duration-150 hover:text-neutral-300 group-hover:opacity-100" />
                      </button>
                      <div className="flex flex-col items-start gap-1">
                        <p className="text-xs">Section {sIdx + 1}</p>
                        <div className="flex items-center gap-2">
                          <h4 className="line-clamp-1 w-full overflow-hidden text-ellipsis text-left text-sm font-bold sm:text-base">
                            {section.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditSectionTitle(section?.title);
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
                          setDeleteSectionIdx(sIdx);
                        }}
                      >
                        <TrashIcon className="w-5 text-neutral-400 opacity-0 duration-150 hover:text-neutral-300 group-hover:opacity-100" />
                      </button>
                      {section?.chapters?.length > 0 ? (
                        <p className="flex min-w-max items-center text-xs text-neutral-400">
                          {section?.chapters?.length} chapter
                          {section?.chapters?.length > 1 ? "s" : ""}
                        </p>
                      ) : (
                        <></>
                      )}
                      <ChevronDownIcon
                        className={`text-neutral-400 duration-150 hover:text-neutral-300 ${
                          open ? "rotate-180" : "rotate-0"
                        } w-5 min-w-[1.25rem]`}
                      />
                    </div>
                  </div>
                </>
              )}
            </Disclosure.Button>
            <Disclosure.Panel
              ref={setDroppableNodeRef}
              className="z-0 flex w-full flex-col items-start gap-3 border-t border-neutral-700 px-6 py-3"
            >
              <SortableContext
                items={section?.chapters?.map((c) => c?.id)}
                strategy={rectSortingStrategy}
              >
                {section?.chapters?.map((chapter, cIdx) => {
                  return (
                    <ChapterManageItem
                      key={chapter?.id}
                      id={chapter?.id}
                      chapter={chapter}
                      setDeleteChapterIdx={setDeleteChapterIdx}
                      cIdx={cIdx}
                      sIdx={sIdx}
                      titleLimit={titleLimit}
                      getPrevAccumulatedChapters={getPrevAccumulatedChapters}
                      sections={sections}
                      setSections={setSections}
                    />
                  );
                })}
              </SortableContext>

              {chapterTitle === undefined ? (
                <button
                  onClick={() => setChapterTitle("")}
                  className="mt-2 flex items-center gap-1 rounded-lg border-2 border-neutral-500 bg-neutral-200/10 px-2 py-1 text-sm duration-150 hover:border-neutral-200 hover:bg-neutral-200 hover:text-neutral-900"
                >
                  <PlusIcon className="aspect-square w-5" />
                  <p className="font-bold">Add chapter</p>
                </button>
              ) : (
                <form
                  className="mt-2 flex w-full gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if ((chapterTitle?.length ?? 0) > 3) {
                      void addChapterMutation(
                        {
                          title: chapterTitle ?? "",
                          courseId: course?.id ?? "",
                          sectionId: section?.id,
                        },
                        {
                          onSuccess: () => {
                            void revalidate(
                              `/${course?.creator?.creatorProfile ?? ""}`,
                            );
                            void revalidate(
                              `/${
                                course?.creator?.creatorProfile ?? ""
                              }/course/${course?.id ?? ""}`,
                            );

                            void ctx.course.get.invalidate();
                          },
                        },
                      );
                      setChapterTitle(undefined);
                    }
                  }}
                >
                  <div className="relative flex w-full items-center justify-end">
                    <input
                      autoFocus
                      value={chapterTitle}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setChapterTitle(
                          e.target?.value.substring(0, titleLimit),
                        );
                      }}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Escape") {
                          setChapterTitle(undefined);
                        }
                      }}
                      placeholder="Enter chapter title..."
                      className="w-full rounded bg-neutral-200/5 px-3 py-1 pr-6 font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500"
                    />
                    {
                      <p className="absolute px-2 text-end text-xs text-neutral-400">
                        {chapterTitle?.length ?? 0}/{titleLimit}
                      </p>
                    }
                  </div>
                  <button
                    type="submit"
                    disabled={(chapterTitle?.length ?? 0) <= 3}
                    className="m-0 flex aspect-square w-8 min-w-[2rem] items-center justify-center gap-1 rounded bg-neutral-200 p-1 backdrop-blur disabled:bg-neutral-200/50"
                  >
                    {addingChapter ? (
                      <Loader black />
                    ) : (
                      <CheckIcon className="w-5 text-neutral-900" />
                    )}
                  </button>
                </form>
              )}
            </Disclosure.Panel>
          </div>
        )}
      </Disclosure>
    </>
  );
};

export default SectionManageItem;
