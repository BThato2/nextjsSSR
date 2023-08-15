import {
  type ReactSlashMenuItem,
  createReactBlockSpec,
  InlineContent,
} from "@blocknote/react";
import {
  defaultProps,
  type DefaultBlockSchema,
  type BlockNoteEditor,
} from "@blocknote/core";
import {
  PlayCircleIcon,
  PlayIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileVideo } from "@fortawesome/free-solid-svg-icons";
import { LineProgressLoader } from "../Loader";
import { type BlockBase, type Block } from "interfaces/Block";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import "vidstack/styles/defaults.css";
import "vidstack/styles/community-skin/video.css";

// import { MediaCommunitySkin, MediaOutlet, MediaPlayer } from "@vidstack/react";
import { type MediaPlayerElement } from "vidstack";

const VideoBlock = createReactBlockSpec({
  type: "video",
  propSchema: {
    ...defaultProps,
    videoUrl: { default: "" },
  },
  containsInlineContent: true,
  render: ({ block, editor }) => (
    <div className="flex w-full flex-col gap-1">
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */}
      <VideoBlockView blockBase={block as BlockBase} editor={editor as any} />
      <InlineContent />
    </div>
  ),
});

export const insertVideo: ReactSlashMenuItem<
  DefaultBlockSchema & { video: typeof VideoBlock }
> = {
  name: "Insert a Video",
  execute: (editor) => {
    editor.replaceBlocks(
      [editor.getTextCursorPosition().block],
      [
        {
          type: "video",
          props: {
            videoUrl: "",
          },
        },
      ],
    );
  },
  aliases: ["video", "upload video", "mp4", "mkv"],
  group: "Media",
  icon: <PlayCircleIcon className="w-4" />,
  hint: "Uploads a video from storage.",
};

type VBProps = {
  blockBase: BlockBase;
  editor: BlockNoteEditor;
};

const VideoBlockView = ({ blockBase, editor }: VBProps) => {
  interface VideoFile extends File {
    name: string;
    type: string;
  }

  const [videoUrl, setVideoUrl] = useState<string | undefined>(
    blockBase.props.videoUrl,
  );
  const [file, setFile] = useState<VideoFile | undefined>(undefined);
  const [fileUploading, setFileUploading] = useState<boolean>(false);
  const [uploadVideo, setUploadVideo] = useState<boolean>(
    !(!!blockBase.props.videoUrl && blockBase.props.videoUrl !== ""),
  );

  const { mutateAsync: uploadBlockVideo } =
    api.courseSectionChapter.uploadBlockVideo.useMutation();

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [block, setBlock] = useState<Block | undefined>(undefined);

  const router = useRouter();
  const { chapter_id: chapterId, id: courseId } = router.query as {
    chapter_id: string;
    id: string;
  };

  const { data: signedVideoUrl, isLoading: signingUrl } =
    api.course.getSignedUrl.useQuery({
      courseId,
      url: videoUrl ?? "",
    });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }

    // uploading video
    if (!block) return;
    setUploadVideo(true);
    setFileUploading(true);
    const updatedBlock = await uploadBlockVideo({ block });
    setVideoUrl(updatedBlock.props.videoUrl);

    const { uploadURL } = updatedBlock;
    const fileToUpload: VideoFile | undefined =
      event.target.files && event.target.files.length > 0
        ? event?.target?.files[0]
        : undefined;

    if (!uploadURL || !fileToUpload) return;

    try {
      await axios.put(`${uploadURL}`, fileToUpload, {
        headers: {
          "Content-Type": fileToUpload.type,
          "x-amz-acl": "private",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total)
            setUploadProgress(progressEvent.loaded / progressEvent.total);
          else setUploadProgress(0);
        },
      });
    } catch (error) {
      console.error("Error uploading video:", error);
    }
    setFileUploading(false);
    setUploadVideo(false);
    editor.updateBlock(blockBase, {
      ...blockBase,
      props: {
        ...blockBase.props,
        // @ts-ignore
        videoUrl: updatedBlock.props.videoUrl ?? "",
      },
    });
  };

  const viewing = !!(router.query as { view?: boolean }).view;

  const player = useRef<MediaPlayerElement>(null);

  useEffect(() => {
    const position = editor.topLevelBlocks.findIndex(
      (b) => b.id === blockBase.id,
    );

    setBlock({ ...blockBase, position, chapterId });
  }, [blockBase, chapterId, editor]);

  useEffect(() => {
    // Call whenever you like - also available on `useMediaRemote`.
    player?.current?.startLoading();
  }, [signedVideoUrl]);

  return (
    <>
      {viewing || (!!videoUrl && videoUrl !== "" && !uploadVideo) ? (
        <div
          contentEditable={false}
          className="group relative flex w-full justify-start"
        >
          {signingUrl ? (
            <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-lg bg-neutral-800">
              <PlayIcon className="w-24 animate-pulse text-neutral-700" />
            </div>
          ) : (
            <>
              {/* <MediaPlayer src={signedVideoUrl ?? ""} ref={player}>
                <MediaOutlet />
                <MediaCommunitySkin />
              </MediaPlayer> */}
              <video
                src={signedVideoUrl ?? ""}
                className="aspect-video w-full rounded-lg"
                controls
              />
            </>
          )}
          {!viewing ? (
            <button
              onClick={() => setUploadVideo(true)}
              className="absolute z-10 m-4 hidden items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-sm font-medium text-neutral-300 backdrop-blur-sm duration-150 hover:text-neutral-200 group-hover:flex"
            >
              <CloudArrowUpIcon className="w-5" />
              Upload another
            </button>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="group relative w-full !cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800/50 p-8 backdrop-blur-sm">
          {!fileUploading ? (
            <>
              <input
                type="file"
                accept="video/*,.mp4,.mkv,.webm,.ogg,.avi,.mov"
                className="absolute left-0 top-0 h-full w-full !cursor-pointer opacity-0"
                onChange={handleFileChange}
              />

              <div className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-700 px-8 py-12 text-center duration-150 group-hover:border-pink-600">
                <div className="relative mb-3">
                  <FontAwesomeIcon
                    icon={faFileVideo}
                    className="text-5xl text-neutral-400/40 duration-150 group-hover:text-pink-500/40"
                  />
                  <PlusCircleIcon className="absolute -bottom-2 -right-3 w-5 text-neutral-400 duration-150 group-hover:text-pink-600" />
                </div>
                <p className="text-lg font-bold text-neutral-300 duration-150 group-hover:text-pink-600">
                  Select a video file to upload
                </p>
                <p className="text-sm text-neutral-400 duration-150 group-hover:text-neutral-300">
                  or drag & drop it here
                </p>
              </div>
            </>
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-700 px-8 py-12 text-center duration-150 group-hover:border-pink-600">
              <p className="text-center text-lg font-bold">
                {(uploadProgress * 100).toFixed(0)}
                <span className="text-sm text-pink-600">%</span>
              </p>
              <LineProgressLoader progress={uploadProgress} />
              <p className="mt-2 text-xs">Uploading {file?.name} video...</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VideoBlock;

export const videoBlockSchema = { video: VideoBlock };
