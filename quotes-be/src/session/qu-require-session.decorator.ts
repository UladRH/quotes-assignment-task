import { applyDecorators, SetMetadata } from '@nestjs/common';

export const QU_REQUIRE_SESSION_METADATA_KEY = 'qu-require-session';

export function QuRequireSession(): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(QU_REQUIRE_SESSION_METADATA_KEY, true));
}
