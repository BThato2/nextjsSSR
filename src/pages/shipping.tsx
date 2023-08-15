import Layout from "@/components/layouts/main";
import Head from "next/head";

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
              <h2>Course Delivery</h2>
              <p>
                Our platform enables creators to sell courses directly to
                buyers. As soon as your payment is confirmed, you will receive
                immediate access to the course material. Theres no need for
                shipping physical items, as all course content will be available
                digitally within your account.
              </p>
              <h2>Refund Policy</h2>
              <p>
                We want you to have a satisfying learning experience. If you are
                not completely satisfied with your purchased course, we offer a
                7-day refund policy. Within 7 days from the date of purchase,
                you can request a refund for the course. Please contact our
                customer support team at kamal@kroto.in to initiate the refund
                process.
              </p>
              <p>
                Please note that refunds may take up to [X] business days to be
                processed and returned to your original payment method.
              </p>
              <h2>Contact Us</h2>
              <p>
                If you have any questions or concerns regarding the shipping
                information, course delivery, or refund policy, please dont
                hesitate to reach out to us at kamal@kroto.in for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
