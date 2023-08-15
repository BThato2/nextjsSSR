import Layout from "@/components/layouts/main";
import Head from "next/head";
import Link from "next/link";

export default function TAC() {
  return (
    <Layout>
      <Head>
        <title>Terms and Conditions</title>
      </Head>
      <div className="mx-auto my-20 w-11/12 sm:w-10/12 md:w-8/12 lg:w-6/12">
        <div className="flex flex-grow flex-col gap-3">
          <div className="flex min-h-[20px] flex-col items-start gap-4 whitespace-pre-wrap">
            <div className="prose prose-invert w-full break-words">
              <p>Effective Date: 01/07/2023</p>
              <p>
                Thank you for choosing Kroto Kreator Labs Private Limited for
                your purchase. We want to ensure that you have a satisfying
                experience with our products/services. This Refund Policy
                outlines the terms and conditions regarding refunds for
                purchases made through our website, in accordance with the
                requirements of Razorpay.
              </p>

              <h2>1. Eligibility for Refunds:</h2>
              <p>
                1.1 Products/Services: Our refund policy applies to tangible
                goods and digital products/services purchased directly from
                Kroto Kreator Labs Private Limited via our website.
              </p>
              <p>
                1.2 Timeframe for Refunds: To be eligible for a refund, you must
                request it within 7 days from the date of purchase. After 7
                days, we regret to inform you that we cannot offer you a refund.
              </p>

              <h2>2. Non-Refundable Items:</h2>
              <p>
                Certain items are non-refundable, including but not limited to:
                <ul>
                  <li>
                    Downloadable software or digital products that have been
                    accessed or downloaded.
                  </li>
                  <li>Gift cards or promotional vouchers.</li>
                  <li>Services that have been fully rendered or consumed.</li>
                  <li>
                    Personalized or customized products/services that cannot be
                    resold.
                  </li>
                </ul>
              </p>

              <h2>3. Refund Process:</h2>
              <p>
                To initiate a refund, please contact our customer support team
                at kamal@kroto.in . We will require proof of purchase and may
                request additional information to process your refund request.
              </p>
              <p>
                Once your refund request is received and approved, we will
                process the refund to your original payment method within 10
                business days.
              </p>

              <h2>4. Late or Missing Refunds:</h2>
              <p>
                If you havent received your refund within the specified
                timeframe, please check your bank account again. If the refund
                is still not reflected, contact your credit card company/bank as
                it may take some time before your refund is officially posted.
              </p>
              <p>
                If you have completed all these steps and still have not
                received your refund, please contact us at kamal@kroto.in for
                further assistance.
              </p>

              <h2>5. Contact Us:</h2>
              <p>
                If you have any questions or concerns about our Refund Policy,
                please contact us at: <Link href="/contact">Contact Page</Link>
              </p>

              <p>
                Note: This Refund Policy is subject to change without notice. It
                is your responsibility to review this policy periodically for
                any updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
