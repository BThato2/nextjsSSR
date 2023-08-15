import { useState } from "react";
import React, { type ReactNode } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import {
  ArrowUpRightIcon,
  ChevronDoubleRightIcon,
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
import useToast from "@/hooks/useToast";

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

const CourseManagePricing = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id,
  });

  const revalidate = useRevalidateSSG();

  const [previewOpen, setPreviewOpen] = useState(false);

  const { mutateAsync: publishMutation, isLoading: publishing } =
    api.courseEdit.updatePublishStatus.useMutation();

  const ctx = api.useContext();

  const { warningToast } = useToast();

  if (courseLoading)
    return (
      <>
        <Head>
          <title>Course | Manage Publish</title>
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

        <div className="w-full">
          <Head>
            <title>{`${course?.title ?? "Course"} | Manage Publish`}</title>
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
              {/* <button
                type="submit"
                className="flex items-center gap-1 rounded-xl border-2 border-pink-500 bg-pink-500 px-6 py-1 text-sm font-bold duration-300 hover:border-pink-600 hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {updateLoading ? <Loader white /> : <></>} Save
              </button> */}
            </div>
          </div>
          <div className="relative flex h-[calc(100vh-13.3rem)] w-full flex-col items-start gap-8 overflow-y-auto">
            {/* <pre>{JSON.stringify(methods.watch(), null, 2)}</pre> */}
            <div className="mt-4 w-full max-w-3xl">
              {course?.publishStatus !== CoursePublishStatus.PUBLISHED ? (
                <div className="flex flex-col items-start gap-4 p-4">
                  <label className="line-clamp-2 overflow-hidden text-ellipsis text-lg font-medium">
                    All set! Publish the course & share it with your audience!
                  </label>
                  <button
                    onClick={() => {
                      if (!!course?.blocksDecription && !!course?.thumbnail)
                        void publishMutation(
                          {
                            id: course?.id,
                            status: CoursePublishStatus.PUBLISHED,
                          },
                          {
                            onSuccess: (courseUpdated) => {
                              void ctx.course.invalidate();
                              void revalidate(
                                `/${
                                  courseUpdated?.creator?.creatorProfile ?? ""
                                }`,
                              );
                              void revalidate(
                                `/${
                                  courseUpdated?.creator?.creatorProfile ?? ""
                                }/course/${courseUpdated?.id}`,
                              );
                            },
                          },
                        );
                      else {
                        warningToast("Complete landing page before pubishing!");
                      }
                    }}
                    className="hover:bg-pink-60 flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-2 font-bold backdrop-blur-sm"
                  >
                    {publishing ? <Loader white /> : <></>} Publish Course
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 p-4">
                  <label className="line-clamp-2 overflow-hidden text-ellipsis text-lg font-medium">
                    Hide this course from your profile and allow only enrolled
                    learners to access the course.
                  </label>
                  <button
                    onClick={() => {
                      void publishMutation(
                        {
                          id: course?.id,
                          status: CoursePublishStatus.ARCHIVED,
                        },
                        {
                          onSuccess: (courseUpdated) => {
                            void ctx.course.invalidate();
                            void revalidate(
                              `/${
                                courseUpdated?.creator?.creatorProfile ?? ""
                              }`,
                            );
                            void revalidate(
                              `/${
                                courseUpdated?.creator?.creatorProfile ?? ""
                              }/course/${courseUpdated?.id}`,
                            );
                          },
                        },
                      );
                    }}
                    className="hover:bg-pink-60 flex items-center gap-1 rounded-lg border border-neutral-600 bg-neutral-200/10 px-3 py-2 font-bold"
                  >
                    {publishing ? <Loader white /> : <></>} Archive Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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

CourseManagePricing.getLayout = CourseNestedLayout;

export default CourseManagePricing;

function CourseLayout(page: ReactNode) {
  return <CourseManageLayoutR>{page}</CourseManageLayoutR>;
}

export { CourseLayout };
