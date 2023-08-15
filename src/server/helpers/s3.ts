import AWS from "aws-sdk";
import { Buffer } from "buffer";
import { env } from "@/env.mjs";
import { invalidateCFCache } from "./cloud-front";

interface ImageUploadResponse {
  location: string;
  key: string;
}

export const getVideoUploadPresignedURL = async ({
  id,
  privateCourseId,
}: {
  id: string;
  privateCourseId?: string;
}) => {
  const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, S3_BUCKET } = env;

  // Configure AWS to use promise
  AWS.config.setPromisesDependency(Promise);
  AWS.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
  });

  const s3 = new AWS.S3();

  const Key = `${privateCourseId ? "private" : "public"}/${
    privateCourseId ? `${privateCourseId}/` : ""
  }video_${id}`;

  const params = {
    Bucket: S3_BUCKET,
    Key,
    ContentType: "video/*", // Set the content type as per your requirements
    ACL: "private",
    // Change this to 'private' if you want to upload privately
    Expires: 3600, // URL expiration time in seconds (1 hour in this example)
    // Other options such as ContentDisposition, Metadata, etc., can be included here if needed
  };

  invalidateCFCache({
    paths: [`/${privateCourseId ? `${privateCourseId}/` : ""}video_${id}`],
    isPrivate: !!privateCourseId,
  });

  try {
    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    return uploadURL;
  } catch (error) {
    console.log(error);
    return 500;
  }
};

export const imageUploadFromB64 = async ({
  base64,
  id,
  variant,
  privateCourseId,
}: {
  base64: string;
  id: string;
  variant: string;
  privateCourseId?: string;
}): Promise<string> => {
  // Configure AWS with your access and secret key.
  const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, S3_BUCKET } = env;

  // Configure AWS to use promise
  AWS.config.setPromisesDependency(Promise);
  AWS.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
  });

  const s3 = new AWS.S3();

  const base64Data = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64",
  );

  const Key = `${privateCourseId ? "private" : "public"}/${
    privateCourseId ? `${privateCourseId}/` : ""
  }${variant}_${id}`;

  const params = {
    Bucket: S3_BUCKET,
    Key, // type is not required
    Body: base64Data,
    ACL: privateCourseId ? "private" : "public-read",
    ContentEncoding: "base64", // required
    ContentType: `image/*`, // required. Notice the back ticks
  };

  invalidateCFCache({
    paths: [`/${privateCourseId ? `${privateCourseId}/` : ""}${variant}_${id}`],
    isPrivate: !!privateCourseId,
  });

  try {
    // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
    // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    const { Location, Key } = await s3.upload(params).promise();
    // Save the Location (url) to your database and Key if needs be.
    const response: ImageUploadResponse = { location: Location, key: Key };
    return response.location;
  } catch (error) {
    console.log(error);
    throw new Error("Image upload failed");
  }
};

export const imageUploadFromBody = async ({
  body,
  id,
  variant,
  privateCourseId,
}: {
  body: AWS.S3.Body;
  id: string;
  variant: string;
  privateCourseId?: string;
}): Promise<string> => {
  // Configure AWS with your access and secret key.
  const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, S3_BUCKET } = env;

  // Configure AWS to use promise
  AWS.config.setPromisesDependency(Promise);
  AWS.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
  });

  // Create an s3 instance
  const s3 = new AWS.S3();

  // Ensure that you POST a base64 data to your server.
  // Let's assume the variable "base64" is one.

  // Getting the file type, ie: jpeg, png or gif

  // Generally we'd have an userId associated with the image
  // For this example, we'll simulate one
  // With this setup, each time your user uploads an image, will be overwritten.
  // To prevent this, use a different Key each time.
  // This won't be needed if they're uploading their avatar, hence the filename, userAvatar.js.

  const Key = `${privateCourseId ? "private" : "public"}/${
    privateCourseId ? `${privateCourseId}/` : ""
  }${variant}_${id}`;

  const params = {
    Bucket: S3_BUCKET,
    Key,
    Body: body,
    ACL: privateCourseId ? "private" : "public-read",
    ContentType: `image/*`,
  };

  invalidateCFCache({
    paths: [`/${privateCourseId ? `${privateCourseId}/` : ""}${variant}_${id}`],
    isPrivate: !!privateCourseId,
  });

  try {
    // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
    // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    const { Location, Key } = await s3.upload(params).promise();
    // Save the Location (url) to your database and Key if needs be.
    const response: ImageUploadResponse = { location: Location, key: Key };
    return response.location;
  } catch (error) {
    console.log(error);
    throw new Error("Image upload failed");
  }
};

export const deleteS3File = async ({ path }: { path: string }) => {
  const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, S3_BUCKET } = env;

  AWS.config.setPromisesDependency(Promise);
  AWS.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION,
  });

  const s3 = new AWS.S3();

  const params = {
    Bucket: S3_BUCKET,
    Key: path,
  };

  const isPrivate = path.includes("private/");

  invalidateCFCache({
    paths: [`/${path}`],
    isPrivate,
  });

  try {
    await s3.deleteObject(params).promise();
  } catch (err) {
    console.log("Error in deleting image", err);
  }
};
