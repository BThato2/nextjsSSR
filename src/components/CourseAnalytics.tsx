import React, { useState } from "react";
import {
  CursorArrowRaysIcon,
  UserIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import LineChart from "@/components/LineChart";
import { type TooltipItem } from "chart.js";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Loader } from "./Loader";

const CourseAnalytics = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: coursePageViews, isLoading: isCoursePageViews } =
    api.creatorAnalytics.getCoursePageViewed.useQuery({
      courseId: id ?? "",
    });

  const labelArray =
    coursePageViews?.map((pageView) => {
      const date = new Date(pageView.date);
      const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });
      return dayOfWeek;
    }) ?? [];

  const valueArray = coursePageViews?.map((view) => view.views) ?? [];

  const numberOfViews = valueArray.reduce(
    (accumulator: number, currentValue: number) => accumulator + currentValue,
    0,
  );

  const { data: noOfCourseBuyClicks, isLoading: isNoOfCourseBuyClicks } =
    api.creatorAnalytics.getCourseBuyClicks.useQuery({
      courseId: id ?? "",
    });

  const {
    data: noOfCourseDetailsClicks,
    isLoading: isNoOfCourseDetailsClicks,
  } = api.creatorAnalytics.getCourseDetailsClicks.useQuery({
    courseId: id ?? "",
  });

  const { data: uniqueUserCoursePageViewedData } =
    api.creatorAnalytics.getUniqueUserCoursePageViewedData.useQuery({
      courseId: id ?? "",
    });

  const uniqueValueArray =
    uniqueUserCoursePageViewedData?.map((view) => view.views) ?? [];

  const numberOfUniqueViews = uniqueValueArray.reduce(
    (accumulator: number, currentValue: number) => accumulator + currentValue,
    0,
  );

  const { data: uniqueUserCourseBuyClickedData } =
    api.creatorAnalytics.getUniqueUserCourseBuyClickedData.useQuery({
      courseId: id ?? "",
    });

  const { data: uniqueUserCourseDetailsClickedData } =
    api.creatorAnalytics.getUniqueUserCourseDetailsClickedData.useQuery({
      courseId: id ?? "",
    });

  const { data: course } = api.course.get.useQuery({ id });

  const ViewsSelect = [{ name: "Total Users" }, { name: "Unique Users" }];

  const [selected, setSelected] = useState(ViewsSelect[0]);

  return (
    <>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="flex  w-full flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-4 sm:w-[70%] ">
          <div className="flex items-start justify-between ">
            <h1 className="text-base font-medium text-neutral-200 sm:text-lg">
              Page Views
            </h1>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <h1 className="text-end text-3xl font-black text-pink-500 sm:text-4xl">
                  {numberOfViews}
                </h1>
                <span className="text-end text-base sm:text-start sm:text-sm">
                  views.
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-end text-3xl font-black text-green-700 sm:text-4xl">
                  {numberOfUniqueViews}
                </h1>
                <span className="text-end text-base sm:text-start sm:text-sm">
                  unique views.
                </span>
              </div>
            </div>
          </div>
          {isCoursePageViews ? (
            <div className="flex h-full items-center justify-center">
              <Loader />
            </div>
          ) : (
            <div className="h-full">
              {valueArray.length === 0 ? (
                <p className="flex h-full items-center justify-center text-2xl text-white">
                  No data
                </p>
              ) : (
                <LineChart
                  yTickCallback={(value: string | number) => `${value}`}
                  labels={labelArray}
                  datasets={[
                    {
                      label: "No of total viewers",
                      data: valueArray,
                    },
                    {
                      label: "No of unique viewers",
                      data: uniqueValueArray,
                      borderColor: "#15803d",
                      pointBorderColor: "#15803d",
                      pointBackgroundColor: "#15803d",
                    },
                  ]}
                  xTickCallback={(val: string | number) => {
                    return labelArray[val as number] ?? "";
                  }}
                  tooltipLabelCallback={function (
                    tooltipItem: TooltipItem<"line">,
                  ) {
                    return (
                      uniqueValueArray[tooltipItem.dataIndex]?.toString() ?? ""
                    );
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="flex w-full  flex-col gap-3 sm:w-[30%]">
          <div className=" w-full">
            <Listbox value={selected} onChange={setSelected}>
              <div className="relative ">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-3 pr-10 text-left shadow-md ">
                  <span className="block truncate">{selected?.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-800  bg-neutral-900 py-1 text-base shadow-lg  sm:text-sm">
                    {ViewsSelect.map((person, personIdx) => (
                      <Listbox.Option
                        key={personIdx}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-4  ${
                            active ? "bg-neutral-900" : "text-gray-900"
                          }`
                        }
                        value={person}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected
                                  ? "font-medium text-white"
                                  : "font-normal text-white"
                              }`}
                            >
                              {person.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <div className="flex h-full flex-col ">
            <div className="flex max-w-5xl flex-col justify-between gap-5  lg:flex-row">
              <div className="flex flex-grow flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6">
                <div className="flex flex-row gap-2">
                  <CursorArrowRaysIcon className="w-5 text-pink-500" />
                  <p className="text-base font-semibold lg:text-lg">
                    {" "}
                    Interacted by
                  </p>
                </div>
                <div className="flex gap-2">
                  {isNoOfCourseDetailsClicks ? (
                    <div className="h-9 w-full animate-pulse rounded-xl bg-neutral-800"></div>
                  ) : (
                    <p className="text-3xl font-bold">
                      {selected?.name === "Total Users"
                        ? noOfCourseDetailsClicks
                          ? noOfCourseDetailsClicks
                          : "No data"
                        : uniqueUserCourseDetailsClickedData
                        ? uniqueUserCourseDetailsClickedData
                        : "No data"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col gap-2">
            <div className="flex max-w-5xl flex-col justify-between gap-5  lg:flex-row">
              <div className="flex flex-grow flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6">
                <div className="flex flex-row gap-2">
                  <CheckBadgeIcon className="w-5 text-pink-500" />
                  <p className="text-base font-semibold lg:text-lg">
                    Checkout initiated
                  </p>
                </div>
                <div className="flex gap-2">
                  {isNoOfCourseBuyClicks ? (
                    <div className="h-9 w-full animate-pulse rounded-xl bg-neutral-800"></div>
                  ) : (
                    <p className="text-3xl font-bold">
                      {selected?.name === "Total Users"
                        ? noOfCourseBuyClicks
                          ? noOfCourseBuyClicks
                          : "No data"
                        : uniqueUserCourseBuyClickedData
                        ? uniqueUserCourseBuyClickedData
                        : "No data"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col gap-2">
            <div className="flex max-w-5xl flex-col justify-between gap-5 lg:flex-row">
              <div className="flex flex-grow flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6">
                <div className="flex flex-row gap-2">
                  <UserIcon className="w-5 text-pink-500" />
                  <p className="text-base font-semibold lg:text-lg">
                    Enrollments
                  </p>
                </div>
                <div className="flex gap-2">
                  <p className="text-3xl font-bold">
                    {course?.enrollments.length ?? "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseAnalytics;
