import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  SensAlimtalkConfig,
  SensAlimtalkAsyncOptions,
  SensAlimtalkOptionsFactory,
} from './interfaces';
import { SENS_ALIMTALK_MODULE_OPTIONS } from './constants/sens-alimtalk.constants';
import { SensAlimtalkService } from './sens-alimtalk.service';

@Global()
@Module({})
export class SensAlimtalkModule {
  static forRoot(config: SensAlimtalkConfig): DynamicModule {
    return {
      module: SensAlimtalkModule,
      imports: [HttpModule],
      providers: [
        {
          provide: SENS_ALIMTALK_MODULE_OPTIONS,
          useValue: config,
        },
        SensAlimtalkService,
      ],
      exports: [SensAlimtalkService],
    };
  }

  static forRootAsync(options: SensAlimtalkAsyncOptions): DynamicModule {
    return {
      module: SensAlimtalkModule,
      imports: [...(options.imports || []), HttpModule],
      providers: [
        ...this.createAsyncProviders(options),
        SensAlimtalkService,
      ],
      exports: [SensAlimtalkService],
    };
  }

  private static createAsyncProviders(
    options: SensAlimtalkAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    return [this.createAsyncOptionsProvider(options)];
  }

  private static createAsyncOptionsProvider(
    options: SensAlimtalkAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SENS_ALIMTALK_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = options.useExisting || options.useClass;
    if (!inject) {
      throw new Error(
        'Invalid configuration. Must provide useFactory, useClass or useExisting',
      );
    }

    return {
      provide: SENS_ALIMTALK_MODULE_OPTIONS,
      useFactory: async (
        optionsFactory: SensAlimtalkOptionsFactory,
      ): Promise<SensAlimtalkConfig> =>
        optionsFactory.createSensAlimtalkOptions(),
      inject: [inject],
    };
  }
}
