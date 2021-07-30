import FileType from 'file-type';
import storage from './googleCloudStorageClient';

import env from 'configs/index';

const bucket = storage.bucket('alo-rice');

export const getUploadedFileUrl = pathFile => `${env.MEDIA_HOST}/alo-rice/${pathFile}`;

export const uploadBase64File = async ({ id, base64, destinationFile }) => {
  const buffer = Buffer.from(base64, 'base64');
  const { mime, ext } = await FileType.fromBuffer(buffer);

  const filePath = `${env.ENVIRONMENT}/${destinationFile}/${id}.${ext}`;
  const file = bucket.file(filePath);

  await file.save(buffer, { contentType: mime, gzip: true });

  return getUploadedFileUrl(filePath);
};
