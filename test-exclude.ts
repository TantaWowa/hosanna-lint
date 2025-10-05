// hs:exclude-from-platform roku
/* eslint-disable @hosanna-eslint/* */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ISGNNode } from '@hs-src/hosanna-bridge-targets/common/sg-api';
import { IDeveloperUtils } from '@hs-src/hosanna-ui/views/lib/DeveloperUtils';
import { AppUtils } from './AppUtils';
import 'reflect-metadata';


//FIXME - for consistency with roku device
//We should change this so it ONLY inject on instanatiation
export function inject(serviceIdentifier?: string) {
  return function (target: any, key: string): void {
    // If no serviceIdentifier is provided, use the property name as the identifier
    const resolvedIdentifier = serviceIdentifier ?? key;
    let value: any;

    delete target[key];
    Object.defineProperty(target, key, {
      get: function () {
        if (!value) {
          value = AppUtils.resolve(resolvedIdentifier);
        }
        return value;
      },
      enumerable: true,
      configurable: true
    });
  };
}
