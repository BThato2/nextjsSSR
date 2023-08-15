import Head from "next/head";
import CreatorLayout from "./layouts/creator";
import {
  type CourseSection,
  type Course,
  type Discount,
  type User,
  type BlocksChapter,
} from "@prisma/client";
import { api } from "@/utils/api";
import { motion } from "framer-motion";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { MixPannelClient } from "@/analytics/mixpanel";
import { signIn, useSession } from "next-auth/react";
import ImageWF from "./ImageWF";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  PlayCircleIcon,
  PlayIcon,
  RectangleGroupIcon,
} from "@heroicons/react/20/solid";
import { getDateTimeDiffString } from "@/helpers/time";
import { Loader } from "./Loader";
import useToast from "@/hooks/useToast";
import { Disclosure } from "@headlessui/react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import CoursePreviewModal from "./CoursePreviewModal";
import creatorAnalytics from "../helpers/creator-analytics";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import deviceId_analytics from "@/helpers/device-id";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAt,
  faInfinity,
  faLineChart,
  faTerminal,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

const CheckoutModal = dynamic(() => import("@/components/CheckoutModal"), {
  ssr: false,
});

type Props = {
  course: Course & {
    htmlDescription: string;
    discount: Discount;
    sections: (CourseSection & {
      chapters: BlocksChapter[];
    })[];
    _count: {
      blocksChapters: number;
    };
  };
  creator: User;
  preview?: boolean;
};

