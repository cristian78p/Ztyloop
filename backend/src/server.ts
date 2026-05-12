import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`🚀 ZTYLOOP API → http://localhost:${env.PORT}`);
    logger.info(`📋 Ambiente: ${env.NODE_ENV}`);
    logger.info(`🔗 Docs: http://localhost:${env.PORT}/api/v1`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Error al iniciar el servidor');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
  process.exit(1);
});
