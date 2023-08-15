import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  useState,
  useEffect,
} from "react";
import { type Discount, type Course } from "@prisma/client";
import ImageWF from "@/components/ImageWF";
import { api } from "@/utils/api";
import { initializeRazorpay } from "@/helpers/razorpay";
import useToast from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { MinusCircleIcon, TicketIcon } from "@heroicons/react/24/outline";
import { Loader } from "./Loader";
import creatorAnalytics from "@/helpers/creator-analytics";
import { useRouter } from "next/router";
import { z } from "zod";
import { type UseFormProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const applyPromoCodeSchema = z.object({
  code: z.string({ required_error: "Promo code required!" }).min(1),
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

export default function CheckoutModal({
  course,
  isOpen,
  setIsOpen,
}: {
  course: Course & {
    _count: {
      chapters: number;
    };
    discount: Discount | null;
  };
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const methods = useZodForm({
    schema: applyPromoCodeSchema,
    defaultValues: {
      code: "",
    },
  });

  const {
    mutateAsync: applyPromoCodeMutation,
    isLoading: applyPromoCodeLoading,
  } = api.coursePromoCodes.apply.useMutation();

  const { successToast, warningToast } = useToast();
  const { data: session } = useSession();
  const { errorToast } = useToast();
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState<string | undefined>(undefined);
  const [applyPromoCode, setApplyPromoCode] = useState(false);
  const router = useRouter();
  const { courseBuyClicked_analytics } = creatorAnalytics;
  const currentUrl = router.asPath;
  const isDiscount =
    course?.permanentDiscount !== null ||
    (course?.discount &&
      course?.discount?.deadline?.getTime() > new Date().getTime());

  const discount =
    course?.discount &&
    course?.discount?.deadline?.getTime() > new Date().getTime()
      ? course?.discount?.price
      : course?.permanentDiscount ?? 0;

  const price = isDiscount
    ? discount - (promoDiscount / 100) * discount
    : course?.price - (promoDiscount / 100) * course?.price;

  const {
    mutateAsync: createCourseOrder,
    isLoading: createCourseOrderLoading,
  } = api.courseEnrollment.createBuyCourseOrder.useMutation();

  const {
    mutateAsync: verifyCoursePurchase,
    isLoading: verifyCoursePurchaseLoading,
  } = api.courseEnrollment.verifyCoursePurchase.useMutation();

  const ctx = api.useContext();

  const handleCourseBuyClicked_analytics = () => {
    courseBuyClicked_analytics({
      courseId: course?.id ?? "",
      userId: session?.user.id ?? "",
      pagePath: currentUrl,
    });
  };

  useEffect(() => {
    if (isOpen) {
      handleCourseBuyClicked_analytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleEnrollCourse = async () => {
    const razorpaySDK = await initializeRazorpay();

    if (!razorpaySDK) {
      errorToast("Something went wrong. Please try again later.");
    }

    const courseOrder = await createCourseOrder({
      courseId: course.id,
      promoCode,
    });

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      name: "Kroto",
      currency: courseOrder?.currency,
      amount: courseOrder?.amount,
      order_id: courseOrder?.id,
      description: "Hope you make the most out of this course :)",
      image: "https://kroto.in/kroto-logo-p.png",
      theme: {
        color: "#db2777",
      },
      prefill: {
        name: session?.user?.name,
        email: session?.user?.email,
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        if (courseOrder)
          await verifyCoursePurchase({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            courseId: course.id,
            promoCode,
            amount:
              typeof courseOrder?.amount === "string"
                ? parseInt(courseOrder?.amount)
                : courseOrder?.amount,
          });

        await ctx.courseEnrollment.isEnrolled.invalidate();
        setIsOpen(false);
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const paymentObject = new window.Razorpay(options);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    paymentObject.open();
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-6 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-neutral-800 p-4 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="div" className="flex w-full flex-col gap-4">
                    <div className="flex w-full justify-end">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                        }}
                        type="button"
                        className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-neutral-400 hover:bg-neutral-600"
                      >
                        <XMarkIcon className="w-5" />
                      </button>
                    </div>
                  </Dialog.Title>
                  <div className="mb-12 flex flex-col gap-3">
                    <p className="text-xl">1 course</p>
                    <div className="flex w-full max-w-lg gap-3 rounded-xl p-2 backdrop-blur-sm duration-150 hover:bg-neutral-200/10">
                      <div
                        className={`relative aspect-video w-40 overflow-hidden rounded-lg`}
                      >
                        <ImageWF
                          src={course?.thumbnail ?? ""}
                          alt={course?.title ?? ""}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex h-full w-full flex-col items-start gap-1">
                        <h5
                          className={`line-clamp-2 overflow-hidden text-ellipsis text-xs font-medium sm:max-h-12 sm:text-base`}
                        >
                          {course?.title}
                        </h5>
                        {course._count.chapters > 0 ? (
                          <p
                            className={`flex items-center text-xs text-neutral-300`}
                          >
                            {course._count.chapters} Chapters
                          </p>
                        ) : (
                          <></>
                        )}
                        {course?.price === 0 ? (
                          <p
                            className={`text-xs font-semibold uppercase tracking-widest text-green-500/80 sm:text-sm`}
                          >
                            free
                          </p>
                        ) : (
                          <p
                            className={`text-xs font-semibold uppercase tracking-wide sm:text-sm`}
                          >
                            ₹{course?.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2 text-neutral-400">
                    <Link
                      className="text-sm hover:text-neutral-200"
                      href="/refund"
                    >
                      Refund Policy
                    </Link>

                    {promoDiscount <= 0 ? (
                      applyPromoCode ? (
                        <button
                          onClick={() => setApplyPromoCode(false)}
                          className="flex items-center text-sm font-bold hover:text-neutral-200"
                        >
                          <XMarkIcon className="w-5" />
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => setApplyPromoCode(true)}
                          className="flex items-center gap-1 text-sm font-bold hover:text-neutral-200"
                        >
                          <TicketIcon className="w-5 text-pink-600" />
                          Apply Promo Code
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          setPromoDiscount(0);
                          setPromoCode(undefined);
                        }}
                        className="flex items-center gap-1 text-xs font-bold"
                      >
                        <MinusCircleIcon className="w-4 text-red-600" />
                        Remove Promo Code
                      </button>
                    )}
                    {applyPromoCode ? (
                      <form
                        onSubmit={methods.handleSubmit((values) => {
                          void applyPromoCodeMutation(
                            { ...values, courseId: course?.id },
                            {
                              onSuccess: (discountPercent) => {
                                if (discountPercent) {
                                  successToast(
                                    "Promo Code applied successfully!",
                                  );
                                  setPromoDiscount(discountPercent);
                                  setPromoCode(values.code);
                                  setApplyPromoCode(false);
                                  methods.setValue("code", "");
                                } else {
                                  warningToast(
                                    "Promo Code not valid or not active!",
                                  );
                                }
                              },
                            },
                          );
                        })}
                        className="flex w-full items-center gap-2 py-1"
                      >
                        <div className="relative flex w-full max-w-xs items-center">
                          <input
                            onChange={(e) => {
                              methods.setValue(
                                "code",
                                e.target.value.toUpperCase(),
                              );
                            }}
                            onClick={(e) => e.preventDefault()}
                            value={methods.watch().code}
                            placeholder="✱✱✱✱✱✱✱✱"
                            className="peer w-full rounded-lg bg-pink-500/10 px-2 py-1 font-bold tracking-widest text-neutral-200 outline outline-2 outline-pink-500/40 backdrop-blur-sm transition-all duration-300 placeholder:text-neutral-200/50 hover:outline-pink-500/80 focus:outline-pink-500"
                          />
                        </div>
                        {methods.formState.errors.code?.message && (
                          <p className="my-2 text-red-700">
                            {methods.formState.errors.code?.message}
                          </p>
                        )}

                        <button
                          type="submit"
                          className="flex items-center justify-center gap-1 rounded-lg bg-pink-500 px-3 py-1 text-center font-bold text-neutral-200 duration-150 hover:bg-pink-600"
                        >
                          {applyPromoCodeLoading ? <Loader white /> : <></>}{" "}
                          Apply
                        </button>
                      </form>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="mb-4 flex w-full flex-col">
                    <div className="flex w-full justify-between px-1 py-1">
                      <label>Price</label>
                      <p>₹{(course?.price).toFixed(2)}</p>
                    </div>
                    <div className="flex w-full justify-between px-1 py-1">
                      <label>Charges</label>
                      <p>₹{(0.02 * price).toFixed(2)}</p>
                    </div>
                    {isDiscount ? (
                      <div className="flex w-full justify-between px-1 py-1">
                        <label>Discount</label>
                        <p className="text-green-500">
                          -
                          {100 -
                            parseFloat(
                              ((discount / course?.price ?? 1) * 100).toFixed(
                                2,
                              ),
                            )}
                          %
                        </p>
                      </div>
                    ) : (
                      <></>
                    )}
                    {promoDiscount > 0 ? (
                      <div className="flex w-full justify-between px-1 py-1">
                        <label className="flex w-full items-center gap-1">
                          <span className="flex items-center gap-1 font-bold tracking-widest">
                            {promoCode}
                          </span>{" "}
                          Promo Code Discount
                        </label>
                        <p className="text-green-500">-{promoDiscount}%</p>
                      </div>
                    ) : (
                      <></>
                    )}
                    <div className="flex w-full justify-between border-b border-t border-neutral-300 px-1 py-1">
                      <label>To pay</label>
                      <p className="text-xl font-bold">
                        ₹{(price + 0.02 * price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      void handleEnrollCourse();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 px-3 py-2  text-center font-bold uppercase tracking-wider duration-150 hover:bg-pink-600"
                  >
                    {createCourseOrderLoading || verifyCoursePurchaseLoading ? (
                      <Loader white />
                    ) : (
                      <></>
                    )}{" "}
                    Checkout
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

export const calculatePrice = ({
  price,
  permanentDiscount,
  discount,
  promoDiscount,
}: {
  price: number;
  permanentDiscount: number | null;
  discount: Discount | null;
  promoDiscount: number;
}) => {
  const isDiscount =
    permanentDiscount !== null ||
    (discount && discount?.deadline?.getTime() > new Date().getTime());

  const discountPrice =
    discount && discount?.deadline?.getTime() > new Date().getTime()
      ? discount?.price
      : permanentDiscount ?? 0;

  return isDiscount
    ? discountPrice - (promoDiscount / 100) * discountPrice
    : price - (promoDiscount / 100) * price;
};
