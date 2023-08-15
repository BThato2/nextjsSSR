import Head from "next/head";
import { CourseNestedLayout } from ".";
import { type RouterOutputs, api } from "@/utils/api";
import React, { useState } from "react";
import { Loader } from "@/components/Loader";
import {
  PlusCircleIcon,
  PaperAirplaneIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";
import "react-multi-email/dist/style.css";
import ImageWF from "@/components/ImageWF";
import AnimatedSection from "@/components/AnimatedSection";
import "@blocknote/core/style.css";
import { Transition, Listbox } from "@headlessui/react";
import { Fragment } from "react";
import "react-multi-email/dist/style.css";
import CreateNewEmailModal from "@/components/CreateNewEmailModal";
import EditEmailModal from "@/components/EditEmailModal";

const Invitation = () => {
  const ViewsSelect = [{ name: "Draft Email" }, { name: "Sent Email" }];

  const [editEmail, setEditEmail] = useState<
    RouterOutputs["email"]["getEmail"] | null
  >(null);
  const [selected, setSelected] = useState(ViewsSelect[0]);

  const { data: emailList, isLoading } = api.email.getAll.useQuery();

  const { data: draftEmail } = api.email.getDraftInvitation.useQuery();
  const { data: sentEmail } = api.email.getSentInvitation.useQuery();

  const [isCreateEmailOpen, setCreateEmailOpen] = useState(false);
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="relative mt-10 px-4 lg:mt-0 lg:px-0" aria-hidden="true">
          <ImageWF
            src="/landing/newsletter.png"
            alt="Newsletter"
            className="grayscale filter"
            width={500}
            height={500}
          />
        </div>
        <h1 className="text-3xl text-neutral-400">Coming soon...</h1>
      </div>
    );
  }

  if (isLoading)
    return (
      <>
        <Head>
          <title>Invitation | Dashboard</title>
        </Head>
        <div className="my-12 flex h-[50vh] w-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );

  return (
    <>
      <Head>
        <title>Invitation | Dashboard</title>
      </Head>
      <div className="flex w-full flex-col justify-end gap-8 sm:w-full md:w-full lg:w-full xl:w-[50%] ">
        <AnimatedSection className="flex items-center justify-between sm:w-full ">
          <button
            onClick={() => {
              setEditEmail(null);
              setCreateEmailOpen(true);
            }}
            type="button"
            className=" flex items-center justify-center gap-2 rounded-lg border border-pink-500 px-4 py-2 text-center text-sm font-medium text-pink-500 transition-all duration-300 hover:bg-pink-600 hover:text-neutral-200 disabled:cursor-not-allowed disabled:border-neutral-400 disabled:bg-transparent disabled:text-neutral-400 disabled:opacity-50 disabled:hover:border-neutral-400 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
          >
            <PlusCircleIcon className="h-4" /> Create Email
          </button>

          <div className="relative ">
            <Listbox value={selected} onChange={setSelected}>
              <div className=" relative ">
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
                  <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-800  bg-neutral-900 py-1 text-base shadow-lg  sm:text-sm">
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
        </AnimatedSection>

        {emailList && emailList?.length > 0 && (
          <AnimatedSection
            delay={0.2}
            className=" w-full rounded-xl border border-neutral-900 bg-neutral-900/60 py-1 backdrop-blur"
          >
            <div className="z-10 w-full divide-y divide-neutral-800">
              {selected?.name === "Sent Email" ? (
                sentEmail && sentEmail.length > 0 ? (
                  sentEmail?.map((email) => {
                    return (
                      <div className="w-full" key={email.id}>
                        <div className="mx-5 my-2 flex w-full justify-between  rounded p-2 text-xl">
                          <p className="">{email.subject}</p>
                        </div>
                        <div className="mx-5 my-2">
                          <button
                            className={`group inline-flex   items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-center text-xs font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-800`}
                            onClick={() => {
                              setEditEmail(email);
                              setIsEditEmailOpen(true);
                            }}
                          >
                            <PlusCircleIcon className="w-3" /> Add Recipients
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center rounded-xl py-8">
                    <h1>No Data </h1>
                  </div>
                )
              ) : draftEmail ? (
                draftEmail?.map((email) => {
                  return (
                    <div key={email.id}>
                      <div className="mx-5 my-2 flex justify-between rounded p-2 text-xl">
                        <p className="">{email.subject}</p>
                      </div>
                      <div className="mx-5 my-2 flex gap-2">
                        <button
                          className={`group inline-flex   items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-center text-xs font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-800`}
                          onClick={() => {
                            setEditEmail(email);
                            setIsEditEmailOpen(true);
                          }}
                        >
                          <PlusCircleIcon className="w-3" /> Add Recipients
                        </button>
                        <button
                          className={`group inline-flex   items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-center text-xs font-medium text-neutral-200 transition-all duration-300 hover:bg-neutral-800`}
                        >
                          <PaperAirplaneIcon className="w-3" /> Send Email
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center rounded-xl py-8">
                  <h1>No Data </h1>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}
      </div>
      <EditEmailModal
        isOpen={isEditEmailOpen}
        setIsOpen={setIsEditEmailOpen}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
      />
      <CreateNewEmailModal
        isOpen={isCreateEmailOpen}
        setIsOpen={setCreateEmailOpen}
      />
    </>
  );
};

export default Invitation;

Invitation.getLayout = CourseNestedLayout;
