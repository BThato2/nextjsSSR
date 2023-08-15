import {
  type ChangeEvent,
  useState,
  type KeyboardEvent,
  useEffect,
  useCallback,
} from "react";
import React, { type ReactNode } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import {
  ArrowTopRightOnSquareIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDoubleRightIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import dynamic from "next/dynamic";
import { DashboardLayout } from "../../..";
import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import {
  type User,
  type Course,
  CoursePublishStatus,
  type Discount,
  type CourseSection,
  type BlocksChapter,
} from "@prisma/client";
import {
  DndContext,
  type UniqueIdentifier,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Link from "next/link";

const ConfirmationAlertModal = dynamic(
  () => import("@/components/ConfirmationAlertModal"),
  {
    ssr: false,
  },
);

const SectionManageItem = dynamic(
  () => import("@/components/SectionManageItem"),
  {
    ssr: false,
  },
);

const CourseManageLayoutR = dynamic(
  () => import("@/components/layouts/courseManageDashboard"),
  {
    ssr: false,
  },
);

const CoursePublicPage = dynamic(
  () => import("@/components/CoursePublicPage"),
  {
    ssr: false,
  },
);

const titleLimit = 60;

const CourseManageCurriculum = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id,
  });

  const revalidate = useRevalidateSSG();

  const ctx = api.useContext();

  const [sections, setSections] = useState<
    (CourseSection & {
      _count: { chapters: number };
      chapters: BlocksChapter[];
    })[]
  >([]);

  const [sectionTitle, setSectionTitle] = useState<string | undefined>(
    undefined,
  );

  const [reorderedSection, setReorderedSection] = useState(true);
  const [reorderedChapter, setReorderedChapter] = useState<
    { sIdx: number } | undefined
  >(undefined);

  const [previewOpen, setPreviewOpen] = useState(false);

  const { mutateAsync: addSectionMutation, isLoading: addingSection } =
    api.courseSection.addSection.useMutation({
      onMutate: () => {
        void ctx.course.get.cancel();

        if (course)
          ctx.course.get.setData(
            { id },
            {
              ...course,
              sections: [
                ...sections,
                {
                  id: "",
                  title: sectionTitle ?? "",
                  chapters: [],
                  courseId: id,
                  position: sections?.length,
                  _count: {
                    chapters: 0,
                  },
                },
              ],
            },
          );

        setSections([
          ...sections,
          {
            id: "",
            title: sectionTitle ?? "",
            chapters: [],
            courseId: id,
            position: sections?.length,
            _count: {
              chapters: 0,
            },
          },
        ]);
      },
    });

  const { mutateAsync: deleteSectionMutation } =
    api.courseSection.deleteSection.useMutation({
      onMutate: () => {
        void ctx.course.get.cancel();

        setSections(sections?.filter((s, idx) => idx !== deleteSectionIdx));
        setDeleteSectionIdx(-1);
      },
    });

  const {
    mutateAsync: rearrangeSectionMutation,
    // isLoading: rearrangingSection,
  } = api.courseSection.rearrangeSections.useMutation();

  const { mutateAsync: deleteChapterMutation } =
    api.courseSection.deleteChapter.useMutation({
      onMutate: () => {
        void ctx.course.get.cancel();

        setSections(
          sections?.map((s, sIdx) => {
            if (sIdx === deleteChapterIdx?.sIdx)
              return {
                ...s,
                chapters: s.chapters?.filter(
                  (c, cIdx) => cIdx !== deleteChapterIdx?.cIdx,
                ),
              };
            return s;
          }),
        );
        setDeleteChapterIdx({ cIdx: -1, sIdx: -1 });
      },
    });

  const {
    mutateAsync: rearrangeChapterMutation,
    // isLoading: rearrangingChapter,
  } = api.courseSection.rearrangeChapters.useMutation();

  const [deleteSectionIdx, setDeleteSectionIdx] = useState<number>(-1);
  const [deleteChapterIdx, setDeleteChapterIdx] = useState<{
    sIdx: number;
    cIdx: number;
  }>({ sIdx: -1, cIdx: -1 });

  // const mouseSensor = useSensor(MouseSensor, {
  //   activationConstraint: {
  //     distance: 5,
  //   },
  // });

  // const sensors = useSensors(mouseSensor);

  const idInChapters = (id: UniqueIdentifier) => {
    const chIdx = (course?.blocksChapters ?? [])?.findIndex((c) => c.id === id);

    if (chIdx === -1) return undefined;

    const seIdx = sections?.findIndex(
      (s) => !!s.chapters.find((c) => c.id === id),
    );

    return seIdx !== -1 ? { sIdx: seIdx, cIdx: chIdx } : undefined;
  };

  const getPrevAccumulatedChapters = useCallback(
    (sectionIndex: number) => {
      if (sectionIndex === 0) return 0;

      if (sectionIndex >= (sections?.length ?? 0)) return 0;

      return sections
        ?.slice(0, sectionIndex)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + (currentValue?.chapters?.length ?? 0),
          0,
        );
    },
    [sections],
  );

  useEffect(() => {
    if (course) {
      setSections(course?.sections);
    }
  }, [course]);

  useEffect(() => {
    if (sections.length > 0 && !reorderedSection && course) {
      void rearrangeSectionMutation({
        courseId: course?.id,
        sectionsIds: sections?.map((s) => s.id),
      });

      setReorderedSection(true);
    }

    if (
      sections.length > 0 &&
      !!reorderedChapter &&
      course &&
      !!sections[reorderedChapter?.sIdx]?.chapters
    ) {
      void rearrangeChapterMutation({
        sectionId: sections[reorderedChapter?.sIdx]?.id ?? "",
        chaptersIds:
          sections[reorderedChapter?.sIdx]?.chapters?.map((c) => c.id) ?? [],
      });

      setReorderedChapter(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, reorderedSection, course, reorderedChapter]);

  if (courseLoading)
    return (
      <>
        <Head>
          <title>Course | Manage Curriculum</title>
        </Head>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );

  if (!course) return <>Not found</>;

  if (course)
    return (
      <>
        {/* Preview Modal */}
        <div
          className={`fixed right-0 top-0 z-40 flex h-screen w-full flex-col items-end gap-1 overflow-y-auto bg-neutral-900/50 drop-shadow-2xl backdrop-blur-sm transition-transform ${
            previewOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            className="mt-2 flex items-center gap-2 px-3 py-1"
            type="button"
            onClick={() => setPreviewOpen(false)}
          >
            {" "}
            <ChevronDoubleRightIcon className="w-6" /> Close Preview
          </button>
          <div
            className={`w-full bg-neutral-950 bg-[url('/topography.svg')] drop-shadow-xl`}
          >
            <CoursePublicPage
              course={
                course as Course & {
                  htmlDescription: string;
                  discount: Discount;
                  sections: (CourseSection & {
                    chapters: BlocksChapter[];
                  })[];
                  _count: {
                    blocksChapters: number;
                  };
                }
              }
              creator={course?.creator as User}
              preview
            />
          </div>
        </div>

        <div className="w-full">
          <Head>
            <title>{`${course?.title ?? "Course"} | Manage Curriculum`}</title>
          </Head>
          <div className="mb-2 flex w-full max-w-3xl items-center justify-between gap-3 rounded-lg bg-neutral-900 p-2 px-4">
            <span
              className={`rounded-lg px-2 py-1 text-xs uppercase tracking-widest ${
                course?.publishStatus === CoursePublishStatus.PUBLISHED
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10  text-yellow-500"
              }`}
            >
              {course?.publishStatus}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="gap-1over:bg-pink-600/10 h flex items-center rounded-xl border-2 border-pink-600 px-3 py-1 text-sm font-bold text-pink-600 duration-300"
              >
                Preview
                <ArrowUpRightIcon className="w-4" />
              </button>
              {course?.publishStatus === CoursePublishStatus.DRAFT ? (
                <Link
                  href={`/creator/dashboard/course/${
                    course?.id ?? ""
                  }/manage/publish`}
                  className="flex items-center gap-1 rounded-xl border-2 border-pink-500 bg-pink-500 px-6 py-1 text-sm font-bold duration-300 hover:border-pink-600 hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Next
                </Link>
              ) : (
                <></>
              )}
            </div>
          </div>
          <div className="relative flex h-[calc(100vh-13.3rem)] w-full flex-col items-start gap-8 overflow-y-auto">
            <div className="mt-4 flex w-full max-w-3xl flex-col gap-4 pl-1">
              <div className="flex w-full flex-col p-4">
                <div className="flex w-full items-center justify-between gap-4">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    Course Content
                  </h2>
                  {/* hide chapter editor from staging */}
                  {course?.blocksChapters?.length > 0 ? (
                    <Link
                      href={`/creator/dashboard/course/${course?.id}/manage/${
                        course?.sections[0]?.chapters[0]?.id ?? ""
                      }`}
                      className="flex items-center gap-1 rounded-lg border border-neutral-600 px-4 py-1 text-sm font-medium text-neutral-400 backdrop-blur-sm duration-150 hover:bg-neutral-800/30 hover:text-neutral-200"
                    >
                      Open Chapter Editor{" "}
                      <ArrowTopRightOnSquareIcon className="w-4" />
                    </Link>
                  ) : (
                    <></>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <p>
                    <span className="font-bold">{sections.length}</span>{" "}
                    sections
                  </p>{" "}
                  •{" "}
                  <p>
                    <span className="font-bold">
                      {sections.reduce((chsLength, section) => {
                        return chsLength + section.chapters.length;
                      }, 0)}
                    </span>{" "}
                    chapters
                  </p>{" "}
                </div>
                <div className="mt-4 flex w-full flex-col items-start gap-4">
                  <DndContext
                    collisionDetection={closestCorners}
                    onDragEnd={({ active, over }) => {
                      const isChIdx = idInChapters(active?.id);

                      if (isChIdx) {
                        const activeIndex = sections[
                          isChIdx.sIdx
                        ]?.chapters?.findIndex((s) => s.id === active?.id);

                        const newIndex = sections[
                          isChIdx.sIdx
                        ]?.chapters?.findIndex((s) => s.id === over?.id);
                        const newSecArr = sections.map((s) => s);

                        if (newSecArr[isChIdx.sIdx]?.chapters) {
                          const newChsArr = arrayMove(
                            newSecArr[isChIdx.sIdx]?.chapters ?? [],
                            activeIndex ?? 0,
                            newIndex ?? 0,
                          );

                          setSections([
                            ...newSecArr.slice(0, isChIdx.sIdx),
                            {
                              // here update data value
                              ...newSecArr[isChIdx.sIdx],
                              chapters: newChsArr,
                            } as CourseSection & {
                              chapters: BlocksChapter[];
                              _count: { chapters: number };
                            },
                            ...newSecArr.slice(isChIdx.sIdx + 1),
                          ]);
                          setReorderedChapter({ sIdx: isChIdx.sIdx });
                        }

                        setReorderedSection(false);
                      } else {
                        setSections((secs) => {
                          const activeIndex = secs.findIndex(
                            (s) => s.id === active?.id,
                          );

                          const newIndex = secs.findIndex(
                            (s) => s.id === over?.id,
                          );
                          return arrayMove(secs, activeIndex, newIndex);
                        });

                        setReorderedSection(false);
                      }
                    }}
                  >
                    <SortableContext
                      items={sections?.map((s) => s?.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sections?.map((section, sIdx) => {
                        return (
                          <SectionManageItem
                            key={section?.id}
                            id={section?.id}
                            sIdx={sIdx}
                            section={section}
                            setDeleteSectionIdx={setDeleteSectionIdx}
                            setDeleteChapterIdx={setDeleteChapterIdx}
                            titleLimit={titleLimit}
                            getPrevAccumulatedChapters={
                              getPrevAccumulatedChapters
                            }
                            setSections={setSections}
                            sections={sections}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  {sectionTitle === undefined ? (
                    <button
                      onClick={() => setSectionTitle("")}
                      className="flex items-center gap-1 rounded-lg border-2 border-neutral-500 bg-neutral-200/10 px-2 py-1 text-sm duration-150 hover:border-neutral-200 hover:bg-neutral-200 hover:text-neutral-900"
                    >
                      <PlusIcon className="aspect-square w-5" />
                      <p className="font-bold">Add section</p>
                    </button>
                  ) : (
                    <form
                      className="flex w-full gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (sectionTitle.length > 3) {
                          void addSectionMutation(
                            {
                              title: sectionTitle,
                              courseId: course?.id,
                            },
                            {
                              onSuccess: () => {
                                void revalidate(
                                  `/${course?.creator?.creatorProfile ?? ""}`,
                                );
                                void revalidate(
                                  `/${
                                    course?.creator?.creatorProfile ?? ""
                                  }/course/${course?.id}`,
                                );
                                void ctx.course.get.invalidate();
                              },
                            },
                          );
                          setSectionTitle(undefined);
                        }
                      }}
                    >
                      <div className="relative flex w-full items-center justify-end">
                        <input
                          autoFocus
                          value={sectionTitle}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setSectionTitle(
                              e.target?.value.substring(0, titleLimit),
                            );
                          }}
                          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Escape") {
                              setSectionTitle(undefined);
                            }
                          }}
                          placeholder="Enter section title..."
                          className="w-full rounded bg-neutral-200/5 px-3 py-1 pr-6 font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500"
                        />
                        {
                          <p className="absolute px-2 text-end text-xs text-neutral-400">
                            {sectionTitle?.length ?? 0}/{titleLimit}
                          </p>
                        }
                      </div>
                      <button
                        type="submit"
                        disabled={(sectionTitle?.length ?? 0) <= 3}
                        className="m-0 flex aspect-square w-8 min-w-[2rem] items-center justify-center rounded bg-neutral-200 p-1 backdrop-blur disabled:bg-neutral-200/50"
                      >
                        {addingSection ? (
                          <Loader black />
                        ) : (
                          <CheckIcon className="w-5 text-neutral-900" />
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ConfirmationAlertModal
          isOpen={deleteSectionIdx !== -1}
          onClose={() => setDeleteSectionIdx(-1)}
          confirmation={`If you delete the section, then all the chapters inside the section will also be deleted.\nAre you sure you want to delete the ${
            sections[deleteSectionIdx]?.title ?? ""
          } section?`}
          onYes={() => {
            void deleteSectionMutation(
              {
                id: sections[deleteSectionIdx]?.id ?? "",
              },
              {
                onSuccess: () => {
                  void ctx.course.get.invalidate();
                },
              },
            );
          }}
          // yesLoading={deletingSection}
        />

        <ConfirmationAlertModal
          isOpen={deleteChapterIdx.cIdx !== -1}
          onClose={() => setDeleteChapterIdx({ cIdx: -1, sIdx: -1 })}
          confirmation={`Are you sure you want to delete the ${
            sections[deleteChapterIdx.sIdx]?.chapters[deleteChapterIdx.cIdx]
              ?.title ?? ""
          } chapter?`}
          onYes={() => {
            void deleteChapterMutation(
              {
                id:
                  sections[deleteChapterIdx.sIdx]?.chapters[
                    deleteChapterIdx.cIdx
                  ]?.id ?? "",
              },
              {
                onSuccess: () => {
                  void ctx.course.get.invalidate();
                },
              },
            );
          }}
          // yesLoading={deletingChapter}
        />
      </>
    );
  else return <></>;
};

const nestLayout = (
  parent: (page: ReactNode) => JSX.Element,
  child: (page: ReactNode) => JSX.Element,
) => {
  return (page: ReactNode) => parent(child(page));
};

export const CourseNestedLayout = nestLayout(DashboardLayout, CourseLayout);

CourseManageCurriculum.getLayout = CourseNestedLayout;

export default CourseManageCurriculum;

function CourseLayout(page: ReactNode) {
  return <CourseManageLayoutR>{page}</CourseManageLayoutR>;
}

export { CourseLayout };
