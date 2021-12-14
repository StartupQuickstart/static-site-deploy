import request from 'request';
import path from 'path';
import unzip from 'unzip-stream';
import crypto from 'crypto';

export default class Github {
  constructor(key) {
    this.key = key;
  }

  /**
   * Clones a github repo by downloading the zip file
   *
   * @param {String} repo Repository to clone
   * @param {String} targetDir Target Directory to extract repository to
   */
  clone(repo, targetDir = path.resolve('/tmp')) {
    return new Promise((resolve, reject) => {
      const archiveUrl = repo.replace(/.git$/, '/archive/master.zip');
      return request(archiveUrl, {
        headers: { Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}` },
      })
        .on('error', reject)
        .on('end', resolve)
        .pipe(unzip.Extract({ path: targetDir }));
    });
  }

  /**
   * Verifies the github webhook
   *
   * @param {HttpRequest} req Http request to verify
   * @param {HttpResponse} res Http response to return
   * @param {Callback} next Callback function
   */
  static verifyWebHook(req, res, next) {
    const sigHeaderName = 'X-Hub-Signature-256';
    const sigHashAlg = 'sha256';

    if (!req.rawBody) {
      return next('Request body empty');
    }

    const sig = Buffer.from(req.get(sigHeaderName) || '', 'utf8');
    const hmac = crypto.createHmac(sigHashAlg, process.env.GITHUB_SECRET);
    const digest = Buffer.from(sigHashAlg + '=' + hmac.update(req.rawBody).digest('hex'), 'utf8');
    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${sig})`);
    }

    return next();
  }
}
