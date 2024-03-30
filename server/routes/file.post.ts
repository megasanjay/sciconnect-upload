import path from "path";
import fs from "fs";
// routes/file.post.ts
export default defineEventHandler(async (event) => {
  // todo: verify presigned url
  // probably from redis

  // invalidate token

  const body = await readMultipartFormData(event);

  //   console.log(body);
  const file = body[0];

  // Save the file to the bunny storage
  const uploadResponse = await fetch(
    `https://la.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_BUCKET_NAME}/${file.filename}`,
    {
      method: "PUT",
      headers: {
        AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY ?? "",
        "Content-Type": file.type,
      },
      body: file.data,
    }
  );

  if (!uploadResponse.ok) {
    console.error(uploadResponse.body, uploadResponse.status);

    throw createError({
      message: "Failed to upload file to Bunny",
      statusCode: 500,
    });
  }

  return { updated: true };
});
