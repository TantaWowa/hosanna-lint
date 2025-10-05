/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * These are decorators for web version of the sdk
 */

/**
 * Type definition for a metadata function used to define metadata on classes or properties.
 * @param key - The metadata key.
 * @param value - The metadata value.
 * @param target - The target object.
 * @param propertyKey - The property key (optional).
 */
type MetadataFunc = (key: any, value: any, target: object, propertyKey?: string | symbol) => void;

/**
 * Fallback no-op metadata function.
 */
let defineMetadata: MetadataFunc = () => { /* no-op fallback */ };

// If Reflect.defineMetadata exists (in web), use it
if (typeof (Reflect as any).defineMetadata === 'function') {
  defineMetadata = (Reflect as any).defineMetadata;
}

/**
 * Symbol used as a metadata key for observable fields.
 */
export const OBSERVABLE_METADATA_KEY = Symbol('observable');
/**
 * Symbol used as a metadata key for state fields.
 */
export const STATE_METADATA_KEY = Symbol('state');
/**
 * Symbol used to store a set of observable field names on a class constructor.
 */
const OBSERVABLE_FIELDS = Symbol('observableFields');

/*******************************************************************
 * STATE
 *******************************************************************/

/**
 * Indicates a class is a view, and should be registered with the view manager.
 * Aggregate views are view which contain other views, like Group, HGroup, etc.
 * @param viewName Name of the view
 * @returns
 */
export function aggregateView(viewName: string) {

  return function (target: unknown) {
    // Decorator for marking a class as an aggregate view.
  };
}

/**
 * Indicates a class is a view, and should be registered with the view manager
 * @param viewName Name of the view
 * @returns
 */
export function view(viewName: string) {

  return function (target: unknown) {
    //TODO iterate over all fields, and call setObservableField for all fields
    // Decorator for marking a class as a view.
  };
}

/**
 * Marks a field as being view state, which means the field will cause the view to invalide, if changed
 * @param target
 * @param propertyKey
 */
export function state(target: unknown, propertyKey: string) {

  defineMetadata(STATE_METADATA_KEY, true, target as any, propertyKey);
  // Check if the target class has the necessary methods or properties

  if (typeof (target as any).setLayoutField !== 'function') {

    throw new Error(`@state can only be used in classes that support state fields. Class ${(target as any).constructor.name} does not support state fields. you need to extend BaseView`);
  }

  Object.defineProperty(target, propertyKey, {
    get() {
      //default to pending state if it's set.
      if (this.pendingState && this.pendingState[propertyKey] !== undefined) {
        return this.pendingState[propertyKey];
      } else {
        return this.state[propertyKey];
      }
    }
