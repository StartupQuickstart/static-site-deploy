import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import http from 'http';

import Github from './lib/github';
import shell from 'shelljs';
import { getFiles } from './lib/files';
import { S3 } from 'aws-sdk';
import fs from 'fs';
import mime from 'mime-types';

const s3 = new S3();

const app = new express();

app.get('/api/v1/hooks/github', (req, res) => {
  return res.send({ success: true, timestamp: Date.now() });
});

export default async () => {
  const app = new express();

  const bodyParserOptions = {
    extended: true,
    limit: '50mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  };
  app.use(cors());
  app.use(bodyParser.text());
  app.use(morgan('tiny'));
  app.use(bodyParser.json(bodyParserOptions));
  app.use(bodyParser.urlencoded(bodyParserOptions));
  app.use(cookieParser());

  function verifyPostData(req, res, next) {
    // For these headers, a sigHashAlg of sha1 must be used instead of sha256
    // GitHub: X-Hub-Signature
    // Gogs:   X-Gogs-Signature
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

  app.post('/api/v1/hooks/github', verifyPostData, async (req, res) => {
    try {
      const github = new Github(process.env.GITHUB_KEY);

      const root = '/tmp/startupquickstart-web-master';
      shell.exec(`rm -rf ${root}`);

      console.log(`Cloning github repository: ${process.env.GITHUB_REPO}`);
      await github.clone(process.env.GITHUB_REPO);

      const files = await getFiles(`${root}/build`);

      console.log(`Found ${files.length} files at ${root}/build.`);

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
    } catch (err) {
      console.error(err.message, err.stack);
      return res.status(500).send({
        success: false,
        timestamp: Date.now(),
        error: err,
      });
    }

    return res.json({
      success: true,
      timestamp: Date.now(),
    });
  });

  app.get('/*', async (req, res) => {
    const key = path.join('build', req.path);
    const s3Options = { Bucket: process.env.BUCKET_NAME, Key: key };
    const indexS3Options = { ...s3Options, Key: path.join(s3Options.Key, 'index.html') };

    function onHeadError(err) {
      return false;
    }

    const [indexHead, head] = await Promise.all([
      s3.headObject(indexS3Options).promise().catch(onHeadError),
      s3.headObject(s3Options).promise().catch(onHeadError),
    ]);

    res.setHeader('Content-Type', (indexHead || head).ContentType);
    return s3
      .getObject(indexHead ? indexS3Options : s3Options)
      .createReadStream()
      .on('error', (err) => {
        res.status(404).send(http.STATUS_CODES[404]);
      })
      .pipe(res);
  });

  return app;
};
