/*! https://mths.be/utf8js v2.1.2 by @mathias */
declare function utf8encode(string: any, opts: any): string;
declare function utf8decode(byteString: any, opts: any): string;
declare const _default: {
    version: string;
    encode: typeof utf8encode;
    decode: typeof utf8decode;
};
export default _default;
