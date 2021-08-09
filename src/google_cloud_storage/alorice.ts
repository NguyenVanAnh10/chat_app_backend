import FileType from 'file-type';
import env from 'configs';
import storage from './googleCloudStorageClient';

const bucket = storage.bucket('alo-rice');

export const getUploadedFileUrl = (pathFile: string): string =>
  `${env.MEDIA_HOST}/alo-rice/${pathFile}`;

export const uploadBase64File = async ({
  id,
  base64,
  destinationFile,
}: {
  id: string;
  base64: string;
  destinationFile: string;
}): Promise<string> => {
  const buffer = Buffer.from(base64, 'base64');
  const { mime, ext } = await FileType.fromBuffer(buffer);

  const filePath = `${env.ENVIRONMENT}/${destinationFile}/${id}.${ext}`;
  const file = bucket.file(filePath);

  await file.save(buffer, { contentType: mime, gzip: true });

  return getUploadedFileUrl(filePath);
};
