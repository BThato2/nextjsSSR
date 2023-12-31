import { EventCard } from "@/components/EventCard";
import SocialLink from "@/components/SocialLink";
import type { GetStaticPropsContext } from "next";
import Head from "next/head";
import type { ParsedUrlQuery } from "querystring";
import React, { useEffect } from "react";
import ImageWF from "@/components/ImageWF";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Loader } from "@/components/Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAt,
  faQuoteLeft,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import CourseCard from "@/components/CourseCard";
import TestimonialDisclosure from "@/components/TestimonialDisclosure";
import { Tooltip } from "antd";
import { prisma } from "@/server/db";
import AnimatedSection from "@/components/AnimatedSection";
import { MixPannelClient } from "@/analytics/mixpanel";
import { useSession } from "next-auth/react";
import CreatorLayout from "@/components/layouts/creator";
import { type User } from "@prisma/client";
import creatorAnalytics from "@/helpers/creator-analytics";
import deviceId_analytics from "@/helpers/device-id";

type CreatorPageProps = {
  creatorProfile: string;
};

const Index = ({ creatorProfile }: CreatorPageProps) => {
  const { data: creator, isLoading: isCreatorLoading } =
    api.creator.getPublicProfile.useQuery(
      {
        creatorProfile,
      },
      { refetchOnMount: false, refetchOnWindowFocus: false },
    );

  const dynamicOgImage = `https://kroto.in/api/og/creator?name=${
    creator?.name ?? ""
  }&image=${creator?.image ?? ""}&creatorProfile=${
    creator?.creatorProfile ?? ""
  }`;

  const router = useRouter();

  const tab = router.asPath.split("#")[1];

  const isCoursesTab = !(tab === "events") && !(tab === "testimonials");
  const isEventsTab = tab === "events";
  const isTestimonialsTab = tab === "testimonials";
  const session = useSession();

  const { creatorProfileViewed_analytics: profileViewedData } =
    creatorAnalytics;

  const { getDeviceIdFromLocalStorage } = deviceId_analytics;

  const creatorId = creator?.id ?? "";
  const userId = session?.data?.user.id ?? "";

  useEffect(() => {
    if (creatorId && userId) {
      profileViewedData({
        creatorId: creator?.id ?? "",
        userId: session?.data?.user.id ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator, session]);

  useEffect(() => {
    const deviceId = getDeviceIdFromLocalStorage();

    if (!userId && session?.status !== "loading") {
      profileViewedData({
        creatorId: creator?.id ?? "",
        userId: session?.data?.user.id ?? "",
        deviceId: deviceId ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator, session]);

  useEffect(() => {
    if (session.status !== "loading")
      MixPannelClient.getInstance().profileViewed({
        userId: session.data?.user.id ?? "",
        creatorProfile: creatorProfile,
      });
  }, [session, creatorProfile]);

  useEffect(() => {
    if (session.status !== "loading" && isEventsTab)
      MixPannelClient.getInstance().profileEventTabViewed({
        userId: session.data?.user.id ?? "",
        creatorProfile: creatorProfile,
      });
  }, [isEventsTab, session, creatorProfile]);

  useEffect(() => {
    if (session.status !== "loading" && isTestimonialsTab)
      MixPannelClient.getInstance().profileTestimonialTabViewed({
        userId: session.data?.user.id ?? "",
        creatorProfile: creatorProfile,
      });
  }, [isTestimonialsTab, session, creatorProfile]);

  useEffect(() => {
    if (session.status !== "loading" && isCoursesTab)
      MixPannelClient.getInstance().profileCourseTabViewed({
        userId: session.data?.user.id ?? "",
        creatorProfile: creatorProfile,
      });
  }, [isCoursesTab, session, creatorProfile]);

  if (!creator) {
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
  }

  return (
    <CreatorLayout creator={creator as User}>
      <Head>
        <title>{`${creator?.name ?? ""} - Kroto`}</title>
        <meta name="description" content={creator?.bio ?? ""} />

        {/* Google SEO */}
        <meta itemProp="name" content={creator?.name ?? ""} />
        <meta itemProp="description" content={creator?.bio ?? ""} />
        <meta itemProp="image" content={creator?.ogImage ?? dynamicOgImage} />
        {/* facebook meta */}
        <meta
          property="og:title"
          content={`${creator?.name ?? ""} | Kroto` ?? ""}
        />
        <meta property="og:description" content={creator?.bio ?? ""} />
        <meta
          property="og:image"
          content={creator?.ogImage ?? dynamicOgImage}
        />
        <meta property="image" content={creator?.ogImage ?? dynamicOgImage} />
        <meta
          property="og:url"
          content={`https://kroto.in/${creator?.creatorProfile ?? ""}`}
        />
        <meta property="og:type" content="website" />

        {/* twitter meta */}
        <meta name="twitter:title" content={creator?.name ?? ""} />
        <meta name="twitter:description" content={creator?.bio ?? ""} />
        <meta
          name="twitter:image"
          content={creator?.ogImage ?? dynamicOgImage}
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <main className="flex h-full min-h-screen w-full flex-col items-center overflow-x-hidden p-4 pb-24">
        <div className="relative mt-6 flex w-full max-w-4xl flex-col items-center">
          <AnimatedSection className="absolute z-[2]">
            <div
              className={`relative aspect-square w-28 overflow-hidden  rounded-3xl border-4 border-neutral-950 transition-all`}
            >
              <ImageWF
                src={creator?.image ?? ""}
                alt={creator?.name ?? ""}
                fill
              />
            </div>
          </AnimatedSection>
          <div
            className={`mt-[3.7rem] flex w-full flex-col items-center justify-between gap-1 rounded-3xl bg-neutral-900 px-16 pb-32 pt-16 backdrop-blur-lg transition-all duration-300`}
          >
            <div></div>
            <AnimatedSection
              className={`text-center text-2xl font-medium text-neutral-200 transition-all duration-300 lg:text-left`}
            >
              {creator?.name}
            </AnimatedSection>

            <AnimatedSection
              className={`mb-3 text-center text-neutral-300 transition-all duration-300 lg:text-left`}
            >
              {/* <span className="font-medium text-pink-500">@</span> */}
              <FontAwesomeIcon
                icon={faAt}
                className="mr-[0.15rem] text-sm text-pink-500"
              />
              {creator?.creatorProfile}
            </AnimatedSection>
            <AnimatedSection
              delay={0.1}
              className={`mb-5 max-w-xl text-center text-sm text-neutral-400 transition-all duration-300  sm:text-base`}
            >
              {creator?.bio}
            </AnimatedSection>
            <AnimatedSection
              delay={0.2}
              className="mb-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              {creator?.socialLinks?.map((link) => (
                <SocialLink
                  collapsed={true}
                  key={link.url}
                  href={link.url}
                  type={link.type}
                ></SocialLink>
              ))}
              {creator?.topmateUrl && creator?.topmateUrl !== "" ? (
                <Tooltip title="Schedule a 1:1 session with me!">
                  <Link
                    href={creator?.topmateUrl ?? ""}
                    target="_blank"
                    className="group flex aspect-square w-10 items-center justify-center rounded-full border border-neutral-500 bg-neutral-200/10 transition-all duration-300 hover:border-neutral-200 hover:bg-[#E44332]"
                  >
                    <div className="group relative h-4 w-4">
                      <ImageWF
                        src="/topmate_logo.png"
                        alt="topmate"
                        fill
                        className="opacity-70 group-hover:opacity-100"
                      />
                    </div>
                  </Link>{" "}
                </Tooltip>
              ) : (
                <></>
              )}
            </AnimatedSection>
            <Link
              id="query"
              href={`/${creator?.creatorProfile ?? ""}/ask-query`}
              className={`w-2/7 group flex items-center justify-center gap-2 rounded-xl bg-neutral-200/10 px-4 py-2 pr-[1.2rem] text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all duration-300 hover:bg-pink-500/80 hover:text-neutral-200`}
            >
              <FontAwesomeIcon icon={faQuestion} /> Ask a query
            </Link>
          </div>
        </div>
        <div className="flex w-full max-w-4xl -translate-y-24 flex-col items-center justify-start gap-8 rounded-3xl bg-gradient-to-b from-neutral-800 via-neutral-800 to-transparent p-8 pb-24 backdrop-blur-sm">
          <AnimatedSection delay={0.3} className="mb-4 flex items-center gap-8">
            <Link
              href={`/${creator.creatorProfile ?? ""}#courses`}
              className={`relative flex justify-center text-sm font-medium uppercase tracking-widest text-neutral-200 duration-150 hover:text-neutral-300 active:scale-95 ${
                !isCoursesTab ? "text-neutral-400" : ""
              }`}
            >
              Courses
              <div
                className={`absolute -bottom-2 mx-auto h-[0.15rem] w-6 rounded-full ${
                  isCoursesTab ? "bg-pink-500" : ""
                }`}
              />
            </Link>
            <Link
              href={`/${creator.creatorProfile ?? ""}#events`}
              className={`relative flex justify-center text-sm font-medium uppercase tracking-widest text-neutral-200 duration-150 hover:text-neutral-300 active:scale-95 ${
                !isEventsTab ? "text-neutral-400" : ""
              }`}
            >
              Events
              <div
                className={`absolute -bottom-2 mx-auto h-[0.15rem] w-6 rounded-full ${
                  isEventsTab ? "bg-pink-500" : ""
                }`}
              />
            </Link>
            <Link
              href={`/${creator.creatorProfile ?? ""}#testimonials`}
              className={`relative flex justify-center text-sm font-medium uppercase tracking-widest text-neutral-200 duration-150 hover:text-neutral-300 active:scale-95 ${
                !isTestimonialsTab ? "text-neutral-400" : ""
              }`}
            >
              Testimonials
              <div
                className={`absolute -bottom-2 mx-auto h-[0.15rem] w-6 rounded-full ${
                  isTestimonialsTab ? "bg-pink-500" : ""
                }`}
              />
            </Link>
          </AnimatedSection>

          {isCreatorLoading ? (
            <Loader size="lg" />
          ) : isEventsTab ? (
            creator.events && creator.events.length > 0 ? (
              <AnimatedSection
                delay={0.4}
                className="flex w-full flex-col items-center gap-4"
              >
                {creator?.events?.map((event) => (
                  <EventCard key={event?.id ?? ""} event={event} />
                ))}
              </AnimatedSection>
            ) : (
              <AnimatedSection
                delay={0.4}
                className="flex w-full flex-col items-center justify-center gap-2 p-4"
              >
                <div className="relative aspect-square w-40 object-contain">
                  <ImageWF src="/empty/event_empty.svg" alt="empty" fill />
                </div>
                <p className="mb-2 text-center text-neutral-400">
                  The creater has not created any events.
                </p>
              </AnimatedSection>
            )
          ) : isTestimonialsTab ? (
            creator.testimonials && creator.testimonials.length > 0 ? (
              <div className="flex w-full max-w-lg flex-col items-center gap-4">
                {creator?.testimonials?.map((testimonial) => (
                  <TestimonialDisclosure
                    key={testimonial?.id ?? ""}
                    testimonial={testimonial}
                  />
                ))}
              </div>
            ) : (
              <AnimatedSection
                delay={0.4}
                className="flex w-full flex-col items-center justify-center gap-2 p-4"
              >
                <div className="relative aspect-square w-40 object-contain">
                  <ImageWF
                    src="/empty/testimonial_empty.svg"
                    alt="empty"
                    fill
                  />
                </div>
                <p className="mb-2 text-center text-neutral-400">
                  The creater has not got any testimonials.
                </p>
              </AnimatedSection>
            )
          ) : creator.courses && creator.courses.length > 0 ? (
            <AnimatedSection
              delay={0.4}
              className="flex w-full flex-col items-center gap-4"
            >
              {creator?.courses?.map((course) => (
                <CourseCard
                  key={course?.id ?? ""}
                  creatorProfile={creator?.creatorProfile ?? undefined}
                  course={course}
                  lg
                />
              ))}
            </AnimatedSection>
          ) : (
            <AnimatedSection
              delay={0.4}
              className="flex w-full flex-col items-center justify-center gap-2 p-4"
            >
              <div className="relative aspect-square w-40 object-contain">
                <ImageWF src="/empty/course_empty.svg" alt="empty" fill />
              </div>
              <p className="mb-2 text-center text-neutral-400">
                The creater has not created any courses.
              </p>
            </AnimatedSection>
          )}
        </div>
        <Link
          id="testimonial"
          href={`/${creator?.creatorProfile ?? ""}/testimonial`}
          className="group flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-neutral-200/10 px-4 py-2 pr-[1.2rem] text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all duration-300 hover:bg-pink-500/80 hover:text-neutral-200"
          onClick={() => {
            MixPannelClient.getInstance().giveTestimonialClicked({
              userId: session.data?.user.id ?? "",
              creatorProfile: creatorProfile,
            });
          }}
        >
          <FontAwesomeIcon icon={faQuoteLeft} /> Write a Testimonial for me
        </Link>
      </main>
    </CreatorLayout>
  );
};

export const getStaticPaths = async () => {
  const creators = await prisma.user.findMany({
    where: {
      isCreator: true,
    },
    select: {
      creatorProfile: true,
    },
  });
  return {
    paths: creators.map((creator) => ({
      params: {
        creator_id: creator.creatorProfile,
      },
    })),
    fallback: true,
  };
};

interface CParams extends ParsedUrlQuery {
  creator_id: string;
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const ssg = generateSSGHelper();
  const creatorProfile = (context.params as CParams).creator_id;

  if (typeof creatorProfile !== "string") throw new Error("no slug");

  await ssg.creator.getPublicProfile.prefetch({ creatorProfile });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      creatorProfile,
    },
  };
}

export default Index;
