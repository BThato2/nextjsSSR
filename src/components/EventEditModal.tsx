import useToast from "@/hooks/useToast";
import { type RouterInputs, api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfigProvider, DatePicker, TimePicker, theme } from "antd";
import ImageWF from "@/components/ImageWF";
import { useRouter } from "next/router";
import React, { useEffect, useState, memo, type ChangeEvent } from "react";
import { type UseFormProps, useForm } from "react-hook-form";
import { date, object, string, type z } from "zod";
import dayjs from "dayjs";
import { PhotoIcon, LinkIcon } from "@heroicons/react/20/solid";
import { Loader } from "./Loader";
import useRevalidateSSG from "@/hooks/useRevalidateSSG";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { type BlockNoteEditor } from "@blocknote/core";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

const titleLimit = 100;

const editEventFormSchema = object({
  thumbnail: string().nonempty("Please upload a cover"),
  title: string().max(titleLimit).nonempty("Please enter event title."),
  description: string().max(3000).nonempty("Please enter event description."),
  eventType: string().nonempty("Please select the type of event."),
  eventUrl: string().url().optional(),
  eventLocation: string().optional(),
  datetime: date({
    required_error: "Please enter event's date and time.",
  }),
  endTime: date({
    required_error: "Please enter event's end date and time.",
  }),
})
  .optional()
  .refine(
    (data) => {
      if (data)
        return data.eventType === "virtual"
          ? data.eventUrl !== undefined && data.eventUrl !== ""
          : data.eventLocation !== undefined && data.eventLocation !== "";
      else return false;
    },
    (data) => {
      if (data)
        return {
          message:
            data && data.eventType === "virtual"
              ? "Please enter the event URL."
              : "Please enter the event location.",
        };
      else
        return {
          message: "",
        };
    },
  );

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

