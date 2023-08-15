import { RouterOutputs, api } from "@/utils/api";
import React, { useState, useEffect } from "react";
import { Loader } from "@/components/Loader";
import {
  PlusCircleIcon,
  XMarkIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/20/solid";
import { ReactMultiEmail } from "react-multi-email";
import "react-multi-email/dist/style.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormProps, useForm } from "react-hook-form";
import { object, boolean, string, array, type z } from "zod";
import AnimatedSection from "@/components/AnimatedSection";
import { type BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/style.css";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import useToast from "@/hooks/useToast";
import dynamic from "next/dynamic";
import { type Dispatch, type SetStateAction } from "react";
import { Menu } from "@headlessui/react";
import { useTable, type Column } from "react-table";
import "react-multi-email/dist/style.css";
import { useSession } from "next-auth/react";

const Editor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

interface EditEmailProps {
  editEmail: RouterOutputs["email"]["getEmail"] | null;
  setEditEmail: React.Dispatch<
    React.SetStateAction<RouterOutputs["email"]["getEmail"] | null>
  >;
  isOpen: boolean | undefined;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditEmailModal: React.FC<EditEmailProps> = ({
  editEmail,
  setEditEmail,
  isOpen,
  setIsOpen,
}) => {
  const subjectLimit = 100;

  const sendUpdateFormSchema = object({
    subject: string().max(subjectLimit).nonempty("Please enter subject"),
    body: string().max(3000).nonempty("Please enter body of the email"),
    isStyled: boolean(),
    //   recipients: array(string()),
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

  const { data: courseId } = api.course.get.useQuery({
    id: id ?? "",
  });

  const { mutateAsync: updateEmail, isLoading: updatingEmail } =
    api.email.update.useMutation();

  const { mutateAsync: sendPreviewEmail, isLoading: isSendPreviewEmail } =
    api.email.sendPreviewInvitation.useMutation();

  const {
    mutateAsync: importAudienceRecipients,
    isLoading: isImportAudienceRecipients,
  } = api.email.importFromAudience.useMutation();

  const { successToast, errorToast } = useToast();

  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
  const [emails, setEmails] = React.useState<string[]>([]);
  const [focused, setFocused] = React.useState(false);

  const { data: audienceData, isLoading: isAudienceLoading } =
    api.creator.audience.getAudienceMembers.useQuery();

  const tableData = React.useMemo(() => {
    return [];
  }, []);

  useEffect(() => {
    if (
      editor &&
      editEmail &&
      editor.getBlock(editor.topLevelBlocks[0]?.id ?? "")
    ) {
      methods.setValue("subject", editEmail?.subject ?? "");
      methods.setValue("isStyled", editEmail?.isStyled ?? false);

      const loadInitMdText = async () => {
        try {
          const blocks = await editor.HTMLToBlocks(editEmail?.body ?? "");
          if (blocks && editor.topLevelBlocks)
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
        } catch (err) {
          console.log("mdEditorError", err);
        }
      };
      void loadInitMdText();
    }
  }, [methods, editor, editEmail, isOpen]);

  const tableHeaders: readonly Column<{
    col1: string;
  }>[] = React.useMemo(
    () => [
      {
        Header: "Email",
        accessor: "col1",
      },
    ],
    [],
  );

  const tableInstance = useTable({ columns: tableHeaders, data: tableData });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  const [createCouseModalOpen, setCreateCouseModalOpen] = useState(false);

  const CreateCoursButton = ({
    setCreateCouseModalOpen,
    className,
  }: {
    setCreateCouseModalOpen: Dispatch<SetStateAction<boolean>>;
    className?: string;
  }) => {
    return (
      <Menu
        as="div"
        className={`${
          className ?? ""
        } relative flex w-full flex-col items-start justify-start text-left`}
      >
        <div className="relative flex flex-col items-start justify-start ">
          <Menu.Button
            as="button"
            className="flex items-center justify-start gap-1 rounded-xl border border-pink-600 px-4 py-2 text-xs font-semibold text-pink-600 duration-300 hover:bg-pink-600 hover:text-neutral-200 sm:text-sm"
          >
            Import Recipients
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              as="div"
              className="absolute z-10 mt-2 flex min-w-[30px] origin-top-right flex-col overflow-hidden rounded-xl bg-neutral-900/80 backdrop-blur-sm duration-300"
            >
              <div className="divide-y divide-neutral-800">
                <button
                  onClick={() => {
                    setCreateCouseModalOpen(true);
                  }}
                  className={`flex w-full items-center gap-1 px-4 py-3 text-xs font-bold transition-all duration-300 hover:text-pink-500 active:text-pink-600 sm:text-sm`}
                  type="button"
                >
                  From Imported Audience
                </button>
                <button
                  onClick={() => {
                    setCreateCouseModalOpen(true);
                  }}
                  className={`flex w-full items-center gap-1 px-4 py-3 text-xs font-bold transition-all duration-300 hover:text-pink-500 active:text-pink-600 sm:text-sm`}
                  type="button"
                >
                  From Audience
                </button>
              </div>
            </Menu.Items>
          </Transition>
        </div>
      </Menu>
    );
  };
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
                    await updateEmail({
                      subject: values.subject,
                      body: values.body,
                      emailUniqueId: editEmail?.id ?? "",
                      isStyled: values.isStyled,
                    });
                  })}
                  className="mx-auto my-4 flex w-full flex-col gap-8"
                >
                  <div className="flex flex-col gap-3">
                    <label htmlFor="title" className="text-lg text-neutral-200">
                      Subject
                    </label>
                    <input
                      {...methods.register("subject")}
                      defaultValue={editEmail ? editEmail?.subject ?? "" : ""}
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
                    <div className="flex flex-col gap-3">
                      <label
                        htmlFor="body"
                        className="text-lg  text-neutral-200"
                      >
                        Recipients
                      </label>
                      <div className="flex-row  items-center justify-start gap-3 sm:flex">
                        <div className="flex items-center justify-start gap-2">
                          <div className="flex w-full items-center justify-start">
                            <ReactMultiEmail
                              placeholder="Input your email"
                              emails={emails}
                              onChange={(_emails: string[]) => {
                                setEmails(_emails);
                              }}
                              autoFocus={true}
                              onFocus={() => setFocused(true)}
                              onBlur={() => setFocused(false)}
                              getLabel={(email, index, removeEmail) => {
                                return null;
                              }}
                            />

                            <br />
                          </div>
                        </div>
                        <p className="hidden text-sm text-neutral-200 sm:flex">
                          or
                        </p>
                        <div className="flex-row justify-start pt-3 sm:flex sm:pt-0">
                          <CreateCoursButton
                            setCreateCouseModalOpen={setCreateCouseModalOpen}
                            className=""
                          />
                        </div>
                      </div>
                    </div>
                    {audienceData && audienceData.length > 0 ? (
                      <AnimatedSection
                        delay={0.2}
                        className="h-auto max-h-[30vh] overflow-scroll"
                      >
                        <table
                          {...getTableProps()}
                          className=" w-full border-collapse overflow-auto text-left text-sm text-neutral-300 md:table"
                        >
                          <thead>
                            {
                              // Loop over the header rows
                              headerGroups.map((headerGroup) => (
                                // Apply the header row props
                                // eslint-disable-next-line react/jsx-key
                                <tr
                                  className="w-full border-neutral-600 bg-neutral-700 text-xs uppercase tracking-wider text-neutral-400"
                                  {...headerGroup.getHeaderGroupProps()}
                                >
                                  {
                                    // Loop over the headers in each row
                                    headerGroup.headers.map((column) => (
                                      // Apply the header cell props
                                      // eslint-disable-next-line react/jsx-key
                                      <th
                                        className="flex gap-4 px-6 py-3"
                                        {...column.getHeaderProps()}
                                      >
                                        {
                                          // Render the header
                                          column.render("Header")
                                        }
                                      </th>
                                    ))
                                  }
                                </tr>
                              ))
                            }
                          </thead>

                          <tbody {...getTableBodyProps()}>
                            {
                              // Loop over the table rows
                              rows.map((row) => {
                                // Prepare the row for display
                                prepareRow(row);
                                return (
                                  // Apply the row props
                                  // eslint-disable-next-line react/jsx-key
                                  <tr
                                    className="border border-neutral-800 bg-neutral-900 even:bg-neutral-800"
                                    {...row.getRowProps()}
                                  >
                                    {
                                      // Loop over the rows cells
                                      row.cells.map((cell) => {
                                        // Apply the cell props
                                        return (
                                          // eslint-disable-next-line react/jsx-key
                                          <td
                                            className="flex gap-2 whitespace-nowrap px-6 py-4 font-medium text-neutral-200"
                                            {...cell.getCellProps()}
                                          >
                                            {
                                              // Render the cell contents
                                              cell.render("Cell")
                                            }
                                          </td>
                                        );
                                      })
                                    }
                                  </tr>
                                );
                              })
                            }
                          </tbody>
                        </table>
                      </AnimatedSection>
                    ) : (
                      <AnimatedSection
                        delay={0.2}
                        className="flex w-full flex-col items-center justify-center gap-2 p-4"
                      >
                        <h1>nothing to show </h1>
                      </AnimatedSection>
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
                      defaultChecked={editEmail?.isStyled ?? false}
                      className="mr-1"
                    />
                    <p>Is styled email ?</p>
                  </div>
                  <div className="mx-auto flex w-full flex-col  gap-4  md:flex-row">
                    <button
                      className={`group inline-flex items-center justify-center gap-1 rounded-xl bg-pink-600 px-[1.5rem] py-2  text-center font-medium text-neutral-200 transition-all duration-300 hover:bg-pink-700 disabled:bg-neutral-700 disabled:text-neutral-300`}
                      type="submit"
                    >
                      {updatingEmail && <Loader size="md" />}Update Email
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

export default EditEmailModal;
