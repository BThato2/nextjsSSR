import { api } from "@/utils/api";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  type ChangeEvent,
} from "react";
import { type UseFormProps, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader } from "./Loader";
import { useRouter } from "next/router";

const titleLimit = 60;

export const createCourseSchema = z.object({
  title: z.string().max(titleLimit).min(5),
});

function useZodForm<TSchema extends z.ZodType>(
  props: Omit<UseFormProps<TSchema["_input"]>, "resolver"> & {
    schema: TSchema;
  }
) {
  const form = useForm<TSchema["_input"]>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}

export default function CreateCourseModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const methods = useZodForm({
    schema: createCourseSchema,
    defaultValues: {
      title: "",
    },
  });

  const { mutateAsync: createCourseMutation, isLoading: createCourseLoading } =
    api.course.create.useMutation();

  const router = useRouter();

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
                    <div className="flex w-full justify-between">
                      <h2 className="text-xl">Create Course</h2>
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
                  <form
                    onSubmit={methods.handleSubmit((values) => {
                      void createCourseMutation(values, {
                        onSuccess: (courseCreated) => {
                          methods.setValue("title", "");
                          void router.push(
                            `/creator/dashboard/course/${courseCreated.id}/manage`
                          );
                        },
                      });
                    })}
                    className="flex w-full flex-col gap-8 py-4"
                  >
                    <div className="flex flex-col gap-3">
                      <label
                        htmlFor="title"
                        className="text-lg  text-neutral-200"
                      >
                        Title
                      </label>
                      <input
                        value={methods.watch()?.title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          methods.setValue(
                            "title",
                            e.target?.value.substring(0, titleLimit)
                          );
                        }}
                        placeholder="Enter a course title..."
                        className="w-full rounded-lg bg-neutral-800 px-3 py-2 font-medium text-neutral-200 outline outline-1 outline-neutral-700 transition-all duration-300 hover:outline-neutral-600 focus:outline-neutral-500 sm:text-xl"
                      />
                      {
                        <p className="text-end text-neutral-400">
                          {methods.watch()?.title?.length}/{titleLimit}
                        </p>
                      }
                      {methods.formState.errors.title?.message && (
                        <p className="text-red-700">
                          {methods.formState.errors.title?.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-center  text-lg font-bold duration-150 hover:bg-pink-600"
                    >
                      {createCourseLoading ? <Loader white /> : <></>} Create
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