const EventEditModal = () => {
  const { mutateAsync: eventUpdateMutation, isLoading: isUpdateLoading } =
    api.event.update.useMutation();
  type EventUpdateType = RouterInputs["event"]["update"];
  const ctx = api.useContext();
  const [eventInit, setEventInit] = useState(false);
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  const router = useRouter();
  const { id } = router.query as { id: string };

  const { data: event } = api.event.get.useQuery({
    id,
  });

  const { errorToast, warningToast } = useToast();

  const methods = useZodForm({
    schema: editEventFormSchema,
    defaultValues: {
      datetime: new Date(),
    },
  });

  const { darkAlgorithm } = theme;

  const [startTime, setStartTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );
  const [endTime, setEndTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );

  useEffect(() => {
    if (
      editor &&
      event &&
      !eventInit &&
      editor.getBlock(editor.topLevelBlocks[0]?.id ?? "")
    ) {
      setEventInit(true);
      methods.setValue("title", event?.title ?? "");
      methods.setValue("thumbnail", event?.thumbnail ?? "");
      methods.setValue("eventType", event?.eventType ?? "");
      methods.setValue("description", event?.description ?? "");
      const loadInitMdText = async () => {
        try {
          const blocks = await editor.markdownToBlocks(
            event?.description ?? "",
          );
          if (blocks && editor.topLevelBlocks)
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
        } catch (err) {
          console.log("mdEditorError", err);
        }
      };
      void loadInitMdText();
      methods.setValue("datetime", event?.datetime ?? new Date());
      methods.setValue("endTime", event?.endTime ?? new Date());

      setStartTime(
        (event?.datetime ?? new Date()).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );

      setEndTime(
        (event?.endTime ?? new Date()).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
    }
  }, [event, eventInit, methods, editor]);

  const revalidate = useRevalidateSSG();

  if (!event) return <></>;

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={methods.handleSubmit(async (values) => {
        if (!!values) {
          const mValues = values;
          if (mValues.eventType === "virtual") mValues.eventLocation = "";
          else mValues.eventUrl = "";
          const stime = dayjs(startTime, "hh:mm A").toDate();
          const updateddt = new Date(values.datetime);
          updateddt.setHours(stime.getHours());
          updateddt.setMinutes(stime.getMinutes());
          const etime = dayjs(endTime, "hh:mm A").toDate();
          const updatedet = new Date(values.datetime);
          updatedet.setHours(etime.getHours());
          updatedet.setMinutes(etime.getMinutes());

          try {
            await eventUpdateMutation(
              {
                ...{
                  title: values.title ?? "",
                  description: values.description ?? "",
                  thumbnail: values.thumbnail ?? "",
                  eventType: values.eventType ?? "",
                  eventLocation: values.eventLocation ?? "",
                  eventUrl: values.eventUrl ?? "",
                  datetime: updateddt,
                  endTime: updatedet,
                },
                id: id,
              } as EventUpdateType,
              {
                onSuccess: () => {
                  void ctx.event.get.invalidate();
                  void revalidate(`/event/${event?.id ?? ""}`);
                },
                onError: () => {
                  errorToast("Error in updating the event!");
                },
              },
            );
          } catch (err) {
            console.log(err);
          }
        }
      })}
      className="mx-auto my-4 flex w-full max-w-2xl flex-col gap-8"
    >
      <div className="relative flex aspect-[18/9] w-full items-end justify-start overflow-hidden rounded-xl bg-neutral-700 text-sm">
        {!!methods.getValues("thumbnail") && (
          <ImageWF
            src={methods.watch()?.thumbnail ?? ""}
            alt="thumbnail"
            fill
            className="object-cover"
          />
        )}
        <div className="relative m-2 flex w-auto cursor-pointer items-center gap-2 rounded-xl border border-neutral-500 bg-neutral-800/80 p-3 text-sm font-medium duration-300 hover:border-neutral-400">
          <input
            type="file"
            accept="image/*"
            className="z-2 absolute h-full w-full cursor-pointer opacity-0"
            onChange={(e) => {
              if (e.currentTarget.files && e.currentTarget.files[0]) {
                if (e.currentTarget.files[0].size > 1200000)
                  warningToast(
                    "Image is too big, try a smaller (<1MB) image for performance purposes.",
                  );
                if (e.currentTarget.files[0].size <= 3072000) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    methods.setValue("thumbnail", reader.result as string);
                  };
                  reader.readAsDataURL(e.currentTarget.files[0]);
                } else {
                  warningToast("Upload cover image upto 3 MB of size.");
                }
              }
            }}
          />
          <PhotoIcon className="w-4" />
          Upload Cover
        </div>
      </div>

      {methods.formState.errors.thumbnail?.message && (
        <p className="text-red-700">
          {methods.formState.errors.thumbnail?.message}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <label htmlFor="title" className="text-lg  text-neutral-200">
          Event Title
        </label>
        <input
          value={methods.watch()?.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            methods.setValue("title", e.target?.value.substring(0, titleLimit));
          }}
          placeholder="Event Title"
          className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium  text-neutral-200 outline outline-1 outline-neutral-600 transition-all duration-300 hover:outline-neutral-500 focus:outline-neutral-400 sm:text-lg"
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

      <div className="flex flex-col gap-3">
        <label htmlFor="description" className="text-lg  text-neutral-200">
          Description
        </label>
        <div className="rounded-lg border border-neutral-700 bg-neutral-800">
          <Editor
            onChange={(innerEditor) => {
              void innerEditor
                .blocksToMarkdown(innerEditor.topLevelBlocks)
                .then((md) => {
                  console.log(md);
                  methods.setValue("description", md);
                });
            }}
            setDynamicEditor={setEditor}
          />
        </div>
        {methods.formState.errors.description?.message && (
          <p className="text-red-700">
            {methods.formState.errors.description?.message}
          </p>
        )}
      </div>

      <pre className="w-full overflow-x-hidden text-xs">
        {JSON.stringify(editor?.topLevelBlocks, null, 2)}
      </pre>

      <div className="flex flex-col gap-3">
        <label htmlFor="eventType" className="text-lg  text-neutral-200">
          Where is event taking place?
        </label>

        <ul className="flex items-center gap-2">
          <li>
            <input
              type="radio"
              value="virtual"
              id="virtual"
              className="peer hidden"
              {...methods.register("eventType")}
              name="eventType"
            />
            <label
              htmlFor="virtual"
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-xs font-medium text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300 peer-checked:border-pink-600 peer-checked:bg-pink-600/20 peer-checked:text-neutral-200"
            >
              {"💻️ "} Virutal
            </label>
          </li>
          <li>
            <input
              type="radio"
              value="in_person"
              id="in_person"
              className="peer hidden"
              {...methods.register("eventType")}
              name="eventType"
            />
            <label
              htmlFor="in_person"
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-neutral-700 p-3 text-xs font-medium text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300 peer-checked:border-pink-600 peer-checked:bg-pink-600/20 peer-checked:text-neutral-200"
            >
              {"🌎️ "} In Person
            </label>
          </li>
        </ul>

        {methods.formState.errors.eventType?.message && (
          <p className="text-red-700">
            {methods.formState.errors.eventType?.message}
          </p>
        )}
      </div>

      {methods.watch()?.eventType === "virtual" ? (
        <div className="flex flex-col gap-3">
          <div className="relative flex items-center">
            <input
              key="eventUrl"
              {...methods.register("eventUrl")}
              defaultValue={(event && event.eventUrl) ?? ""}
              placeholder="Google Meet or YouTube URL"
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 pl-8 text-sm text-neutral-200 outline outline-1 outline-neutral-600 transition-all duration-300 hover:outline-neutral-500 focus:outline-neutral-400"
            />
            <LinkIcon className="absolute ml-2 w-4 text-neutral-400 peer-focus:text-neutral-200" />
          </div>
          {methods.formState.errors.eventUrl?.message && (
            <p className="text-red-700">
              {methods.formState.errors.eventUrl?.message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative flex items-center">
            <input
              key="eventLocation"
              {...methods.register("eventLocation")}
              defaultValue={(event && event.eventLocation) ?? ""}
              placeholder="Your event's address"
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 pl-8 text-sm text-neutral-200 outline outline-1 outline-neutral-600 transition-all duration-300 hover:outline-neutral-500 focus:outline-neutral-400"
            />
            <MapPinIcon className="absolute ml-2 w-4 text-neutral-400 peer-focus:text-neutral-200" />
          </div>

          {methods.formState.errors.eventLocation?.message && (
            <p className="text-red-700">
              {methods.formState.errors.eventLocation?.message}
            </p>
          )}
        </div>
      )}

      <div className="flex w-full flex-col items-start gap-3">
        <label htmlFor="og_description" className="text-lg  text-neutral-200">
          When is event taking place?
        </label>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-neutral-700 bg-neutral-800 p-2">
          <ConfigProvider
            theme={{
              algorithm: darkAlgorithm,
              token: {
                colorPrimary: "#ec4899",
              },
            }}
          >
            <DatePicker
              autoFocus={false}
              format="DD-MM-YYYY"
              bordered={false}
              disabledDate={(currentDate) =>
                currentDate.isBefore(dayjs(new Date()), "day")
              }
              value={dayjs(
                methods.watch()?.datetime?.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }),
                "DD-MM-YYYY",
              )}
              onChange={(selectedDate) => {
                const sourceDateObj = selectedDate?.toDate() ?? new Date();
                const targetDateObj = methods.watch()?.datetime ?? new Date();
                targetDateObj.setFullYear(sourceDateObj.getFullYear());
                targetDateObj.setMonth(sourceDateObj.getMonth());
                targetDateObj.setDate(sourceDateObj.getDate());
                methods.setValue("datetime", targetDateObj);
              }}
            />
            <TimePicker.RangePicker
              autoFocus={false}
              bordered={false}
              className=""
              // order={false}
              value={[dayjs(startTime, "hh:mm A"), dayjs(endTime, "hh:mm A")]}
              onChange={(selectedTime) => {
                if (selectedTime) {
                  setStartTime(dayjs(selectedTime[0]).format("hh:mm A") ?? "");
                  setEndTime(dayjs(selectedTime[1]).format("hh:mm A"));
                }
              }}
              format="hh:mm A"
              disabledTime={() => {
                const now = dayjs();
                return {
                  disabledHours: () => {
                    if (
                      dayjs(methods.watch()?.datetime).format("DD/MM/YYYY") ===
                      dayjs(new Date()).format("DD/MM/YYYY")
                    )
                      return [...Array(now.hour()).keys()];
                    return [];
                  },
                  disabledMinutes: (selectedHour) => {
                    if (
                      dayjs(methods.watch()?.datetime).format("DD/MM/YYYY") ===
                      dayjs(new Date()).format("DD/MM/YYYY")
                    ) {
                      if (now.hour() === selectedHour) {
                        return [...Array(now.minute()).keys()];
                      }
                      return [];
                    }
                    return [];
                  },
                };
              }}
              minuteStep={15}
              use12Hours
              style={{
                color: "#fff",
              }}
            />
          </ConfigProvider>
          {/* <BsCalendar3Event className="absolute ml-3 text-neutral-400 peer-focus:text-neutral-200" /> */}
        </div>

        {methods.formState.errors.datetime?.message && (
          <p className="text-red-700">
            {methods.formState.errors.datetime?.message}
          </p>
        )}
        {methods.formState.errors.endTime?.message && (
          <p className="text-red-700">
            {methods.formState.errors.endTime?.message}
          </p>
        )}
      </div>

      <button
        className={`group inline-flex items-center justify-center gap-1 rounded-xl bg-pink-600 px-[1.5rem]  py-2 text-center font-medium text-neutral-200 transition-all duration-300 disabled:bg-neutral-700 disabled:text-neutral-300`}
        type="submit"
      >
        {isUpdateLoading ? <Loader white /> : <></>} Update Event
      </button>
    </form>
  );
};

export default memo(EventEditModal);
