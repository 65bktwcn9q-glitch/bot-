import dotenv from 'dotenv';
import { createApp } from './server';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const { app, ensureAds } = createApp();

app.listen(PORT, async () => {
  console.log(`API running on ${PORT}`);
  await ensureAds();
});