const CoursePublicPage = ({ course, creator, preview }: Props) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState(0);

  const dynamicOgImage = `https://kroto.in/api/og/course?title=${
    course?.title ?? ""
  }&chapters=${0}&creatorName=${creator?.name ?? course?.ytChannelName ?? ""}`;

  const { courseDetailsChecked_analytics: courseDetailsChecked } =
    creatorAnalytics;
  const router = useRouter();
  const session = useSession();

  const currentUrl = router.asPath;

  const { getDeviceIdFromLocalStorage } = deviceId_analytics;

  const handleCourseDetailsChecked = () => {
    const deviceId = getDeviceIdFromLocalStorage();
    if (
      session?.data?.user?.id &&
      session?.data?.user?.id !== course?.creatorId
    ) {
      courseDetailsChecked({
        courseId: course?.id ?? "",
        userId: session.data?.user.id ?? "",
        pagePath: currentUrl,
      });
    } else if (!session?.data?.user?.id && session.status !== "loading") {
      courseDetailsChecked({
        courseId: course?.id ?? "",
        userId: session.data?.user.id ?? "",
        pagePath: currentUrl,
        deviceId: deviceId ?? "",
      });
    }
  };

  useEffect(() => {
    if (!preview && course?.id && session.status !== "loading")
      MixPannelClient.getInstance().courseViewed({
        userId: session.data?.user.id ?? "",
        courseId: course?.id,
      });
  }, [course?.id, session, preview]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    console.log({ scrollY });
  }, [scrollY]);

  if (!course)
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-medium text-neutral-200">
          Course not found
        </h1>
        <Link
          href={`/${creator?.creatorProfile ?? ""}`}
          className="mt-4 flex items-center gap-2 text-xl font-medium text-pink-500 transition duration-300 hover:text-pink-600"
        >
          <ArrowLeftIcon className="w-6" />
          Go back to home
        </Link>
      </div>
    );

  if (!creator)
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-medium text-neutral-200">
          Creator not found
        </h1>
        <Link
          href="/"
          className="mt-4 flex items-center gap-2 text-xl font-medium text-pink-500 transition duration-300 hover:text-pink-600"
        >
          <ArrowLeftIcon className="w-6" />
          Go back to home
        </Link>
      </div>
    );

  return (
    <div className="w-full">
      <CreatorLayout preview={preview} creator={creator}>
        <Head>
          <title>{course?.title}</title>
          <meta name="description" content={course?.description ?? ""} />
          {/* Google SEO */}
          <meta itemProp="name" content={course?.title ?? ""} />
          <meta itemProp="description" content={course?.description ?? ""} />
          <meta itemProp="image" content={course?.ogImage ?? dynamicOgImage} />
          {/* Facebook meta */}
          <meta property="og:title" content={course?.title ?? ""} />
          <meta property="og:description" content={course?.description ?? ""} />
          <meta
            property="og:image"
            content={course?.ogImage ?? dynamicOgImage}
          />
          <meta property="image" content={course?.ogImage ?? dynamicOgImage} />
          <meta
            property="og:url"
            content={`https://kroto.in/course/${course?.id ?? ""}`}
          />
          <meta property="og:type" content="website" />
          {/* twitter meta */}
          <meta name="twitter:title" content={course?.title ?? ""} />
          <meta
            name="twitter:description"
            content={course?.description ?? ""}
          />
          <meta
            name="twitter:image"
            content={course?.ogImage ?? dynamicOgImage}
          />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>
        <div className="flex w-full flex-col px-4">
          <CourseHeroBox
            creator={creator}
            course={course}
            setCheckoutModalOpen={setCheckoutModalOpen}
            setPreviewOpen={setPreviewOpen}
            preview={preview}
            scrollY={scrollY}
          />

          {/* Course includes */}
          <div className="mx-auto mt-12 flex w-full max-w-5xl flex-col items-center gap-4">
            <h1 className="text-xs uppercase tracking-widest">
              Course includes
            </h1>
            <div className="flex w-full items-center justify-center gap-12">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faInfinity}
                  className="text-lg text-pink-600"
                />
                <p>Life time access</p>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faLineChart}
                  className="text-lg text-pink-600"
                />
                <p>Progress tracking</p>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faTerminal}
                  className="text-lg text-pink-600"
                />
                <p>Interactive excersises</p>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faTrophy}
                  className="text-lg text-pink-600"
                />
                <p>Certificate of completion</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex min-h-[60vh] w-full gap-4">
            <div className="mx-auto flex w-full max-w-5xl gap-8">
              <div className="flex w-full items-start gap-16">
                {course?.htmlDescription &&
                course?.htmlDescription.length > 0 ? (
                  <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 100 }}
                    transition={{ delay: 0.25, type: "tween" }}
                    className="flex w-full flex-col gap-2"
                  >
                    <h1 className="text-sm font-bold uppercase tracking-widest">
                      About Course
                    </h1>
                    <div className="prose prose-sm prose-invert prose-pink w-full min-w-full prose-headings:my-0 prose-headings:mb-2 prose-headings:font-medium prose-headings:text-neutral-300 prose-p:my-1 prose-ol:my-1 prose-ul:my-1  prose-li:my-1">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: course?.htmlDescription,
                        }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <></>
                )}

                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 100 }}
                  transition={{ delay: 0.3, type: "tween" }}
                  className="flex w-full flex-col"
                >
                  <h1 className="text-sm font-bold uppercase tracking-widest">
                    Chapters
                  </h1>

                  <div className="mt-4 flex w-full flex-col gap-4">
                    {course?.sections?.map((section, sIdx) => {
                      return (
                        <Disclosure key={`m-${sIdx}`} defaultOpen={sIdx === 0}>
                          {({ open }) => (
                            <div
                              onClick={handleCourseDetailsChecked}
                              className={`flex w-full flex-col gap-3 duration-150`}
                            >
                              <Disclosure.Button className="z-10 w-full">
                                <div className="flex w-full items-center justify-start gap-3">
                                  {section?.chapters?.length > 0 ? (
                                    <ChevronDownIcon
                                      className={`text-neutral-500 duration-150 ${
                                        open ? "rotate-180" : "rotate-0"
                                      } w-5 min-w-[1.25rem]`}
                                    />
                                  ) : (
                                    <div className="w-5" />
                                  )}
                                  <h4 className="line-clamp-1 w-full overflow-hidden text-ellipsis text-left text-sm sm:text-base">
                                    {section.title}
                                  </h4>
                                  <div className="flex min-w-max items-center gap-1 text-xs">
                                    <p>{section.chapters.length} chapters</p>
                                  </div>
                                </div>
                              </Disclosure.Button>
                              {section?.chapters?.length > 0 ? (
                                <Disclosure.Panel className="z-0 flex w-full flex-col gap-3">
                                  {section.chapters.map((chapter, cIdx) => {
                                    return (
                                      <button
                                        key={`c-${cIdx}`}
                                        className="group flex w-full items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-800/20 py-3 pl-6 pr-4 backdrop-blur-sm duration-150 hover:border-neutral-700 hover:bg-neutral-800/40"
                                      >
                                        <h5 className="line-clamp-1 w-full overflow-hidden text-ellipsis text-left text-lg">
                                          {chapter.title}
                                        </h5>
                                        <div className="flex min-w-max items-center gap-4 text-xs">
                                          {!chapter?.locked ? (
                                            <PlayCircleIcon className="w-10 text-pink-600" />
                                          ) : (
                                            <div className="flex h-10 w-10 items-center justify-center">
                                              <LockClosedIcon className="w-6 text-neutral-600 duration-150 group-hover:text-neutral-500" />
                                            </div>
                                          )}
                                        </div>
                                      </button>
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
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mx-auto my-12 flex w-full max-w-5xl flex-col items-center gap-4">
            <h2 className="text-center text-xs uppercase tracking-widest">
              Instructor
            </h2>
            <div className="flex gap-8">
              <Link href={`/${creator?.creatorProfile ?? ""}`}>
                <ImageWF
                  src={creator?.image ?? course?.ytChannelImage ?? ""}
                  alt={creator?.name ?? course?.ytChannelName ?? ""}
                  className="aspect-square rounded-full"
                  width={100}
                  height={100}
                />
              </Link>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/${creator?.creatorProfile ?? ""}`}
                  className="flex items-center gap-4 pt-2"
                >
                  <p className="text-2xl text-neutral-200 duration-150 group-hover:text-neutral-200">
                    {creator?.name ?? course?.ytChannelName ?? ""}
                  </p>

                  <p className="flex items-center gap-px text-base text-neutral-200 duration-150 group-hover:text-neutral-200">
                    <FontAwesomeIcon icon={faAt} className="text-pink-600" />
                    {creator?.creatorProfile ?? ""}
                  </p>
                </Link>

                <p className="max-w-sm text-sm text-neutral-300 duration-150 group-hover:text-neutral-200">
                  {creator?.bio ?? ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CreatorLayout>
      <CoursePreviewModal
        courseId={course?.id}
        isOpen={previewOpen}
        setIsOpen={setPreviewOpen}
        setCheckoutModalOpen={setCheckoutModalOpen}
      />
      <CheckoutModal
        course={{
          ...(course as Course & { discount: Discount | null }),
          _count: { chapters: 0 },
        }}
        isOpen={checkoutModalOpen}
        setIsOpen={setCheckoutModalOpen}
      />
    </div>
  );
};

type BProps = {
  course: Course & {
    discount: Discount;
    _count: { blocksChapters: number };
  };
  creator: User;
  setCheckoutModalOpen: Dispatch<SetStateAction<boolean>>;
  setPreviewOpen: Dispatch<SetStateAction<boolean>>;
  preview?: boolean;
  scrollY: number;
};

export const CourseHeroBox = ({
  course,
  creator,
  setCheckoutModalOpen,
  setPreviewOpen,
  preview,
  scrollY,
}: BProps) => {
  const session = useSession();
  const ctx = api.useContext();

  const { successToast, errorToast } = useToast();

  const { mutateAsync: enrollMutation, isLoading: enrollLoading } =
    api.courseEnrollment.enroll.useMutation();

  const { data: isEnrolled, isLoading: isEnrolledLoading } =
    api.courseEnrollment.isEnrolled.useQuery({ courseId: course?.id });

  if (!course) return <></>;

  const isDiscount =
    course?.permanentDiscount !== null ||
    (course?.discount &&
      course?.discount?.deadline?.getTime() > new Date().getTime());

  const isPreSaleDiscount =
    course?.discount &&
    course?.discount?.deadline?.getTime() > new Date().getTime();

  const discount =
    course?.discount &&
    course?.discount?.deadline?.getTime() > new Date().getTime()
      ? course?.discount?.price
      : course?.permanentDiscount ?? 0;

  const price = isDiscount ? discount : course?.price;

  const isHeader = scrollY > 280;

  return (
    <>
      <div
        className={`z-20 w-full ${
          isHeader ? "fixed left-0 top-[3.4rem]" : "pt-8"
        }`}
      >
        <div
          style={{
            backgroundImage: "url(" + (course?.thumbnail ?? "") + ")",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
          className={`w-full p-0 ${
            isHeader ? "" : "mx-auto max-w-5xl rounded-[3rem]"
          }`}
        >
          <div
            className={`flex w-full justify-center border-white/20 bg-black/80 backdrop-blur-xl ${
              isHeader ? "border-b sm:p-2" : " rounded-[3rem] border sm:p-4"
            }`}
          >
            <div
              className={`flex w-full max-w-5xl flex-col items-center gap-2 sm:flex-row sm:gap-8 ${
                isHeader ? "justify-between" : ""
              }`}
            >
              <div
                // initial={{ y: 300, opacity: 0 }}
                // animate={{ y: 0, opacity: 100 }}
                // transition={{ delay: 0, type: "tween" }}
                className="relative aspect-video w-full min-w-full object-cover sm:hidden"
              >
                <ImageWF
                  src={course?.thumbnail ?? ""}
                  alt=""
                  fill
                  className="aspect-video object-cover"
                />
              </div>

              <div
                className={`flex h-full flex-col items-start gap-4 p-4 ${
                  isHeader ? "" : "w-2/3"
                }`}
              >
                <h1
                  // initial={{ x: 300, opacity: 0 }}
                  // animate={{ x: 0, opacity: 100 }}
                  // transition={{ delay: 0.05, type: "tween" }}
                  className={`font-bold text-neutral-100 ${
                    isHeader
                      ? "text-sm sm:text-base md:text-2xl"
                      : "text-xl sm:text-3xl md:text-4xl"
                  }`}
                >
                  {course?.title}
                </h1>
                <div
                  // initial={{ x: 300, opacity: 0 }}
                  // animate={{ x: 0, opacity: 100 }}
                  // transition={{ delay: 0.1, type: "tween" }}
                  className={`mb-12 flex w-full items-center gap-6 ${
                    isHeader ? "hidden" : ""
                  }`}
                >
                  {course?._count.blocksChapters > 0 ? (
                    <Link
                      href="#chapters"
                      className="flex items-center gap-1 text-neutral-300"
                    >
                      <PlayCircleIcon className="w-6 text-pink-600" />{" "}
                      {course?._count.blocksChapters} Chapters
                    </Link>
                  ) : (
                    <></>
                  )}

                  <Link
                    href={`${
                      creator
                        ? `/${creator?.creatorProfile ?? ""}`
                        : `https://www.youtube.com/${course?.ytChannelId ?? ""}`
                    }`}
                    target={!creator ? "_blank" : undefined}
                    className={`group flex items-center gap-1`}
                  >
                    <ImageWF
                      src={creator?.image ?? course?.ytChannelImage ?? ""}
                      alt={creator?.name ?? course?.ytChannelName ?? ""}
                      className="aspect-square rounded-full"
                      width={22}
                      height={22}
                    />
                    <p className="text-base text-neutral-300 duration-150 group-hover:text-neutral-200">
                      {creator?.name ?? course?.ytChannelName ?? ""}
                    </p>
                  </Link>
                </div>

                {/* What you'll learn */}
                {!isHeader &&
                course?.outcomes &&
                (course?.outcomes as string[]).length > 0 ? (
                  <div
                    // initial={{ x: 300, opacity: 0 }}
                    // animate={{ x: 0, opacity: 100 }}
                    // transition={{ delay: 0.2, type: "tween" }}
                    className="mt-2 flex w-full flex-col items-start gap-4 rounded-lg sm:mt-6 sm:w-auto"
                  >
                    <h3 className="text-xs font-medium uppercase tracking-widest text-neutral-300">
                      What you&apos;ll learn
                    </h3>
                    <div className="grid w-full grid-cols-1 gap-4 gap-x-6 sm:w-auto md:grid-cols-2">
                      {(course?.outcomes as string[])?.map((o, idx) => (
                        <div
                          key={`o-${idx}`}
                          className="flex items-center gap-2"
                        >
                          <CheckCircleIcon className="w-5 min-w-[1.25rem] text-pink-600" />{" "}
                          <h4 className="text-sm text-neutral-100 sm:text-base">
                            {o}
                          </h4>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
              {/* Buy button & thumbnail */}
              <div
                className={`relative hidden sm:block ${
                  isHeader ? "" : "w-1/3"
                }`}
              >
                <div className="z-10 w-full flex-col gap-1 overflow-hidden rounded-lg drop-shadow">
                  <div
                    className={`relative aspect-video w-full overflow-hidden rounded-[3rem] object-cover ${
                      isHeader ? "hidden" : ""
                    }`}
                  >
                    <ImageWF
                      src={course?.thumbnail ?? ""}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div
                    className={`flex gap-3 ${
                      isHeader ? "flex-row items-center" : "mt-3 flex-col"
                    }`}
                  >
                    <PriceView
                      isDiscount={isDiscount}
                      discount={discount}
                      isPreSaleDiscount={isPreSaleDiscount}
                      price={course?.price}
                      discountDeadline={course?.discount?.deadline}
                      isEnrolled={!!isEnrolled}
                      isCreator={session?.data?.user?.id === creator?.id}
                    />

                    <div
                      className={`flex flex-col items-center gap-2 ${
                        isHeader ? "" : "mt-2"
                      }`}
                    >
                      <CTAButton
                        onClick={async () => {
                          if (preview) return;
                          if (!session.data) {
                            void signIn(undefined, {
                              callbackUrl: `/${
                                creator?.creatorProfile ?? ""
                              }/course/${course?.id}`,
                            });

                            return;
                          }
                          if (price === 0)
                            await enrollMutation(
                              { courseId: course?.id },
                              {
                                onSuccess: () => {
                                  MixPannelClient.getInstance().courseEnrolled({
                                    courseId: course?.id,
                                    userId: session?.data.user?.id ?? "",
                                  });
                                  void ctx.courseEnrollment.isEnrolled.invalidate();
                                  successToast(
                                    "Successfully enrolled in course!",
                                  );
                                },
                                onError: () => {
                                  errorToast("Error in enrolling in course!");
                                },
                              },
                            );
                          else setCheckoutModalOpen(true);
                        }}
                        startsAt={course?.startsAt}
                        enrollLoading={enrollLoading}
                        isEnrolled={!!isEnrolled}
                        isCreator={session?.data?.user?.id === creator?.id}
                        courseId={course?.id ?? ""}
                        sessionLoading={session.status === "loading"}
                        isEnrollLoading={isEnrolledLoading}
                      />
                      {course?.ytId ? (
                        <button
                          onClick={() => setPreviewOpen(true)}
                          className={`group my-1 inline-flex w-full items-center justify-center gap-1 rounded-full border border-pink-500 px-6  py-2 text-center font-bold text-pink-500 transition-all duration-300 hover:border-pink-600 hover:bg-pink-600/10 hover:text-pink-600`}
                        >
                          <>
                            <PlayIcon className="w-4" />
                            <span>Preview</span>
                          </>
                        </button>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`${isHeader ? "h-[30rem]" : ""}`} />
    </>
  );
};

type CBProps = {
  onClick?: () => void;
  enrollLoading?: boolean;
  startsAt?: Date | null;
  isEnrolled: boolean;
  isCreator: boolean;
  courseId: string;
  sessionLoading: boolean;
  isEnrollLoading: boolean;
};

const CTAButton = ({
  onClick,
  enrollLoading,
  startsAt,
  isEnrolled,
  isCreator,
  courseId,
  sessionLoading,
  isEnrollLoading,
}: CBProps) => {
  if (sessionLoading || isEnrollLoading)
    return (
      <div className="h-14 w-full animate-pulse rounded-[3.5rem] bg-neutral-200/30" />
    );

  return !isCreator ? (
    !isEnrolled ? (
      <button
        {...(onClick ? { onClick } : {})}
        className={`group inline-flex w-full items-center justify-center gap-1 rounded-full bg-pink-600 px-6 py-3 text-center font-bold text-neutral-200 transition-all duration-300 hover:bg-pink-600 sm:text-2xl`}
      >
        {enrollLoading ? (
          <div>
            <Loader white />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span>Enroll now</span>
            {startsAt && startsAt?.getTime() > new Date().getTime() ? (
              <span className="text-sm font-medium">
                starts on{" "}
                <span className="font-bold uppercase">
                  {startsAt?.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </span>
            ) : (
              <></>
            )}
          </div>
        )}
      </button>
    ) : startsAt && startsAt?.getTime() > new Date().getTime() ? (
      <div
        className={`group inline-flex w-full items-center justify-center gap-1 rounded-full bg-pink-600 px-6 py-3 text-center font-bold text-neutral-200 transition-all duration-300 hover:bg-pink-600 sm:text-lg`}
      >
        <CalendarDaysIcon className="w-6" /> Starts on{" "}
        {startsAt?.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}
        stay tuned!
      </div>
    ) : (
      <button
        className={`group inline-flex w-full items-center justify-center gap-1 rounded-full bg-pink-600 px-6 py-3 text-center font-bold text-neutral-200 transition-all duration-300 hover:bg-pink-600 sm:text-2xl`}
      >
        <PlayCircleIcon className="w-6" /> Play
      </button>
    )
  ) : (
    <Link
      href={`/creator/dashboard/course/${courseId}`}
      className={`group inline-flex w-full items-center justify-center gap-1 rounded-full border border-pink-600 px-6 py-3 text-center font-bold text-pink-600 transition-all duration-300 hover:bg-pink-600/20 sm:text-2xl`}
    >
      <RectangleGroupIcon className="w-6" /> Overview
    </Link>
  );
};

type PVProps = {
  isDiscount: boolean;
  isPreSaleDiscount: boolean;
  discountDeadline: Date | undefined;
  discount: number;
  price: number;
  isEnrolled: boolean;
  isCreator: boolean;
};

const PriceView = ({
  isDiscount,
  isPreSaleDiscount,
  discount,
  price,
  discountDeadline,
  isEnrolled,
  isCreator,
}: PVProps) => {
  if (isEnrolled || isCreator) return <></>;
  return (
    <div className="flex min-w-max flex-col">
      <div className="flex items-end gap-2 px-2">
        {isDiscount ? (
          discount === 0 ? (
            <p
              className={` text-3xl font-bold uppercase tracking-widest text-green-500/80`}
            >
              free
            </p>
          ) : (
            <p
              className={`font-bold uppercase tracking-wide  ${
                !isDiscount ? " text-lg" : " text-3xl font-black"
              }`}
            >
              ₹{discount}
            </p>
          )
        ) : (
          <></>
        )}
        {price === 0 ? (
          <p
            className={`text-3xl font-bold uppercase tracking-widest text-green-500/80`}
          >
            free
          </p>
        ) : (
          <p
            className={` font-semibold uppercase tracking-wide  ${
              isDiscount
                ? "text-lg font-thin line-through decoration-1"
                : "text-3xl font-bold"
            }`}
          >
            ₹{price}
          </p>
        )}
      </div>

      {isPreSaleDiscount ? (
        <p className="mt-1 text-xs text-pink-500">
          <span className="font-bold">
            {getDateTimeDiffString(discountDeadline ?? new Date(), new Date())}
          </span>{" "}
          remaining on this price!
        </p>
      ) : (
        <></>
      )}
    </div>
  );
};

export default CoursePublicPage;
