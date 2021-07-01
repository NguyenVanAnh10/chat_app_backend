import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import s3Client from './awsS3Client';
import env from 'configs';

const defaultParams = {
  Bucket: env.BUCKET_NAME,
};

export const getImageUrl = ({ id, folder = 'images', imageType }) => `${env.MEDIA_HOST}/${folder}/${imageType}s/${id}`;

export const putFile = async ({
  id, content, folder = 'images', imageType, ...rest
}) => {
  const params = {
    ...defaultParams,
    Key: folder ? `${folder}/${imageType}s/${id}` : `/${imageType}s/${id}`,
    Body: content,
    ...rest,
  };

  await s3Client.send(new PutObjectCommand(params));
  return getImageUrl({ id, folder, imageType });
};

export const getSignedUrlImage = ({
  id,
  folder = 'images',
  imageType,
}) => {
  const params = {
    ...defaultParams,
    Key: folder ? `${folder}/${imageType}s/${id}` : `/${imageType}s/${id}`,
  };
  const command = new GetObjectCommand(params);
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const deleteFile = async ({ id, folder = 'images', imageType }) => {
  const params = {
    ...defaultParams,
    Key: folder ? `${folder}/${imageType}s/${id}` : `/${imageType}s/${id}`,
  };

  const results = await s3Client.send(new DeleteObjectCommand(params));
  return results;
};
