// import fastifyHelmet from '@fastify/helmet';
import secureSession from '@fastify/secure-session';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';

function setupOpenApiSpec(app: NestFastifyApplication) {
  const config = new DocumentBuilder()
    .setTitle('Quotes BE API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document), {
    jsonDocumentUrl: 'api.json',
  });
}

async function setupSession(app: NestFastifyApplication) {
  const config = app.get(ConfigService);

  await app.register(secureSession, {
    secret: config.get('SESSION_SECRET') as string,
    salt: config.get<string>('SESSION_SALT') as string,
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await setupSession(app);

  setupOpenApiSpec(app);

  // await app.register(fastifyHelmet);

  const logger = new Logger('Bootstrap');
  const host = process.env.HOST ?? '0.0.0.0';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  await app.listen(port, host);

  const appUrl = (await app.getUrl()).replace('0.0.0.0', 'localhost');
  const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

  logger.log(`Swagger UI ready at ${baseUrl}/api`);
  logger.log(`Swagger JSON available at ${baseUrl}/api.json`);
  logger.log(`GraphQL Playground available at ${baseUrl}/graphiql`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
