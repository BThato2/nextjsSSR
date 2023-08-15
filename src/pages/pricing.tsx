import Layout from "@/components/layouts/main";
import { initializeRazorpay } from "@/helpers/razorpay";
import useToast from "@/hooks/useToast";
import { api } from "@/utils/api";
import { CheckIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";

const includedFeatures = [
  "0% Platform Fees (5% in free tier)",
  "1000+ emails per month",
  "Unlimited courses (5 in free tier)",
  "AI generated course outlines and scripts",
];

export default function Example() {
  const { errorToast, successToast } = useToast();
  const { data: session } = useSession();

  const { mutateAsync: createPurchaseOrder } =
    api.premiumSubscription.createRazorpayOrder.useMutation();

  const { mutateAsync: verifyPremiumPurchase } =
    api.premiumSubscription.verifyPremiumPurchase.useMutation();

  const handlePurchaseClicked = async () => {
    const razorpaySDK = await initializeRazorpay();

    if (!razorpaySDK) {
      errorToast("Something went wrong. Please try again later.");
    }

    const purchaseOrder = await createPurchaseOrder();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      name: "Kroto",
      currency: purchaseOrder?.currency,
      amount: purchaseOrder?.amount,
      order_id: purchaseOrder?.id,
      description: "Thanks for choosing Kroto",
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
        await verifyPremiumPurchase({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
        successToast("Payment successful");
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const paymentObject = new window.Razorpay(options);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    paymentObject.open();
  };

  return (
    <Layout>
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-300 sm:text-4xl">
              Simple no-tricks pricing
            </h2>
            <p className="mt-6 text-lg leading-8 text-neutral-300">
              Get the full exprience with all the features. Wtih zero percent
              platform fees <br />
              (5% in the free tier).
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl bg-neutral-900 ring-1 ring-neutral-800 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-neutral-300">
                Premium Subscription
              </h3>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none text-sm font-semibold leading-6 text-pink-600">
                  What&apos;s included
                </h4>
                <div className="h-px flex-auto bg-neutral-700" />
              </div>
              <ul
                role="list"
                className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-neutral-300 sm:grid-cols-2 sm:gap-6"
              >
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none text-pink-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl bg-neutral-800 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-neutral-300">
                    Yearly membership
                  </p>
                  <p className="mt-6 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-neutral-300">
                      ₹1999
                    </span>
                    <span className="text-sm font-semibold leading-6 tracking-wide text-neutral-300">
                      INR
                    </span>
                  </p>
                  <button
                    onClick={handlePurchaseClicked}
                    className="mt-10 block w-full rounded-md bg-pink-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                  >
                    Get access
                  </button>
                  <p className="mt-6 text-xs leading-5 text-neutral-300">
                    This price and the price of courses follows this{" "}
                    <Link
                      className="text-pink-500 hover:underline"
                      href="/refund"
                    >
                      refund policy
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
