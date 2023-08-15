import { prisma } from "@/server/db";
import { type NextApiRequest, type NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { env } from "@/env.mjs";
import AWS from "aws-sdk";
import { serialize } from "cookie";

const {
  PRIVATE_CF_KEYPAIR_ID,
  PRIVATE_CF_DOMAIN,
  PRIVATE_CF_KEY,
  ACCESS_KEY_ID,
  SECRET_ACCESS_KEY,
  REGION,
} = env;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const session = await getSession({ req });

    const { course_id } = req.query as { course_id: string | undefined };

    if (!!session && !!course_id) {
      const course = await prisma.course.findUnique({
        where: { id: course_id },
        include: { enrollments: true },
      });

      const isCreator = course?.creatorId === session.user.id;

      if (!course) {
        res.status(404).json({ message: "not found" });

        return;
      }

      const isEnrolled = course?.enrollments.find(
        (er) => session.user.id === er.userId,
      );

      if (isCreator || isEnrolled) {
        const expires = Math.floor(Date.now() / 1000 + 6 * 60 * 60);
        const policy = JSON.stringify(`{
    "Statement": [
        {
            "Resource": "${PRIVATE_CF_DOMAIN}/${course_id}/*",
            "Condition": {
                "DateLessThan": {
                    "AWS:EpochTime": ${expires}
                }
            }
        }
    ]
}`);

        // console.log("policy", JSON.parse(policy));

        AWS.config.setPromisesDependency(Promise);
        AWS.config.update({
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY,
          region: REGION,
        });

        const cloudFrontSigner = new AWS.CloudFront.Signer(
          PRIVATE_CF_KEYPAIR_ID,
          PRIVATE_CF_KEY.replace(/\\n/g, "\n"),
        );

        const signedCookie = cloudFrontSigner.getSignedCookie({ policy });

        res.setHeader("Set-Cookie", [
          serialize("CloudFront-Expires", expires.toString(), {
            domain: ".cloudfront.net",
            path: `/${course_id}`,
            secure: true,
            httpOnly: true,
          }),
          serialize(
            "CloudFront-Signature",
            signedCookie["CloudFront-Signature"],
            {
              domain: ".cloudfront.net",
              path: `/${course_id}`,
              secure: true,
              httpOnly: true,
            },
          ),
          serialize(
            "CloudFront-Key-Pair-Id",
            signedCookie["CloudFront-Key-Pair-Id"],
            {
              domain: ".cloudfront.net",
              path: `/${course_id}`,
              secure: true,
              httpOnly: true,
            },
          ),
          serialize("CloudFront-Policy", signedCookie["CloudFront-Policy"], {
            domain: ".cloudfront.net",
            path: `/${course_id}`,
            secure: true,
            httpOnly: true,
          }),
        ]);

        res.status(200).json({ message: "access granted" });
      } else res.status(403).json({ message: "access denied" });
    } else res.status(403).json({ message: "access denied" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
}
