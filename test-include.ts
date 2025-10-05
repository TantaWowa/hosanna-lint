import { ISGNNode } from '@hs-src/hosanna-bridge-targets/common/sg-api';
import { IDeveloperUtils } from '@hs-src/hosanna-ui/views/lib/DeveloperUtils';
import { AppUtils } from './AppUtils';
import 'reflect-metadata';

// This should trigger rules
const nanValue = NaN;
const result = isNaN(nanValue);
