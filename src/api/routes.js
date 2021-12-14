import Github from '../lib/github';
import Controller from './controller';

export default (app) => {
  app.post('/api/v1/hooks/github', Github.verifyWebHook, Controller.githubWebHook);
  app.get('/*', Controller.serveWebsite);
};
