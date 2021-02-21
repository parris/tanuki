import * as fs from 'fs';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import { Stream, Readable } from 'stream';
import logger from '../utils/logger';

const LOCAL_UPLOAD_DIR_NAME = 'uploads';

async function saveLocal({ stream, filename, pathPrefix }): Promise<any> {
  const folderPath = path.join(process.cwd(), LOCAL_UPLOAD_DIR_NAME, pathPrefix);
  const filepath = path.join(folderPath, filename);
  await (new Promise((resolve) => {
    const extraFolders = filename.split('/');
    let fullFolderPath = folderPath;
    if (extraFolders.length > 1) {
      fullFolderPath = path.join(fullFolderPath, ...extraFolders.slice(0, extraFolders.length - 1));
    }

    fs.exists(fullFolderPath, (exists) => {
      if (!exists) {
        fs.mkdir(fullFolderPath, resolve);
      } else {
        resolve(0);
      }
    });
  }));
  return new Promise((resolve, reject) => {
    if (stream instanceof Stream) {
      stream
        .on("error", error => {
          fs.unlinkSync(filepath);
          logger.error(error, { filepath });
          reject(error);
        })
        .on("end", () => resolve({ filepath: `${process.env.HOST}/${LOCAL_UPLOAD_DIR_NAME}/${pathPrefix}/${filename}` }))
        .pipe(fs.createWriteStream(filepath))
    } else if (stream instanceof Buffer) {
      fs.writeFile(filepath, stream, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ filepath: `${process.env.HOST}/${LOCAL_UPLOAD_DIR_NAME}/${pathPrefix}/${filename}` });
        }
      });
    }
  });
}

async function saveS3(
  { stream, mimetype, filename, pathPrefix } :
  { stream: Readable, mimetype: string, filename: string, pathPrefix: string }
): Promise<any> {
  let s3 = new S3();
  const folderPath = path.join(pathPrefix);
  const filepath = path.join(folderPath, filename);
  let params = {
    ACL: 'public-read',
    Bucket: process.env.S3_BUCKET_NAME ?? '',
    Key: filepath,
    Body: stream as Readable,
    ContentType: mimetype,
  };
  return new Promise((resolve, reject) => {
    s3.upload(params, function(err) {
      if (err) {
        logger.error(err);
        reject(err);
      } else {
        const host = process.env.NODE_ENV === 'production' ?
          `https://d1dxptkn7afynu.cloudfront.net` :
          `https://d2zj64wo5jphy6.cloudfront.net`;
        resolve({ filepath: `${host}/${filepath}` });
      }
    });
  });
}

export const saveFile = async ({ stream, mimetype = '', filename, pathPrefix }) => {
  if (process.env.SAVE_S3 === 'true') {
    return saveS3({ stream, mimetype, filename, pathPrefix });
  }
  return saveLocal({ stream, filename, pathPrefix });
}
