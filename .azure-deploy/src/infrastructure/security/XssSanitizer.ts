import xss from 'xss';
import { ISanitizer } from '@/domain/ports/ISanitizer';

export class XssSanitizer implements ISanitizer {
  sanitize(text: string): string {
    return xss(text, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });
  }
}
