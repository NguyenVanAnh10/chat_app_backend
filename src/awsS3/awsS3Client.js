import { S3Client } from '@aws-sdk/client-s3';

import env from 'configs';

const s3Client = new S3Client({ region: env.REGION });

export default s3Client;
