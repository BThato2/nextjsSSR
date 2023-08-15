import { type NextApiRequest, type NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { getCoursePrivateSignedUrl } from "@/server/helpers/cloud-front";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const session = await getSession({ req });
    const { course_id, url } = req.query as {
      course_id: string | undefined;
      url: string | undefined;
    };
    if (session && session?.user?.id && course_id && url) {
      const signedUrl = await getCoursePrivateSignedUrl({
        userId: session?.user?.id,
        courseId: course_id,
        unsignedUrl: url,
        ipAddress: req.connection.remoteAddress,
      });

      if (signedUrl) res.status(200).json({ signedUrl });
      else res.status(403).json({ message: "access denied" });
    } else res.status(403).json({ message: "access denied" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
}
