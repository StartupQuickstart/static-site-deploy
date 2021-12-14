# Static Site Deploy

### Installation

```
$ npm install
```

### Environment

```
   cp .envrc.example .envrc
```

Aws Security Credentials found [here](https://console.aws.amazon.com/iam/home?#/security_credentials).
```
  export AWS_ACCESS_KEY_ID=''
  export AWS_SECRET_ACCESS_KEY=''
  export AWS_REGION='us-east-1'
```

The name and ARN of the certificate of the ssl certificate you want to use.
You can setup one [here](https://console.aws.amazon.com/acm/home?region=us-east-1#/certificates/list).
```
  export CERTIFICATE_NAME='example.com'
  export CERTIFICATE_ARN='arn:aws:acm:us-east-1:123456789000:certificate/88888888-4444-4444-4444-1212121212'
```

The name of the app, the environemnt (stage, prod, etc.), and the url to deploy the website.
```
  export APP='example-app'
  export ENV='prod'
  export DOMAIN='www.example.com'
```

The name of the bucket website files will be stored. This will be created with the deployemnt
```
  export BUCKET_NAME='www.example.com'
```

The github secret is a generated secret that github uses to authenticate a webhook.
You can generate one [here](https://randomkeygen.com/)
```
  export GITHUB_SECRET='generated-github-secret'
```

You will need a github person access token if deploying private github repositories. You will need "Full control of private repositories".
You can create one [here](https://github.com/settings/tokens).
```
  export GITHUB_PERSONAL_ACCESS_TOKEN='github-token'
```

And lastly you need to have the link to the github repository you want to deploy.
```
  export GITHUB_REPO='https://github.com/{github-account}/{github-repo}.git'
```

### Local Development

```
$ npm run dev
```

This command starts a local development server. Changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates a production build in the `dist` directory and can be served using `npm start`

### Deployment

```
$ npm run deploy
```

