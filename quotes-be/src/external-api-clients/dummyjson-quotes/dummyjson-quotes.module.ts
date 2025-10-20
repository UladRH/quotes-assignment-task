import { HttpModule } from '@nestjs/axios';
import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
} from '@nestjs/common';

import { DummyJsonQuotesService } from './dummyjson-quotes.service';

export const DUMMYJSON_QUOTES_MODULE_OPTIONS =
  'DUMMYJSON_QUOTES_MODULE_OPTIONS';

const DEFAULT_BASE_URL = 'https://dummyjson.com';

const ensureTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value : `${value}/`;

export interface DummyJsonQuotesModuleOptions {
  baseUrl?: string;
}

export interface DummyJsonQuotesModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<DummyJsonQuotesModuleOptions> | DummyJsonQuotesModuleOptions;
  inject?: any[];
}

@Module({})
export class DummyJsonQuotesModule {
  static register(options: DummyJsonQuotesModuleOptions = {}): DynamicModule {
    const baseUrl = ensureTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL);

    const optionsProvider: Provider = {
      provide: DUMMYJSON_QUOTES_MODULE_OPTIONS,
      useValue: { baseUrl },
    };

    return {
      module: DummyJsonQuotesModule,
      imports: [HttpModule.register({ baseURL: baseUrl })],
      providers: [DummyJsonQuotesService, optionsProvider],
      exports: [DummyJsonQuotesService],
    };
  }

  static registerAsync(
    options: DummyJsonQuotesModuleAsyncOptions,
  ): DynamicModule {
    const imports = options.imports ?? [];
    const inject = options.inject ?? [];

    const baseUrlFactory = async (
      ...factoryArgs: unknown[]
    ): Promise<string> => {
      const resolvedOptions = await options.useFactory(...factoryArgs);
      return ensureTrailingSlash(resolvedOptions.baseUrl ?? DEFAULT_BASE_URL);
    };

    const optionsProvider: Provider = {
      provide: DUMMYJSON_QUOTES_MODULE_OPTIONS,
      useFactory: async (...factoryArgs: unknown[]) => ({
        baseUrl: await baseUrlFactory(...factoryArgs),
      }),
      inject,
    };

    return {
      module: DummyJsonQuotesModule,
      imports: [
        ...imports,
        HttpModule.registerAsync({
          imports,
          inject,
          useFactory: async (...factoryArgs: unknown[]) => ({
            baseURL: await baseUrlFactory(...factoryArgs),
          }),
        }),
      ],
      providers: [DummyJsonQuotesService, optionsProvider],
      exports: [DummyJsonQuotesService],
    };
  }

  static forRoot(options?: DummyJsonQuotesModuleOptions): DynamicModule {
    return this.register(options);
  }

  static forRootAsync(
    options: DummyJsonQuotesModuleAsyncOptions,
  ): DynamicModule {
    return this.registerAsync(options);
  }
}
