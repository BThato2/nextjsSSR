import { DashboardLayout } from "..";
import Head from "next/head";
import AnimatedSection from "@/components/AnimatedSection";
import { useTable, type Column } from "react-table";
import { AccountType } from "@prisma/client";
import { Dialog, Transition } from "@headlessui/react";
import { object, z } from "zod";
import useToast from "@/hooks/useToast";
import { type UseFormProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import { Loader } from "@/components/Loader";
import {
  CircleStackIcon,
  EyeIcon,
  XMarkIcon,
  IdentificationIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";
import React, { Fragment, useEffect, useState } from "react";
import {
  ArrowDownTrayIcon,
  PencilIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import { Tooltip } from "antd";

const bankDetailZodObject = object({
  accountName: z.string().nonempty("Please enter your Name"),
  accountNumber: z.string().nonempty("Please enter your Account Number"),
  confirmAccountNumber: z
    .string()
    .nonempty("Please confirm your account number"),
  accountType: z.nativeEnum(AccountType),
  ifscCode: z.string().nonempty("Please enter IFSC code"),
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

const Index = () => {
  const { mutateAsync: updateBankDetails, isLoading: bankDetailsUpdating } =
    api.payment.updateBankDetails.useMutation();
  const { data: bankDetails, isLoading: bankDetailsLoading } =
    api.payment.getBankDetails.useQuery();

  const methods = useZodForm({
    schema: bankDetailZodObject,
    defaultValues: {
      ifscCode: "",
      accountName: "",
      accountNumber: "",
      confirmAccountNumber: "",
    },
  });

  const { successToast, errorToast } = useToast();
  const { data: paymentDetails } = api.payment.getPaymentDetails.useQuery();
  const { data: purchases, isLoading: purchasesLoading } =
    api.payment.getPurchases.useQuery();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (bankDetails) {
      methods.reset({
        ifscCode: bankDetails?.ifscCode ?? "",
        accountName: bankDetails?.accountName ?? "",
        accountType: bankDetails?.accountType ?? "",
        accountNumber: bankDetails?.accountNumber ?? "",
        confirmAccountNumber: bankDetails?.accountNumber ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankDetails]);

  const tableDatas = React.useMemo(() => {
    if (purchases)
      return purchases.map((a) => ({
        col1: a?.user.name ?? "",
        col6: a?.user.email ?? "",
        col2: `₹ ${(a?.amount / 100).toFixed(2)}`,
        col4: a?.productType.toUpperCase() ?? "",
        col5: a?.promoCode?.toUpperCase() ?? "NONE",
        col3:
          a?.createdAt?.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }) ?? "",
      }));
    return [];
  }, [purchases]);

  const tableHeaders: readonly Column<{
    col1: string;
    col2: string;
    col4: string;
    col5: string;
    col3: string;
    col6: string;
  }>[] = React.useMemo(
    () => [
      {
        Header: "Buyer",
        accessor: "col1",
      },
      {
        Header: "Email",
        accessor: "col6",
      },
      {
        Header: "Amount",
        accessor: "col2",
      },
      {
        Header: "Type",
        accessor: "col4",
      },
      {
        Header: "Promo Code",
        accessor: "col5",
      },
      {
        Header: "Purchased At",
        accessor: "col3",
      },
    ],
    [],
  );

  const tableInstances = useTable({ columns: tableHeaders, data: tableDatas });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstances;

  return (
    <>
      <Head>
        <title>Payments | Dashboard</title>
      </Head>
      <div className="flex min-h-screen w-full flex-col gap-4 p-8">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-2xl font-medium text-neutral-200">
            Payment Details
          </h1>
          {bankDetailsLoading ? (
            <BankDetailsLoader />
          ) : (
            <div className="flex max-w-5xl flex-col justify-between gap-5 py-4 lg:flex-row">
              <div className="flex flex-grow flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6">
                <div className="flex flex-row gap-2">
                  <EyeIcon className="w-5 text-pink-500" />
                  <p className="text-base font-semibold lg:text-lg">Balance</p>
                </div>
                <div className="flex gap-2">
                  <p className="text-3xl font-bold">
                    ₹{((paymentDetails?.withdrawAmount ?? 0) / 100).toFixed(2)}
                  </p>
                  {(paymentDetails?.withdrawAmount ?? 0) > 0 && (
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg border border-neutral-600 p-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700  hover:text-neutral-200"
                    >
                      <ArrowDownTrayIcon className="w-4" /> Withdraw
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-grow flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 ">
                <div className="flex flex-row gap-2">
                  <CircleStackIcon className="w-5 text-pink-500" />
                  <p className="text-base font-semibold  lg:text-lg">
                    Lifetime earning
                  </p>
                </div>
                <div className="flex gap-2">
                  <p className="text-3xl font-bold">
                    ₹
                    {((paymentDetails?.lifeTimeEarnings ?? 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex flex-grow flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 ">
                <div className="flex gap-2">
                  <IdentificationIcon className="w-5 text-pink-500" />
                  <p className="text-base font-semibold lg:text-lg">
                    Bank Details
                  </p>
                </div>
                <div className="flex">
                  {bankDetails?.accountNumber ? (
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-semibold">
                        XX{bankDetails?.accountNumber.slice(-4)}
                      </p>
                      <Tooltip title="Edit">
                        <button
                          onClick={() => {
                            setIsOpen(true);
                            methods.setValue(
                              "accountType",
                              AccountType.SAVINGS,
                            );
                          }}
                          type="button"
                          className="rounded-lg border border-neutral-600 p-2 font-semibold text-neutral-200 hover:bg-neutral-700  hover:text-neutral-200"
                        >
                          <PencilIcon className="w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsOpen(true);
                          methods.setValue("accountType", AccountType.SAVINGS);
                        }}
                        type="button"
                        className="flex items-center gap-1 rounded-lg border border-neutral-600 p-1 px-2 font-semibold text-neutral-200 hover:bg-neutral-700  hover:text-neutral-200"
                      >
                        <PlusCircleIcon className="w-4" />
                        Add Bank Details
                      </button>
                    </div>
                  )}
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
                              <Dialog.Title
                                as="div"
                                className="flex w-full gap-4"
                              >
                                <div className="mb-2 flex w-full justify-between text-xl font-medium">
                                  Bank Details
                                </div>
                                <XMarkIcon
                                  onClick={() => setIsOpen(false)}
                                  className="trasit w-8 cursor-pointer rounded-lg p-1 duration-150 hover:bg-neutral-700"
                                />
                              </Dialog.Title>
                              <div className="flex flex-col gap-2 p-2">
                                <p className="mb-1 text-xs uppercase tracking-widest">
                                  Account Type
                                </p>
                                <div className="flex gap-2 pb-3">
                                  <button
                                    onClick={() => {
                                      methods.setValue(
                                        "accountType",
                                        AccountType.SAVINGS,
                                      );
                                    }}
                                    className={`rounded-xl ${
                                      methods.watch().accountType ===
                                      AccountType.SAVINGS
                                        ? "bg-pink-600 text-neutral-200"
                                        : "text-pink-500"
                                    } border border-pink-500 px-2 py-1 text-sm font-bold  transition duration-300 `}
                                  >
                                    Saving
                                  </button>
                                  <button
                                    onClick={() => {
                                      methods.setValue(
                                        "accountType",
                                        AccountType.CURRENT,
                                      );
                                    }}
                                    className={`rounded-xl ${
                                      methods.watch().accountType ===
                                      AccountType.CURRENT
                                        ? "bg-pink-600 text-neutral-200"
                                        : "text-pink-500"
                                    } border border-pink-500 px-2 py-1 text-sm font-bold  transition duration-300 `}
                                  >
                                    Current
                                  </button>
                                </div>
                                <form
                                  onSubmit={methods.handleSubmit(
                                    async (values) => {
                                      if (
                                        values?.accountNumber !==
                                        values?.confirmAccountNumber
                                      ) {
                                        errorToast(
                                          "Account Numbers don't match",
                                        );
                                      }
                                      try {
                                        await updateBankDetails(
                                          {
                                            accountName:
                                              values?.accountName ?? "",
                                            accountNumber:
                                              values?.accountNumber ?? "",
                                            accountType: values.accountType,
                                            ifscCode: values?.ifscCode ?? "",
                                          },
                                          {
                                            onSuccess: () => {
                                              successToast(
                                                "Sucssefully updated your bank details!",
                                              );
                                              setIsOpen(false);
                                            },
                                            onError: () => {
                                              errorToast(
                                                "Error updating your bank details!",
                                              );
                                            },
                                          },
                                        );
                                      } catch (e) {
                                        console.log(e);
                                      }
                                    },
                                  )}
                                  className="flex w-full flex-col gap-2 rounded-xl"
                                >
                                  <div className="flex flex-col">
                                    <label className="mb-1 text-xs uppercase tracking-widest">
                                      Account holder name
                                    </label>
                                    <input
                                      {...methods.register("accountName")}
                                      className="block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                                    />
                                  </div>
                                  {methods.formState.errors.accountName
                                    ?.message && (
                                    <p className="text-red-700">
                                      {
                                        methods.formState.errors.accountName
                                          ?.message
                                      }
                                    </p>
                                  )}
                                  <div className="flex flex-col">
                                    <label className="mb-1 text-xs uppercase tracking-widest">
                                      IFSC Code
                                    </label>
                                    <input
                                      {...methods.register("ifscCode")}
                                      className="block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                                    />
                                  </div>
                                  {methods.formState.errors.ifscCode
                                    ?.message && (
                                    <p className="text-red-700">
                                      {
                                        methods.formState.errors.ifscCode
                                          ?.message
                                      }
                                    </p>
                                  )}
                                  <div className="flex flex-col">
                                    <label className="mb-1 text-xs uppercase tracking-widest">
                                      Account Number
                                    </label>
                                    <input
                                      type="password"
                                      {...methods.register("accountNumber")}
                                      className="block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                                    />
                                  </div>
                                  {methods.formState.errors.accountNumber
                                    ?.message && (
                                    <p className="text-red-700">
                                      {
                                        methods.formState.errors.accountNumber
                                          ?.message
                                      }
                                    </p>
                                  )}
                                  <div className="flex flex-col">
                                    <label className="mb-1 text-xs uppercase tracking-widest">
                                      Confirm Account Number
                                    </label>
                                    <input
                                      type="text"
                                      {...methods.register(
                                        "confirmAccountNumber",
                                      )}
                                      className="block w-full rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 placeholder-neutral-400 outline-none ring-transparent transition duration-300 hover:border-neutral-500 focus:border-neutral-400 focus:ring-neutral-500 active:outline-none active:ring-transparent"
                                    />
                                  </div>
                                  {methods.formState.errors.confirmAccountNumber
                                    ?.message && (
                                    <p className="text-red-700">
                                      {
                                        methods.formState.errors
                                          .confirmAccountNumber?.message
                                      }
                                    </p>
                                  )}
                                  <button className="mt-4 flex justify-center rounded-xl bg-pink-600 p-2 text-center font-bold text-neutral-200 transition duration-300 hover:bg-pink-700">
                                    <div>
                                      {bankDetailsUpdating ? (
                                        <Loader white />
                                      ) : (
                                        "Submit"
                                      )}
                                    </div>
                                  </button>
                                </form>
                              </div>
                            </Dialog.Panel>
                          </Transition.Child>
                        </div>
                      </div>
                    </Dialog>
                  </Transition>
                </div>
              </div>
            </div>
          )}
        </div>
        <h1 className="mt-10 text-2xl font-medium text-neutral-200">
          Transactions
        </h1>
        {purchases && purchases.length > 0 ? (
          <AnimatedSection delay={0.2} className="max-w-5xl overflow-scroll">
            <table
              {...getTableProps()}
              className="block w-full border-collapse overflow-auto text-left text-sm text-neutral-300 md:table"
            >
              <thead>
                {
                  // Loop over the header rows
                  headerGroups.map((headerGroup) => (
                    // Apply the header row props
                    // eslint-disable-next-line react/jsx-key
                    <tr
                      className="border-neutral-600 bg-neutral-700 text-xs uppercase tracking-wider text-neutral-400"
                      {...headerGroup.getHeaderGroupProps()}
                    >
                      {
                        // Loop over the headers in each row
                        headerGroup.headers.map((column) => (
                          // Apply the header cell props
                          // eslint-disable-next-line react/jsx-key
                          <th
                            className="px-6 py-3"
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
                                className="whitespace-nowrap px-6 py-4 font-medium text-neutral-200"
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
        ) : purchasesLoading ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-24">
            <Loader />
          </div>
        ) : (
          <AnimatedSection
            delay={0.2}
            className="flex w-full flex-col items-center justify-center gap-2 py-24"
          >
            <p className="text-neutral-400">
              You don&apos;t have any payments history yet.
            </p>
            <p className="text-neutral-400">
              sell your courses and gather payments data.
            </p>
          </AnimatedSection>
        )}
      </div>
    </>
  );
};

const BankDetailsLoader = () => (
  <div className="flex max-w-5xl flex-col justify-between gap-5 py-4 lg:flex-row">
    <div className="flex flex-grow flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 ">
      <div className="flex flex-row gap-2">
        <EyeIcon className="w-5 text-pink-500" />
        <p className="text-base font-semibold lg:text-lg">Balance</p>
      </div>
      <div className="flex gap-2">
        <CurrencyRupeeIcon className="w-6 text-neutral-500" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-neutral-800"></div>
      </div>
    </div>
    <div className="flex flex-grow flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 ">
      <div className="flex flex-row gap-2">
        <CircleStackIcon className="w-5 text-pink-500" />
        <p className="text-base font-semibold  lg:text-lg">Lifetime earning</p>
      </div>
      <div className="flex gap-2">
        <CurrencyRupeeIcon className="w-6 text-neutral-500" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-neutral-800"></div>
      </div>
    </div>
    <div className="flex flex-grow flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-6 ">
      <div className="flex gap-2">
        <IdentificationIcon className="w-5 text-pink-500" />
        <p className="text-base font-semibold lg:text-lg">Bank Details</p>
      </div>
      <div className="h-9 w-full animate-pulse rounded-xl bg-neutral-800"></div>
    </div>
  </div>
);

export default Index;

Index.getLayout = DashboardLayout;
