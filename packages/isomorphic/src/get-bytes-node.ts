import { TextEncoder } from 'util';
import { getBytes as _getBytes } from './get-bytes';

export { BytesInput } from './get-bytes';

const encoder = new TextEncoder();

/**
 * Convert the input to a Uint8Array.
 *
 * @param input the input to convert
 */
export const getBytes = _getBytes(encoder);
