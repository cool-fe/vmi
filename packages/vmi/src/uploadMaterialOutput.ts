import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import title from './utils/printTitle';

const Minio = require('minio');

export default async (cwd: string) => {
  const minioClient = new Minio.Client({
    endPoint: '172.16.6.51',
    port: 9000,
    useSSL: false,
    accessKey: 'www.winning.com.cn',
    secretKey: 'www.winning.com.cn',
  });
  const pkg = require(`${cwd}/package.json`);

  const metaData = {
    'Content-Type': 'application/octet-stream',
    'X-Amz-Meta-Testing': 1234,
    example: 5678,
  };

  // 递归上传dist下对应当前版本的所有打包产物到minio
  const domainName = pkg.name.split('/')[1].split('-')[0];
  const filepath = `materials-umd-lib/${domainName}/${pkg.name}/${pkg.version}/`;
  const fileDir = `${cwd}/dist/${pkg.version}/`;

  const classifyFiles = (filepath: string, dir: string) => {
    fs.readdir(dir, (err, files) => {
      files.forEach(filename => {
        let filedir = path.join(dir, filename);
        fs.stat(filedir, (err, stats) => {
          if (!err) {
            let isFile = stats.isFile(); //是文件
            if (isFile) {
              upload(`${filepath}${filename}`, `${dir}${filename}`);
            } else {
              classifyFiles(`${filepath}${filename}/`, `${dir}${filename}/`);
            }
          }
        });
      });
    });
  };
  // 上传方法
  const upload = (filepath: string, files: string) => {
    minioClient.fPutObject('winex', filepath, files, metaData, function(
      err: any,
    ) {
      if (err) {
        console.log(chalk.red('upload fail', err));
      }
    });
  };

  classifyFiles(filepath, fileDir);
  title('success', 'UPLOAD', 'Uploaded successfully ');
};
