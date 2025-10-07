// Test large numeric literals rule with roLongInteger casting

// These should be flagged as errors (large literals without roLongInteger type)
const timestamp = 1577923200000; // ERROR: will be cast as roLongInteger

// These should be allowed (explicitly typed as roLongInteger)
const typedTimestamp: roLongInteger = 1577923200000; // OK
const castTimestamp = 1577923200000 as roLongInteger; // OK
