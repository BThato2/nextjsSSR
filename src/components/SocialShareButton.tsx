import React from "react";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
} from "next-share";
import { MixPannelClient } from "@/analytics/mixpanel";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { LinkIcon } from "@heroicons/react/20/solid";
import useToast from "@/hooks/useToast";

const SocialShareButton = () => {
  const router = useRouter();

  const { id } = router.query as { id: string };

  const { data: course } = api.course.get.useQuery({
    id,
  });
  const { successToast } = useToast();

  const session = useSession();
  const courseUrl = `https://kroto.in/course/${course?.id ?? ""}`;

  return (
    <div className="flex gap-2 ">
      <button
        className="aspect-square rounded-full bg-neutral-700 p-2 grayscale duration-300 hover:bg-neutral-600 hover:grayscale-0"
        onClick={() => {
          void navigator.clipboard.writeText(courseUrl);
          successToast("Course URL copied to clipboard!");
          MixPannelClient.getInstance().courseShared({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
          });
          MixPannelClient.getInstance().courseSharedType({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
            type: "copy-link",
          });
        }}
      >
        <LinkIcon className="w-3" />
      </button>
      <LinkedinShareButton
        url={courseUrl}
        onClick={() => {
          MixPannelClient.getInstance().courseShared({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
          });
          MixPannelClient.getInstance().courseSharedType({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
            type: "linkedin",
          });
        }}
      >
        <LinkedinIcon
          size={28}
          round
          className="grayscale duration-300 hover:grayscale-0"
        />
      </LinkedinShareButton>
      <FacebookShareButton
        url={courseUrl}
        quote={`Enroll the "${course?.title ?? ""}" course on Kroto.in`}
        hashtag={"#kroto"}
        onClick={() => {
          MixPannelClient.getInstance().courseShared({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
          });
          MixPannelClient.getInstance().courseSharedType({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
            type: "facebook",
          });
        }}
      >
        <FacebookIcon
          size={28}
          round
          className="grayscale duration-300 hover:grayscale-0"
        />
      </FacebookShareButton>
      <TwitterShareButton
        url={courseUrl}
        title={`Enroll the "${course?.title ?? ""}" course on Kroto`}
        onClick={() => {
          MixPannelClient.getInstance().courseShared({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
          });
          MixPannelClient.getInstance().courseSharedType({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
            type: "twitter",
          });
        }}
      >
        <TwitterIcon
          size={28}
          round
          className="grayscale duration-300 hover:grayscale-0"
        />
      </TwitterShareButton>
      <WhatsappShareButton
        url={courseUrl}
        title={`Enroll the "${course?.title ?? ""}" course on Kroto.in`}
        separator=": "
        onClick={() => {
          MixPannelClient.getInstance().courseShared({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
          });
          MixPannelClient.getInstance().courseSharedType({
            courseId: course?.id ?? "",
            userId: session.data?.user?.id ?? "",
            type: "whatsapp",
          });
        }}
      >
        <WhatsappIcon
          size={28}
          round
          className="grayscale duration-300 hover:grayscale-0"
        />
      </WhatsappShareButton>
    </div>
  );
};

export default SocialShareButton;
