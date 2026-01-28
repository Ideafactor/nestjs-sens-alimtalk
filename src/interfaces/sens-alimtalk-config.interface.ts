import { ModuleMetadata, Type } from '@nestjs/common';

export interface SensAlimtalkConfig {
  accessKey: string;
  secretKey: string;
  serviceId: string;
  plusFriendId: string;
  useSmsFailover?: boolean;
}

export interface SensAlimtalkOptionsFactory {
  createSensAlimtalkOptions():
    | Promise<SensAlimtalkConfig>
    | SensAlimtalkConfig;
}

export interface SensAlimtalkAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<SensAlimtalkOptionsFactory>;
  useClass?: Type<SensAlimtalkOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<SensAlimtalkConfig> | SensAlimtalkConfig;
  inject?: any[];
}
