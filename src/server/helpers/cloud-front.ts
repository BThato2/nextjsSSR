import { env } from "@/env.mjs";
import { prisma } from "../db";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
const {
  PUBLIC_CF_DOMAIN,
  PRIVATE_CF_DOMAIN,
  PRIVATE_CF_KEYPAIR_ID,
  PRIVATE_CF_KEY,
  S3_DOMAIN,
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  REGION,
  PRIVATE_CF_ID,
  PUBLIC_CF_ID,
} = env;
import AWS from "aws-sdk";

export const replaceS3UrlsWithCloudFront = (originalUrl: string) => {
  const containsS3 = originalUrl.includes(S3_DOMAIN);
  if (!containsS3) return originalUrl;

  const splittedURL = originalUrl?.split(S3_DOMAIN)[1]?.split("/");

  const isPrivate = !!splittedURL?.find((s) => s === "private");
  return `${isPrivate ? PRIVATE_CF_DOMAIN : PUBLIC_CF_DOMAIN}/${
    splittedURL?.slice(2)?.join("/") ?? ""
  }`;
};

export const getCoursePrivateSignedUrl = async ({
  userId,
  courseId,
  unsignedUrl,
  ipAddress,
}: {
  userId: string;
  courseId: string;
  unsignedUrl: string;
  ipAddress?: string;
}) => {
  if (!!courseId && !!unsignedUrl) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { enrollments: true },
    });

    const isCreator = course?.creatorId === userId;

    if (!course) return;

    const isEnrolled = course?.enrollments.find((er) => userId === er.userId);

    if (isCreator || isEnrolled) {
      const expires = Math.floor(Date.now() / 1000 + 24 * 60 * 60);

      const policy = {
        Statement: [
          {
            Resource: unsignedUrl,
            Condition: {
              DateLessThan: {
                "AWS:EpochTime": expires,
              },
              ...(ipAddress
                ? {
                    IpAddress: {
                      "AWS:SourceIp": ipAddress,
                    },
                  }
                : {}),
            },
          },
        ],
      };

      const signedUrl = getSignedUrl({
        url: unsignedUrl,
        keyPairId: PRIVATE_CF_KEYPAIR_ID,
        privateKey: PRIVATE_CF_KEY.replace(/\\n/g, "\n"),
        policy: JSON.stringify(policy),
      });

      return signedUrl;
    }
  }
};

export const invalidateCFCache = ({
  paths,
  isPrivate,
}: {
  paths: string[];
  isPrivate?: boolean;
}) => {
  AWS.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
  });

  const cloudfront = new AWS.CloudFront();

  cloudfront.createInvalidation(
    {
      DistributionId: isPrivate ? PUBLIC_CF_ID : PRIVATE_CF_ID,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    },
    (err, data) => {
      if (err)
        console.error("Error in creating invalidation: ", err, err.stack);
      // an error occurred
      else console.log("Invlidation created successfully: ", data); // successful response
    },
  );
};
