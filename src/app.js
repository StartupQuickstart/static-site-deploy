import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import http from 'http';
import apiRoutes from './api/routes';

import Github from './lib/github';
import shell from 'shelljs';
import { getFiles } from './lib/files';
import { S3 } from 'aws-sdk';
import fs from 'fs';
import mime from 'mime-types';

const s3 = new S3();

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

  apiRoutes(app);

  return app;
};
