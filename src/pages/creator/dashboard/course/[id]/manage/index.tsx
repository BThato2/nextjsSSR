import { useState, type ChangeEvent, useEffect } from "react";
import React, { type ReactNode } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import useToast from "@/hooks/useToast";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import ImageWF from "@/components/ImageWF";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDoubleRightIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import dynamic from "next/dynamic";
import { DashboardLayout } from "../../..";
import { z } from "zod";
import { type UseFormProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Switch from "@/components/Switch";
import { ConfigProvider, DatePicker, theme } from "antd";
import dayjs from "dayjs";
import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import "@blocknote/core/style.css";
import {
  type User,
  type Course,
  CoursePublishStatus,
  type Discount,
  type Tag,
  type CourseSection,
  type BlocksChapter,
  type Prisma,
} from "@prisma/client";
import { isEqual } from "lodash";
import { TrashIcon } from "@heroicons/react/24/outline";
import { blocksToHTML } from "@/server/helpers/block";
import { type BlockNoteEditor } from "@blocknote/core";
// import Editor from "@/components/BlocksEditor";
const Editor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});
const CoursePublicPage = dynamic(
  () => import("@/components/CoursePublicPage"),
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

const titleLimit = 60;
const outcomeLimit = 60;

export const updateCourseLandingFormSchema = z.object({
  id: z.string().nonempty(),
  thumbnail: z.string().nonempty("Please upload a cover"),
  title: z.string().max(titleLimit).nonempty("Please enter course title."),
  blocksDescription: z.array(z.any()),
  tags: z.array(z.object({ id: z.string(), title: z.string() })),
  outcomes: z.array(
    z.string().max(outcomeLimit).nonempty("Please enter course outcome."),
  ),
  startsAt: z.date().optional(),
});

function useZodForm<TSchema extends z.ZodType>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema;
  },
) {
  const form = useForm<TSchema["_input"]>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}

