import { SetMetadata } from '@nestjs/common';

// এই decorator যে route এ লাগাবে সেটা public হয়ে যাবে
export const IsPublic = () => SetMetadata('isPublic', true);