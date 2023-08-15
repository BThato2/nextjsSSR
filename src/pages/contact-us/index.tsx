import Layout from "@/components/layouts/main";
import Head from "next/head";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhoneIcon,
} from "@heroicons/react/20/solid";
import { object, string, z, union } from "zod";
import { type UseFormProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import useToast from "@/hooks/useToast";
import { Loader } from "@/components/Loader";

export const contactFormSchema = object({
  name: string().nonempty("Please enter your name."),
  email: string().email(),
  phone: union([string().min(10).max(10), z.undefined(), string().optional()]),
  message: string().max(500),
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

export default function Contact() {
  const methods = useZodForm({
    schema: contactFormSchema,
  });

  const { mutateAsync: contactMutation, isLoading: contactMutationLoading } =
    api.contact.contactUs.useMutation();

  const { successToast } = useToast();

  return (
    <Layout>
      <Head>
        <title>Contact us</title>
      </Head>
      <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-4 p-4 px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Contact us</h1>
          <p className="mt-2 text-neutral-300">
            Ask any query or contact our team
          </p>
        </div>
        <div className="flex w-full flex-col-reverse justify-between gap-8 sm:max-w-4xl sm:flex-row">
          <form
            onSubmit={methods.handleSubmit((values) => {
              void contactMutation(values, {
                onSuccess: () => {
                  successToast(
                    "We have receive your message! We will contact you shortly.",
                  );
                  methods.setValue("name", "");
                  methods.setValue("email", "");
                  methods.setValue("phone", "");
                  methods.setValue("message", "");
                },
              });
            })}
            className="flex w-full flex-col items-start gap-4 sm:max-w-md"
          >
            <div className="flex w-full flex-col gap-1">
              <label className="block font-medium">
                Your Name <span className="">*</span>
              </label>
              <input
                {...methods.register("name")}
                className="block w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                placeholder="Enter Your Name"
              />
              {methods.formState.errors.name?.message && (
                <p className="text-red-700">
                  {methods.formState.errors.name?.message}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="block font-medium">
                Your Email <span className="">*</span>
              </label>
              <input
                {...methods.register("email")}
                className="block w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                placeholder="Enter your Email"
              />
              {methods.formState.errors.email?.message && (
                <p className="text-red-700">
                  {methods.formState.errors.email?.message}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="block font-medium">Your Phone Number</label>
              <input
                {...methods.register("phone")}
                className="block w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                placeholder="Enter your Phone Number"
              />
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="block font-medium">
                Message <span className="">*</span>
              </label>
              <textarea
                value={methods.watch().message}
                onChange={(e) => {
                  methods.setValue(
                    "message",
                    e.target?.value.substring(0, 500),
                  );
                }}
                rows={4}
                className="block w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                placeholder="Enter Your Message"
              />
              {
                <p className="text-end text-xs text-neutral-400">
                  {methods.watch()?.message?.length ?? 0}/{500}
                </p>
              }
              {methods.formState.errors.message?.message && (
                <p className="text-red-700">
                  {methods.formState.errors.message?.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className={`group flex w-full items-center justify-center gap-1 rounded-xl bg-pink-600 px-6 py-2 text-center font-bold text-white transition-all duration-300 hover:bg-pink-700 sm:w-auto sm:min-w-fit `}
            >
              Send Message{" "}
              {contactMutationLoading ? (
                <Loader white />
              ) : (
                <PaperAirplaneIcon className="w-4 duration-150 group-hover:translate-x-2" />
              )}
            </button>
          </form>
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:max-w-sm sm:gap-6">
            <div className="flex w-full flex-col items-center gap-1 sm:gap-2">
              <BuildingOfficeIcon className="w-6 sm:w-12 sm:drop-shadow-[4px_4px_0px_#ec4899]" />
              <p className="w-full text-center font-bold text-neutral-200 sm:text-xl">
                Company
              </p>
              <p className="w-full text-center text-sm text-neutral-400 sm:text-base">
                Kroto Kreator Labs Pvt. Ltd.
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-1 sm:gap-2">
              <MapPinIcon className="w-6 sm:w-12 sm:drop-shadow-[4px_4px_0px_#ec4899]" />
              <p className="w-full text-center font-bold text-neutral-200 sm:text-xl">
                Address
              </p>
              <p className="w-full text-center text-sm text-neutral-400 sm:text-base">
                Pbt by pass road, street bo-3, PN/11/14/2 Shamat Ganj, Bareilly,
                243005, Uttar Pradesh.
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-1 sm:gap-2">
              <PhoneIcon className="w-6 sm:w-12 sm:drop-shadow-[4px_4px_0px_#ec4899]" />
              <p className="w-full text-center font-bold text-neutral-200 sm:text-xl">
                Call us
              </p>
              <p className="w-full text-center text-sm text-neutral-400 sm:text-base">
                +91 79066 82655
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
