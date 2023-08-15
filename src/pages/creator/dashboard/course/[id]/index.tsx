import { Fragment, useState } from "react";
import React, { type ReactNode } from "react";
import Head from "next/head";
import { DashboardLayout } from "../..";
import { api } from "@/utils/api";
import useToast from "@/hooks/useToast";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import ImageWF from "@/components/ImageWF";
import { PencilIcon, PlayIcon } from "@heroicons/react/20/solid";
import dynamic from "next/dynamic";
import SocialShareButton from "@/components/SocialShareButton";
import ChapterManagePreviewModal from "@/components/ChapterManagePreviewModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import { MixPannelClient } from "@/analytics/mixpanel";
import { CoursePublishStatus } from "@prisma/client";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

const CourseLayoutR = dynamic(
  () => import("@/components/layouts/courseDashboard"),
  {
    ssr: false,
  },
);

const CourseAnalyticComponent = dynamic(
  () => import("@/components/CourseAnalytics"),
  {
    ssr: false,
  },
);

const CourseOverview = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPos, setPreviewPos] = useState(0);

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id,
  });

  const { mutateAsync: syncImportMutation, isLoading: syncImportLoading } =
    api.youtubeCourses.syncImport.useMutation();

  const ctx = api.useContext();
  const revalidate = useRevalidateSSG();

  const { successToast } = useToast();

  if (courseLoading)
    return (
      <>
        <Head>
          <title>Course | Overview</title>
        </Head>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );

  if (!course) return <>Not found</>;

  const isDiscount =
    course?.permanentDiscount !== null ||
    (course?.discount &&
      course?.discount?.deadline?.getTime() > new Date().getTime());

  const discount =
    course?.discount &&
    course?.discount?.deadline?.getTime() > new Date().getTime()
      ? course?.discount?.price
      : course?.permanentDiscount ?? 0;

  TimeAgo.addDefaultLocale(en);

  // Create formatter (English).
  const timeAgo = new TimeAgo("en-US");

  if (course)
    return (
      <>
        <Head>
          <title>{`${course?.title ?? "Course"} | Overview`}</title>
        </Head>
        <div className="mx-auto flex w-full flex-col items-start gap-3">
          <AnimatedSection
            delay={0.1}
            className="mb-2 flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-2 px-4"
          >
            <span
              className={`rounded-lg px-2 py-1 text-xs uppercase tracking-widest ${
                course?.publishStatus === CoursePublishStatus.PUBLISHED
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10  text-yellow-500"
              }`}
            >
              {course?.publishStatus}
            </span>
            <div className="flex  items-center gap-3">
              {course?.ytId ? (
                <Link
                  href={`/course/play/${course?.id}`}
                  className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-700 px-4 py-2 text-center text-xs font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-200 hover:text-neutral-800 sm:text-xs`}
                >
                  <PlayIcon className="w-3" />
                  View in Course Player
                </Link>
              ) : (
                <></>
              )}

              {!course?.ytId ? (
                <Link
                  href={`/creator/dashboard/course/${course?.id}/manage`}
                  className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-700 px-4 py-2 text-center text-xs font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-200 hover:text-neutral-800 sm:text-xs`}
                >
                  <PencilIcon className="w-3" />
                  Edit Course
                </Link>
              ) : (
                <></>
              )}
            </div>
          </AnimatedSection>
          <AnimatedSection
            delay={0.2}
            className=" mb-2 flex  w-full max-w-3xl items-start gap-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:flex-row"
          >
            <div className="relative flex aspect-video w-full  items-end justify-start overflow-hidden rounded-xl bg-neutral-900">
              <ImageWF
                src={course?.thumbnail ?? ""}
                alt="thumbnail"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-col gap-1">
                <label
                  htmlFor="title"
                  className="text-xs font-medium uppercase tracking-wider text-neutral-400"
                >
                  Title
                </label>
                <p className="line-clamp-1 w-full overflow-hidden text-ellipsis text-sm font-medium text-neutral-200 duration-300 sm:text-base">
                  {course?.title}
                </p>
              </div>

              <div className="flex w-full gap-6">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="price"
                    className="text-xs font-medium uppercase tracking-wider text-neutral-400"
                  >
                    Price
                  </label>
                  <div className="flex items-center gap-2">
                    {isDiscount ? (
                      discount === 0 ? (
                        <p
                          className={`text-xs font-bold uppercase tracking-widest text-green-500/80 sm:text-sm`}
                        >
                          free
                        </p>
                      ) : (
                        <p
                          className={`text-xs font-bold uppercase tracking-wide sm:text-sm`}
                        >
                          ₹{discount}
                        </p>
                      )
                    ) : (
                      <></>
                    )}
                    {course?.price === 0 ? (
                      <p
                        className={`text-xs font-bold uppercase tracking-widest text-green-500/80 sm:text-sm`}
                      >
                        free
                      </p>
                    ) : (
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide sm:text-sm ${
                          isDiscount
                            ? "font-thin line-through decoration-1"
                            : "font-bold"
                        }`}
                      >
                        ₹{course?.price}
                      </p>
                    )}
                  </div>
                </div>
                {course?.tags?.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="tags"
                      className="text-xs font-medium uppercase tracking-wider text-neutral-400"
                    >
                      Tags
                    </label>
                    <div className="flex flex-wrap items-center gap-1">
                      {course?.tags?.map((tag) => (
                        <span
                          className="rounded-lg bg-neutral-200/30 px-2 py-1 text-xs"
                          key={tag?.id}
                        >
                          {tag?.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {course?.category ? (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="category"
                      className="text-xs font-medium uppercase tracking-wider text-neutral-400"
                    >
                      Category
                    </label>
                    <p className="line-clamp-1 w-full overflow-hidden text-ellipsis text-sm font-medium text-neutral-200 duration-300 sm:text-base">
                      {course?.category?.title}
                    </p>
                  </div>
                ) : (
                  <></>
                )}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="tags"
                    className="text-xs font-medium uppercase tracking-wider text-neutral-400"
                  >
                    Share
                  </label>
                  <SocialShareButton />
                </div>
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection
            delay={0.2}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            {course?.ytId ? (
              <button
                onClick={() => {
                  void syncImportMutation(
                    { id: course?.id },
                    {
                      onSuccess: () => {
                        MixPannelClient.getInstance().courseUpdated({
                          courseId: course?.id,
                        });
                        void ctx.course.get.invalidate();
                        void revalidate(`/course/${course?.id}`);
                        if (course?.creator)
                          void revalidate(
                            `/${course?.creator.creatorProfile ?? ""}`,
                          );
                        successToast(
                          "Course synced from YouTube successfully!",
                        );
                      },
                    },
                  );
                }}
                className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-700 px-4 py-2 text-center text-xs font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-200 hover:text-neutral-800 sm:text-xs`}
              >
                {syncImportLoading ? (
                  <Loader />
                ) : (
                  <FontAwesomeIcon icon={faRotate} />
                )}
                Sync from YouTube
              </button>
            ) : (
              <></>
            )}
          </AnimatedSection>
          <AnimatedSection
            delay={0.3}
            className="flex w-full max-w-3xl flex-col gap-2"
          >
            <h1 className="text-xl font-medium">Analytics</h1>
            <CourseAnalyticComponent />
          </AnimatedSection>
          <AnimatedSection
            delay={0.4}
            className="mt-6 flex w-full max-w-3xl flex-col gap-2"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <h1 className="text-xl font-medium">
                {course?.enrollments?.length} Enrollment
                {course?.enrollments?.length > 1 ? "s" : ""}
              </h1>

              <Link
                href={`/creator/dashboard/course/${course?.id}/enrollments`}
                className="rounded-lg bg-neutral-800 px-3 py-1 text-sm text-neutral-300 duration-150 hover:text-neutral-200"
              >
                View all
              </Link>
            </div>

            <div className="flex flex-col gap-2 px-2 py-4">
              {course?.enrollments?.slice(0, 4)?.map((er) => (
                <div key={er.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <ImageWF
                      src={er.user.image ?? ""}
                      alt=""
                      height={25}
                      width={25}
                      className="rounded-full object-cover"
                    />
                    <p>{er.user.name}</p>
                  </div>
                  <p>enrolled</p>
                  <p>{timeAgo.format(er.createdAt)}.</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        <ChapterManagePreviewModal
          courseId={id}
          isOpen={previewOpen}
          setIsOpen={setPreviewOpen}
          position={previewPos}
          setPosition={setPreviewPos}
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

CourseOverview.getLayout = CourseNestedLayout;

export default CourseOverview;

function CourseLayout(page: ReactNode) {
  return <CourseLayoutR>{page}</CourseLayoutR>;
}

export { CourseLayout };
