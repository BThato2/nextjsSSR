import { useState, useEffect } from "react";
import React, { type ReactNode } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import {
  ArrowUpRightIcon,
  ChevronDoubleRightIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import dynamic from "next/dynamic";
import { DashboardLayout } from "../../..";
import { z } from "zod";
import { type UseFormProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfigProvider, DatePicker, TimePicker, theme } from "antd";
import dayjs from "dayjs";
import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import {
  type User,
  type Course,
  CoursePublishStatus,
  type Discount,
  type CourseSection,
  type BlocksChapter,
} from "@prisma/client";
import { isEqual } from "lodash";
import { getDateTimeDiffString } from "@/helpers/time";
import { krotoCharge, paymentGatewayCharge } from "@/constants/values";
import useToast from "@/hooks/useToast";
import CoursePricingInfoModal from "@/components/CoursePricingInfoModal";

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

export const updateCoursePricingFormSchema = z
  .object({
    id: z.string().nonempty(),
    // thumbnail: z.string().nonempty("Please upload a cover"),
    // title: z.string().max(titleLimit).nonempty("Please enter course title."),
    // description: z
    //   .string()
    //   .max(3000)
    //   .nonempty("Please enter course description."),
    price: z.string().nonempty("Please enter course price."),
    permanentDiscount: z
      .string()
      .nonempty("Please enter course discounted price."),
    discount: z
      .object({
        price: z.string().nonempty("Please enter discount price."),
        deadline: z.date({ required_error: "Please enter discount deadline." }),
      })
      .optional(),
    // tags: z.array(z.object({ id: z.string(), title: z.string() })),
    // outcomes: z.array(
    //   z.string().max(outcomeLimit).nonempty("Please enter course outcome.")
    // ),
    // startsAt: z.date().optional(),
  })
  .refine(
    (data) => {
      return parseInt(data.price) > parseInt(data.permanentDiscount);
    },
    {
      message: "Base price should be greater than discounted price.",
      path: ["price"],
    },
  )
  .refine(
    (data) => {
      return !!data?.discount
        ? parseInt(data.permanentDiscount) > parseInt(data?.discount?.price)
        : true;
    },
    {
      message: "Discounted price should be greater than presale price.",
      path: ["permanentDiscount"],
    },
  );

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

const CourseManagePricing = () => {
  const methods = useZodForm({
    schema: updateCoursePricingFormSchema,
    defaultValues: {
      id: "",
      // title: "",
      // description: "",
      // thumbnail: "",
      price: "0",
      permanentDiscount: "0",
      // tags: [],
      // outcomes: [],
    },
  });

  const [pricingInfo, setPricingInfo] = useState(false);

  const { darkAlgorithm } = theme;

  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: course, isLoading: courseLoading } = api.course.get.useQuery({
    id,
  });

  const { mutateAsync: updatePricingMutation, isLoading: updateLoading } =
    api.courseEdit.updatePricing.useMutation();

  const revalidate = useRevalidateSSG();

  const [courseInit, setCourseInit] = useState<
    | {
        id: string;
        price: string;
        permanentDiscount: string;
        discount:
          | {
              price: string;
              id: string;
              deadline: Date;
              courseId: string;
            }
          | undefined;
      }
    | undefined
  >(undefined);

  const [previewOpen, setPreviewOpen] = useState(false);

  const { errorToast } = useToast();

  const isDiscount =
    methods.watch()?.permanentDiscount !== null ||
    (methods.watch()?.discount &&
      (methods.watch()?.discount?.deadline ?? new Date())?.getTime() >
        new Date().getTime());

  const discount =
    methods.watch()?.discount &&
    (methods.watch()?.discount?.deadline ?? new Date()).getTime() >
      new Date().getTime()
      ? methods.watch()?.discount?.price ?? "0"
      : methods.watch()?.permanentDiscount ?? "0";

  const price = isDiscount
    ? parseInt(discount)
    : parseInt(methods.watch()?.price) ?? 0;

  useEffect(() => {
    if (course && !courseInit) {
      // methods.setValue("id", course?.id ?? "");
      // methods.setValue("title", course?.title ?? "");
      // methods.setValue("thumbnail", course?.thumbnail ?? "");
      // methods.setValue("description", course?.description ?? "");
      // methods.setValue("price", course?.price.toString());
      // methods.setValue(
      //   "permanentDiscount",
      //   (course?.permanentDiscount ?? 0).toString()
      // );
      // methods.setValue(
      //   "outcomes",
      //   (course?.outcomes as string[] | undefined) ?? []
      // );
      // methods.setValue("tags", course?.tags);
      // methods.setValue(
      //   "discount",
      //   course?.discount
      //     ? { ...course?.discount, price: course?.discount?.price?.toString() }
      //     : undefined
      // );
      // methods.setValue("startsAt", course?.startsAt ?? undefined);
      const initData = {
        id: course?.id ?? "",
        price: course?.price.toString(),
        permanentDiscount: (course?.permanentDiscount ?? 0).toString(),
        discount: course?.discount
          ? { ...course?.discount, price: course?.discount?.price?.toString() }
          : undefined,
      };
      methods.reset(initData);
      setCourseInit(initData);
    }
  }, [course, courseInit, methods]);

  // FIXME: called before saving data
  // useLeavePageConfirmation(!isEqual(methods.watch(), courseInit));

  // const saveRequired =
  //   methods.watch() !==
  //   {
  //     id: course?.id,
  //     title: course?.title ,
  //     description: course?.description,
  //     thumbnail: course?.thumbnail,
  //     outcomes: course?.outcomes,
  //     tags: course?.tags,
  //     startsAt: course?.startsAt,
  //   };

  if (courseLoading)
    return (
      <>
        <Head>
          <title>Course | Manage Pricing</title>
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
              course={
                {
                  ...course,
                  price: parseInt(methods.watch()?.price),
                  permanentDiscount: parseInt(
                    methods.watch()?.permanentDiscount,
                  ),
                  discount: !!methods.watch().discount
                    ? {
                        ...course?.discount,
                        price: parseInt(
                          methods.watch()?.discount?.price ?? "0",
                        ),
                        deadline:
                          methods.watch()?.discount?.deadline ?? new Date(),
                      }
                    : undefined,
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
            await updatePricingMutation(values, {
              onSuccess: (courseUpdated) => {
                const initData = {
                  id: courseUpdated?.id ?? "",
                  price: courseUpdated?.price.toString(),
                  permanentDiscount: (
                    courseUpdated?.permanentDiscount ?? 0
                  ).toString(),
                  discount: courseUpdated?.discount
                    ? {
                        ...courseUpdated?.discount,
                        price: courseUpdated?.discount?.price?.toString(),
                      }
                    : undefined,
                };
                setCourseInit(initData);
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
                    }/manage/curriculum`,
                  );
              },
              onError: () => {
                errorToast("Error in updating course pricing!");
              },
            });
          })}
          className="flex w-full flex-col"
        >
          <Head>
            <title>{`${course?.title ?? "Course"} | Manage Pricing`}</title>
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
          <div className="relative flex h-[calc(100vh-13.3rem)] w-full flex-col items-start gap-8 overflow-y-auto">
            {/* <pre>{JSON.stringify(methods.watch(), null, 2)}</pre> */}
            <div className="mt-4 flex w-full max-w-2xl flex-col gap-4 pl-1">
              <div className="flex items-start gap-4 sm:gap-8">
                <div className="mt-4 flex flex-col gap-3">
                  <label htmlFor="price" className="text-lg  text-neutral-200">
                    Price
                  </label>
                  <div className="relative flex w-full max-w-[7rem] items-center">
                    <input
                      type="number"
                      {...methods.register("price")}
                      className="peer block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 pl-8 placeholder-neutral-500 outline-none ring-transparent transition duration-300 [appearance:textfield] hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="00"
                      defaultValue={2000}
                    />
                    <p className="absolute ml-3 text-neutral-400 duration-150 peer-focus:text-neutral-300">
                      ₹
                    </p>
                  </div>

                  {methods.formState.errors?.price?.message && (
                    <p className="text-xs text-red-700">
                      {methods.formState.errors?.price?.message}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <label
                    htmlFor="permanentDiscount"
                    className="text-lg  text-neutral-200"
                  >
                    Discounted Price
                  </label>

                  <div className="relative flex w-full max-w-[7rem] items-center">
                    <input
                      type="number"
                      {...methods.register("permanentDiscount")}
                      className="peer block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 pl-8 placeholder-neutral-500 outline-none ring-transparent transition duration-300 [appearance:textfield] hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="00"
                      defaultValue={400}
                    />
                    <p className="absolute ml-3 text-neutral-400 duration-150 peer-focus:text-neutral-300">
                      ₹
                    </p>
                  </div>

                  {methods.formState.errors?.permanentDiscount?.message && (
                    <p className="text-xs text-red-700">
                      {methods.formState.errors?.permanentDiscount?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  {methods.watch().discount ? (
                    <>
                      <label
                        htmlFor="discount"
                        className="text-lg text-neutral-200"
                      >
                        Pre Sale
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          methods.setValue("discount", undefined);
                        }}
                        className="rounded-lg border border-pink-500 px-2 py-1 text-sm font-bold text-pink-500 duration-150 hover:border-pink-600 hover:text-pink-600"
                      >
                        Clear Pre-sale
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        methods.setValue("discount", {
                          price: "0",
                          deadline: new Date(
                            new Date().setDate(new Date().getDate() + 1),
                          ),
                        });
                      }}
                      className="flex items-center gap-1 rounded-lg border border-pink-500 px-2 py-1 text-sm font-bold text-pink-500 duration-150 hover:border-pink-600 hover:text-pink-600"
                    >
                      <PlusIcon className="w-4" /> Add a Pre-sale Price
                    </button>
                  )}
                </div>
                {methods.watch().discount ? (
                  <>
                    <label
                      htmlFor="dPrice"
                      className="text-sm text-neutral-200"
                    >
                      Price
                    </label>

                    <div className="relative flex w-full max-w-[7rem] items-center">
                      <input
                        type="number"
                        {...methods.register("discount.price")}
                        className="peer block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 pl-8 placeholder-neutral-500 outline-none ring-transparent transition duration-300 [appearance:textfield] hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        placeholder="00"
                        defaultValue={0}
                      />
                      <p className="absolute ml-3 text-neutral-400 duration-150 peer-focus:text-neutral-300">
                        ₹
                      </p>
                    </div>

                    <label
                      htmlFor="dDeadline"
                      className="text-sm text-neutral-200"
                    >
                      Deadline
                    </label>
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
                            methods
                              .watch()
                              ?.discount?.deadline?.toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              ),
                            "DD-MM-YYYY",
                          )}
                          onChange={(selectedDate) => {
                            const sourceDateObj =
                              selectedDate?.toDate() ?? new Date();
                            const targetDateObj =
                              methods.watch()?.discount?.deadline ?? new Date();
                            targetDateObj.setFullYear(
                              sourceDateObj.getFullYear(),
                            );
                            targetDateObj.setMonth(sourceDateObj.getMonth());
                            targetDateObj.setDate(sourceDateObj.getDate());
                            methods.setValue(
                              "discount.deadline",
                              targetDateObj,
                            );
                          }}
                        />
                        <TimePicker
                          autoFocus={false}
                          bordered={false}
                          use12Hours
                          value={dayjs(
                            (
                              methods.watch()?.discount?.deadline ?? new Date()
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }),
                            "hh:mm A",
                          )}
                          onChange={(selectedTime) => {
                            if (selectedTime) {
                              const prvDate = new Date(
                                methods.watch()?.discount?.deadline ??
                                  new Date(),
                              );

                              prvDate.setHours(
                                selectedTime.toDate().getHours(),
                              );
                              prvDate.setMinutes(
                                selectedTime.toDate().getMinutes(),
                              );

                              methods.setValue("discount.deadline", prvDate);
                            }
                          }}
                          format="hh:mm A"
                          disabledTime={() => {
                            const now = dayjs();
                            return {
                              disabledHours: () => {
                                if (
                                  dayjs(
                                    methods.watch()?.discount?.deadline,
                                  ).format("DD/MM/YYYY") ===
                                  dayjs(new Date()).format("DD/MM/YYYY")
                                )
                                  return [...Array(now.hour()).keys()];
                                return [];
                              },
                              disabledMinutes: (selectedHour) => {
                                if (
                                  dayjs(
                                    methods.watch()?.discount?.deadline,
                                  ).format("DD/MM/YYYY") ===
                                  dayjs(new Date()).format("DD/MM/YYYY")
                                ) {
                                  if (now.hour() === selectedHour) {
                                    return [...Array(now.minute()).keys()];
                                  }
                                  return [];
                                }
                                return [];
                              },
                            };
                          }}
                          style={{
                            color: "#fff",
                          }}
                        />
                      </ConfigProvider>
                      {/* <BsCalendar3Event className="absolute ml-3 text-neutral-400 peer-focus:text-neutral-200" /> */}
                    </div>
                    <p className="text-sm text-yellow-600">
                      <span className="font-bold">
                        {getDateTimeDiffString(
                          new Date(),
                          methods.watch().discount?.deadline ?? new Date(),
                        )}
                      </span>{" "}
                      remaining on pre-sale price.
                    </p>
                    {methods.formState.errors.discount?.message && (
                      <p className="text-xs text-red-700">
                        {methods.formState.errors.discount?.message}
                      </p>
                    )}
                    {methods.formState.errors.discount?.price?.message && (
                      <p className="text-xs text-red-700">
                        {methods.formState.errors.discount?.price?.message}
                      </p>
                    )}
                    {methods.formState.errors.discount?.deadline?.message && (
                      <p className="text-xs text-red-700">
                        {methods.formState.errors.discount?.deadline?.message}
                      </p>
                    )}
                  </>
                ) : (
                  <></>
                )}
              </div>

              {price > 0 ? (
                <div className="w-full rounded-lg bg-neutral-900 p-4">
                  <p className="text-sm">
                    Course learners will have to pay ₹
                    {price > 0
                      ? (price + paymentGatewayCharge * price).toFixed(2)
                      : 0}{" "}
                    & you will get ₹
                    {price > 0 ? (price - krotoCharge * price).toFixed(2) : 0} .
                  </p>

                  <button
                    type="button"
                    onClick={() => setPricingInfo(true)}
                    className="mt-4 text-sm underline"
                  >
                    How is this calculated?
                  </button>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </form>
        <CoursePricingInfoModal
          isOpen={pricingInfo}
          setIsOpen={setPricingInfo}
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

CourseManagePricing.getLayout = CourseNestedLayout;

export default CourseManagePricing;

function CourseLayout(page: ReactNode) {
  return <CourseManageLayoutR>{page}</CourseManageLayoutR>;
}

export { CourseLayout };
