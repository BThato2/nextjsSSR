import React from "react";
import { DashboardLayout } from "..";
import Head from "next/head";
// import UserPlusIcon from "@heroicons/react/20/solid/UserPlusIcon";
// import CurrencyRupeeIcon from "@heroicons/react/20/solid/CurrencyRupeeIcon";
// import Link from "next/link";
import LineChart from "@/components/LineChart";
import { type TooltipItem } from "chart.js";
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";
import { Loader } from "../../../../components/Loader";

const Index = () => {
  const session = useSession();
  const { data: creatorPageViews, isLoading: isCreatorPageViews } =
    api.creatorAnalytics.getProfileViewedData.useQuery({
      creatorId: session?.data?.user.id ?? "",
    });

  const labelArray =
    creatorPageViews?.map((pageView) => {
      const date = new Date(pageView.date);
      const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });
      return dayOfWeek;
    }) ?? [];

  const valueArray = creatorPageViews?.map((view) => view.views) ?? [];

  const numberOfViews = valueArray.reduce(
    (accumulator: number, currentValue: number) => accumulator + currentValue,
    0,
  );

  const { data: uniqueUserCraetorPageViewedData } =
    api.creatorAnalytics.getProfileViewedData.useQuery({
      creatorId: session?.data?.user.id ?? "",
      unique: true ?? false,
    });

  const uniqueValueArray =
    uniqueUserCraetorPageViewedData?.map((view) => view.views) ?? [];

  const numberOfUniqueViews = uniqueValueArray.reduce(
    (accumulator: number, currentValue: number) => accumulator + currentValue,
    0,
  );

  return (
    <>
      <Head>
        <title>Analytics | Dashboard</title>
      </Head>
      <div className="flex w-full flex-col gap-4 p-8 ">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-xl font-medium text-neutral-200 sm:text-2xl">
            Analytics
          </h1>
        </div>
        <div className="flex  flex-col justify-start gap-4 py-4">
          <div className="flex w-full flex-col justify-between gap-2 rounded-lg bg-neutral-900 p-2 sm:w-full sm:gap-6 sm:p-4 md:w-full lg:w-full xl:w-[70%] ">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-neutral-200 sm:text-2xl">
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

            <div className="h-96 w-full">
              {isCreatorPageViews ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader />
                </div>
              ) : (
                <>
                  {valueArray.length == 0 ? (
                    <p className="flex h-96 items-center justify-center text-2xl">
                      no data
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
                          uniqueValueArray[tooltipItem.dataIndex]?.toString() ??
                          ""
                        );
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {/* <div className="flex w-full flex-col justify-center gap-4 py-4 sm:w-[70%] sm:flex-row ">
            <div className="flex h-48 w-full flex-col justify-between rounded-lg bg-neutral-900 p-4 sm:w-1/2">
              <div className="flex flex-col items-start justify-start gap-3 ">
                <UserPlusIcon className="h-6 w-6 text-pink-500" />

                <h1 className="text-xl font-medium text-neutral-200 sm:text-2xl">
                  Registrations
                </h1>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-neutral+ text-4xl font-semibold">232</h1>
                <Link
                  href="/"
                  className="flex cursor-pointer underline decoration-pink-500 underline-offset-4"
                >
                  View More{" "}
                </Link>
              </div>
            </div>
            <div className="flex h-48 w-full flex-col justify-between rounded-lg bg-neutral-900 p-4 sm:w-1/2">
              <div className="flex flex-col items-start justify-start gap-3 ">
                <CurrencyRupeeIcon className="h-6 w-6 text-pink-500" />

                <h1 className="text-xl font-medium text-neutral-200 sm:text-2xl">
                  Earnings
                </h1>
              </div>
              <div className="flex items-center justify-start gap-4 text-2xl">
                <h1 className="text-neutral text-4xl font-semibold">
                  {isTotalEarning ? (
                    <div className="h-9 w-full animate-pulse rounded-xl bg-neutral-800"></div>
                  ) : (
                    <span>₹{totalEarning ? totalEarning / 100 : 0}</span>
                  )}
                </h1>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default Index;
Index.getLayout = DashboardLayout;
