import { ModuleMetadata, Type } from '@nestjs/common';

export interface SensAlimtalkConfig {
  accessKey: string;
  secretKey: string;
  serviceId: string;
  plusFriendId: string;
  useSmsFailover?: boolean;
  isGlobal?: boolean;
}

export interface SensAlimtalkOptionsFactory {
  createSensAlimtalkOptions():
    | Promise<SensAlimtalkConfig>
    | SensAlimtalkConfig;
}

export interface SensAlimtalkAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useExisting?: Type<SensAlimtalkOptionsFactory>;
  useClass?: Type<SensAlimtalkOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<SensAlimtalkConfig> | SensAlimtalkConfig;
  inject?: any[];
}
