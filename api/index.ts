import serverless from 'serverless-http';
import { createApp } from '../apps/api/src/server';

const { app, ensureAds } = createApp();
void ensureAds();

export default serverless(app);
