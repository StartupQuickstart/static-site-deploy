import shell from 'shelljs';
import path from 'path';
import Github from '../lib/github';
import { S3 } from 'aws-sdk';

const s3 = new S3();

export default class ApiController {
  /**
   * Processes the github hook and deploys the changes
   *
   * @param {HttpRequest} req HttpRequest sent to server
   * @param {HttpResponse} res HttpResponse used to respond
   */
  static async githubWebHook(req, res) {
    try {
      const github = new Github(process.env.GITHUB_KEY);

      const tempDir = '/temp';
      const repoName = process.env.GITHUB_REPO.split('/')
        .pop()
        .replace(/\.git$/, '');

      const dir = path.join(tempDir, repoName);
      shell.exec(`rm -rf ${dir}`);

      console.log(`Cloning github repository: ${process.env.GITHUB_REPO}`);
      await github.clone(process.env.GITHUB_REPO);

      const files = await getFiles(`${dir}/build`);

      console.log(`Found ${files.length} files at ${dir}/build.`);

      await Promise.all(
        files.map((file) =>
          s3
            .upload({
              Bucket: process.env.BUCKET_NAME,
              Key: file.replace(`${root}/`, ''),
              Body: fs.createReadStream(file),
              ContentType: mime.lookup(file),
            })
            .promise()
            .catch((err) => {
              console.log(err);
              throw err;
            })
        )
      );

      return res.json({
        success: true,
        timestamp: Date.now(),
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        timestamp: Date.now(),
        error: err,
      });
    }
  }

  /**
   * Servers the websites static files
   *
   * @param {HttpRequest} req HttpRequest sent to server
   * @param {HttpResponse} res HttpResponse used to respond
   */
  static async serveWebsite(req, res) {
    const key = path.join('build', req.path);
    const s3Options = { Bucket: process.env.BUCKET_NAME, Key: key };
    const indexS3Options = { ...s3Options, Key: path.join(s3Options.Key, 'index.html') };

    const [indexHead, head] = await Promise.all([
      s3
        .headObject(indexS3Options)
        .promise()
        .catch(() => false),
      s3
        .headObject(s3Options)
        .promise()
        .catch(() => false),
    ]);

    res.setHeader('Content-Type', (indexHead || head).ContentType);
    return s3
      .getObject(indexHead ? indexS3Options : s3Options)
      .createReadStream()
      .on('error', (err) => {
        res.status(404).send(http.STATUS_CODES[404]);
      })
      .pipe(res);
  }
}
