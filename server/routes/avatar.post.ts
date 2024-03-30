import jwt from "jsonwebtoken";
const { verify } = jwt;

export default defineEventHandler(async (event) => {
  // Validate token
  const queryParameters = getQuery(event);

  if (!queryParameters.token) {
    throw createError({
      message: "Missing token",
      statusCode: 400,
    });
  }

  const token = queryParameters.token;

  let decodedToken: any = {};

  try {
    decodedToken = await verify(token, process.env.URL_SECRET ?? "");
  } catch (e) {
    throw createError({
      message: "Invalid token",
      statusCode: 400,
    });
  }

  // Get the file metadata from the decoded token
  const { fileName, fileType, fileSize } = decodedToken;

  const body = await readMultipartFormData(event);

  if (!body) {
    throw createError({
      message: "Missing file",
      statusCode: 400,
    });
  }

  if (body.length !== 1) {
    throw createError({
      message: "Expected exactly one file",
      statusCode: 400,
    });
  }

  const file = body[0];

  if (file.filename !== fileName) {
    throw createError({
      message: "File name mismatch",
      statusCode: 400,
    });
  }

  if (file.type !== fileType) {
    throw createError({
      message: "File type mismatch",
      statusCode: 400,
    });
  }

  if (file.data.length !== fileSize) {
    throw createError({
      message: "File size mismatch",
      statusCode: 400,
    });
  }

  // Save the file to the bunny storage
  const uploadResponse = await fetch(
    `https://la.storage.bunnycdn.com/${process.env.BUNNY_STORAGE_BUCKET_NAME}/avatar/${file.filename}`,
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
    throw createError({
      message: "Failed to upload file to Bunny",
      statusCode: 500,
    });
  }

  return {
    statusCode: 201,
    message: "File uploaded successfully",
  };
});
