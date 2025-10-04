/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
// This file should pass all Hosanna rules

// Valid imports (no JSON)
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
import { Bridge } from '@hs-src/hosanna-bridge';
import { Component } from 'react';
import fs from 'fs';

// Valid top-level class
class ValidClass {
  constructor(public name: string) {}
  method() { return 42; }
}

// Valid object literals
const validObject = {
  normalProperty: 'value',
  ['stringLiteral']: 'allowed',
  [123]: 'number literal allowed',
  [MyEnum.VALUE]: 'enum allowed',
};

enum MyEnum {
  VALUE = 'test'
}

// Valid functions at module level
function moduleLevelFunction() {
  return 42;
}

const arrowFunction = () => 42;

// Valid HsDate usage
const hsDate = new HsDate();

// Valid console-like usage (not global console)
const myLogger = {
  log: (msg: string) => { /* custom logging */ }
};
myLogger.log('custom message');
