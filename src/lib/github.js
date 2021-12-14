import request from 'request';
import path from 'path';
import unzip from 'unzip-stream';

export default class Github {
  constructor(key) {
    this.key = key;
  }

  clone(repo, targetDir = path.resolve(__dirname, '/tmp')) {
    return new Promise((resolve, reject) => {
      const archiveUrl = repo.replace(/.git$/, '/archive/master.zip');
      return request(archiveUrl, {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
      })
        .on('error', reject)
        .on('end', resolve)
        .pipe(unzip.Extract({ path: targetDir }));
    });
  }
}
