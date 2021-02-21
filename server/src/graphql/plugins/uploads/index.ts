import { saveFile } from '../../../utils/saveFile';

export const resolveUpload = (pathPrefix, filenameBuilder) => async (upload, ...args) => {
  const filename = filenameBuilder(upload, ...args);
  const { createReadStream } = upload;
  const stream = createReadStream();
  // Save file to the local filesystem
  const { filepath } = await saveFile({ stream, mimetype: upload.mimetype, filename, pathPrefix });
  // Return metadata to save it to Postgres
  return filepath;
};
