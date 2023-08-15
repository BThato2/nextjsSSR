import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { Loader } from "./Loader";

function ConfirmationAlertModal({
  isOpen,
  confirmation,
  onClose,
  onYes,
  yesLoading,
  yesButtonTitle,
  noButtonTitle,
  modalTitle,
}: {
  isOpen: boolean;
  confirmation: string;
  onClose: () => void;
  onYes: () => void;
  yesLoading?: boolean;
  yesButtonTitle?: string;
  noButtonTitle?: string;
  modalTitle?: string;
}) {
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                      <h3 className="ml-2 text-xl font-medium text-neutral-200">
                        {modalTitle}
                      </h3>
                      <button
                        onClick={onClose}
                        type="button"
                        className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-neutral-400 hover:bg-neutral-600"
                      >
                        <XMarkIcon className="w-5" />
                      </button>
                    </div>
                  </Dialog.Title>
                  <div className="space-y-6 p-4">
                    <p className="text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {confirmation}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 rounded-b p-4 text-sm dark:border-neutral-600">
                    <button
                      type="button"
                      onClick={onYes}
                      className="flex items-center gap-2 rounded-lg bg-neutral-200 px-3 py-1 text-center text-sm font-bold text-neutral-900 duration-300"
                    >
                      {yesLoading ? <Loader black /> : <></>}
                      {yesButtonTitle}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-neutral-700 px-3 py-1 text-center text-sm font-bold text-neutral-400 duration-300 hover:bg-neutral-200/5 hover:text-neutral-300"
                    >
                      {noButtonTitle}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

ConfirmationAlertModal.defaultProps = {
  yesButtonTitle: "Yes",
  noButtonTitle: "Cancel",
};

export default ConfirmationAlertModal;
