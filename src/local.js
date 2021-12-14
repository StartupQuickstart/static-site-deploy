import path from 'path';
import App from './app';

const port = process.env.PORT || 3000;

(async () => {
  const app = await App();

  // Server
  app.listen(port, () => {
    console.log(`Listening on: http://localhost:${port}`);
  });
})();
