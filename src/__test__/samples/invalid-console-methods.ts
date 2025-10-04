// Invalid: console method calls
console.log('message');
console.error('error');
console.warn('warning');
console.info('info');
console.debug('debug');
console.table(data);

// Valid: custom logger (should not trigger)
const myLogger = { log: (msg: string) => {} };
myLogger.log('custom message');
