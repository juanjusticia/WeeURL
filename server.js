import { startServer } from './dist/server/entry.mjs';

const port = process.env.PORT || 3000;
startServer({
  port,
  hostname: '0.0.0.0'
});