const CourseManageLanding = () => {
  const methods = useZodForm({
    schema: updateCourseLandingFormSchema,
    defaultValues: {
      id: "",
      title: "",
      // description: "",
      blocksDescription: [],
      thumbnail: "",
      // price: "0",
      // permanentDiscount: "0",
      tags: [],
      outcomes: [],
    },
  });

  const [tagInput, setTagInput] = useState("");
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const [debouncedTagInput, setDebouncedTagInput] = useState(tagInput);

  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  const { darkAlgorithm } = theme;

  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id,
  });

  const { warningToast, errorToast } = useToast();

  const {
    data: searchedTags,
    // isLoading: searchingtags
  } = api.courseTags.searchTags.useQuery(debouncedTagInput);

  const { mutateAsync: updateLandingMutation, isLoading: updateLoading } =
    api.courseEdit.updateLanding.useMutation();

  const revalidate = useRevalidateSSG();

  const [courseInit, setCourseInit] = useState<
    | {
        id: string;
        title: string;
        thumbnail: string;
        // description: string;
        blocksDescription: Prisma.JsonArray;
        tags: Tag[];
        outcomes: string[];
        startsAt: Date | undefined;
      }
    | undefined
  >(undefined);

  const [editorInit, setEditorInit] = useState<boolean>(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [htmlPreviewDescription, setHTMLPreviewDescription] = useState("");

  useEffect(() => {
    if (course && !courseInit) {
      const initData = {
        id: course?.id ?? "",
        title: course?.title ?? "",
        thumbnail: course?.thumbnail ?? "",
        // description: courseUpdated?.description ?? "",
        blocksDescription: (course?.blocksDecription as Prisma.JsonArray) ?? [],
        tags: course?.tags ?? [],
        outcomes: (course?.outcomes as string[]) ?? [],
        startsAt: course?.startsAt ?? undefined,
      };
      methods.reset(initData);
      setCourseInit(initData);
    }
  }, [course, courseInit, methods, editor]);

  useEffect(() => {
    if (
      editor &&
      course &&
      !editorInit &&
      editor.getBlock(editor.topLevelBlocks[0]?.id ?? "")
    ) {
      editor.replaceBlocks(
        editor.topLevelBlocks,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        (course?.blocksDecription ?? []) as any[],
      );
      setEditorInit(true);
    }
  }, [course, editorInit, editor]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedTagInput(tagInput);
    }, 500);

    return () => clearTimeout(timerId);
  }, [tagInput]);

  // FIXME: called before saving data
  // useLeavePageConfirmation(!isEqual(methods.watch(), courseInit));

  if (courseLoading)
    return (
      <>
        <Head>
          <title>Course | Manage Landing</title>
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
              // parentScrollDiv={parentScrollDiv}
              course={
                {
                  ...course,
                  ...methods.watch(),
                  htmlDescription: htmlPreviewDescription,
                } as Course & {
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

        <form
          onSubmit={methods.handleSubmit(async (values) => {
            await updateLandingMutation(values, {
              onSuccess: (courseUpdated) => {
                const initData = {
                  id: courseUpdated?.id ?? "",
                  title: courseUpdated?.title ?? "",
                  thumbnail: courseUpdated?.thumbnail ?? "",
                  // description: courseUpdated?.description ?? "",
                  blocksDescription:
                    (courseUpdated?.blocksDecription as Prisma.JsonArray) ?? [],

                  tags: courseUpdated?.tags ?? [],
                  outcomes: (courseUpdated?.outcomes as string[]) ?? [],
                  startsAt: courseUpdated?.startsAt ?? undefined,
                };
                setCourseInit(initData);
                methods.setValue("thumbnail", courseUpdated?.thumbnail ?? "");
                methods.setValue("tags", courseUpdated?.tags ?? "");
                if (courseUpdated) {
                  void revalidate(
                    `/${courseUpdated?.creator?.creatorProfile ?? ""}`,
                  );
                  void revalidate(
                    `/${
                      courseUpdated?.creator?.creatorProfile ?? ""
                    }/course/${courseUpdated?.id}`,
                  );
                }

                if (course?.publishStatus === CoursePublishStatus.DRAFT)
                  void router.push(
                    `/creator/dashboard/course/${
                      course?.id ?? ""
                    }/manage/pricing`,
                  );
              },
              onError: () => {
                errorToast("Error in updating course landing!");
              },
            });
          })}
          className="flex w-full flex-col"
        >
          <Head>
            <title>{`${course?.title ?? "Course"} | Manage Landing`}</title>
          </Head>
          {
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
                <button
                  type="submit"
                  disabled={
                    course?.publishStatus === CoursePublishStatus.DRAFT
                      ? false
                      : isEqual(methods.watch(), courseInit)
                  }
                  className="flex items-center gap-1 rounded-xl border-2 border-pink-500 bg-pink-500 px-6 py-1 text-sm font-bold duration-300 hover:border-pink-600 hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {updateLoading ? <Loader white /> : <></>}{" "}
                  {course?.publishStatus === CoursePublishStatus.DRAFT
                    ? "Save & Next"
                    : "Save"}
                </button>
              </div>
            </div>
          }
          <div className="relative flex h-[calc(100vh-13.3rem)] w-full flex-col items-start gap-6 overflow-y-auto p-2 pb-6">
            {/* <pre className="text-xs text-green-500">
              {JSON.stringify(methods.watch(), null, 2)}
            </pre>
            <pre className="text-xs text-red-500">
              {JSON.stringify(courseInit, null, 2)}
            </pre> */}
            <div className="flex w-full max-w-2xl flex-col gap-4">
              <div className="relative mb-4 flex aspect-video w-full max-w-xs items-end justify-start overflow-hidden rounded-xl bg-neutral-700">
                {
                  <ImageWF
                    src={methods.getValues("thumbnail")}
                    alt="thumbnail"
                    fill
                    className="object-cover"
                  />
                }
                <div className="relative m-2 flex w-auto cursor-pointer items-center gap-2 rounded-xl border border-neutral-500 bg-neutral-800/80 p-3 text-sm font-medium duration-300 hover:border-neutral-400">
                  <input
                    type="file"
                    onKeyPress={(
                      e: React.KeyboardEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) => {
                      e.key === "Enter" && e.preventDefault();
                    }}
                    accept="image/*"
                    className="z-2 absolute h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      if (e.currentTarget.files && e.currentTarget.files[0]) {
                        if (e.currentTarget.files[0].size > 1200000)
                          warningToast(
                            "Image is too big, try a smaller (<1MB) image for performance purposes.",
                          );

                        if (e.currentTarget.files[0].size <= 3072000) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            methods.setValue(
                              "thumbnail",
                              reader.result as string,
                            );
                          };
                          reader.readAsDataURL(e.currentTarget.files[0]);
                        } else {
                          warningToast("Upload cover image upto 3 MB of size.");
                        }
                      }
                    }}
                  />
                  <PhotoIcon className="w-4" />
                  Upload Cover
                </div>
              </div>
              {methods.formState.errors.thumbnail?.message && (
                <p className="text-red-700">
                  {methods.formState.errors.thumbnail?.message}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <label htmlFor="title" className="text-lg  text-neutral-200">
                  Course Title
                </label>
                <input
                  value={methods.watch()?.title}
                  onKeyPress={(
                    e: React.KeyboardEvent<
                      HTMLInputElement | HTMLTextAreaElement
                    >,
                  ) => {
                    e.key === "Enter" && e.preventDefault();
                  }}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    methods.setValue(
                      "title",
                      e.target?.value.substring(0, titleLimit),
                    );
                  }}
                  placeholder="Write course title..."
                  className="w-full rounded-lg bg-neutral-800 px-3 py-1 font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500 sm:text-lg"
                />
                {
                  <p className="text-end text-xs text-neutral-400">
                    {methods.watch()?.title?.length}/{titleLimit}
                  </p>
                }
                {methods.formState.errors.title?.message && (
                  <p className="text-red-700">
                    {methods.formState.errors.title?.message}
                  </p>
                )}
              </div>
              {methods.watch()?.outcomes?.length > 0 ? (
                <div className="mb-4 flex w-full flex-col gap-3">
                  <label
                    htmlFor="outcomes"
                    className="text-lg  text-neutral-200"
                  >
                    What learners will learn from this course?
                  </label>

                  <div className="flex w-full flex-col items-start gap-3">
                    {methods.watch().outcomes?.map((o, idx) => (
                      <div className="flex w-full flex-col" key={`o-${idx}`}>
                        <div className="flex w-full items-center gap-2">
                          <CheckIcon className="w-4" />
                          <input
                            value={o}
                            onKeyPress={(
                              e: React.KeyboardEvent<
                                HTMLInputElement | HTMLTextAreaElement
                              >,
                            ) => {
                              e.key === "Enter" && e.preventDefault();
                            }}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              methods.setValue(
                                `outcomes.${idx}`,
                                e.target?.value.substring(0, outcomeLimit),
                              );
                            }}
                            placeholder="Write a course outcome..."
                            className="w-full rounded-lg bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              methods.setValue(
                                "outcomes",
                                methods
                                  .watch()
                                  .outcomes?.filter((ou, id) => id !== idx),
                              );
                            }}
                          >
                            <TrashIcon className="w-4 text-neutral-200/50" />
                          </button>
                        </div>
                        {
                          <p className="mr-6 mt-1 text-end text-xs text-neutral-400">
                            {methods.watch()?.outcomes[idx]?.length}/
                            {outcomeLimit}
                          </p>
                        }
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        methods.setValue("outcomes", [
                          ...methods.watch().outcomes,
                          "",
                        ]);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-pink-600 bg-pink-600/10 px-3 py-1 text-sm font-bold text-pink-600"
                    >
                      <PlusIcon className="w-4" /> Add another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex w-full flex-col items-start gap-2">
                  <p>Describe what this course offers?</p>
                  <button
                    type="button"
                    onClick={() => {
                      methods.setValue("outcomes", [""]);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-pink-600 bg-pink-600/10 px-3 py-1 font-bold text-pink-600"
                  >
                    <PlusIcon className="w-4" /> Add a course outcome
                  </button>
                </div>
              )}
              {methods.formState.errors.outcomes?.message && (
                <p className="text-red-700">
                  {methods.formState.errors.outcomes?.message}
                </p>
              )}
              <div
                className={`flex w-full items-center gap-2 ${
                  methods.watch()?.startsAt ? "mb-1" : "mb-4"
                }`}
              >
                <p>Course starts in future?</p>

                <Switch
                  value={!!methods.watch()?.startsAt}
                  onClick={() => {
                    if (methods.watch()?.startsAt)
                      methods.setValue("startsAt", undefined);
                    else
                      methods.setValue(
                        "startsAt",
                        new Date(new Date().setDate(new Date().getDate() + 7)),
                      );
                  }}
                />
              </div>
              {methods.watch()?.startsAt ? (
                <div className="mb-4 flex w-full flex-col items-start gap-1">
                  <div className="flex w-full items-center gap-8">
                    <label
                      htmlFor="dDeadline"
                      className="text-lg text-neutral-200"
                    >
                      Course start date
                    </label>
                  </div>
                  <div className="flex max-w-xs items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 p-2 sm:gap-3">
                    <ConfigProvider
                      theme={{
                        algorithm: darkAlgorithm,
                        token: {
                          colorPrimary: "#ec4899",
                        },
                      }}
                    >
                      <DatePicker
                        format="DD-MM-YYYY"
                        autoFocus={false}
                        bordered={false}
                        disabledDate={(currentDate) =>
                          currentDate.isBefore(dayjs(new Date()), "day")
                        }
                        value={dayjs(
                          (
                            methods.watch()?.startsAt ?? new Date()
                          )?.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }),
                          "DD-MM-YYYY",
                        )}
                        onChange={(selectedDate) => {
                          methods.setValue("startsAt", selectedDate?.toDate());
                        }}
                      />
                    </ConfigProvider>
                    {/* <BsCalendar3Event className="absolute ml-3 text-neutral-400 peer-focus:text-neutral-200" /> */}
                  </div>
                </div>
              ) : (
                <></>
              )}
              {methods.formState.errors.startsAt?.message && (
                <p className="text-red-700">
                  {methods.formState.errors.startsAt?.message}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="description"
                  className="text-lg  text-neutral-200"
                >
                  Description
                </label>
                {!editorInit ? (
                  <div className="h-40 w-full animate-pulse rounded-lg bg-neutral-800" />
                ) : (
                  <></>
                )}

                <div
                  className={`w-full rounded-lg border border-neutral-700 bg-neutral-800 ${
                    !editorInit ? "h-0 opacity-0" : ""
                  }`}
                >
                  <Editor
                    onChange={(innerEditor) => {
                      const getHtmlAttachedBlocks = async () => {
                        return await Promise.all(
                          innerEditor?.topLevelBlocks.map(async (block) => ({
                            ...block,
                            _html:
                              (await innerEditor?.blocksToHTML([block])) ?? "",
                          })) ?? [],
                        );
                      };

                      void getHtmlAttachedBlocks().then((blocksWithHtml) => {
                        methods.setValue("blocksDescription", blocksWithHtml);
                        setHTMLPreviewDescription(blocksToHTML(blocksWithHtml));
                      });
                    }}
                    setDynamicEditor={setEditor}
                  />
                </div>

                {methods.formState.errors.blocksDescription?.message && (
                  <p className="text-red-700">
                    {methods.formState.errors.blocksDescription?.message}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <label htmlFor="tags" className="text-lg  text-neutral-200">
                  Tags
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {methods.watch().tags.map((tag) => (
                    <span
                      className="flex items-center gap-1 overflow-hidden rounded bg-pink-600/30 pl-2 text-xs"
                      key={tag.id}
                    >
                      {tag.title}{" "}
                      <button
                        onClick={() => {
                          methods.setValue(
                            "tags",
                            methods.watch().tags.filter((t) => t.id !== tag.id),
                          );
                        }}
                        type="button"
                        className="ml-1 p-1 text-neutral-200 duration-150 hover:bg-pink-600"
                      >
                        <XMarkIcon className="w-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative flex w-full max-w-sm items-center justify-end">
                  <input
                    type="text"
                    onKeyPress={(
                      e: React.KeyboardEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >,
                    ) => {
                      e.key === "Enter" && e.preventDefault();
                    }}
                    onFocus={() => setTagInputFocused(true)}
                    onBlur={() =>
                      setTimeout(() => {
                        setTagInputFocused(false);
                      }, 200)
                    }
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e?.target?.value.substring(0, 30));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        methods.setValue("tags", [
                          ...methods.watch().tags,
                          {
                            id: tagInput,
                            title: tagInput,
                          },
                        ]);
                        setTagInput("");
                      }
                    }}
                    className="peer block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1 pr-6 text-sm placeholder-neutral-500 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                    placeholder="Add tags..."
                  />
                  {/* <div className="absolute">
                    {searchingtags ? <Loader /> : <></>}
                  </div> */}
                </div>
                {tagInputFocused && searchedTags && searchedTags?.length > 0 ? (
                  <div
                    className={`hide-scroll max-h-60 w-full max-w-sm overflow-y-auto`}
                  >
                    <div className="flex w-full flex-col overflow-hidden rounded border border-neutral-600 bg-neutral-800/70 backdrop-blur">
                      {searchedTags?.map((st) => (
                        <button
                          type="button"
                          className="w-full border-b border-neutral-600 px-3 py-1 text-left text-sm hover:text-pink-600"
                          onClick={() => {
                            setTagInput("");
                            if (
                              !methods
                                .watch()
                                .tags.find((tg) => tg.id === st.id)
                            )
                              methods.setValue("tags", [
                                ...methods.watch().tags,
                                st,
                              ]);
                          }}
                          key={st.id}
                        >
                          {st.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              {methods.formState.errors?.tags?.message && (
                <p className="text-red-700">
                  {methods.formState.errors?.tags?.message}
                </p>
              )}
            </div>
          </div>
        </form>
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

CourseManageLanding.getLayout = CourseNestedLayout;

export default CourseManageLanding;

function CourseLayout(page: ReactNode) {
  return <CourseManageLayoutR>{page}</CourseManageLayoutR>;
}

export { CourseLayout };
