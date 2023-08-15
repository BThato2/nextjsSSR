import { type Discount, type Course } from "@prisma/client";
import ImageWF from "@/components/ImageWF";
import Link from "next/link";
import { PlayIcon } from "@heroicons/react/20/solid";

type Props = {
  course: Course & {
    _count: { chapters: number; sections: number; blocksChapters: number };
    discount: Discount | null;
  };
  manage?: boolean;
  admin?: boolean;
  lg?: boolean;
  creatorProfile?: string;
};

const CourseCard = ({ course, manage, lg, admin, creatorProfile }: Props) => {
  const isDiscount =
    course?.permanentDiscount !== null ||
    (course?.discount &&
      course?.discount?.deadline?.getTime() > new Date().getTime());

  const discount =
    course?.discount &&
    course?.discount?.deadline?.getTime() > new Date().getTime()
      ? course?.discount?.price
      : course?.permanentDiscount ?? 0;

  return (
    <Link
      href={
        manage
          ? `/creator/dashboard/course/${course?.id}`
          : admin
          ? `/admin/dashboard/course/${course?.id}`
          : course?.creatorId && creatorProfile
          ? `/${creatorProfile}/course/${course?.id}`
          : `/course/${course?.id}`
      }
      className="flex w-full max-w-2xl items-center gap-4 rounded-xl p-2 px-6 backdrop-blur-sm duration-150 hover:bg-neutral-200/10"
      key={course?.id}
    >
      <div className="flex h-10 w-28 items-center justify-center rounded-lg bg-neutral-600">
        <PlayIcon className="w-4" />
      </div>
      <div
        className={`relative aspect-video w-80 overflow-hidden rounded-lg ${
          lg ? "w-80" : ""
        }`}
      >
        <ImageWF
          src={course?.thumbnail ?? ""}
          alt={course?.title ?? ""}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex h-full w-full flex-col items-start gap-1">
        <h5
          className={`line-clamp-2 overflow-hidden text-ellipsis text-sm font-medium sm:max-h-12 sm:text-xl ${
            lg ? "text-2xl" : ""
          }`}
        >
          {course?.title}
        </h5>
        <p
          className={`flex items-center text-sm text-neutral-300 ${
            lg ? "!sm:text-base text-sm" : ""
          }`}
        >
          <span>
            {course?.ytId
              ? course?._count?.chapters
              : course?._count?.blocksChapters}{" "}
            Chapters
          </span>
        </p>
        {!manage ? (
          <div className="flex items-center gap-2">
            {isDiscount ? (
              discount === 0 ? (
                <p
                  className={`text-sm font-black uppercase tracking-widest text-green-500/80 sm:text-base`}
                >
                  free
                </p>
              ) : (
                <p
                  className={`text-sm font-black uppercase tracking-wide sm:text-base`}
                >
                  ₹{discount}
                </p>
              )
            ) : (
              <></>
            )}
            {course?.price === 0 ? (
              <p
                className={`text-sm font-bold uppercase tracking-widest text-green-500/80 sm:text-base`}
              >
                free
              </p>
            ) : (
              <p
                className={`text-sm font-semibold uppercase tracking-wide sm:text-base ${
                  isDiscount
                    ? "font-thin line-through decoration-1"
                    : "font-black"
                }`}
              >
                ₹{course?.price}
              </p>
            )}
          </div>
        ) : (
          <></>
        )}

        {admin && !course?.creatorId ? (
          <p className="rounded bg-yellow-500/30 px-2 py-1 text-xs">
            unclaimed
          </p>
        ) : (
          <></>
        )}
      </div>
    </Link>
  );
};

export default CourseCard;
