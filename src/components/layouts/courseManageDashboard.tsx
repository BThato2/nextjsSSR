import { api } from "@/utils/api";
import { Menu, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  Bars3Icon,
  ArrowLeftIcon,
} from "@heroicons/react/20/solid";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { type ReactNode, Fragment } from "react";
import { Loader } from "../Loader";
import { GlobeAltIcon, PencilIcon } from "@heroicons/react/24/outline";
import { CoursePublishStatus } from "@prisma/client";

export default function CourseManageLayoutR({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id,
  });

  const getStep = () => {
    if (pathname === `/creator/dashboard/course/${id}/manage`) return 1;

    if (pathname === `/creator/dashboard/course/${id}/manage/pricing`) return 2;

    if (pathname === `/creator/dashboard/course/${id}/manage/curriculum`)
      return 3;

    return 4;
  };

  const pathname = usePathname();

  if (courseLoading)
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-8">
        <Loader size="lg" />
      </div>
    );

  if (!course)
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-8">
        <p className="text-center">Course not found</p>
      </div>
    );

  return (
    <div className="flex min-h-screen w-full flex-col items-start justify-start gap-4 p-8 pb-0 pr-4 pt-4">
      <div className="flex w-full flex-col items-start justify-between gap-2 md:flex-row">
        <div className="mt-4 flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/creator/dashboard/course/${course?.id ?? ""}`}
              className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 p-1  px-2 text-sm font-medium hover:bg-neutral-800"
            >
              <ArrowLeftIcon className="w-4" /> Back to Overview
            </Link>{" "}
            <span className="flex gap-1 text-xl font-bold">
              <PencilIcon className="w-5" /> Editing
            </span>{" "}
            <span className="text-xl font-bold">{course?.title}</span>
          </div>
          <div className="flex flex-col items-end sm:hidden">
            <Menu>
              {({ open }) => (
                <>
                  <Menu.Button>
                    {open ? (
                      <ChevronDownIcon className="w-6" />
                    ) : (
                      <Bars3Icon className="w-6" />
                    )}
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
                    <Menu.Items className="fixed z-20 mt-8 flex flex-col overflow-hidden rounded-xl bg-neutral-900/80 backdrop-blur-sm">
                      <Menu.Item>
                        <Link
                          className={`w-full border-b border-neutral-600/50 px-6 py-2 font-medium  active:text-pink-600 ${
                            pathname ===
                            `/creator/dashboard/course/${id}/manage`
                              ? "bg-pink-600/20 text-pink-600"
                              : "hover:text-pink-600"
                          }`}
                          href={`/creator/dashboard/course/${id}/manage`}
                        >
                          Landing
                        </Link>
                      </Menu.Item>
                      <Menu.Item>
                        <Link
                          className={`w-full border-b border-neutral-600/50 px-6 py-2 font-medium active:text-pink-600 ${
                            pathname ===
                            `/creator/dashboard/course/${id}/manage/pricing`
                              ? "bg-pink-600/20 text-pink-600"
                              : "hover:text-pink-600"
                          }`}
                          href={`/creator/dashboard/course/${id}/manage/pricing`}
                        >
                          Pricing
                        </Link>
                      </Menu.Item>
                      <Menu.Item>
                        <Link
                          className={`w-full border-b border-neutral-600/50 px-6 py-2 font-medium active:text-pink-600 ${
                            pathname ===
                            `/creator/dashboard/course/${id}/manage/curriculum`
                              ? "bg-pink-600/20 text-pink-600"
                              : "hover:text-pink-600"
                          }`}
                          href={`/creator/dashboard/course/${id}/manage/curriculum`}
                        >
                          Curriculum
                        </Link>
                      </Menu.Item>
                      <Menu.Item>
                        <Link
                          className={`w-full border-b border-neutral-600/50 px-6 py-2 font-medium active:text-pink-600 ${
                            pathname ===
                            `/creator/dashboard/course/${id}/manage/publish`
                              ? "bg-pink-600/20 text-pink-600"
                              : "hover:text-pink-600"
                          }`}
                          href={`/creator/dashboard/course/${id}/manage/publish`}
                        >
                          Publish
                        </Link>
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </div>

          {course?.publishStatus === CoursePublishStatus?.PUBLISHED ? (
            <Link
              href={
                course?.creator && course?.creator?.creatorProfile
                  ? `/${course?.creator?.creatorProfile}/course/${id}`
                  : `/course/${id}`
              }
              className="flex min-w-[8rem] items-center gap-2 rounded-xl border border-pink-600 px-3 py-[0.35rem] text-xs font-medium text-pink-600 duration-300 hover:bg-pink-600 hover:text-neutral-200"
            >
              <GlobeAltIcon className="w-4" />
              Public Page
            </Link>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className="hidden w-full items-center justify-between gap-4 text-center text-sm font-medium text-neutral-400 sm:flex">
        {course?.publishStatus === CoursePublishStatus?.DRAFT ? (
          <ul className="flex items-center">
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage`}
                className={`flex items-center gap-3 rounded-t-lg p-2 text-xs sm:text-base ${
                  pathname === `/creator/dashboard/course/${id}/manage`
                    ? " text-pink-600"
                    : ""
                }`}
              >
                <div
                  className={`flex aspect-square w-8 items-center justify-center rounded-lg border pt-[3px] text-xl font-bold ${
                    pathname === `/creator/dashboard/course/${id}/manage`
                      ? "border-pink-600 bg-pink-600 text-neutral-200"
                      : getStep() >= 1
                      ? "border-pink-600/70 bg-pink-600/10 text-pink-600/70"
                      : "border-transparent bg-neutral-300/20 text-neutral-400"
                  }`}
                >
                  1
                </div>
                <div
                  className={`flex flex-col items-start ${
                    pathname === `/creator/dashboard/course/${id}/manage`
                      ? ""
                      : "hidden"
                  }`}
                >
                  <p className="text-sm font-bold">Step 1/4</p>
                  <h3 className="text-xl font-bold text-neutral-200">
                    Landing
                  </h3>
                </div>
              </Link>
            </li>
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage/pricing`}
                className={`flex items-center gap-3 rounded-t-lg p-2 text-xs sm:text-base ${
                  pathname === `/creator/dashboard/course/${id}/manage/pricing`
                    ? " text-pink-600"
                    : ""
                }`}
              >
                <div
                  className={`flex aspect-square w-8 items-center justify-center rounded-lg border pt-[3px] text-xl font-bold ${
                    pathname ===
                    `/creator/dashboard/course/${id}/manage/pricing`
                      ? "border-pink-600 bg-pink-600 text-neutral-200"
                      : getStep() >= 2
                      ? "border-pink-600/70 bg-pink-600/10 text-pink-600/70"
                      : "border-transparent bg-neutral-300/20 text-neutral-400"
                  }`}
                >
                  2
                </div>
                <div
                  className={`flex flex-col items-start ${
                    pathname ===
                    `/creator/dashboard/course/${id}/manage/pricing`
                      ? ""
                      : "hidden"
                  }`}
                >
                  <p className="text-sm font-bold">Step 2/4</p>
                  <h3 className="text-xl font-bold text-neutral-200">
                    Pricing
                  </h3>
                </div>
              </Link>
            </li>
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage/curriculum`}
                className={`flex items-center gap-3 rounded-t-lg p-2 text-xs sm:text-base ${
                  pathname ===
                  `/creator/dashboard/course/${id}/manage/curriculum`
                    ? " text-pink-600"
                    : ""
                }`}
              >
                <div
                  className={`flex aspect-square w-8 items-center justify-center rounded-lg border pt-[3px] text-xl font-bold ${
                    pathname ===
                    `/creator/dashboard/course/${id}/manage/curriculum`
                      ? "border-pink-600 bg-pink-600 text-neutral-200"
                      : getStep() >= 3
                      ? "border-pink-600/70 bg-pink-600/10 text-pink-600/70"
                      : "border-transparent bg-neutral-300/20 text-neutral-400"
                  }`}
                >
                  3
                </div>
                <div
                  className={`flex flex-col items-start ${
                    pathname ===
                    `/creator/dashboard/course/${id}/manage/curriculum`
                      ? ""
                      : "hidden"
                  }`}
                >
                  <p className="text-sm font-bold">Step 3/4</p>
                  <h3 className="text-xl font-bold text-neutral-200">
                    Curriculum
                  </h3>
                </div>
              </Link>
            </li>
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage/publish`}
                className={`flex items-center gap-3 rounded-t-lg p-2 text-xs sm:text-base ${
                  pathname === `/creator/dashboard/course/${id}/manage/publish`
                    ? " text-pink-600"
                    : ""
                }`}
              >
                <div
                  className={`flex aspect-square w-8 items-center justify-center rounded-lg border pt-[3px] text-xl font-bold ${
                    pathname ===
                    `/creator/dashboard/course/${id}/manage/publish`
                      ? "border-pink-600 bg-pink-600 text-neutral-200"
                      : getStep() >= 4
                      ? "border-pink-600/70 bg-pink-600/10 text-pink-600/70"
                      : "border-transparent bg-neutral-300/20 text-neutral-400"
                  }`}
                >
                  4
                </div>
                <div
                  className={`flex flex-col items-start ${
                    pathname ===
                    `/creator/dashboard/course/${id}/manage/publish`
                      ? ""
                      : "hidden"
                  }`}
                >
                  <p className="text-sm font-bold">Step 4/4</p>
                  <h3 className="text-xl font-bold text-neutral-200">
                    Publish
                  </h3>
                </div>
              </Link>
            </li>
          </ul>
        ) : (
          <ul className="-mb-px flex flex-wrap border-b border-neutral-700">
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage`}
                className={`inline-block rounded-t-lg px-2 py-4 text-xs sm:p-4 sm:text-base ${
                  pathname === `/creator/dashboard/course/${id}/manage`
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "border-transparent hover:border-neutral-400 hover:text-neutral-300"
                }`}
              >
                Landing
              </Link>
            </li>
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage/pricing`}
                className={`inline-block rounded-t-lg px-2 py-4 text-xs sm:p-4 sm:text-base ${
                  pathname === `/creator/dashboard/course/${id}/manage/pricing`
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "border-transparent hover:border-neutral-400 hover:text-neutral-300"
                }`}
                aria-current="page"
              >
                Pricing
              </Link>
            </li>
            <li className="mr-1 sm:mr-2">
              <Link
                href={`/creator/dashboard/course/${id}/manage/curriculum`}
                className={`inline-block rounded-t-lg px-2 py-4 text-xs sm:p-4 sm:text-base ${
                  pathname ===
                  `/creator/dashboard/course/${id}/manage/curriculum`
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "border-transparent hover:border-neutral-400 hover:text-neutral-300"
                }`}
                aria-current="page"
              >
                Curriculum
              </Link>
            </li>
            <li>
              <Link
                href={`/creator/dashboard/course/${id}/manage/publish`}
                className={`inline-block rounded-t-lg px-2 py-4 text-xs sm:p-4 sm:text-base ${
                  pathname === `/creator/dashboard/course/${id}/manage/publish`
                    ? "border-b-2 border-pink-600 text-pink-600"
                    : "border-transparent hover:border-neutral-400 hover:text-neutral-300"
                }`}
                aria-current="page"
              >
                Publish
              </Link>
            </li>
          </ul>
        )}
      </div>

      {children}
    </div>
  );
}
