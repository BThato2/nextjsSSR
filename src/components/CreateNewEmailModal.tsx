import { api } from "@/utils/api";
import React, { useState } from "react";
import { Loader } from "@/components/Loader";
import {
  PlusCircleIcon,
  XMarkIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/20/solid";
import "react-multi-email/dist/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormProps, useForm } from "react-hook-form";
import { object, boolean, string, type z } from "zod";
import { type BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/style.css";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import useToast from "@/hooks/useToast";
import dynamic from "next/dynamic";
import "react-multi-email/dist/style.css";
import { useSession } from "next-auth/react";

const Editor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

interface CreateNewEmailProps {
  isOpen: boolean | undefined;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateNewEmailModal: React.FC<CreateNewEmailProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const subjectLimit = 100;

  const sendUpdateFormSchema = object({
    subject: string().max(subjectLimit).nonempty("Please enter subject"),
    body: string().max(3000).nonempty("Please enter body of the email"),
    isStyled: boolean(),
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

  const router = useRouter();
  const { id } = router.query as { id: string };

  const session = useSession();

  const methods = useZodForm({
    schema: sendUpdateFormSchema,
  });

  const { mutateAsync: createEmail, isLoading: creatingEmail } =
    api.email.create.useMutation();

  const { mutateAsync: sendPreviewEmail, isLoading: isSendPreviewEmail } =
    api.email.sendPreviewInvitation.useMutation();

  const { successToast, errorToast } = useToast();

  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[60]"
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 h-full overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`h-[95%] w-[90%] transform overflow-hidden rounded-md bg-neutral-800 p-4 text-left align-middle shadow-xl transition-all sm:w-[60%]`}
              >
                <div className="">
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
                <form
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onSubmit={methods.handleSubmit(async (values) => {
                    await createEmail({
                      subject: values.subject,
                      body: values.body,
                      courseId: id,
                      isStyled: values.isStyled,
                    }),
                      methods.reset();
                    setIsOpen(false);
                  })}
                  className="mx-auto my-4 flex w-full flex-col gap-8"
                >
                  <div className="flex flex-col gap-3">
                    <label htmlFor="title" className="text-lg text-neutral-200">
                      Subject
                    </label>
                    <input
                      {...methods.register("subject")}
                      placeholder="Subject"
                      className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium  text-neutral-200 outline outline-1 outline-neutral-600 transition-all duration-300 hover:outline-neutral-500 focus:outline-neutral-400 sm:text-lg"
                    />
                    {methods.formState.errors.subject?.message && (
                      <p className="text-red-700">
                        {methods.formState.errors.subject?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <label htmlFor="body" className="text-lg  text-neutral-200">
                      Body
                    </label>
                    <div className="rounded-lg border border-neutral-700">
                      <Editor
                        onChange={(innerEditor) => {
                          void innerEditor
                            .blocksToHTML(innerEditor.topLevelBlocks)
                            .then((html) => {
                              methods.setValue("body", html);
                            });
                        }}
                        setDynamicEditor={setEditor}
                      />
                    </div>
                    {methods.formState.errors.body?.message && (
                      <p className="text-red-700">
                        {methods.formState.errors.body?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="checkbox"
                      {...methods.register("isStyled")}
                      className="mr-1"
                    />
                    <p>Is styled email ?</p>
                  </div>
                  <div className="mx-auto flex w-full flex-col  gap-4  md:flex-row">
                    <button
                      className={`group inline-flex items-center justify-center gap-1 rounded-xl bg-pink-600 px-[1.5rem] py-2  text-center font-medium text-neutral-200 transition-all duration-300 hover:bg-pink-700 disabled:bg-neutral-700 disabled:text-neutral-300`}
                      type="submit"
                    >
                      {creatingEmail && <Loader size="md" />}Create Email
                      {""}
                      <PlusCircleIcon className="ml-1 w-5" />
                    </button>

                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1  text-center font-medium text-neutral-200 underline decoration-pink-600 underline-offset-4 transition-all duration-300 hover:text-pink-600 disabled:bg-neutral-700 disabled:text-neutral-300`}
                      onClick={async () => {
                        try {
                          await sendPreviewEmail({
                            email: session?.data?.user?.email ?? "",
                            body: methods.watch().body ?? "",
                            subject: methods.watch().subject ?? "",
                            isStyled: methods.watch().isStyled ?? false,
                            username: session?.data?.user?.name ?? "",
                          });
                          successToast("Preview email sent successfully!");
                        } catch {
                          errorToast("Error in sending preview email!");
                        }
                      }}
                    >
                      Send Preview
                      {!isSendPreviewEmail ? (
                        <ArrowUpRightIcon className="h-6 w-6" />
                      ) : (
                        <Loader />
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateNewEmailModal;
