import useToast from "@/hooks/useToast";
import { api } from "@/utils/api";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Dispatch, Fragment, type SetStateAction } from "react";
import { type UseFormProps, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader } from "./Loader";

export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[A-Z0-9]+$/, {
      message: "Promo code must contain only uppercase letters and numbers",
    })
    .nonempty("Promo code is required"),
  discountPercent: z.string(),
  courseId: z.string(),
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

export default function CreatePromoCodeModal({
  courseId,
  isOpen,
  setIsOpen,
}: {
  courseId: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const methods = useZodForm({
    schema: createPromoCodeSchema,
    defaultValues: {
      code: "",
      discountPercent: "10",
      courseId,
    },
  });

  const {
    mutateAsync: createPromoCodeMutation,
    isLoading: createPromoCodeLoading,
  } = api.coursePromoCodes.create.useMutation();

  const { successToast } = useToast();

  const ctx = api.useContext();

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
                      <h2 className="text-xl">Create Promo Code</h2>
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
                      void createPromoCodeMutation(
                        { ...values, courseId },
                        {
                          onSuccess: () => {
                            successToast("Promo Code created successfully!");
                            setIsOpen(false);
                            void ctx.coursePromoCodes.invalidate();
                            methods.setValue("code", "");
                            methods.setValue("discountPercent", "20");
                            methods.setValue("courseId", "");
                          },
                        },
                      );
                    })}
                    className="flex w-full flex-col gap-8 py-4"
                  >
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="code"
                        className="text-lg  text-neutral-200"
                      >
                        Promo Code
                      </label>
                      <div className="relative flex w-full max-w-xs items-center">
                        <input
                          onChange={(e) => {
                            methods.setValue(
                              "code",
                              e.target.value.toUpperCase(),
                            );
                          }}
                          value={methods.watch().code}
                          placeholder="✱✱✱✱✱✱✱✱"
                          className="peer w-full rounded-lg bg-pink-500/10 px-3 py-2 text-lg font-bold tracking-widest text-neutral-200  outline outline-2 outline-pink-500/40 backdrop-blur-sm transition-all duration-300 placeholder:text-neutral-200/50 hover:outline-pink-500/80 focus:outline-pink-500"
                        />
                      </div>
                      {methods.formState.errors.code?.message && (
                        <p className="my-2 text-red-700">
                          {methods.formState.errors.code?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="discountPercent"
                        className="text-lg  text-neutral-200"
                      >
                        Discount Percent
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          {...methods.register("discountPercent")}
                          type="number"
                          placeholder="00"
                          min={1}
                          max={100}
                          className="peer w-20 rounded-lg bg-pink-500/10 px-3 py-2 text-lg font-bold tracking-wider text-neutral-200  outline outline-2 outline-pink-500/40 backdrop-blur-sm transition-all duration-300 placeholder:text-neutral-200/50 hover:outline-pink-500/80 focus:outline-pink-500"
                        />
                        <p className="text-lg font-bold text-neutral-200">%</p>
                      </div>

                      {methods.formState.errors.discountPercent?.message && (
                        <p className="my-2 text-red-700">
                          {methods.formState.errors.discountPercent?.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-center  text-lg font-bold duration-150 hover:bg-pink-600"
                    >
                      {createPromoCodeLoading ? <Loader white /> : <></>} Create
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
