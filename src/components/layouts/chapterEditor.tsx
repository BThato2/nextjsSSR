import { api } from "@/utils/api";
import { Disclosure, Transition, Menu } from "@headlessui/react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PlayIcon,
} from "@heroicons/react/20/solid";
import {
  EyeIcon,
  PencilIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactNode, useCallback, Fragment } from "react";

const ChapterEditorLayoutR = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { chapter_id: chapterId, id: courseId } = router.query as {
    chapter_id: string;
    id: string;
  };

  const { data: chapter, isLoading: chapterLoading } =
    api.courseSectionChapter.get.useQuery({
      chapterId: chapterId,
    });

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id: courseId,
  });

  const getPrevAccumulatedChapters = useCallback(
    (sectionIndex: number) => {
      if (sectionIndex === 0 || !course) return 0;

      if (sectionIndex >= (course?.sections?.length ?? 0)) return 0;

      return course?.sections
        ?.map((s) => s)
        ?.slice(0, sectionIndex)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + (currentValue?.chapters?.length ?? 0),
          0,
        );
    },
    [course],
  );

  const getPrevAccumulatedChaptersSid = useCallback(
    (sectionId: string) => {
      const sectionIndex = course?.sections?.findIndex(
        (s) => s.id === sectionId,
      );
      if (!sectionIndex || sectionIndex === 0 || !course) return 0;

      if (sectionIndex >= (course?.sections?.length ?? 0)) return 0;

      return course?.sections
        ?.map((s) => s)
        ?.slice(0, sectionIndex)
        .reduce(
          (accumulator, currentValue) =>
            accumulator + (currentValue?.chapters?.length ?? 0),
          0,
        );
    },
    [course],
  );

  const viewing = !!(router.query as { view?: boolean }).view;

  // useEffect(() => {
  //   try {
  //     if (courseId)
  //       void axios.get("/api/private_content_access", {
  //         params: {
  //           course_id: courseId,
  //         },
  //       });
  //   } catch (err) {
  //     console.log("acces error", err);
  //   }
  // }, [courseId]);

  return (
    <>
      <Head>
        <title>
          Editing chapter{" "}
          {(chapter?.position ?? 0) +
            getPrevAccumulatedChaptersSid(chapter?.sectionId ?? "") +
            1}{" "}
          | {chapter?.course?.title}
        </title>
      </Head>
      <div className="flex h-screen w-full flex-col">
        <div className="z-20 flex w-full items-center justify-between border border-neutral-800 bg-neutral-800/20 px-4 py-2 backdrop-blur">
          <Link
            href={`/creator/dashboard/course/${
              chapter?.course?.id ?? ""
            }/manage/curriculum`}
            className="flex items-center gap-1 text-sm font-medium text-neutral-400 duration-150 hover:text-neutral-300"
          >
            <ArrowLeftIcon className="w-4" /> Back to studio
          </Link>

          {chapterLoading ? (
            <div className="h-6 w-80 animate-pulse rounded-full bg-neutral-800"></div>
          ) : (
            <h2 className="font-bold">
              Ch{" "}
              {(chapter?.position ?? 0) +
                getPrevAccumulatedChaptersSid(chapter?.sectionId ?? "") +
                1}{" "}
              • {chapter?.title ?? "Chapter"}
            </h2>
          )}

          <div className="flex flex-col items-end">
            <Menu>
              {() => (
                <>
                  <Menu.Button
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                      viewing
                        ? "border-green-600/40 bg-green-600/20"
                        : "border-purple-600/40 bg-purple-600/20"
                    }`}
                  >
                    {viewing ? (
                      <EyeIcon className="w-4 text-green-600" />
                    ) : (
                      <PencilIcon className="w-4 text-purple-600" />
                    )}
                    <label
                      className={`text-sm font-medium ${viewing ? "" : ""}`}
                    >
                      {viewing ? "Viewing" : "Editing"}
                    </label>{" "}
                    <ChevronDownIcon className="w-5" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="fixed z-50 mt-10 flex flex-col overflow-hidden rounded-xl border border-neutral-600/50 bg-neutral-900/80 backdrop-blur">
                      <Menu.Item>
                        <Link
                          className={`flex w-full items-center gap-1 border-b border-neutral-600/50 px-6 py-2 font-medium`}
                          href={`/creator/dashboard/course/${
                            chapter?.course?.id ?? ""
                          }/manage/${chapter?.id ?? ""}`}
                        >
                          <PencilIcon className="w-4" />
                          Editing
                        </Link>
                      </Menu.Item>
                      <Menu.Item>
                        <Link
                          className={`flex w-full items-center gap-1 px-6 py-2 font-medium`}
                          href={`/creator/dashboard/course/${
                            chapter?.course?.id ?? ""
                          }/manage/${chapter?.id ?? ""}?view=true`}
                        >
                          <EyeIcon className="w-4" />
                          Viewing
                        </Link>
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </div>
        </div>
        <div className="flex h-[calc(100vh-3rem)] w-full">
          {children}
          <div className="z-10 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-neutral-800 bg-neutral-800/20 backdrop-blur-sm">
            {!courseLoading ? (
              course?.sections?.map((section, sIdx) => {
                return (
                  <Disclosure key={`m-${sIdx}`} defaultOpen={sIdx === 0}>
                    {({ open }) => (
                      <div
                        className={`flex w-full flex-col border-neutral-800 duration-150 ${
                          sIdx === 0 ? "" : "border-t"
                        } ${
                          sIdx === course?.sections?.length - 1
                            ? "border-b"
                            : ""
                        }`}
                      >
                        <Disclosure.Button className="w-full text-neutral-300  duration-150 hover:bg-neutral-800/20 hover:text-neutral-200">
                          <div className="flex w-full items-center justify-start gap-3 p-3">
                            {section?.chapters?.length > 0 ? (
                              <ChevronDownIcon
                                className={`text-neutral-500 duration-150 ${
                                  open ? "rotate-180" : "rotate-0"
                                } w-5 min-w-[1.25rem]`}
                              />
                            ) : (
                              <div className="w-5" />
                            )}
                            <h4 className="line-clamp-1 w-full overflow-hidden text-ellipsis text-left text-sm font-medium sm:text-base">
                              {section.title}
                            </h4>
                            <div className="flex min-w-max items-center gap-1 text-xs">
                              <p>{section.chapters.length} chapters</p>
                            </div>
                          </div>
                        </Disclosure.Button>
                        {section?.chapters?.length > 0 ? (
                          <Disclosure.Panel className="flex w-full flex-col border-t border-neutral-800">
                            {section.chapters.map((ch, cIdx) => {
                              return (
                                <Link
                                  href={`/creator/dashboard/course/${
                                    course?.id ?? ""
                                  }/manage/${ch?.id}`}
                                  key={`c-${cIdx}`}
                                  className={`group flex w-full gap-3 border-neutral-800 px-5 py-2 text-neutral-300 duration-150 hover:bg-neutral-800/20 hover:text-neutral-200 ${
                                    cIdx === section.chapters.length - 1
                                      ? ""
                                      : "border-b"
                                  }`}
                                >
                                  <h5 className="line-clamp-1 flex w-full items-center overflow-hidden text-ellipsis text-left text-sm font-medium">
                                    <span
                                      className={`duration-150/80 mr-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-neutral-900 ${
                                        chapterId === ch.id
                                          ? "bg-pink-500"
                                          : "bg-neutral-200/80 pt-px group-hover:bg-neutral-200"
                                      }`}
                                    >
                                      {chapterId === ch.id ? (
                                        <PlayIcon className="w-3" />
                                      ) : (
                                        cIdx +
                                        getPrevAccumulatedChapters(sIdx) +
                                        1
                                      )}
                                    </span>
                                    {ch.title}
                                  </h5>
                                  <div className="flex min-w-max items-center gap-4 text-xs">
                                    {!ch?.locked ? (
                                      <EyeIcon className="w-3" />
                                    ) : (
                                      <LockClosedIcon className="w-3" />
                                    )}
                                    {/* <p>{formattedTime}</p> */}
                                  </div>
                                </Link>
                              );
                            })}
                          </Disclosure.Panel>
                        ) : (
                          <></>
                        )}
                      </div>
                    )}
                  </Disclosure>
                );
              })
            ) : (
              <div className="flex w-full flex-col gap-4 px-2 py-4">
                <div className="flex w-full items-center justify-between gap-2 px-1">
                  <div className="h-4 w-2/5 animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-1/5 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-2/4 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-3/5 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center justify-between gap-2 px-1">
                  <div className="h-4 w-2/5 animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-1/5 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-2/4 animate-pulse rounded-full bg-neutral-800" />
                </div>
                <div className="flex w-full items-center gap-2 px-4">
                  <div className="h-7 w-7 min-w-[1.75rem] animate-pulse rounded-full bg-neutral-800" />
                  <div className="h-4 w-3/5 animate-pulse rounded-full bg-neutral-800" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterEditorLayoutR;
