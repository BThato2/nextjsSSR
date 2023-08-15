import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { type GetStaticPropsContext } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { type ParsedUrlQuery } from "querystring";
import { useEffect } from "react";
import { prisma } from "@/server/db";
import {
  type Discount,
  type Course,
  type User,
  CoursePublishStatus,
  type CourseSection,
  type BlocksChapter,
} from "@prisma/client";
import { MixPannelClient } from "@/analytics/mixpanel";
import CoursePublicPage from "@/components/CoursePublicPage";
import { useState } from "react";
import { useRouter } from "next/router";
import creatorAnalytics from "@/helpers/creator-analytics";
import deviceId_analytics from "@/helpers/device-id";

type Props = {
  courseId: string;
  creatorProfile: string;
};

const Index = ({ courseId, creatorProfile }: Props) => {
  const session = useSession();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_scrollY, setScrollY] = useState(0);
  const { coursePagedViewed_analytics: coursePagedViewed } = creatorAnalytics;

  const { data: creator } = api.creator.getPublicProfile.useQuery({
    creatorProfile,
  });

  const { data: course } = api.course.getCourse.useQuery({ id: courseId });

  const currentUrl = router.asPath;
  const userId = session.data?.user.id;

  const { getDeviceIdFromLocalStorage } = deviceId_analytics;

  useEffect(() => {
    if (
      userId &&
      course &&
      session?.data?.user?.id !== course?.creator?.id &&
      currentUrl
    ) {
      coursePagedViewed({
        courseId: course?.id ?? "",
        userId: userId ?? "",
        pagePath: currentUrl ?? "",
      });
    }
  }, [course, userId, currentUrl, session, coursePagedViewed]);

  useEffect(() => {
    if (!userId && session.status !== "loading") {
      const deviceId = getDeviceIdFromLocalStorage();
      coursePagedViewed({
        courseId: course?.id ?? "",
        userId: userId ?? "",
        pagePath: currentUrl,
        deviceId: deviceId ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, userId, session]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // just trigger this so that the initial state
    // is updated as soon as the component is mounted
    // related: https://stackoverflow.com/a/63408216
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (courseId && session.status !== "loading")
      MixPannelClient.getInstance().courseViewed({
        userId: session.data?.user.id ?? "",
        courseId,
      });
  }, [courseId, session]);

  if (!course)
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-medium text-neutral-200">
          Course not found
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
    <>
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
        creator={creator as User}
      />
    </>
  );
};

export const getStaticPaths = async () => {
  const paths: { params: { creator_id: string; id: string } }[] = [];

  const creators = await prisma.user.findMany({
    where: {
      isCreator: true,
    },
  });

  await Promise.all(
    creators.map(async (creator) => {
      const courses = await prisma.course.findMany({
        where: {
          creatorId: creator.id,
          publishStatus: CoursePublishStatus.PUBLISHED,
        },
        select: {
          id: true,
        },
      });

      paths.push(
        ...courses.map((course) => ({
          params: {
            creator_id: creator?.creatorProfile ?? "",
            id: course.id,
          },
        })),
      );
    }),
  );

  return {
    paths,
    fallback: true,
  };
};

interface CParams extends ParsedUrlQuery {
  id: string;
  creator_id: string;
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const ssg = generateSSGHelper();
  const courseId = (context.params as CParams).id;
  const creatorProfile = (context.params as CParams).creator_id;

  if (typeof courseId !== "string") throw new Error("no slug");

  await ssg.course.getCourse.prefetch({ id: courseId });
  await ssg.creator.getPublicProfile.prefetch({ creatorProfile });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      courseId,
      creatorProfile,
    },
  };
}

export default Index;
