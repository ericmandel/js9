
// astroem.js: astronomy utilities compiled to js

var Astroem = (function() {


var Module = {
    'noExitRuntime': true
};


// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(28211);
/* global initializers */ __ATINIT__.push();


/* memory initializer */ allocate([37,46,51,102,32,37,46,51,102,0,0,0,0,0,0,0,103,97,108,97,99,116,105,99,0,0,0,0,0,0,0,0,101,99,108,105,112,116,105,99,0,0,0,0,0,0,0,0,108,105,110,101,97,114,0,0,100,101,103,114,101,101,115,0,115,101,120,97,103,101,115,105,109,97,108,0,0,0,0,0,59,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,115,40,0,0,0,0,0,37,46,54,102,44,32,37,46,54,102,0,0,0,0,0,0,37,115,44,32,37,115,0,0,112,111,108,121,103,111,110,0,44,32,37,46,54,102,44,32,37,46,54,102,0,0,0,0,44,32,37,115,44,32,37,115,0,0,0,0,0,0,0,0,44,32,37,46,50,102,34,0,44,32,37,46,54,102,39,0,44,32,37,46,54,102,100,0,98,111,120,0,0,0,0,0,101,108,108,105,112,115,101,0,44,32,37,46,51,102,0,0,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,102,32,37,102], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([1,0,0,0,0,0,0,0,87,67,83,73,78,73,84,78,58,32,87,67,83,32,110,97,109,101,32,37,115,32,110,111,116,32,109,97,116,99,104,101,100,32,105,110,32,70,73,84,83,32,104,101,97,100,101,114,10,0,0,0,0,0,0,0,87,67,83,78,65,77,69,0,87,67,83,65,88,69,83,0,78,65,88,73,83,0,0,0,87,67,83,68,73,77,0,0,87,67,83,73,78,73,84,58,32,78,111,32,87,67,83,65,88,69,83,44,32,78,65,88,73,83,44,32,111,114,32,87,67,83,68,73,77,32,107,101,121,119,111,114,100,0,0,0,78,65,88,73,83,49,0,0,73,77,65,71,69,87,0,0,87,67,83,73,78,73,84,58,32,78,111,32,78,65,88,73,83,49,32,111,114,32,73,77,65,71,69,87,32,107,101,121,119,111,114,100,0,0,0,0,78,65,88,73,83,50,0,0,73,77,65,71,69,72,0,0,87,67,83,73,78,73,84,58,32,78,111,32,78,65,88,73,83,50,32,111,114,32,73,77,65,71,69,72,32,107,101,121,119,111,114,100,0,0,0,0,37,100,0,0,0,0,0,0,87,67,83,73,78,73,84,58,32,77,105,115,115,105,110,103,32,107,101,121,119,111,114,100,32,37,115,32,97,115,115,117,109,101,100,32,49,10,0,0,67,84,89,80,69,0,0,0,45,84,65,66,0,0,0,0,73,78,83,84,82,85,77,69,0,0,0,0,0,0,0,0,68,69,84,69,67,84,79,82,0,0,0,0,0,0,0,0,68,67,45,70,76,65,71,0,87,67,83,68,69,80,0,0,87,67,83,73,78,73,84,58,32,100,101,112,101,110,100,101,100,32,111,110,32,87,67,83,32,99,111,117,108,100,32,110,111,116,32,98,101,32,115,101,116,0,0,0,0,0,0,0,86,83,79,85,82,67,69,0,90,83,79,85,82,67,69,0,86,69,76,79,67,73,84,89,0,0,0,0,0,0,0,0,67,84,89,80,69,49,0,0,67,84,89,80,69,50,0,0,76,65,84,0,0,0,0,0,68,69,67,0,0,0,0,0,67,84,89,80,69,51,0,0,67,84,89,80,69,52,0,0,67,85,78,73,84,49,0,0,87,65,84,49,0,0,0,0,117,110,105,116,115,0,0,0,112,105,120,101,108,0,0,0,67,85,78,73,84,50,0,0,87,65,84,50,0,0,0,0,67,82,80,73,88,49,0,0,67,82,80,73,88,50,0,0,67,82,86,65,76,49,0,0,67,82,86,65,76,50,0,0,76,79,78,80,79,76,69,0,76,65,84,80,79,76,69,0,80,82,79,74,82,48,0,0,80,82,79,74,80,37,100,0,80,86,37,100,95,49,0,0,80,86,37,100,95,50,0,0,80,86,37,100,95,51,0,0,80,86,37,100,95,37,100,0,67,68,49,95,49,0,0,0,67,68,49,95,50,0,0,0,67,68,50,95,49,0,0,0,67,68,50,95,50,0,0,0,67,79,49,95,49,0,0,0,80,76,65,84,69,0,0,0,67,79,49,95,37,100,0,0,67,79,50,95,49,0,0,0,67,79,50,95,37,100,0,0,67,68,69,76,84,49,0,0,67,68,69,76,84,50,0,0,83,69,67,80,73,88,0,0,80,73,88,83,67,65,76,69,0,0,0,0,0,0,0,0,80,73,88,83,67,65,76,49,0,0,0,0,0,0,0,0,88,80,73,88,83,73,90,69,0,0,0,0,0,0,0,0,83,69,67,80,73,88,49,0,83,69,67,80,73,88,50,0,89,80,73,88,83,73,90,69,0,0,0,0,0,0,0,0,80,73,88,83,67,65,76,50,0,0,0,0,0,0,0,0,80,67,48,48,49,48,48,49,0,0,0,0,0,0,0,0,80,67,48,48,37,49,100,48,48,37,49,100,0,0,0,0,80,67,49,95,49,0,0,0,80,67,37,49,100,95,37,49,100,0,0,0,0,0,0,0,67,82,79,84,65,50,0,0,67,82,79,84,65,49,0,0,87,67,83,73,78,73,84,58,32,115,101,116,116,105,110,103,32,67,68,69,76,84,32,116,111,32,49,0,0,0,0,0,76,73,78,69,65,82,0,0,80,73,88,69,76,0,0,0,77,74,68,45,79,66,83,0,68,65,84,69,45,79,66,83,0,0,0,0,0,0,0,0,68,65,84,69,0,0,0,0,69,80,79,67,72,0,0,0,85,84,0,0,0,0,0,0,85,84,77,73,68,0,0,0,87,67,83,73,78,73,84,67,58,32,78,111,32,105,109,97,103,101,32,115,99,97,108,101,32,102,111,114,32,87,67,83,32,37,99,0,0,0,0,0,80,76,84,82,65,72,0,0,80,76,84,82,65,77,0,0,80,76,84,82,65,83,0,0,80,76,84,68,69,67,83,78,0,0,0,0,0,0,0,0,80,76,84,68,69,67,68,0,80,76,84,68,69,67,77,0,80,76,84,68,69,67,83,0,69,81,85,73,78,79,88,0,70,75,52,0,0,0,0,0,70,75,53,0,0,0,0,0,37,50,46,48,102,58,37,50,46,48,102,58,37,53,46,51,102,32,37,99,37,50,46,48,102,58,37,50,46,48,102,58,37,53,46,51,102,32,37,115,0,0,0,0,0,0,0,0,80,76,84,83,67,65,76,69,0,0,0,0,0,0,0,0,88,80,73,88,69,76,83,90,0,0,0,0,0,0,0,0,89,80,73,88,69,76,83,90,0,0,0,0,0,0,0,0,67,78,80,73,88,49,0,0,67,78,80,73,88,50,0,0,80,80,79,49,0,0,0,0,80,80,79,37,100,0,0,0,65,77,68,88,49,0,0,0,65,77,68,88,37,100,0,0,65,77,68,89,49,0,0,0,65,77,68,89,37,100,0,0,82,65,0,0,0,0,0,0,82,65,45,45,45,68,83,83,0,0,0,0,0,0,0,0,68,69,67,45,45,68,83,83,0,0,0,0,0,0,0,0,87,67,83,73,78,73,84,58,32,78,111,32,82,65,32,119,105,116,104,32,83,69,67,80,73,88,44,32,110,111,32,87,67,83,0,0,0,0,0,0,87,67,83,73,78,73,84,32,78,111,32,68,69,67,32,119,105,116,104,32,83,69,67,80,73,88,44,32,110,111,32,87,67,83,0,0,0,0,0,0,76,79,78,71,80,79,76,69,0,0,0,0,0,0,0,0,82,65,45,45,45,84,65,78,0,0,0,0,0,0,0,0,68,69,67,45,45,84,65,78,0,0,0,0,0,0,0,0,87,67,83,73,78,73,84,58,32,78,111,32,105,109,97,103,101,32,115,99,97,108,101,0,84,65,78,0,0,0,0,0,42,69,114,114,111,114,42,58,32,105,110,99,111,114,114,101,99,116,32,108,105,110,101,97,114,32,99,111,110,118,101,114,115,105,111,110,32,105,110,32,37,115,0,0,0,0,0,0,87,65,82,78,73,78,71,58,32,83,105,103,110,105,102,105,99,97,110,116,32,105,110,97,99,99,117,114,97,99,121,32,108,105,107,101,108,121,32,116,111,32,111,99,99,117,114,32,105,110,32,112,114,111,106,101,99,116,105,111,110,0,0,0,69,81,85,73,78,79,88,37,99,0,0,0,0,0,0,0,82,65,68,69,67,83,89,83,37,99,0,0,0,0,0,0,82,65,68,69,67,83,89,83,0,0,0,0,0,0,0,0,73,67,82,83,0,0,0,0,71,65,76,0,0,0,0,0,69,67,76,0,0,0,0,0,71,65,76,65,67,84,73,67,0,0,0,0,0,0,0,0,69,67,76,73,80,84,73,67,0,0,0,0,0,0,0,0,83,71,65,76,65,67,84,67,0,0,0,0,0,0,0,0,72,69,76,73,79,69,67,76,0,0,0,0,0,0,0,0,65,76,84,65,90,0,0,0,0,0,0,0,0,0,0,0,68,69,67,0,0,0,0,0,76,79,78,71,0,0,0,0,76,73,78,69,65,82,0,0,80,73,88,69,76,0,0,0,68,69,84,0,0,0,0,0,37,45,52,115,37,52,115,0,78,80,79,76,0,0,0,0,76,65,84,0,0,0,0,0,78,80,79,76,69,0,0,0,83,80,65,45,0,0,0,0,73,77,83,89,83,0,0,0,105,109,115,121,115,0,0,0,37,46,52,102,0,0,0,0,66,49,57,53,48,0,0,0,74,50,48,48,48,0,0,0,37,115,9,37,115,0,0,0,37,115,32,37,115,0,0,0,42,42,42,42,42,42,42,42,42,9,42,42,42,42,42,42,42,42,42,42,0,0,0,0,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,0,0,0,0,0,42,42,42,42,42,42,42,42,42,42,42,42,42,9,42,42,42,42,42,42,42,42,42,42,42,42,42,0,0,0,0,0,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,0,0,0,0,0,0,9,103,97,108,97,99,116,105,99,0,0,0,0,0,0,0,32,103,97,108,97,99,116,105,99,0,0,0,0,0,0,0,9,101,99,108,105,112,116,105,99,0,0,0,0,0,0,0,32,101,99,108,105,112,116,105,99,0,0,0,0,0,0,0,9,108,111,110,103,45,110,112,97,0,0,0,0,0,0,0,32,108,111,110,103,45,110,112,97,0,0,0,0,0,0,0,9,108,111,110,103,45,115,112,97,0,0,0,0,0,0,0,32,108,111,110,103,45,115,112,97,0,0,0,0,0,0,0,42,42,42,42,42,42,42,42,42,42,9,42,42,42,42,42,42,42,42,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,87,67,83,95,67,79,77,77,65,78,68,0,0,0,0,0,87,67,83,95,67,79,77,77,65,78,68,37,100,0,0,0,50,48,48,48,0,0,0,0,50,48,48,48,46,48,0,0,73,67,82,83,0,0,0,0,105,99,114,115,0,0,0,0,70,75,53,0,0,0,0,0,102,107,53,0,0,0,0,0,49,57,53,48,0,0,0,0,49,57,53,48,46,48,0,0,70,75,52,0,0,0,0,0,102,107,52,0,0,0,0,0,112,105,120,101,108,0,0,0,44,66,124,35,100,255,239,63,206,4,147,55,81,230,134,63,201,87,119,237,8,231,115,63,8,49,216,60,72,85,196,190,141,82,239,197,175,26,93,190,79,75,150,130,180,74,73,190,206,4,147,55,81,230,134,191,110,20,118,229,124,255,239,63,190,2,89,23,76,127,252,190,141,82,239,197,175,26,93,62,186,92,192,248,87,85,196,190,213,61,80,36,200,25,210,61,192,143,86,244,8,231,115,191,40,252,144,126,141,121,252,190,190,45,6,62,231,255,239,63,79,75,150,130,180,74,73,62,213,61,80,36,200,25,210,61,56,97,156,141,155,85,196,190,37,201,115,125,31,14,66,191,237,156,102,129,118,135,206,63,237,128,235,138,25,225,219,191,138,238,48,88,55,255,239,63,235,42,147,208,76,230,134,63,26,132,28,8,135,230,115,63,12,31,17,83,34,137,206,191,58,234,232,184,26,217,101,191,7,35,246,9,160,24,137,63,235,42,147,208,76,230,134,191,233,248,162,28,80,255,239,63,8,168,211,46,100,125,252,190,137,181,248,20,0,227,219,63,180,173,102,157,241,125,129,191,174,14,128,184,171,87,97,63,26,132,28,8,135,230,115,191,247,97,247,252,180,122,252,190,137,77,92,117,186,255,239,63,125,150,201,34,100,255,239,63,15,157,207,213,158,230,134,191,92,113,244,103,237,229,115,191,26,77,59,180,100,85,196,62,52,175,17,131,3,27,93,190,173,87,210,121,59,74,73,190,20,1,96,210,158,230,134,63,3,186,248,225,124,255,239,63,250,59,9,220,34,127,252,190,52,175,17,131,3,27,93,62,91,229,82,109,116,85,196,62,232,167,8,110,48,27,210,189,73,225,178,117,237,229,115,63,235,19,108,31,83,119,252,190,10,30,195,64,231,255,239,63,173,87,210,121,59,74,73,62,185,158,187,181,171,23,210,189,73,125,255,4,184,85,196,62,37,201,115,125,31,14,66,191,211,48,124,68,76,137,206,191,34,223,165,212,37,227,219,63,45,6,81,239,144,255,239,63,108,197,229,21,219,230,134,191,214,96,142,220,162,229,115,191,180,174,209,114,160,135,206,63,58,234,232,184,26,217,101,191,180,173,102,157,241,125,129,191,108,197,229,21,219,230,134,63,26,73,6,169,169,255,239,63,26,238,175,96,19,128,252,190,134,170,152,74,63,225,219,191,7,35,246,9,160,24,137,63,174,14,128,184,171,87,97,63,214,96,142,220,162,229,115,63,212,213,62,153,86,117,252,190,150,50,62,6,10,0,240,63,0,0,0,0,0,0,0,0,70,75,52,50,71,65,76,58,32,66,49,57,53,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,70,75,52,50,71,65,76,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,71,65,76,50,70,75,52,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,71,65,76,50,70,75,52,58,32,66,49,57,53,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,70,75,53,50,71,65,76,58,32,74,50,48,48,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,70,75,53,50,71,65,76,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,71,65,76,50,70,75,53,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,71,65,76,50,70,75,53,58,32,74,50,48,48,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,54,46,51,102,32,37,99,37,48,50,100,58,37,48,50,100,58,37,48,53,46,50,102,0,0,0,0,0,0,0,0,0,0,0,0,0,69,78,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,28,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,37,115,95,49,0,0,0,0,37,115,95,37,100,0,0,0,37,115,95,48,49,0,0,0,37,115,95,48,48,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,45,48,0,0,0,0,0,0,37,100,0,0,0,0,0,0,37,37,46,37,100,102,0,0,37,48,50,100,58,37,48,50,100,58,37,48,57,46,54,102,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,56,46,53,102,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,55,46,52,102,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,54,46,51,102,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,53,46,50,102,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,52,46,49,102,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,57,46,54,102,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,56,46,53,102,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,55,46,52,102,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,54,46,51,102,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,53,46,50,102,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,52,46,49,102,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,0,0,0,0,37,37,37,100,46,37,100,102,0,0,0,0,0,0,0,0,37,37,37,52,100,0,0,0,37,37,37,100,100], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+4352);
/* memory initializer */ allocate([87,65,84,49,0,0,0,0,87,65,84,50,0,0,0,0,108,111,110,103,112,111,108,101,0,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,108,110,103,99,111,114,0,0,108,97,116,99,111,114,0,0,84,78,88,95,71,83,69,86,65,76,58,32,117,110,107,110,111,119,110,32,115,117,114,102,97,99,101,32,116,121,112,101,10,0,0,0,0,0,0,0,84,78,88,95,71,83,68,69,82,58,32,111,114,100,101,114,32,111,102,32,100,101,114,105,118,97,116,105,118,101,115,32,99,97,110,110,111,116,32,98,101,32,60,32,48,10,0,0,84,78,88,95,71,83,68,69,82,58,32,117,110,107,110,111,119,110,32,115,117,114,102,97,99,101,32,116,121,112,101,32,37,100,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,120,32,111,114,100,101,114,32,37,100,10,0,0,0,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,121,32,111,114,100,101,114,32,37,100,10,0,0,0,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,120,32,114,97,110,103,101,32,37,102,45,37,102,10,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,121,32,114,97,110,103,101,32,37,102,45,37,102,10,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,117,110,107,110,111,119,110,32,115,117,114,102,97,99,101,32,116,121,112,101,32,37,100,10,0,0,87,65,84,49,0,0,0,0,87,65,84,49,95,48,48,49,61,32,39,119,116,121,112,101,61,122,112,120,32,97,120,116,121,112,101,61,114,97,32,112,114,111,106,112,48,61,48,46,32,112,114,111,106,112,49,61,49,46,32,112,114,111,106,112,50,61,48,46,32,112,114,111,106,112,51,61,51,51,55,46,55,52,32,112,114,111,106,39,87,65,84,50,95,48,48,49,61,32,39,119,116,121,112,101,61,122,112,120,32,97,120,116,121,112,101,61,100,101,99,32,112,114,111,106,112,48,61,48,46,32,112,114,111,106,112,49,61,49,46,32,112,114,111,106,112,50,61,48,46,32,112,114,111,106,112,51,61,51,51,55,46,55,52,32,112,114,111,39,0,0,0,0,0,0,0,0,87,65,84,50,0,0,0,0,108,111,110,103,112,111,108,101,0,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,112,114,111,106,112,37,100,0,108,110,103,99,111,114,0,0,108,97,116,99,111,114,0,0,10,62,32,37,115,37,115,10,10,0,0,0,0,0,0,0,78,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,32,102,111,114,32,0,0,112,111,108,121,32,40,49,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,84,104,101,32,100,105,109,101,110,115,105,111,110,97,108,105,116,121,32,111,102,32,116,104,101,32,112,111,108,121,110,111,109,32,40,37,100,41,32,101,120,99,101,101,100,115,32,116,104,101,32,109,97,120,105,109,117,109,10,97,108,108,111,119,101,100,32,111,110,101,32,40,37,100,41,0,0,0,0,0,42,69,114,114,111,114,42,58,32,0,0,0,0,0,0,0,112,111,108,121,45,62,103,114,111,117,112,32,40,112,111,108,121,45,62,110,100,105,109,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,112,111,108,121,45,62,100,101,103,114,101,101,32,40,112,111,108,121,45,62,110,103,114,111,117,112,32,101,108,101,109,101,110,116,115,41,32,33,0,0,42,69,114,114,111,114,42,58,32,112,111,108,121,110,111,109,105,97,108,32,71,82,79,85,80,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,0,0,0,84,104,101,32,100,101,103,114,101,101,32,111,102,32,116,104,101,32,112,111,108,121,110,111,109,32,40,37,100,41,32,101,120,99,101,101,100,115,32,116,104,101,32,109,97,120,105,109,117,109,10,97,108,108,111,119,101,100,32,111,110,101,32,40,37,100,41,0,0,0,0,0,112,111,108,121,45,62,98,97,115,105,115,32,40,112,111,108,121,45,62,110,99,111,101,102,102,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,112,111,108,121,45,62,99,111,101,102,102,32,40,112,111,108,121,45,62,110,99,111,101,102,102,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,42,73,110,116,101,114,110,97,108,32,69,114,114,111,114,42,58,32,79,110,101,32,111,102,32,120,32,111,114,32,101,120,116,98,97,115,105,115,32,115,104,111,117,108,100,32,98,101,32,100,105,102,102,101,114,101,110,116,32,102,114,111,109,32,78,85,76,76,10,105,110,32,0,0,0,0,0,0,0,0,112,111,108,121,95,102,117,110,99,40,41,0,0,0,0,0,97,108,112,104,97,32,40,109,97,116,115,105,122,101,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,98,101,116,97,32,40,110,99,111,101,102,102,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,0,0,118,109,97,116,32,40,110,42,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,119,109,97,116,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,112,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,0,0,42,69,114,114,111,114,42,58,32,78,111,116,32,101,110,111,117,103,104,32,114,111,119,115,32,102,111,114,32,115,111,108,118,105,110,103,32,116,104,101,32,115,121,115,116,101,109,32,0,0,0,0,0,0,0,0,105,110,32,115,118,100,102,105,116,40,41,0,0,0,0,0,114,118,49,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,116,109,112,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,42,69,114,114,111,114,42,58,32,78,111,32,99,111,110,118,101,114,103,101,110,99,101,32,105,110,32,49,48,48,32,83,86,68,32,105,116,101,114,97,116,105,111,110,115,32,0,0,67,85,66,69,70,65,67,69,0,0,0,0,0,0,0,0,37,46,51,115,0,0,0,0,82,65,45,45,0,0,0,0,82,65,0,0,0,0,0,0,68,69,67,45,45,37,115,0,68,69,67,45,0,0,0,0,82,65,45,45,45,37,115,0,76,79,78,0,0,0,0,0,37,99,76,79,78,0,0,0,37,99,76,65,84,0,0,0,37,115,45,37,115,0,0,0,76,65,84,0,0,0,0,0,76,78,0,0,0,0,0,0,37,99,37,99,76,78,0,0,37,99,37,99,76,84,0,0,76,84,0,0,0,0,0,0,71,76,83,0,0,0,0,0,78,67,80,0,0,0,0,0,26,0,0,0,0,0,0,0,65,90,80,0,83,90,80,0,84,65,78,0,83,84,71,0,83,73,78,0,65,82,67,0,90,80,78,0,90,69,65,0,65,73,82,0,67,89,80,0,67,69,65,0,67,65,82,0,77,69,82,0,67,79,80,0,67,79,69,0,67,79,68,0,67,79,79,0,83,70,76,0,80,65,82,0,77,79,76,0,65,73,84,0,66,79,78,0,80,67,79,0,84,83,67,0,67,83,67,0,81,83,67,0,65,90,80,0,0,0,0,0,83,90,80,0,0,0,0,0,84,65,78,0,0,0,0,0,83,84,71,0,0,0,0,0,83,73,78,0,0,0,0,0,65,82,67,0,0,0,0,0,90,80,78,0,0,0,0,0,90,69,65,0,0,0,0,0,65,73,82,0,0,0,0,0,67,89,80,0,0,0,0,0,67,69,65,0,0,0,0,0,67,65,82,0,0,0,0,0,77,69,82,0,0,0,0,0,83,70,76,0,0,0,0,0,80,65,82,0,0,0,0,0,77,79,76,0,0,0,0,0,65,73,84,0,0,0,0,0,67,79,80,0,0,0,0,0,67,79,69,0,0,0,0,0,67,79,68,0,0,0,0,0,67,79,79,0,0,0,0,0,66,79,78,0,0,0,0,0,80,67,79,0,0,0,0,0,84,83,67,0,0,0,0,0,67,83,67,0,0,0,0,0,81,83,67,0,0,0,0,0,65,95,79,82,68,69,82,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,65,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,0,65,95,37,100,95,37,100,0,66,95,79,82,68,69,82,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,66,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,0,66,95,37,100,95,37,100,0,65,80,95,79,82,68,69,82,0,0,0,0,0,0,0,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,65,80,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,65,80,95,37,100,95,37,100,0,0,0,0,0,0,0,0,66,80,95,79,82,68,69,82,0,0,0,0,0,0,0,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,66,80,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,66,80,95,37,100,95,37,100,0,0,0,0,0,0,0,0,45,83,73,80,0,0,0,0,0,0,0,0,0,0,0,0,91,99,100,108,95,122,115,99,97,108,101,93,32,37,100,120,37,100,45,37,100,32,32,99,111,110,116,61,37,103,32,111,112,116,115,122,61,37,100,32,108,101,110,61,37,100,10,0,91,99,100,108,95,122,115,99,97,108,101,93,32,122,109,105,110,61,37,103,32,122,109,97,120,61,37,103,32,108,101,102,116,61,37,103,32,109,101,100,105,97,110,61,37,103,10,0,91,99,100,108,95,122,115,99,97,108,101,93,32,109,105,110,112,105,120,61,37,100,32,110,103,114,111,119,61,37,100,32,110,103,111,111,100,112,105,120,61,37,100,10,0,0,0,0,91,99,100,108,95,122,115,99,97,108,101,93,32,122,115,108,111,112,101,61,37,103,32,99,101,110,116,101,114,95,112,105,120,61,37,100,32,122,49,61,37,103,32,122,50,61,37,103,10,0,0,0,0,0,0,0,91,115,97,109,112,108,101,73,109,97,103,101,93,32,111,112,116,95,110,112,105,120,47,108,105,110,101,61,37,100,32,99,111,108,95,115,116,101,112,61,37,100,32,110,47,108,105,110,101,61,37,100,10,0,0,0,91,115,97,109,112,108,101,73,109,97,103,101,93,32,110,108,95,105,110,95,115,97,109,112,61,37,100,47,37,100,32,111,112,116,95,110,108,47,115,97,109,112,61,37,100,32,108,115,116,101,112,61,37,100,10,0,0,0,0,0,150,48,7,119,44,97,14,238,186,81,9,153,25,196,109,7,143,244,106,112,53,165,99,233,163,149,100,158,50,136,219,14,164,184,220,121,30,233,213,224,136,217,210,151,43,76,182,9,189,124,177,126,7,45,184,231,145,29,191,144,100,16,183,29,242,32,176,106,72,113,185,243,222,65,190,132,125,212,218,26,235,228,221,109,81,181,212,244,199,133,211,131,86,152,108,19,192,168,107,100,122,249,98,253,236,201,101,138,79,92,1,20,217,108,6,99,99,61,15,250,245,13,8,141,200,32,110,59,94,16,105,76,228,65,96,213,114,113,103,162,209,228,3,60,71,212,4,75,253,133,13,210,107,181,10,165,250,168,181,53,108,152,178,66,214,201,187,219,64,249,188,172,227,108,216,50,117,92,223,69,207,13,214,220,89,61,209,171,172,48,217,38,58,0,222,81,128,81,215,200,22,97,208,191,181,244,180,33,35,196,179,86,153,149,186,207,15,165,189,184,158,184,2,40,8,136,5,95,178,217,12,198,36,233,11,177,135,124,111,47,17,76,104,88,171,29,97,193,61,45,102,182,144,65,220,118,6,113,219,1,188,32,210,152,42,16,213,239,137,133,177,113,31,181,182,6,165,228,191,159,51,212,184,232,162,201,7,120,52,249,0,15,142,168,9,150,24,152,14,225,187,13,106,127,45,61,109,8,151,108,100,145,1,92,99,230,244,81,107,107,98,97,108,28,216,48,101,133,78,0,98,242,237,149,6,108,123,165,1,27,193,244,8,130,87,196,15,245,198,217,176,101,80,233,183,18,234,184,190,139,124,136,185,252,223,29,221,98,73,45,218,21,243,124,211,140,101,76,212,251,88,97,178,77,206,81,181,58,116,0,188,163,226,48,187,212,65,165,223,74,215,149,216,61,109,196,209,164,251,244,214,211,106,233,105,67,252,217,110,52,70,136,103,173,208,184,96,218,115,45,4,68,229,29,3,51,95,76,10,170,201,124,13,221,60,113,5,80,170,65,2,39,16,16,11,190,134,32,12,201,37,181,104,87,179,133,111,32,9,212,102,185,159,228,97,206,14,249,222,94,152,201,217,41,34,152,208,176,180,168,215,199,23,61,179,89,129,13,180,46,59,92,189,183,173,108,186,192,32,131,184,237,182,179,191,154,12,226,182,3,154,210,177,116,57,71,213,234,175,119,210,157,21,38,219,4,131,22,220,115,18,11,99,227,132,59,100,148,62,106,109,13,168,90,106,122,11,207,14,228,157,255,9,147,39,174,0,10,177,158,7,125,68,147,15,240,210,163,8,135,104,242,1,30,254,194,6,105,93,87,98,247,203,103,101,128,113,54,108,25,231,6,107,110,118,27,212,254,224,43,211,137,90,122,218,16,204,74,221,103,111,223,185,249,249,239,190,142,67,190,183,23,213,142,176,96,232,163,214,214,126,147,209,161,196,194,216,56,82,242,223,79,241,103,187,209,103,87,188,166,221,6,181,63,75,54,178,72,218,43,13,216,76,27,10,175,246,74,3,54,96,122,4,65,195,239,96,223,85,223,103,168,239,142,110,49,121,190,105,70,140,179,97,203,26,131,102,188,160,210,111,37,54,226,104,82,149,119,12,204,3,71,11,187,185,22,2,34,47,38,5,85,190,59,186,197,40,11,189,178,146,90,180,43,4,106,179,92,167,255,215,194,49,207,208,181,139,158,217,44,29,174,222,91,176,194,100,155,38,242,99,236,156,163,106,117,10,147,109,2,169,6,9,156,63,54,14,235,133,103,7,114,19,87,0,5,130,74,191,149,20,122,184,226,174,43,177,123,56,27,182,12,155,142,210,146,13,190,213,229,183,239,220,124,33,223,219,11,212,210,211,134,66,226,212,241,248,179,221,104,110,131,218,31,205,22,190,129,91,38,185,246,225,119,176,111,119,71,183,24,230,90,8,136,112,106,15,255,202,59,6,102,92,11,1,17,255,158,101,143,105,174,98,248,211,255,107,97,69,207,108,22,120,226,10,160,238,210,13,215,84,131,4,78,194,179,3,57,97,38,103,167,247,22,96,208,77,71,105,73,219,119,110,62,74,106,209,174,220,90,214,217,102,11,223,64,240,59,216,55,83,174,188,169,197,158,187,222,127,207,178,71,233,255,181,48,28,242,189,189,138,194,186,202,48,147,179,83,166,163,180,36,5,54,208,186,147,6,215,205,41,87,222,84,191,103,217,35,46,122,102,179,184,74,97,196,2,27,104,93,148,43,111,42,55,190,11,180,161,142,12,195,27,223,5,90,141,239,2,45,0,0,0,0,65,49,27,25,130,98,54,50,195,83,45,43,4,197,108,100,69,244,119,125,134,167,90,86,199,150,65,79,8,138,217,200,73,187,194,209,138,232,239,250,203,217,244,227,12,79,181,172,77,126,174,181,142,45,131,158,207,28,152,135,81,18,194,74,16,35,217,83,211,112,244,120,146,65,239,97,85,215,174,46,20,230,181,55,215,181,152,28,150,132,131,5,89,152,27,130,24,169,0,155,219,250,45,176,154,203,54,169,93,93,119,230,28,108,108,255,223,63,65,212,158,14,90,205,162,36,132,149,227,21,159,140,32,70,178,167,97,119,169,190,166,225,232,241,231,208,243,232,36,131,222,195,101,178,197,218,170,174,93,93,235,159,70,68,40,204,107,111,105,253,112,118,174,107,49,57,239,90,42,32,44,9,7,11,109,56,28,18,243,54,70,223,178,7,93,198,113,84,112,237,48,101,107,244,247,243,42,187,182,194,49,162,117,145,28,137,52,160,7,144,251,188,159,23,186,141,132,14,121,222,169,37,56,239,178,60,255,121,243,115,190,72,232,106,125,27,197,65,60,42,222,88,5,79,121,240,68,126,98,233,135,45,79,194,198,28,84,219,1,138,21,148,64,187,14,141,131,232,35,166,194,217,56,191,13,197,160,56,76,244,187,33,143,167,150,10,206,150,141,19,9,0,204,92,72,49,215,69,139,98,250,110,202,83,225,119,84,93,187,186,21,108,160,163,214,63,141,136,151,14,150,145,80,152,215,222,17,169,204,199,210,250,225,236,147,203,250,245,92,215,98,114,29,230,121,107,222,181,84,64,159,132,79,89,88,18,14,22,25,35,21,15,218,112,56,36,155,65,35,61,167,107,253,101,230,90,230,124,37,9,203,87,100,56,208,78,163,174,145,1,226,159,138,24,33,204,167,51,96,253,188,42,175,225,36,173,238,208,63,180,45,131,18,159,108,178,9,134,171,36,72,201,234,21,83,208,41,70,126,251,104,119,101,226,246,121,63,47,183,72,36,54,116,27,9,29,53,42,18,4,242,188,83,75,179,141,72,82,112,222,101,121,49,239,126,96,254,243,230,231,191,194,253,254,124,145,208,213,61,160,203,204,250,54,138,131,187,7,145,154,120,84,188,177,57,101,167,168,75,152,131,59,10,169,152,34,201,250,181,9,136,203,174,16,79,93,239,95,14,108,244,70,205,63,217,109,140,14,194,116,67,18,90,243,2,35,65,234,193,112,108,193,128,65,119,216,71,215,54,151,6,230,45,142,197,181,0,165,132,132,27,188,26,138,65,113,91,187,90,104,152,232,119,67,217,217,108,90,30,79,45,21,95,126,54,12,156,45,27,39,221,28,0,62,18,0,152,185,83,49,131,160,144,98,174,139,209,83,181,146,22,197,244,221,87,244,239,196,148,167,194,239,213,150,217,246,233,188,7,174,168,141,28,183,107,222,49,156,42,239,42,133,237,121,107,202,172,72,112,211,111,27,93,248,46,42,70,225,225,54,222,102,160,7,197,127,99,84,232,84,34,101,243,77,229,243,178,2,164,194,169,27,103,145,132,48,38,160,159,41,184,174,197,228,249,159,222,253,58,204,243,214,123,253,232,207,188,107,169,128,253,90,178,153,62,9,159,178,127,56,132,171,176,36,28,44,241,21,7,53,50,70,42,30,115,119,49,7,180,225,112,72,245,208,107,81,54,131,70,122,119,178,93,99,78,215,250,203,15,230,225,210,204,181,204,249,141,132,215,224,74,18,150,175,11,35,141,182,200,112,160,157,137,65,187,132,70,93,35,3,7,108,56,26,196,63,21,49,133,14,14,40,66,152,79,103,3,169,84,126,192,250,121,85,129,203,98,76,31,197,56,129,94,244,35,152,157,167,14,179,220,150,21,170,27,0,84,229,90,49,79,252,153,98,98,215,216,83,121,206,23,79,225,73,86,126,250,80,149,45,215,123,212,28,204,98,19,138,141,45,82,187,150,52,145,232,187,31,208,217,160,6,236,243,126,94,173,194,101,71,110,145,72,108,47,160,83,117,232,54,18,58,169,7,9,35,106,84,36,8,43,101,63,17,228,121,167,150,165,72,188,143,102,27,145,164,39,42,138,189,224,188,203,242,161,141,208,235,98,222,253,192,35,239,230,217,189,225,188,20,252,208,167,13,63,131,138,38,126,178,145,63,185,36,208,112,248,21,203,105,59,70,230,66,122,119,253,91,181,107,101,220,244,90,126,197,55,9,83,238,118,56,72,247,177,174,9,184,240,159,18,161,51,204,63,138,114,253,36,147,0,0,0,0,55,106,194,1,110,212,132,3,89,190,70,2,220,168,9,7,235,194,203,6,178,124,141,4,133,22,79,5,184,81,19,14,143,59,209,15,214,133,151,13,225,239,85,12,100,249,26,9,83,147,216,8,10,45,158,10,61,71,92,11,112,163,38,28,71,201,228,29,30,119,162,31,41,29,96,30,172,11,47,27,155,97,237,26,194,223,171,24,245,181,105,25,200,242,53,18,255,152,247,19,166,38,177,17,145,76,115,16,20,90,60,21,35,48,254,20,122,142,184,22,77,228,122,23,224,70,77,56,215,44,143,57,142,146,201,59,185,248,11,58,60,238,68,63,11,132,134,62,82,58,192,60,101,80,2,61,88,23,94,54,111,125,156,55,54,195,218,53,1,169,24,52,132,191,87,49,179,213,149,48,234,107,211,50,221,1,17,51,144,229,107,36,167,143,169,37,254,49,239,39,201,91,45,38,76,77,98,35,123,39,160,34,34,153,230,32,21,243,36,33,40,180,120,42,31,222,186,43,70,96,252,41,113,10,62,40,244,28,113,45,195,118,179,44,154,200,245,46,173,162,55,47,192,141,154,112,247,231,88,113,174,89,30,115,153,51,220,114,28,37,147,119,43,79,81,118,114,241,23,116,69,155,213,117,120,220,137,126,79,182,75,127,22,8,13,125,33,98,207,124,164,116,128,121,147,30,66,120,202,160,4,122,253,202,198,123,176,46,188,108,135,68,126,109,222,250,56,111,233,144,250,110,108,134,181,107,91,236,119,106,2,82,49,104,53,56,243,105,8,127,175,98,63,21,109,99,102,171,43,97,81,193,233,96,212,215,166,101,227,189,100,100,186,3,34,102,141,105,224,103,32,203,215,72,23,161,21,73,78,31,83,75,121,117,145,74,252,99,222,79,203,9,28,78,146,183,90,76,165,221,152,77,152,154,196,70,175,240,6,71,246,78,64,69,193,36,130,68,68,50,205,65,115,88,15,64,42,230,73,66,29,140,139,67,80,104,241,84,103,2,51,85,62,188,117,87,9,214,183,86,140,192,248,83,187,170,58,82,226,20,124,80,213,126,190,81,232,57,226,90,223,83,32,91,134,237,102,89,177,135,164,88,52,145,235,93,3,251,41,92,90,69,111,94,109,47,173,95,128,27,53,225,183,113,247,224,238,207,177,226,217,165,115,227,92,179,60,230,107,217,254,231,50,103,184,229,5,13,122,228,56,74,38,239,15,32,228,238,86,158,162,236,97,244,96,237,228,226,47,232,211,136,237,233,138,54,171,235,189,92,105,234,240,184,19,253,199,210,209,252,158,108,151,254,169,6,85,255,44,16,26,250,27,122,216,251,66,196,158,249,117,174,92,248,72,233,0,243,127,131,194,242,38,61,132,240,17,87,70,241,148,65,9,244,163,43,203,245,250,149,141,247,205,255,79,246,96,93,120,217,87,55,186,216,14,137,252,218,57,227,62,219,188,245,113,222,139,159,179,223,210,33,245,221,229,75,55,220,216,12,107,215,239,102,169,214,182,216,239,212,129,178,45,213,4,164,98,208,51,206,160,209,106,112,230,211,93,26,36,210,16,254,94,197,39,148,156,196,126,42,218,198,73,64,24,199,204,86,87,194,251,60,149,195,162,130,211,193,149,232,17,192,168,175,77,203,159,197,143,202,198,123,201,200,241,17,11,201,116,7,68,204,67,109,134,205,26,211,192,207,45,185,2,206,64,150,175,145,119,252,109,144,46,66,43,146,25,40,233,147,156,62,166,150,171,84,100,151,242,234,34,149,197,128,224,148,248,199,188,159,207,173,126,158,150,19,56,156,161,121,250,157,36,111,181,152,19,5,119,153,74,187,49,155,125,209,243,154,48,53,137,141,7,95,75,140,94,225,13,142,105,139,207,143,236,157,128,138,219,247,66,139,130,73,4,137,181,35,198,136,136,100,154,131,191,14,88,130,230,176,30,128,209,218,220,129,84,204,147,132,99,166,81,133,58,24,23,135,13,114,213,134,160,208,226,169,151,186,32,168,206,4,102,170,249,110,164,171,124,120,235,174,75,18,41,175,18,172,111,173,37,198,173,172,24,129,241,167,47,235,51,166,118,85,117,164,65,63,183,165,196,41,248,160,243,67,58,161,170,253,124,163,157,151,190,162,208,115,196,181,231,25,6,180,190,167,64,182,137,205,130,183,12,219,205,178,59,177,15,179,98,15,73,177,85,101,139,176,104,34,215,187,95,72,21,186,6,246,83,184,49,156,145,185,180,138,222,188,131,224,28,189,218,94,90,191,237,52,152,190,0,0,0,0,101,103,188,184,139,200,9,170,238,175,181,18,87,151,98,143,50,240,222,55,220,95,107,37,185,56,215,157,239,40,180,197,138,79,8,125,100,224,189,111,1,135,1,215,184,191,214,74,221,216,106,242,51,119,223,224,86,16,99,88,159,87,25,80,250,48,165,232,20,159,16,250,113,248,172,66,200,192,123,223,173,167,199,103,67,8,114,117,38,111,206,205,112,127,173,149,21,24,17,45,251,183,164,63,158,208,24,135,39,232,207,26,66,143,115,162,172,32,198,176,201,71,122,8,62,175,50,160,91,200,142,24,181,103,59,10,208,0,135,178,105,56,80,47,12,95,236,151,226,240,89,133,135,151,229,61,209,135,134,101,180,224,58,221,90,79,143,207,63,40,51,119,134,16,228,234,227,119,88,82,13,216,237,64,104,191,81,248,161,248,43,240,196,159,151,72,42,48,34,90,79,87,158,226,246,111,73,127,147,8,245,199,125,167,64,213,24,192,252,109,78,208,159,53,43,183,35,141,197,24,150,159,160,127,42,39,25,71,253,186,124,32,65,2,146,143,244,16,247,232,72,168,61,88,20,155,88,63,168,35,182,144,29,49,211,247,161,137,106,207,118,20,15,168,202,172,225,7,127,190,132,96,195,6,210,112,160,94,183,23,28,230,89,184,169,244,60,223,21,76,133,231,194,209,224,128,126,105,14,47,203,123,107,72,119,195,162,15,13,203,199,104,177,115,41,199,4,97,76,160,184,217,245,152,111,68,144,255,211,252,126,80,102,238,27,55,218,86,77,39,185,14,40,64,5,182,198,239,176,164,163,136,12,28,26,176,219,129,127,215,103,57,145,120,210,43,244,31,110,147,3,247,38,59,102,144,154,131,136,63,47,145,237,88,147,41,84,96,68,180,49,7,248,12,223,168,77,30,186,207,241,166,236,223,146,254,137,184,46,70,103,23,155,84,2,112,39,236,187,72,240,113,222,47,76,201,48,128,249,219,85,231,69,99,156,160,63,107,249,199,131,211,23,104,54,193,114,15,138,121,203,55,93,228,174,80,225,92,64,255,84,78,37,152,232,246,115,136,139,174,22,239,55,22,248,64,130,4,157,39,62,188,36,31,233,33,65,120,85,153,175,215,224,139,202,176,92,51,59,182,89,237,94,209,229,85,176,126,80,71,213,25,236,255,108,33,59,98,9,70,135,218,231,233,50,200,130,142,142,112,212,158,237,40,177,249,81,144,95,86,228,130,58,49,88,58,131,9,143,167,230,110,51,31,8,193,134,13,109,166,58,181,164,225,64,189,193,134,252,5,47,41,73,23,74,78,245,175,243,118,34,50,150,17,158,138,120,190,43,152,29,217,151,32,75,201,244,120,46,174,72,192,192,1,253,210,165,102,65,106,28,94,150,247,121,57,42,79,151,150,159,93,242,241,35,229,5,25,107,77,96,126,215,245,142,209,98,231,235,182,222,95,82,142,9,194,55,233,181,122,217,70,0,104,188,33,188,208,234,49,223,136,143,86,99,48,97,249,214,34,4,158,106,154,189,166,189,7,216,193,1,191,54,110,180,173,83,9,8,21,154,78,114,29,255,41,206,165,17,134,123,183,116,225,199,15,205,217,16,146,168,190,172,42,70,17,25,56,35,118,165,128,117,102,198,216,16,1,122,96,254,174,207,114,155,201,115,202,34,241,164,87,71,150,24,239,169,57,173,253,204,94,17,69,6,238,77,118,99,137,241,206,141,38,68,220,232,65,248,100,81,121,47,249,52,30,147,65,218,177,38,83,191,214,154,235,233,198,249,179,140,161,69,11,98,14,240,25,7,105,76,161,190,81,155,60,219,54,39,132,53,153,146,150,80,254,46,46,153,185,84,38,252,222,232,158,18,113,93,140,119,22,225,52,206,46,54,169,171,73,138,17,69,230,63,3,32,129,131,187,118,145,224,227,19,246,92,91,253,89,233,73,152,62,85,241,33,6,130,108,68,97,62,212,170,206,139,198,207,169,55,126,56,65,127,214,93,38,195,110,179,137,118,124,214,238,202,196,111,214,29,89,10,177,161,225,228,30,20,243,129,121,168,75,215,105,203,19,178,14,119,171,92,161,194,185,57,198,126,1,128,254,169,156,229,153,21,36,11,54,160,54,110,81,28,142,167,22,102,134,194,113,218,62,44,222,111,44,73,185,211,148,240,129,4,9,149,230,184,177,123,73,13,163,30,46,177,27,72,62,210,67,45,89,110,251,195,246,219,233,166,145,103,81,31,169,176,204,122,206,12,116,148,97,185,102,241,6,5,222,0,0,0,0,119,7,48,150,238,14,97,44,153,9,81,186,7,109,196,25,112,106,244,143,233,99,165,53,158,100,149,163,14,219,136,50,121,220,184,164,224,213,233,30,151,210,217,136,9,182,76,43,126,177,124,189,231,184,45,7,144,191,29,145,29,183,16,100,106,176,32,242,243,185,113,72,132,190,65,222,26,218,212,125,109,221,228,235,244,212,181,81,131,211,133,199,19,108,152,86,100,107,168,192,253,98,249,122,138,101,201,236,20,1,92,79,99,6,108,217,250,15,61,99,141,8,13,245,59,110,32,200,76,105,16,94,213,96,65,228,162,103,113,114,60,3,228,209,75,4,212,71,210,13,133,253,165,10,181,107,53,181,168,250,66,178,152,108,219,187,201,214,172,188,249,64,50,216,108,227,69,223,92,117,220,214,13,207,171,209,61,89,38,217,48,172,81,222,0,58,200,215,81,128,191,208,97,22,33,180,244,181,86,179,196,35,207,186,149,153,184,189,165,15,40,2,184,158,95,5,136,8,198,12,217,178,177,11,233,36,47,111,124,135,88,104,76,17,193,97,29,171,182,102,45,61,118,220,65,144,1,219,113,6,152,210,32,188,239,213,16,42,113,177,133,137,6,182,181,31,159,191,228,165,232,184,212,51,120,7,201,162,15,0,249,52,150,9,168,142,225,14,152,24,127,106,13,187,8,109,61,45,145,100,108,151,230,99,92,1,107,107,81,244,28,108,97,98,133,101,48,216,242,98,0,78,108,6,149,237,27,1,165,123,130,8,244,193,245,15,196,87,101,176,217,198,18,183,233,80,139,190,184,234,252,185,136,124,98,221,29,223,21,218,45,73,140,211,124,243,251,212,76,101,77,178,97,88,58,181,81,206,163,188,0,116,212,187,48,226,74,223,165,65,61,216,149,215,164,209,196,109,211,214,244,251,67,105,233,106,52,110,217,252,173,103,136,70,218,96,184,208,68,4,45,115,51,3,29,229,170,10,76,95,221,13,124,201,80,5,113,60,39,2,65,170,190,11,16,16,201,12,32,134,87,104,181,37,32,111,133,179,185,102,212,9,206,97,228,159,94,222,249,14,41,217,201,152,176,208,152,34,199,215,168,180,89,179,61,23,46,180,13,129,183,189,92,59,192,186,108,173,237,184,131,32,154,191,179,182,3,182,226,12,116,177,210,154,234,213,71,57,157,210,119,175,4,219,38,21,115,220,22,131,227,99,11,18,148,100,59,132,13,109,106,62,122,106,90,168,228,14,207,11,147,9,255,157,10,0,174,39,125,7,158,177,240,15,147,68,135,8,163,210,30,1,242,104,105,6,194,254,247,98,87,93,128,101,103,203,25,108,54,113,110,107,6,231,254,212,27,118,137,211,43,224,16,218,122,90,103,221,74,204,249,185,223,111,142,190,239,249,23,183,190,67,96,176,142,213,214,214,163,232,161,209,147,126,56,216,194,196,79,223,242,82,209,187,103,241,166,188,87,103,63,181,6,221,72,178,54,75,216,13,43,218,175,10,27,76,54,3,74,246,65,4,122,96,223,96,239,195,168,103,223,85,49,110,142,239,70,105,190,121,203,97,179,140,188,102,131,26,37,111,210,160,82,104,226,54,204,12,119,149,187,11,71,3,34,2,22,185,85,5,38,47,197,186,59,190,178,189,11,40,43,180,90,146,92,179,106,4,194,215,255,167,181,208,207,49,44,217,158,139,91,222,174,29,155,100,194,176,236,99,242,38,117,106,163,156,2,109,147,10,156,9,6,169,235,14,54,63,114,7,103,133,5,0,87,19,149,191,74,130,226,184,122,20,123,177,43,174,12,182,27,56,146,210,142,155,229,213,190,13,124,220,239,183,11,219,223,33,134,211,210,212,241,212,226,66,104,221,179,248,31,218,131,110,129,190,22,205,246,185,38,91,111,176,119,225,24,183,71,119,136,8,90,230,255,15,106,112,102,6,59,202,17,1,11,92,143,101,158,255,248,98,174,105,97,107,255,211,22,108,207,69,160,10,226,120,215,13,210,238,78,4,131,84,57,3,179,194,167,103,38,97,208,96,22,247,73,105,71,77,62,110,119,219,174,209,106,74,217,214,90,220,64,223,11,102,55,216,59,240,169,188,174,83,222,187,158,197,71,178,207,127,48,181,255,233,189,189,242,28,202,186,194,138,83,179,147,48,36,180,163,166,186,208,54,5,205,215,6,147,84,222,87,41,35,217,103,191,179,102,122,46,196,97,74,184,93,104,27,2,42,111,43,148,180,11,190,55,195,12,142,161,90,5,223,27,45,2,239,141,0,0,0,0,25,27,49,65,50,54,98,130,43,45,83,195,100,108,197,4,125,119,244,69,86,90,167,134,79,65,150,199,200,217,138,8,209,194,187,73,250,239,232,138,227,244,217,203,172,181,79,12,181,174,126,77,158,131,45,142,135,152,28,207,74,194,18,81,83,217,35,16,120,244,112,211,97,239,65,146,46,174,215,85,55,181,230,20,28,152,181,215,5,131,132,150,130,27,152,89,155,0,169,24,176,45,250,219,169,54,203,154,230,119,93,93,255,108,108,28,212,65,63,223,205,90,14,158,149,132,36,162,140,159,21,227,167,178,70,32,190,169,119,97,241,232,225,166,232,243,208,231,195,222,131,36,218,197,178,101,93,93,174,170,68,70,159,235,111,107,204,40,118,112,253,105,57,49,107,174,32,42,90,239,11,7,9,44,18,28,56,109,223,70,54,243,198,93,7,178,237,112,84,113,244,107,101,48,187,42,243,247,162,49,194,182,137,28,145,117,144,7,160,52,23,159,188,251,14,132,141,186,37,169,222,121,60,178,239,56,115,243,121,255,106,232,72,190,65,197,27,125,88,222,42,60,240,121,79,5,233,98,126,68,194,79,45,135,219,84,28,198,148,21,138,1,141,14,187,64,166,35,232,131,191,56,217,194,56,160,197,13,33,187,244,76,10,150,167,143,19,141,150,206,92,204,0,9,69,215,49,72,110,250,98,139,119,225,83,202,186,187,93,84,163,160,108,21,136,141,63,214,145,150,14,151,222,215,152,80,199,204,169,17,236,225,250,210,245,250,203,147,114,98,215,92,107,121,230,29,64,84,181,222,89,79,132,159,22,14,18,88,15,21,35,25,36,56,112,218,61,35,65,155,101,253,107,167,124,230,90,230,87,203,9,37,78,208,56,100,1,145,174,163,24,138,159,226,51,167,204,33,42,188,253,96,173,36,225,175,180,63,208,238,159,18,131,45,134,9,178,108,201,72,36,171,208,83,21,234,251,126,70,41,226,101,119,104,47,63,121,246,54,36,72,183,29,9,27,116,4,18,42,53,75,83,188,242,82,72,141,179,121,101,222,112,96,126,239,49,231,230,243,254,254,253,194,191,213,208,145,124,204,203,160,61,131,138,54,250,154,145,7,187,177,188,84,120,168,167,101,57,59,131,152,75,34,152,169,10,9,181,250,201,16,174,203,136,95,239,93,79,70,244,108,14,109,217,63,205,116,194,14,140,243,90,18,67,234,65,35,2,193,108,112,193,216,119,65,128,151,54,215,71,142,45,230,6,165,0,181,197,188,27,132,132,113,65,138,26,104,90,187,91,67,119,232,152,90,108,217,217,21,45,79,30,12,54,126,95,39,27,45,156,62,0,28,221,185,152,0,18,160,131,49,83,139,174,98,144,146,181,83,209,221,244,197,22,196,239,244,87,239,194,167,148,246,217,150,213,174,7,188,233,183,28,141,168,156,49,222,107,133,42,239,42,202,107,121,237,211,112,72,172,248,93,27,111,225,70,42,46,102,222,54,225,127,197,7,160,84,232,84,99,77,243,101,34,2,178,243,229,27,169,194,164,48,132,145,103,41,159,160,38,228,197,174,184,253,222,159,249,214,243,204,58,207,232,253,123,128,169,107,188,153,178,90,253,178,159,9,62,171,132,56,127,44,28,36,176,53,7,21,241,30,42,70,50,7,49,119,115,72,112,225,180,81,107,208,245,122,70,131,54,99,93,178,119,203,250,215,78,210,225,230,15,249,204,181,204,224,215,132,141,175,150,18,74,182,141,35,11,157,160,112,200,132,187,65,137,3,35,93,70,26,56,108,7,49,21,63,196,40,14,14,133,103,79,152,66,126,84,169,3,85,121,250,192,76,98,203,129,129,56,197,31,152,35,244,94,179,14,167,157,170,21,150,220,229,84,0,27,252,79,49,90,215,98,98,153,206,121,83,216,73,225,79,23,80,250,126,86,123,215,45,149,98,204,28,212,45,141,138,19,52,150,187,82,31,187,232,145,6,160,217,208,94,126,243,236,71,101,194,173,108,72,145,110,117,83,160,47,58,18,54,232,35,9,7,169,8,36,84,106,17,63,101,43,150,167,121,228,143,188,72,165,164,145,27,102,189,138,42,39,242,203,188,224,235,208,141,161,192,253,222,98,217,230,239,35,20,188,225,189,13,167,208,252,38,138,131,63,63,145,178,126,112,208,36,185,105,203,21,248,66,230,70,59,91,253,119,122,220,101,107,181,197,126,90,244,238,83,9,55,247,72,56,118,184,9,174,177,161,18,159,240,138,63,204,51,147,36,253,114,0,0,0,0,1,194,106,55,3,132,212,110,2,70,190,89,7,9,168,220,6,203,194,235,4,141,124,178,5,79,22,133,14,19,81,184,15,209,59,143,13,151,133,214,12,85,239,225,9,26,249,100,8,216,147,83,10,158,45,10,11,92,71,61,28,38,163,112,29,228,201,71,31,162,119,30,30,96,29,41,27,47,11,172,26,237,97,155,24,171,223,194,25,105,181,245,18,53,242,200,19,247,152,255,17,177,38,166,16,115,76,145,21,60,90,20,20,254,48,35,22,184,142,122,23,122,228,77,56,77,70,224,57,143,44,215,59,201,146,142,58,11,248,185,63,68,238,60,62,134,132,11,60,192,58,82,61,2,80,101,54,94,23,88,55,156,125,111,53,218,195,54,52,24,169,1,49,87,191,132,48,149,213,179,50,211,107,234,51,17,1,221,36,107,229,144,37,169,143,167,39,239,49,254,38,45,91,201,35,98,77,76,34,160,39,123,32,230,153,34,33,36,243,21,42,120,180,40,43,186,222,31,41,252,96,70,40,62,10,113,45,113,28,244,44,179,118,195,46,245,200,154,47,55,162,173,112,154,141,192,113,88,231,247,115,30,89,174,114,220,51,153,119,147,37,28,118,81,79,43,116,23,241,114,117,213,155,69,126,137,220,120,127,75,182,79,125,13,8,22,124,207,98,33,121,128,116,164,120,66,30,147,122,4,160,202,123,198,202,253,108,188,46,176,109,126,68,135,111,56,250,222,110,250,144,233,107,181,134,108,106,119,236,91,104,49,82,2,105,243,56,53,98,175,127,8,99,109,21,63,97,43,171,102,96,233,193,81,101,166,215,212,100,100,189,227,102,34,3,186,103,224,105,141,72,215,203,32,73,21,161,23,75,83,31,78,74,145,117,121,79,222,99,252,78,28,9,203,76,90,183,146,77,152,221,165,70,196,154,152,71,6,240,175,69,64,78,246,68,130,36,193,65,205,50,68,64,15,88,115,66,73,230,42,67,139,140,29,84,241,104,80,85,51,2,103,87,117,188,62,86,183,214,9,83,248,192,140,82,58,170,187,80,124,20,226,81,190,126,213,90,226,57,232,91,32,83,223,89,102,237,134,88,164,135,177,93,235,145,52,92,41,251,3,94,111,69,90,95,173,47,109,225,53,27,128,224,247,113,183,226,177,207,238,227,115,165,217,230,60,179,92,231,254,217,107,229,184,103,50,228,122,13,5,239,38,74,56,238,228,32,15,236,162,158,86,237,96,244,97,232,47,226,228,233,237,136,211,235,171,54,138,234,105,92,189,253,19,184,240,252,209,210,199,254,151,108,158,255,85,6,169,250,26,16,44,251,216,122,27,249,158,196,66,248,92,174,117,243,0,233,72,242,194,131,127,240,132,61,38,241,70,87,17,244,9,65,148,245,203,43,163,247,141,149,250,246,79,255,205,217,120,93,96,216,186,55,87,218,252,137,14,219,62,227,57,222,113,245,188,223,179,159,139,221,245,33,210,220,55,75,229,215,107,12,216,214,169,102,239,212,239,216,182,213,45,178,129,208,98,164,4,209,160,206,51,211,230,112,106,210,36,26,93,197,94,254,16,196,156,148,39,198,218,42,126,199,24,64,73,194,87,86,204,195,149,60,251,193,211,130,162,192,17,232,149,203,77,175,168,202,143,197,159,200,201,123,198,201,11,17,241,204,68,7,116,205,134,109,67,207,192,211,26,206,2,185,45,145,175,150,64,144,109,252,119,146,43,66,46,147,233,40,25,150,166,62,156,151,100,84,171,149,34,234,242,148,224,128,197,159,188,199,248,158,126,173,207,156,56,19,150,157,250,121,161,152,181,111,36,153,119,5,19,155,49,187,74,154,243,209,125,141,137,53,48,140,75,95,7,142,13,225,94,143,207,139,105,138,128,157,236,139,66,247,219,137,4,73,130,136,198,35,181,131,154,100,136,130,88,14,191,128,30,176,230,129,220,218,209,132,147,204,84,133,81,166,99,135,23,24,58,134,213,114,13,169,226,208,160,168,32,186,151,170,102,4,206,171,164,110,249,174,235,120,124,175,41,18,75,173,111,172,18,172,173,198,37,167,241,129,24,166,51,235,47,164,117,85,118,165,183,63,65,160,248,41,196,161,58,67,243,163,124,253,170,162,190,151,157,181,196,115,208,180,6,25,231,182,64,167,190,183,130,205,137,178,205,219,12,179,15,177,59,177,73,15,98,176,139,101,85,187,215,34,104,186,21,72,95,184,83,246,6,185,145,156,49,188,222,138,180,189,28,224,131,191,90,94,218,190,152,52,237,0,0,0,0,184,188,103,101,170,9,200,139,18,181,175,238,143,98,151,87,55,222,240,50,37,107,95,220,157,215,56,185,197,180,40,239,125,8,79,138,111,189,224,100,215,1,135,1,74,214,191,184,242,106,216,221,224,223,119,51,88,99,16,86,80,25,87,159,232,165,48,250,250,16,159,20,66,172,248,113,223,123,192,200,103,199,167,173,117,114,8,67,205,206,111,38,149,173,127,112,45,17,24,21,63,164,183,251,135,24,208,158,26,207,232,39,162,115,143,66,176,198,32,172,8,122,71,201,160,50,175,62,24,142,200,91,10,59,103,181,178,135,0,208,47,80,56,105,151,236,95,12,133,89,240,226,61,229,151,135,101,134,135,209,221,58,224,180,207,143,79,90,119,51,40,63,234,228,16,134,82,88,119,227,64,237,216,13,248,81,191,104,240,43,248,161,72,151,159,196,90,34,48,42,226,158,87,79,127,73,111,246,199,245,8,147,213,64,167,125,109,252,192,24,53,159,208,78,141,35,183,43,159,150,24,197,39,42,127,160,186,253,71,25,2,65,32,124,16,244,143,146,168,72,232,247,155,20,88,61,35,168,63,88,49,29,144,182,137,161,247,211,20,118,207,106,172,202,168,15,190,127,7,225,6,195,96,132,94,160,112,210,230,28,23,183,244,169,184,89,76,21,223,60,209,194,231,133,105,126,128,224,123,203,47,14,195,119,72,107,203,13,15,162,115,177,104,199,97,4,199,41,217,184,160,76,68,111,152,245,252,211,255,144,238,102,80,126,86,218,55,27,14,185,39,77,182,5,64,40,164,176,239,198,28,12,136,163,129,219,176,26,57,103,215,127,43,210,120,145,147,110,31,244,59,38,247,3,131,154,144,102,145,47,63,136,41,147,88,237,180,68,96,84,12,248,7,49,30,77,168,223,166,241,207,186,254,146,223,236,70,46,184,137,84,155,23,103,236,39,112,2,113,240,72,187,201,76,47,222,219,249,128,48,99,69,231,85], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10336);
/* memory initializer */ allocate([107,63,160,156,211,131,199,249,193,54,104,23,121,138,15,114,228,93,55,203,92,225,80,174,78,84,255,64,246,232,152,37,174,139,136,115,22,55,239,22,4,130,64,248,188,62,39,157,33,233,31,36,153,85,120,65,139,224,215,175,51,92,176,202,237,89,182,59,85,229,209,94,71,80,126,176,255,236,25,213,98,59,33,108,218,135,70,9,200,50,233,231,112,142,142,130,40,237,158,212,144,81,249,177,130,228,86,95,58,88,49,58,167,143,9,131,31,51,110,230,13,134,193,8,181,58,166,109,189,64,225,164,5,252,134,193,23,73,41,47,175,245,78,74,50,34,118,243,138,158,17,150,152,43,190,120,32,151,217,29,120,244,201,75,192,72,174,46,210,253,1,192,106,65,102,165,247,150,94,28,79,42,57,121,93,159,150,151,229,35,241,242,77,107,25,5,245,215,126,96,231,98,209,142,95,222,182,235,194,9,142,82,122,181,233,55,104,0,70,217,208,188,33,188,136,223,49,234,48,99,86,143,34,214,249,97,154,106,158,4,7,189,166,189,191,1,193,216,173,180,110,54,21,8,9,83,29,114,78,154,165,206,41,255,183,123,134,17,15,199,225,116,146,16,217,205,42,172,190,168,56,25,17,70,128,165,118,35,216,198,102,117,96,122,1,16,114,207,174,254,202,115,201,155,87,164,241,34,239,24,150,71,253,173,57,169,69,17,94,204,118,77,238,6,206,241,137,99,220,68,38,141,100,248,65,232,249,47,121,81,65,147,30,52,83,38,177,218,235,154,214,191,179,249,198,233,11,69,161,140,25,240,14,98,161,76,105,7,60,155,81,190,132,39,54,219,150,146,153,53,46,46,254,80,38,84,185,153,158,232,222,252,140,93,113,18,52,225,22,119,169,54,46,206,17,138,73,171,3,63,230,69,187,131,129,32,227,224,145,118,91,92,246,19,73,233,89,253,241,85,62,152,108,130,6,33,212,62,97,68,198,139,206,170,126,55,169,207,214,127,65,56,110,195,38,93,124,118,137,179,196,202,238,214,89,29,214,111,225,161,177,10,243,20,30,228,75,168,121,129,19,203,105,215,171,119,14,178,185,194,161,92,1,126,198,57,156,169,254,128,36,21,153,229,54,160,54,11,142,28,81,110,134,102,22,167,62,218,113,194,44,111,222,44,148,211,185,73,9,4,129,240,177,184,230,149,163,13,73,123,27,177,46,30,67,210,62,72,251,110,89,45,233,219,246,195,81,103,145,166,204,176,169,31,116,12,206,122,102,185,97,148,222,5,6,241,0,0,0,0,0,0,0,0,1,0,0,0,4,0,4,0,8,0,4,0,2,0,0,0,4,0,5,0,16,0,8,0,2,0,0,0,4,0,6,0,32,0,32,0,2,0,0,0,4,0,4,0,16,0,16,0,3,0,0,0,8,0,16,0,32,0,32,0,3,0,0,0,8,0,16,0,128,0,128,0,3,0,0,0,8,0,32,0,128,0,0,1,3,0,0,0,32,0,128,0,2,1,0,4,3,0,0,0,32,0,2,1,2,1,0,16,3,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,58,32,0,0,0,0,0,0,114,101,113,117,101,115,116,101,100,32,108,101,110,103,116,104,32,100,111,101,115,32,110,111,116,32,102,105,116,32,105,110,32,105,110,116,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,49,46,50,46,53,0,0,0,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,109,101,116,104,111,100,0,0,0,0,0,0,117,110,107,110,111,119,110,32,104,101,97,100,101,114,32,102,108,97,103,115,32,115,101,116,0,0,0,0,0,0,0,0,117,110,101,120,112,101,99,116,101,100,32,101,110,100,32,111,102,32,102,105,108,101,0,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,105,110,102,108,97,116,101,32,115,116,114,101,97,109,32,99,111,114,114,117,112,116,0,0,99,111,109,112,114,101,115,115,101,100,32,100,97,116,97,32,101,114,114,111,114,0,0,0,105,110,99,111,114,114,101,99,116,32,100,97,116,97,32,99,104,101,99,107,0,0,0,0,105,110,99,111,114,114,101,99,116,32,108,101,110,103,116,104,32,99,104,101,99,107,0,0,114,101,113,117,101,115,116,101,100,32,108,101,110,103,116,104,32,100,111,101,115,32,110,111,116,32,102,105,116,32,105,110,32,105,110,116,0,0,0,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,100,101,102,108,97,116,101,32,115,116,114,101,97,109,32,99,111,114,114,117,112,116,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,49,46,50,46,53,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,116,111,111,32,102,97,114,32,98,97,99,107,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,99,111,100,101,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,32,99,111,100,101,0,0,0,0,0,16,0,17,0,18,0,0,0,8,0,7,0,9,0,6,0,10,0,5,0,11,0,4,0,12,0,3,0,13,0,2,0,14,0,1,0,15,0,0,0,105,110,99,111,114,114,101,99,116,32,104,101,97,100,101,114,32,99,104,101,99,107,0,0,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,109,101,116,104,111,100,0,0,0,0,0,0,105,110,118,97,108,105,100,32,119,105,110,100,111,119,32,115,105,122,101,0,0,0,0,0,117,110,107,110,111,119,110,32,104,101,97,100,101,114,32,102,108,97,103,115,32,115,101,116,0,0,0,0,0,0,0,0,104,101,97,100,101,114,32,99,114,99,32,109,105,115,109,97,116,99,104,0,0,0,0,0,105,110,118,97,108,105,100,32,98,108,111,99,107,32,116,121,112,101,0,0,0,0,0,0,105,110,118,97,108,105,100,32,115,116,111,114,101,100,32,98,108,111,99,107,32,108,101,110,103,116,104,115,0,0,0,0,116,111,111,32,109,97,110,121,32,108,101,110,103,116,104,32,111,114,32,100,105,115,116,97,110,99,101,32,115,121,109,98,111,108,115,0,0,0,0,0,105,110,118,97,108,105,100,32,99,111,100,101,32,108,101,110,103,116,104,115,32,115,101,116,0,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,98,105,116,32,108,101,110,103,116,104,32,114,101,112,101,97,116,0,0,0,0,0,0,0,105,110,118,97,108,105,100,32,99,111,100,101,32,45,45,32,109,105,115,115,105,110,103,32,101,110,100,45,111,102,45,98,108,111,99,107,0,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,115,32,115,101,116,0,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,115,32,115,101,116,0,0,0,105,110,118,97,108,105,100,32,108,105,116,101,114,97,108,47,108,101,110,103,116,104,32,99,111,100,101,0,0,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,99,111,100,101,0,0,0,105,110,118,97,108,105,100,32,100,105,115,116,97,110,99,101,32,116,111,111,32,102,97,114,32,98,97,99,107,0,0,0,105,110,99,111,114,114,101,99,116,32,100,97,116,97,32,99,104,101,99,107,0,0,0,0,105,110,99,111,114,114,101,99,116,32,108,101,110,103,116,104,32,99,104,101,99,107,0,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,192,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,160,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,224,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,144,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,208,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,176,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,240,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,200,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,168,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,232,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,152,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,216,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,184,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,248,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,196,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,164,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,228,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,148,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,212,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,180,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,244,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,204,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,172,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,236,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,156,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,220,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,188,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,252,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,194,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,162,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,226,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,146,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,210,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,178,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,242,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,202,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,170,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,234,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,154,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,218,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,186,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,250,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,198,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,166,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,230,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,150,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,214,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,182,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,246,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,206,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,174,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,238,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,158,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,222,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,190,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,254,0,96,7,0,0,0,8,80,0,0,8,16,0,20,8,115,0,18,7,31,0,0,8,112,0,0,8,48,0,0,9,193,0,16,7,10,0,0,8,96,0,0,8,32,0,0,9,161,0,0,8,0,0,0,8,128,0,0,8,64,0,0,9,225,0,16,7,6,0,0,8,88,0,0,8,24,0,0,9,145,0,19,7,59,0,0,8,120,0,0,8,56,0,0,9,209,0,17,7,17,0,0,8,104,0,0,8,40,0,0,9,177,0,0,8,8,0,0,8,136,0,0,8,72,0,0,9,241,0,16,7,4,0,0,8,84,0,0,8,20,0,21,8,227,0,19,7,43,0,0,8,116,0,0,8,52,0,0,9,201,0,17,7,13,0,0,8,100,0,0,8,36,0,0,9,169,0,0,8,4,0,0,8,132,0,0,8,68,0,0,9,233,0,16,7,8,0,0,8,92,0,0,8,28,0,0,9,153,0,20,7,83,0,0,8,124,0,0,8,60,0,0,9,217,0,18,7,23,0,0,8,108,0,0,8,44,0,0,9,185,0,0,8,12,0,0,8,140,0,0,8,76,0,0,9,249,0,16,7,3,0,0,8,82,0,0,8,18,0,21,8,163,0,19,7,35,0,0,8,114,0,0,8,50,0,0,9,197,0,17,7,11,0,0,8,98,0,0,8,34,0,0,9,165,0,0,8,2,0,0,8,130,0,0,8,66,0,0,9,229,0,16,7,7,0,0,8,90,0,0,8,26,0,0,9,149,0,20,7,67,0,0,8,122,0,0,8,58,0,0,9,213,0,18,7,19,0,0,8,106,0,0,8,42,0,0,9,181,0,0,8,10,0,0,8,138,0,0,8,74,0,0,9,245,0,16,7,5,0,0,8,86,0,0,8,22,0,64,8,0,0,19,7,51,0,0,8,118,0,0,8,54,0,0,9,205,0,17,7,15,0,0,8,102,0,0,8,38,0,0,9,173,0,0,8,6,0,0,8,134,0,0,8,70,0,0,9,237,0,16,7,9,0,0,8,94,0,0,8,30,0,0,9,157,0,20,7,99,0,0,8,126,0,0,8,62,0,0,9,221,0,18,7,27,0,0,8,110,0,0,8,46,0,0,9,189,0,0,8,14,0,0,8,142,0,0,8,78,0,0,9,253,0,96,7,0,0,0,8,81,0,0,8,17,0,21,8,131,0,18,7,31,0,0,8,113,0,0,8,49,0,0,9,195,0,16,7,10,0,0,8,97,0,0,8,33,0,0,9,163,0,0,8,1,0,0,8,129,0,0,8,65,0,0,9,227,0,16,7,6,0,0,8,89,0,0,8,25,0,0,9,147,0,19,7,59,0,0,8,121,0,0,8,57,0,0,9,211,0,17,7,17,0,0,8,105,0,0,8,41,0,0,9,179,0,0,8,9,0,0,8,137,0,0,8,73,0,0,9,243,0,16,7,4,0,0,8,85,0,0,8,21,0,16,8,2,1,19,7,43,0,0,8,117,0,0,8,53,0,0,9,203,0,17,7,13,0,0,8,101,0,0,8,37,0,0,9,171,0,0,8,5,0,0,8,133,0,0,8,69,0,0,9,235,0,16,7,8,0,0,8,93,0,0,8,29,0,0,9,155,0,20,7,83,0,0,8,125,0,0,8,61,0,0,9,219,0,18,7,23,0,0,8,109,0,0,8,45,0,0,9,187,0,0,8,13,0,0,8,141,0,0,8,77,0,0,9,251,0,16,7,3,0,0,8,83,0,0,8,19,0,21,8,195,0,19,7,35,0,0,8,115,0,0,8,51,0,0,9,199,0,17,7,11,0,0,8,99,0,0,8,35,0,0,9,167,0,0,8,3,0,0,8,131,0,0,8,67,0,0,9,231,0,16,7,7,0,0,8,91,0,0,8,27,0,0,9,151,0,20,7,67,0,0,8,123,0,0,8,59,0,0,9,215,0,18,7,19,0,0,8,107,0,0,8,43,0,0,9,183,0,0,8,11,0,0,8,139,0,0,8,75,0,0,9,247,0,16,7,5,0,0,8,87,0,0,8,23,0,64,8,0,0,19,7,51,0,0,8,119,0,0,8,55,0,0,9,207,0,17,7,15,0,0,8,103,0,0,8,39,0,0,9,175,0,0,8,7,0,0,8,135,0,0,8,71,0,0,9,239,0,16,7,9,0,0,8,95,0,0,8,31,0,0,9,159,0,20,7,99,0,0,8,127,0,0,8,63,0,0,9,223,0,18,7,27,0,0,8,111,0,0,8,47,0,0,9,191,0,0,8,15,0,0,8,143,0,0,8,79,0,0,9,255,0,16,5,1,0,23,5,1,1,19,5,17,0,27,5,1,16,17,5,5,0,25,5,1,4,21,5,65,0,29,5,1,64,16,5,3,0,24,5,1,2,20,5,33,0,28,5,1,32,18,5,9,0,26,5,1,8,22,5,129,0,64,5,0,0,16,5,2,0,23,5,129,1,19,5,25,0,27,5,1,24,17,5,7,0,25,5,1,6,21,5,97,0,29,5,1,96,16,5,4,0,24,5,1,3,20,5,49,0,28,5,1,48,18,5,13,0,26,5,1,12,22,5,193,0,64,5,0,0,3,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,13,0,15,0,17,0,19,0,23,0,27,0,31,0,35,0,43,0,51,0,59,0,67,0,83,0,99,0,115,0,131,0,163,0,195,0,227,0,2,1,0,0,0,0,0,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,16,0,17,0,17,0,17,0,17,0,18,0,18,0,18,0,18,0,19,0,19,0,19,0,19,0,20,0,20,0,20,0,20,0,21,0,21,0,21,0,21,0,16,0,73,0,195,0,0,0,1,0,2,0,3,0,4,0,5,0,7,0,9,0,13,0,17,0,25,0,33,0,49,0,65,0,97,0,129,0,193,0,1,1,129,1,1,2,1,3,1,4,1,6,1,8,1,12,1,16,1,24,1,32,1,48,1,64,1,96,0,0,0,0,16,0,16,0,16,0,16,0,17,0,17,0,18,0,18,0,19,0,19,0,20,0,20,0,21,0,21,0,22,0,22,0,23,0,23,0,24,0,24,0,25,0,25,0,26,0,26,0,27,0,27,0,28,0,28,0,29,0,29,0,64,0,64,0,0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,0,100,0,0,248,104,0,0,1,1,0,0,30,1,0,0,15,0,0,0,0,0,0,0,128,104,0,0,232,105,0,0,0,0,0,0,30,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,240,106,0,0,0,0,0,0,19,0,0,0,7,0,0,0,0,0,0,0,12,0,8,0,140,0,8,0,76,0,8,0,204,0,8,0,44,0,8,0,172,0,8,0,108,0,8,0,236,0,8,0,28,0,8,0,156,0,8,0,92,0,8,0,220,0,8,0,60,0,8,0,188,0,8,0,124,0,8,0,252,0,8,0,2,0,8,0,130,0,8,0,66,0,8,0,194,0,8,0,34,0,8,0,162,0,8,0,98,0,8,0,226,0,8,0,18,0,8,0,146,0,8,0,82,0,8,0,210,0,8,0,50,0,8,0,178,0,8,0,114,0,8,0,242,0,8,0,10,0,8,0,138,0,8,0,74,0,8,0,202,0,8,0,42,0,8,0,170,0,8,0,106,0,8,0,234,0,8,0,26,0,8,0,154,0,8,0,90,0,8,0,218,0,8,0,58,0,8,0,186,0,8,0,122,0,8,0,250,0,8,0,6,0,8,0,134,0,8,0,70,0,8,0,198,0,8,0,38,0,8,0,166,0,8,0,102,0,8,0,230,0,8,0,22,0,8,0,150,0,8,0,86,0,8,0,214,0,8,0,54,0,8,0,182,0,8,0,118,0,8,0,246,0,8,0,14,0,8,0,142,0,8,0,78,0,8,0,206,0,8,0,46,0,8,0,174,0,8,0,110,0,8,0,238,0,8,0,30,0,8,0,158,0,8,0,94,0,8,0,222,0,8,0,62,0,8,0,190,0,8,0,126,0,8,0,254,0,8,0,1,0,8,0,129,0,8,0,65,0,8,0,193,0,8,0,33,0,8,0,161,0,8,0,97,0,8,0,225,0,8,0,17,0,8,0,145,0,8,0,81,0,8,0,209,0,8,0,49,0,8,0,177,0,8,0,113,0,8,0,241,0,8,0,9,0,8,0,137,0,8,0,73,0,8,0,201,0,8,0,41,0,8,0,169,0,8,0,105,0,8,0,233,0,8,0,25,0,8,0,153,0,8,0,89,0,8,0,217,0,8,0,57,0,8,0,185,0,8,0,121,0,8,0,249,0,8,0,5,0,8,0,133,0,8,0,69,0,8,0,197,0,8,0,37,0,8,0,165,0,8,0,101,0,8,0,229,0,8,0,21,0,8,0,149,0,8,0,85,0,8,0,213,0,8,0,53,0,8,0,181,0,8,0,117,0,8,0,245,0,8,0,13,0,8,0,141,0,8,0,77,0,8,0,205,0,8,0,45,0,8,0,173,0,8,0,109,0,8,0,237,0,8,0,29,0,8,0,157,0,8,0,93,0,8,0,221,0,8,0,61,0,8,0,189,0,8,0,125,0,8,0,253,0,8,0,19,0,9,0,19,1,9,0,147,0,9,0,147,1,9,0,83,0,9,0,83,1,9,0,211,0,9,0,211,1,9,0,51,0,9,0,51,1,9,0,179,0,9,0,179,1,9,0,115,0,9,0,115,1,9,0,243,0,9,0,243,1,9,0,11,0,9,0,11,1,9,0,139,0,9,0,139,1,9,0,75,0,9,0,75,1,9,0,203,0,9,0,203,1,9,0,43,0,9,0,43,1,9,0,171,0,9,0,171,1,9,0,107,0,9,0,107,1,9,0,235,0,9,0,235,1,9,0,27,0,9,0,27,1,9,0,155,0,9,0,155,1,9,0,91,0,9,0,91,1,9,0,219,0,9,0,219,1,9,0,59,0,9,0,59,1,9,0,187,0,9,0,187,1,9,0,123,0,9,0,123,1,9,0,251,0,9,0,251,1,9,0,7,0,9,0,7,1,9,0,135,0,9,0,135,1,9,0,71,0,9,0,71,1,9,0,199,0,9,0,199,1,9,0,39,0,9,0,39,1,9,0,167,0,9,0,167,1,9,0,103,0,9,0,103,1,9,0,231,0,9,0,231,1,9,0,23,0,9,0,23,1,9,0,151,0,9,0,151,1,9,0,87,0,9,0,87,1,9,0,215,0,9,0,215,1,9,0,55,0,9,0,55,1,9,0,183,0,9,0,183,1,9,0,119,0,9,0,119,1,9,0,247,0,9,0,247,1,9,0,15,0,9,0,15,1,9,0,143,0,9,0,143,1,9,0,79,0,9,0,79,1,9,0,207,0,9,0,207,1,9,0,47,0,9,0,47,1,9,0,175,0,9,0,175,1,9,0,111,0,9,0,111,1,9,0,239,0,9,0,239,1,9,0,31,0,9,0,31,1,9,0,159,0,9,0,159,1,9,0,95,0,9,0,95,1,9,0,223,0,9,0,223,1,9,0,63,0,9,0,63,1,9,0,191,0,9,0,191,1,9,0,127,0,9,0,127,1,9,0,255,0,9,0,255,1,9,0,0,0,7,0,64,0,7,0,32,0,7,0,96,0,7,0,16,0,7,0,80,0,7,0,48,0,7,0,112,0,7,0,8,0,7,0,72,0,7,0,40,0,7,0,104,0,7,0,24,0,7,0,88,0,7,0,56,0,7,0,120,0,7,0,4,0,7,0,68,0,7,0,36,0,7,0,100,0,7,0,20,0,7,0,84,0,7,0,52,0,7,0,116,0,7,0,3,0,8,0,131,0,8,0,67,0,8,0,195,0,8,0,35,0,8,0,163,0,8,0,99,0,8,0,227,0,8,0,0,0,5,0,16,0,5,0,8,0,5,0,24,0,5,0,4,0,5,0,20,0,5,0,12,0,5,0,28,0,5,0,2,0,5,0,18,0,5,0,10,0,5,0,26,0,5,0,6,0,5,0,22,0,5,0,14,0,5,0,30,0,5,0,1,0,5,0,17,0,5,0,9,0,5,0,25,0,5,0,5,0,5,0,21,0,5,0,13,0,5,0,29,0,5,0,3,0,5,0,19,0,5,0,11,0,5,0,27,0,5,0,7,0,5,0,23,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,80,0,0,0,96,0,0,0,112,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,9,0,0,0,9,0,0,0,10,0,0,0,10,0,0,0,11,0,0,0,11,0,0,0,12,0,0,0,12,0,0,0,13,0,0,0,13,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,7,0,0,0,0,0,0,0,110,101,101,100,32,100,105,99,116,105,111,110,97,114,121,0,115,116,114,101,97,109,32,101,110,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,105,108,101,32,101,114,114,111,114,0,0,0,0,0,0,115,116,114,101,97,109,32,101,114,114,111,114,0,0,0,0,100,97,116,97,32,101,114,114,111,114,0,0,0,0,0,0,105,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,0,0,0,0,0,98,117,102,102,101,114,32,101,114,114,111,114,0,0,0,0,105,110,99,111,109,112,97,116,105,98,108,101,32,118,101,114,115,105,111,110,0,0,0,0,64,107,0,0,80,107,0,0,96,107,0,0,104,107,0,0,120,107,0,0,136,107,0,0,152,107,0,0,176,107,0,0,192,107,0,0,96,107,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+20576);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        return FS.llseek(stream, offset, whence);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

   
  Module["_i64Subtract"] = _i64Subtract;

  var _fabsf=Math_abs;

  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }
  
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }

   
  Module["_memset"] = _memset;

   
  Module["_strcat"] = _strcat;

  
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  function _abort() {
      Module['abort']();
    }

  
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }

  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }

  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  var _tan=Math_tan;


   
  Module["_strncpy"] = _strncpy;

  var _asin=Math_asin;

   
  Module["_i64Add"] = _i64Add;

  var _fabs=Math_abs;

  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  var _sqrt=Math_sqrt;


  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};

  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }

  
  function _fmod(x, y) {
      return x % y;
    }var _fmodl=_fmod;

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

   
  Module["_tolower"] = _tolower;

  var _atan=Math_atan;

  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }


  
  
  
  
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _log=Math_log;

  var _cos=Math_cos;

  var _llvm_pow_f64=Math_pow;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function ___errno_location() {
      return ___errno_state;
    }

  var _BItoD=true;

  var _sin=Math_sin;

  var _atan2=Math_atan2;

   
  Module["_strcpy"] = _strcpy;

  function _llvm_bswap_i32(x) {
      return ((x&0xff)<<24) | (((x>>8)&0xff)<<16) | (((x>>16)&0xff)<<8) | (x>>>24);
    }



  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }

  var _exp=Math_exp;

  var _acos=Math_acos;

  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }

FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
___buildEnvironment(ENV);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iddiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iddiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stderr|0;var p=0;var q=0;var r=0;var s=0;var t=+env.NaN,u=+env.Infinity;var v=0,w=0,x=0,y=0,z=0.0,A=0,B=0,C=0,D=0.0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=global.Math.floor;var P=global.Math.abs;var Q=global.Math.sqrt;var R=global.Math.pow;var S=global.Math.cos;var T=global.Math.sin;var U=global.Math.tan;var V=global.Math.acos;var W=global.Math.asin;var X=global.Math.atan;var Y=global.Math.atan2;var Z=global.Math.exp;var _=global.Math.log;var $=global.Math.ceil;var aa=global.Math.imul;var ba=env.abort;var ca=env.assert;var da=env.asmPrintInt;var ea=env.asmPrintFloat;var fa=env.min;var ga=env.invoke_iiii;var ha=env.invoke_iddiii;var ia=env.invoke_vii;var ja=env.invoke_iii;var ka=env._fabs;var la=env._sin;var ma=env._exp;var na=env._llvm_pow_f64;var oa=env._acos;var pa=env._atan2;var qa=env._fmod;var ra=env._lseek;var sa=env.__reallyNegative;var ta=env._asin;var ua=env._atan;var va=env.___buildEnvironment;var wa=env._fflush;var xa=env._pwrite;var ya=env._strerror_r;var za=env._fprintf;var Aa=env._open;var Ba=env._fabsf;var Ca=env._sbrk;var Da=env._send;var Ea=env._snprintf;var Fa=env._llvm_bswap_i32;var Ga=env._emscripten_memcpy_big;var Ha=env._fileno;var Ia=env._sysconf;var Ja=env.___setErrNo;var Ka=env._cos;var La=env._pread;var Ma=env._printf;var Na=env._sprintf;var Oa=env._log;var Pa=env._toupper;var Qa=env._write;var Ra=env._isupper;var Sa=env.___errno_location;var Ta=env._recv;var Ua=env._tan;var Va=env._copysign;var Wa=env._getenv;var Xa=env._mkport;var Ya=env.__exit;var Za=env._read;var _a=env._abort;var $a=env._islower;var ab=env._fwrite;var bb=env._time;var cb=env._isdigit;var db=env._strerror;var eb=env.__formatString;var fb=env._isspace;var gb=env._sqrt;var hb=env._exit;var ib=env._close;var jb=0.0;
// EMSCRIPTEN_START_FUNCS
function ob(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function pb(){return i|0}function qb(a){a=a|0;i=a}function rb(a,b){a=a|0;b=b|0;if((p|0)==0){p=a;q=b}}function sb(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function tb(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function ub(a){a=a|0;E=a}function vb(a){a=a|0;F=a}function wb(a){a=a|0;G=a}function xb(a){a=a|0;H=a}function yb(a){a=a|0;I=a}function zb(a){a=a|0;J=a}function Ab(a){a=a|0;K=a}function Bb(a){a=a|0;L=a}function Cb(a){a=a|0;M=a}function Db(a){a=a|0;N=a}function Eb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;if((d|0)>0){f=Ob(b,d)|0}else{f=Pb(b)|0}b=(f|0)==0;if(!b){Xb(f,hc(f)|0)}d=c[1086]|0;if((d|0)==0){c[1086]=10;g=gg(41040)|0;c[1088]=g;if((g|0)==0){h=-4;i=e;return h|0}else{j=10}}else{j=d}d=c[1090]|0;a:do{if((d|0)<(j|0)){k=d}else{g=j;l=c[1088]|0;while(1){m=g+10|0;c[1086]=m;n=jg(l,m*4104|0)|0;c[1088]=n;if((n|0)==0){h=-3;break}m=c[1086]|0;o=c[1090]|0;if((o|0)<(m|0)){k=o;break a}else{g=m;l=n}}i=e;return h|0}}while(0);if(b){h=-1;i=e;return h|0}c[(c[1088]|0)+(k*4104|0)>>2]=f;f=c[1088]|0;c[f+(k*4104|0)+4>>2]=0;a[f+((c[1090]|0)*4104|0)+8|0]=0;c[1090]=(c[1090]|0)+1;h=k;i=e;return h|0}function Fb(b,d,e){b=b|0;d=+d;e=+e;var f=0,g=0,h=0,j=0,k=0;f=i;g=c[1088]|0;h=c[g+(b*4104|0)>>2]|0;if((h|0)==0){j=0;i=f;return j|0}k=g+(b*4104|0)+8|0;a[k]=0;dc(h,d+-1.0,e+-1.0,k,4096)|0;j=k;i=f;return j|0}function Gb(b,d,e){b=b|0;d=+d;e=+e;var f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+4144|0;g=f+16|0;j=f+40|0;l=f+8|0;m=f;if((b|0)>0&(c[1086]|0)>(b|0)){n=(c[1088]|0)+(b*4104|0)|0}else{n=0}b=c[n>>2]|0;if((b|0)==0){o=0;i=f;return o|0}cc(b,d,e,l,m,f+32|0);e=+h[m>>3]+1.0;h[k>>3]=+h[l>>3]+1.0;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];l=g+8|0;h[k>>3]=e;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];Ea(j|0,4095,8,g|0)|0;g=n+8|0;n=a[j]|0;a:do{if(!(n<<24>>24==0)){l=j;m=n;while(1){b=l+1|0;if((fb(m<<24>>24|0)|0)==0){break}m=a[b]|0;if(m<<24>>24==0){break a}else{l=b}}m=a[l]|0;if(!(m<<24>>24==0)){b=g;p=l;q=m;while(1){m=p+1|0;r=b+1|0;a[b]=q;s=a[m]|0;if(s<<24>>24==0){break}else{b=r;p=m;q=s}}a[r]=0;if((r|0)==(g|0)){o=g;i=f;return o|0}q=r;p=r-g|0;while(1){b=q+ -1|0;if((fb(a[b]|0)|0)==0){o=g;t=14;break}a[b]=0;l=p+ -1|0;if((l|0)==0){o=g;t=14;break}else{q=b;p=l}}if((t|0)==14){i=f;return o|0}}}}while(0);a[g]=0;o=g;i=f;return o|0}function Hb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;if((b|0)>0&(c[1086]|0)>(b|0)){f=(c[1088]|0)+(b*4104|0)|0}else{f=0}b=c[f>>2]|0;if((b|0)==0){g=0;i=e;return g|0}h=f+8|0;a[h]=0;do{if((d|0)!=0?(a[d]|0)!=0:0){if(((xg(d,24)|0)!=0?(xg(d,40)|0)!=0:0)?(xg(d,56)|0)!=0:0){if(!(+oc(d)>0.0)){break}j=c[f>>2]|0}else{j=b}Xb(j,d)}}while(0);Hg(h|0,fc(c[f>>2]|0)|0,4096)|0;if((xg(h,24)|0)==0){k=h+0|0;l=24|0;m=k+9|0;do{a[k]=a[l]|0;k=k+1|0;l=l+1|0}while((k|0)<(m|0));g=h;i=e;return g|0}if((xg(h,40)|0)==0){k=h+0|0;l=40|0;m=k+9|0;do{a[k]=a[l]|0;k=k+1|0;l=l+1|0}while((k|0)<(m|0));g=h;i=e;return g|0}l=a[h]|0;if(l<<24>>24==0){g=h;i=e;return g|0}else{n=h;o=l}while(1){if(($a(o<<24>>24|0)|0)!=0){a[n]=Pa(a[n]|0)|0}l=n+1|0;k=a[l]|0;if(k<<24>>24==0){g=h;break}else{n=l;o=k}}i=e;return g|0}function Ib(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((b|0)>0&(c[1086]|0)>(b|0)){f=(c[1088]|0)+(b*4104|0)|0}else{f=0}b=c[f>>2]|0;if((b|0)==0){g=0;i=e;return g|0}h=f+8|0;a[h]=0;do{if((d|0)!=0?(a[d]|0)!=0:0){if((xg(d,64)|0)==0){gc(b,1)|0;c[f+4>>2]=1;break}else{gc(b,0)|0;c[f+4>>2]=0;break}}}while(0);b=c[f+4>>2]|0;if((b|0)==1){Hg(h|0,64,4095)|0}else if((b|0)==0){Hg(h|0,72,4095)|0}b=a[h]|0;if(b<<24>>24==0){g=h;i=e;return g|0}else{j=h;k=b}while(1){if((Ra(k<<24>>24|0)|0)!=0){a[j]=Jg(a[j]|0)|0}b=j+1|0;f=a[b]|0;if(f<<24>>24==0){g=h;break}else{j=b;k=f}}i=e;return g|0}function Jb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0,E=0.0,F=0.0,G=0,H=0,I=0.0,J=0.0,K=0.0;e=i;i=i+12352|0;f=e+32|0;g=e+56|0;j=e+4152|0;l=e+8248|0;m=e+48|0;n=e+52|0;o=e+24|0;p=e;q=e+8|0;r=e+16|0;if((b|0)>0&(c[1086]|0)>(b|0)){s=(c[1088]|0)+(b*4104|0)|0}else{s=0}c[m>>2]=0;c[n>>2]=0;if((c[s>>2]|0)==0){t=0;i=e;return t|0}u=Hb(b,0)|0;if(((yg(u,24)|0)!=0?(yg(u,40)|0)!=0:0)?(yg(u,56)|0)!=0:0){v=0}else{v=1}u=s+8|0;a[u]=0;b=cg(d)|0;d=fg(b,88)|0;if((d|0)!=0){w=s+4|0;x=(v|0)==0;v=d;do{d=$f(v,32)|0;if((d|0)==0){c[m>>2]=96;y=96;z=0}else{A=d+1|0;c[m>>2]=A;a[d]=0;y=A;z=v}B=+wg(y,n);if(B!=0.0?(C=+wg(c[n>>2]|0,m),C!=0.0):0){bc(c[s>>2]|0,B,C,o,p);A=(z|0)!=0;if(A){c[f>>2]=z;Ea(g|0,4096,104,f|0)|0;dg(u,g,4095)|0}d=c[w>>2]|0;if((d|0)==0){C=+h[o>>3];if(x){Tc(j,4095,C,3)}else{Uc(j,4095,C,3)}Uc(l,4095,+h[p>>3],3);c[f>>2]=j;c[f+4>>2]=l;Ea(g|0,4096,128,f|0)|0;dg(u,g,4095)|0}else if((d|0)==1){C=+h[p>>3];h[k>>3]=+h[o>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];d=f+8|0;h[k>>3]=C;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];Ea(g|0,4096,112,f|0)|0;dg(u,g,4095)|0}else{C=+h[p>>3];h[k>>3]=+h[o>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];d=f+8|0;h[k>>3]=C;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];Ea(g|0,4096,112,f|0)|0;dg(u,g,4095)|0}d=(yg(z,136)|0)==0;C=+wg(c[m>>2]|0,n);D=C!=0.0;a:do{if(d){if(D){if(x){B=C;while(1){E=+wg(c[n>>2]|0,m);if(!(E!=0.0)){F=B;break a}bc(c[s>>2]|0,B,E,o,p);G=c[w>>2]|0;if((G|0)==0){Tc(j,4095,+h[o>>3],3);Uc(l,4095,+h[p>>3],3);c[f>>2]=j;c[f+4>>2]=l;Ea(g|0,4096,160,f|0)|0;dg(u,g,4095)|0}else if((G|0)==1){E=+h[p>>3];h[k>>3]=+h[o>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];G=f+8|0;h[k>>3]=E;c[G>>2]=c[k>>2];c[G+4>>2]=c[k+4>>2];Ea(g|0,4096,144,f|0)|0;dg(u,g,4095)|0}else{E=+h[p>>3];h[k>>3]=+h[o>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];G=f+8|0;h[k>>3]=E;c[G>>2]=c[k>>2];c[G+4>>2]=c[k+4>>2];Ea(g|0,4096,144,f|0)|0;dg(u,g,4095)|0}E=+wg(c[m>>2]|0,n);if(E!=0.0){B=E}else{F=E;break}}}else{B=C;while(1){E=+wg(c[n>>2]|0,m);if(!(E!=0.0)){F=B;break a}bc(c[s>>2]|0,B,E,o,p);G=c[w>>2]|0;if((G|0)==1){E=+h[p>>3];h[k>>3]=+h[o>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];H=f+8|0;h[k>>3]=E;c[H>>2]=c[k>>2];c[H+4>>2]=c[k+4>>2];Ea(g|0,4096,144,f|0)|0;dg(u,g,4095)|0}else if((G|0)==0){Uc(j,4095,+h[o>>3],3);Uc(l,4095,+h[p>>3],3);c[f>>2]=j;c[f+4>>2]=l;Ea(g|0,4096,160,f|0)|0;dg(u,g,4095)|0}else{E=+h[p>>3];h[k>>3]=+h[o>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];G=f+8|0;h[k>>3]=E;c[G>>2]=c[k>>2];c[G+4>>2]=c[k+4>>2];Ea(g|0,4096,144,f|0)|0;dg(u,g,4095)|0}E=+wg(c[m>>2]|0,n);if(E!=0.0){B=E}else{F=E;break}}}}else{F=C}}else{if(D){B=C;while(1){E=+wg(c[n>>2]|0,m);if(!(E!=0.0)){F=B;break a}I=+wg(c[m>>2]|0,n);if(!(I!=0.0)){F=B;break a}J=+wg(c[n>>2]|0,m);if(!(J!=0.0)){F=B;break a}bc(c[s>>2]|0,B,E,o,p);bc(c[s>>2]|0,I,J,q,r);J=+ec(+h[o>>3],+h[p>>3],+h[q>>3],+h[r>>3])*3600.0;do{if(!(J<=60.0)){if(!(J<=3600.0)){h[k>>3]=J/3600.0;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];Ea(g|0,4096,192,f|0)|0;dg(u,g,4095)|0;break}else{h[k>>3]=J/60.0;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];Ea(g|0,4096,184,f|0)|0;dg(u,g,4095)|0;break}}else{h[k>>3]=J;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];Ea(g|0,4096,176,f|0)|0;dg(u,g,4095)|0}}while(0);J=+wg(c[m>>2]|0,n);if(J!=0.0){B=J}else{F=J;break}}}else{F=C}}}while(0);if(!((yg(z,200)|0)!=0?(yg(z,208)|0)!=0:0)){if(F<0.0){C=F;while(1){B=C+6.283185307179586;if(B<0.0){C=B}else{K=B;break}}}else{K=F}h[k>>3]=K*57.29577951308232;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];Ea(g|0,4096,216,f|0)|0;dg(u,g,4095)|0}if(A){Ea(g|0,4096,224,f|0)|0;dg(u,g,4095)|0}Ea(g|0,4096,88,f|0)|0;dg(u,g,4095)|0}v=fg(0,88)|0}while((v|0)!=0)}if((b|0)==0){t=u;i=e;return t|0}hg(b);t=u;i=e;return t|0}function Kb(a){a=a|0;var b=0,c=0.0;b=i;c=+af(a,0);i=b;return+c}function Lb(b,d,e,f,j,l,m){b=b|0;d=d|0;e=e|0;f=f|0;j=+j;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;i=i+4128|0;o=n;p=n+20|0;q=n+16|0;r=n+24|0;bf(b,d,e,f,p,q,j,l,m);j=+g[q>>2];h[k>>3]=+g[p>>2];c[o>>2]=c[k>>2];c[o+4>>2]=c[k+4>>2];p=o+8|0;h[k>>3]=j;c[p>>2]=c[k>>2];c[p+4>>2]=c[k+4>>2];Ea(r|0,4095,240,o|0)|0;o=a[r]|0;a:do{if(!(o<<24>>24==0)){p=r;q=o;while(1){m=p+1|0;if((fb(q<<24>>24|0)|0)==0){break}q=a[m]|0;if(q<<24>>24==0){break a}else{p=m}}q=a[p]|0;if(!(q<<24>>24==0)){m=248;l=p;f=q;while(1){q=l+1|0;s=m+1|0;a[m]=f;e=a[q]|0;if(e<<24>>24==0){break}else{m=s;l=q;f=e}}a[s]=0;if((s|0)==248){i=n;return 248}f=s;l=s-248|0;while(1){m=f+ -1|0;if((fb(a[m]|0)|0)==0){t=11;break}a[m]=0;p=l+ -1|0;if((p|0)==0){t=11;break}else{f=m;l=p}}if((t|0)==11){i=n;return 248}}}}while(0);a[248]=0;i=n;return 248}function Mb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0.0,ha=0.0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0.0,sa=0.0,ta=0.0,ua=0,va=0.0,wa=0,xa=0,ya=0.0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0.0,La=0.0,Ma=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0;e=i;i=i+1184|0;f=e+672|0;g=e+1176|0;j=e+1144|0;l=e+1112|0;m=e+1048|0;n=e+1040|0;p=e+1024|0;q=e+1032|0;r=e+1080|0;s=e+848|0;t=e;u=e+752|0;v=e+744|0;w=e+656|0;x=e+760|0;y=e+664|0;z=e+816|0;A=e+856|0;B=e+736|0;C=e+840|0;D=e+824|0;E=e+808|0;F=e+768|0;G=e+8|0;H=e+1088|0;I=e+868|0;J=e+864|0;K=e+872|0;L=e+880|0;M=e+960|0;N=e+1104|0;O=e+832|0;P=e+800|0;Q=e+728|0;R=ig(1,9336)|0;U=a[d]|0;d=U<<24>>24==32?0:U;a[N]=d;a[R+9324|0]=d;if((Oc(b,4424,N,63,M)|0)!=0){d=ig((Dg(M|0)|0)+2|0,1)|0;c[R+9320>>2]=d;Lg(d|0,M|0)|0}d=R+3984|0;c[d>>2]=0;c[R+3956>>2]=0;c[R+3924>>2]=0;c[R+3952>>2]=-1;U=R+3268|0;c[U>>2]=0;V=R+3272|0;c[V>>2]=0;h[D>>3]=0.0;h[E>>3]=0.0;W=F+8|0;X=F+16|0;Y=F+24|0;c[F+0>>2]=0;c[F+4>>2]=0;c[F+8>>2]=0;c[F+12>>2]=0;c[F+16>>2]=0;c[F+20>>2]=0;c[F+24>>2]=0;c[F+28>>2]=0;h[G>>3]=0.0;Z=R+3300|0;c[Z>>2]=0;_=R+48|0;h[_>>3]=0.0;c[K>>2]=0;Dc(b,4432,N,K)|0;$=c[K>>2]|0;if(($|0)==0){Ec(b,4432,K)|0;ba=c[K>>2]|0;if((ba|0)==0){Ec(b,4440,K)|0;ca=c[K>>2]|0;if((ca|0)==0){Ec(b,4448,K)|0;da=c[K>>2]|0}else{da=ca}}else{da=ba}}else{da=$}if((da|0)<1){_b(4456);Tb(R);ea=0;i=e;return ea|0}if((da|0)>2){c[K>>2]=2;fa=2}else{fa=da}da=R+3316|0;c[da>>2]=fa;$=R+3320|0;c[$>>2]=fa;c[R+3960>>2]=fa;fa=R+136|0;h[fa>>3]=0.0;Lc(b,4504,fa)|0;ga=+h[fa>>3];if(ga<1.0){Lc(b,4512,fa)|0;ha=+h[fa>>3]}else{ha=ga}if(ha<1.0){_b(4520);Tb(R);ea=0;i=e;return ea|0}ba=R+144|0;h[ba>>3]=0.0;Lc(b,4560,ba)|0;if(+h[ba>>3]<1.0){Lc(b,4568,ba)|0}ca=c[K>>2]|0;if((ca|0)>1){if(+h[ba>>3]<1.0){_b(4576);Tb(R);ea=0;i=e;return ea|0}else{ia=19}}else{if((ca|0)>0){ia=19}else{ja=0}}if((ia|0)==19){ca=c[o>>2]|0;ka=0;la=0;while(1){a[H+0|0]=a[4440|0]|0;a[H+1|0]=a[4441|0]|0;a[H+2|0]=a[4442|0]|0;a[H+3|0]=a[4443|0]|0;a[H+4|0]=a[4444|0]|0;a[H+5|0]=a[4445|0]|0;ma=ka+1|0;c[f>>2]=ma;Na(L|0,4616,f|0)|0;Fg(H|0,L|0)|0;do{if((Ec(b,H,J)|0)==0){if((ka|0)==0){ha=+h[fa>>3];if(ha>1.0){c[J>>2]=~~ha;break}}else if((ka|0)==1?(ha=+h[ba>>3],ha>1.0):0){c[J>>2]=~~ha;break}c[f>>2]=H;za(ca|0,4624,f|0)|0}}while(0);a[H+0|0]=a[4664|0]|0;a[H+1|0]=a[4665|0]|0;a[H+2|0]=a[4666|0]|0;a[H+3|0]=a[4667|0]|0;a[H+4|0]=a[4668|0]|0;a[H+5|0]=a[4669|0]|0;Fg(H|0,L|0)|0;if((Pc(b,H,16,L)|0)!=0?(Qc(L,4672)|0)!=0:0){c[J>>2]=0}na=((c[J>>2]|0)>1)+la|0;if((ma|0)<(c[K>>2]|0)){ka=ma;la=na}else{ja=na;break}}}c[K>>2]=ja;c[$>>2]=ja;c[da>>2]=ja;Pc(b,4680,16,R+3336|0)|0;Ec(b,4696,R+3332|0)|0;ja=R+3324|0;c[ja>>2]=kc()|0;$=R+9328|0;c[$>>2]=0;Ec(b,4712,$)|0;$=R+832|0;Eg($|0,0,648)|0;Eg(G|0,0,648)|0;la=c[K>>2]|0;ka=(la|0)>0;if(ka){ca=0;do{h[$+((aa(la,ca)|0)+ca<<3)>>3]=1.0;ca=ca+1|0}while((ca|0)<(la|0));if(ka){ca=0;do{h[G+((aa(la,ca)|0)+ca<<3)>>3]=1.0;ca=ca+1|0}while((ca|0)<(la|0));ca=R+760|0;oa=ca+0|0;pa=oa+72|0;do{c[oa>>2]=0;oa=oa+4|0}while((oa|0)<(pa|0));if(ka){ka=0;while(1){h[ca+(ka<<3)>>3]=1.0;na=ka+1|0;if((na|0)<(la|0)){ka=na}else{qa=ca;break}}}else{qa=ca}}else{ia=37}}else{ia=37}if((ia|0)==37){ca=R+760|0;oa=ca+0|0;pa=oa+72|0;do{c[oa>>2]=0;oa=oa+4|0}while((oa|0)<(pa|0));qa=ca}do{if((Oc(b,4720,N,63,M)|0)==0){c[R+9312>>2]=0}else{ca=Nb(b,M)|0;a[g]=ca;if(!(ca<<24>>24==95)){ca=Mb(b,g)|0;c[R+9312>>2]=ca;if((ca|0)!=0){c[ca+9316>>2]=R;break}}else{ca=c[o>>2]|0;c[f>>2]=M;za(ca|0,4368,f|0)|0;c[R+9312>>2]=0}_b(4728);Tb(R);ea=0;i=e;return ea|0}}while(0);M=R+3224|0;g=R+3232|0;c[M+0>>2]=0;c[M+4>>2]=0;c[M+8>>2]=0;c[M+12>>2]=0;do{if((Kc(b,4776,N,M)|0)==0){if((Kc(b,4784,N,g)|0)!=0){h[M>>3]=+h[g>>3]*299792.5;break}if((Lc(b,4792,M)|0)!=0){h[g>>3]=+h[M>>3]/299792.5}}else{h[g>>3]=+h[M>>3]/299792.5}}while(0);M=R+4096|0;oa=M+0|0;pa=oa+80|0;do{c[oa>>2]=0;oa=oa+4|0}while((oa|0)<(pa|0));do{if((Oc(b,4808,N,16,j)|0)==0){g=a[N]|0;if(!(g<<24>>24==32|g<<24>>24==0)){c[f>>2]=g<<24>>24;Na(L|0,5368,f|0)|0;_b(L);Tb(R);ea=0;i=e;return ea|0}if((Cc(b,5408)|0)!=0){c[R+3260>>2]=29;g=Cc(b,5408)|0;Lc(g,5408,s)|0;Lc(g,5416,t)|0;Lc(g,5424,u)|0;h[R+152>>3]=(+h[s>>3]+ +h[t>>3]/60.0+ +h[u>>3]/3600.0)*15.0*3.141592653589793/180.0;a[r]=43;Pc(g,5432,1,r)|0;ha=(a[r]|0)==45?-1.0:1.0;Lc(g,5448,v)|0;Lc(g,5456,w)|0;Lc(g,5464,x)|0;h[R+160>>3]=ha*(+h[v>>3]+ +h[w>>3]/60.0+ +h[x>>3]/3600.0)*3.141592653589793/180.0;g=R+120|0;Lc(b,5472,g)|0;Ec(b,5472,I)|0;ca=R+3764|0;ka=(c[I>>2]|0)==1950?3427142:3492678;a[ca]=ka;a[ca+1|0]=ka>>8;a[ca+2|0]=ka>>16;a[ca+3|0]=ka>>24;ka=R+128|0;h[ka>>3]=+h[g>>3];Lc(b,5344,ka)|0;ha=+h[t>>3];ga=+h[u>>3];ka=a[r]|0;ra=+h[v>>3];sa=+h[w>>3];ta=+h[x>>3];h[k>>3]=+h[s>>3];c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];g=f+8|0;h[k>>3]=ha;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];g=f+16|0;h[k>>3]=ga;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];c[f+24>>2]=ka;ka=f+28|0;h[k>>3]=ra;c[ka>>2]=c[k>>2];c[ka+4>>2]=c[k+4>>2];ka=f+36|0;h[k>>3]=sa;c[ka>>2]=c[k>>2];c[ka+4>>2]=c[k+4>>2];ka=f+44|0;h[k>>3]=ta;c[ka>>2]=c[k>>2];c[ka+4>>2]=c[k+4>>2];c[f+52>>2]=ca;Na(R+3892|0,5496,f|0)|0;Lc(b,5544,R+168|0)|0;Lc(b,5560,R+192|0)|0;Lc(b,5576,R+200|0)|0;Lc(b,5592,R+176|0)|0;Lc(b,5600,R+184|0)|0;ca=Cc(b,5608)|0;ka=R+208|0;c[f>>2]=1;Na(H|0,5616,f|0)|0;h[ka>>3]=0.0;Lc(ca,H,ka)|0;c[f>>2]=2;Na(H|0,5616,f|0)|0;ka=R+216|0;h[ka>>3]=0.0;Lc(ca,H,ka)|0;c[f>>2]=3;Na(H|0,5616,f|0)|0;ka=R+224|0;h[ka>>3]=0.0;Lc(ca,H,ka)|0;c[f>>2]=4;Na(H|0,5616,f|0)|0;ka=R+232|0;h[ka>>3]=0.0;Lc(ca,H,ka)|0;c[f>>2]=5;Na(H|0,5616,f|0)|0;ka=R+240|0;h[ka>>3]=0.0;Lc(ca,H,ka)|0;c[f>>2]=6;Na(H|0,5616,f|0)|0;ka=R+248|0;h[ka>>3]=0.0;Lc(ca,H,ka)|0;ka=Cc(b,5624)|0;ca=R+256|0;g=0;while(1){la=g+1|0;c[f>>2]=la;Na(H|0,5632,f|0)|0;na=ca+(g<<3)|0;h[na>>3]=0.0;Lc(ka,H,na)|0;if((la|0)==20){break}else{g=la}}g=Cc(b,5640)|0;ka=R+416|0;ca=0;while(1){ma=ca+1|0;c[f>>2]=ma;Na(H|0,5648,f|0)|0;la=ka+(ca<<3)|0;h[la>>3]=0.0;Lc(g,H,la)|0;if((ma|0)==20){break}else{ca=ma}}ca=R+3312|0;c[ca>>2]=1;g=R+3449|0;a[g+0|0]=a[5656|0]|0;a[g+1|0]=a[5657|0]|0;a[g+2|0]=a[5658|0]|0;g=R+3458|0;a[g]=4408644;a[g+1|0]=17221;a[g+2|0]=67;a[g+3|0]=0;g=R+3467|0;a[g]=5460804;a[g+1|0]=21331;a[g+2|0]=83;a[g+3|0]=0;c[R+3292>>2]=0;c[R+3288>>2]=3;oa=R+3368|0;g=5664|0;pa=oa+9|0;do{a[oa]=a[g]|0;oa=oa+1|0;g=g+1|0}while((oa|0)<(pa|0));oa=R+3377|0;g=5680|0;pa=oa+9|0;do{a[oa]=a[g]|0;oa=oa+1|0;g=g+1|0}while((oa|0)<(pa|0));ta=+h[fa>>3]*.5;g=R+616|0;h[g>>3]=ta;sa=+h[ba>>3]*.5;ka=R+624|0;h[ka>>3]=sa;h[R+16>>3]=ta;h[R+24>>3]=sa;nd(ta,sa,R,z,B)|0;sa=+h[z>>3];h[R+688>>3]=sa;ta=+h[B>>3];h[R+696>>3]=ta;h[R>>3]=sa;h[R+8>>3]=ta;nd(+h[g>>3],+h[ka>>3]+1.0,R,A,C)|0;ta=+h[C>>3]- +h[B>>3];h[R+40>>3]=ta;h[R+32>>3]=-ta;Sb(R);c[ca>>2]=1;ac(R);ta=+h[_>>3]*3.141592653589793/180.0;h[P>>3]=ta;sa=+h[g>>3]+ +S(+ta);nd(sa,+h[ka>>3]+ +T(+ta),R,A,C)|0;h[qa>>3]=-+ec(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);ta=+h[P>>3];sa=+h[g>>3]+ +T(+ta);nd(sa,+h[ka>>3]+ +S(+ta),R,A,C)|0;ta=+ec(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);h[R+768>>3]=ta;Wb(R,+h[qa>>3],ta,+h[_>>3]);ua=qa;break}if(((((Cc(b,5088)|0)==0?(Cc(b,5096)|0)==0:0)?(Cc(b,5112)|0)==0:0)?(Cc(b,5128)|0)==0:0)?(Cc(b,5144)|0)==0:0){_b(5824);Tb(R);ea=0;i=e;return ea|0}h[y>>3]=0.0;Lc(b,5088,y)|0;ta=+h[y>>3];if(ta==0.0){Lc(b,5096,y)|0;va=+h[y>>3]}else{va=ta}do{if(va==0.0){Lc(b,5144,y)|0;ta=+h[y>>3];if(ta!=0.0){h[D>>3]=-ta/3600.0;Lc(b,5152,y)|0;h[E>>3]=+h[y>>3]/3600.0;break}Lc(b,5128,y)|0;ta=+h[y>>3];if(ta!=0.0){h[D>>3]=-ta/3600.0;Lc(b,5160,y)|0;h[E>>3]=+h[y>>3]/3600.0;break}else{Lc(b,5112,y)|0;h[D>>3]=-+h[y>>3]/3600.0;Lc(b,5176,y)|0;h[E>>3]=+h[y>>3]/3600.0;break}}else{ta=va/3600.0;h[E>>3]=ta;h[D>>3]=-ta}}while(0);h[P>>3]=0.0;Lc(b,5256,P)|0;if(+h[_>>3]==0.0){Lc(b,5248,P)|0}Wb(R,+h[D>>3],+h[E>>3],+h[P>>3]);ca=R+616|0;h[ca>>3]=+h[fa>>3]*.5+.5;ka=R+624|0;h[ka>>3]=+h[ba>>3]*.5+.5;if((Cc(b,4904)|0)!=0){Lc(b,4904,ca)|0;Lc(b,4912,ka)|0}h[R+16>>3]=+h[ca>>3];h[R+24>>3]=+h[ka>>3];ka=R+688|0;h[ka>>3]=-999.0;if((Hc(b,5656,ka)|0)==0){_b(5696);Tb(R);ea=0;i=e;return ea|0}ca=R+696|0;h[ca>>3]=-999.0;if((Ic(b,4832,ca)|0)==0){_b(5736);Tb(R);ea=0;i=e;return ea|0}ta=+h[ka>>3];h[R>>3]=ta;sa=+h[ca>>3];h[R+8>>3]=sa;ca=R+3304|0;c[ca>>2]=0;h[R+3992>>3]=ta;h[R+4e3>>3]=sa;ka=R+4008|0;h[ka>>3]=999.0;if((Lc(b,4936,ka)|0)==0){Lc(b,5776,ka)|0}ka=R+4016|0;h[ka>>3]=999.0;Lc(b,4944,ka)|0;do{if((Lc(b,5312,O)|0)==0){ka=R+128|0;if((Mc(b,5320,ka)|0)==0){if((Mc(b,5336,ka)|0)!=0){break}if((Lc(b,5344,ka)|0)!=0){break}h[ka>>3]=+h[R+120>>3];break}Pc(b,5320,32,m)|0;if(($f(m,84)|0)==0){if((Lc(b,5352,Q)|0)!=0){h[ka>>3]=+h[ka>>3]+ +h[Q>>3]/8765.812770744;break}if((Lc(b,5360,Q)|0)!=0){h[ka>>3]=+h[ka>>3]+ +h[Q>>3]/8765.812770744}}}else{h[R+128>>3]=(+h[O>>3]+-15019.81352)/365.242198781+1900.0}}while(0);Vb(R,5792,5808)|0;c[ca>>2]=0;a[f]=0;Rb(b,R,f);Sb(R);c[R+3292>>2]=0;c[R+3288>>2]=3;c[R+3312>>2]=1;ua=qa}else{Lg(l|0,j|0)|0;ka=(Oc(b,4816,N,16,l)|0)==0;Lg(R+3368|0,j|0)|0;Lg(R+3377|0,l|0)|0;if((Qc(l,4824)|0)==0){g=(Qc(l,4832)|0)==0;wa=g?1:2}else{wa=2}g=R+3386|0;a[g]=0;Oc(b,4840,N,9,g)|0;g=R+3395|0;a[g]=0;Oc(b,4848,N,9,g)|0;if((Vb(R,j,l)|0)!=0){Tb(R);ea=0;i=e;return ea|0}g=R+3260|0;if((c[g>>2]|0)==0){ma=R+3476|0;if((Oc(b,4856,N,16,ma)|0)==0?(Yc(b,4864,4872,16,ma)|0)==0:0){a[ma]=0}if((yg(ma,4880)|0)==0){c[g>>2]=-1}if(!ka){ka=R+3508|0;if((Oc(b,4888,N,16,ka)|0)==0?(Yc(b,4896,4872,16,ka)|0)==0:0){a[ka]=0}if((yg(ma,4880)|0)==0){c[g>>2]=-1}}}ma=R+616|0;h[ma>>3]=1.0;Kc(b,4904,N,ma)|0;ka=R+624|0;h[ka>>3]=1.0;Kc(b,4912,N,ka)|0;h[R+16>>3]=+h[ma>>3];h[R+24>>3]=+h[ka>>3];la=R+688|0;h[la>>3]=0.0;Kc(b,4920,N,la)|0;na=R+696|0;h[na>>3]=0.0;Kc(b,4928,N,na)|0;xa=c[R+3884>>2]|0;if((xa|0)==7){h[na>>3]=90.0- +h[na>>3];ia=74}else if((xa|0)==8){sa=+h[na>>3]+-90.0;h[na>>3]=sa;ya=sa}else{ia=74}if((ia|0)==74){ya=+h[na>>3]}sa=+h[la>>3];h[R>>3]=sa;h[R+8>>3]=ya;la=R+3992|0;if((c[R+3304>>2]|0)==0){h[la>>3]=sa;h[R+4e3>>3]=ya}else{h[la>>3]=ya;h[R+4e3>>3]=sa}la=R+3176|0;h[la>>3]=999.0;Kc(b,4936,N,la)|0;h[R+4008>>3]=+h[la>>3];la=R+3184|0;h[la>>3]=999.0;Kc(b,4944,N,la)|0;h[R+4016>>3]=+h[la>>3];c[R+3964>>2]=ma;c[R+3972>>2]=qa;c[R+3968>>2]=$;la=R+4088|0;h[la>>3]=0.0;Kc(b,4952,N,la)|0;c[f>>2]=0;Na(H|0,4960,f|0)|0;Kc(b,H,N,M)|0;c[f>>2]=1;Na(H|0,4960,f|0)|0;la=R+4104|0;Kc(b,H,N,la)|0;c[f>>2]=2;Na(H|0,4960,f|0)|0;na=R+4112|0;Kc(b,H,N,na)|0;c[f>>2]=3;Na(H|0,4960,f|0)|0;xa=R+4120|0;Kc(b,H,N,xa)|0;c[f>>2]=4;Na(H|0,4960,f|0)|0;Aa=R+4128|0;Kc(b,H,N,Aa)|0;c[f>>2]=5;Na(H|0,4960,f|0)|0;Ba=R+4136|0;Kc(b,H,N,Ba)|0;c[f>>2]=6;Na(H|0,4960,f|0)|0;Ca=R+4144|0;Kc(b,H,N,Ca)|0;c[f>>2]=7;Na(H|0,4960,f|0)|0;Da=R+4152|0;Kc(b,H,N,Da)|0;c[f>>2]=8;Na(H|0,4960,f|0)|0;Ea=R+4160|0;Kc(b,H,N,Ea)|0;c[f>>2]=9;Na(H|0,4960,f|0)|0;Fa=R+4168|0;Kc(b,H,N,Fa)|0;c[f>>2]=wa;Na(n|0,4968,f|0)|0;c[f>>2]=wa;Na(p|0,4976,f|0)|0;c[f>>2]=wa;Na(q|0,4984,f|0)|0;Ga=c[g>>2]|0;switch(Ga|0){case 7:{c[f>>2]=wa;c[f+4>>2]=0;Na(H|0,4992,f|0)|0;Kc(b,H,N,M)|0;c[f>>2]=wa;c[f+4>>2]=1;Na(H|0,4992,f|0)|0;Kc(b,H,N,la)|0;c[f>>2]=wa;c[f+4>>2]=2;Na(H|0,4992,f|0)|0;Kc(b,H,N,na)|0;c[f>>2]=wa;c[f+4>>2]=3;Na(H|0,4992,f|0)|0;Kc(b,H,N,xa)|0;c[f>>2]=wa;c[f+4>>2]=4;Na(H|0,4992,f|0)|0;Kc(b,H,N,Aa)|0;c[f>>2]=wa;c[f+4>>2]=5;Na(H|0,4992,f|0)|0;Kc(b,H,N,Ba)|0;c[f>>2]=wa;c[f+4>>2]=6;Na(H|0,4992,f|0)|0;Kc(b,H,N,Ca)|0;c[f>>2]=wa;c[f+4>>2]=7;Na(H|0,4992,f|0)|0;Kc(b,H,N,Da)|0;c[f>>2]=wa;c[f+4>>2]=8;Na(H|0,4992,f|0)|0;Kc(b,H,N,Ea)|0;c[f>>2]=wa;c[f+4>>2]=9;Na(H|0,4992,f|0)|0;Kc(b,H,N,Fa)|0;ia=97;break};case 17:case 15:case 16:case 14:case 4:case 1:{Kc(b,n,N,R+4104|0)|0;Kc(b,p,N,R+4112|0)|0;ia=97;break};case 2:{Kc(b,n,N,R+4104|0)|0;Kc(b,p,N,R+4112|0)|0;Fa=R+4120|0;if(+h[Fa>>3]==0.0){h[Fa>>3]=90.0}Kc(b,q,N,Fa)|0;ia=97;break};case 13:{Fa=R+4104|0;if(+h[Fa>>3]==0.0){h[Fa>>3]=1.0}Kc(b,n,N,Fa)|0;ia=97;break};case 10:{Fa=R+4104|0;if(+h[Fa>>3]==0.0){h[Fa>>3]=1.0}Kc(b,n,N,Fa)|0;Fa=R+4112|0;if(+h[Fa>>3]==0.0){h[Fa>>3]=1.0}Kc(b,p,N,Fa)|0;ia=97;break};case 9:{Fa=R+4104|0;if(+h[Fa>>3]==0.0){h[Fa>>3]=90.0}Kc(b,n,N,Fa)|0;ia=97;break};case 18:{Kc(b,n,N,R+4104|0)|0;ia=97;break};default:{Ha=Ga}}if((ia|0)==97){Ha=c[g>>2]|0}do{if((Ha|0)==31){if((dd(b,R)|0)==0){Ia=c[g>>2]|0;ia=102;break}else{a[R+3374|0]=65;a[R+3375|0]=78;a[R+3383|0]=65;a[R+3384|0]=78;c[g>>2]=3;break}}else{Ia=Ha;ia=102}}while(0);a:do{if((ia|0)==102){do{if((Ia|0)==32){if((kd(b,R)|0)==0){Ja=c[g>>2]|0;break}else{a[R+3375|0]=78;a[R+3384|0]=78;c[g>>2]=7;break a}}else{Ja=Ia}}while(0);if((Ja|0)==33){a[R+3374|0]=65;a[R+3375|0]=78;a[R+3383|0]=65;a[R+3384|0]=78;c[g>>2]=3}}}while(0);if((c[ja>>2]|0)>0){Rb(b,R,N)}Sb(R);Ye(R,b);c[U>>2]=0;c[V>>2]=0;ca=Kc(b,5e3,N,F)|0;Ga=Kc(b,5008,N,W)|0;Fa=Kc(b,5016,N,X)|0;Ea=Kc(b,5024,N,Y)|0;if((c[ja>>2]|0)!=2?(Da=Cc(b,5032)|0,(Da|0)!=0):0){c[g>>2]=30;Ca=R+3467|0;a[Ca+0|0]=a[5040|0]|0;a[Ca+1|0]=a[5041|0]|0;a[Ca+2|0]=a[5042|0]|0;a[Ca+3|0]=a[5043|0]|0;a[Ca+4|0]=a[5044|0]|0;a[Ca+5|0]=a[5045|0]|0;Ca=R+256|0;Ba=0;while(1){Aa=Ba+1|0;c[f>>2]=Aa;Na(H|0,5048,f|0)|0;xa=Ca+(Ba<<3)|0;h[xa>>3]=0.0;if((Lc(Da,H,xa)|0)!=0){c[U>>2]=Aa}if((Aa|0)==20){break}else{Ba=Aa}}Ba=Cc(b,5056)|0;Da=R+416|0;Ca=0;while(1){Aa=Ca+1|0;c[f>>2]=Aa;Na(H|0,5064,f|0)|0;xa=Da+(Ca<<3)|0;h[xa>>3]=0.0;if((Lc(Ba,H,xa)|0)!=0){c[V>>2]=Aa}if((Aa|0)==20){break}else{Ca=Aa}}bd(+h[ma>>3],+h[ka>>3],R,z,B)|0;bd(+h[ma>>3],+h[ka>>3]+1.0,R,A,C)|0;sa=+h[C>>3]- +h[B>>3];Ca=R+40|0;h[Ca>>3]=sa;Ba=R+32|0;h[Ba>>3]=-sa;c[R+3312>>2]=1;ac(R);h[P>>3]=+h[_>>3]*3.141592653589793/180.0;bd(+h[ma>>3],+h[ka>>3],R,z,B)|0;sa=+h[P>>3];ta=+h[ma>>3]+ +S(+sa);bd(ta,+h[ka>>3]+ +T(+sa),R,A,C)|0;sa=-+ec(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);h[qa>>3]=sa;h[Ba>>3]=sa;sa=+h[P>>3];ta=+h[ma>>3]+ +T(+sa);bd(ta,+h[ka>>3]+ +S(+sa),R,A,C)|0;sa=+ec(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);h[R+768>>3]=sa;h[Ca>>3]=sa;Ca=R+56|0;h[Ca>>3]=+h[F>>3];h[R+64>>3]=+h[W>>3];h[R+72>>3]=+h[X>>3];h[R+80>>3]=+h[Y>>3];Bd(2,Ca,R+88|0)|0}else{ia=121}do{if((ia|0)==121){if((Ga|ca|Fa|Ea|0)!=0){c[Z>>2]=1;Zb(R,F);break}if((Kc(b,5072,N,D)|0)==0){h[R+32>>3]=1.0;h[R+40>>3]=1.0;h[qa>>3]=1.0;h[R+768>>3]=1.0;h[_>>3]=0.0;c[Z>>2]=0;_b(5264);break}Kc(b,5080,N,E)|0;if(!(+h[D>>3]==0.0)){if(+h[ba>>3]>1.0){sa=+h[E>>3];if(sa==0.0){ia=127}else{Ka=sa}}else{ia=154}}else{ia=127}do{if((ia|0)==127){if(((((Cc(b,5088)|0)==0?(Cc(b,5096)|0)==0:0)?(Cc(b,5112)|0)==0:0)?(Cc(b,5128)|0)==0:0)?(Cc(b,5144)|0)==0:0){ia=154;break}h[y>>3]=0.0;Lc(b,5088,y)|0;sa=+h[y>>3];if(sa==0.0){Lc(b,5096,y)|0;La=+h[y>>3]}else{La=sa}if(!(La==0.0)){if(+h[D>>3]==0.0){h[D>>3]=-La/3600.0}sa=+h[E>>3];if(!(sa==0.0)){Ka=sa;break}sa=La/3600.0;h[E>>3]=sa;Ka=sa;break}Lc(b,5144,y)|0;sa=+h[y>>3];if(sa!=0.0){if(+h[D>>3]==0.0){h[D>>3]=-sa/3600.0}sa=+h[E>>3];if(!(sa==0.0)){Ka=sa;break}Lc(b,5152,y)|0;sa=+h[y>>3]/3600.0;h[E>>3]=sa;Ka=sa;break}Lc(b,5128,y)|0;sa=+h[y>>3];if(sa!=0.0){if(+h[D>>3]==0.0){h[D>>3]=-sa/3600.0}sa=+h[E>>3];if(!(sa==0.0)){Ka=sa;break}Lc(b,5160,y)|0;sa=+h[y>>3]/3600.0;h[E>>3]=sa;Ka=sa;break}Lc(b,5112,y)|0;sa=+h[y>>3];if(sa!=0.0?+h[D>>3]==0.0:0){h[D>>3]=-sa/3600.0}sa=+h[E>>3];if(sa==0.0){Lc(b,5176,y)|0;ta=+h[y>>3]/3600.0;h[E>>3]=ta;Ka=ta}else{Ka=sa}}}while(0);if((ia|0)==154){Ka=+h[E>>3]}if(Ka==0.0?+h[ba>>3]>1.0:0){h[E>>3]=-+h[D>>3]}h[R+776>>3]=1.0;h[R+784>>3]=1.0;Eg(G|0,0,648)|0;Eg($|0,0,648)|0;Ca=c[K>>2]|0;if((Ca|0)>0){Ba=0;do{h[G+((aa(Ca,Ba)|0)+Ba<<3)>>3]=1.0;Ba=Ba+1|0}while((Ba|0)<(Ca|0))}if((a[N]|0)==0?(Lc(b,5192,G)|0)!=0:0){Ca=c[K>>2]|0;if((Ca|0)>0){Ba=Ca;Ca=0;Da=0;while(1){c[J>>2]=0;Aa=Ca+1|0;if((Ba|0)>0){xa=0;na=Da;while(1){la=G+(na<<3)|0;h[la>>3]=(Ca|0)==(xa|0)?1.0:0.0;c[f>>2]=Aa;c[f+4>>2]=xa+1;Na(H|0,5208,f|0)|0;Ma=na+1|0;Lc(b,H,la)|0;la=(c[J>>2]|0)+1|0;c[J>>2]=la;Oa=c[K>>2]|0;if((la|0)<(Oa|0)){xa=la;na=Ma}else{Pa=Oa;Qa=Ma;break}}}else{Pa=Ba;Qa=Da}if((Aa|0)<(Pa|0)){Ba=Pa;Ca=Aa;Da=Qa}else{break}}}$b(R,+h[D>>3],+h[E>>3],G);break}if((Kc(b,5224,N,G)|0)==0){h[P>>3]=0.0;if((wa|0)==2){Kc(b,5248,N,P)|0}else{Kc(b,5256,N,P)|0}Wb(R,+h[D>>3],+h[E>>3],+h[P>>3]);break}Da=c[K>>2]|0;if((Da|0)>0){Ca=Da;Da=0;Ba=0;while(1){c[J>>2]=0;na=Da+1|0;if((Ca|0)>0){xa=0;Ma=Ba;while(1){Oa=G+(Ma<<3)|0;h[Oa>>3]=(Da|0)==(xa|0)?1.0:0.0;c[f>>2]=na;c[f+4>>2]=xa+1;Na(H|0,5232,f|0)|0;la=Ma+1|0;Kc(b,H,N,Oa)|0;Oa=(c[J>>2]|0)+1|0;c[J>>2]=Oa;Ra=c[K>>2]|0;if((Oa|0)<(Ra|0)){xa=Oa;Ma=la}else{Sa=Ra;Ta=la;break}}}else{Sa=Ca;Ta=Ba}if((na|0)<(Sa|0)){Ca=Sa;Da=na;Ba=Ta}else{break}}}$b(R,+h[D>>3],+h[E>>3],G)}}while(0);if((c[g>>2]|0)==3?(c[da>>2]|0)==2:0){Ea=R+3168|0;Fa=c[Ea>>2]|0;if((Fa|0)!=0){rd(Fa);c[Ea>>2]=0}Ea=R+3172|0;Fa=c[Ea>>2]|0;if((Fa|0)!=0){rd(Fa);c[Ea>>2]=0}c[R+1560>>2]=0;Ea=R+1568|0;Fa=R+4344|0;ca=0;do{h[Ea+(ca<<3)>>3]=0.0;h[Fa+(ca<<3)>>3]=0.0;ca=ca+1|0}while((ca|0)!=200);c[J>>2]=0;ca=0;g=0;while(1){c[f>>2]=1;c[f+4>>2]=g;Na(H|0,4992,f|0)|0;if((Kc(b,H,N,Ea+(c[J>>2]<<3)|0)|0)==0){Ga=c[J>>2]|0;h[Ea+(Ga<<3)>>3]=0.0;Ua=Ga;Va=ca}else{Ua=c[J>>2]|0;Va=ca+1|0}g=Ua+1|0;c[J>>2]=g;if((g|0)>=100){break}else{ca=Va}}c[J>>2]=0;ca=Va;g=0;while(1){c[f>>2]=2;c[f+4>>2]=g;Na(H|0,4992,f|0)|0;if((Kc(b,H,N,Ea+((c[J>>2]|0)+100<<3)|0)|0)==0){Ga=c[J>>2]|0;h[Ea+(Ga+100<<3)>>3]=0.0;Wa=Ga;Xa=ca}else{Wa=c[J>>2]|0;Xa=ca+1|0}g=Wa+1|0;c[J>>2]=g;if((g|0)>=100){break}else{ca=Xa}}if((Xa|0)>0){ca=R+3948|0;g=R+3944|0;Ga=100;ka=0;while(1){sa=+h[Ea+(((c[ca>>2]|0)*100|0)+Ga<<3)>>3];h[Fa+(Ga<<3)>>3]=sa;ta=+h[Ea+(((c[g>>2]|0)*100|0)+Ga<<3)>>3];h[Fa+(Ga+100<<3)>>3]=ta;if((ka|0)==0){Ya=sa!=0.0|ta!=0.0?Ga+1|0:0}else{Ya=ka}if((Ga|0)>0){Ga=Ga+ -1|0;ka=Ya}else{break}}Qb(R);c[d>>2]=0}}ka=R+3467|0;if(!((Ag(ka,5296,6)|0)!=0?(Ag(ka,5304,5)|0)!=0:0)){c[R+3292>>2]=-1;c[R+3288>>2]=5}do{if((Lc(b,5312,O)|0)==0){ka=R+128|0;if((Mc(b,5320,ka)|0)==0){if((Mc(b,5336,ka)|0)!=0){break}if((Lc(b,5344,ka)|0)!=0){break}h[ka>>3]=+h[R+120>>3];break}Pc(b,5320,32,m)|0;if(($f(m,84)|0)==0){if((Lc(b,5352,Q)|0)!=0){h[ka>>3]=+h[ka>>3]+ +h[Q>>3]/8765.812770744;break}if((Lc(b,5360,Q)|0)!=0){h[ka>>3]=+h[ka>>3]+ +h[Q>>3]/8765.812770744}}}else{h[R+128>>3]=(+h[O>>3]+-15019.81352)/365.242198781+1900.0}}while(0);c[R+3312>>2]=1;ua=qa}}while(0);c[R+3964>>2]=R+616;c[R+3972>>2]=ua;c[R+3968>>2]=$;c[R+3284>>2]=1;c[R+3296>>2]=0;c[R+3328>>2]=0;Yb(R);ea=R;i=e;return ea|0}function Nb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+96|0;f=e;g=e+16|0;if((d|0)==0){h=0;i=e;return h|0}j=Dg(d|0)|0;k=ig(1,j+1|0)|0;if((j|0)>0){l=0;do{m=a[d+l|0]|0;if((m+ -97<<24>>24&255)<26){a[k+l|0]=(m&255)+224}else{a[k+l|0]=m}l=l+1|0}while((l|0)!=(j|0))}a[k+j|0]=0;if((Dg(k|0)|0)==1){h=a[k]|0;i=e;return h|0}j=f;c[j>>2]=1314079575;c[j+4>>2]=4541761;a[f+8|0]=0;j=f+7|0;l=95;d=0;while(1){if((d|0)>0){n=d+64&255}else{n=0}a[j]=n;if((Pc(b,f,72,g)|0)==0){o=l}else{m=Dg(g|0)|0;p=ig(1,m+1|0)|0;if((m|0)>0){q=0;do{r=a[g+q|0]|0;if((r+ -97<<24>>24&255)<26){a[p+q|0]=(r&255)+224}else{a[p+q|0]=r}q=q+1|0}while((q|0)!=(m|0))}a[p+m|0]=0;q=(yg(p,k)|0)==0;hg(p);o=q?n:l}d=d+1|0;if((d|0)==27){break}else{l=o}}hg(k);h=o;i=e;return h|0}function Ob(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=d;a[e]=0;Bc(b,c)|0;c=Mb(b,e)|0;i=d;return c|0}function Pb(b){b=b|0;var c=0,d=0,e=0;c=i;i=i+16|0;d=c;a[d]=0;e=Mb(b,d)|0;i=c;return e|0}function Qb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;b=i;i=i+176|0;d=b+88|0;e=b+40|0;f=b+16|0;g=b+56|0;j=b+80|0;k=b+168|0;l=b+32|0;m=b+72|0;n=b+8|0;o=b;p=j;c[p>>2]=1;c[p+4>>2]=1;p=c[a+3944>>2]|0;q=c[a+3948>>2]|0;if((c[a+3316>>2]|0)!=2){i=b;return}r=a+3928|0;if((yg(r,5848)|0)!=0){i=b;return}if(+h[a+((p*100|1)<<3)+1568>>3]==0.0?+h[a+((q*100|1)<<3)+1568>>3]==0.0:0){i=b;return}s=a+9312|0;t=c[s>>2]|0;if((t|0)==0){h[l>>3]=0.0;h[m>>3]=0.0;h[n>>3]=+h[a+136>>3];h[o>>3]=+h[a+144>>3]}else{bc(t,0.0,0.0,l,m);bc(c[s>>2]|0,+h[a+136>>3],+h[a+144>>3],n,o)}if((p|0)==0){u=+h[l>>3];v=+h[m>>3];w=v;x=+h[o>>3]-v;y=u;z=+h[n>>3]-u}else{u=+h[m>>3];v=+h[l>>3];w=v;x=+h[n>>3]-v;y=u;z=+h[o>>3]-u}u=x/11.0;x=z/11.0;o=ig(288,8)|0;n=ig(144,8)|0;l=ig(144,8)|0;z=w+.5;m=g+(q<<3)|0;h[m>>3]=z;s=f+(q<<3)|0;h[s>>3]=z;z=y+.5;t=g+(p<<3)|0;h[t>>3]=z;A=f+(p<<3)|0;h[A>>3]=z;B=a+3956|0;C=e+(p<<3)|0;p=e+(q<<3)|0;q=a+4064|0;y=z;D=11;E=l;F=n;G=o;while(1){h[A>>3]=y;H=E+96|0;I=11;J=E;K=F;L=G;while(1){if((Dd(f,B,e)|0)!=0){c[d>>2]=r;Na(d|0,5856,d|0)|0;_b(d)}h[K>>3]=+h[C>>3];h[J>>3]=+h[p>>3];Wd(q,+h[C>>3],+h[p>>3],L,L+8|0)|0;h[A>>3]=x+ +h[A>>3];if((I|0)==0){break}else{I=I+ -1|0;J=J+8|0;K=K+8|0;L=L+16|0}}h[s>>3]=u+ +h[s>>3];if((D|0)==0){break}y=+h[t>>3];D=D+ -1|0;E=H;F=F+96|0;G=G+192|0}Dd(g,B,e)|0;h[C>>3]=+h[C>>3]+.0002777777777777778;Cd(e,B,f)|0;y=+h[A>>3]- +h[t>>3];u=+h[s>>3]- +h[m>>3];x=+Q(+(y*y+u*u))*3600.0;if(!(x!=0.0)){c[d>>2]=r;Na(d|0,5856,d|0)|0;_b(d)}u=.04/x;c[k>>2]=1;C=0;G=1;a:while(1){if((G|0)>1){rd(C)}M=qd(j,2,k,1)|0;td(M,o,n,0,144,0);F=143;E=n;D=o;while(1){x=+sd(M,D);if(+P(+(x- +h[E>>3]))>u){break}if((F|0)==0){N=26;break a}else{F=F+ -1|0;E=E+8|0;D=D+16|0}}D=c[k>>2]|0;E=D+1|0;c[k>>2]=E;if((D|0)>8){N=28;break}else{C=M;G=E}}if((N|0)==26){c[k>>2]=(c[k>>2]|0)+1}else if((N|0)==28){_b(5904);c[a+1560>>2]=1}c[a+3168>>2]=M;c[a+5944>>2]=M;Dd(g,B,e)|0;h[p>>3]=+h[p>>3]+.0002777777777777778;Cd(e,B,f)|0;u=+h[A>>3]- +h[t>>3];x=+h[s>>3]- +h[m>>3];y=+Q(+(u*u+x*x))*3600.0;if(!(y!=0.0)){c[d>>2]=r;Na(d|0,5856,d|0)|0;_b(d)}x=.04/y;c[k>>2]=1;d=M;M=1;b:while(1){if((M|0)>1){rd(d)}O=qd(j,2,k,1)|0;td(O,o,l,0,144,0);r=143;m=l;s=o;while(1){y=+sd(O,s);if(+P(+(y- +h[m>>3]))>x){break}if((r|0)==0){N=37;break b}else{r=r+ -1|0;m=m+8|0;s=s+16|0}}s=c[k>>2]|0;m=s+1|0;c[k>>2]=m;if((s|0)>8){N=39;break}else{d=O;M=m}}if((N|0)==37){c[k>>2]=(c[k>>2]|0)+1}else if((N|0)==39){_b(5904);c[a+1560>>2]=1}c[a+3172>>2]=O;c[a+5948>>2]=O;hg(o);hg(n);hg(l);i=b;return}function Rb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0,B=0,C=0;f=i;i=i+144|0;g=f+24|0;j=f+28|0;k=f+32|0;l=f+112|0;m=f+96|0;n=f+8|0;o=f+64|0;p=f;c[j>>2]=0;a[k]=0;a[l]=0;q=a[e]|0;if(q<<24>>24==0){r=n;c[r>>2]=1230328133;c[r+4>>2]=5787470;s=m+0|0;t=6e3|0;u=s+9|0;do{a[s]=a[t]|0;s=s+1|0;t=t+1|0}while((s|0)<(u|0))}else{c[g>>2]=q<<24>>24;Na(n|0,5968,g|0)|0;c[g>>2]=a[e]|0;Na(m|0,5984,g|0)|0}if((Pc(b,n,31,l)|0)==0?(Pc(b,5472,31,l)|0)!=0:0){g=n;c[g>>2]=1230328133;c[g+4>>2]=5787470}if((Pc(b,m,31,k)|0)==0?(Pc(b,6e3,31,k)|0)!=0:0){s=m+0|0;t=6e3|0;u=s+9|0;do{a[s]=a[t]|0;s=s+1|0;t=t+1|0}while((s|0)<(u|0))}g=a[l]|0;do{if(g<<24>>24==74){e=l+1|0;h[d+120>>3]=+ug(e);c[j>>2]=vg(e)|0;c[k>>2]=3492678;v=0;w=30}else if(!(g<<24>>24==66)){if((Ec(b,n,j)|0)!=0){Lc(b,n,d+120|0)|0;v=1;w=30;break}if((Ec(b,5344,j)|0)!=0){if((c[j>>2]|0)==0){c[j>>2]=1950;h[d+120>>3]=1950.0;v=0;w=30;break}else{Lc(b,5344,d+120|0)|0;v=1;w=30;break}}if((a[k]|0)!=0){if((Ag(k,5480,3)|0)==0){h[d+120>>3]=1950.0;c[j>>2]=1950;x=0;break}if((Ag(k,6016,4)|0)==0){h[d+120>>3]=2.0e3;c[j>>2]=2e3;x=0;break}if((Ag(k,5488,3)|0)==0){h[d+120>>3]=2.0e3;c[j>>2]=2e3;x=0;break}if((Ag(k,6024,3)|0)==0){h[d+120>>3]=2.0e3;c[j>>2]=2e3;x=0;break}if((Ag(k,6032,3)|0)==0){h[d+120>>3]=2.0e3;c[j>>2]=2e3;x=0}else{v=0;w=30}}else{v=0;w=30}}else{e=l+1|0;h[d+120>>3]=+ug(e);c[j>>2]=~~+ug(e);c[k>>2]=3427142;v=0;w=30}}while(0);do{if((w|0)==30){if((c[j>>2]|0)==0){h[d+120>>3]=2.0e3;c[j>>2]=2e3;l=d+3449|0;if((Ag(l,5656,2)|0)!=0?(Ag(l,4832,3)|0)!=0:0){x=v;break}c[k>>2]=3492678;x=v}else{x=v}}}while(0);v=d+128|0;do{if((Mc(b,5320,v)|0)==0){if((Mc(b,5336,v)|0)==0?(Lc(b,5344,v)|0)==0:0){y=+h[d+120>>3];h[v>>3]=y;z=y}else{w=43}}else{Pc(b,5320,32,o)|0;if(($f(o,84)|0)==0){if((Lc(b,5352,p)|0)!=0){y=+h[v>>3]+ +h[p>>3]/8765.812770744;h[v>>3]=y;z=y;break}if((Lc(b,5360,p)|0)!=0){y=+h[v>>3]+ +h[p>>3]/8765.812770744;h[v>>3]=y;z=y}else{w=43}}else{w=43}}}while(0);if((w|0)==43){z=+h[v>>3]}if(z==0.0){h[v>>3]=+h[d+120>>3]}do{if((a[k]|0)==0?(Pc(b,m,31,k)|0,(a[k]|0)==0):0){if((c[d+3884>>2]|0)!=7){v=d+3764|0;if((c[j>>2]|0)>1980){a[v]=3492678;a[v+1|0]=13643;a[v+2|0]=53;a[v+3|0]=0;break}else{a[v]=3427142;a[v+1|0]=13387;a[v+2|0]=52;a[v+3|0]=0;break}}}else{w=48}}while(0);do{if((w|0)==48?(m=d+3764|0,Lg(m|0,k|0)|0,(x|0)==0):0){if((Ag(m,5480,3)|0)==0){h[d+120>>3]=1950.0;break}if((Ag(m,5488,3)|0)==0){h[d+120>>3]=2.0e3;break}if((Ag(m,6016,4)|0)==0){h[d+120>>3]=2.0e3;break}if((Ag(m,6024,3)|0)==0?(c[j>>2]|0)==0:0){h[d+120>>3]=2.0e3}}}while(0);switch(a[d+3449|0]|0){case 71:{j=d+3764|0;s=j+0|0;t=6040|0;u=s+9|0;do{a[s]=a[t]|0;s=s+1|0;t=t+1|0}while((s|0)<(u|0));A=j;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return};case 72:{j=d+3764|0;s=j+0|0;t=6088|0;u=s+9|0;do{a[s]=a[t]|0;s=s+1|0;t=t+1|0}while((s|0)<(u|0));A=j;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return};case 65:{j=d+3764|0;a[j+0|0]=a[6104|0]|0;a[j+1|0]=a[6105|0]|0;a[j+2|0]=a[6106|0]|0;a[j+3|0]=a[6107|0]|0;a[j+4|0]=a[6108|0]|0;a[j+5|0]=a[6109|0]|0;A=j;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return};case 76:{j=d+3764|0;a[j+0|0]=a[5296|0]|0;a[j+1|0]=a[5297|0]|0;a[j+2|0]=a[5298|0]|0;a[j+3|0]=a[5299|0]|0;a[j+4|0]=a[5300|0]|0;a[j+5|0]=a[5301|0]|0;a[j+6|0]=a[5302|0]|0;A=j;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return};case 69:{j=d+3764|0;s=j+0|0;t=6056|0;u=s+9|0;do{a[s]=a[t]|0;s=s+1|0;t=t+1|0}while((s|0)<(u|0));A=j;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return};case 83:{j=d+3764|0;s=j+0|0;t=6072|0;u=s+9|0;do{a[s]=a[t]|0;s=s+1|0;t=t+1|0}while((s|0)<(u|0));A=j;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return};default:{A=d+3764|0;B=nc(A)|0;C=d+3884|0;c[C>>2]=B;i=f;return}}}function Sb(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0;d=i;e=b+3764|0;f=c[b+3260>>2]|0;if((a[e]|0)!=0){if((f|0)==0){g=0;j=3}else{k=f}}else{g=f;j=3}if((j|0)==3){a[e+0|0]=a[5296|0]|0;a[e+1|0]=a[5297|0]|0;a[e+2|0]=a[5298|0]|0;a[e+3|0]=a[5299|0]|0;a[e+4|0]=a[5300|0]|0;a[e+5|0]=a[5301|0]|0;a[e+6|0]=a[5302|0]|0;k=g}if((k|0)==-1){a[e+0|0]=a[5304|0]|0;a[e+1|0]=a[5305|0]|0;a[e+2|0]=a[5306|0]|0;a[e+3|0]=a[5307|0]|0;a[e+4|0]=a[5308|0]|0;a[e+5|0]=a[5309|0]|0}k=nc(e)|0;c[b+3884>>2]=k;do{if((k|0)!=2){g=b+3796|0;if((k|0)==1){a[g]=3492678;a[g+1|0]=13643;a[g+2|0]=53;a[g+3|0]=0;break}else{Lg(g|0,e|0)|0;break}}else{g=b+3796|0;a[g]=3427142;a[g+1|0]=13387;a[g+2|0]=52;a[g+3|0]=0}}while(0);c[b+3888>>2]=nc(b+3796|0)|0;k=b+120|0;h[b+3872>>3]=+h[k>>3];g=b+3828|0;Lg(g|0,e|0)|0;c[b+3880>>2]=nc(g)|0;h[b+3864>>3]=+h[k>>3];i=d;return}function Tb(a){a=a|0;var b=0,d=0,e=0;b=i;if((a|0)==0){i=b;return}if((c[a+3312>>2]|0)==0){hg(a);i=b;return}d=a+9312|0;e=c[d>>2]|0;if((e|0)!=0){Tb(e);c[d>>2]=0}Ub(a);d=c[a+9320>>2]|0;if((d|0)!=0){hg(d)}d=c[a+3980>>2]|0;if((d|0)!=0){hg(d)}d=c[a+3976>>2]|0;if((d|0)!=0){hg(d)}d=c[a+3168>>2]|0;if((d|0)!=0){rd(d)}d=c[a+3172>>2]|0;if((d|0)!=0){rd(d)}hg(a);i=b;return}function Ub(a){a=a|0;var b=0,d=0;b=i;d=c[1654]|0;if((d|0)!=0){hg(d);c[1654]=0}d=c[6620>>2]|0;if((d|0)!=0){hg(d);c[6620>>2]=0}d=c[6624>>2]|0;if((d|0)!=0){hg(d);c[6624>>2]=0}d=c[6628>>2]|0;if((d|0)!=0){hg(d);c[6628>>2]=0}d=c[6632>>2]|0;if((d|0)!=0){hg(d);c[6632>>2]=0}d=c[6636>>2]|0;if((d|0)!=0){hg(d);c[6636>>2]=0}d=c[6640>>2]|0;if((d|0)!=0){hg(d);c[6640>>2]=0}d=c[6644>>2]|0;if((d|0)!=0){hg(d);c[6644>>2]=0}d=c[6648>>2]|0;if((d|0)!=0){hg(d);c[6648>>2]=0}d=c[6652>>2]|0;if((d|0)!=0){hg(d);c[6652>>2]=0}if((a|0)==0){i=b;return}if((c[a+3312>>2]|0)==0){i=b;return}d=c[a+9208>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9212>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9216>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9220>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9224>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9228>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9232>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9236>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9240>>2]|0;if((d|0)!=0){hg(d)}d=c[a+9244>>2]|0;if((d|0)==0){i=b;return}hg(d);i=b;return}function Vb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+144|0;g=f;h=f+8|0;c[h>>2]=5130572;c[h+4>>2]=5265985;c[h+8>>2]=5266003;c[h+12>>2]=5128532;c[h+16>>2]=5130579;c[h+20>>2]=4674643;c[h+24>>2]=4411969;c[h+28>>2]=5132378;c[h+32>>2]=4277594;c[h+36>>2]=5392705;c[h+40>>2]=5265731;c[h+44>>2]=5390659;c[h+48>>2]=5391693;c[h+52>>2]=4277571;c[h+56>>2]=5263171;c[h+60>>2]=4476739;c[h+64>>2]=4542275;c[h+68>>2]=5197635;c[h+72>>2]=5132098;c[h+76>>2]=5194576;c[h+80>>2]=4998739;c[h+84>>2]=5390672;c[h+88>>2]=5523777;c[h+92>>2]=5001037;c[h+96>>2]=4412227;c[h+100>>2]=4412241;c[h+104>>2]=4412244;c[h+108>>2]=5260110;c[h+112>>2]=5459015;c[h+116>>2]=5460804;c[h+120>>2]=5524560;c[h+124>>2]=5787220;c[h+128>>2]=5787738;c[h+132>>2]=5656660;if((Ag(d,6128,4)|0)==0){a[d]=1313819736;a[d+1|0]=5132108;a[d+2|0]=20047;a[d+3|0]=78}j=b+3368|0;Lg(j|0,d|0)|0;k=b+3449|0;Lg(k|0,d|0)|0;l=b+3467|0;Lg(l|0,d|0)|0;do{if((Ag(d,6136,6)|0)!=0){if((Ag(d,6144,6)|0)==0){c[b+3260>>2]=-1;break}if((Qc(d,6152)|0)!=0){c[b+3260>>2]=-1;break}m=a[d]|0;if(!(m<<24>>24==65|m<<24>>24==68|m<<24>>24==82)?(a[d+1|0]|0)!=76:0){c[b+3260>>2]=0;i=f;return 0}a[k]=m;a[b+3450|0]=a[d+1|0]|0;m=a[d+2|0]|0;n=b+3451|0;do{if(!(m<<24>>24==45)){a[n]=m;o=a[d+3|0]|0;p=b+3452|0;if(o<<24>>24==45){a[p]=0;q=4;break}else{a[p]=o;a[b+3453|0]=0;q=4;break}}else{a[n]=0;q=3}}while(0);n=((a[d+q|0]|0)==45)+q|0;m=n+((a[d+n|0]|0)==45)|0;n=m+((a[d+m|0]|0)==45)|0;m=n+((a[d+n|0]|0)==45)|0;a[l]=a[d+m|0]|0;a[b+3468|0]=a[d+(m+1)|0]|0;a[b+3469|0]=a[d+(m+2)|0]|0;a[b+3470|0]=0;c[g>>2]=k;c[g+4>>2]=l;Na(j|0,6160,g|0)|0;if((a[j]|0)==32){a[j]=45}m=b+3369|0;if((a[m]|0)==32){a[m]=45}m=b+3370|0;if((a[m]|0)==32){a[m]=45}m=b+3371|0;if((a[m]|0)==32){a[m]=45}m=b+3372|0;if((a[m]|0)==32){a[m]=45}m=b+3373|0;if((a[m]|0)==32){a[m]=45}m=b+3374|0;if((a[m]|0)==32){a[m]=45}n=b+3375|0;if((a[n]|0)==32){a[n]=45}o=b+3260|0;c[o>>2]=0;p=0;r=1;while(1){if((Ag(l,h+(r<<2)|0,3)|0)==0){c[o>>2]=r;s=r}else{s=p}r=r+1|0;if((r|0)==34){break}else{p=s}}p=b+3324|0;r=c[p>>2]|0;if((r|0)==0){c[p>>2]=3;break}else if((r|0)==1){c[p>>2]=2}else if((r|0)!=2){break}if((s|0)==31){a[m]=65;a[n]=78;c[o>>2]=3;break}else if((s|0)==32){a[m]=80;a[n]=78;c[o>>2]=7;break}else{break}}else{c[b+3260>>2]=0}}while(0);do{if((Ag(e,6168,4)|0)!=0){if((Ag(e,6192,4)|0)==0){a[e]=a[d]|0;s=e+1|0;a[s+0|0]=a[6176|0]|0;a[s+1|0]=a[6177|0]|0;a[s+2|0]=a[6178|0]|0;c[b+3264>>2]=-90;s=b+3764|0;a[s]=4280403;a[s+1|0]=16720;a[s+2|0]=65;a[s+3|0]=0;c[b+3884>>2]=8;break}else{c[b+3264>>2]=0;break}}else{a[e]=a[d]|0;s=e+1|0;a[s+0|0]=a[6176|0]|0;a[s+1|0]=a[6177|0]|0;a[s+2|0]=a[6178|0]|0;c[b+3264>>2]=90;s=b+3764|0;a[s+0|0]=a[6184|0]|0;a[s+1|0]=a[6185|0]|0;a[s+2|0]=a[6186|0]|0;a[s+3|0]=a[6187|0]|0;a[s+4|0]=a[6188|0]|0;a[s+5|0]=a[6189|0]|0;c[b+3884>>2]=7}}while(0);s=b+3377|0;Lg(s|0,e|0)|0;h=b+3458|0;Lg(h|0,e|0)|0;do{if((Ag(e,6136,6)|0)!=0){if((Ag(e,6144,6)|0)==0){c[b+3260>>2]=-1;break}j=a[e]|0;if(!(j<<24>>24==65|j<<24>>24==68|j<<24>>24==82)?(a[e+1|0]|0)!=76:0){c[b+3260>>2]=0;break}a[h]=j;j=e+1|0;a[b+3459|0]=a[j]|0;k=a[e+2|0]|0;q=b+3460|0;do{if(!(k<<24>>24==45)){a[q]=k;r=a[e+3|0]|0;p=b+3461|0;if(r<<24>>24==45){a[p]=0;t=4;break}else{a[p]=r;a[b+3462|0]=0;t=4;break}}else{a[q]=0;t=3}}while(0);q=((a[e+t|0]|0)==45)+t|0;k=q+((a[e+q|0]|0)==45)|0;q=k+((a[e+k|0]|0)==45)|0;k=q+((a[e+q|0]|0)==45)|0;a[l]=a[e+k|0]|0;a[b+3468|0]=a[e+(k+1)|0]|0;a[b+3469|0]=a[e+(k+2)|0]|0;a[b+3470|0]=0;if((Ag(d,6120,3)|0)!=0?(Ag(d+1|0,6176,3)|0)!=0:0){c[b+3304>>2]=0}else{c[b+3304>>2]=1}if((a[j]|0)!=76?(a[e]|0)!=65:0){c[b+3292>>2]=0;c[b+3288>>2]=3}else{c[b+3292>>2]=1;c[b+3288>>2]=5}c[g>>2]=h;c[g+4>>2]=l;Na(s|0,6160,g|0)|0;if((a[s]|0)==32){a[s]=45}k=b+3378|0;if((a[k]|0)==32){a[k]=45}k=b+3379|0;if((a[k]|0)==32){a[k]=45}k=b+3380|0;if((a[k]|0)==32){a[k]=45}k=b+3381|0;if((a[k]|0)==32){a[k]=45}k=b+3382|0;if((a[k]|0)==32){a[k]=45}k=b+3383|0;if((a[k]|0)==32){a[k]=45}k=b+3384|0;if((a[k]|0)==32){a[k]=45}}else{c[b+3260>>2]=0}}while(0);$e(b,d);i=f;return 0}function Wb(a,b,d,e){a=a|0;b=+b;d=+d;e=+e;var f=0,g=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0;f=i;g=c[a+3316>>2]|0;j=a+760|0;h[j>>3]=b;k=a+768|0;l=d!=0.0?d:b;h[k>>3]=l;h[a+32>>3]=b;h[a+40>>3]=l;if((g|0)>0){m=(g|0)<2?g:2;g=0;n=a+832|0;while(1){o=0;p=n;while(1){h[p>>3]=(g|0)==(o|0)?1.0:0.0;o=o+1|0;if((o|0)==(m|0)){break}else{p=p+8|0}}g=g+1|0;if((g|0)==(m|0)){break}else{n=n+(m<<3)|0}}}c[a+3300>>2]=0;m=a+48|0;if(e<0.0){q=e+360.0}else{q=e}if(!(q>=360.0)){r=q}else{r=q+-360.0}h[m>>3]=r;q=r*3.141592653589793/180.0;r=+S(+q);if(b*d>0.0){s=-q}else{s=q}q=+T(+s);s=+h[j>>3];n=a+56|0;h[n>>3]=r*s;d=+h[k>>3];b=q*+P(+d);if(s<0.0){h[a+64>>3]=-b}else{h[a+64>>3]=b}b=q*+P(+s);if(d<0.0){h[a+72>>3]=b}else{h[a+72>>3]=-b}h[a+80>>3]=r*d;Bd(2,n,a+88|0)|0;lc(a);d=+h[j>>3];j=d<0.0;if((c[a+3304>>2]|0)!=0){if(j?+h[k>>3]>0.0:0){c[a+3256>>2]=1;r=+h[m>>3];b=r+-90.0;n=a+3200|0;if(b<-180.0){h[n>>3]=b+360.0;h[a+3208>>3]=r;h[a+3216>>3]=b+360.0;i=f;return}else{h[n>>3]=b;h[a+3208>>3]=r;h[a+3216>>3]=b;i=f;return}}do{if(d>0.0){if(!(+h[k>>3]<0.0)){if(!(+h[k>>3]>0.0)){break}c[a+3256>>2]=0;b=+h[m>>3]+90.0;n=a+3200|0;if(b>180.0){r=b+-360.0;h[n>>3]=r;h[a+3208>>3]=r;h[a+3216>>3]=b+-360.0;i=f;return}else{h[n>>3]=b;h[a+3208>>3]=b;h[a+3216>>3]=b;i=f;return}}else{c[a+3256>>2]=1;b=+h[m>>3];r=b+90.0;if(r>180.0){t=r+-360.0}else{t=r}h[a+3200>>3]=t;h[a+3208>>3]=b;r=b+-90.0;n=a+3216|0;h[n>>3]=r;if(!(r<-180.0)){i=f;return}h[n>>3]=r+360.0;i=f;return}}}while(0);if(!j){i=f;return}if(!(+h[k>>3]<0.0)){i=f;return}c[a+3256>>2]=0;t=+h[m>>3];r=t+-90.0;if(r<-180.0){u=r+360.0}else{u=r}h[a+3200>>3]=u;h[a+3208>>3]=u;u=t+90.0;n=a+3216|0;h[n>>3]=u;if(!(u>180.0)){i=f;return}h[n>>3]=u+-360.0;i=f;return}if(j?+h[k>>3]>0.0:0){c[a+3256>>2]=0;u=+h[m>>3];h[a+3200>>3]=u;t=u+90.0;if(t>180.0){v=t+-360.0}else{v=t}h[a+3208>>3]=v;v=u+180.0;n=a+3216|0;h[n>>3]=v;if(!(v>180.0)){i=f;return}h[n>>3]=v+-360.0;i=f;return}do{if(d>0.0){if(!(+h[k>>3]<0.0)){if(!(+h[k>>3]>0.0)){break}c[a+3256>>2]=1;v=+h[m>>3];h[a+3200>>3]=-v;u=90.0-v;if(u>180.0){w=u+-360.0}else{w=u}h[a+3208>>3]=w;h[a+3216>>3]=v;i=f;return}c[a+3256>>2]=0;v=+h[m>>3]+180.0;if(v>180.0){x=v+-360.0}else{x=v}h[a+3200>>3]=x;v=x+90.0;if(v>180.0){y=v+-360.0}else{y=v}h[a+3208>>3]=y;v=x+180.0;n=a+3216|0;h[n>>3]=v;if(!(v>180.0)){i=f;return}h[n>>3]=v+-360.0;i=f;return}}while(0);if(!j){i=f;return}if(!(+h[k>>3]<0.0)){i=f;return}c[a+3256>>2]=1;x=+h[m>>3];y=x+180.0;if(y>180.0){z=y+-360.0}else{z=y}h[a+3200>>3]=z;y=z+90.0;if(y>180.0){A=y+-360.0}else{A=y}h[a+3208>>3]=A;A=x+90.0;m=a+3216|0;h[m>>3]=A;if(!(A>180.0)){i=f;return}h[m>>3]=A+-360.0;i=f;return}function Xb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0.0;e=i;i=i+16|0;f=e;if((b|0)==0){i=e;return}g=b+3312|0;if((c[g>>2]|0)==0){i=e;return}do{if((((d|0)!=0?(a[d]|0)!=0:0)?(yg(d,6200)|0)!=0:0)?(yg(d,6208)|0)!=0:0){j=nc(d)|0;if((j|0)<0){i=e;return}l=c[b+3884>>2]|0;if((j|0)!=(l|0)&(l+ -5|0)>>>0<2){i=e;return}else{Lg(b+3796|0,d|0)|0;h[b+3872>>3]=+oc(d);m=j;break}}else{n=7}}while(0);do{if((n|0)==7){d=c[b+3884>>2]|0;j=b+3796|0;Lg(j|0,b+3764|0)|0;o=+h[b+120>>3];h[b+3872>>3]=o;if((d|0)==1){if(!(o!=2.0e3)){a[j+0|0]=a[6232|0]|0;a[j+1|0]=a[6233|0]|0;a[j+2|0]=a[6234|0]|0;a[j+3|0]=a[6235|0]|0;a[j+4|0]=a[6236|0]|0;a[j+5|0]=a[6237|0]|0;m=1;break}a[j]=74;h[k>>3]=o;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];Na(b+3797|0,6216,f|0)|0;l=b+((Dg(j|0)|0)+ -1)+3796|0;if((a[l]|0)==48){a[l]=0}l=b+((Dg(j|0)|0)+ -1)+3796|0;if((a[l]|0)==48){a[l]=0}l=b+((Dg(j|0)|0)+ -1)+3796|0;if((a[l]|0)!=48){m=1;break}a[l]=0;m=1;break}else if((d|0)==2){if(!(o!=1950.0)){a[j+0|0]=a[6224|0]|0;a[j+1|0]=a[6225|0]|0;a[j+2|0]=a[6226|0]|0;a[j+3|0]=a[6227|0]|0;a[j+4|0]=a[6228|0]|0;a[j+5|0]=a[6229|0]|0;m=2;break}a[j]=66;h[k>>3]=o;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];Na(b+3797|0,6216,f|0)|0;l=b+((Dg(j|0)|0)+ -1)+3796|0;if((a[l]|0)==48){a[l]=0}l=b+((Dg(j|0)|0)+ -1)+3796|0;if((a[l]|0)==48){a[l]=0}l=b+((Dg(j|0)|0)+ -1)+3796|0;if((a[l]|0)!=48){m=2;break}a[l]=0;m=2;break}else{m=d;break}}}while(0);c[b+3888>>2]=m;if((c[g>>2]|0)==0){i=e;return}switch(m|0){case 5:{c[b+3292>>2]=1;c[b+3288>>2]=5;i=e;return};case 8:case 7:{c[b+3292>>2]=1;c[b+3288>>2]=5;i=e;return};case 9:case 4:case 3:{c[b+3292>>2]=1;c[b+3288>>2]=5;i=e;return};default:{c[b+3292>>2]=0;c[b+3288>>2]=3;i=e;return}}}function Yb(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=i;i=i+32|0;e=d;f=d+8|0;if((b|0)==0){i=d;return}g=b+3312|0;if((c[g>>2]|0)==0){i=d;return}h=0;a:while(1){if((h|0)==0){j=f+0|0;k=6656|0;l=j+12|0;do{a[j]=a[k]|0;j=j+1|0;k=k+1|0}while((j|0)<(l|0))}else{c[e>>2]=h;Na(f|0,6672,e|0)|0}k=c[6616+(h<<2)>>2]|0;b:do{if((k|0)!=0){if((c[g>>2]|0)!=0?(j=Dg(k|0)|0,(j|0)>0):0){l=b+(h<<2)+9208|0;m=c[l>>2]|0;if((m|0)!=0){hg(m)}m=ig(j+2|0,1)|0;c[l>>2]=m;if((m|0)!=0){n=m;m=0;do{o=a[k+m|0]|0;a[n+m|0]=o<<24>>24==95?32:o;m=m+1|0;n=c[l>>2]|0}while((m|0)!=(j|0));a[n+j|0]=0}}}else{m=Wa(f|0)|0;if((m|0)!=0){if((c[g>>2]|0)==0){break}l=Dg(m|0)|0;if((l|0)<=0){break}o=b+(h<<2)+9208|0;p=c[o>>2]|0;if((p|0)!=0){hg(p)}p=ig(l+2|0,1)|0;c[o>>2]=p;if((p|0)==0){break}else{q=p;r=0}do{p=a[m+r|0]|0;a[q+r|0]=p<<24>>24==95?32:p;r=r+1|0;q=c[o>>2]|0}while((r|0)!=(l|0));a[q+l|0]=0;break}switch(h|0){case 4:{if((c[g>>2]|0)!=0){o=b+9224|0;m=c[o>>2]|0;if((m|0)!=0){hg(m)}m=ig(13,1)|0;c[o>>2]=m;if((m|0)==0){break b}a[m]=115;a[m+1|0]=112;a[m+2|0]=112;a[m+3|0]=109;a[m+4|0]=32;a[m+5|0]=45;a[m+6|0]=97;a[m+7|0]=104;a[m+8|0]=32;a[m+9|0]=37;a[m+10|0]=115;a[m+11|0]=0;break b}break};case 2:{if((c[g>>2]|0)!=0){m=b+9216|0;o=c[m>>2]|0;if((o|0)!=0){hg(o)}o=ig(13,1)|0;c[m>>2]=o;if((o|0)==0){break b}a[o]=115;a[o+1|0]=103;a[o+2|0]=115;a[o+3|0]=99;a[o+4|0]=32;a[o+5|0]=45;a[o+6|0]=97;a[o+7|0]=104;a[o+8|0]=32;a[o+9|0]=37;a[o+10|0]=115;a[o+11|0]=0;break b}break};case 3:{if((c[g>>2]|0)!=0){o=b+9220|0;m=c[o>>2]|0;if((m|0)!=0){hg(m)}m=ig(13,1)|0;c[o>>2]=m;if((m|0)==0){break b}a[m]=115;a[m+1|0]=116;a[m+2|0]=121;a[m+3|0]=50;a[m+4|0]=32;a[m+5|0]=45;a[m+6|0]=97;a[m+7|0]=104;a[m+8|0]=32;a[m+9|0]=37;a[m+10|0]=115;a[m+11|0]=0;break b}break};case 5:{if((c[g>>2]|0)!=0){m=b+9228|0;o=c[m>>2]|0;if((o|0)!=0){hg(o)}o=ig(13,1)|0;c[m>>2]=o;if((o|0)==0){break b}a[o]=115;a[o+1|0]=115;a[o+2|0]=97;a[o+3|0]=111;a[o+4|0]=32;a[o+5|0]=45;a[o+6|0]=97;a[o+7|0]=104;a[o+8|0]=32;a[o+9|0]=37;a[o+10|0]=115;a[o+11|0]=0;break b}break};case 1:{if((c[g>>2]|0)!=0){o=b+9212|0;m=c[o>>2]|0;if((m|0)!=0){hg(m)}m=ig(13,1)|0;c[o>>2]=m;if((m|0)==0){break b}a[m]=115;a[m+1|0]=117;a[m+2|0]=97;a[m+3|0]=50;a[m+4|0]=32;a[m+5|0]=45;a[m+6|0]=97;a[m+7|0]=104;a[m+8|0]=32;a[m+9|0]=37;a[m+10|0]=115;a[m+11|0]=0;break b}break};default:{c[b+(h<<2)+9208>>2]=0;break b}}h=h+1|0;continue a}}while(0);h=h+1|0;if((h|0)==10){break}}i=d;return}function Zb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0.0,l=0.0;d=i;if((b|0)==0){i=d;return}c[a+3300>>2]=1;e=a+56|0;h[e>>3]=+h[b>>3];f=b+8|0;h[a+64>>3]=+h[f>>3];g=b+16|0;h[a+72>>3]=+h[g>>3];j=b+24|0;h[a+80>>3]=+h[j>>3];Bd(2,e,a+88|0)|0;k=+h[b>>3];l=+h[g>>3];b=a+32|0;h[b>>3]=+Q(+(k*k+l*l));l=+h[f>>3];k=+h[j>>3];j=a+40|0;h[j>>3]=+Q(+(l*l+k*k));if((c[a+3304>>2]|0)!=0){k=+h[f>>3];h[f>>3]=-+h[g>>3];h[g>>3]=-k}lc(a);c[a+3312>>2]=1;ac(a);h[a+760>>3]=+h[b>>3];h[a+768>>3]=+h[j>>3];i=d;return}function _b(a){a=a|0;var b=0;b=i;Lg(6536,a|0)|0;i=b;return}function $b(a,b,d,e){a=a|0;b=+b;d=+d;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;if((e|0)==0){i=f;return}g=a+3316|0;j=c[g>>2]|0;if((j+ -1|0)>>>0>8){k=c[a+3320>>2]|0;c[g>>2]=k;l=k}else{l=j}j=a+760|0;h[j>>3]=b;k=a+768|0;m=d!=0.0?d:b;h[k>>3]=m;h[a+32>>3]=b;h[a+40>>3]=m;if((l|0)>0){g=0;n=e;o=a+832|0;while(1){p=n+(l<<3)|0;q=0;r=n;s=o;while(1){h[s>>3]=+h[r>>3];q=q+1|0;if((q|0)==(l|0)){break}else{r=r+8|0;s=s+8|0}}s=g+1|0;if((s|0)==(l|0)){break}else{g=s;n=p;o=o+(l<<3)|0}}m=+h[j>>3];j=a+56|0;h[j>>3]=+h[e>>3]*m;if((l|0)>1){h[a+64>>3]=+h[e+8>>3]*m;m=+h[k>>3];h[a+72>>3]=+h[e+(l<<3)>>3]*m;h[a+80>>3]=+h[e+(l+1<<3)>>3]*m;t=j}else{u=j;v=11}}else{j=a+56|0;h[j>>3]=+h[e>>3]*b;u=j;v=11}if((v|0)==11){v=a+64|0;j=a+80|0;c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[v+12>>2]=0;h[j>>3]=1.0;t=u}Bd(2,t,a+88|0)|0;c[a+3300>>2]=1;Ad(a+3956|0)|0;c[a+3312>>2]=1;ac(a);i=f;return}function ac(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0;b=i;i=i+64|0;d=b+48|0;e=b+24|0;f=b+16|0;g=b+40|0;j=b;k=b+32|0;l=b+8|0;if(!(+h[a+136>>3]<1.5)?!(+h[a+144>>3]<1.5):0){if((c[a+3884>>2]|0)==6){i=b;return}m=a+32|0;h[m>>3]=+P(+(+h[m>>3]));n=a+40|0;h[n>>3]=+P(+(+h[n>>3]));o=+h[a+16>>3];p=+h[a+24>>3];bc(a,o,p,e,f);q=a+3304|0;r=+h[e>>3];if((c[q>>2]|0)==0){s=+h[f>>3];e=a+3828|0;ic(a,r+ +h[m>>3],s,e,j,l,d);ic(a,r,s+ +h[n>>3],e,g,k,d)}else{s=+h[f>>3];f=a+3828|0;ic(a,r+ +h[n>>3],s,f,j,l,d);ic(a,r,s+ +h[m>>3],f,g,k,d)}s=+Y(+(+h[k>>3]-p),+(+h[g>>3]-o))*180.0/3.141592653589793;if(s<-90.0){t=s+360.0}else{t=s}h[a+3208>>3]=t;s=+Y(+(+h[l>>3]-p),+(+h[j>>3]-o))*180.0/3.141592653589793;if(s<-90.0){u=s+360.0}else{u=s}h[a+3216>>3]=u;if(t<-90.0){s=t+270.0;h[a+3200>>3]=s;v=s}else{s=t+-90.0;h[a+3200>>3]=s;v=s}j=(c[q>>2]|0)==0;if(!j){s=v+90.0;q=a+48|0;h[q>>3]=s;if(s<0.0){o=s+360.0;h[q>>3]=o;w=o}else{w=s}}else{h[a+48>>3]=v;w=v}q=a+48|0;if(w<0.0){v=w+360.0;h[q>>3]=v;x=v}else{x=w}if(x>=360.0){h[q>>3]=x+-360.0}x=u-t;w=t-u;q=w>80.0&w<100.0?1:x<280.0&x>260.0?1:x<-80.0&x>-100.0&1;c[a+3256>>2]=q;l=(q|0)!=0;if(j){if(l){i=b;return}h[m>>3]=-+h[m>>3];i=b;return}else{if(!l){i=b;return}h[n>>3]=-+h[n>>3];i=b;return}}x=+h[a+48>>3];h[a+3200>>3]=x;h[a+3208>>3]=x+90.0;h[a+3216>>3]=x+180.0;i=b;return}function bc(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0.0;g=i;i=i+144|0;j=g+104|0;k=g+56|0;l=g+8|0;m=g+40|0;n=g+136|0;o=g;p=g+48|0;q=g+96|0;r=g+88|0;if((a|0)==0){i=g;return}if((c[a+3312>>2]|0)==0){i=g;return}h[a+576>>3]=b;h[a+584>>3]=d;h[a+592>>3]=+h[815];s=a+3308|0;c[s>>2]=0;t=c[a+9312>>2]|0;if((t|0)==0){_e(a,b,d,o,p)}else{bc(t,b,d,o,p)}t=a+3260|0;u=c[t>>2]|0;do{if((u|0)==30){if((bd(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=24}else{c[s>>2]=1;w=0.0;x=0.0}}else if((u|0)==31){if((ed(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=24}else{c[s>>2]=1;w=0.0;x=0.0}}else if((u|0)==32){if((ld(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=24}else{c[s>>2]=1;w=0.0;x=0.0}}else if((u|0)==29){if((nd(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=24}else{c[s>>2]=1;w=0.0;x=0.0}}else{d=+h[o>>3];b=+h[p>>3];if((c[a+3324>>2]|0)==2|(u|0)<1){if(($c(d,b,a,q,r)|0)==0){v=24;break}c[s>>2]=1;w=0.0;x=0.0;break}h[q>>3]=0.0;h[r>>3]=0.0;h[l>>3]=d;h[l+8>>3]=b;if((u+ -24|0)>>>0<3){h[l+16>>3]=+((c[1632]|0)+1|0)}else{h[l+16>>3]=+h[815]}h[l+24>>3]=1.0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;c[k+16>>2]=0;c[k+20>>2]=0;c[k+24>>2]=0;c[k+28>>2]=0;if((zd(a+3368|0,a+3924|0,l,a+3956|0,k,a+4064|0,m,n,a+688|0,a+3984|0,j)|0)==0){h[q>>3]=+h[j+(c[a+3944>>2]<<3)>>3];h[r>>3]=+h[j+(c[a+3948>>2]<<3)>>3];v=24;break}else{c[s>>2]=1;w=0.0;x=0.0;break}}}while(0);if((v|0)==24){if((c[s>>2]|0)==0){if((c[t>>2]|0)>0){mc(c[a+3884>>2]|0,c[a+3888>>2]|0,+h[a+120>>3],+h[a+3872>>3],q,r,+h[a+128>>3])}t=c[a+3264>>2]|0;if((t|0)==90){b=90.0- +h[r>>3];h[r>>3]=b;y=b}else if((t|0)==-90){b=+h[r>>3]+-90.0;h[r>>3]=b;y=b}else{y=+h[r>>3]}b=+h[q>>3];h[a+600>>3]=b;h[a+608>>3]=y;w=y;x=b}else{w=0.0;x=0.0}}h[e>>3]=x;h[f>>3]=w;f=c[a+3888>>2]|0;if((f|0)<1){i=g;return}if((f|0)==6|(f|0)==10){i=g;return}w=+h[e>>3];if(w<0.0){h[e>>3]=w+360.0;i=g;return}if(!(w>360.0)){i=g;return}h[e>>3]=w+-360.0;i=g;return}function cc(a,b,c,d,e,f){a=a|0;b=+b;c=+c;d=d|0;e=e|0;f=f|0;var g=0;g=i;ic(a,b,c,a+3828|0,d,e,f);i=g;return}function dc(b,d,e,f,g){b=b|0;d=+d;e=+e;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+96|0;k=j+16|0;l=j+8|0;m=j;n=j+56|0;o=j+24|0;if((b|0)!=0?(c[b+3312>>2]|0)!=0:0){bc(b,d,e,l,m);if((c[b+3308>>2]|0)!=0){p=f;q=p;a[q]=543581775;a[q+1|0]=2123366;a[q+2|0]=8294;a[q+3|0]=32;q=p+4|0;a[q]=7364973;a[q+1|0]=28769;a[q+2|0]=112;a[q+3|0]=0;r=1;i=j;return r|0}q=c[b+3292>>2]|0;do{if((q|0)==0){p=b+3288|0;s=c[p>>2]|0;t=(s<<1)+18|0;if((t|0)>=(g|0)){if((c[b+3296>>2]|0)==0){Hg(f|0,6336,g|0)|0;u=0;break}else{Hg(f|0,6304,g|0)|0;u=0;break}}e=+h[l>>3];if(((c[b+3888>>2]|0)+ -1|0)>>>0<2){Tc(n,32,e,s);Uc(o,32,+h[m>>3],(c[p>>2]|0)+ -1|0)}else{Uc(n,32,e,s);Uc(o,32,+h[m>>3],c[p>>2]|0)}if((c[b+3296>>2]|0)==0){c[k>>2]=n;c[k+4>>2]=o;Na(f|0,6248,k|0)|0}else{c[k>>2]=n;c[k+4>>2]=o;Na(f|0,6240,k|0)|0}u=g-t|0}else if((q|0)==1){t=b+3288|0;p=c[t>>2]|0;s=(p<<1)+9|0;if((s|0)>=(g|0)){if((c[b+3296>>2]|0)==0){Hg(f|0,6280,g|0)|0;u=0;break}else{Hg(f|0,6256,g|0)|0;u=0;break}}Vc(n,32,+h[l>>3],p);Vc(o,32,+h[m>>3],c[t>>2]|0);if((c[b+3296>>2]|0)==0){c[k>>2]=n;c[k+4>>2]=o;Na(f|0,6248,k|0)|0}else{c[k>>2]=n;c[k+4>>2]=o;Na(f|0,6240,k|0)|0}u=g-s|0}else{u=g}}while(0);switch(c[b+3888>>2]|0){case 5:{if((u|0)<=7){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}q=(c[b+3296>>2]|0)==0;s=f+(Dg(f|0)|0)|0;if(q){q=s;t=q;a[t]=1953259808;a[t+1|0]=7629921;a[t+2|0]=29804;a[t+3|0]=116;t=q+4|0;a[t]=8020269;a[t+1|0]=31329;a[t+2|0]=122;a[t+3|0]=0;r=1;i=j;return r|0}else{t=s;s=t;a[s]=1953259785;a[s+1|0]=7629921;a[s+2|0]=29804;a[s+3|0]=116;s=t+4|0;a[s]=8020269;a[s+1|0]=31329;a[s+2|0]=122;a[s+3|0]=0;r=1;i=j;return r|0}break};case 4:{if((u|0)<=9){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}s=(c[b+3296>>2]|0)==0;t=f+(Dg(f|0)|0)|0;if(s){v=t+0|0;w=6416|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}else{v=t+0|0;w=6400|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}break};case 9:{if((u|0)<=9){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}t=(c[b+3296>>2]|0)==0;s=f+(Dg(f|0)|0)|0;if(t){t=s;q=t;a[q]=1634496544;a[q+1|0]=6384752;a[q+2|0]=24940;a[q+3|0]=97;q=t+4|0;a[q]=7628142;a[q+1|0]=29797;a[q+2|0]=116;a[q+3|0]=0;r=1;i=j;return r|0}else{q=s;s=q;a[s]=1634496521;a[s+1|0]=6384752;a[s+2|0]=24940;a[s+3|0]=97;s=q+4|0;a[s]=7628142;a[s+1|0]=29797;a[s+2|0]=116;a[s+3|0]=0;r=1;i=j;return r|0}break};case 8:{if((u|0)<=7){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}s=(c[b+3296>>2]|0)==0;q=f+(Dg(f|0)|0)|0;if(s){v=q+0|0;w=6480|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}else{v=q+0|0;w=6464|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}break};case 7:{if((u|0)<=7){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}q=(c[b+3296>>2]|0)==0;s=f+(Dg(f|0)|0)|0;if(q){v=s+0|0;w=6448|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}else{v=s+0|0;w=6432|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}break};case 1:case 2:{s=b+3796|0;if((u|0)<=((Dg(s|0)|0)+1|0)){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}q=(c[b+3296>>2]|0)==0;t=f+(Dg(f|0)|0)|0;p=q?32:9;a[t]=p;a[t+1|0]=p>>8;Fg(f|0,s|0)|0;r=1;i=j;return r|0};case 3:{if((u|0)<=9){r=1;i=j;return r|0}if((c[b+3284>>2]|0)==0){r=1;i=j;return r|0}s=(c[b+3296>>2]|0)==0;p=f+(Dg(f|0)|0)|0;if(s){v=p+0|0;w=6384|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}else{v=p+0|0;w=6368|0;x=v+10|0;do{a[v]=a[w]|0;v=v+1|0;w=w+1|0}while((v|0)<(x|0));r=1;i=j;return r|0}break};default:{w=b+3288|0;Wc(n,+h[l>>3],0,c[w>>2]|0);Wc(o,+h[m>>3],0,c[w>>2]|0);w=Dg(n|0)|0;m=w+1+(Dg(o|0)|0)|0;l=b+3476|0;v=b+3508|0;x=(Dg(l|0)|0)+2+(Dg(v|0)|0)|0;p=b+3884|0;if(((c[p>>2]|0)==6?(c[b+3328>>2]|0)==1:0)?(s=x+m|0,(u|0)>(s|0)):0){if((a[l]|0)!=0){t=n+w|0;a[t]=32;a[t+1|0]=0;Fg(n|0,l|0)|0}if((a[v]|0)==0){y=s}else{t=o+(Dg(o|0)|0)|0;a[t]=32;a[t+1|0]=0;Fg(o|0,v|0)|0;y=s}}else{y=m}m=(c[b+3296>>2]|0)!=0;do{if((u|0)>(y|0)){if(m){c[k>>2]=n;c[k+4>>2]=o;Na(f|0,6240,k|0)|0;break}else{c[k>>2]=n;c[k+4>>2]=o;Na(f|0,6248,k|0)|0;break}}else{if(m){Hg(f|0,6496,u|0)|0;break}else{Hg(f|0,6280,u|0)|0;break}}}while(0);if((c[p>>2]|0)!=6){r=1;i=j;return r|0}m=b+3328|0;if((c[m>>2]|0)==1){r=1;i=j;return r|0}if((u|0)>(y+7|0)?(b=f+(Dg(f|0)|0)|0,k=b,a[k]=1852402720,a[k+1|0]=7235948,a[k+2|0]=28265,a[k+3|0]=110,k=b+4|0,a[k]=7496037,a[k+1|0]=29281,a[k+2|0]=114,a[k+3|0]=0,(c[p>>2]|0)!=6):0){r=1;i=j;return r|0}if((c[m>>2]|0)!=2){r=1;i=j;return r|0}if((u|0)<=(x+7+y|0)){r=1;i=j;return r|0}if((a[l]|0)!=0){y=f+(Dg(f|0)|0)|0;a[y]=32;a[y+1|0]=0;Fg(f|0,l|0)|0}if((a[v]|0)==0){r=1;i=j;return r|0}l=f+(Dg(f|0)|0)|0;a[l]=32;a[l+1|0]=0;Fg(f|0,v|0)|0;r=1;i=j;return r|0}}}if((g|0)<=0){r=0;i=j;return r|0}a[f]=0;r=0;i=j;return r|0}function ec(a,b,c,d){a=+a;b=+b;c=+c;d=+d;var e=0,f=0,g=0;e=i;i=i+48|0;f=e+24|0;g=e;Ac(a,b,1.0,f);Ac(c,d,1.0,g);d=+h[f>>3]- +h[g>>3];c=+h[f+8>>3]- +h[g+8>>3];b=+h[f+16>>3]- +h[g+16>>3];a=(d*d+0.0+c*c+b*b)*.25;b=a>1.0?1.0:a;a=+Y(+(+Q(+b)),+(+Q(+(1.0-b))))*2.0*180.0/3.141592653589793;i=e;return+a}function fc(a){a=a|0;var b=0;if((a|0)==0){b=0}else{b=(c[a+3312>>2]|0)!=0}return(b?a+3796|0:0)|0}function gc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;if((a|0)!=0?(c[a+3312>>2]|0)!=0:0){e=a+3292|0;f=c[e>>2]|0;c[e>>2]=b;if((b|0)==1&(f|0)==0?(e=a+3288|0,(c[e>>2]|0)==3):0){c[e>>2]=6}if((b|0)==0&(f|0)==1){b=a+3288|0;if((c[b>>2]|0)==5){c[b>>2]=3;g=1}else{g=1}}else{g=f}}else{g=0}i=d;return g|0}function hc(a){a=a|0;var b=0;if((a|0)==0){b=0}else{b=(c[a+3312>>2]|0)!=0}return(b?a+3764|0:0)|0}function ic(a,b,d,e,f,g,j){a=a|0;b=+b;d=+d;e=e|0;f=f|0;g=g|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0.0,t=0.0,u=0.0,v=0;k=i;i=i+32|0;l=k+24|0;m=k+16|0;n=k+8|0;o=k;if((a|0)==0){i=k;return}if((c[a+3312>>2]|0)==0){i=k;return}c[j>>2]=0;h[l>>3]=b;h[m>>3]=d;p=c[a+3264>>2]|0;if((p|0)==90){h[m>>3]=90.0-d}else if((p|0)==-90){h[m>>3]=d+-90.0}if((e|0)==0){q=+h[a+120>>3];r=c[a+3884>>2]|0}else{p=nc(e)|0;q=+oc(e);r=p}h[a+592>>3]=1.0;if((r|0)>0?!((r|0)==6|(r|0)==10):0){mc(r,c[a+3884>>2]|0,q,+h[a+120>>3],l,m,+h[a+128>>3])}r=c[a+3260>>2]|0;do{if((r|0)==32){if((md(+h[l>>3],+h[m>>3],a,n,o)|0)!=0){c[j>>2]=1}}else if((r|0)==30){if((cd(+h[l>>3],+h[m>>3],a,n,o)|0)!=0){c[j>>2]=1}}else if((r|0)==29){if((od(+h[l>>3],+h[m>>3],a,n,o)|0)!=0){c[j>>2]=1}}else if((r|0)==31){if((fd(+h[l>>3],+h[m>>3],a,n,o)|0)!=0){c[j>>2]=1}}else{q=+h[l>>3];s=+h[m>>3];if((c[a+3324>>2]|0)==2|(r|0)<1){if((ad(q,s,a,n,o)|0)==0){break}c[j>>2]=1;break}else{if((jc(q,s,a,n,o)|0)==0){break}c[j>>2]=1;break}}}while(0);r=c[a+9312>>2]|0;s=+h[n>>3];q=+h[o>>3];do{if((r|0)==0){Ze(a,s,q,f,g);o=c[j>>2]|0;if((o|0)==0){t=+h[f>>3];if(!(t<.5)?(u=+h[g>>3],!(u<.5)):0){if(!(t>+h[a+136>>3]+.5)?!(u>+h[a+144>>3]+.5):0){v=0;break}c[j>>2]=2;v=2;break}c[j>>2]=2;v=2}else{v=o}}else{ic(r,s,q,0,f,g,j);v=c[j>>2]|0}}while(0);c[a+3308>>2]=v;h[a+600>>3]=b;h[a+608>>3]=d;h[a+576>>3]=+h[f>>3];h[a+584>>3]=+h[g>>3];i=k;return}function jc(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+112|0;j=g+80|0;k=g+48|0;l=g+16|0;m=g+8|0;n=g;h[e>>3]=0.0;h[f>>3]=0.0;o=d+3924|0;if((c[o>>2]|0)!=137){p=d+3368|0;if((xd(c[d+3960>>2]|0,p,o)|0)==0){q=p}else{r=1;i=g;return r|0}}else{q=d+3368|0}p=d+3944|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[j+16>>2]=0;c[j+20>>2]=0;c[j+24>>2]=0;c[j+28>>2]=0;h[j+(c[p>>2]<<3)>>3]=a;h[j+(c[d+3948>>2]<<3)>>3]=b;p=l+16|0;c[l+0>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;c[l+12>>2]=0;h[p>>3]=1.0;h[l+24>>3]=1.0;s=k+16|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;h[s>>3]=1.0;h[k+24>>3]=1.0;s=yd(q,o,j,d+688|0,d+3984|0,m,n,d+4064|0,k,d+3956|0,l)|0;if((s|0)!=0){r=s;i=g;return r|0}h[e>>3]=+h[l>>3];h[f>>3]=+h[l+8>>3];b=+h[p>>3];if(((c[d+3260>>2]|0)+ -24|0)>>>0<3){h[d+592>>3]=b+-1.0;r=0;i=g;return r|0}else{h[d+592>>3]=b;r=0;i=g;return r|0}return 0}function kc(){return c[1528]|0}function lc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0;b=i;d=a+3316|0;e=c[d>>2]|0;f=(e|0)>2?2:e;if((f+ -1|0)>>>0>8){e=c[a+3320>>2]|0;c[d>>2]=e;g=e}else{g=f}f=aa(g<<3,g)|0;e=a+3976|0;d=c[e>>2]|0;if((d|0)==0){j=gg(f)|0;c[e>>2]=j;if((j|0)==0){i=b;return}else{k=j}}else{k=d}d=a+3980|0;if((c[d>>2]|0)==0?(j=gg(f)|0,c[d>>2]=j,(j|0)==0):0){i=b;return}j=a+3956|0;c[j>>2]=137;if((g|0)==3){l=k+0|0;m=l+72|0;do{c[l>>2]=0;l=l+4|0}while((l|0)<(m|0));f=c[e>>2]|0;h[f>>3]=+h[a+56>>3];h[f+8>>3]=+h[a+64>>3];h[f+24>>3]=+h[a+72>>3];h[f+32>>3]=+h[a+80>>3];h[f+64>>3]=1.0;n=f}else if((g|0)==2){h[k>>3]=+h[a+56>>3];h[k+8>>3]=+h[a+64>>3];h[k+16>>3]=+h[a+72>>3];h[k+24>>3]=+h[a+80>>3];n=k}else if((g|0)==4){l=k+0|0;m=l+128|0;do{c[l>>2]=0;l=l+4|0}while((l|0)<(m|0));l=c[e>>2]|0;h[l>>3]=+h[a+56>>3];h[l+8>>3]=+h[a+64>>3];h[l+32>>3]=+h[a+72>>3];h[l+40>>3]=+h[a+80>>3];h[l+80>>3]=1.0;h[l+120>>3]=1.0;n=l}else{n=k}Bd(g,n,c[d>>2]|0)|0;c[a+3964>>2]=a+616;c[a+3972>>2]=a+760;c[a+3968>>2]=a+832;c[j>>2]=137;i=b;return}function mc(a,b,c,d,e,f,g){a=a|0;b=b|0;c=+c;d=+d;e=e|0;f=f|0;g=+g;var j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0,r=0,s=0,t=0.0;j=i;i=i+32|0;k=j+24|0;l=j+16|0;m=j+8|0;n=j;if(c==0.0){o=(a|0)==2?1950.0:2.0e3}else{o=c}if(d==0.0){p=(b|0)==2?1950.0:2.0e3}else{p=d}q=(b|0)==11;r=(a|0)==1&q&o==2.0e3;d=r?o:(a|0)==11&q?o:p;q=r?b:a;a=(b|0)==1;r=(q|0)==11&a&d==2.0e3;p=r?d:o;s=r?b:q;if((s|0)==(b|0)&p==d){i=j;return}q=p!=d;if(q){if((s|0)==2&p!=1950.0){xc(p,1950.0,e,f)}if((s|0)==1&p!=2.0e3){yc(p,2.0e3,e,f)}}r=(b|0)==2;do{if(r){if((s|0)==3){sc(e,f);break}else if((s|0)==4){if(g>0.0){wc(e,f,g);h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;pc(e,f,m,n,k,l);p=g+-1950.0;h[e>>3]=+h[e>>3]+p*+h[m>>3];h[f>>3]=+h[f>>3]+p*+h[n>>3];break}else{wc(e,f,1950.0);h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;pc(e,f,m,n,k,l);h[e>>3]=+h[e>>3]+ +h[m>>3]*0.0;h[f>>3]=+h[f>>3]+ +h[n>>3]*0.0;break}}else if((s|0)==1){if(g>0.0){h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;pc(e,f,m,n,k,l);p=g+-1950.0;h[e>>3]=+h[e>>3]+p*+h[m>>3];h[f>>3]=+h[f>>3]+p*+h[n>>3];break}else{h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;pc(e,f,m,n,k,l);break}}else{break}}else{if((b|0)==4){if((s|0)==1){if(g>0.0){vc(e,f,g);break}else{vc(e,f,2.0e3);break}}else if((s|0)==3){uc(e,f);if(g>0.0){vc(e,f,g);break}else{vc(e,f,2.0e3);break}}else if((s|0)==2){if(g>0.0){h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;qc(e,f,m,n,k,l);p=g+-2.0e3;h[e>>3]=+h[e>>3]+p*+h[m>>3];h[f>>3]=+h[f>>3]+p*+h[n>>3];vc(e,f,g);break}else{h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;qc(e,f,m,n,k,l);h[e>>3]=+h[e>>3]+ +h[m>>3]*-50.0;h[f>>3]=+h[f>>3]+ +h[n>>3]*-50.0;vc(e,f,1950.0);break}}else{break}}else if((b|0)==3){if((s|0)==4){if(g>0.0){wc(e,f,g)}else{wc(e,f,2.0e3)}tc(e,f);break}else if((s|0)==2){rc(e,f);break}else if((s|0)==1){tc(e,f);break}else{break}}else if((b|0)==1){if((s|0)==3){uc(e,f);break}else if((s|0)==4){if(g>0.0){wc(e,f,g);break}else{wc(e,f,2.0e3);break}}else if((s|0)==2){if(g>0.0){h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;qc(e,f,m,n,k,l);p=g+-2.0e3;h[e>>3]=+h[e>>3]+p*+h[m>>3];h[f>>3]=+h[f>>3]+p*+h[n>>3];break}else{h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;qc(e,f,m,n,k,l);break}}else{break}}else{break}}}while(0);if(q){if(r&d!=1950.0){xc(1950.0,d,e,f)}if(a&d!=2.0e3){yc(2.0e3,d,e,f)}}d=+h[f>>3];do{if(!(d>90.0)){if(d<-90.0){h[f>>3]=-180.0-d;g=+h[e>>3]+180.0;h[e>>3]=g;t=g;break}else{t=+h[e>>3];break}}else{h[f>>3]=180.0-d;g=+h[e>>3]+180.0;h[e>>3]=g;t=g}}while(0);if(t>360.0){h[e>>3]=t+-360.0;i=j;return}if(!(t<0.0)){i=j;return}h[e>>3]=t+360.0;i=j;return}function nc(b){b=b|0;var c=0,d=0,e=0,f=0.0;c=i;d=a[b]|0;a:do{if((((((!(d<<24>>24==106|d<<24>>24==74)?(yg(b,6688)|0)!=0:0)?(yg(b,6696)|0)!=0:0)?(yg(b,6704)|0)!=0:0)?(yg(b,6712)|0)!=0:0)?(Ag(b,6720,3)|0)!=0:0)?(Ag(b,6728,3)|0)!=0:0){if((((!(d<<24>>24==98|d<<24>>24==66)?(yg(b,6736)|0)!=0:0)?(yg(b,6744)|0)!=0:0)?(Ag(b,6752,3)|0)!=0:0)?(Ag(b,6760,3)|0)!=0:0){switch(d<<24>>24){case 105:case 73:{e=11;break a;break};case 108:case 76:{e=6;break a;break};case 101:case 69:{e=4;break a;break};case 97:case 65:{e=5;break a;break};case 110:case 78:{e=7;break a;break};case 103:case 71:{e=3;break a;break};default:{if((zg(b,6768,5)|0)==0){e=10;break a}if(d<<24>>24==112|d<<24>>24==80){e=9;break a}if((Gc(b)|0)==0){e=-1;break a}f=+ug(b);if(f>1980.0){e=1;break a}e=f>1900.0?2:-1;break a}}}else{e=2}}else{e=1}}while(0);i=c;return e|0}function oc(b){b=b|0;var c=0,d=0,e=0.0;c=i;d=a[b]|0;if(!(d<<24>>24==98|d<<24>>24==66|d<<24>>24==106|d<<24>>24==74)){if((Ag(b,6752,3)|0)!=0?(Ag(b,6760,3)|0)!=0:0){if((((Ag(b,6720,3)|0)!=0?(Ag(b,6728,3)|0)!=0:0)?(Ag(b,6704,4)|0)!=0:0)?(Ag(b,6712,4)|0)!=0:0){if((d+ -49<<24>>24&255)<2){e=+ug(b)}else{e=0.0}}else{e=2.0e3}}else{e=1950.0}}else{e=+ug(b+1|0)}i=c;return+e}function pc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0;g=i;i=i+48|0;j=g;k=+h[a>>3]*3.141592653589793/180.0;l=+h[b>>3]*3.141592653589793/180.0;m=+h[c>>3]*36.0e4;n=+h[d>>3]*36.0e4;o=+T(+k);p=+S(+k);k=+T(+l);q=+S(+l);l=p*q;r=o*q;if(m!=0.0|n!=0.0){s=-(m*r)-n*p*k;t=m*l-n*o*k;u=n*q}else{s=0.0;t=0.0;u=0.0}v=0;do{h[j+(v<<3)>>3]=+h[6776+(v*48|0)>>3]*l+0.0+ +h[6784+(v*48|0)>>3]*r+ +h[6792+(v*48|0)>>3]*k+ +h[6800+(v*48|0)>>3]*s+ +h[6808+(v*48|0)>>3]*t+ +h[6816+(v*48|0)>>3]*u;v=v+1|0}while((v|0)!=6);u=+h[j>>3];t=+h[j+8>>3];s=+h[j+16>>3];k=+Q(+(u*u+t*t+s*s));r=u*-162557.0e-11+t*-3.1919e-7+s*-1.3843e-7;l=u*r;q=u+k*-162557.0e-11-l;o=t*r;p=t+k*-3.1919e-7-o;w=s*r;r=s+k*-1.3843e-7-w;k=+Q(+(r*r+(q*q+p*p)));p=u*.001245+t*-.00158+s*-659.0e-6;q=u+k*-162557.0e-11-l;l=t+k*-3.1919e-7-o;o=s+k*-1.3843e-7-w;w=+h[j+24>>3]+k*.001245-p*q;s=k*-.00158+ +h[j+32>>3]-p*l;t=k*-659.0e-6+ +h[j+40>>3]-p*o;p=q*q+l*l;u=+Q(+p);if(!(q==0.0&l==0.0)){r=+Y(+l,+q);if(r<0.0){x=r+6.283185307179586}else{x=r}}else{x=0.0}r=+Y(+o,+u);if(u>1.0e-30){y=(t*p-o*(q*w+l*s))/(u*(o*o+p));z=(q*s-l*w)/p}else{y=n;z=m}m=+h[e>>3];if(!(m>1.0e-30)){A=x*180.0;B=A/3.141592653589793;h[a>>3]=B;C=r*180.0;D=C/3.141592653589793;h[b>>3]=D;E=z/36.0e4;h[c>>3]=E;F=y/36.0e4;h[d>>3]=F;i=g;return}h[f>>3]=(o*t+(q*w+l*s))/(k*m*21.095);h[e>>3]=+h[e>>3]/k;A=x*180.0;B=A/3.141592653589793;h[a>>3]=B;C=r*180.0;D=C/3.141592653589793;h[b>>3]=D;E=z/36.0e4;h[c>>3]=E;F=y/36.0e4;h[d>>3]=F;i=g;return}function qc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0;g=i;i=i+48|0;j=g;k=+h[a>>3]*3.141592653589793/180.0;l=+h[b>>3]*3.141592653589793/180.0;m=+h[c>>3]*36.0e4;n=+h[d>>3]*36.0e4;o=+T(+k);p=+S(+k);k=+T(+l);q=+S(+l);l=p*q;r=o*q;s=+h[f>>3];t=+h[e>>3];u=s*21.095*t;if(!(m!=0.0|n!=0.0)?!(s!=0.0&t!=0.0):0){v=-.001245;w=.00158;x=659.0e-6}else{v=-(m*r)-n*p*k+u*l+-.001245;w=m*l-n*o*k+u*r+.00158;x=n*q+u*k+659.0e-6}u=l*-162557.0e-11+r*-3.1919e-7+k*-1.3843e-7;q=u*l+(l+162557.0e-11);o=u*r+(r+3.1919e-7);p=u*k+(k+1.3843e-7);u=l*.001245+r*-.00158+k*-659.0e-6;s=v+u*l;l=w+u*r;r=x+u*k;y=0;do{h[j+(y<<3)>>3]=+h[7064+(y*48|0)>>3]*q+0.0+ +h[7072+(y*48|0)>>3]*o+ +h[7080+(y*48|0)>>3]*p+ +h[7088+(y*48|0)>>3]*s+ +h[7096+(y*48|0)>>3]*l+ +h[7104+(y*48|0)>>3]*r;y=y+1|0}while((y|0)!=6);r=+h[j>>3];l=+h[j+8>>3];s=+h[j+16>>3];p=+h[j+24>>3];o=+h[j+32>>3];q=+h[j+40>>3];k=r*r+l*l;u=+Q(+k);x=k+s*s;w=+Q(+x);v=r*p+l*o;z=v+s*q;if(!(r==0.0&l==0.0)){A=+Y(+l,+r);if(A<0.0){B=A+6.283185307179586}else{B=A}}else{B=0.0}A=+Y(+s,+u);if(u>1.0e-30){C=(k*q-s*v)/(x*u);D=(r*o-l*p)/k}else{C=n;D=m}if(!(t>1.0e-30)){E=B*180.0;F=E/3.141592653589793;h[a>>3]=F;G=A*180.0;H=G/3.141592653589793;h[b>>3]=H;I=D/36.0e4;h[c>>3]=I;J=C/36.0e4;h[d>>3]=J;i=g;return}h[f>>3]=z/(w*t*21.095);h[e>>3]=+h[e>>3]/w;E=B*180.0;F=E/3.141592653589793;h[a>>3]=F;G=A*180.0;H=G/3.141592653589793;h[b>>3]=H;I=D/36.0e4;h[c>>3]=I;J=C/36.0e4;h[d>>3]=J;i=g;return}function rc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,l=0.0,m=0.0,n=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0.0,w=0,x=0,y=0;e=i;i=i+48|0;f=e;g=+h[b>>3];j=+h[d>>3];l=g*3.141592653589793/180.0;m=j*3.141592653589793/180.0;n=+S(+m);p=+S(+l)*n;q=n*+T(+l);l=+T(+m);m=p*-.066988739415+q*-.872755765852+l*-.483538914632;n=p*.492728466075+q*-.45034695802+l*.744584633283;r=+Y(+n,+m);if(r<0.0){s=r+6.283185307179586}else{s=r}if(s>6.283185307179586){t=s+-6.283185307179586}else{t=s}s=t*180.0/3.141592653589793;t=+Y(+(p*-.867600811151+q*-.188374601723+l*.460199784784),+(+Q(+(m*m+n*n))))*180.0/3.141592653589793;h[b>>3]=s;h[d>>3]=t;if((c[1838]|0)==0){i=e;return}n=g/15.0;d=~~n;g=(n- +(d|0))*60.0;b=~~g;if(j<0.0){u=45;v=-j}else{u=43;v=j}w=~~v;j=(v- +(w|0))*60.0;x=~~j;y=gg(32)|0;c[f>>2]=d;c[f+4>>2]=b;d=f+8|0;h[k>>3]=(g- +(b|0))*60.0;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];c[f+16>>2]=u;c[f+20>>2]=w;c[f+24>>2]=x;w=f+28|0;h[k>>3]=(j- +(x|0))*60.0;c[w>>2]=c[k>>2];c[w+4>>2]=c[k+4>>2];Na(y|0,7648,f|0)|0;w=y+6|0;if((a[w]|0)==32){a[w]=48}w=y+20|0;if((a[w]|0)==32){a[w]=48}w=c[o>>2]|0;c[f>>2]=y;za(w|0,7360,f|0)|0;h[k>>3]=s;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];x=f+8|0;h[k>>3]=t;c[x>>2]=c[k>>2];c[x+4>>2]=c[k+4>>2];za(w|0,7392,f|0)|0;hg(y);i=e;return}function sc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,l=0.0,m=0.0,n=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0,w=0.0,x=0,y=0,z=0;e=i;i=i+48|0;f=e;g=+h[b>>3];j=+h[d>>3];l=g*3.141592653589793/180.0;m=j*3.141592653589793/180.0;n=+S(+m);p=+S(+l)*n;q=n*+T(+l);l=+T(+m);m=p*-.066988739415+q*.492728466075+l*-.867600811151;n=p*-.872755765852+q*-.45034695802+l*-.188374601723;r=+Y(+n,+m);if(r<0.0){s=r+6.283185307179586}else{s=r}if(s>6.283185307179586){t=s+-6.283185307179586}else{t=s}s=t*180.0/3.141592653589793;t=+Y(+(p*-.483538914632+q*.744584633283+l*.460199784784),+(+Q(+(m*m+n*n))))*180.0/3.141592653589793;h[b>>3]=s;h[d>>3]=t;if((c[1838]|0)==0){i=e;return}d=c[o>>2]|0;h[k>>3]=g;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];b=f+8|0;h[k>>3]=j;c[b>>2]=c[k>>2];c[b+4>>2]=c[k+4>>2];za(d|0,7432,f|0)|0;j=s/15.0;b=~~j;s=(j- +(b|0))*60.0;u=~~s;if(t<0.0){v=45;w=-t}else{v=43;w=t}x=~~w;t=(w- +(x|0))*60.0;y=~~t;z=gg(32)|0;c[f>>2]=b;c[f+4>>2]=u;b=f+8|0;h[k>>3]=(s- +(u|0))*60.0;c[b>>2]=c[k>>2];c[b+4>>2]=c[k+4>>2];c[f+16>>2]=v;c[f+20>>2]=x;c[f+24>>2]=y;x=f+28|0;h[k>>3]=(t- +(y|0))*60.0;c[x>>2]=c[k>>2];c[x+4>>2]=c[k+4>>2];Na(z|0,7648,f|0)|0;x=z+6|0;if((a[x]|0)==32){a[x]=48}x=z+20|0;if((a[x]|0)==32){a[x]=48}c[f>>2]=z;za(d|0,7472,f|0)|0;hg(z);i=e;return}function tc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,l=0.0,m=0.0,n=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0.0,w=0,x=0,y=0;e=i;i=i+48|0;f=e;g=+h[b>>3];j=+h[d>>3];l=g*3.141592653589793/180.0;m=j*3.141592653589793/180.0;n=+S(+m);p=+S(+l)*n;q=n*+T(+l);l=+T(+m);m=p*-.054875539726+q*-.87343710801+l*-.483834985808;n=p*.494109453312+q*-.444829589425+l*.74698225181;r=+Y(+n,+m);if(r<0.0){s=r+6.283185307179586}else{s=r}if(s>6.283185307179586){t=s+-6.283185307179586}else{t=s}s=t*180.0/3.141592653589793;t=+Y(+(p*-.867666135858+q*-.198076386122+l*.455983795705),+(+Q(+(m*m+n*n))))*180.0/3.141592653589793;h[b>>3]=s;h[d>>3]=t;if((c[1838]|0)==0){i=e;return}n=g/15.0;d=~~n;g=(n- +(d|0))*60.0;b=~~g;if(j<0.0){u=45;v=-j}else{u=43;v=j}w=~~v;j=(v- +(w|0))*60.0;x=~~j;y=gg(32)|0;c[f>>2]=d;c[f+4>>2]=b;d=f+8|0;h[k>>3]=(g- +(b|0))*60.0;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];c[f+16>>2]=u;c[f+20>>2]=w;c[f+24>>2]=x;w=f+28|0;h[k>>3]=(j- +(x|0))*60.0;c[w>>2]=c[k>>2];c[w+4>>2]=c[k+4>>2];Na(y|0,7648,f|0)|0;w=y+6|0;if((a[w]|0)==32){a[w]=48}w=y+20|0;if((a[w]|0)==32){a[w]=48}w=c[o>>2]|0;c[f>>2]=y;za(w|0,7504,f|0)|0;h[k>>3]=s;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];x=f+8|0;h[k>>3]=t;c[x>>2]=c[k>>2];c[x+4>>2]=c[k+4>>2];za(w|0,7536,f|0)|0;hg(y);i=e;return}function uc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,l=0.0,m=0.0,n=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0,w=0.0,x=0,y=0,z=0;e=i;i=i+48|0;f=e;g=+h[b>>3];j=+h[d>>3];l=g*3.141592653589793/180.0;m=j*3.141592653589793/180.0;n=+S(+m);p=+S(+l)*n;q=n*+T(+l);l=+T(+m);m=p*-.054875539726+q*.494109453312+l*-.867666135858;n=p*-.87343710801+q*-.444829589425+l*-.198076386122;r=+Y(+n,+m);if(r<0.0){s=r+6.283185307179586}else{s=r}if(s>6.283185307179586){t=s+-6.283185307179586}else{t=s}s=t*180.0/3.141592653589793;t=+Y(+(p*-.483834985808+q*.74698225181+l*.455983795705),+(+Q(+(m*m+n*n))))*180.0/3.141592653589793;h[b>>3]=s;h[d>>3]=t;if((c[1838]|0)==0){i=e;return}d=c[o>>2]|0;h[k>>3]=g;c[f>>2]=c[k>>2];c[f+4>>2]=c[k+4>>2];b=f+8|0;h[k>>3]=j;c[b>>2]=c[k>>2];c[b+4>>2]=c[k+4>>2];za(d|0,7576,f|0)|0;j=s/15.0;b=~~j;s=(j- +(b|0))*60.0;u=~~s;if(t<0.0){v=45;w=-t}else{v=43;w=t}x=~~w;t=(w- +(x|0))*60.0;y=~~t;z=gg(32)|0;c[f>>2]=b;c[f+4>>2]=u;b=f+8|0;h[k>>3]=(s- +(u|0))*60.0;c[b>>2]=c[k>>2];c[b+4>>2]=c[k+4>>2];c[f+16>>2]=v;c[f+20>>2]=x;c[f+24>>2]=y;x=f+28|0;h[k>>3]=(t- +(y|0))*60.0;c[x>>2]=c[k>>2];c[x+4>>2]=c[k+4>>2];Na(z|0,7648,f|0)|0;x=z+6|0;if((a[x]|0)==32){a[x]=48}x=z+20|0;if((a[x]|0)==32){a[x]=48}c[f>>2]=z;za(d|0,7616,f|0)|0;hg(z);i=e;return}function vc(a,b,c){a=a|0;b=b|0;c=+c;var d=0,e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0;d=i;i=i+80|0;e=d;if(c!=2.0e3){yc(2.0e3,c,a,b)}f=+h[a>>3]*3.141592653589793/180.0;g=+h[b>>3]*3.141592653589793/180.0;j=+S(+g);k=+S(+f)*j;l=j*+T(+f);f=+T(+g);g=(c+-2.0e3)*.01;zc(1,(g*(g*(g*.001813+-59.0e-5)+-46.815)+84381.448)*48481368110953.0e-19,0.0,0.0,e);g=+h[e>>3]*k+0.0+ +h[e+8>>3]*l+ +h[e+16>>3]*f;c=+h[e+24>>3]*k+0.0+ +h[e+32>>3]*l+ +h[e+40>>3]*f;j=+h[e+48>>3]*k+0.0+ +h[e+56>>3]*l+ +h[e+64>>3]*f;f=+Y(+c,+g);if(f<0.0){m=f+6.283185307179586}else{m=f}if(!(m>6.283185307179586)){n=m;o=g*g;p=c*c;q=o+p;r=+Q(+q);s=+Y(+j,+r);t=n*180.0;u=t/3.141592653589793;h[a>>3]=u;v=s*180.0;w=v/3.141592653589793;h[b>>3]=w;i=d;return}n=m+-6.283185307179586;o=g*g;p=c*c;q=o+p;r=+Q(+q);s=+Y(+j,+r);t=n*180.0;u=t/3.141592653589793;h[a>>3]=u;v=s*180.0;w=v/3.141592653589793;h[b>>3]=w;i=d;return}function wc(a,b,c){a=a|0;b=b|0;c=+c;var d=0,e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0;d=i;i=i+80|0;e=d;f=+h[a>>3]*3.141592653589793/180.0;g=+h[b>>3]*3.141592653589793/180.0;j=+S(+g);k=+S(+f)*j;l=j*+T(+f);f=+T(+g);g=(c+-2.0e3)*.01;zc(1,(g*(g*(g*.001813+-59.0e-5)+-46.815)+84381.448)*48481368110953.0e-19,0.0,0.0,e);g=+h[e>>3]*k+0.0+ +h[e+24>>3]*l+ +h[e+48>>3]*f;j=+h[e+8>>3]*k+0.0+ +h[e+32>>3]*l+ +h[e+56>>3]*f;m=+Y(+j,+g);if(m<0.0){n=m+6.283185307179586}else{n=m}if(n>6.283185307179586){o=n+-6.283185307179586}else{o=n}n=+Y(+(+h[e+16>>3]*k+0.0+ +h[e+40>>3]*l+ +h[e+64>>3]*f),+(+Q(+(g*g+j*j))));h[a>>3]=o*180.0/3.141592653589793;h[b>>3]=n*180.0/3.141592653589793;if(!(c!=2.0e3)){i=d;return}yc(c,2.0e3,a,b);i=d;return}function xc(a,b,c,d){a=+a;b=+b;c=c|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0;e=i;i=i+80|0;f=e;g=+h[c>>3]*3.141592653589793/180.0;j=+h[d>>3]*3.141592653589793/180.0;k=(a+-1850.0)/100.0;l=(b-a)/100.0;a=l*48481368110953.0e-19;b=k*(k*59.0e-6+1.3972)+2303.5548;m=k*365.0e-6;zc(323,-(a*(b+l*(.30242-k*269.0e-6+l*.017996))),a*(k*(-.85294-m)+2005.1125+l*(-.42647-m-l*.041802)),-(a*(b+l*(k*387.0e-6+1.09478+l*.018324))),f);l=+S(+j);k=+S(+g)*l;b=l*+T(+g);g=+T(+j);j=+h[f>>3]*k+0.0+ +h[f+8>>3]*b+ +h[f+16>>3]*g;l=+h[f+24>>3]*k+0.0+ +h[f+32>>3]*b+ +h[f+40>>3]*g;a=+h[f+48>>3]*k+0.0+ +h[f+56>>3]*b+ +h[f+64>>3]*g;g=+Y(+l,+j);if(g<0.0){n=g+6.283185307179586}else{n=g}if(!(n>6.283185307179586)){o=n;p=j*j;q=l*l;r=p+q;s=+Q(+r);t=+Y(+a,+s);u=o*180.0;v=u/3.141592653589793;h[c>>3]=v;w=t*180.0;x=w/3.141592653589793;h[d>>3]=x;i=e;return}o=n+-6.283185307179586;p=j*j;q=l*l;r=p+q;s=+Q(+r);t=+Y(+a,+s);u=o*180.0;v=u/3.141592653589793;h[c>>3]=v;w=t*180.0;x=w/3.141592653589793;h[d>>3]=x;i=e;return}function yc(a,b,c,d){a=+a;b=+b;c=c|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0;e=i;i=i+80|0;f=e;g=+h[c>>3]*3.141592653589793/180.0;j=+h[d>>3]*3.141592653589793/180.0;k=(a+-2.0e3)/100.0;l=(b-a)/100.0;a=l*48481368110953.0e-19;b=k*(1.39656-k*139.0e-6)+2306.2181;m=k*217.0e-6;zc(323,-(a*(b+l*(.30188-k*344.0e-6+l*.017998))),a*(k*(-.8533-m)+2004.3109+l*(-.42665-m-l*.041833)),-(a*(b+l*(k*66.0e-6+1.09468+l*.018203))),f);l=+S(+j);k=+S(+g)*l;b=l*+T(+g);g=+T(+j);j=k*+h[f>>3]+0.0+b*+h[f+8>>3]+g*+h[f+16>>3];l=k*+h[f+24>>3]+0.0+b*+h[f+32>>3]+g*+h[f+40>>3];a=k*+h[f+48>>3]+0.0+b*+h[f+56>>3]+g*+h[f+64>>3];g=+Y(+l,+j);if(g<0.0){n=g+6.283185307179586}else{n=g}if(!(n>6.283185307179586)){o=n;p=j*j;q=l*l;r=p+q;s=+Q(+r);t=+Y(+a,+s);u=o*180.0;v=u/3.141592653589793;h[c>>3]=v;w=t*180.0;x=w/3.141592653589793;h[d>>3]=x;i=e;return}o=n+-6.283185307179586;p=j*j;q=l*l;r=p+q;s=+Q(+r);t=+Y(+a,+s);u=o*180.0;v=u/3.141592653589793;h[c>>3]=v;w=t*180.0;x=w/3.141592653589793;h[d>>3]=x;i=e;return}function zc(a,b,d,e,f){a=a|0;b=+b;d=+d;e=+e;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0.0,A=0,B=0.0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0,J=0.0,K=0,L=0.0,M=0,N=0.0;g=i;i=i+192|0;j=g+144|0;k=g+72|0;l=g;m=g+168|0;n=f+8|0;h[f>>3]=1.0;o=f+16|0;h[n>>3]=0.0;h[o>>3]=0.0;p=f+24|0;h[p>>3]=0.0;h[f+32>>3]=1.0;h[f+40>>3]=0.0;h[f+48>>3]=0.0;h[f+56>>3]=0.0;h[f+64>>3]=1.0;q=(a|0)/100|0;c[m>>2]=q;if((a|0)>99){r=(aa(q,-100)|0)+a|0;s=1}else{r=a;s=0}a=(r|0)/10|0;c[m+(s<<2)>>2]=a;if((r|0)>9){t=(aa(a,-10)|0)+r|0;u=s+1|0}else{t=r;u=s}c[m+(u<<2)>>2]=t;s=((t|0)>0)+u|0;h[j>>3]=b;h[j+8>>3]=d;h[j+16>>3]=e;if((s|0)<=0){i=g;return}u=l+32|0;t=l+40|0;r=l+56|0;a=l+64|0;q=l+16|0;v=l+48|0;w=l+8|0;x=l+24|0;y=k+8|0;e=b;b=1.0;d=0.0;z=1.0;A=0;while(1){h[l>>3]=1.0;h[l+8>>3]=0.0;h[l+16>>3]=0.0;h[l+24>>3]=0.0;h[l+32>>3]=1.0;h[l+40>>3]=0.0;h[l+48>>3]=0.0;h[l+56>>3]=0.0;h[l+64>>3]=1.0;B=+T(+e);C=+S(+e);D=c[m+(A<<2)>>2]|0;do{if((D|0)!=1){h[l>>3]=C;if((D|0)==2){h[q>>3]=-B;h[v>>3]=B;h[a>>3]=C;break}else{h[w>>3]=B;h[x>>3]=-B;h[u>>3]=C;break}}else{h[u>>3]=C;h[t>>3]=B;h[r>>3]=-B;h[a>>3]=C}}while(0);C=+h[p>>3];B=+h[n>>3];E=+h[f+32>>3];F=+h[f+56>>3];G=+h[f+16>>3];H=+h[f+40>>3];D=0;do{I=D*3|0;J=+h[l+(I<<3)>>3];K=I+1|0;L=+h[l+(K<<3)>>3];M=I+2|0;N=+h[l+(M<<3)>>3];h[k+(I<<3)>>3]=J*b+0.0+L*C+N*d;h[k+(K<<3)>>3]=J*B+0.0+L*E+N*F;h[k+(M<<3)>>3]=J*G+0.0+L*H+N*z;D=D+1|0}while((D|0)!=3);H=+h[k>>3];h[f>>3]=H;h[n>>3]=+h[y>>3];h[o>>3]=+h[k+16>>3];h[f+24>>3]=+h[k+24>>3];h[f+32>>3]=+h[k+32>>3];h[f+40>>3]=+h[k+40>>3];G=+h[k+48>>3];h[f+48>>3]=G;h[f+56>>3]=+h[k+56>>3];F=+h[k+64>>3];h[f+64>>3]=F;D=A+1|0;if((D|0)==(s|0)){break}e=+h[j+(D<<3)>>3];b=H;d=G;z=F;A=D}i=g;return}function Ac(a,b,c,d){a=+a;b=+b;c=+c;d=d|0;var e=0.0;e=a*3.141592653589793/180.0;a=b*3.141592653589793/180.0;b=+S(+a);h[d>>3]=+S(+e)*c*b;h[d+8>>3]=b*+T(+e)*c;h[d+16>>3]=+T(+a)*c;return}function Bc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;if((b|0)>0){e=b}else{c[1922]=0;e=(Cc(a,7696)|0)+80-a|0}c[1922]=e;i=d;return e|0}function Cc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;f=c[1922]|0;g=(f|0)==0?256e3:f;if((g|0)>0){h=0}else{j=0;i=e;return j|0}while(1){f=h+1|0;if((a[b+h|0]|0)<1){k=h;break}if((f|0)<(g|0)){h=f}else{k=f;break}}h=b+k|0;g=h;if((k|0)<=0){j=0;i=e;return j|0}k=b;f=b;a:while(1){b=Rc(f,d,g-f|0)|0;if((b|0)==0){j=0;l=17;break}m=(b-k|0)%80|0;n=a[b+(Dg(d|0)|0)|0]|0;do{if((m|0)<=7){if(n<<24>>24>32?!(n<<24>>24==61|n<<24>>24==127):0){o=b+1|0;break}p=0-m|0;q=b+p|0;if((p|0)<0){p=b+1|0;r=f;s=q;while(1){t=(a[s]|0)==32?r:p;u=s+1|0;if(u>>>0<b>>>0){r=t;s=u}else{v=t;break}}}else{v=f}if(b>>>0<v>>>0){o=v}else{j=q;l=17;break a}}else{o=b+1|0}}while(0);if(o>>>0<h>>>0){f=o}else{j=0;l=17;break}}if((l|0)==17){i=e;return j|0}return 0}function Dc(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f;if((a[d]|0)<64){h=Ec(b,c,e)|0;i=f;return h|0}else{Lg(g|0,c|0)|0;j=Dg(c|0)|0;a[g+j|0]=a[d]|0;a[g+(j+1)|0]=0;h=Ec(b,g,e)|0;i=f;return h|0}return 0}function Ec(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0.0,k=0.0;f=i;g=Fc(b,d)|0;if((g|0)==0){h=0;i=f;return h|0}d=(a[g]|0)==35?g+1|0:g;if((Dg(d|0)|0)>81){Hg(7704,d|0,81)|0;a[7785|0]=0}else{Lg(7704,d|0)|0}if((Gc(7704)|0)==2){d=$f(7704,68)|0;if((d|0)!=0){a[d]=101}d=$f(7704,100)|0;if((d|0)!=0){a[d]=101}d=$f(7704,69)|0;if((d|0)!=0){a[d]=101}}j=+ug(7704);k=j+.001;if(k>2147483647.0){c[e>>2]=2147483647;h=1;i=f;return h|0}if(j>=0.0){c[e>>2]=~~k;h=1;i=f;return h|0}k=j+-.001;if(k<-2147483648.0){c[e>>2]=-2147483648;h=1;i=f;return h|0}else{c[e>>2]=~~k;h=1;i=f;return h|0}return 0}function Fc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;e=i;i=i+208|0;f=e+194|0;g=e+8|0;h=e+2|0;j=e+4|0;k=e+196|0;l=e;m=e+6|0;n=e+112|0;o=e+12|0;a[g]=39;a[g+1|0]=0;a[h]=34;a[h+1|0]=0;a[j]=91;a[j+1|0]=0;a[m]=44;a[m+1|0]=0;a[k]=93;a[k+1|0]=0;a[l]=47;a[l+1|0]=0;Hg(n|0,d|0,80)|0;d=Dg(n|0)|0;p=Dg(j|0)|0;a:do{if((p|0)!=0){if((d|0)!=0?(q=p+ -1|0,r=a[j+q|0]|0,s=d+1-p|0,t=n+s|0,(s|0)>0):0){s=(p|0)==1;u=(p|0)<3;v=n;do{b:do{if((a[v]|0)==91){if(s){w=v;x=23;break a}if((a[v+q|0]|0)==r<<24>>24){if(u){w=v;x=23;break a}else{y=1}while(1){z=y+1|0;if((a[v+y|0]|0)!=(a[j+y|0]|0)){break b}if((z|0)<(p|0)){y=z}else{w=v;x=23;break a}}}}}while(0);v=v+1|0}while(v>>>0<t>>>0)}t=Dg(n|0)|0;v=Dg(m|0)|0;if((v|0)!=0){if((t|0)!=0?(u=v+ -1|0,r=a[m+u|0]|0,q=t+1-v|0,t=n+q|0,(q|0)>0):0){q=(v|0)==1;s=(v|0)<3;z=n;while(1){c:do{if((a[z]|0)==44){if(q){w=z;x=23;break a}if((a[z+u|0]|0)==r<<24>>24){if(s){w=z;x=23;break a}else{A=1}while(1){B=A+1|0;if((a[z+A|0]|0)!=(a[m+A|0]|0)){break c}if((B|0)<(v|0)){A=B}else{w=z;x=23;break a}}}}}while(0);B=z+1|0;if(B>>>0<t>>>0){z=B}else{C=0;break}}}else{C=0}}else{w=n;x=23}}else{w=n;x=23}}while(0);if((x|0)==23){a[w]=0;C=w+1|0}w=Cc(b,n)|0;if((w|0)==0){D=0;i=e;return D|0}n=o+0|0;b=n+100|0;do{a[n]=0;n=n+1|0}while((n|0)<(b|0));Hg(o|0,w|0,80)|0;w=Dg(o|0)|0;n=Dg(g|0)|0;d:do{if((n|0)!=0){if((w|0)!=0?(b=a[g]|0,A=n+ -1|0,m=a[g+A|0]|0,y=w+1-n|0,p=o+y|0,(y|0)>0):0){y=(n|0)==1;j=(n|0)<3;d=o;while(1){e:do{if((a[d]|0)==b<<24>>24){if(y){E=d;break d}if((a[d+A|0]|0)==m<<24>>24){if(j){E=d;break d}else{F=1}while(1){z=F+1|0;if((a[d+F|0]|0)!=(a[g+F|0]|0)){break e}if((z|0)<(n|0)){F=z}else{E=d;break d}}}}}while(0);z=d+1|0;if(z>>>0<p>>>0){d=z}else{E=0;break}}}else{E=0}}else{E=o}}while(0);F=Dg(o|0)|0;n=Dg(l|0)|0;f:do{if((n|0)!=0){if((F|0)!=0?(w=a[l]|0,d=n+ -1|0,p=a[l+d|0]|0,j=F+1-n|0,m=o+j|0,(j|0)>0):0){j=(n|0)==1;A=(n|0)<3;y=o;while(1){g:do{if((a[y]|0)==w<<24>>24){if(j){G=y;break f}if((a[y+d|0]|0)==p<<24>>24){if(A){G=y;break f}else{H=1}while(1){b=H+1|0;if((a[y+H|0]|0)!=(a[l+H|0]|0)){break g}if((b|0)<(n|0)){H=b}else{G=y;break f}}}}}while(0);b=y+1|0;if(b>>>0<m>>>0){y=b}else{G=0;break}}}else{G=0}}else{G=o}}while(0);h:do{if((E|0)==0){H=Dg(o|0)|0;n=Dg(h|0)|0;i:do{if((n|0)==0){I=o}else{if((H|0)==0){x=116;break h}l=a[h]|0;F=n+ -1|0;y=a[h+F|0]|0;m=H+1-n|0;A=o+m|0;if((m|0)<=0){x=116;break h}m=(n|0)==1;p=(n|0)<3;d=o;while(1){j:do{if((a[d]|0)==l<<24>>24){if(m){I=d;break i}if((a[d+F|0]|0)==y<<24>>24){if(p){I=d;break i}else{J=1}while(1){j=J+1|0;if((a[d+J|0]|0)!=(a[h+J|0]|0)){break j}if((j|0)<(n|0)){J=j}else{I=d;break i}}}}}while(0);j=d+1|0;if(j>>>0<A>>>0){d=j}else{x=116;break h}}}}while(0);if((G|0)!=0&I>>>0<G>>>0){n=I+1|0;H=Dg(n|0)|0;d=Dg(h|0)|0;if((d|0)==0){K=I;L=n;x=115;break}if((H|0)!=0?(A=a[h]|0,p=d+ -1|0,y=a[h+p|0]|0,F=H+1-d|0,H=I+(F+1)|0,(F|0)>0):0){F=(d|0)==1;m=(d|0)<3;l=n;while(1){k:do{if((a[l]|0)==A<<24>>24){if(F){K=I;L=l;x=115;break h}if((a[l+p|0]|0)==y<<24>>24){if(m){K=I;L=l;x=115;break h}else{M=1}while(1){n=M+1|0;if((a[l+M|0]|0)!=(a[h+M|0]|0)){break k}if((n|0)<(d|0)){M=n}else{K=I;L=l;x=115;break h}}}}}while(0);n=l+1|0;if(n>>>0<H>>>0){l=n}else{N=G;break}}}else{N=G}while(1){l=N+ -1|0;if((a[l]|0)==32){N=l}else{K=I;L=N;x=115;break h}}}if((G|0)==0){l=I+1|0;H=Dg(l|0)|0;d=Dg(h|0)|0;if((d|0)==0){K=I;L=l;x=115}else{if((H|0)!=0?(m=a[h]|0,y=d+ -1|0,p=a[h+y|0]|0,F=H+1-d|0,H=I+(F+1)|0,(F|0)>0):0){F=(d|0)==1;A=(d|0)<3;n=l;do{l:do{if((a[n]|0)==m<<24>>24){if(F){K=I;L=n;x=115;break h}if((a[n+y|0]|0)==p<<24>>24){if(A){K=I;L=n;x=115;break h}else{O=1}while(1){l=O+1|0;if((a[n+O|0]|0)!=(a[h+O|0]|0)){break l}if((l|0)<(d|0)){O=l}else{K=I;L=n;x=115;break h}}}}}while(0);n=n+1|0}while(n>>>0<H>>>0)}H=o+79|0;while(1){if((a[H]|0)==32){H=H+ -1|0}else{break}}K=I;L=H+1|0;x=115}}else{x=116}}else{if((G|0)!=0&E>>>0<G>>>0){n=E+1|0;d=Dg(n|0)|0;A=Dg(g|0)|0;if((A|0)==0){K=E;L=n;x=115;break}if((d|0)!=0?(p=a[g]|0,y=A+ -1|0,F=a[g+y|0]|0,m=d+1-A|0,d=E+(m+1)|0,(m|0)>0):0){m=(A|0)==1;l=(A|0)<3;j=n;while(1){m:do{if((a[j]|0)==p<<24>>24){if(m){K=E;L=j;x=115;break h}if((a[j+y|0]|0)==F<<24>>24){if(l){K=E;L=j;x=115;break h}else{P=1}while(1){n=P+1|0;if((a[j+P|0]|0)!=(a[g+P|0]|0)){break m}if((n|0)<(A|0)){P=n}else{K=E;L=j;x=115;break h}}}}}while(0);n=j+1|0;if(n>>>0<d>>>0){j=n}else{Q=G;break}}}else{Q=G}while(1){j=Q+ -1|0;if((a[j]|0)==32){Q=j}else{K=E;L=Q;x=115;break h}}}if((G|0)==0){j=E+1|0;d=Dg(j|0)|0;A=Dg(g|0)|0;if((A|0)==0){K=E;L=j;x=115}else{if((d|0)!=0?(l=a[g]|0,F=A+ -1|0,y=a[g+F|0]|0,m=d+1-A|0,d=E+(m+1)|0,(m|0)>0):0){m=(A|0)==1;p=(A|0)<3;H=j;do{n:do{if((a[H]|0)==l<<24>>24){if(m){K=E;L=H;x=115;break h}if((a[H+F|0]|0)==y<<24>>24){if(p){K=E;L=H;x=115;break h}else{R=1}while(1){j=R+1|0;if((a[H+R|0]|0)!=(a[g+R|0]|0)){break n}if((j|0)<(A|0)){R=j}else{K=E;L=H;x=115;break h}}}}}while(0);H=H+1|0}while(H>>>0<d>>>0)}d=o+79|0;while(1){if((a[d]|0)==32){d=d+ -1|0}else{break}}K=E;L=d+1|0;x=115}}else{x=116}}}while(0);if((x|0)==115){S=K+1|0;T=L}else if((x|0)==116){L=Dg(o|0)|0;o:do{if((L|0)!=0?(K=o+L|0,(L|0)>0):0){E=o;while(1){if((a[E]|0)==61){U=E;break o}R=E+1|0;if(R>>>0<K>>>0){E=R}else{U=0;break}}}else{U=0}}while(0);L=(U|0)==0?o+9|0:U+1|0;U=Dg(o|0)|0;p:do{if((U|0)!=0?(E=o+U|0,(U|0)>0):0){K=o;while(1){if((a[K]|0)==47){V=K;break p}d=K+1|0;if(d>>>0<E>>>0){K=d}else{V=0;break}}}else{V=0}}while(0);S=L;T=(V|0)==0?o+79|0:V}if((c[1968]|0)==0){V=S;while(1){if((a[V]|0)==32&V>>>0<T>>>0){V=V+1|0}else{W=V;break}}}else{W=S}a[T]=0;q:do{if((c[1968]|0)==0){S=T;while(1){V=S+ -1|0;o=a[V]|0;if(!(o<<24>>24==13|o<<24>>24==32)){break q}if(!(V>>>0>W>>>0)){break q}a[V]=0;S=V}}}while(0);T=(yg(W,7960)|0)==0;S=T?W+1|0:W;Lg(7880,S|0)|0;if((C|0)==0){D=7880;i=e;return D|0}W=Dg(C|0)|0;T=Dg(k|0)|0;r:do{if((T|0)!=0){if((W|0)!=0?(V=a[k]|0,o=T+ -1|0,L=a[k+o|0]|0,U=W+1-T|0,K=C+U|0,(U|0)>0):0){U=(T|0)==1;E=(T|0)<3;d=C;s:while(1){t:do{if((a[d]|0)==V<<24>>24){if(U){break s}if((a[d+o|0]|0)==L<<24>>24){if(E){break s}else{X=1}while(1){R=X+1|0;if((a[d+X|0]|0)!=(a[k+X|0]|0)){break t}if((R|0)<(T|0)){X=R}else{break s}}}}}while(0);R=d+1|0;if(R>>>0<K>>>0){d=R}else{break r}}if((d|0)!=0){Y=d;x=144}}}else{Y=C;x=144}}while(0);if((x|0)==144){a[Y]=0}if((Gc(C)|0)==0){Y=Dg(C|0)|0;if((Y|0)>0){x=0;do{X=C+x|0;T=a[X]|0;if((T+ -65<<24>>24&255)<26){a[X]=(T&255)+32}x=x+1|0}while((x|0)!=(Y|0))}Y=_c(7880,C)|0;if((Y|0)==0){D=0;i=e;return D|0}Lg(7880,Y|0)|0;D=7880;i=e;return D|0}Y=vg(C)|0;a[f]=32;a[f+1|0]=0;if((Y|0)>0){C=1;x=S;while(1){Z=fg(x,f)|0;if((C|0)==(Y|0)){break}else{C=C+1|0;x=0}}if((Z|0)==0){D=0;i=e;return D|0}Lg(7880,Z|0)|0;D=7880;i=e;return D|0}if((Y|0)>=0){D=7880;i=e;return D|0}Z=0-Y|0;u:do{if((Z|0)<=1){if((S|0)==0){D=0;i=e;return D|0}else{_=S}}else{Y=1;x=S;while(1){C=$f(x,32)|0;if((C|0)==0){D=0;break}f=C+1|0;C=Y+1|0;if((C|0)<(Z|0)){Y=C;x=f}else{_=f;break u}}i=e;return D|0}}while(0);Lg(7880,_|0)|0;D=7880;i=e;return D|0}function Gc(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;c=i;a:do{if((b|0)!=0?(d=a[b]|0,!(d<<24>>24==101|d<<24>>24==69|d<<24>>24==100|d<<24>>24==68)):0){e=Dg(b|0)|0;while(1){f=e+ -1|0;if((a[b+f|0]|0)==32){e=f}else{break}}if((e|0)>0){f=d;g=0;h=1;j=0;k=0;while(1){if(f<<24>>24==32){if((k|0)==0){l=g;m=h;n=0}else{o=0;break a}}else if(!(f<<24>>24==10)){b:do{if(!((f+ -48<<24>>24&255)<10)){switch(f<<24>>24){case 45:case 43:{break};case 101:case 100:case 69:case 68:case 58:case 46:{p=13;break b;break};default:{o=0;break a}}q=a[b+(j+1)|0]|0;if(q<<24>>24==43|q<<24>>24==45){o=0;break a}if((j|0)>0){switch(a[b+(j+ -1)|0]|0){case 32:case 58:case 101:case 69:case 100:case 68:{r=g;s=k;break};default:{o=0;break a}}}else{r=g;s=k}}else{p=13}}while(0);do{if((p|0)==13){p=0;if((f+ -47<<24>>24&255)<11){r=g;s=k+1|0;break}else{r=(f<<24>>24==58)+g|0;s=k;break}}}while(0);if(f<<24>>24==101|f<<24>>24==100|f<<24>>24==46){l=r;m=2;n=s}else{l=r;m=h;n=s}}else{t=g;u=h;v=k;break}q=j+1|0;if((q|0)>=(e|0)){t=l;u=m;v=n;break}f=a[b+q|0]|0;g=l;h=m;j=q;k=n}if((v|0)>0){o=(t|0)==0?u:3}else{o=0}}else{o=0}}else{o=0}}while(0);i=c;return o|0}function Hc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,j=0.0,k=0,l=0,m=0.0;e=i;f=Fc(b,c)|0;if((f|0)==0){g=0;i=e;return g|0}j=+Jc(f);c=Dg(f|0)|0;a:do{if((c|0)!=0?(b=f+c|0,(c|0)>0):0){k=f;while(1){if((a[k]|0)==58){break}l=k+1|0;if(l>>>0<b>>>0){k=l}else{m=j;break a}}if((k|0)!=0){m=j*15.0}else{m=j}}else{m=j}}while(0);h[d>>3]=m;g=1;i=e;return g|0}function Ic(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;e=Fc(a,b)|0;if((e|0)==0){f=0}else{h[c>>3]=+Jc(e);f=1}i=d;return f|0}function Jc(b){b=b|0;var c=0,d=0.0,e=0,f=0,g=0,h=0,j=0.0,k=0,l=0.0,m=0,n=0,o=0.0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0.0,x=0.0;c=i;if((b|0)==0){d=0.0;i=c;return+d}e=a[b]|0;if(e<<24>>24==0){d=0.0;i=c;return+d}else{f=e;g=b}while(1){if(f<<24>>24==43){h=5;break}else if(f<<24>>24==45){j=-1.0;h=6;break}else if(!(f<<24>>24==32)){h=7;break}b=g+1|0;f=a[b]|0;g=b}if((h|0)==5){j=1.0;h=6}else if((h|0)==7){f=Dg(g|0)|0;if((g|0)==0){k=1;l=1.0;m=0}else{n=f;o=1.0;p=g;h=8}}if((h|0)==6){f=g+1|0;n=Dg(f|0)|0;o=j;p=f;h=8}a:do{if((h|0)==8){if((n|0)!=0?(f=p+n|0,(n|0)>0):0){g=p;while(1){if((a[g]|0)==44){break}b=g+1|0;if(b>>>0<f>>>0){g=b}else{k=0;l=o;m=p;break a}}if((g|0)!=0){a[g]=32;k=0;l=o;m=p}else{k=0;l=o;m=p}}else{k=0;l=o;m=p}}}while(0);p=Dg(m|0)|0;while(1){n=p+ -1|0;if((a[m+n|0]|0)==32){p=n}else{break}}n=Dg(m|0)|0;b:do{if(!k){c:do{if((n|0)!=0?(f=m+n|0,(n|0)>0):0){b=m;while(1){if((a[b]|0)==58){break}e=b+1|0;if(e>>>0<f>>>0){b=e}else{h=22;break c}}if((b|0)!=0){q=b}else{h=22}}else{h=22}}while(0);if((h|0)==22){if((p|0)==0){break}g=m+p|0;if((p|0)>0){r=m}else{break}while(1){if((a[r]|0)==32){break}f=r+1|0;if(f>>>0<g>>>0){r=f}else{break b}}if((r|0)==0){break}else{q=r}}a[q]=0;o=+(vg(m)|0);a[q]=58;g=q+1|0;f=Dg(g|0)|0;d:do{if((f|0)!=0?(e=q+(f+1)|0,(f|0)>0):0){s=g;while(1){if((a[s]|0)==58){t=s;h=35;break d}u=s+1|0;if(u>>>0<e>>>0){s=u}else{h=31;break}}}else{h=31}}while(0);e:do{if((h|0)==31){f=Dg(g|0)|0;if((f|0)!=0?(s=q+(f+1)|0,(f|0)>0):0){f=g;do{if((a[f]|0)==32){t=f;h=35;break e}f=f+1|0}while(f>>>0<s>>>0)}s=Dg(g|0)|0;f:do{if((s|0)!=0?(f=q+(s+1)|0,(s|0)>0):0){e=g;while(1){if((a[e]|0)==46){break}b=e+1|0;if(b>>>0<f>>>0){e=b}else{v=0.0;break f}}v=+ug(g)}else{v=0.0}}while(0);if((a[g]|0)==0){w=v;x=0.0}else{w=+(vg(g)|0);x=0.0}}}while(0);if((h|0)==35){a[t]=0;j=+(vg(g)|0);a[t]=58;w=j;x=+ug(t+1|0)}d=l*(o+w/60.0+x/3600.0);i=c;return+d}}while(0);if((Gc(m)|0)!=2){d=l*+(vg(m)|0);i=c;return+d}t=$f(m,68)|0;if((t|0)!=0){a[t]=101}t=$f(m,100)|0;if((t|0)!=0){a[t]=101}t=$f(m,69)|0;if((t|0)!=0){a[t]=101}d=l*+ug(m);i=c;return+d}function Kc(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f;if((a[d]|0)<64){h=Lc(b,c,e)|0;i=f;return h|0}else{Lg(g|0,c|0)|0;j=Dg(c|0)|0;a[g+j|0]=a[d]|0;a[g+(j+1)|0]=0;h=Lc(b,g,e)|0;i=f;return h|0}return 0}function Lc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=i;f=Fc(b,c)|0;if((f|0)==0){g=0;i=e;return g|0}c=(a[f]|0)==35?f+1|0:f;if((Dg(c|0)|0)>81){Hg(7704,c|0,81)|0;a[7785|0]=0}else{Lg(7704,c|0)|0}if((Gc(7704)|0)==2){c=$f(7704,68)|0;if((c|0)!=0){a[c]=101}c=$f(7704,100)|0;if((c|0)!=0){a[c]=101}c=$f(7704,69)|0;if((c|0)!=0){a[c]=101}}h[d>>3]=+ug(7704);g=1;i=e;return g|0}function Mc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0.0;f=i;g=Fc(b,d)|0;if((g|0)==0){j=0;i=f;return j|0}d=$f(g,47)|0;b=$f(g,45)|0;if(d>>>0>g>>>0){a[d]=0;k=~~+ug(g);a[d]=47;l=d+1|0;d=$f(l,47)|0;if((d|0)==0){m=$f(l,45)|0}else{m=d}if(!(m>>>0>g>>>0)){j=0;i=f;return j|0}a[m]=0;d=~~+ug(l);a[m]=47;l=~~+ug(m+1|0);m=(k|0)>31;n=m?k:l;o=m?l:k;if(n>>>0<50){p=n+2e3|0}else{p=(n|0)<100?n+1900|0:n}n=((p|0)%100|0|0)!=0|((p|0)%400|0|0)==0?(p&3|0)==0?29:28:28;c[7796>>2]=n;k=d+ -1|0;d=c[7792+(k<<2)>>2]|0;if((o|0)>(d|0)){q=d}else{q=(o|0)<1?1:o}r=(n|0)==28?365.0:366.0;n=q+ -1|0;if((k|0)>0){q=0;o=n;while(1){d=(c[7792+(q<<2)>>2]|0)+o|0;l=q+1|0;if((l|0)==(k|0)){s=d;break}else{q=l;o=d}}}else{s=n}h[e>>3]=+(p|0)+ +(s|0)/r;j=1;i=f;return j|0}if(!(b>>>0>g>>>0)){j=0;i=f;return j|0}a[b]=0;s=~~+ug(g);a[b]=45;p=b+1|0;b=$f(p,45)|0;do{if(b>>>0>g>>>0){a[b]=0;n=~~+ug(p);a[b]=45;o=b+1|0;q=$f(o,84)|0;if(q>>>0>g>>>0){a[q]=0;k=~~+ug(o);a[q]=84;t=k;u=n;v=q;break}else{t=~~+ug(o);u=n;v=q;break}}else{t=1;u=1;v=0}}while(0);b=(s|0)<32;p=b?t+1900|0:s;q=b?s:t;t=((p|0)%100|0|0)!=0|((p|0)%400|0|0)==0?(p&3|0)==0?29:28:28;c[7796>>2]=t;s=u+ -1|0;u=c[7792+(s<<2)>>2]|0;if((q|0)>(u|0)){w=u}else{w=(q|0)<1?1:q}r=(t|0)==28?365.0:366.0;t=w+ -1|0;if((s|0)>0){w=0;q=t;while(1){u=(c[7792+(w<<2)>>2]|0)+q|0;b=w+1|0;if((b|0)==(s|0)){x=u;break}else{w=b;q=u}}}else{x=t}h[e>>3]=+(p|0)+ +(x|0)/r;if(!(v>>>0>g>>>0)){j=1;i=f;return j|0}x=v+1|0;v=$f(x,58)|0;do{if(v>>>0>g>>>0){a[v]=0;p=~~+ug(x);a[v]=58;t=v+1|0;q=$f(t,58)|0;if(q>>>0>g>>>0){a[q]=0;w=~~+ug(t);a[q]=58;y=p;z=w;A=+ug(q+1|0);break}else{y=p;z=~~+ug(t);A=0.0;break}}else{y=0;z=0;A=0.0}}while(0);h[e>>3]=+h[e>>3]+(A+(+(y|0)*3600.0+ +(z|0)*60.0))/86400.0/r;j=1;i=f;return j|0}function Nc(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+32|0;h=g+8|0;j=g+16|0;k=g;c[h>>2]=d;Na(j|0,7840,h|0)|0;do{if((Cc(b,j)|0)==0){c[h>>2]=d;Na(j|0,7856,h|0)|0;if((Cc(b,j)|0)!=0){l=k;c[l>>2]=627012389;c[l+4>>2]=6566448;break}c[h>>2]=d;Na(j|0,7864,h|0)|0;if((Cc(b,j)|0)!=0){l=k;c[l>>2]=627012389;c[l+4>>2]=6566704;break}if((Cc(b,j)|0)==0){m=0;i=g;return m|0}else{l=k;c[l>>2]=627012389;c[l+4>>2]=6566704;break}}else{a[k+0|0]=a[7848|0]|0;a[k+1|0]=a[7849|0]|0;a[k+2|0]=a[7850|0]|0;a[k+3|0]=a[7851|0]|0;a[k+4|0]=a[7852|0]|0;a[k+5|0]=a[7853|0]|0}}while(0);c[1968]=1;l=1;n=e;e=f;while(1){c[h>>2]=d;c[h+4>>2]=l;Na(j|0,k|0,h|0)|0;o=Fc(b,j)|0;if((o|0)==0){p=l;break}q=Dg(o|0)|0;if((q|0)>=(n|0)){r=13;break}Lg(e|0,o|0)|0;s=l+1|0;if((s|0)<500){l=s;n=n-q|0;e=e+q|0}else{p=s;break}}do{if((r|0)==13){if((n|0)>1){Hg(e|0,o|0,n+ -1|0)|0;a[e+n|0]=0;p=l;break}else{a[f]=a[o]|0;p=l;break}}}while(0);c[1968]=0;m=(p|0)>1|0;i=g;return m|0}function Oc(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;i=i+16|0;h=g;do{if((a[d]|0)<64){j=Fc(b,c)|0;if((j|0)!=0){if((Dg(j|0)|0)<(e|0)){Lg(f|0,j|0)|0;k=1;break}if((e|0)>1){Hg(f|0,j|0,e+ -1|0)|0;k=1;break}else{a[f]=a[j]|0;k=1;break}}else{k=0}}else{Lg(h|0,c|0)|0;j=Dg(c|0)|0;a[h+j|0]=a[d]|0;a[h+(j+1)|0]=0;j=Fc(b,h)|0;if((j|0)!=0){if((Dg(j|0)|0)<(e|0)){Lg(f|0,j|0)|0;k=1;break}if((e|0)>1){Hg(f|0,j|0,e+ -1|0)|0;k=1;break}else{a[f]=a[j]|0;k=1;break}}else{k=0}}}while(0);i=g;return k|0}function Pc(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;g=Fc(b,c)|0;do{if((g|0)!=0){if((Dg(g|0)|0)<(d|0)){Lg(e|0,g|0)|0;h=1;break}if((d|0)>1){Hg(e|0,g|0,d+ -1|0)|0;h=1;break}else{a[e]=a[g]|0;h=1;break}}else{h=0}}while(0);i=f;return h|0}function Qc(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;e=Dg(b|0)|0;a:do{if(!((b|0)==0|(c|0)==0)){f=Dg(c|0)|0;if((f|0)!=0){if((e|0)!=0?(g=a[c]|0,h=f+ -1|0,j=a[c+h|0]|0,k=e+1-f|0,l=b+k|0,(k|0)>0):0){k=(f|0)==1;m=(f|0)<3;n=b;while(1){b:do{if((a[n]|0)==g<<24>>24){if(k){o=n;break a}if((a[n+h|0]|0)==j<<24>>24){if(m){o=n;break a}else{p=1}while(1){q=p+1|0;if((a[n+p|0]|0)!=(a[c+p|0]|0)){break b}if((q|0)<(f|0)){p=q}else{o=n;break a}}}}}while(0);q=n+1|0;if(q>>>0<l>>>0){n=q}else{o=0;break}}}else{o=0}}else{o=b}}else{o=0}}while(0);i=d;return o|0}function Rc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;if((b|0)==0|(c|0)==0){f=0;i=e;return f|0}g=Dg(c|0)|0;if((g|0)==0){f=b;i=e;return f|0}if((d|0)==0){f=0;i=e;return f|0}do{if((g|0)<3){h=a[c]|0;j=h<<24>>24;if(!((h+ -97<<24>>24&255)<26)){if((h+ -65<<24>>24&255)<26){k=j+32&255}else{k=h}}else{k=j+224&255}if((g|0)>1){j=a[c+1|0]|0;l=j<<24>>24;if((j+ -97<<24>>24&255)<26){m=h;n=j;o=k;p=l+224&255;q=0;break}if((j+ -65<<24>>24&255)<26){m=h;n=j;o=k;p=l+32&255;q=0}else{m=h;n=j;o=k;p=j;q=0}}else{m=h;n=32;o=k;p=32;q=0}}else{h=ig(g,1)|0;j=0;do{l=a[c+j|0]|0;r=l&255;do{if(!((l+ -97<<24>>24&255)<26)){if((l+ -65<<24>>24&255)<26){a[h+j|0]=r+32;break}else{a[h+j|0]=l;break}}else{a[h+j|0]=r+224}}while(0);j=j+1|0}while((j|0)!=(g|0));j=g+ -1|0;m=a[c]|0;n=a[c+j|0]|0;o=a[h]|0;p=a[h+j|0]|0;q=h}}while(0);k=d+1-g|0;d=b+k|0;a:do{if((k|0)>0){j=g+ -1|0;r=(g|0)>1;if((g|0)==2){l=b;while(1){s=a[l]|0;if(s<<24>>24==m<<24>>24|s<<24>>24==o<<24>>24?(s=a[l+j|0]|0,s<<24>>24==n<<24>>24|s<<24>>24==p<<24>>24):0){break}s=l+1|0;if(s>>>0<d>>>0){l=s}else{break a}}if((q|0)==0){f=l;i=e;return f|0}hg(q);f=l;i=e;return f|0}else if((g|0)==1){h=b;while(1){s=a[h]|0;if(s<<24>>24==m<<24>>24|s<<24>>24==o<<24>>24){break}s=h+1|0;if(s>>>0<d>>>0){h=s}else{break a}}if((q|0)==0){f=h;i=e;return f|0}hg(q);f=h;i=e;return f|0}else{l=b;b:while(1){s=a[l]|0;c:do{if(s<<24>>24==m<<24>>24|s<<24>>24==o<<24>>24?(t=a[l+j|0]|0,t<<24>>24==n<<24>>24|t<<24>>24==p<<24>>24):0){if(r){u=1}else{break b}while(1){t=a[l+u|0]|0;if(!(t<<24>>24==(a[c+u|0]|0))?!(t<<24>>24==(a[q+u|0]|0)):0){break c}u=u+1|0;if((u|0)>=(g|0)){break b}}}}while(0);s=l+1|0;if(s>>>0<d>>>0){l=s}else{break a}}if((q|0)==0){f=l;i=e;return f|0}hg(q);f=l;i=e;return f|0}}}while(0);if((q|0)==0){f=0;i=e;return f|0}hg(q);f=0;i=e;return f|0}function Sc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;a:do{if(!((b|0)==0|(c|0)==0)){f=Dg(c|0)|0;if((f|0)!=0){if((d|0)!=0?(g=a[c]|0,h=f+ -1|0,j=a[c+h|0]|0,k=d+1-f|0,l=b+k|0,(k|0)>0):0){k=(f|0)==1;m=b;while(1){b:do{if((a[m]|0)==g<<24>>24){if(k){n=m;break a}if((a[m+h|0]|0)==j<<24>>24){if((f|0)<3){n=m;break a}else{o=1}while(1){p=o+1|0;if((a[m+o|0]|0)!=(a[c+o|0]|0)){break b}if((p|0)<(f|0)){o=p}else{n=m;break a}}}}}while(0);p=m+1|0;if(p>>>0<l>>>0){m=p}else{n=0;break}}}else{n=0}}else{n=b}}else{n=0}}while(0);i=e;return n|0}function Tc(b,d,e,f){b=b|0;d=d|0;e=+e;f=f|0;var g=0,j=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+80|0;j=g;l=g+16|0;if(e<0.0){m=-e;n=-1.0}else{m=e;n=1.0}e=n*+qa(+m,360.0);if(e<0.0){o=e+360.0}else{o=e}e=o/15.0;p=~~e;o=(e- +(p|0))*60.0;q=~~o;e=(o- +(q|0))*60.0;do{if((f|0)<=5){if((f|0)>4){r=e>59.99999;s=(r&1)+q|0;t=(s|0)>59;c[j>>2]=((t&1)+p|0)%24|0;c[j+4>>2]=t?0:s;s=j+8|0;h[k>>3]=r?0.0:e;c[s>>2]=c[k>>2];c[s+4>>2]=c[k+4>>2];Na(l|0,8008,j|0)|0;break}if((f|0)>3){s=e>59.9999;r=(s&1)+q|0;t=(r|0)>59;c[j>>2]=((t&1)+p|0)%24|0;c[j+4>>2]=t?0:r;r=j+8|0;h[k>>3]=s?0.0:e;c[r>>2]=c[k>>2];c[r+4>>2]=c[k+4>>2];Na(l|0,8032,j|0)|0;break}if((f|0)>2){r=e>59.999;s=(r&1)+q|0;t=(s|0)>59;c[j>>2]=((t&1)+p|0)%24|0;c[j+4>>2]=t?0:s;s=j+8|0;h[k>>3]=r?0.0:e;c[s>>2]=c[k>>2];c[s+4>>2]=c[k+4>>2];Na(l|0,8056,j|0)|0;break}if((f|0)>1){s=e>59.99;r=(s&1)+q|0;t=(r|0)>59;c[j>>2]=((t&1)+p|0)%24|0;c[j+4>>2]=t?0:r;r=j+8|0;h[k>>3]=s?0.0:e;c[r>>2]=c[k>>2];c[r+4>>2]=c[k+4>>2];Na(l|0,8080,j|0)|0;break}if((f|0)>0){r=e>59.9;s=(r&1)+q|0;t=(s|0)>59;c[j>>2]=((t&1)+p|0)%24|0;c[j+4>>2]=t?0:s;s=j+8|0;h[k>>3]=r?0.0:e;c[s>>2]=c[k>>2];c[s+4>>2]=c[k+4>>2];Na(l|0,8104,j|0)|0;break}else{s=~~(e+.5);r=(s|0)>59;t=(r&1)+q|0;u=(t|0)>59;c[j>>2]=((u&1)+p|0)%24|0;c[j+4>>2]=u?0:t;c[j+8>>2]=r?0:s;Na(l|0,8128,j|0)|0;break}}else{s=e>59.999999;r=(s&1)+q|0;t=(r|0)>59;c[j>>2]=((t&1)+p|0)%24|0;c[j+4>>2]=t?0:r;r=j+8|0;h[k>>3]=s?0.0:e;c[r>>2]=c[k>>2];c[r+4>>2]=c[k+4>>2];Na(l|0,7984,j|0)|0}}while(0);j=d+ -1|0;if((Dg(l|0)|0)<(j|0)){Lg(b|0,l|0)|0;i=g;return}else{Hg(b|0,l|0,j|0)|0;a[b+j|0]=0;i=g;return}}function Uc(b,d,e,f){b=b|0;d=d|0;e=+e;f=f|0;var g=0,j=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+96|0;j=g;l=g+24|0;if(e<0.0){m=-e;n=-1.0}else{m=e;n=1.0}e=n*+qa(+m,360.0);if(!(e<=-180.0)){o=e}else{o=e+360.0}if(o<0.0){p=-o;q=45}else{p=o;q=43}r=~~p;o=(p- +(r|0))*60.0;s=~~o;p=(o- +(s|0))*60.0;do{if((f|0)<=5){if((f|0)>4){t=p>59.99999;u=(t&1)+s|0;v=(u|0)>59;c[j>>2]=q&255;c[j+4>>2]=(v&1)+r;c[j+8>>2]=v?0:u;u=j+12|0;h[k>>3]=t?0.0:p;c[u>>2]=c[k>>2];c[u+4>>2]=c[k+4>>2];Na(l|0,8168,j|0)|0;break}if((f|0)>3){u=p>59.9999;t=(u&1)+s|0;v=(t|0)>59;c[j>>2]=q&255;c[j+4>>2]=(v&1)+r;c[j+8>>2]=v?0:t;t=j+12|0;h[k>>3]=u?0.0:p;c[t>>2]=c[k>>2];c[t+4>>2]=c[k+4>>2];Na(l|0,8192,j|0)|0;break}if((f|0)>2){t=p>59.999;u=(t&1)+s|0;v=(u|0)>59;c[j>>2]=q&255;c[j+4>>2]=(v&1)+r;c[j+8>>2]=v?0:u;u=j+12|0;h[k>>3]=t?0.0:p;c[u>>2]=c[k>>2];c[u+4>>2]=c[k+4>>2];Na(l|0,8216,j|0)|0;break}if((f|0)>1){u=p>59.99;t=(u&1)+s|0;v=(t|0)>59;c[j>>2]=q&255;c[j+4>>2]=(v&1)+r;c[j+8>>2]=v?0:t;t=j+12|0;h[k>>3]=u?0.0:p;c[t>>2]=c[k>>2];c[t+4>>2]=c[k+4>>2];Na(l|0,8240,j|0)|0;break}if((f|0)>0){t=p>59.9;u=(t&1)+s|0;v=(u|0)>59;c[j>>2]=q&255;c[j+4>>2]=(v&1)+r;c[j+8>>2]=v?0:u;u=j+12|0;h[k>>3]=t?0.0:p;c[u>>2]=c[k>>2];c[u+4>>2]=c[k+4>>2];Na(l|0,8264,j|0)|0;break}else{u=~~(p+.5);t=(u|0)>59;v=(t&1)+s|0;w=(v|0)>59;c[j>>2]=q&255;c[j+4>>2]=(w&1)+r;c[j+8>>2]=w?0:v;c[j+12>>2]=t?0:u;Na(l|0,8288,j|0)|0;break}}else{u=p>59.999999;t=(u&1)+s|0;v=(t|0)>59;c[j>>2]=q&255;c[j+4>>2]=(v&1)+r;c[j+8>>2]=v?0:t;t=j+12|0;h[k>>3]=u?0.0:p;c[t>>2]=c[k>>2];c[t+4>>2]=c[k+4>>2];Na(l|0,8144,j|0)|0}}while(0);j=d+ -1|0;if((Dg(l|0)|0)<(j|0)){Lg(b|0,l|0)|0;i=g;return}else{Hg(b|0,l|0,j|0)|0;a[b+j|0]=0;i=g;return}}function Vc(b,d,e,f){b=b|0;d=d|0;e=+e;f=f|0;var g=0,j=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0;g=i;i=i+80|0;j=g;l=g+72|0;m=g+8|0;if(e<0.0){n=-e;o=-1.0}else{n=e;o=1.0}e=o*+qa(+n,360.0);if(!(e<=-180.0)){p=e}else{p=e+360.0}q=f+4|0;if((f|0)>0){c[j>>2]=q;c[j+4>>2]=f;Na(l|0,8312,j|0)|0;h[k>>3]=p;c[j>>2]=c[k>>2];c[j+4>>2]=c[k+4>>2];Na(m|0,l|0,j|0)|0}else{c[j>>2]=q;Na(l|0,8328,j|0)|0;c[j>>2]=~~p;Na(m|0,l|0,j|0)|0}j=d+ -1|0;if((Dg(m|0)|0)<(j|0)){Lg(b|0,m|0)|0;i=g;return}else{Hg(b|0,m|0,j|0)|0;a[b+j|0]=0;i=g;return}}function Wc(a,b,d,e){a=a|0;b=+b;d=d|0;e=e|0;var f=0,g=0,j=0,l=0;f=i;i=i+16|0;g=f;j=f+8|0;l=(e|0)>0;if((d|0)>0){if(l){c[g>>2]=d;c[g+4>>2]=e;Na(j|0,8312,g|0)|0;h[k>>3]=b;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];Na(a|0,j|0,g|0)|0;i=f;return}else{c[g>>2]=d;Na(j|0,8336,g|0)|0;c[g>>2]=~~b;Na(a|0,j|0,g|0)|0;i=f;return}}else{if(l){c[g>>2]=e;Na(j|0,7976,g|0)|0;h[k>>3]=b;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];Na(a|0,j|0,g|0)|0;i=f;return}else{c[g>>2]=~~b;Na(a|0,7968,g|0)|0;i=f;return}}}function Xc(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=i;i=i+32|0;e=d;f=_c(a,b)|0;if((f|0)==0){g=0;i=d;return g|0}Lg(e|0,f|0)|0;h[c>>3]=+ug(e);g=1;i=d;return g|0}function Yc(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;h=gg(2e3)|0;if((Nc(b,c,2e3,h)|0)==0){hg(h);j=0;i=g;return j|0}c=_c(h,d)|0;do{if((c|0)!=0){if((Dg(c|0)|0)<(e|0)){Lg(f|0,c|0)|0;k=1;break}if((e|0)>1){Hg(f|0,c|0,e+ -1|0)|0;k=1;break}else{a[f]=a[c]|0;k=1;break}}else{k=0}}while(0);hg(h);j=k;i=g;return j|0}function Zc(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;g=_c(b,c)|0;do{if((g|0)!=0){if((Dg(g|0)|0)<(d|0)){Lg(e|0,g|0)|0;h=1;break}if((d|0)>1){Hg(e|0,g|0,d+ -1|0)|0;h=1;break}else{a[e]=a[g]|0;h=1;break}}else{h=0}}while(0);i=f;return h|0}function _c(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+2032|0;e=d+2024|0;f=d+2018|0;g=d+2016|0;h=d+2e3|0;j=d;a[f]=91;a[f+1|0]=0;a[g]=93;a[g+1|0]=0;Lg(h|0,c|0)|0;c=Qc(h,f)|0;f=(c|0)!=0;if(f){a[c]=0;k=0}else{k=0}while(1){l=k+1|0;if((a[b+k|0]|0)==0){m=6;break}if((l|0)<57600){k=l}else{m=4;break}}if((m|0)==4){n=l;o=Dg(h|0)|0}else if((m|0)==6){l=Dg(h|0)|0;if((k|0)>0){n=k;o=l}else{p=0;i=d;return p|0}}l=b+n|0;n=l;k=b;while(1){q=Sc(k,h,n-k|0)|0;if((q|0)==0){p=0;m=34;break}r=a[q+o|0]|0;s=a[q+ -1|0]|0;if(!(r<<24>>24>32?!(r<<24>>24==61|r<<24>>24==127):0)){if((q|0)==(b|0)){t=b;m=14;break}if(s<<24>>24==9|s<<24>>24==32){t=q;m=14;break}}s=q+1|0;if(s>>>0<l>>>0){k=s}else{p=0;m=34;break}}if((m|0)==14){if((t|0)==0){p=0;i=d;return p|0}k=t+o|0;while(1){o=a[k]|0;if(!(o<<24>>24==61|o<<24>>24==32)){break}k=k+1|0}if((k|0)==0){p=0;i=d;return p|0}Eg(j|0,0,2e3)|0;o=a[k]|0;a:do{if(o<<24>>24==34){t=k;l=0;while(1){b=t+1|0;n=a[b]|0;if(n<<24>>24==34|n<<24>>24==0){break a}if((l|0)>=2e3){break a}a[j+l|0]=n;t=b;l=l+1|0}}else{l=o;t=0;b=k;while(1){if(l<<24>>24==9|l<<24>>24==32){break a}if(!(l<<24>>24>0&(t|0)<2e3)){break a}n=b+1|0;a[j+t|0]=l;l=a[n]|0;t=t+1|0;b=n}}}while(0);if(!f){Lg(8344,j|0)|0;p=8344;i=d;return p|0}f=c+1|0;c=Qc(f,g)|0;if((c|0)==0){p=8344;i=d;return p|0}a[c]=0;c=vg(f)|0;if((c|0)<=0){p=8344;i=d;return p|0}a[e]=32;a[e+1|0]=44;a[e+2|0]=0;f=fg(j,e)|0;if((c|0)>1){j=1;while(1){g=fg(0,e)|0;k=j+1|0;if((k|0)==(c|0)){u=g;break}else{j=k}}}else{u=f}if((u|0)==0){p=8344;i=d;return p|0}Lg(8344,u|0)|0;p=8344;i=d;return p|0}else if((m|0)==34){i=d;return p|0}return 0}function $c(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,u=0.0,v=0.0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0;g=i;j=c[d+3260>>2]|0;k=+h[d>>3];l=+h[d+8>>3];m=+h[d+32>>3];n=+h[d+40>>3];o=+h[d+48>>3]*3.141592653589793/180.0;p=+S(+o);q=+T(+o);r=a- +h[d+16>>3];a=b- +h[d+24>>3];do{if((c[d+3300>>2]|0)==0){if(m==0.0|n==0.0){h[e>>3]=0.0;h[f>>3]=0.0;s=2;i=g;return s|0}else{b=r*m;t=a*n;if(!(o!=0.0)){u=b;v=t;break}u=b*p-t*q;v=t*p+b*q;break}}else{u=r*+h[d+56>>3]+a*+h[d+64>>3];v=r*+h[d+72>>3]+a*+h[d+80>>3]}}while(0);w=(c[d+3304>>2]|0)==0;a=w?v:u;r=w?u:v;h[e>>3]=k+r;h[f>>3]=l+a;if((j|0)<1){s=0;i=g;return s|0}v=k*3.141592653589793/180.0;k=l*3.141592653589793/180.0;u=w?k:v;o=w?v:k;v=r*3.141592653589793/180.0;r=a*3.141592653589793/180.0;a=v*v;b=a+r*r;t=+S(+u);x=+T(+u);a:do{switch(j|0){case 11:{y=u+r;z=o+v;break};case 32:case 33:case 31:case 3:{if(b>1.0){s=1;i=g;return s|0}A=t-r*x;if(A==0.0){s=1;i=g;return s|0}else{B=o+ +Y(+v,+A);y=+X(+((r*t+x)*+S(+(B-o))/A));z=B;break a}break};case 6:{if(b>=9.869604401089369){s=1;i=g;return s|0}B=+Q(+b);A=+S(+B);if(B!=0.0){C=+T(+B)/B}else{C=1.0}B=x*A+r*t*C;if(B>1.0|B<-1.0){s=1;i=g;return s|0}D=A-x*B;A=t*v*C;if(D==0.0&A==0.0){s=1;i=g;return s|0}else{y=+W(+B);z=o+ +Y(+A,+D);break a}break};case 22:{D=n*p+m*q;A=(D==0.0?3.141592653589793:D*3.141592653589793)/180.0;D=k+A;B=+T(+k);E=+S(+k);F=+Q(+((E+1.0)*.5));G=+T(+D)/+Q(+((+S(+D)+1.0)*.5))-B/F;D=A/(G==0.0?1.0:G);G=m*p-n*q;A=(G==0.0?3.141592653589793:G*3.141592653589793)/180.0;G=A*.5;H=E*2.0*+T(+G);I=A*+Q(+((E*+S(+G)+1.0)*.5))/(H==0.0?1.0:H);if(!(v==0.0&r==0.0)){H=r+B*D/F;F=H/D;B=4.0-a/(I*I*4.0)-F*F;if(B>4.0|B<2.0){s=1;i=g;return s|0}F=+Q(+B)*.5;B=H*F/D;if(+P(+B)>1.0){s=1;i=g;return s|0}D=+W(+B);B=+S(+D);if(+P(+B)<1.0e-5){s=1;i=g;return s|0}H=v*F/(I*2.0*B);if(+P(+H)>1.0){s=1;i=g;return s|0}else{y=D;z=o+ +W(+H)*2.0;break a}}else{y=u;z=o}break};case 5:{H=(4.0-b)/(b+4.0);if(+P(+H)>1.0){s=1;i=g;return s|0}D=H+1.0;B=x*H+r*t*D*.5;if(+P(+B)>1.0){s=1;i=g;return s|0}H=+W(+B);B=+S(+H);if(+P(+B)<1.0e-5){s=1;i=g;return s|0}I=v*D/(B*2.0);if(+P(+I)>1.0){s=1;i=g;return s|0}D=+W(+I);I=+T(+H);F=+S(+D);G=x*I+1.0+t*B*F;if(+P(+G)<1.0e-5){s=1;i=g;return s|0}if(+P(+((t*I-x*B*F)*2.0/G-r))>1.0e-5){J=3.141592653589795-D}else{J=D}y=H;z=o+J;break};case 20:case 28:{H=u+r;if(+P(+H)>1.5707963267948974){s=1;i=g;return s|0}D=+S(+H);if(+P(+v)>D*6.28318530717959*.5){s=1;i=g;return s|0}if(D>1.0e-5){y=H;z=o+v/D}else{y=H;z=o}break};case 27:{H=t-r*x;if(H==0.0){s=1;i=g;return s|0}D=o+ +Y(+v,+H);G=+S(+(D-o));if(G==0.0){s=1;i=g;return s|0}F=H/G;if(F>1.0|F<-1.0){s=1;i=g;return s|0}G=+V(+F);if(u<0.0){y=-G;z=D}else{y=G;z=D}break};case 12:{D=n*p+m*q;G=D==0.0?1.0:D;D=(l*.5+45.0)*3.141592653589793/180.0;F=+_(+(+U(+D)));H=G*3.141592653589793/180.0/(+_(+(+U(+(G*.5*.01745329252+D))))-F);D=+S(+k);G=o+v/(!(D<=0.0)?D:1.0);if(+P(+(G-o))>6.28318530717959){s=1;i=g;return s|0}if(H!=0.0){K=(r+F*H)/H}else{K=0.0}y=+X(+(+Z(+K)))*2.0+-1.5707963267948974;z=G;break};case 4:{if(b>1.0){s=1;i=g;return s|0}G=+Q(+(1.0-b));H=r*t+x*G;if(H>1.0|H<-1.0){s=1;i=g;return s|0}F=t*G-r*x;if(F==0.0&v==0.0){s=1;i=g;return s|0}else{y=+W(+H);z=o+ +Y(+v,+F);break a}break};case 16:{F=1.0/+U(+u)-r;if(u<0.0){L=-F}else{L=F}y=+W(+((x*x*(1.0-(a+F*F))+1.0)*(1.0/(x*2.0))));z=o- +Y(+v,+L)/x;break};default:{y=0.0;z=0.0}}}while(0);if(z-o>3.141592653589795){M=z+-6.28318530717959}else{M=z}if(M-o<-3.141592653589795){N=M+6.28318530717959}else{N=M}if(N<0.0){O=N+6.28318530717959}else{O=N}h[e>>3]=O*180.0/3.141592653589793;h[f>>3]=y*180.0/3.141592653589793;s=0;i=g;return s|0}function ad(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0,u=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0,N=0.0,O=0.0,R=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,$=0.0,aa=0.0,ba=0.0,ca=0.0,da=0.0;g=i;j=+h[d>>3];k=+h[d+8>>3];l=+h[d+16>>3];m=+h[d+24>>3];n=+h[d+32>>3];o=+h[d+40>>3];p=+h[d+48>>3]*3.141592653589793/180.0;q=+S(+p);r=+T(+p);s=c[d+3260>>2]|0;t=(s|0)>0;if(t){u=(c[d+3304>>2]|0)==0;v=j*3.141592653589793/180.0;w=k*3.141592653589793/180.0;x=u?w:v;y=u?v:w;w=a-(u?j:k);v=l*n;if(v>180.0|v<-180.0){if(w>360.0){z=a+-360.0}else{z=a}if(w<0.0){A=z+360.0}else{A=z}}else{if(w>180.0){B=a+-360.0}else{B=a}if(w<-180.0){A=B+360.0}else{A=B}}B=A*3.141592653589793/180.0;w=b*3.141592653589793/180.0;z=+S(+w);v=+T(+w);C=B-y;D=A;E=z;F=w;G=x;H=z*+T(+C);I=B;J=y;K=v;L=v*+T(+x)+z*+S(+x)*+S(+C)}else{D=a;E=0.0;F=0.0;G=0.0;H=0.0;I=0.0;J=0.0;K=0.0;L=0.0}a:do{switch(s|0){case 22:{a=(I-J)*.5;if(+P(+a)>1.5707963267948974){M=1;i=g;return M|0}C=o*q+n*r;x=(C==0.0?3.141592653589793:C*3.141592653589793)/180.0;C=k*3.141592653589793/180.0;z=x+C;v=+T(+C);y=+S(+C);C=+Q(+((y+1.0)*.5));B=+T(+z)/+Q(+((+S(+z)+1.0)*.5))-v/C;z=x/(B==0.0?1.0:B);B=n*q-o*r;x=(B==0.0?3.141592653589793:B*3.141592653589793)/180.0;B=x*.5;w=y*2.0*+T(+B);A=+S(+F);N=+Q(+((A*+S(+a)+1.0)*.5));if(+P(+N)<1.0e-5){M=3;i=g;return M|0}else{O=+T(+a)*A*x*+Q(+((y*+S(+B)+1.0)*.5))/(w==0.0?1.0:w)*2.0/N;R=z*+T(+F)/N-v*z/C;break a}break};case 3:case 32:case 33:case 31:{if(!(L<=0.0)){C=+T(+G);z=+S(+G);v=+S(+(I-J));N=K*C+E*z*v;O=H/N;R=(K*z-E*C*v)/N;break a}else{M=1;i=g;return M|0}break};case 16:{N=+U(+G);v=1.0/N;C=N*-2.0;z=N*N;w=N/3.0;N=C*C;B=(J-I)*+T(+G);y=F-G;x=v*(y*(C*.5+y*(z*.5+N*-.125+y*(w*.5+(z*C*-.25+C*N*.0625)+y*(z*.1875*N+(z*z*-.125-C*.25*w)-N*N*.0390625))))+1.0);N=B*B;if((c[d+3300>>2]|0)==0){W=n/+P(+n)}else{w=+h[d+56>>3];W=w/+P(+w)}O=(1.0-N/6.0)*B*x*W;R=v-(1.0-N*.5)*x;break};case 27:{if(G==0.0){M=1;i=g;return M|0}else{O=H;R=(+S(+G)-E*+S(+(I-J)))/+T(+G);break a}break};case 12:{x=o*q+n*r;N=x==0.0?1.0:x;x=(k*.5+45.0)*3.141592653589793/180.0;v=+_(+(+U(+x)));B=N*3.141592653589793/180.0/(+_(+(+U(+(N*.5*.01745329252+x))))-v);x=+S(+(k*3.141592653589793/180.0));N=+U(+(F*.5+.7853981633974487));if(N<1.0e-5){M=2;i=g;return M|0}else{O=(I-J)*(!(x<=0.0)?x:1.0);R=B*+_(+N)-v*B;break a}break};case 6:{B=+T(+G);v=+S(+G);N=+S(+(I-J));x=K*B+E*v*N;w=x<-1.0?-1.0:x;x=+V(+(w>1.0?1.0:w));if(x!=0.0){X=x/+T(+x)}else{X=1.0}O=H*X;R=(K*v-E*B*N)*X;break};case 20:case 28:{if(+P(+F)>1.5707963267948974){M=1;i=g;return M|0}if(+P(+G)>1.5707963267948974){M=1;i=g;return M|0}else{O=E*(I-J);R=F-G;break a}break};case 11:{O=I-J;R=F-G;break};case 4:{if(L<0.0){M=1;i=g;return M|0}else{O=H;R=K*+S(+G)-E*+T(+G)*+S(+(I-J));break a}break};case 5:{if(+P(+F)>1.5707963267948974){M=1;i=g;return M|0}N=+T(+G);B=+S(+G);v=+S(+(I-J));x=K*N+1.0+E*B*v;if(+P(+x)<1.0e-5){M=1;i=g;return M|0}else{w=2.0/x;O=H*w;R=(K*B-E*N*v)*w;break a}break};default:{O=H;R=0.0}}}while(0);if(t){Y=O*180.0/3.141592653589793;Z=R*180.0/3.141592653589793}else{Y=D-j;Z=b-k}t=(c[d+3304>>2]|0)==0;k=t?Z:Y;b=t?Y:Z;if((c[d+3300>>2]|0)==0){if(p!=0.0){$=q*b+r*k;aa=q*k-r*b}else{$=b;aa=k}if(n!=0.0){ba=$/n}else{ba=$}if(o!=0.0){ca=ba;da=aa/o}else{ca=ba;da=aa}}else{ca=b*+h[d+88>>3]+k*+h[d+96>>3];da=b*+h[d+104>>3]+k*+h[d+112>>3]}k=l+ca;h[e>>3]=k;do{if((s|0)==11){ca=+h[d+136>>3];if(k>ca){l=k-360.0/n;if(!(l>0.0)){break}h[e>>3]=l;break}if(k<0.0?(l=k+360.0/n,l<=ca):0){h[e>>3]=l}}}while(0);h[f>>3]=m+da;M=0;i=g;return M|0}function bd(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0;g=i;j=c[d+3268>>2]|0;k=c[d+3272>>2]|0;l=a- +h[d+616>>3];a=b- +h[d+624>>3];b=l*l;m=a*a;n=l*b;o=a*m;p=b+m;q=+h[d+256>>3]+l*+h[d+264>>3]+a*+h[d+272>>3]+b*+h[d+280>>3]+m*+h[d+288>>3]+a*l*+h[d+296>>3];if((j|0)>6){r=q+n*+h[d+304>>3]+o*+h[d+312>>3];if((j|0)>8){s=p*+h[d+336>>3]+(r+a*b*+h[d+320>>3]+m*l*+h[d+328>>3])+p*l*+h[d+344>>3]+p*a*+h[d+352>>3]}else{s=r}}else{s=q}q=+h[d+416>>3]+l*+h[d+424>>3]+a*+h[d+432>>3]+b*+h[d+440>>3]+m*+h[d+448>>3]+a*l*+h[d+456>>3];if((k|0)>6){r=q+n*+h[d+464>>3]+o*+h[d+472>>3];if((k|0)>8){t=p*+h[d+496>>3]+(r+a*b*+h[d+480>>3]+l*m*+h[d+488>>3])+p*l*+h[d+504>>3]+p*a*+h[d+512>>3]}else{t=r}}else{t=q}q=t*3.141592653589793/180.0;t=+h[d+696>>3]*3.141592653589793/180.0;r=+U(+t);a=1.0-q*r;p=+Y(+(s*3.141592653589793/180.0/+S(+t)),+a);t=+h[d+688>>3]*3.141592653589793/180.0+p;if(!(t<0.0)){u=t;v=u*180.0;w=v/3.141592653589793;h[e>>3]=w;x=+S(+p);y=q+r;z=a/y;A=x/z;B=+X(+A);C=B*180.0;D=C/3.141592653589793;h[f>>3]=D;i=g;return 0}u=t+6.28318530717959;v=u*180.0;w=v/3.141592653589793;h[e>>3]=w;x=+S(+p);y=q+r;z=a/y;A=x/z;B=+X(+A);C=B*180.0;D=C/3.141592653589793;h[f>>3]=D;i=g;return 0}function cd(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0,M=0,N=0,O=0,Q=0,R=0,T=0,V=0,W=0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ba=0.0,ca=0.0,da=0.0,ea=0.0,fa=0.0,ga=0.0,ha=0.0,ia=0.0,ja=0.0,ka=0.0,la=0.0,ma=0.0,na=0.0,oa=0.0,pa=0.0,qa=0.0,ra=0.0,sa=0.0,ta=0.0,ua=0.0,va=0.0,wa=0.0,xa=0,ya=0.0,za=0.0,Aa=0.0,Ba=0.0,Ca=0.0,Da=0.0,Ea=0;g=i;j=c[d+3268>>2]|0;k=c[d+3272>>2]|0;l=+U(+(b*3.141592653589793/180.0));b=+h[d+696>>3]*3.141592653589793/180.0;m=+U(+b);n=a*3.141592653589793/180.0- +h[d+688>>3]*3.141592653589793/180.0;a=+S(+n);o=(1.0-m*a/l)/(m+a/l);l=+S(+b)*+U(+n)*(1.0-m*o)*180.0/3.141592653589793;m=o*180.0/3.141592653589793;o=l*+h[d+88>>3]+m*+h[d+96>>3];n=l*+h[d+104>>3]+m*+h[d+112>>3];b=+h[d+256>>3];a=+h[d+264>>3];p=+h[d+272>>3];q=+h[d+280>>3];r=+h[d+288>>3];s=+h[d+296>>3];t=q*2.0;u=r*2.0;v=d+304|0;w=d+312|0;x=(j|0)>8;y=d+320|0;z=d+328|0;A=d+336|0;B=d+344|0;C=d+352|0;D=+h[d+416>>3];E=+h[d+424>>3];F=+h[d+432>>3];G=+h[d+440>>3];H=+h[d+448>>3];I=+h[d+456>>3];J=G*2.0;K=H*2.0;L=(k|0)>6;M=d+464|0;N=d+472|0;O=(k|0)>8;k=d+480|0;Q=d+488|0;R=d+496|0;T=d+504|0;V=d+512|0;a:do{if((j|0)>6){W=0;X=o;Y=n;while(1){Z=Y*X;_=X*X;$=Y*Y;aa=X*_;ba=Y*$;ca=Y*_;da=$*X;ea=$+_;fa=+h[v>>3];ga=+h[w>>3];ha=b+X*a+Y*p+_*q+$*r+Z*s+aa*fa+ba*ga;ia=a+X*t+Y*s+_*fa*3.0;fa=X*s+(p+Y*u)+$*ga*3.0;if(x){ga=+h[y>>3];ja=+h[z>>3];ka=+h[A>>3];la=+h[B>>3];ma=+h[C>>3];na=ka*2.0;oa=ha+ca*ga+da*ja+ea*ka+ea*X*la+ea*Y*ma;pa=($+_*3.0)*la+($*ja+(ia+Z*ga*2.0)+X*na)+Z*ma*2.0;qa=($*3.0+_)*ma+(fa+_*ga+Z*ja*2.0+Y*na+Z*la*2.0)}else{oa=ha;pa=ia;qa=fa}fa=D+X*E+Y*F+_*G+$*H+Z*I;ia=E+X*J+Y*I;ha=X*I+(F+Y*K);if(L){la=+h[M>>3];na=+h[N>>3];ja=fa+aa*la+ba*na;ba=ia+_*la*3.0;la=ha+$*na*3.0;if(O){na=+h[k>>3];aa=+h[Q>>3];ga=+h[R>>3];ma=+h[T>>3];ka=+h[V>>3];ra=ga*2.0;sa=ja+ca*na+da*aa+ea*ga+ea*X*ma+ea*Y*ka;ta=($+_*3.0)*ma+($*aa+(ba+Z*na*2.0)+X*ra)+Z*ka*2.0;ua=($*3.0+_)*ka+(la+_*na+Z*aa*2.0+Y*ra+Z*ma*2.0)}else{sa=ja;ta=ba;ua=la}}else{sa=fa;ta=ia;ua=ha}ha=oa-l;ia=sa-m;fa=pa*ua-qa*ta;la=(qa*ia-ha*ua)/fa;ba=(ha*ta-pa*ia)/fa;fa=X+la;ia=Y+ba;if(+P(+la)<5.0e-7?+P(+ba)<5.0e-7:0){va=fa;wa=ia;break a}xa=W+1|0;if((xa|0)<50){W=xa;X=fa;Y=ia}else{va=fa;wa=ia;break}}}else{W=0;Y=o;X=n;while(1){ia=X*Y;fa=Y*Y;ba=X*X;la=X*fa;ha=ba*Y;ja=ba+fa;ma=b+Y*a+X*p+fa*q+ba*r+ia*s;Z=a+Y*t+X*s;ra=Y*s+(p+X*u);aa=D+Y*E+X*F+fa*G+ba*H+ia*I;na=E+Y*J+X*I;_=Y*I+(F+X*K);if(L){ka=+h[M>>3];$=+h[N>>3];ea=aa+Y*fa*ka+X*ba*$;ga=na+fa*ka*3.0;ka=_+ba*$*3.0;if(O){$=+h[k>>3];da=+h[Q>>3];ca=+h[R>>3];ya=+h[T>>3];za=+h[V>>3];Aa=ca*2.0;Ba=ea+la*$+ha*da+ja*ca+ja*Y*ya+ja*X*za;Ca=(ba+fa*3.0)*ya+(ba*da+(ga+ia*$*2.0)+Y*Aa)+ia*za*2.0;Da=(ba*3.0+fa)*za+(ka+fa*$+ia*da*2.0+X*Aa+ia*ya*2.0)}else{Ba=ea;Ca=ga;Da=ka}}else{Ba=aa;Ca=na;Da=_}_=ma-l;ma=Ba-m;na=Z*Da-ra*Ca;aa=(ra*ma-_*Da)/na;ra=(_*Ca-Z*ma)/na;na=Y+aa;ma=X+ra;if(+P(+aa)<5.0e-7?+P(+ra)<5.0e-7:0){va=na;wa=ma;break a}xa=W+1|0;if((xa|0)<50){W=xa;Y=na;X=ma}else{va=na;wa=ma;break}}}}while(0);h[e>>3]=va+ +h[d+616>>3];va=wa+ +h[d+624>>3];h[f>>3]=va;wa=+h[e>>3];if(wa<.5){Ea=-1;i=g;return Ea|0}if(wa>+h[d+136>>3]+.5|va<.5){Ea=-1;i=g;return Ea|0}if(va>+h[d+144>>3]+.5){Ea=-1;i=g;return Ea|0}Ea=0;i=g;return Ea|0}function dd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0;d=i;e=gg(2e3)|0;f=gg(2e3)|0;Nc(a,10344,2e3,e)|0;Nc(a,10352,2e3,f)|0;a=gg(2e3)|0;g=gg(2e3)|0;j=b+3176|0;if((+h[j>>3]>360.0?(Xc(e,10360,j)|0)==0:0)?(Xc(f,10360,j)|0)==0:0){h[j>>3]=180.0}j=b+3192|0;if((Xc(e,10376,j)|0)==0?(Xc(f,10376,j)|0)==0:0){h[j>>3]=57.29577951308232}do{if((Zc(e,10384,2e3,a)|0)==0){if((Zc(f,10384,2e3,a)|0)==0){c[b+5960>>2]=0;break}else{c[b+5960>>2]=gd(a)|0;break}}else{c[b+5960>>2]=gd(a)|0}}while(0);do{if((Zc(f,10392,2e3,g)|0)==0){if((Zc(e,10392,2e3,g)|0)==0){c[b+5964>>2]=0;break}else{c[b+5964>>2]=gd(g)|0;break}}else{c[b+5964>>2]=gd(g)|0}}while(0);ac(b);hg(e);hg(f);hg(a);hg(g);if((c[b+5964>>2]|0)==0?(c[b+5960>>2]|0)==0:0){k=1;i=d;return k|0}k=0;i=d;return k|0}function ed(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0;g=i;j=a- +h[d+616>>3];a=b- +h[d+624>>3];if((c[d+3300>>2]|0)==0){b=+h[d+760>>3];if(b==0.0){k=2;l=0.0;m=0.0;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}n=+h[d+768>>3];if(n==0.0){k=2;l=0.0;m=0.0;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}o=j*b;b=a*n;n=+h[d+48>>3];if(n!=0.0){p=n*3.141592653589793/180.0;n=+S(+p);q=+T(+p);r=o*n-b*q;s=b*n+o*q}else{r=o;s=b}}else{r=j*+h[d+56>>3]+a*+h[d+64>>3];s=j*+h[d+72>>3]+a*+h[d+80>>3]}t=(c[d+3304>>2]|0)==0|0;a=(90.0- +h[d+(t<<3)+688>>3])*3.141592653589793/180.0;j=+S(+a);b=+T(+a);o=+h[d+3176>>3]*3.141592653589793/180.0;u=c[d+5960>>2]|0;if((u|0)==0){v=r}else{v=r+ +hd(u,r,s)}u=c[d+5964>>2]|0;if((u|0)==0){w=s}else{w=s+ +hd(u,r,s)}s=+Q(+(v*v+w*w));if(s==0.0){x=0.0}else{x=+Y(+v,+-w)}w=+Y(+(+h[d+3192>>3]),+s);s=+S(+w);v=+T(+w);r=x-o;o=+S(+r);x=+T(+r);q=j*s;n=b*v-q*o;if(+P(+n)<1.0e-5){y=q*(1.0-o)- +S(+(a+w))}else{y=n}n=s*x;if(y!=0.0|n!=-0.0){z=+Y(+-n,+y)}else{z=r+3.141592653589793}x=+h[d+((t^1)<<3)+688>>3];q=x+z*180.0/3.141592653589793;if(!(x>=0.0)){if(q>0.0){A=q+-360.0}else{A=q}}else{if(q<0.0){A=q+360.0}else{A=q}}if(!(A>360.0)){if(A<-360.0){B=A+360.0}else{B=A}}else{B=A+-360.0}if(+qa(+r,3.141592653589793)==0.0){r=(w+a*o)*180.0/3.141592653589793;if(r>90.0){C=180.0-r}else{C=r}if(!(C<-90.0)){k=0;l=C;m=B;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}k=0;l=-180.0-C;m=B;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}C=j*v+b*s*o;if(!(+P(+C)>.99)){k=0;l=+W(+C)*180.0/3.141592653589793;m=B;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}o=+V(+(+Q(+(n*n+y*y))));if(!(C>=0.0)){k=0;l=o*-180.0/3.141592653589793;m=B;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}else{k=0;l=o*180.0/3.141592653589793;m=B;h[e>>3]=m;h[f>>3]=l;i=g;return k|0}return 0}function fd(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0,E=0,F=0.0,G=0.0,H=0.0,I=0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,R=0,U=0.0,X=0.0,Z=0.0,_=0,$=0.0,aa=0.0,ba=0.0;g=i;j=d+3304|0;k=(c[j>>2]|0)==0|0;l=(a- +h[d+((k^1)<<3)+688>>3])*3.141592653589793/180.0;a=b*3.141592653589793/180.0;b=+S(+l);m=+T(+l);n=+S(+a);o=+T(+a);p=(90.0- +h[d+(k<<3)+688>>3])*3.141592653589793/180.0;q=+S(+p);r=+T(+p);s=+h[d+3176>>3];if(s==999.0){t=3.141592653589793}else{t=s*3.141592653589793/180.0}s=n*q;u=o*r-b*s;if(+P(+u)<1.0e-5){v=(1.0-b)*s- +S(+(a+p))}else{v=u}u=m*n;if(v!=0.0|u!=-0.0){w=+Y(+-u,+v)}else{w=l+-3.141592653589793}m=t+w;if(!(m>3.141592653589793)){if(m<-3.141592653589793){x=m+6.283185307179586}else{x=m}}else{x=m+-6.283185307179586}do{if(+qa(+l,3.141592653589793)==0.0){m=a+b*p;if(m>1.5707963267948966){y=3.141592653589793-m}else{y=m}if(y<-1.5707963267948966){z=-3.141592653589793-y}else{z=y}}else{m=o*q+b*n*r;if(!(+P(+m)>.99)){z=+W(+m);break}w=+V(+(+Q(+(u*u+v*v))));if(!(m>=0.0)){z=-w}else{z=w}}}while(0);v=+T(+z);do{if(v==0.0){A=0.0;B=0.0}else{u=+h[d+3192>>3]*+S(+z)/v;k=d+5960|0;C=c[k>>2]|0;D=d+5964|0;if((C|0)==0?(c[D>>2]|0)==0:0){E=(c[j>>2]|0)==0;r=u*+T(+x);n=-(u*+S(+x));A=E?r:n;B=E?n:r;break}r=u*+T(+x);n=u*+S(+x);E=C;C=1;u=r;b=-n;while(1){if((E|0)==0){F=u;G=1.0;H=0.0}else{q=u+ +hd(E,u,b);o=+id(c[k>>2]|0,u,b,1,0)+1.0;F=q;G=o;H=+id(c[k>>2]|0,u,b,0,1)}o=F-r;I=c[D>>2]|0;if((I|0)==0){J=b;K=0.0;L=1.0}else{q=b+ +hd(I,u,b);y=+id(c[D>>2]|0,u,b,1,0);J=q;K=y;L=+id(c[D>>2]|0,u,b,0,1)+1.0}y=n+J;q=G*L-H*K;if(q==0.0){M=u;N=b;break}p=(H*y-o*L)/q;a=(o*K-G*y)/q;q=u+p;l=b+a;I=+P(+p)>+P(+a);w=I?p:a;a=+P(+w);I=+P(+o)>+P(+y);p=I?o:y;I=a>+P(+p);if(!(!(+P(+(I?w:p))<2.8e-8)&(C|0)<500)){M=q;N=l;break}E=c[k>>2]|0;C=C+1|0;u=q;b=l}C=(c[j>>2]|0)==0;A=C?M:N;B=C?N:M}}while(0);if((c[d+3300>>2]|0)!=0){h[e>>3]=A*+h[d+88>>3]+B*+h[d+96>>3];h[f>>3]=A*+h[d+104>>3]+B*+h[d+112>>3];O=+h[e>>3];R=d+16|0;U=+h[R>>3];X=O+U;h[e>>3]=X;Z=+h[f>>3];_=d+24|0;$=+h[_>>3];aa=Z+$;h[f>>3]=aa;i=g;return 0}M=+h[d+48>>3];if(M!=0.0){N=M*3.141592653589793/180.0;M=+S(+N);G=+T(+N);h[e>>3]=A*M+B*G;ba=B*M-A*G}else{h[e>>3]=A;ba=B}h[f>>3]=ba;ba=+h[d+32>>3];if(ba!=0.0){h[e>>3]=+h[e>>3]/ba}ba=+h[d+40>>3];if(!(ba!=0.0)){O=+h[e>>3];R=d+16|0;U=+h[R>>3];X=O+U;h[e>>3]=X;Z=+h[f>>3];_=d+24|0;$=+h[_>>3];aa=Z+$;h[f>>3]=aa;i=g;return 0}h[f>>3]=+h[f>>3]/ba;O=+h[e>>3];R=d+16|0;U=+h[R>>3];X=O+U;h[e>>3]=X;Z=+h[f>>3];_=d+24|0;$=+h[_>>3];aa=Z+$;h[f>>3]=aa;i=g;return 0}function gd(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+16|0;e=d;if((a[b+1|0]|0)==0){f=0;i=d;return f|0}g=gg(160)|0;c[e>>2]=b;j=b;k=b;b=g;g=0;l=20;a:while(1){if((a[k]|0)==0){break}m=+wg(j,e);n=c[e>>2]|0;o=a[n]|0;if(o<<24>>24==46){p=n+1|0;c[e>>2]=p;q=a[p]|0;r=p}else{q=o;r=n}if(q<<24>>24==0){break}n=g+1|0;if((n|0)<(l|0)){s=r;t=b;u=l}else{o=l+20|0;p=jg(b,o<<3)|0;s=c[e>>2]|0;t=p;u=o}h[t+(g<<3)>>3]=m;o=s;while(1){if((a[o]|0)==32){o=o+1|0}else{j=o;k=s;b=t;g=n;l=u;continue a}}}u=jd(b)|0;hg(b);f=(g|0)==0?0:u;i=d;return f|0}function hd(a,b,d){a=a|0;b=+b;d=+d;var e=0,f=0,g=0,j=0.0,k=0.0,l=0,m=0.0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0,F=0,G=0,H=0,I=0,J=0.0,K=0,L=0.0,M=0,N=0.0,O=0;e=i;f=c[a+32>>2]|0;if((f|0)==1){g=c[a+36>>2]|0;j=+h[a+8>>3];k=+h[a>>3];l=c[a+56>>2]|0;h[l>>3]=1.0;if(((g|0)!=1?(m=(j+b)*k,h[l+8>>3]=m,(g|0)>2):0)?(k=m*2.0,j=k*m+-1.0,h[l+16>>3]=j,(g|0)!=3):0){m=j;n=3;p=2;while(1){m=k*m- +h[l+(p+ -1<<3)>>3];h[l+(n<<3)>>3]=m;q=n+1|0;if((q|0)==(g|0)){break}else{r=n;n=q;p=r}}}p=c[a+40>>2]|0;m=+h[a+24>>3];k=+h[a+16>>3];n=c[a+60>>2]|0;h[n>>3]=1.0;if((p|0)!=1){j=(m+d)*k;h[n+8>>3]=j;if((p|0)>2){k=j*2.0;m=k*j+-1.0;h[n+16>>3]=m;if((p|0)==3){s=l;t=n;u=3;v=g;w=25}else{j=m;r=3;q=2;while(1){m=k*j- +h[n+(q+ -1<<3)>>3];h[n+(r<<3)>>3]=m;x=r+1|0;if((x|0)==(p|0)){y=g;z=p;A=l;B=n;w=26;break}else{C=r;j=m;r=x;q=C}}}}else{y=g;z=p;A=l;B=n;w=26}}else{s=l;t=n;u=1;v=g;w=25}}else if((f|0)==3){g=c[a+36>>2]|0;n=c[a+56>>2]|0;h[n>>3]=1.0;if((g|0)!=1?(h[n+8>>3]=b,(g|0)>2):0){j=b;l=2;do{j=j*b;h[n+(l<<3)>>3]=j;l=l+1|0}while((l|0)!=(g|0))}l=c[a+40>>2]|0;p=c[a+60>>2]|0;h[p>>3]=1.0;if((l|0)!=1){h[p+8>>3]=d;if((l|0)>2){j=d;q=2;while(1){k=j*d;h[p+(q<<3)>>3]=k;r=q+1|0;if((r|0)==(l|0)){y=g;z=l;A=n;B=p;w=26;break}else{j=k;q=r}}}else{y=g;z=l;A=n;B=p;w=26}}else{s=n;t=p;u=1;v=g;w=25}}else if((f|0)==2){f=c[a+36>>2]|0;j=+h[a+8>>3];k=+h[a>>3];g=c[a+56>>2]|0;h[g>>3]=1.0;if(((f|0)!=1?(m=(j+b)*k,h[g+8>>3]=m,(f|0)>2):0)?(k=(m*m*3.0+-1.0)*.5,h[g+16>>3]=k,(f|0)!=3):0){p=3;b=k;n=2;while(1){k=+(p|0);b=(b*m*(k*2.0+-1.0)- +h[g+(n+ -1<<3)>>3]*(k+-1.0))/k;h[g+(p<<3)>>3]=b;l=p+1|0;if((l|0)==(f|0)){break}else{q=p;p=l;n=q}}}n=c[a+40>>2]|0;b=+h[a+24>>3];m=+h[a+16>>3];p=c[a+60>>2]|0;h[p>>3]=1.0;if((n|0)!=1){k=(b+d)*m;h[p+8>>3]=k;if((n|0)>2){m=(k*k*3.0+-1.0)*.5;h[p+16>>3]=m;if((n|0)==3){s=g;t=p;u=3;v=f;w=25}else{q=3;d=m;l=2;while(1){m=+(q|0);b=(d*k*(m*2.0+-1.0)- +h[p+(l+ -1<<3)>>3]*(m+-1.0))/m;h[p+(q<<3)>>3]=b;r=q+1|0;if((r|0)==(n|0)){y=f;z=n;A=g;B=p;w=26;break}else{C=q;q=r;d=b;l=C}}}}else{y=f;z=n;A=g;B=p;w=26}}else{s=g;t=p;u=1;v=f;w=25}}else{ab(10400,33,1,c[o>>2]|0)|0;D=0.0;i=e;return+D}if((w|0)==25){E=(v|0)>(u|0)?v:u;F=t;G=u;H=s;I=v}else if((w|0)==26){if((z|0)>0){E=(y|0)>(z|0)?y:z;F=B;G=z;H=A;I=y}else{D=0.0;i=e;return+D}}y=c[a+44>>2]|0;A=a+52|0;if((y|0)==2){a=0;z=0;d=0.0;B=I;while(1){if((B|0)>0){w=c[A>>2]|0;k=0.0;v=z;s=0;while(1){k=k+ +h[w+(v<<3)>>3]*+h[H+(s<<3)>>3];s=s+1|0;if((s|0)==(B|0)){break}else{v=v+1|0}}J=k;K=B+z|0}else{J=0.0;K=z}b=d+J*+h[F+(a<<3)>>3];v=(((a+1+I|0)>(E|0))<<31>>31)+B|0;s=a+1|0;if((s|0)<(G|0)){a=s;z=K;d=b;B=v}else{D=b;break}}i=e;return+D}else if((y|0)==0){y=0;B=0;d=0.0;K=I;while(1){if((K|0)>0){z=c[A>>2]|0;J=0.0;a=B;E=0;while(1){J=J+ +h[z+(a<<3)>>3]*+h[H+(E<<3)>>3];E=E+1|0;if((E|0)==(K|0)){break}else{a=a+1|0}}L=J;M=K+B|0}else{L=0.0;M=B}k=d+L*+h[F+(y<<3)>>3];a=y+1|0;if((a|0)<(G|0)){y=a;B=M;d=k;K=1}else{D=k;break}}i=e;return+D}else{K=0;M=0;d=0.0;while(1){if((I|0)>0){B=c[A>>2]|0;L=0.0;y=M;a=0;while(1){L=L+ +h[B+(y<<3)>>3]*+h[H+(a<<3)>>3];a=a+1|0;if((a|0)==(I|0)){break}else{y=y+1|0}}N=L;O=I+M|0}else{N=0.0;O=M}J=d+N*+h[F+(K<<3)>>3];y=K+1|0;if((y|0)<(G|0)){K=y;M=O;d=J}else{D=J;break}}i=e;return+D}return 0.0}function id(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0,S=0,T=0.0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0.0,$=0.0,ba=0.0,ca=0.0,da=0,ea=0.0,fa=0.0;g=i;i=i+16|0;j=g;if((a|0)==0){k=0.0;i=g;return+k}l=f|e;if((l|0)<0){ab(10440,46,1,c[o>>2]|0)|0;k=0.0;i=g;return+k}if((l|0)==0){k=+hd(a,b,d);i=g;return+k}l=gg(64)|0;m=a+36|0;n=c[m>>2]|0;p=n+ -1|0;q=(p|0)>(e|0)?e:p;p=a+40|0;e=c[p>>2]|0;r=e+ -1|0;s=(r|0)>(f|0)?f:r;r=c[a+32>>2]|0;t=l+32|0;c[t>>2]=r;if(!((r+ -1|0)>>>0<3)){u=c[o>>2]|0;c[j>>2]=r;za(u|0,10488,j|0)|0;k=0.0;i=g;return+k}j=c[a+44>>2]|0;u=l+44|0;c[u>>2]=j;do{if((j|0)==2){r=((n|0)>(e|0)?n:e)-s-q|0;v=n-q|0;w=(r|0)<(v|0)?r:v;v=(w|0)<1?1:w;w=l+36|0;c[w>>2]=v;x=e-s|0;y=(r|0)<(x|0)?r:x;x=(y|0)<1?1:y;y=l+40|0;c[y>>2]=x;r=(v|0)<(x|0)?v:x;z=(aa(x,v)|0)-((aa(r+ -1|0,r)|0)/2|0)|0;r=l+48|0;c[r>>2]=z;A=r;B=w;C=y;D=z;E=v;F=x}else if((j|0)==0){x=(q|0)>0;v=(s|0)>0;if(x&v){z=l+36|0;c[z>>2]=1;y=l+40|0;c[y>>2]=1;w=l+48|0;c[w>>2]=1;A=w;B=z;C=y;D=1;E=1;F=1;break}if(x){x=n-q|0;y=(x|0)<1?1:x;x=l+36|0;c[x>>2]=y;z=l+40|0;c[z>>2]=1;w=l+48|0;c[w>>2]=y;A=w;B=x;C=z;D=y;E=y;F=1;break}if(v){v=l+36|0;c[v>>2]=1;y=e-s|0;z=(y|0)<1?1:y;y=l+40|0;c[y>>2]=z;x=l+48|0;c[x>>2]=z;A=x;B=v;C=y;D=z;E=1;F=z;break}else{A=l+48|0;B=l+36|0;C=l+40|0;D=0;E=0;F=0;break}}else{z=n-q|0;y=(z|0)<1?1:z;z=l+36|0;c[z>>2]=y;v=e-s|0;x=(v|0)<1?1:v;v=l+40|0;c[v>>2]=x;w=aa(x,y)|0;r=l+48|0;c[r>>2]=w;A=r;B=z;C=v;D=w;E=y;F=x}}while(0);h[l>>3]=+h[a>>3];h[l+8>>3]=+h[a+8>>3];n=l+16|0;h[n>>3]=+h[a+16>>3];h[l+24>>3]=+h[a+24>>3];j=l+52|0;c[j>>2]=gg(D<<3)|0;D=l+56|0;c[D>>2]=gg(E<<3)|0;E=l+60|0;c[E>>2]=gg(F<<3)|0;F=a+48|0;x=c[F>>2]|0;y=x<<3;w=c[2632]|0;if((y|0)>(w|0)){if((w|0)>0){G=jg(c[2634]|0,y)|0}else{G=gg(y)|0}c[2634]=G;c[2632]=y;H=G;I=c[F>>2]|0}else{H=c[2634]|0;I=x}if((I|0)>0){x=c[a+52>>2]|0;a=0;do{h[H+(a<<3)>>3]=+h[x+(a<<3)>>3];a=a+1|0}while((a|0)!=(I|0))}a=c[u>>2]|0;a:do{if((a|0)==1){u=c[p>>2]|0;x=u+ -1|0;if((u|0)>(s|0)){u=c[m>>2]|0;F=c[B>>2]|0;G=aa(x,u)|0;y=aa((c[C>>2]|0)+ -1|0,F)|0;w=1-s|0;v=q+1|0;z=(u|0)<(v|0);r=(F|0)>0;J=0-u|0;K=1-q|0;L=x;x=H+(G<<3)|0;G=(c[j>>2]|0)+(y<<3)|0;while(1){y=w+L|0;if((L|0)>=(y|0)){M=L;while(1){if(r){N=+(M|0);O=0;do{P=x+(O+q<<3)|0;h[P>>3]=N*+h[P>>3];O=O+1|0}while((O|0)<(F|0))}if((M|0)>(y|0)){M=M+ -1|0}else{break}}}if(!z){M=u;while(1){y=K+M|0;O=M+ -1|0;if((M|0)>=(y|0)){P=x+(O<<3)|0;N=+h[P>>3];Q=M;while(1){S=Q+ -1|0;T=+(S|0)*N;if((Q|0)>(y|0)){N=T;Q=S}else{break}}h[P>>3]=T}if((M|0)>(v|0)){M=O}else{break}}}if(r){M=0;do{h[G+(M<<3)>>3]=+h[x+(M+q<<3)>>3];M=M+1|0}while((M|0)<(F|0))}if((L|0)>(s|0)){L=L+ -1|0;x=x+(J<<3)|0;G=G+(0-F<<3)|0}else{break}}}}else if((a|0)==2){F=c[m>>2]|0;G=c[p>>2]|0;J=((F|0)>(G|0)?F:G)+1|0;x=c[B>>2]|0;L=c[C>>2]|0;r=s+1|0;if((G|0)>=(r|0)){v=r+((x|0)>(L|0)?x:L)|0;L=1-s|0;K=q+1|0;u=1-q|0;z=G;G=H+(I<<3)|0;w=(c[j>>2]|0)+(c[A>>2]<<3)|0;while(1){M=J-z|0;Q=(M|0)<(F|0)?M:F;M=(Q|0)<0?0:Q;Q=v-z|0;y=(Q|0)<(x|0)?Q:x;Q=(y|0)<0?0:y;y=G+(0-M<<3)|0;S=w+(0-Q<<3)|0;U=L+z|0;if((z|0)>(U|0)){V=(Q|0)>0;W=q-M|0;X=z;do{X=X+ -1|0;if(V){N=+(X|0);Y=0;do{Z=G+(W+Y<<3)|0;h[Z>>3]=N*+h[Z>>3];Y=Y+1|0}while((Y|0)<(Q|0))}}while((X|0)>(U|0))}if((M|0)>=(K|0)){U=M;while(1){X=u+U|0;W=U+ -1|0;if((U|0)>=(X|0)){V=G+(W-M<<3)|0;N=+h[V>>3];Y=U;while(1){O=Y+ -1|0;_=+(O|0)*N;if((Y|0)>(X|0)){N=_;Y=O}else{break}}h[V>>3]=_}if((U|0)>(K|0)){U=W}else{break}}}if((Q|0)>0){U=q-M|0;Y=0;do{h[w+(Y-Q<<3)>>3]=+h[G+(U+Y<<3)>>3];Y=Y+1|0}while((Y|0)<(Q|0))}if((z|0)>(r|0)){z=z+ -1|0;G=y;w=S}else{break}}}}else{w=(q|0)>0;G=(s|0)>0;if(w&G){h[c[j>>2]>>3]=0.0;break}if(w){w=c[m>>2]|0;z=q+1|0;if((w|0)<(z|0)){break}r=1-q|0;K=w;w=(c[j>>2]|0)+((c[A>>2]|0)+ -1<<3)|0;while(1){u=r+K|0;L=K+ -1|0;x=H+(L<<3)|0;N=+h[x>>3];if((K|0)<(u|0)){$=N}else{ba=N;v=K;while(1){F=v+ -1|0;ca=ba*+(F|0);if((v|0)>(u|0)){ba=ca;v=F}else{break}}h[x>>3]=ca;$=ca}h[w>>3]=$;if((K|0)>(z|0)){K=L;w=w+ -8|0}else{break a}}}if(G){w=H+(I+ -1<<3)|0;K=c[j>>2]|0;z=c[p>>2]|0;r=s+1|0;if((z|0)<(r|0)){da=w}else{v=1-s|0;u=0-e|0;S=~f;y=((u|0)>(S|0)?u:S)+ -1|0;S=~z;u=I+ -3-(z+((y|0)>(S|0)?y:S))|0;S=z;z=w;while(1){w=v+S|0;if((S|0)>=(w|0)){ba=+h[z>>3];y=S;while(1){F=y+ -1|0;ea=+(F|0)*ba;if((y|0)>(w|0)){ba=ea;y=F}else{break}}h[z>>3]=ea}if((S|0)>(r|0)){S=S+ -1|0;z=z+ -8|0}else{break}}da=H+(u<<3)|0}z=c[A>>2]|0;if((z|0)>0){S=0;while(1){r=S+1|0;h[K+(S<<3)>>3]=+h[da+(r<<3)>>3];if((r|0)<(z|0)){S=r}else{break}}}}}}while(0);ea=+hd(l,b,d);if((c[t>>2]|0)==3){if((l|0)==0){k=ea;i=g;return+k}else{fa=ea}}else{d=+R(+(+h[l>>3]),+(+(q|0)));fa=ea*d*+R(+(+h[n>>3]),+(+(s|0)))}s=c[D>>2]|0;if((s|0)!=0){hg(s)}s=c[E>>2]|0;if((s|0)!=0){hg(s)}s=c[j>>2]|0;if((s|0)!=0){hg(s)}hg(l);k=fa;i=g;return+k}function jd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,l=0.0,m=0.0,n=0,p=0.0,q=0.0,r=0,s=0,t=0;b=i;i=i+16|0;d=b;e=~~(+h[a+8>>3]+.5);if((e|0)<1){f=c[o>>2]|0;c[d>>2]=e;za(f|0,10544,d|0)|0;g=0;i=b;return g|0}f=~~(+h[a+16>>3]+.5);if((f|0)<1){j=c[o>>2]|0;c[d>>2]=f;za(j|0,10584,d|0)|0;g=0;i=b;return g|0}l=+h[a+32>>3];m=+h[a+40>>3];if(m<=l){j=c[o>>2]|0;h[k>>3]=l;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];n=d+8|0;h[k>>3]=m;c[n>>2]=c[k>>2];c[n+4>>2]=c[k+4>>2];za(j|0,10624,d|0)|0;g=0;i=b;return g|0}p=+h[a+48>>3];q=+h[a+56>>3];if(q<=p){j=c[o>>2]|0;h[k>>3]=p;c[d>>2]=c[k>>2];c[d+4>>2]=c[k+4>>2];n=d+8|0;h[k>>3]=q;c[n>>2]=c[k>>2];c[n+4>>2]=c[k+4>>2];za(j|0,10664,d|0)|0;g=0;i=b;return g|0}j=~~(+h[a>>3]+.5);if(!((j+ -1|0)>>>0<3)){n=c[o>>2]|0;c[d>>2]=j;za(n|0,10704,d|0)|0;g=0;i=b;return g|0}d=gg(64)|0;c[d+36>>2]=e;h[d>>3]=2.0/(m-l);h[d+8>>3]=(l+m)*-.5;c[d+40>>2]=f;h[d+16>>3]=2.0/(q-p);h[d+24>>3]=(p+q)*-.5;n=~~+h[a+24>>3];c[d+44>>2]=n;if((n|0)==1){r=aa(f,e)|0;c[d+48>>2]=r;s=r}else if((n|0)==2){r=(e|0)<(f|0)?e:f;t=(aa(f,e)|0)-((aa(r+ -1|0,r)|0)/2|0)|0;c[d+48>>2]=t;s=t}else if((n|0)==0){n=e+ -1+f|0;c[d+48>>2]=n;s=n}else{s=0}c[d+32>>2]=j;j=gg(s<<3)|0;c[d+52>>2]=j;if((s|0)>0){n=0;do{h[j+(n<<3)>>3]=+h[a+(n+8<<3)>>3];n=n+1|0}while((n|0)<(s|0))}c[d+56>>2]=gg(e<<3)|0;c[d+60>>2]=gg(f<<3)|0;g=d;i=b;return g|0}function kd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0;d=i;i=i+16|0;e=d;f=d+8|0;g=gg(2e3)|0;j=gg(2e3)|0;if((Nc(a,10744,2e3,g)|0)==0){k=gg((Dg(a|0)|0)+200|0)|0;Kg(k|0,10752,161)|0;Fg(k|0,a|0)|0;Nc(k,10744,2e3,g)|0;Nc(k,10920,2e3,j)|0;hg(k)}Nc(a,10920,2e3,j)|0;a=gg(2e3)|0;k=gg(2e3)|0;l=b+3176|0;if((+h[l>>3]>360.0?(Xc(g,10928,l)|0)==0:0)?(Xc(j,10928,l)|0)==0:0){h[l>>3]=180.0}l=b+3192|0;if((Xc(g,10944,l)|0)==0?(Xc(j,10944,l)|0)==0:0){h[l>>3]=57.29577951308232}l=0;do{c[e>>2]=l;Na(f|0,10952,e|0)|0;m=b+(l<<3)+4096|0;if((Xc(g,f,m)|0)==0){h[m>>3]=0.0}l=l+1|0}while((l|0)!=10);do{if((Zc(g,10960,2e3,a)|0)==0){if((Zc(j,10960,2e3,a)|0)==0){c[b+5960>>2]=0;break}else{c[b+5960>>2]=gd(a)|0;break}}else{c[b+5960>>2]=gd(a)|0}}while(0);do{if((Zc(j,10968,2e3,k)|0)==0){if((Zc(g,10968,2e3,k)|0)==0){c[b+5964>>2]=0;n=9;break}else{c[b+5964>>2]=gd(k)|0;n=9;break}}else{c[b+5964>>2]=gd(k)|0;n=9}}while(0);while(1){o=n+ -1|0;if(!(+h[b+(n<<3)+4096>>3]==0.0)){p=27;break}if((n|0)>0){n=o}else{p=25;break}}if((p|0)==25){c[b+3276>>2]=o}else if((p|0)==27?(c[b+3276>>2]=n,(n|0)>2):0){q=+h[b+4104>>3];p=1;r=0.0;while(1){s=+(p|0)*3.141592653589793/180.0;t=0.0;o=n;do{t=s*t+ +(o|0)*+h[b+(o<<3)+4096>>3];o=o+ -1|0}while((o|0)>0);o=p+1|0;if(t<=0.0){u=q;v=r;break}if((o|0)<181){q=t;p=o;r=s}else{u=t;v=s;break}}a:do{if(!(t<=0.0)){w=3.141592653589793}else{r=u;q=t;p=1;x=v;y=s;while(1){z=x-r*(y-x)/(q-r);A=0.0;o=n;do{A=z*A+ +(o|0)*+h[b+(o<<3)+4096>>3];o=o+ -1|0}while((o|0)>0);if(+P(+A)<1.0e-13){w=z;break a}o=A<0.0;l=p+1|0;if((l|0)<11){r=o?r:A;q=o?A:q;p=l;x=o?x:z;y=o?z:y}else{w=z;break}}}}while(0);if((n|0)>-1){p=n;s=0.0;while(1){v=w*s+ +h[b+(p<<3)+4096>>3];if((p|0)>0){p=p+ -1|0;s=v}else{B=v;break}}}else{B=0.0}h[b+3240>>3]=w;h[b+3248>>3]=B}ac(b);hg(g);hg(j);hg(a);hg(k);if((c[b+5964>>2]|0)==0?(c[b+5960>>2]|0)==0:0){C=1;i=d;return C|0}C=0;i=d;return C|0}



function ld(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0,L=0.0,M=0.0,N=0.0,O=0.0,R=0.0,U=0.0,X=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ba=0.0;g=i;j=a- +h[d+616>>3];a=b- +h[d+624>>3];do{if((c[d+3300>>2]|0)==0){b=+h[d+760>>3];if(!(b==0.0)?(k=+h[d+768>>3],!(k==0.0)):0){l=j*b;b=a*k;k=+h[d+48>>3];if(!(k!=0.0)){m=l;n=b;break}o=k*3.141592653589793/180.0;k=+S(+o);p=+T(+o);m=l*k-b*p;n=b*k+l*p;break}h[e>>3]=0.0;h[f>>3]=0.0;q=2;i=g;return q|0}else{m=j*+h[d+56>>3]+a*+h[d+64>>3];n=j*+h[d+72>>3]+a*+h[d+80>>3]}}while(0);r=(c[d+3304>>2]|0)==0|0;s=r^1;a=(90.0- +h[d+(r<<3)+688>>3])*3.141592653589793/180.0;j=+S(+a);p=+T(+a);l=+h[d+3176>>3]*3.141592653589793/180.0;r=c[d+3276>>2]|0;t=c[d+5960>>2]|0;if((t|0)==0){u=m}else{u=m+ +hd(t,m,n)}t=c[d+5964>>2]|0;if((t|0)==0){v=n}else{v=n+ +hd(t,m,n)}n=+Q(+(u*u+v*v));m=n/+h[d+3192>>3];if((r|0)<1){h[e>>3]=0.0;h[f>>3]=0.0;q=1;i=g;return q|0}a:do{if((r|0)==2){n=+h[d+4112>>3];k=+h[d+4104>>3];b=k*k-n*4.0*(+h[d+4096>>3]-m);if(b<0.0){h[e>>3]=0.0;h[f>>3]=0.0;q=1;i=g;return q|0}o=+Q(+b);b=n*2.0;n=(o-k)/b;w=(-k-o)/b;b=n<w?n:w;if(b<-1.0e-13){x=n>w?n:w}else{x=b}if(x<0.0){if(!(x<-1.0e-13)){y=0.0;break}h[e>>3]=0.0;h[f>>3]=0.0;q=1;i=g;return q|0}if(x>3.141592653589793){if(x>3.141592653589893){h[e>>3]=0.0;h[f>>3]=0.0;q=1;i=g;return q|0}else{y=3.141592653589793}}else{y=x}}else if((r|0)==1){y=(m- +h[d+4096>>3])/+h[d+4104>>3]}else{b=+h[d+4096>>3];w=+h[d+3240>>3];n=+h[d+3248>>3];if(m<b){if(!(m<b+-1.0e-13)){y=0.0;break}h[e>>3]=0.0;h[f>>3]=0.0;q=1;i=g;return q|0}if(m>n){if(!(m>n+1.0e-13)){y=w;break}h[e>>3]=0.0;h[f>>3]=0.0;q=1;i=g;return q|0}if((r|0)>-1){z=0;A=b;B=n;C=0.0;D=w}else{o=0.0-m;t=0;k=b;b=n;n=0.0;E=w;while(1){w=(b-m)/(b-k);if(!(w<.1)){if(w>.9){F=.9}else{F=w}}else{F=.1}w=E-(E-n)*F;if(m>0.0){if(m<1.0e-13){y=w;break a}else{G=0.0;H=b;I=w;J=E}}else{if(o<1.0e-13){y=w;break a}else{G=k;H=0.0;I=n;J=w}}K=t+1|0;if(!(+P(+(J-I))<1.0e-13)&(K|0)<100){t=K;k=G;b=H;n=I;E=J}else{y=w;break a}}}while(1){E=(B-m)/(B-A);if(!(E<.1)){if(E>.9){L=.9}else{L=E}}else{L=.1}E=D-(D-C)*L;t=r;n=0.0;while(1){n=E*n+ +h[d+(t<<3)+4096>>3];if((t|0)<=0){break}else{t=t+ -1|0}}if(n<m){if(m-n<1.0e-13){y=E;break a}else{M=n;N=B;O=E;R=D}}else{if(n-m<1.0e-13){y=E;break a}else{M=A;N=n;O=C;R=E}}t=z+1|0;if(!(+P(+(R-O))<1.0e-13)&(t|0)<100){z=t;A=M;B=N;C=O;D=R}else{y=E;break}}}}while(0);if(m==0.0){U=0.0}else{U=+Y(+u,+-v)}v=1.5707963267948966-y;y=+S(+v);u=+T(+v);m=U-l;l=+S(+m);U=+T(+m);R=j*y;D=p*u-R*l;if(+P(+D)<1.0e-5){X=R*(1.0-l)- +S(+(a+v))}else{X=D}D=y*U;if(X!=0.0|D!=-0.0){Z=+Y(+-D,+X)}else{Z=m+3.141592653589793}U=+h[d+(s<<3)+688>>3];R=U+Z*180.0/3.141592653589793;if(!(U>=0.0)){if(R>0.0){_=R+-360.0}else{_=R}}else{if(R<0.0){_=R+360.0}else{_=R}}if(!(_>360.0)){if(_<-360.0){$=_+360.0}else{$=_}}else{$=_+-360.0}do{if(+qa(+m,3.141592653589793)==0.0){_=(v+a*l)*180.0/3.141592653589793;if(_>90.0){aa=180.0-_}else{aa=_}if(aa<-90.0){ba=-180.0-aa}else{ba=aa}}else{_=j*u+p*y*l;if(!(+P(+_)>.99)){ba=+W(+_)*180.0/3.141592653589793;break}R=+V(+(+Q(+(D*D+X*X))));if(!(_>=0.0)){ba=R*-180.0/3.141592653589793;break}else{ba=R*180.0/3.141592653589793;break}}}while(0);h[e>>3]=$;h[f>>3]=ba;q=0;i=g;return q|0}function md(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,R=0,U=0.0,X=0.0,Z=0.0,_=0,$=0.0,aa=0.0,ba=0.0;g=i;j=d+3304|0;k=(c[j>>2]|0)==0|0;l=(a- +h[d+((k^1)<<3)+688>>3])*3.141592653589793/180.0;a=b*3.141592653589793/180.0;b=+S(+l);m=+T(+l);n=+S(+a);o=+T(+a);p=(90.0- +h[d+(k<<3)+688>>3])*3.141592653589793/180.0;q=+S(+p);r=+T(+p);s=+h[d+3176>>3];if(s==999.0){t=3.141592653589793}else{t=s*3.141592653589793/180.0}s=n*q;u=o*r-b*s;if(+P(+u)<1.0e-5){v=(1.0-b)*s- +S(+(a+p))}else{v=u}u=m*n;if(v!=0.0|u!=-0.0){w=+Y(+-u,+v)}else{w=l+-3.141592653589793}m=t+w;if(!(m>3.141592653589793)){if(m<-3.141592653589793){x=m+6.283185307179586}else{x=m}}else{x=m+-6.283185307179586}do{if(+qa(+l,3.141592653589793)==0.0){m=a+b*p;if(m>1.5707963267948966){y=3.141592653589793-m}else{y=m}if(y<-1.5707963267948966){z=-3.141592653589793-y}else{z=y}}else{m=o*q+b*n*r;if(!(+P(+m)>.99)){z=+W(+m);break}w=+V(+(+Q(+(u*u+v*v))));if(!(m>=0.0)){z=-w}else{z=w}}}while(0);v=1.5707963267948966-z;z=(v*(v*(v*(v*(v*(v*(v*(v*(v*(v*0.0+ +h[d+4168>>3])+ +h[d+4160>>3])+ +h[d+4152>>3])+ +h[d+4144>>3])+ +h[d+4136>>3])+ +h[d+4128>>3])+ +h[d+4120>>3])+ +h[d+4112>>3])+ +h[d+4104>>3])+ +h[d+4096>>3])*+h[d+3192>>3];k=d+5960|0;A=c[k>>2]|0;B=d+5964|0;if((A|0)==0?(c[B>>2]|0)==0:0){C=(c[j>>2]|0)==0;v=z*+T(+x);u=-(z*+S(+x));D=C?v:u;E=C?u:v}else{v=z*+T(+x);u=z*+S(+x);C=A;A=1;x=v;z=-u;while(1){if((C|0)==0){F=x;G=1.0;H=0.0}else{r=x+ +hd(C,x,z);n=+id(c[k>>2]|0,x,z,1,0)+1.0;F=r;G=n;H=+id(c[k>>2]|0,x,z,0,1)}n=F-v;I=c[B>>2]|0;if((I|0)==0){J=z;K=0.0;L=1.0}else{r=z+ +hd(I,x,z);b=+id(c[B>>2]|0,x,z,1,0);J=r;K=b;L=+id(c[B>>2]|0,x,z,0,1)+1.0}b=u+J;r=G*L-H*K;if(r==0.0){M=x;N=z;break}q=(H*b-n*L)/r;o=(n*K-G*b)/r;r=x+q;y=z+o;I=+P(+q)>+P(+o);p=I?q:o;o=+P(+p);I=+P(+n)>+P(+b);q=I?n:b;I=o>+P(+q);if(!(!(+P(+(I?p:q))<2.8e-8)&(A|0)<500)){M=r;N=y;break}C=c[k>>2]|0;A=A+1|0;x=r;z=y}A=(c[j>>2]|0)==0;D=A?M:N;E=A?N:M}if((c[d+3300>>2]|0)!=0){h[e>>3]=D*+h[d+88>>3]+E*+h[d+96>>3];h[f>>3]=D*+h[d+104>>3]+E*+h[d+112>>3];O=+h[e>>3];R=d+16|0;U=+h[R>>3];X=O+U;h[e>>3]=X;Z=+h[f>>3];_=d+24|0;$=+h[_>>3];aa=Z+$;h[f>>3]=aa;i=g;return 0}M=+h[d+48>>3];if(M!=0.0){N=M*3.141592653589793/180.0;M=+S(+N);z=+T(+N);h[e>>3]=D*M+E*z;ba=E*M-D*z}else{h[e>>3]=D;ba=E}h[f>>3]=ba;ba=+h[d+32>>3];if(ba!=0.0){h[e>>3]=+h[e>>3]/ba}ba=+h[d+40>>3];if(!(ba!=0.0)){O=+h[e>>3];R=d+16|0;U=+h[R>>3];X=O+U;h[e>>3]=X;Z=+h[f>>3];_=d+24|0;$=+h[_>>3];aa=Z+$;h[f>>3]=aa;i=g;return 0}h[f>>3]=+h[f>>3]/ba;O=+h[e>>3];R=d+16|0;U=+h[R>>3];X=O+U;h[e>>3]=X;Z=+h[f>>3];_=d+24|0;$=+h[_>>3];aa=Z+$;h[f>>3]=aa;i=g;return 0}function nd(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0,g=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0;f=i;g=(+h[c+224>>3]-(+h[c+176>>3]+a+-1.0+.5)*+h[c+192>>3])/1.0e3;a=((+h[c+184>>3]+b+-1.0+.5)*+h[c+200>>3]- +h[c+248>>3])/1.0e3;b=g*g;j=a*a;k=g*b;l=a*j;m=b+j;n=(k*+h[c+496>>3]+(l*+h[c+472>>3]+(m*+h[c+464>>3]+(b*+h[c+456>>3]+(+h[c+432>>3]+(a*+h[c+416>>3]+g*+h[c+424>>3])+j*+h[c+440>>3]+a*g*+h[c+448>>3])))+g*j*+h[c+480>>3]+b*a*+h[c+488>>3])+m*a*+h[c+504>>3]+m*m*a*+h[c+512>>3])/206264.8062470964;o=+h[c+160>>3];p=+U(+o);q=1.0-n*p;r=+Y(+((l*+h[c+336>>3]+(k*+h[c+312>>3]+(m*+h[c+304>>3]+(j*+h[c+296>>3]+(+h[c+272>>3]+(g*+h[c+256>>3]+a*+h[c+264>>3])+b*+h[c+280>>3]+a*g*+h[c+288>>3])))+a*b*+h[c+320>>3]+j*g*+h[c+328>>3])+m*g*+h[c+344>>3]+m*m*g*+h[c+352>>3])/206264.8062470964/+S(+o)),+q);o=r+ +h[c+152>>3];if(!(o<0.0)){s=o;t=s/.01745329252;h[d>>3]=t;u=+S(+r);v=n+p;w=v/q;x=u*w;y=+X(+x);z=y/.01745329252;h[e>>3]=z;i=f;return 0}s=o+6.28318530717959;t=s/.01745329252;h[d>>3]=t;u=+S(+r);v=n+p;w=v/q;x=u*w;y=+X(+x);z=y/.01745329252;h[e>>3]=z;i=f;return 0}function od(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0,g=0.0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,Q=0.0,R=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ba=0.0,ca=0.0,da=0.0,ea=0.0,fa=0.0,ga=0.0,ha=0.0,ia=0.0,ja=0.0,ka=0.0,la=0.0,ma=0.0,na=0.0,oa=0.0,pa=0.0,qa=0.0,ra=0.0,sa=0.0,ta=0.0,ua=0.0;f=i;h[d>>3]=0.0;h[e>>3]=0.0;g=b*3.141592653589793/180.0;b=+T(+g);j=+S(+g);k=c+160|0;g=+h[k>>3];if(g==0.0){l=+h[c+8>>3]*3.141592653589793/180.0;h[k>>3]=l;m=l}else{m=g}g=+T(+m);l=+S(+m);k=c+152|0;m=+h[k>>3];if(m==0.0){n=+h[c+8>>3]*3.141592653589793/180.0;h[k>>3]=n;o=n}else{o=m}m=a*3.141592653589793/180.0-o;o=+S(+m);a=b*g+j*l*o;if(a==0.0){p=1;i=f;return p|0}n=j*+T(+m)*206264.8062470964/a;m=(b*l-j*g*o)*206264.8062470964/a;a=+h[c+168>>3];if(a==0.0){p=1;i=f;return p|0}o=+h[c+256>>3];g=+h[c+264>>3];j=+h[c+272>>3];l=+h[c+280>>3];b=+h[c+288>>3];q=+h[c+296>>3];r=+h[c+304>>3];s=+h[c+312>>3];t=+h[c+320>>3];u=+h[c+328>>3];v=+h[c+336>>3];w=+h[c+344>>3];x=+h[c+352>>3];y=l*2.0;z=r*2.0;A=s*3.0;B=t*2.0;C=q*2.0;D=u*2.0;E=v*3.0;F=w*2.0;G=x*4.0;H=+h[c+416>>3];I=+h[c+424>>3];J=+h[c+432>>3];K=+h[c+440>>3];L=+h[c+448>>3];M=+h[c+456>>3];N=+h[c+464>>3];O=+h[c+472>>3];Q=+h[c+480>>3];R=+h[c+488>>3];U=+h[c+496>>3];V=+h[c+504>>3];W=+h[c+512>>3];X=M*2.0;Y=N*2.0;Z=R*2.0;_=U*3.0;$=V*2.0;aa=W*4.0;ba=K*2.0;ca=O*3.0;da=Q*2.0;k=0;ea=n/a;fa=m/a;do{a=fa*ea;ga=ea*ea;ha=fa*fa;ia=fa*ga;ja=ha*ea;ka=ha+ga;la=ka*ka;ma=ea*ga;na=fa*ha;oa=ga*ga;pa=ha*ha;qa=ha*ga*6.0;ra=ha*u+(fa*b+(o+ea*y)+ea*z+ga*A+a*B)+(ha+ga*3.0)*w+(pa+(oa*5.0+qa))*x;sa=g+ea*b+fa*C+fa*z+ga*t+a*D+ha*E+a*F+ka*a*G;ta=I+fa*L+ea*X+ea*Y+ha*Q+a*Z+ga*_+a*$+ka*a*aa;ua=ga*R+(ea*L+(H+fa*ba)+fa*Y+ha*ca+a*da)+(ha*3.0+ga)*V+(oa+(pa*5.0+qa))*W;qa=j+(ea*o+fa*g)+ga*l+a*b+ha*q+ka*r+ma*s+ia*t+ja*u+na*v+ka*ea*w+la*ea*x-n;pa=J+(fa*H+ea*I)+ha*K+a*L+ga*M+ka*N+na*O+ja*Q+ia*R+ma*U+ka*fa*V+la*fa*W-m;la=ra*ua-sa*ta;ka=(sa*pa-qa*ua)/la;ua=(qa*ta-ra*pa)/la;ea=ea+ka;fa=fa+ua;if(+P(+ka)<5.0e-7?+P(+ua)<5.0e-7:0){break}k=k+1|0}while((k|0)<50);m=+h[c+192>>3];if(m==0.0){p=1;i=f;return p|0}W=+h[c+200>>3];if(W==0.0){p=1;i=f;return p|0}V=(fa*1.0e3+ +h[c+248>>3])/W;h[d>>3]=(+h[c+224>>3]-ea*1.0e3)/m- +h[c+176>>3]+1.0+-.5;m=V- +h[c+184>>3]+1.0+-.5;h[e>>3]=m;V=+h[d>>3];if(V<.5){p=-1;i=f;return p|0}if(V>+h[c+136>>3]+.5|m<.5){p=-1;i=f;return p|0}if(m>+h[c+144>>3]+.5){p=-1;i=f;return p|0}p=0;i=f;return p|0}function pd(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+16|0;e=d;d=c[o>>2]|0;c[e>>2]=a;c[e+4>>2]=b;za(d|0,10976,e|0)|0;hb(-1)}function qd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+544|0;g=f;h=f+24|0;j=f+8|0;k=ig(1,28)|0;if((k|0)==0){pd(10992,11016)}c[k+16>>2]=b;if((b|0)>4){c[g>>2]=b;c[g+4>>2]=4;Na(h|0,11040,g|0)|0;pd(11120,h)}if((b|0)==0){l=k+12|0}else{m=gg(b<<2)|0;n=k+12|0;c[n>>2]=m;if((m|0)==0){pd(10992,11136)}m=a;a=b;o=c[n>>2]|0;while(1){p=a+ -1|0;c[o>>2]=(c[m>>2]|0)+ -1;if((p|0)==0){l=n;break}else{m=m+4|0;a=p;o=o+4|0}}}c[k+24>>2]=e;a:do{if((e|0)!=0){o=c[l>>2]|0;a=e<<2;m=gg(a)|0;c[k+20>>2]=m;if((m|0)==0){pd(10992,11176)}Eg(j|0,0,a|0)|0;b:do{if((b|0)>0){a=0;while(1){m=c[o+(a<<2)>>2]|0;if((m|0)>=(e|0)){break}n=j+(m<<2)|0;c[n>>2]=(c[n>>2]|0)+1;a=a+1|0;if((a|0)>=(b|0)){break b}}pd(11216,11256)}}while(0);o=k+8|0;c[o>>2]=1;if((e|0)>0){a=c[k+20>>2]|0;n=d;m=1;p=0;while(1){q=n+4|0;r=c[n>>2]|0;c[a+(p<<2)>>2]=r;if((r|0)>10){break}s=c[j+(p<<2)>>2]|0;if((r|0)==0){t=1;u=1}else{v=r;w=1;x=1;while(1){y=aa(x,v+s|0)|0;z=v+ -1|0;A=aa(w,v)|0;if((z|0)==0){t=A;u=y;break}else{v=z;w=A;x=y}}}x=aa(m,(u|0)/(t|0)|0)|0;c[o>>2]=x;w=p+1|0;if((w|0)<(e|0)){n=q;m=x;p=w}else{B=x;break a}}c[g>>2]=r;c[g+4>>2]=10;Na(h|0,11264,g|0)|0;pd(11120,h)}else{B=1}}else{c[k+8>>2]=1;B=1}}while(0);h=gg(B<<3)|0;c[k>>2]=h;if((h|0)==0){pd(10992,11336)}h=ig(B,8)|0;c[k+4>>2]=h;if((h|0)==0){pd(10992,11376)}else{i=f;return k|0}return 0}function rd(a){a=a|0;var b=0;b=i;if((a|0)==0){i=b;return}hg(c[a+4>>2]|0);hg(c[a>>2]|0);hg(c[a+20>>2]|0);hg(c[a+12>>2]|0);hg(a);i=b;return}function sd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0,x=0,y=0.0,z=0.0,A=0,B=0,C=0,D=0;d=i;i=i+80|0;e=d;f=d+60|0;g=d+40|0;j=c[a+16>>2]|0;k=c[a>>2]|0;l=c[a+4>>2]|0;m=c[a+12>>2]|0;n=c[a+20>>2]|0;if((j|0)!=0){o=j+ -1|0;if((o|0)!=0){p=o;o=f;q=e;do{q=q+8|0;h[q>>3]=1.0;o=o+4|0;c[o>>2]=0;p=p+ -1|0}while((p|0)!=0)}p=c[a+24>>2]|0;if((p|0)!=0){o=n;n=p;p=g;while(1){n=n+ -1|0;c[p>>2]=c[o>>2];if((n|0)==0){break}else{o=o+4|0;p=p+4|0}}}p=g+(c[m>>2]<<2)|0;o=c[p>>2]|0;if((o|0)!=0){c[p>>2]=o+ -1}}o=l+8|0;r=+h[l>>3];l=k+8|0;h[k>>3]=1.0;c[f>>2]=1;s=+h[b>>3];h[e>>3]=s;k=(c[a+8>>2]|0)+ -1|0;if((k|0)==0){t=r;i=d;return+t}if((j|0)>0){u=s;v=k;w=l;x=o;y=r}else{z=s;a=k;k=l;l=o;s=r;while(1){h[k>>3]=z;r=s+z*+h[l>>3];o=a+ -1|0;if((o|0)==0){t=r;break}z=+h[e>>3];a=o;k=k+8|0;l=l+8|0;s=r}i=d;return+t}while(1){l=w+8|0;h[w>>3]=u;k=x+8|0;s=y+u*+h[x>>3];a=0;o=f;p=m;n=b;q=e;while(1){A=g+(c[p>>2]<<2)|0;B=c[A>>2]|0;c[A>>2]=B+ -1;C=c[o>>2]|0;if((B|0)!=0){D=13;break}c[g+(c[p>>2]<<2)>>2]=C;c[o>>2]=0;h[q>>3]=1.0;B=a+1|0;if((B|0)>=(j|0)){break}a=B;o=o+4|0;p=p+4|0;n=n+8|0;q=q+8|0}if((D|0)==13?(D=0,c[o>>2]=C+1,z=+h[n>>3]*+h[q>>3],h[q>>3]=z,(a|0)!=0):0){p=a;B=q;do{B=B+ -8|0;p=p+ -1|0;h[B>>3]=z}while((p|0)!=0)}p=v+ -1|0;if((p|0)==0){t=s;break}u=+h[e>>3];v=p;w=l;x=k;y=s}i=d;return+t}function td(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0.0,E=0,F=0,G=0,H=0,I=0.0,J=0,K=0,L=0,M=0;j=i;i=i+32|0;k=j;l=(b|0)!=0;m=(g|0)==0;if(m&(l^1)){pd(11416,11496)}n=c[a+8>>2]|0;o=c[a+16>>2]|0;p=aa(n,n)|0;q=c[a>>2]|0;r=ig(p,8)|0;if((r|0)==0){pd(10992,11512)}p=ig(n,8)|0;if((p|0)==0){pd(10992,11544)}if((f|0)!=0){s=(n|0)==0;t=(o|0)>0;u=e;e=d;d=f;f=g;g=b;while(1){b=d+ -1|0;if(l){if(t){v=0;w=g;while(1){h[k+(v<<3)>>3]=+h[w>>3];v=v+1|0;if((v|0)==(o|0)){break}else{w=w+8|0}}x=g+(o<<3)|0}else{x=g}+sd(a,k);if(m|s){y=f;z=x}else{w=q;v=f;A=n;while(1){A=A+ -1|0;h[v>>3]=+h[w>>3];if((A|0)==0){break}else{w=w+8|0;v=v+8|0}}y=f+(n<<3)|0;z=x}}else{if(s){y=f;z=g}else{v=q;w=f;A=n;while(1){A=A+ -1|0;h[v>>3]=+h[w>>3];if((A|0)==0){break}else{v=v+8|0;w=w+8|0}}y=f+(n<<3)|0;z=g}}if((u|0)==0){B=0;C=1.0}else{B=u+8|0;C=+h[u>>3]}w=e+8|0;D=+h[e>>3];if(!s){v=n;A=r;E=q;F=p;while(1){G=v+ -1|0;H=E+8|0;I=C*+h[E>>3];J=F+8|0;h[F>>3]=+h[F>>3]+D*I;K=A;L=q;M=n;while(1){M=M+ -1|0;h[K>>3]=+h[K>>3]+I*+h[L>>3];if((M|0)==0){break}else{K=K+8|0;L=L+8|0}}if((G|0)==0){break}else{v=G;A=A+(n<<3)|0;E=H;F=J}}}if((b|0)==0){break}else{u=B;e=w;d=b;f=y;g=z}}}ud(r,p,n);hg(r);if((n|0)==0){hg(p);i=j;return}r=p;z=c[a+4>>2]|0;a=n;while(1){a=a+ -1|0;h[z>>3]=+h[r>>3];if((a|0)==0){break}else{r=r+8|0;z=z+8|0}}hg(p);i=j;return}function ud(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=i;if((vd(a,b,c)|0)==0){i=d;return}e=c<<3;f=gg(aa(e,c)|0)|0;if((f|0)==0){pd(10992,11576)}g=gg(e)|0;if((g|0)==0){pd(10992,11600)}wd(a,b,c,c,f,g);hg(f);hg(g);i=d;return}function vd(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0.0,r=0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0;d=i;e=gg(c<<3)|0;if((e|0)==0){pd(10992,11624)}f=(c|0)>0;if(f){g=0;a:do{j=aa(g,c)|0;k=e+(g<<3)|0;if((g|0)>0){l=g;do{m=aa(l,c)|0;n=g;o=+h[a+(l+j<<3)>>3];do{n=n+ -1|0;o=o- +h[a+(n+j<<3)>>3]*+h[a+(n+m<<3)>>3]}while((n|0)>0);if((g|0)==(l|0)){if(o<=0.0){p=15;break a}h[k>>3]=+Q(+o)}else{h[a+((aa(l,c)|0)+g<<3)>>3]=o/+h[k>>3]}l=l+1|0}while((l|0)<(c|0))}else{l=g;do{q=+h[a+(l+j<<3)>>3];if((g|0)==(l|0)){if(q<=0.0){p=15;break a}h[k>>3]=+Q(+q)}else{h[a+((aa(l,c)|0)+g<<3)>>3]=q/+h[k>>3]}l=l+1|0}while((l|0)<(c|0))}g=g+1|0}while((g|0)<(c|0));if((p|0)==15){hg(e);r=-1;i=d;return r|0}if(f){p=0;do{g=b+(p<<3)|0;q=+h[g>>3];if((p|0)>0){l=aa(p,c)|0;k=p;s=q;while(1){j=k+ -1|0;t=s- +h[a+(j+l<<3)>>3]*+h[b+(j<<3)>>3];if((j|0)>0){k=j;s=t}else{u=t;break}}}else{u=q}h[g>>3]=u/+h[e+(p<<3)>>3];p=p+1|0}while((p|0)!=(c|0));if(f){f=c;while(1){p=f+ -1|0;k=b+(p<<3)|0;u=+h[k>>3];if((f|0)<(c|0)){l=f;s=u;while(1){t=+h[a+((aa(l,c)|0)+p<<3)>>3];v=s-t*+h[b+(l<<3)>>3];j=l+1|0;if((j|0)==(c|0)){w=v;break}else{l=j;s=v}}}else{w=u}h[k>>3]=w/+h[e+(p<<3)>>3];if((p|0)>0){f=p}else{break}}}}}hg(e);r=0;i=d;return r|0}function wd(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0,H=0,I=0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,R=0.0,S=0.0,T=0,U=0,V=0,W=0,X=0.0,Y=0,Z=0,_=0,$=0.0,ba=0.0,ca=0.0,da=0.0,ea=0.0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0.0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0.0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0.0,Ca=0.0,Da=0.0,Ea=0.0,Fa=0.0,Ga=0.0,Ha=0.0,Ia=0.0,Ja=0.0,Ka=0.0,La=0.0,Ma=0.0,Na=0.0,Oa=0.0,Pa=0,Qa=0,Ra=0.0,Sa=0,Ta=0.0,Ua=0,Va=0,Wa=0.0;g=i;if((c|0)<(d|0)){pd(11648,11704)}j=d<<3;k=gg(j)|0;if((k|0)==0){pd(10992,11720)}l=gg(j)|0;if((l|0)==0){pd(10992,11744)}j=(d|0)>0;a:do{if(j){m=c+1|0;n=0.0;o=0.0;p=0;q=0.0;while(1){r=p+1|0;s=d-r|0;t=k+(p<<3)|0;h[t>>3]=o*q;u=c-p|0;b:do{if((u|0)>0?(v=a+((aa(p,m)|0)<<3)|0,w=(p|0)==(c|0),!w):0){x=v;y=u;z=0.0;while(1){y=y+ -1|0;z=z+ +P(+(+h[x>>3]));if((y|0)==0){break}else{x=x+8|0}}if(z!=0.0){if(w){A=0.0}else{x=v;y=u;B=0.0;while(1){C=y+ -1|0;D=+h[x>>3]/z;h[x>>3]=D;E=B+D*D;if((C|0)==0){A=E;break}else{x=x+8|0;y=C;B=E}}}B=+h[v>>3];E=+P(+(+Q(+A)));if(!(B>=0.0)){F=-E}else{F=E}E=-F;D=B*E-A;h[v>>3]=B+F;if((r|0)!=(d|0)){y=s;x=a+((aa(r,c)|0)+p<<3)|0;while(1){y=y+ -1|0;c:do{if(!w){C=v;G=x;H=u;B=0.0;while(1){I=H+ -1|0;J=B+ +h[G>>3]*+h[C>>3];if((I|0)==0){break}C=C+8|0;G=G+8|0;H=I;B=J}B=J/D;if(!w){H=v;G=x;C=u;while(1){I=C+ -1|0;h[G>>3]=+h[G>>3]+B*+h[H>>3];if((I|0)==0){break c}H=H+8|0;G=G+8|0;C=I}}}}while(0);if((y|0)==0){break}else{x=x+(c<<3)|0}}}if(w){K=E;L=z}else{x=v;y=u;while(1){C=y+ -1|0;h[x>>3]=z*+h[x>>3];if((C|0)==0){K=E;L=z;break b}x=x+8|0;y=C}}}else{K=0.0;L=z}}else{K=0.0;L=0.0}}while(0);E=K*L;u=f+(p<<3)|0;h[u>>3]=E;if(!((p|0)>=(c|0)|(r|0)==(d|0))){y=aa(r,c)|0;x=a+(y+p<<3)|0;v=x;w=s;D=0.0;while(1){w=w+ -1|0;D=D+ +P(+(+h[v>>3]));if((w|0)==0){break}else{v=v+(c<<3)|0}}if(D!=0.0){v=x;w=s;B=0.0;while(1){w=w+ -1|0;M=+h[v>>3]/D;h[v>>3]=M;B=B+M*M;if((w|0)==0){break}else{v=v+(c<<3)|0}}M=+h[x>>3];N=+P(+(+Q(+B)));if(!(M>=0.0)){O=-N}else{O=N}N=-O;R=M*N-B;S=M+O;h[x>>3]=S;v=k+(r<<3)|0;M=S;w=x;C=s;G=v;while(1){H=C+ -1|0;h[G>>3]=M/R;I=w+(c<<3)|0;if((H|0)==0){break}M=+h[I>>3];w=I;C=H;G=G+8|0}if((r|0)==(c|0)){T=x;U=s}else{G=c-r|0;C=a+(y+r<<3)|0;while(1){w=G+ -1|0;H=x;I=C;V=s;M=0.0;while(1){W=V+ -1|0;X=M+ +h[I>>3]*+h[H>>3];if((W|0)==0){Y=C;Z=s;_=v;break}H=H+(c<<3)|0;I=I+(c<<3)|0;V=W;M=X}while(1){Z=Z+ -1|0;h[Y>>3]=+h[Y>>3]+X*+h[_>>3];if((Z|0)==0){break}else{Y=Y+(c<<3)|0;_=_+8|0}}if((w|0)==0){T=x;U=s;break}else{G=w;C=C+8|0}}}while(1){C=U+ -1|0;h[T>>3]=D*+h[T>>3];if((C|0)==0){break}T=T+(c<<3)|0;U=C}$=+h[u>>3];ba=N;ca=D}else{$=E;ba=0.0;ca=D}}else{$=E;ba=0.0;ca=0.0}M=+P(+$);z=M+ +P(+(+h[t>>3]));da=n>z?n:z;if((r|0)==(d|0)){break}else{n=da;o=ba;p=r;q=ca}}p=d+ -1|0;if(j){q=ba;m=p;C=0;G=d;s=0;while(1){do{if((m|0)<(p|0)){if(q!=0.0){x=a+(m+(aa(G,c)|0)<<3)|0;v=e+((aa(m,d)|0)+G<<3)|0;y=e+((aa(G,d)|0)+G<<3)|0;o=+h[x>>3];n=q*o;V=(s|0)==0;if(V){break}else{ea=o;fa=x;ga=s;ha=v}while(1){I=ga+ -1|0;h[ha>>3]=ea/n;H=fa+(c<<3)|0;if((I|0)==0){break}ea=+h[H>>3];fa=H;ga=I;ha=ha+8|0}if(V){break}else{ia=s;ja=y}while(1){ia=ia+ -1|0;w=x;I=s;n=0.0;H=ja;while(1){W=I+ -1|0;ka=n+ +h[w>>3]*+h[H>>3];if((W|0)==0){la=s;ma=v;na=ja;break}w=w+(c<<3)|0;I=W;n=ka;H=H+8|0}while(1){la=la+ -1|0;h[na>>3]=+h[na>>3]+ka*+h[ma>>3];if((la|0)==0){break}else{ma=ma+8|0;na=na+8|0}}if((ia|0)==0){break}else{ja=ja+(d<<3)|0}}}if((s|0)!=0){v=s;x=e+(m+(aa(G,d)|0)<<3)|0;y=e+((aa(m,d)|0)+G<<3)|0;while(1){v=v+ -1|0;h[y>>3]=0.0;h[x>>3]=0.0;if((v|0)==0){break}else{x=x+(d<<3)|0;y=y+8|0}}}}}while(0);h[e+((aa(m,d)|0)+m<<3)>>3]=1.0;s=d-m|0;C=C+1|0;if((C|0)==(d|0)){break}else{r=m;q=+h[k+(m<<3)>>3];m=m+ -1|0;G=r}}if(j){G=~d;m=~c;C=(G|0)>(m|0)?G:m;m=a+((aa(-2-C|0,c)|0)+ -2-C<<3)|0;G=-8-(c<<3)|0;s=(C+c<<3)+16|0;p=~C;C=d;r=0;while(1){t=m+(aa(G,r)|0)|0;u=s+(r<<3)|0;y=C+ -1|0;x=d-C|0;v=c-y|0;q=+h[f+(y<<3)>>3];V=(aa(y,c)|0)+y|0;H=a+(V<<3)|0;I=a+(V+c<<3)|0;V=(C|0)==(d|0);if(!V){w=I;W=x;while(1){W=W+ -1|0;h[w>>3]=0.0;if((W|0)==0){break}else{w=w+(c<<3)|0}}}d:do{if(q!=0.0){E=1.0/q;if(!V){w=v+ -1|0;W=(w|0)==0;oa=(y|0)==(c|0);pa=x;qa=I;while(1){pa=pa+ -1|0;if(W){ra=0.0}else{sa=w;ta=H;ua=qa;D=0.0;while(1){va=ta+8|0;wa=ua+8|0;N=D+ +h[va>>3]*+h[wa>>3];xa=sa+ -1|0;if((xa|0)==0){ra=N;break}else{sa=xa;ta=va;ua=wa;D=N}}}D=+h[H>>3];N=E*(ra/D);e:do{if(!oa){n=D;ua=H;ta=qa;sa=v;while(1){wa=sa+ -1|0;va=ua+8|0;h[ta>>3]=+h[ta>>3]+N*n;if((wa|0)==0){break e}n=+h[va>>3];ua=va;ta=ta+8|0;sa=wa}}}while(0);if((pa|0)==0){break}else{qa=qa+(c<<3)|0}}}if((y|0)!=(c|0)){qa=H;pa=v;while(1){oa=pa+ -1|0;h[qa>>3]=E*+h[qa>>3];if((oa|0)==0){break d}qa=qa+8|0;pa=oa}}}else{if((y|0)!=(c|0)){Eg(t|0,0,u|0)|0}}}while(0);h[H>>3]=+h[H>>3]+1.0;u=r+1|0;if((u|0)==(p|0)){break}else{C=y;r=u}}if(j){r=(c|0)==0;C=d;p=0;f:while(1){s=C+ -1|0;G=f+(s<<3)|0;m=C+ -2|0;u=f+(m<<3)|0;t=k+(m<<3)|0;v=k+(s<<3)|0;I=0;x=p;while(1){V=s;pa=x;while(1){if(!((V|0)>-1)){ya=pa;za=93;break}qa=V+ -1|0;if(da+ +P(+(+h[k+(V<<3)>>3]))==da){Aa=qa;break}if(da+ +P(+(+h[f+(qa<<3)>>3]))==da){ya=qa;za=93;break}else{V=qa;pa=qa}}g:do{if((za|0)==93){za=0;pa=a+((aa(ya,c)|0)<<3)|0;if((V|0)>(s|0)){Aa=ya}else{qa=a+((aa(V,c)|0)<<3)|0;oa=V;q=1.0;while(1){E=q*+h[k+(oa<<3)>>3];N=+P(+E);if(da+N==da){Aa=ya;break g}w=f+(oa<<3)|0;D=+h[w>>3];n=+P(+D);if(!(N>n)){if(D!=0.0){o=N/n;Ba=n*+Q(+(o*o+1.0))}else{Ba=0.0}}else{o=n/N;Ba=N*+Q(+(o*o+1.0))}h[w>>3]=Ba;o=1.0/Ba;N=D*o;D=-(E*o);if(!r){w=pa;W=qa;sa=c;while(1){sa=sa+ -1|0;o=+h[W>>3];E=+h[w>>3];h[w>>3]=o*D+N*E;h[W>>3]=N*o-E*D;if((sa|0)==0){break}else{w=w+8|0;W=W+8|0}}}if((oa|0)>=(s|0)){Aa=ya;break g}qa=qa+(c<<3)|0;oa=oa+1|0;q=D}}}}while(0);Ca=+h[G>>3];if((V|0)==(s|0)){za=105;break}if((I|0)==99){break f}q=+h[f+(V<<3)>>3];N=+h[u>>3];E=+h[t>>3];o=+h[v>>3];n=((N-Ca)*(Ca+N)+(E-o)*(E+o))/(N*o*2.0);E=+P(+n);if(E>1.0){z=1.0/E;Da=E*+Q(+(z*z+1.0))}else{Da=+Q(+(E*E+1.0))}E=+P(+Da);if(!(n>=0.0)){Ea=-E}else{Ea=E}E=((q-Ca)*(Ca+q)+o*(N/(n+Ea)-o))/q;if((V|0)>(m|0)){Fa=E;Ga=q}else{oa=a+((aa(V,c)|0)<<3)|0;o=1.0;n=E;qa=V;E=1.0;pa=e+((aa(V,d)|0)<<3)|0;N=q;while(1){W=qa+1|0;q=+h[k+(W<<3)>>3];z=+h[f+(W<<3)>>3];M=E*q;R=o*q;q=+P(+n);B=+P(+M);if(!(q>B)){if(M!=0.0){S=q/B;Ha=B*+Q(+(S*S+1.0))}else{Ha=0.0}}else{S=B/q;Ha=q*+Q(+(S*S+1.0))}h[k+(qa<<3)>>3]=Ha;S=n/Ha;q=M/Ha;M=N*S+R*q;B=R*S-N*q;R=z*q;Ia=z*S;w=pa+(d<<3)|0;sa=d;ta=w;ua=pa;while(1){sa=sa+ -1|0;z=+h[ta>>3];Ja=+h[ua>>3];h[ua>>3]=q*z+S*Ja;h[ta>>3]=S*z-q*Ja;if((sa|0)==0){break}else{ta=ta+8|0;ua=ua+8|0}}Ja=+P(+M);z=+P(+R);do{if(!(Ja>z)){if(R!=0.0){Ka=Ja/z;La=z*+Q(+(Ka*Ka+1.0));za=130;break}else{h[f+(qa<<3)>>3]=0.0;Ma=S;Na=q;break}}else{Ka=z/Ja;La=Ja*+Q(+(Ka*Ka+1.0));za=130}}while(0);if((za|0)==130){za=0;h[f+(qa<<3)>>3]=La;if(La!=0.0){Ja=1.0/La;Ma=M*Ja;Na=R*Ja}else{Ma=S;Na=q}}Ja=B*Ma+Ia*Na;z=Ia*Ma-B*Na;ua=oa+(c<<3)|0;if(!r){ta=ua;sa=oa;wa=c;while(1){wa=wa+ -1|0;Ka=+h[ta>>3];Oa=+h[sa>>3];h[sa>>3]=Na*Ka+Ma*Oa;h[ta>>3]=Ma*Ka-Na*Oa;if((wa|0)==0){break}else{ta=ta+8|0;sa=sa+8|0}}}if((qa|0)<(m|0)){oa=ua;o=Ma;n=Ja;qa=W;E=Na;pa=w;N=z}else{Fa=Ja;Ga=z;break}}}h[k+(V<<3)>>3]=0.0;h[v>>3]=Fa;h[G>>3]=Ga;pa=I+1|0;if((pa|0)<100){I=pa;x=m}else{Pa=m;break}}if((za|0)==105){za=0;if(Ca<0.0){h[G>>3]=-Ca;m=d;x=e+((aa(s,d)|0)<<3)|0;while(1){I=m+ -1|0;h[x>>3]=-+h[x>>3];if((I|0)==0){Pa=Aa;break}else{m=I;x=x+8|0}}}else{Pa=Aa}}if((s|0)>0){C=s;p=Pa}else{break a}}pd(11768,11704)}}}}}while(0);Pa=(d|0)==0;if(!Pa){Aa=d;za=f;Ca=0.0;while(1){Aa=Aa+ -1|0;Ga=+h[za>>3];Ca=Ga>Ca?Ga:Ca;if((Aa|0)==0){break}else{za=za+8|0}}Ga=Ca*1.0e-11;if(!Pa){za=d;Aa=f;while(1){za=za+ -1|0;if(+h[Aa>>3]<Ga){h[Aa>>3]=0.0}if((za|0)==0){break}else{Aa=Aa+8|0}}if(!Pa){Pa=(c|0)==0;Aa=d;za=a;a=l;ya=f;while(1){Aa=Aa+ -1|0;Ga=+h[ya>>3];if(Ga!=0.0){if(Pa){Qa=za;Ra=0.0}else{f=za;ja=b;ia=c;Ca=0.0;while(1){ia=ia+ -1|0;Ca=Ca+ +h[f>>3]*+h[ja>>3];if((ia|0)==0){break}else{f=f+8|0;ja=ja+8|0}}Qa=za+(c<<3)|0;Ra=Ca}Sa=Qa;Ta=Ra/Ga}else{Sa=za+(c<<3)|0;Ta=0.0}h[a>>3]=Ta;if((Aa|0)==0){break}else{za=Sa;a=a+8|0;ya=ya+8|0}}}}}if(j){Ua=0;Va=e}else{hg(l);hg(k);i=g;return}while(1){e=d;Ta=0.0;j=l;ya=Va;while(1){a=e+ -1|0;Wa=Ta+ +h[ya>>3]*+h[j>>3];if((a|0)==0){break}e=a;Ta=Wa;j=j+8|0;ya=ya+(d<<3)|0}h[b+(Ua<<3)>>3]=Wa;Ua=Ua+1|0;if((Ua|0)==(d|0)){break}else{Va=Va+8|0}}hg(l);hg(k);i=g;return}function xd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=i;i=i+32|0;g=f+8|0;h=f;j=f+16|0;k=h;c[k>>2]=5260110;c[k+4>>2]=5459015;k=e+4|0;a[k]=0;a[j]=0;l=e+20|0;c[l>>2]=-1;m=e+24|0;c[m>>2]=-1;n=e+28|0;c[n>>2]=-1;do{if((b|0)>0){o=e+8|0;p=e+13|0;q=0;r=0;a:while(1){s=d+(q*9|0)|0;do{if((a[d+(q*9|0)+4|0]|0)!=45){if((yg(s,11816)|0)==0){if(!((c[n>>2]|0)==-1)){t=1;u=35;break a}c[n>>2]=q;v=r}else{v=r}}else{w=d+(q*9|0)+5|0;x=c[2992]|0;b:do{if((x|0)>0){y=0;while(1){z=y+1|0;if((Ag(w,11976+(y<<2)|0,3)|0)==0){A=y;break b}if((z|0)<(x|0)){y=z}else{A=z;break}}}else{A=0}}while(0);if((A|0)==(x|0)){y=0;while(1){z=y+1|0;if((Ag(w,h+(y<<2)|0,3)|0)==0){B=y;break}if((z|0)<2){y=z}else{B=z;break}}if((B|0)==2){v=r;break}}if((a[k]|0)!=0){if((Ag(s,j,8)|0)!=0|(r|0)==0){t=1;u=35;break a}c[r>>2]=q;a[j]=0;v=r;break}c[g>>2]=w;Na(k|0,11832,g|0)|0;if((Ag(s,11840,4)|0)==0){c[l>>2]=q;a[o+0|0]=a[11848|0]|0;a[o+1|0]=a[11849|0]|0;a[o+2|0]=a[11850|0]|0;a[p]=4408644;a[p+1|0]=17221;a[p+2|0]=67;a[p+3|0]=0;c[g>>2]=k;Na(j|0,11856,g|0)|0;v=m;break}if((Ag(s,11864,4)|0)==0){c[m>>2]=q;a[o+0|0]=a[11848|0]|0;a[o+1|0]=a[11849|0]|0;a[o+2|0]=a[11850|0]|0;a[p]=4408644;a[p+1|0]=17221;a[p+2|0]=67;a[p+3|0]=0;c[g>>2]=k;Na(j|0,11872,g|0)|0;v=l;break}y=d+(q*9|0)+1|0;if((Ag(y,11880,3)|0)==0){c[l>>2]=q;c[g>>2]=a[s]|0;Na(o|0,11888,g|0)|0;c[g>>2]=a[s]|0;Na(p|0,11896,g|0)|0;c[g>>2]=p;c[g+4>>2]=k;Na(j|0,11904,g|0)|0;v=m;break}if((Ag(y,11912,3)|0)==0){c[m>>2]=q;c[g>>2]=a[s]|0;Na(o|0,11888,g|0)|0;c[g>>2]=a[s]|0;Na(p|0,11896,g|0)|0;c[g>>2]=o;c[g+4>>2]=k;Na(j|0,11904,g|0)|0;v=l;break}x=d+(q*9|0)+2|0;if((Ag(x,11920,2)|0)==0){c[l>>2]=q;z=a[y]|0;c[g>>2]=a[s]|0;c[g+4>>2]=z;Na(o|0,11928,g|0)|0;z=a[y]|0;c[g>>2]=a[s]|0;c[g+4>>2]=z;Na(p|0,11936,g|0)|0;c[g>>2]=p;c[g+4>>2]=k;Na(j|0,11904,g|0)|0;v=m;break}if((Ag(x,11944,2)|0)!=0){t=1;u=35;break a}c[m>>2]=q;x=a[y]|0;c[g>>2]=a[s]|0;c[g+4>>2]=x;Na(o|0,11928,g|0)|0;x=a[y]|0;c[g>>2]=a[s]|0;c[g+4>>2]=x;Na(p|0,11936,g|0)|0;c[g>>2]=o;c[g+4>>2]=k;Na(j|0,11904,g|0)|0;v=l}}while(0);s=q+1|0;if((s|0)<(b|0)){q=s;r=v}else{u=30;break}}if((u|0)==30){if((a[j]|0)==0){break}else{t=1}i=f;return t|0}else if((u|0)==35){i=f;return t|0}}}while(0);if((Ag(k,11952,3)|0)==0){a[k]=4998739;a[k+1|0]=19526;a[k+2|0]=76;a[k+3|0]=0;C=137}else{C=(a[k]|0)==0?999:137}c[e>>2]=C;t=0;i=f;return t|0}function yd(b,d,e,f,g,j,k,l,m,n,o){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0.0,x=0.0;p=i;q=n+4|0;if((c[d>>2]|0)!=137?(xd(c[q>>2]|0,b,d)|0)!=0:0){r=1;i=p;return r|0}b=c[q>>2]|0;if((b|0)>0){q=c[d+20>>2]|0;s=d+24|0;t=0;do{if((t|0)!=(q|0)?(t|0)!=(c[s>>2]|0):0){h[m+(t<<3)>>3]=+h[e+(t<<3)>>3]- +h[f+(t<<3)>>3]}t=t+1|0}while((t|0)<(b|0))}do{if((c[d>>2]|0)!=999){b=d+4|0;do{if((yg(b,11960)|0)==0){t=g+16|0;if(+h[t>>3]==0.0){r=2;i=p;return r|0}else{a[b]=5130579;a[b+1|0]=20041;a[b+2|0]=78;a[b+3|0]=0;h[l+40>>3]=0.0;u=+Re(+h[t>>3]);h[l+48>>3]=u/+Se(+h[t>>3]);t=l+4|0;c[t>>2]=c[t>>2]>>31;break}}}while(0);t=d+20|0;f=c[t>>2]|0;s=d+24|0;q=c[s>>2]|0;v=Fd(b,+h[e+(f<<3)>>3],+h[e+(q<<3)>>3],g,j,k,l,m+(f<<3)|0,m+(q<<3)|0)|0;if((v|0)!=0){r=v;i=p;return r|0}v=c[d+28>>2]|0;if(!((v|0)==-1)){u=+h[l+24>>3];if(u==0.0){w=90.0}else{w=u*3.141592653589793*.5}q=m+(c[s>>2]<<3)|0;u=+h[q>>3];if(u<w*-.5){h[q>>3]=w+u;h[m+(v<<3)>>3]=5.0;break}x=w*.5;if(u>x){h[q>>3]=u-w;h[m+(v<<3)>>3]=0.0;break}q=m+(c[t>>2]<<3)|0;u=+h[q>>3];if(u>w*2.5){h[q>>3]=u-w*3.0;h[m+(v<<3)>>3]=4.0;break}if(u>w*1.5){h[q>>3]=u-w*2.0;h[m+(v<<3)>>3]=3.0;break}if(u>x){h[q>>3]=u-w;h[m+(v<<3)>>3]=2.0;break}else{h[m+(v<<3)>>3]=1.0;break}}}}while(0);l=(Cd(m,n,o)|0)==0;r=l?0:4;i=p;return r|0}function zd(b,d,e,f,g,j,k,l,m,n,o){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0.0,t=0.0;p=i;if((c[d>>2]|0)!=137?(xd(c[f+4>>2]|0,b,d)|0)!=0:0){q=1;i=p;return q|0}if((Dd(e,f,g)|0)!=0){q=4;i=p;return q|0}e=c[f+4>>2]|0;if((e|0)>0){f=c[d+20>>2]|0;b=d+24|0;r=0;do{if((r|0)!=(f|0)?(r|0)!=(c[b>>2]|0):0){h[o+(r<<3)>>3]=+h[g+(r<<3)>>3]+ +h[m+(r<<3)>>3]}r=r+1|0}while((r|0)<(e|0))}if((c[d>>2]|0)!=999){e=c[d+28>>2]|0;a:do{if(!((e|0)==-1)){s=+h[g+(e<<3)>>3];r=~~(s+.5);if(+P(+(s- +(r|0)))>1.0e-10){q=3;i=p;return q|0}s=+h[j+24>>3];if(s==0.0){t=90.0}else{t=s*3.141592653589793*.5}switch(r|0){case 2:{r=g+(c[d+20>>2]<<3)|0;h[r>>3]=t+ +h[r>>3];break a;break};case 4:{r=g+(c[d+20>>2]<<3)|0;h[r>>3]=t*3.0+ +h[r>>3];break a;break};case 3:{r=g+(c[d+20>>2]<<3)|0;h[r>>3]=t*2.0+ +h[r>>3];break a;break};case 0:{r=g+(c[d+24>>2]<<3)|0;h[r>>3]=t+ +h[r>>3];break a;break};case 5:{r=g+(c[d+24>>2]<<3)|0;h[r>>3]=+h[r>>3]-t;break a;break};case 1:{break a;break};default:{q=3;i=p;return q|0}}}}while(0);e=d+4|0;do{if((yg(e,11960)|0)==0){r=n+16|0;if(+h[r>>3]==0.0){q=2;i=p;return q|0}else{a[e]=5130579;a[e+1|0]=20041;a[e+2|0]=78;a[e+3|0]=0;h[j+40>>3]=0.0;t=+Re(+h[r>>3]);h[j+48>>3]=t/+Se(+h[r>>3]);r=j+4|0;c[r>>2]=c[r>>2]>>31;break}}}while(0);r=c[d+20>>2]|0;m=c[d+24>>2]|0;d=Gd(e,+h[g+(r<<3)>>3],+h[g+(m<<3)>>3],j,k,l,n,o+(r<<3)|0,o+(m<<3)|0)|0;if((d|0)!=0){q=d;i=p;return q|0}}q=0;i=p;return q|0}function Ad(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;d=c[a+4>>2]|0;e=aa(d<<3,d)|0;f=gg(e)|0;c[a+20>>2]=f;if((f|0)==0){g=1;i=b;return g|0}j=gg(e)|0;c[a+24>>2]=j;if((j|0)==0){hg(f);g=1;i=b;return g|0}if((d|0)>0){e=a+16|0;k=a+12|0;l=0;m=0;while(1){n=(c[e>>2]|0)+(l<<3)|0;o=c[k>>2]|0;p=m;q=0;while(1){h[f+(p<<3)>>3]=+h[n>>3]*+h[o+(p<<3)>>3];q=q+1|0;if((q|0)==(d|0)){break}else{p=p+1|0}}l=l+1|0;if((l|0)==(d|0)){break}else{m=d+m|0}}}if((Bd(d,f,j)|0)!=0){g=2;i=b;return g|0}c[a>>2]=137;g=0;i=b;return g|0}function Bd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0.0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0;e=i;f=a<<2;g=gg(f)|0;if((g|0)==0){j=1;i=e;return j|0}k=gg(f)|0;if((k|0)==0){hg(g);j=1;i=e;return j|0}f=a<<3;l=gg(f)|0;if((l|0)==0){hg(g);hg(k);j=1;i=e;return j|0}m=gg(aa(f,a)|0)|0;if((m|0)==0){hg(g);hg(k);hg(l);j=1;i=e;return j|0}f=(a|0)>0;if(f){n=a<<3;o=0;p=0;while(1){c[g+(o<<2)>>2]=o;q=l+(o<<3)|0;h[q>>3]=0.0;Kg(m+(p<<3)|0,b+(p<<3)|0,n|0)|0;r=0.0;s=p;t=0;while(1){u=+P(+(+h[b+(s<<3)>>3]));if(u>r){h[q>>3]=u;v=u}else{v=r}t=t+1|0;if((t|0)==(a|0)){break}else{r=v;s=s+1|0}}o=o+1|0;if(v==0.0){w=17;break}if((o|0)>=(a|0)){break}else{p=p+a|0}}if((w|0)==17){hg(g);hg(k);hg(l);hg(m);j=2;i=e;return j|0}if(f){w=0;while(1){p=aa(w,a)|0;o=m+(p+w<<3)|0;b=l+(w<<3)|0;n=w+1|0;s=(n|0)<(a|0);if(s){v=+P(+(+h[o>>3]))/+h[b>>3];t=n;q=w;while(1){r=+P(+(+h[m+((aa(t,a)|0)+w<<3)>>3]));u=r/+h[l+(t<<3)>>3];x=u>v;q=x?t:q;t=t+1|0;if((t|0)==(a|0)){break}else{v=x?u:v}}if((q|0)>(w|0)){t=0;x=p;y=aa(q,a)|0;while(1){z=m+(y<<3)|0;v=+h[z>>3];A=m+(x<<3)|0;h[z>>3]=+h[A>>3];h[A>>3]=v;t=t+1|0;if((t|0)==(a|0)){break}else{x=x+1|0;y=y+1|0}}y=l+(q<<3)|0;v=+h[y>>3];h[y>>3]=+h[b>>3];h[b>>3]=v;y=g+(q<<2)|0;x=c[y>>2]|0;t=g+(w<<2)|0;c[y>>2]=c[t>>2];c[t>>2]=x}if(s){x=n;do{t=aa(x,a)|0;y=m+(t+w<<3)|0;v=+h[y>>3];a:do{if(v!=0.0){u=v/+h[o>>3];h[y>>3]=u;r=u;A=n;while(1){z=m+(A+t<<3)|0;h[z>>3]=+h[z>>3]-r*+h[m+(A+p<<3)>>3];z=A+1|0;if((z|0)==(a|0)){break a}r=+h[y>>3];A=z}}}while(0);x=x+1|0}while((x|0)!=(a|0))}}if((n|0)==(a|0)){break}else{w=n}}if(f){w=0;do{c[k+(c[g+(w<<2)>>2]<<2)>>2]=w;w=w+1|0}while((w|0)!=(a|0));if(f){w=a<<3;x=0;p=0;while(1){Eg(d+(p<<3)|0,0,w|0)|0;x=x+1|0;if((x|0)==(a|0)){break}else{p=p+a|0}}if(f){f=0;do{p=c[k+(f<<2)>>2]|0;h[d+((aa(p,a)|0)+f<<3)>>3]=1.0;x=p+1|0;if((x|0)<(a|0)){w=x;while(1){if((p|0)<(w|0)){x=aa(w,a)|0;o=d+(x+f<<3)|0;v=+h[o>>3];s=p;do{v=v- +h[m+(s+x<<3)>>3]*+h[d+((aa(s,a)|0)+f<<3)>>3];h[o>>3]=v;s=s+1|0}while((s|0)!=(w|0))}s=w+1|0;if((s|0)==(a|0)){B=a;break}else{w=s}}}else{B=a}while(1){w=B+ -1|0;p=aa(w,a)|0;n=d+(p+f<<3)|0;if((B|0)<(a|0)){v=+h[n>>3];s=B;do{v=v- +h[m+(s+p<<3)>>3]*+h[d+((aa(s,a)|0)+f<<3)>>3];h[n>>3]=v;s=s+1|0}while((s|0)!=(a|0))}h[n>>3]=+h[n>>3]/+h[m+(p+w<<3)>>3];if((w|0)>0){B=w}else{break}}f=f+1|0}while((f|0)!=(a|0))}}}}}hg(g);hg(k);hg(l);hg(m);j=0;i=e;return j|0}function Cd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0;e=i;f=c[b+4>>2]|0;if((c[b>>2]|0)!=137?(Ad(b)|0)!=0:0){g=1;i=e;return g|0}j=(f|0)>0;if(!j){g=0;i=e;return g|0}k=b+24|0;l=0;m=0;while(1){n=d+(l<<3)|0;h[n>>3]=0.0;o=c[k>>2]|0;p=0.0;q=m;r=0;while(1){p=p+ +h[o+(q<<3)>>3]*+h[a+(r<<3)>>3];h[n>>3]=p;r=r+1|0;if((r|0)==(f|0)){break}else{q=q+1|0}}l=l+1|0;if((l|0)==(f|0)){break}else{m=f+m|0}}if(!j){g=0;i=e;return g|0}j=c[b+8>>2]|0;b=0;while(1){m=d+(b<<3)|0;h[m>>3]=+h[j+(b<<3)>>3]+ +h[m>>3];m=b+1|0;if((m|0)==(f|0)){g=0;break}else{b=m}}i=e;return g|0}function Dd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0;e=i;f=c[b+4>>2]|0;if((c[b>>2]|0)!=137?(Ad(b)|0)!=0:0){g=1;i=e;return g|0}if((f|0)<=0){g=0;i=e;return g|0}Eg(d|0,0,f<<3|0)|0;j=c[b+8>>2]|0;k=b+20|0;b=0;while(1){l=+h[a+(b<<3)>>3]- +h[j+(b<<3)>>3];m=c[k>>2]|0;n=0;o=b;while(1){p=d+(n<<3)|0;h[p>>3]=+h[p>>3]+l*+h[m+(o<<3)>>3];n=n+1|0;if((n|0)==(f|0)){break}else{o=o+f|0}}o=b+1|0;if((o|0)==(f|0)){g=0;break}else{b=o}}i=e;return g|0}function Ed(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0.0,B=0,C=0.0,D=0.0;e=i;if((Hd(a,d)|0)!=0){f=1;i=e;return f|0}a=b+8|0;g=b+24|0;j=+h[g>>3]==999.0;k=d+16|0;l=+h[k>>3];do{if(!(l==90.0)){m=+h[b+16>>3];if(j){h[g>>3]=m<l?180.0:0.0}n=+Re(m);m=+Se(+h[b+16>>3]);o=+Re(+h[g>>3]);p=+Se(+h[g>>3]);q=+Re(+h[k>>3]);r=+Se(+h[k>>3]);s=o*q;o=+Q(+(s*s+r*r));do{if(o==0.0){if(m!=0.0){f=1;i=e;return f|0}else{t=+h[b+32>>3];break}}else{u=m/o;if(+P(+u)>1.0){f=1;i=e;return f|0}v=+Xe(r,s);w=+Ue(u);u=v+w;if(!(u>180.0)){if(u<-180.0){x=u+360.0}else{x=u}}else{x=u+-360.0}u=v-w;if(!(u>180.0)){if(u<-180.0){y=u+360.0}else{y=u}}else{y=u+-360.0}d=b+32|0;u=+h[d>>3];if(+P(+(u-x))<+P(+(u-y))){z=+P(+x)<90.0000000001;A=z?x:y}else{z=+P(+y)<90.0000000001;A=z?y:x}h[d>>3]=A;t=A}}while(0);d=b+40|0;z=b+48|0;h[z>>3]=90.0-t;s=n*+Re(t);do{if(+P(+s)<1.0e-10){if(+P(+n)<1.0e-10){o=+h[a>>3];h[d>>3]=o;h[z>>3]=90.0- +h[k>>3];B=a;C=o;break}if(t>0.0){o=+h[a>>3]+ +h[g>>3]+-180.0;h[d>>3]=o;h[z>>3]=0.0;B=a;C=o;break}if(t<0.0){o=+h[a>>3]- +h[g>>3];h[d>>3]=o;h[z>>3]=180.0;B=a;C=o;break}else{B=a;C=+h[d>>3];break}}else{o=(r-m*+Se(t))/s;u=p*q/n;if(o==0.0&u==0.0){f=1;i=e;return f|0}else{w=+h[a>>3];v=w- +Xe(u,o);h[d>>3]=v;B=a;C=v;break}}}while(0);if(!(+h[B>>3]>=0.0)){if(!(C>0.0)){D=t;break}h[d>>3]=C+-360.0;D=t;break}else{if(!(C<0.0)){D=t;break}h[d>>3]=C+360.0;D=t;break}}else{if(j){h[g>>3]=180.0}n=+h[b+16>>3];h[b+32>>3]=n;h[b+40>>3]=+h[a>>3];h[b+48>>3]=90.0-n;D=n}}while(0);h[b+56>>3]=+h[g>>3];g=b+48|0;h[b+64>>3]=+Re(+h[g>>3]);h[b+72>>3]=+Se(+h[g>>3]);c[b>>2]=137;b=+P(+D)>90.0000000001;f=b?2:0;i=e;return f|0}function Fd(a,b,d,e,f,g,j,k,l){a=a|0;b=+b;d=+d;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0;m=i;if((c[e>>2]|0)!=137?(Ed(a,e,j)|0)!=0:0){n=1;i=m;return n|0}Pe(b,d,e+40|0,f,g)|0;e=lb[c[j+1888>>2]&63](+h[f>>3],+h[g>>3],j,k,l)|0;if((e|0)==0){n=0;i=m;return n|0}n=(e|0)==1?2:3;i=m;return n|0}function Gd(a,b,d,e,f,g,j,k,l){a=a|0;b=+b;d=+d;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0;m=i;if((c[j>>2]|0)!=137?(Ed(a,j,e)|0)!=0:0){n=1;i=m;return n|0}a=lb[c[e+1892>>2]&63](b,d,e,f,g)|0;if((a|0)==0){Qe(+h[f>>3],+h[g>>3],j+40|0,k,l)|0;n=0;i=m;return n|0}else{n=(a|0)==1?2:3;i=m;return n|0}return 0}function Hd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;e=i;if((yg(b,12080)|0)==0){Id(d)|0;f=0;i=e;return f|0}if((yg(b,12088)|0)==0){Jd(d)|0;f=0;i=e;return f|0}if((yg(b,12096)|0)==0){a[d]=5128532;a[d+1|0]=20033;a[d+2|0]=78;a[d+3|0]=0;g=d+4|0;c[g>>2]=(c[g>>2]>>31&-206)+103;h[d+8>>3]=0.0;h[d+16>>3]=90.0;g=d+24|0;if(+h[g>>3]==0.0){h[g>>3]=57.29577951308232}c[d+1888>>2]=1;c[d+1892>>2]=2;g=99;while(1){if(!(+h[d+(g<<3)+280>>3]==0.0)){j=g;break}k=g+ -1|0;if(!(+h[d+(g+100<<3)+280>>3]==0.0)){j=g;break}if((g|0)>0){g=k}else{j=k;break}}c[d+276>>2]=(j|0)<0?0:j;f=0;i=e;return f|0}if((yg(b,12104)|0)==0){a[d]=4674643;a[d+1|0]=18260;a[d+2|0]=71;a[d+3|0]=0;c[d+4>>2]=104;h[d+8>>3]=0.0;h[d+16>>3]=90.0;j=d+24|0;l=+h[j>>3];if(l==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=114.59155902616465;h[d+120>>3]=.008726646259971648}else{m=l*2.0;h[d+112>>3]=m;h[d+120>>3]=1.0/m}c[d+1888>>2]=3;c[d+1892>>2]=4;f=0;i=e;return f|0}if((yg(b,12112)|0)==0){a[d]=5130579;a[d+1|0]=20041;a[d+2|0]=78;a[d+3|0]=0;j=d+4|0;c[j>>2]=(c[j>>2]>>31&-210)+105;h[d+8>>3]=0.0;h[d+16>>3]=90.0;j=d+24|0;m=+h[j>>3];if(m==0.0){h[j>>3]=57.29577951308232;n=57.29577951308232}else{n=m}h[d+112>>3]=1.0/n;n=+h[d+40>>3];m=+h[d+48>>3];l=n*n+m*m;h[d+120>>3]=l;h[d+128>>3]=l+1.0;h[d+136>>3]=l+-1.0;c[d+1888>>2]=5;c[d+1892>>2]=6;f=0;i=e;return f|0}if((yg(b,12120)|0)==0){a[d]=4411969;a[d+1|0]=17234;a[d+2|0]=67;a[d+3|0]=0;c[d+4>>2]=106;h[d+8>>3]=0.0;h[d+16>>3]=90.0;j=d+24|0;l=+h[j>>3];if(l==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{m=l*3.141592653589793/180.0;h[d+112>>3]=m;h[d+120>>3]=1.0/m}c[d+1888>>2]=7;c[d+1892>>2]=8;f=0;i=e;return f|0}if((yg(b,12128)|0)==0){Kd(d)|0;f=0;i=e;return f|0}if((yg(b,12136)|0)==0){a[d]=4277594;a[d+1|0]=16709;a[d+2|0]=65;a[d+3|0]=0;c[d+4>>2]=108;h[d+8>>3]=0.0;h[d+16>>3]=90.0;j=d+24|0;m=+h[j>>3];if(m==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=114.59155902616465;h[d+120>>3]=.008726646259971648}else{l=m*2.0;h[d+112>>3]=l;h[d+120>>3]=1.0/l}c[d+1888>>2]=9;c[d+1892>>2]=10;f=0;i=e;return f|0}if((yg(b,12144)|0)==0){a[d]=5392705;a[d+1|0]=21065;a[d+2|0]=82;a[d+3|0]=0;c[d+4>>2]=109;h[d+8>>3]=0.0;h[d+16>>3]=90.0;j=d+24|0;l=+h[j>>3];if(l==0.0){h[j>>3]=57.29577951308232;o=57.29577951308232}else{o=l}l=o*2.0;j=d+112|0;h[j>>3]=l;o=+h[d+40>>3];do{if(!(o==90.0)){if(o>-90.0){m=+Re((90.0-o)*.5);n=m*m;p=+_(+m)*n/(1.0-n);h[d+120>>3]=p;n=.5-p;h[d+128>>3]=n;q=n;r=+h[j>>3];break}else{f=0;i=e;return f|0}}else{h[d+120>>3]=-.5;h[d+128>>3]=1.0;q=1.0;r=l}}while(0);h[d+136>>3]=q*r;h[d+144>>3]=1.0e-4;h[d+152>>3]=q*1.0e-4;h[d+160>>3]=57.29577951308232/q;c[d+1888>>2]=11;c[d+1892>>2]=12;f=0;i=e;return f|0}if((yg(b,12152)|0)==0){a[d]=5265731;a[d+1|0]=20569;a[d+2|0]=80;a[d+3|0]=0;c[d+4>>2]=201;j=d+8|0;g=d+24|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;q=+h[g>>3];do{if(q==0.0){h[g>>3]=57.29577951308232;r=+h[d+48>>3];h[d+112>>3]=r;if(r==0.0){f=0;i=e;return f|0}h[d+120>>3]=1.0/r;l=(r+ +h[d+40>>3])*57.29577951308232;h[d+128>>3]=l;if(l==0.0){f=0;i=e;return f|0}else{h[d+136>>3]=1.0/l;break}}else{l=+h[d+48>>3];r=q*l*3.141592653589793/180.0;h[d+112>>3]=r;if(r==0.0){f=0;i=e;return f|0}h[d+120>>3]=1.0/r;r=q*(l+ +h[d+40>>3]);h[d+128>>3]=r;if(r==0.0){f=0;i=e;return f|0}else{h[d+136>>3]=1.0/r;break}}}while(0);c[d+1888>>2]=13;c[d+1892>>2]=14;f=0;i=e;return f|0}if((yg(b,12160)|0)==0){a[d]=4277571;a[d+1|0]=16709;a[d+2|0]=65;a[d+3|0]=0;c[d+4>>2]=202;g=d+8|0;j=d+24|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;q=+h[j>>3];do{if(q==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0;r=+h[d+40>>3];if(r<=0.0|r>1.0){f=0;i=e;return f|0}else{h[d+128>>3]=57.29577951308232/r;h[d+136>>3]=r/57.29577951308232;break}}else{h[d+112>>3]=q*3.141592653589793/180.0;h[d+120>>3]=57.29577951308232/q;r=+h[d+40>>3];if(r<=0.0|r>1.0){f=0;i=e;return f|0}else{h[d+128>>3]=q/r;h[d+136>>3]=r/q;break}}}while(0);c[d+1888>>2]=15;c[d+1892>>2]=16;f=0;i=e;return f|0}if((yg(b,12168)|0)==0){a[d]=5390659;a[d+1|0]=21057;a[d+2|0]=82;a[d+3|0]=0;c[d+4>>2]=203;j=d+8|0;g=d+24|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;q=+h[g>>3];if(q==0.0){h[g>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{r=q*3.141592653589793/180.0;h[d+112>>3]=r;h[d+120>>3]=1.0/r}c[d+1888>>2]=17;c[d+1892>>2]=18;f=0;i=e;return f|0}if((yg(b,12176)|0)==0){a[d]=5391693;a[d+1|0]=21061;a[d+2|0]=82;a[d+3|0]=0;c[d+4>>2]=204;g=d+8|0;j=d+24|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;r=+h[j>>3];if(r==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{q=r*3.141592653589793/180.0;h[d+112>>3]=q;h[d+120>>3]=1.0/q}c[d+1888>>2]=19;c[d+1892>>2]=20;f=0;i=e;return f|0}if((yg(b,12184)|0)==0){a[d]=4998739;a[d+1|0]=19526;a[d+2|0]=76;a[d+3|0]=0;c[d+4>>2]=301;j=d+8|0;g=d+24|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;q=+h[g>>3];if(q==0.0){h[g>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{r=q*3.141592653589793/180.0;h[d+112>>3]=r;h[d+120>>3]=1.0/r}c[d+1888>>2]=21;c[d+1892>>2]=22;f=0;i=e;return f|0}if((yg(b,12192)|0)==0){a[d]=5390672;a[d+1|0]=21057;a[d+2|0]=82;a[d+3|0]=0;c[d+4>>2]=302;g=d+8|0;j=d+24|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;r=+h[j>>3];if(r==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0;h[d+128>>3]=180.0;h[d+136>>3]=.005555555555555556}else{q=r*3.141592653589793;r=q/180.0;h[d+112>>3]=r;h[d+120>>3]=1.0/r;h[d+128>>3]=q;h[d+136>>3]=1.0/q}c[d+1888>>2]=23;c[d+1892>>2]=24;f=0;i=e;return f|0}if((yg(b,12200)|0)==0){a[d]=5001037;a[d+1|0]=19535;a[d+2|0]=76;a[d+3|0]=0;c[d+4>>2]=303;j=d+8|0;g=d+24|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;q=+h[g>>3];if(q==0.0){h[g>>3]=57.29577951308232;s=57.29577951308232}else{s=q}q=s*1.4142135623730951;h[d+112>>3]=q;h[d+120>>3]=q/90.0;h[d+128>>3]=1.0/q;h[d+136>>3]=90.0/s;h[d+144>>3]=.6366197723675814;c[d+1888>>2]=25;c[d+1892>>2]=26;f=0;i=e;return f|0}if((yg(b,12208)|0)==0){a[d]=5523777;a[d+1|0]=21577;a[d+2|0]=84;a[d+3|0]=0;c[d+4>>2]=401;g=d+8|0;j=d+24|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;s=+h[j>>3];if(s==0.0){h[j>>3]=57.29577951308232;t=57.29577951308232}else{t=s}s=t*2.0;q=t*s;h[d+112>>3]=q;t=1.0/(q*2.0);h[d+120>>3]=t;h[d+128>>3]=t*.25;h[d+136>>3]=1.0/s;c[d+1888>>2]=27;c[d+1892>>2]=28;f=0;i=e;return f|0}if((yg(b,12216)|0)==0){Ld(d)|0;f=0;i=e;return f|0}if((yg(b,12224)|0)==0){Md(d)|0;f=0;i=e;return f|0}if((yg(b,12232)|0)==0){Nd(d)|0;f=0;i=e;return f|0}if((yg(b,12240)|0)==0){Od(d)|0;f=0;i=e;return f|0}if((yg(b,12248)|0)==0){Pd(d)|0;f=0;i=e;return f|0}if((yg(b,12256)|0)==0){a[d]=5194576;a[d+1|0]=20291;a[d+2|0]=79;a[d+3|0]=0;c[d+4>>2]=602;j=d+8|0;g=d+24|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;s=+h[g>>3];if(s==0.0){h[g>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0;h[d+128>>3]=114.59155902616465}else{t=s*3.141592653589793/180.0;h[d+112>>3]=t;h[d+120>>3]=1.0/t;h[d+128>>3]=s*2.0}c[d+1888>>2]=29;c[d+1892>>2]=30;f=0;i=e;return f|0}if((yg(b,12264)|0)==0){a[d]=4412244;a[d+1|0]=17235;a[d+2|0]=67;a[d+3|0]=0;c[d+4>>2]=701;g=d+8|0;j=d+24|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;s=+h[j>>3];if(s==0.0){h[j>>3]=57.29577951308232;h[d+112>>3]=45.0;h[d+120>>3]=.022222222222222223}else{t=s*3.141592653589793*.25;h[d+112>>3]=t;h[d+120>>3]=1.0/t}c[d+1888>>2]=31;c[d+1892>>2]=32;f=0;i=e;return f|0}if((yg(b,12272)|0)==0){a[d]=4412227;a[d+1|0]=17235;a[d+2|0]=67;a[d+3|0]=0;c[d+4>>2]=702;j=d+8|0;g=d+24|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;t=+h[g>>3];if(t==0.0){h[g>>3]=57.29577951308232;h[d+112>>3]=45.0;h[d+120>>3]=.022222222222222223}else{s=t*3.141592653589793*.25;h[d+112>>3]=s;h[d+120>>3]=1.0/s}c[d+1888>>2]=33;c[d+1892>>2]=34;f=0;i=e;return f|0}if((yg(b,12280)|0)!=0){f=1;i=e;return f|0}a[d]=4412241;a[d+1|0]=17235;a[d+2|0]=67;a[d+3|0]=0;c[d+4>>2]=703;b=d+8|0;g=d+24|0;c[b+0>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[b+12>>2]=0;s=+h[g>>3];if(s==0.0){h[g>>3]=57.29577951308232;h[d+112>>3]=45.0;h[d+120>>3]=.022222222222222223}else{t=s*3.141592653589793*.25;h[d+112>>3]=t;h[d+120>>3]=1.0/t}c[d+1888>>2]=35;c[d+1892>>2]=36;f=0;i=e;return f|0}function Id(b){b=b|0;var d=0,e=0,f=0.0,g=0.0,j=0,k=0,l=0,m=0.0,n=0.0;d=i;a[b]=5265985;a[b+1|0]=20570;a[b+2|0]=80;a[b+3|0]=0;e=b+4|0;c[e>>2]=(c[e>>2]>>31&-202)+101;h[b+8>>3]=0.0;h[b+16>>3]=90.0;e=b+24|0;f=+h[e>>3];if(f==0.0){h[e>>3]=57.29577951308232;g=57.29577951308232}else{g=f}e=b+40|0;f=g*(+h[e>>3]+1.0);h[b+112>>3]=f;if(f==0.0){j=1;i=d;return j|0}k=b+48|0;f=+Re(+h[k>>3]);l=b+136|0;h[l>>3]=f;if(f==0.0){j=1;i=d;return j|0}h[b+128>>3]=1.0/f;f=+Se(+h[k>>3]);h[b+144>>3]=f;g=+h[l>>3];h[b+120>>3]=f/g;f=+h[e>>3];if(+P(+f)>1.0){h[b+152>>3]=+Ve(-1.0/f);m=+h[e>>3];n=+h[l>>3]}else{h[b+152>>3]=-90.0;m=f;n=g}g=m*n;h[b+160>>3]=g;l=+P(+g)<1.0;h[b+168>>3]=l?1.0:0.0;c[b+1888>>2]=37;c[b+1892>>2]=38;j=0;i=d;return j|0}function Jd(b){b=b|0;var d=0,e=0,f=0.0,g=0.0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;a[b]=5266003;a[b+1|0]=20570;a[b+2|0]=80;a[b+3|0]=0;e=b+4|0;c[e>>2]=(c[e>>2]>>31&-204)+102;h[b+8>>3]=0.0;h[b+16>>3]=90.0;e=b+24|0;f=+h[e>>3];if(f==0.0){h[e>>3]=57.29577951308232;g=57.29577951308232}else{g=f}h[b+112>>3]=1.0/g;j=b+40|0;g=+h[j>>3];k=b+56|0;f=g*+Se(+h[k>>3])+1.0;l=b+136|0;h[l>>3]=f;if(f==0.0){m=1;i=d;return m|0}f=+h[j>>3];g=f*+Re(+h[k>>3]);n=b+48|0;o=b+120|0;h[o>>3]=-(g*+Se(+h[n>>3]));g=+h[j>>3];f=g*+Re(+h[k>>3]);g=f*+Re(+h[n>>3]);h[b+128>>3]=g;f=+h[e>>3];h[b+144>>3]=f*+h[o>>3];h[b+152>>3]=f*g;g=+h[l>>3];h[b+160>>3]=f*g;f=g+-1.0;h[b+168>>3]=g*f+-1.0;if(+P(+f)<1.0){h[b+176>>3]=+Ve(1.0-g)}else{h[b+176>>3]=-90.0}c[b+1888>>2]=39;c[b+1892>>2]=40;m=0;i=d;return m|0}function Kd(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0.0,l=0.0,m=0,n=0,o=0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0.0,C=0.0,D=0.0;d=i;a[b]=5132378;a[b+1|0]=20048;a[b+2|0]=78;a[b+3|0]=0;e=b+4|0;c[e>>2]=(c[e>>2]>>31&-214)+107;f=b+8|0;h[f>>3]=0.0;g=b+16|0;h[g>>3]=90.0;j=b+24|0;k=+h[j>>3];if(k==0.0){h[j>>3]=57.29577951308232;l=57.29577951308232}else{l=k}m=9;while(1){if(!(+h[b+(m<<3)+32>>3]==0.0)){break}if((m|0)>0){m=m+ -1|0}else{n=6;break}}if((n|0)==6){a[b]=4411969;a[b+1|0]=17234;a[b+2|0]=67;a[b+3|0]=0;c[e>>2]=106;h[f>>3]=0.0;h[g>>3]=90.0;if(l==0.0){h[j>>3]=57.29577951308232;h[b+112>>3]=1.0;h[b+120>>3]=1.0}else{k=l*3.141592653589793/180.0;h[b+112>>3]=k;h[b+120>>3]=1.0/k}c[b+1888>>2]=7;c[b+1892>>2]=8;o=0;i=d;return o|0}c[b+272>>2]=m;c[b+1888>>2]=41;c[b+1892>>2]=42;if((m|0)<=2){o=0;i=d;return o|0}k=+h[b+40>>3];if(k<=0.0){o=1;i=d;return o|0}j=(m|0)>0;a:do{if(j){l=k;g=0;p=0.0;while(1){q=+(g|0)*3.141592653589793/180.0;r=0.0;f=m;do{r=q*r+ +(f|0)*+h[b+(f<<3)+32>>3];f=f+ -1|0}while((f|0)>0);f=g+1|0;if(r<=0.0){s=l;t=r;u=g;v=p;w=q;break a}if((f|0)<180){l=r;g=f;p=q}else{s=r;t=r;u=f;v=q;w=q;break}}}else{s=k;t=0.0;u=0;v=0.0;w=0.0}}while(0);b:do{if((u|0)==180){x=3.141592653589793}else{if(j){y=s;z=t;A=1;B=v;C=w}else{x=v-s*(w-v)/(t-s);break}while(1){k=B-y*(C-B)/(z-y);p=0.0;g=m;do{p=k*p+ +(g|0)*+h[b+(g<<3)+32>>3];g=g+ -1|0}while((g|0)>0);if(+P(+p)<1.0e-13){x=k;break b}g=p<0.0;f=A+1|0;if((f|0)<11){y=g?y:p;z=g?p:z;A=f;B=g?B:k;C=g?k:C}else{x=k;break}}}}while(0);if((m|0)>-1){A=m;C=0.0;while(1){B=x*C+ +h[b+(A<<3)+32>>3];if((A|0)>0){A=A+ -1|0;C=B}else{D=B;break}}}else{D=0.0}h[b+112>>3]=x;h[b+120>>3]=D;o=0;i=d;return o|0}function Ld(b){b=b|0;var d=0,e=0,f=0.0,g=0,j=0.0,k=0;d=i;a[b]=5263171;a[b+1|0]=20559;a[b+2|0]=80;a[b+3|0]=0;e=b+4|0;c[e>>2]=(c[e>>2]>>31&-1002)+501;h[b+8>>3]=0.0;e=b+40|0;f=+h[e>>3];h[b+16>>3]=f;g=b+24|0;if(+h[g>>3]==0.0){h[g>>3]=57.29577951308232}j=+Se(f);h[b+112>>3]=j;if(j==0.0){k=1;i=d;return k|0}h[b+120>>3]=1.0/j;j=+h[g>>3];f=j*+Re(+h[b+48>>3]);g=b+136|0;h[g>>3]=f;if(f==0.0){k=1;i=d;return k|0}h[b+144>>3]=1.0/f;f=1.0/+Te(+h[e>>3]);h[b+152>>3]=f;h[b+128>>3]=f*+h[g>>3];c[b+1888>>2]=43;c[b+1892>>2]=44;k=0;i=d;return k|0}function Md(b){b=b|0;var d=0,e=0,f=0.0,g=0,j=0.0,k=0.0,l=0.0,m=0,n=0,o=0;d=i;a[b]=4542275;a[b+1|0]=17743;a[b+2|0]=69;a[b+3|0]=0;c[b+4>>2]=502;h[b+8>>3]=0.0;e=b+40|0;f=+h[e>>3];h[b+16>>3]=f;g=b+24|0;if(+h[g>>3]==0.0){h[g>>3]=57.29577951308232}j=+h[b+48>>3];k=f-j;l=f+j;j=+Se(k);f=(j+ +Se(l))*.5;m=b+112|0;h[m>>3]=f;if(f==0.0){n=1;i=d;return n|0}h[b+120>>3]=1.0/f;o=b+136|0;h[o>>3]=+h[g>>3]/f;f=+Se(k);k=f*+Se(l)+1.0;h[b+144>>3]=k;l=+h[m>>3]*2.0;h[b+152>>3]=l;f=+h[o>>3];h[b+160>>3]=f*f*k;h[b+168>>3]=1.0/(+h[g>>3]*2.0*f);h[b+176>>3]=f*+Q(+(k+l));h[b+128>>3]=f*+Q(+(k-l*+Se(+h[e>>3])));c[b+1888>>2]=45;c[b+1892>>2]=46;n=0;i=d;return n|0}function Nd(b){b=b|0;var d=0,e=0,f=0.0,g=0,j=0.0,k=0.0,l=0,m=0,n=0.0,o=0;d=i;a[b]=4476739;a[b+1|0]=17487;a[b+2|0]=68;a[b+3|0]=0;c[b+4>>2]=503;h[b+8>>3]=0.0;e=b+40|0;f=+h[e>>3];h[b+16>>3]=f;g=b+24|0;j=+h[g>>3];if(j==0.0){h[g>>3]=57.29577951308232;k=57.29577951308232}else{k=j}l=b+48|0;m=+h[l>>3]==0.0;j=k*+Se(f);if(m){f=j*3.141592653589793/180.0;h[b+112>>3]=f;n=f}else{f=j*+Se(+h[l>>3]);j=f/+h[l>>3];h[b+112>>3]=j;n=j}if(n==0.0){o=1;i=d;return o|0}h[b+120>>3]=1.0/n;n=+h[g>>3];j=n*+Re(+h[l>>3]);n=j*+Re(+h[e>>3]);j=n/+h[b+112>>3];h[b+128>>3]=j;h[b+136>>3]=j+ +h[e>>3];c[b+1888>>2]=47;c[b+1892>>2]=48;o=0;i=d;return o|0}function Od(b){b=b|0;var d=0,e=0,f=0.0,g=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0;d=i;a[b]=5197635;a[b+1|0]=20303;a[b+2|0]=79;a[b+3|0]=0;c[b+4>>2]=504;h[b+8>>3]=0.0;e=b+40|0;f=+h[e>>3];h[b+16>>3]=f;g=b+24|0;if(+h[g>>3]==0.0){h[g>>3]=57.29577951308232}j=+h[b+48>>3];k=f-j;l=f+j;j=+Te((90.0-k)*.5);f=+Re(k);if(k==l){m=+Se(k);h[b+112>>3]=m;n=m}else{m=+Te((90.0-l)*.5);k=+_(+(+Re(l)/f))/+_(+(m/j));h[b+112>>3]=k;n=k}if(n==0.0){o=1;i=d;return o|0}h[b+120>>3]=1.0/n;k=+h[g>>3]*(f/n)/+R(+j,+n);g=b+136|0;h[g>>3]=k;if(k==0.0){o=1;i=d;return o|0}n=+Te((90.0- +h[e>>3])*.5);h[b+128>>3]=k*+R(+n,+(+h[b+112>>3]));h[b+144>>3]=1.0/+h[g>>3];c[b+1888>>2]=49;c[b+1892>>2]=50;o=0;i=d;return o|0}function Pd(b){b=b|0;var d=0,e=0,f=0,g=0.0,j=0.0,k=0.0,l=0,m=0;d=i;a[b]=5132098;a[b+1|0]=20047;a[b+2|0]=78;a[b+3|0]=0;c[b+4>>2]=601;e=b+8|0;f=b+24|0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;g=+h[f>>3];if(g==0.0){h[f>>3]=57.29577951308232;h[b+120>>3]=1.0;f=b+40|0;j=+Re(+h[f>>3])*57.29577951308232;k=j/+Se(+h[f>>3]);h[b+128>>3]=k+ +h[f>>3];l=b+1888|0;c[l>>2]=51;m=b+1892|0;c[m>>2]=52;i=d;return 0}else{h[b+120>>3]=g*3.141592653589793/180.0;f=b+40|0;k=+Re(+h[f>>3]);j=k/+Se(+h[f>>3]);h[b+128>>3]=g*(j+ +h[f>>3]*3.141592653589793/180.0);l=b+1888|0;c[l>>2]=51;m=b+1892|0;c[m>>2]=52;i=d;return 0}return 0}function Qd(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;g=i;j=d+4|0;k=c[j>>2]|0;if((((k|0)>-1?k:0-k|0)|0)!=101?(Id(d)|0)!=0:0){l=1;i=g;return l|0}m=+Re(a);n=+Re(b);o=m*+h[d+120>>3];k=d+40|0;p=+h[k>>3];q=n*o+(p+ +Se(b));if(q==0.0){l=2;i=g;return l|0}p=n*+h[d+112>>3]/q;h[e>>3]=p*+Se(a);h[f>>3]=-(m*p*+h[d+128>>3]);if((c[j>>2]|0)>0){if(+h[d+152>>3]>b){l=2;i=g;return l|0}if(+h[d+168>>3]>0.0?(p=+h[k>>3]/+Q(+(o*o+1.0)),+P(+p)<=1.0):0){m=+We(-o);o=+Ve(p);p=m-o;a=m+o+180.0;if(p>90.0){r=p+-360.0}else{r=p}if(a>90.0){s=a+-360.0}else{s=a}if((r>s?r:s)>b){l=2;i=g;return l|0}}}l=0;i=g;return l|0}function Rd(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0;g=i;j=c[d+4>>2]|0;if((((j|0)>-1?j:0-j|0)|0)!=101?(Id(d)|0)!=0:0){k=1;i=g;return k|0}l=+h[d+136>>3]*b;m=+Q(+(a*a+l*l));if(m==0.0){h[e>>3]=0.0;n=90.0}else{h[e>>3]=+Xe(a,-l);l=m/(+h[d+112>>3]+ +h[d+144>>3]*b);b=l*+h[d+40>>3]/+Q(+(l*l+1.0));m=+Xe(1.0,l);if(+P(+b)>1.0){l=b<0.0?-90.0:90.0;if(+P(+l)>1.0000000000001){k=2;i=g;return k|0}else{o=l}}else{o=+Ve(b)}b=m-o;l=m+o+180.0;if(b>90.0){p=b+-360.0}else{p=b}if(l>90.0){q=l+-360.0}else{q=l}n=p>q?p:q}h[f>>3]=n;k=0;i=g;return k|0}function Sd(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0.0;g=i;j=d+4|0;k=c[j>>2]|0;if((((k|0)>-1?k:0-k|0)|0)!=102?(Jd(d)|0)!=0:0){l=1;i=g;return l|0}m=+Re(a);n=+Se(a);a=+Re(b);o=1.0- +Se(b);k=d+136|0;p=+h[k>>3]-o;if(p==0.0){l=2;i=g;return l|0}q=d+160|0;h[e>>3]=(n*a*+h[q>>3]-o*+h[d+144>>3])/p;h[f>>3]=-(m*a*+h[q>>3]+o*+h[d+152>>3])/p;if((c[j>>2]|0)>0){if(+h[d+176>>3]>b){l=2;i=g;return l|0}if(+P(+(+h[d+40>>3]))>1.0?(p=n*+h[d+120>>3]-m*+h[d+128>>3],m=1.0/+Q(+(+h[d+168>>3]+p*p)),+P(+m)<=1.0):0){n=+Xe(p,+h[k>>3]+-1.0);p=+Ve(m);m=n-p;o=n+p+180.0;if(m>90.0){r=m+-360.0}else{r=m}if(o>90.0){s=o+-360.0}else{s=o}if((r>s?r:s)>b){l=2;i=g;return l|0}}}l=0;i=g;return l|0}function Td(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0;g=i;j=c[d+4>>2]|0;if((((j|0)>-1?j:0-j|0)|0)!=102?(Jd(d)|0)!=0:0){k=1;i=g;return k|0}l=+h[d+112>>3];m=l*a;a=l*b;b=m*m+a*a;l=+h[d+136>>3];n=(m- +h[d+120>>3])/l;o=(a- +h[d+128>>3])/l;l=m*n+a*o;do{if(!(b<1.0e-10)){p=n*n+o*o;q=p+1.0;r=l-p;s=r*r-q*(p+(b-l-l)+-1.0);if(s<0.0){k=2;i=g;return k|0}p=+Q(+s);s=(p-r)/q;t=(-r-p)/q;q=s>t?s:t;if(q>1.0){if(q+-1.0<1.0e-13){u=1.0}else{u=s<t?s:t}}else{u=q}q=u<-1.0&u+1.0>-1.0e-13?-1.0:u;if(q>1.0|q<-1.0){k=2;i=g;return k|0}else{h[f>>3]=+Ve(q);v=1.0-q;break}}else{h[f>>3]=90.0- +Q(+(b/(l+1.0)))*57.29577951308232;v=b*.5}}while(0);h[e>>3]=+Xe(m-n*v,-(a-o*v));k=0;i=g;return k|0}function Ud(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+16|0;k=j;l=e+4|0;m=c[l>>2]|0;if((((m|0)>-1?m:0-m|0)|0)!=103){a[e]=5128532;a[e+1|0]=20033;a[e+2|0]=78;a[e+3|0]=0;c[l>>2]=(m>>31&-206)+103;h[e+8>>3]=0.0;h[e+16>>3]=90.0;m=e+24|0;if(+h[m>>3]==0.0){h[m>>3]=57.29577951308232}c[e+1888>>2]=1;c[e+1892>>2]=2;m=99;while(1){if(!(+h[e+(m<<3)+280>>3]==0.0)){n=m;break}o=m+ -1|0;if(!(+h[e+(m+100<<3)+280>>3]==0.0)){n=m;break}if((m|0)>0){m=o}else{n=o;break}}c[e+276>>2]=(n|0)<0?0:n}p=+Se(d);if(p<=0.0){i=j;return 2}q=+h[e+24>>3];r=q*+Re(d)/p;h[k>>3]=r*+Se(b);n=k+8|0;h[n>>3]=-(r*+Re(b));m=c[e+1880>>2]|0;if((m|0)==0){s=+h[k>>3]}else{s=+sd(m,k)}h[f>>3]=s;f=c[e+1884>>2]|0;if((f|0)==0){t=+h[n>>3];h[g>>3]=t;u=c[l>>2]|0;v=(u|0)>0;w=p<0.0;x=v&w;y=x?2:0;i=j;return y|0}else{t=+sd(f,k);h[g>>3]=t;u=c[l>>2]|0;v=(u|0)>0;w=p<0.0;x=v&w;y=x?2:0;i=j;return y|0}return 0}function Vd(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0,u=0.0,v=0.0;j=i;i=i+16|0;k=j+8|0;l=j;m=e+4|0;n=c[m>>2]|0;if((((n|0)>-1?n:0-n|0)|0)==103){o=c[e+276>>2]|0}else{a[e]=5128532;a[e+1|0]=20033;a[e+2|0]=78;a[e+3|0]=0;c[m>>2]=(n>>31&-206)+103;h[e+8>>3]=0.0;h[e+16>>3]=90.0;n=e+24|0;if(+h[n>>3]==0.0){h[n>>3]=57.29577951308232}c[e+1888>>2]=1;c[e+1892>>2]=2;n=99;while(1){if(!(+h[e+(n<<3)+280>>3]==0.0)){p=n;break}m=n+ -1|0;if(!(+h[e+(n+100<<3)+280>>3]==0.0)){p=n;break}if((n|0)>0){n=m}else{p=m;break}}n=(p|0)<0?0:p;c[e+276>>2]=n;o=n}if((o|0)==0){h[k>>3]=b;h[l>>3]=d;q=b;r=d}else{Wd(e,b,d,k,l)|0;q=+h[k>>3];r=+h[l>>3]}d=+Q(+(q*q+r*r));if(d==0.0){s=0.0;h[f>>3]=s;t=e+24|0;u=+h[t>>3];v=+Xe(u,d);h[g>>3]=v;i=j;return 0}s=+Xe(q,-r);h[f>>3]=s;t=e+24|0;u=+h[t>>3];v=+Xe(u,d);h[g>>3]=v;i=j;return 0}function Wd(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ba=0.0,ca=0.0,da=0.0,ea=0.0,fa=0.0,ga=0.0,ha=0.0,ia=0.0,ja=0.0,ka=0.0,la=0.0,ma=0.0,na=0.0,oa=0.0,pa=0.0,qa=0.0,ra=0.0,sa=0.0,ta=0.0,ua=0.0,va=0.0,wa=0.0,xa=0.0,ya=0.0,za=0.0,Aa=0.0,Ba=0.0,Ca=0.0,Da=0.0,Ea=0.0,Fa=0.0,Ga=0.0,Ha=0.0,Ia=0.0,Ja=0.0,Ka=0.0,La=0.0,Ma=0.0,Na=0.0,Oa=0.0,Pa=0.0;g=i;j=c[a+276>>2]|0;k=+h[a+1080>>3]+ +h[a+1088>>3]*b;l=+h[a+280>>3]+ +h[a+288>>3]*d;if((j|0)!=1){m=k+ +h[a+1096>>3]*d;n=l+ +h[a+296>>3]*b;if((j|0)!=2){o=b*b;p=d*d;q=+Q(+(o+p));r=m+q*+h[a+1104>>3];s=n+q*+h[a+304>>3];if((j|0)!=3){t=r+o*+h[a+1112>>3];u=s+p*+h[a+312>>3];if((j|0)!=4){v=b*d;w=t+v*+h[a+1120>>3];x=u+v*+h[a+320>>3];if((j|0)!=5){v=w+p*+h[a+1128>>3];y=x+o*+h[a+328>>3];if((j|0)!=6){z=o*b;A=v+z*+h[a+1136>>3];B=p*d;C=y+B*+h[a+336>>3];if((j|0)!=7){D=A+o*+h[a+1144>>3]*d;E=C+p*+h[a+344>>3]*b;if((j|0)!=8){F=D+p*+h[a+1152>>3]*b;G=E+o*+h[a+352>>3]*d;if((j|0)!=9){H=F+B*+h[a+1160>>3];I=G+z*+h[a+360>>3];if((j|0)!=10){J=q*q*q;K=H+J*+h[a+1168>>3];L=I+J*+h[a+368>>3];if((j|0)!=11){M=o*o;N=K+M*+h[a+1176>>3];O=p*p;P=L+O*+h[a+376>>3];if((j|0)!=12){R=N+z*+h[a+1184>>3]*d;S=P+B*+h[a+384>>3]*b;if((j|0)!=13){T=R+p*o*+h[a+1192>>3];U=S+p*o*+h[a+392>>3];if((j|0)!=14){V=T+B*+h[a+1200>>3]*b;W=U+z*+h[a+400>>3]*d;if((j|0)!=15){X=V+O*+h[a+1208>>3];Y=W+M*+h[a+408>>3];if((j|0)!=16){Z=M*b;_=X+Z*+h[a+1216>>3];$=O*d;aa=Y+$*+h[a+416>>3];if((j|0)!=17){ba=_+M*+h[a+1224>>3]*d;ca=aa+O*+h[a+424>>3]*b;if((j|0)!=18){da=ba+p*z*+h[a+1232>>3];ea=ca+o*B*+h[a+432>>3];if((j|0)!=19){fa=da+B*o*+h[a+1240>>3];ga=ea+z*p*+h[a+440>>3];if((j|0)!=20){ha=fa+O*+h[a+1248>>3]*b;ia=ga+M*+h[a+448>>3]*d;if((j|0)!=21){ja=ha+$*+h[a+1256>>3];ka=ia+Z*+h[a+456>>3];if((j|0)!=22){la=q*q*J;J=ja+la*+h[a+1264>>3];ma=ka+la*+h[a+464>>3];if((j|0)!=23){na=Z*b;oa=J+na*+h[a+1272>>3];pa=$*d;qa=ma+pa*+h[a+472>>3];if((j|0)!=24){ra=oa+Z*+h[a+1280>>3]*d;sa=qa+$*+h[a+480>>3]*b;if((j|0)!=25){ta=ra+p*M*+h[a+1288>>3];ua=sa+o*O*+h[a+488>>3];if((j|0)!=26){va=ta+B*z*+h[a+1296>>3];wa=ua+z*B*+h[a+496>>3];if((j|0)!=27){xa=va+O*o*+h[a+1304>>3];ya=wa+M*p*+h[a+504>>3];if((j|0)!=28){za=xa+$*+h[a+1312>>3]*b;Aa=ya+Z*+h[a+512>>3]*d;if((j|0)!=29){Ba=za+pa*+h[a+1320>>3];Ca=Aa+na*+h[a+520>>3];if((j|0)!=30){Da=na*b;Ea=Ba+Da*+h[a+1328>>3];Fa=pa*d;Ga=Ca+Fa*+h[a+528>>3];if((j|0)!=31){Ha=Ea+na*+h[a+1336>>3]*d;Ia=Ga+pa*+h[a+536>>3]*b;if((j|0)!=32){Ja=Ha+p*Z*+h[a+1344>>3];Ka=Ia+o*$*+h[a+544>>3];if((j|0)!=33){La=Ja+B*M*+h[a+1352>>3];Ma=Ka+z*O*+h[a+552>>3];if((j|0)!=34){Na=La+O*z*+h[a+1360>>3];z=Ma+M*B*+h[a+560>>3];if((j|0)!=35){B=Na+$*o*+h[a+1368>>3];o=z+Z*p*+h[a+568>>3];if((j|0)!=36){p=B+pa*+h[a+1376>>3]*b;b=o+na*+h[a+576>>3]*d;if((j|0)!=37){d=p+Fa*+h[a+1384>>3];Fa=b+Da*+h[a+584>>3];if((j|0)==38){Oa=d;Pa=Fa}else{Da=q*q*la;Oa=d+Da*+h[a+1392>>3];Pa=Fa+Da*+h[a+592>>3]}}else{Oa=p;Pa=b}}else{Oa=B;Pa=o}}else{Oa=Na;Pa=z}}else{Oa=La;Pa=Ma}}else{Oa=Ja;Pa=Ka}}else{Oa=Ha;Pa=Ia}}else{Oa=Ea;Pa=Ga}}else{Oa=Ba;Pa=Ca}}else{Oa=za;Pa=Aa}}else{Oa=xa;Pa=ya}}else{Oa=va;Pa=wa}}else{Oa=ta;Pa=ua}}else{Oa=ra;Pa=sa}}else{Oa=oa;Pa=qa}}else{Oa=J;Pa=ma}}else{Oa=ja;Pa=ka}}else{Oa=ha;Pa=ia}}else{Oa=fa;Pa=ga}}else{Oa=da;Pa=ea}}else{Oa=ba;Pa=ca}}else{Oa=_;Pa=aa}}else{Oa=X;Pa=Y}}else{Oa=V;Pa=W}}else{Oa=T;Pa=U}}else{Oa=R;Pa=S}}else{Oa=N;Pa=P}}else{Oa=K;Pa=L}}else{Oa=H;Pa=I}}else{Oa=F;Pa=G}}else{Oa=D;Pa=E}}else{Oa=A;Pa=C}}else{Oa=v;Pa=y}}else{Oa=w;Pa=x}}else{Oa=t;Pa=u}}else{Oa=r;Pa=s}}else{Oa=m;Pa=n}}else{Oa=k;Pa=l}h[e>>3]=Oa;h[f>>3]=Pa;i=g;return 0}function Xd(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0,o=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=104){a[e]=4674643;a[e+1|0]=18260;a[e+2|0]=71;a[e+3|0]=0;c[k>>2]=104;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;l=+h[k>>3];if(l==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648}else{m=l*2.0;h[e+112>>3]=m;h[e+120>>3]=1.0/m}c[e+1888>>2]=3;c[e+1892>>2]=4}m=+Se(d)+1.0;if(m==0.0){n=2;i=j;return n|0}l=+h[e+112>>3];o=l*+Re(d)/m;h[f>>3]=o*+Se(b);h[g>>3]=-(o*+Re(b));n=0;i=j;return n|0}function Yd(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=104){a[e]=4674643;a[e+1|0]=18260;a[e+2|0]=71;a[e+3|0]=0;c[k>>2]=104;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;l=+h[k>>3];if(l==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648}else{m=l*2.0;h[e+112>>3]=m;h[e+120>>3]=1.0/m}c[e+1888>>2]=3;c[e+1892>>2]=4}m=+Q(+(b*b+d*d));if(m==0.0){n=0.0;h[f>>3]=n;o=e+120|0;p=+h[o>>3];q=m*p;r=+We(q);s=r*2.0;t=90.0-s;h[g>>3]=t;i=j;return 0}n=+Xe(b,-d);h[f>>3]=n;o=e+120|0;p=+h[o>>3];q=m*p;r=+We(q);s=r*2.0;t=90.0-s;h[g>>3]=t;i=j;return 0}function Zd(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0;j=i;k=e+4|0;l=c[k>>2]|0;if((((l|0)>-1?l:0-l|0)|0)!=105){a[e]=5130579;a[e+1|0]=20041;a[e+2|0]=78;a[e+3|0]=0;c[k>>2]=(l>>31&-210)+105;h[e+8>>3]=0.0;h[e+16>>3]=90.0;l=e+24|0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;n=57.29577951308232}else{n=m}h[e+112>>3]=1.0/n;n=+h[e+40>>3];m=+h[e+48>>3];o=n*n+m*m;h[e+120>>3]=o;h[e+128>>3]=o+1.0;h[e+136>>3]=o+-1.0;c[e+1888>>2]=5;c[e+1892>>2]=6}o=(90.0- +P(+d))*3.141592653589793/180.0;if(o<1.0e-5){m=o*o*.5;if(d>0.0){p=o;q=m}else{p=o;q=2.0-m}}else{m=1.0- +Se(d);p=+Re(d);q=m}m=+Re(b);o=+Se(b);l=e+24|0;r=e+40|0;h[f>>3]=+h[l>>3]*(p*o+q*+h[r>>3]);f=e+48|0;h[g>>3]=-(+h[l>>3]*(p*m-q*+h[f>>3]));do{if((c[k>>2]|0)>0){if(+h[e+120>>3]==0.0){if(d<0.0){s=2}else{break}i=j;return s|0}else{if(d<-+We(o*+h[r>>3]-m*+h[f>>3])){s=2}else{break}i=j;return s|0}}}while(0);s=0;i=j;return s|0}function _d(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0.0,v=0.0,w=0.0;j=i;k=e+4|0;l=c[k>>2]|0;if((((l|0)>-1?l:0-l|0)|0)==105){m=+h[e+112>>3];n=+h[e+120>>3]}else{a[e]=5130579;a[e+1|0]=20041;a[e+2|0]=78;a[e+3|0]=0;c[k>>2]=(l>>31&-210)+105;h[e+8>>3]=0.0;h[e+16>>3]=90.0;l=e+24|0;o=+h[l>>3];if(o==0.0){h[l>>3]=57.29577951308232;p=57.29577951308232}else{p=o}o=1.0/p;h[e+112>>3]=o;p=+h[e+40>>3];q=+h[e+48>>3];r=p*p+q*q;h[e+120>>3]=r;h[e+128>>3]=r+1.0;h[e+136>>3]=r+-1.0;c[e+1888>>2]=5;c[e+1892>>2]=6;m=o;n=r}r=m*b;b=m*d;d=r*r+b*b;if(n==0.0){if(d!=0.0){s=+Xe(r,-b)}else{s=0.0}h[f>>3]=s;if(d<.5){h[g>>3]=+Ue(+Q(+d));t=0;i=j;return t|0}if(!(d<=1.0)){t=2;i=j;return t|0}h[g>>3]=+Ve(+Q(+(1.0-d)));t=0;i=j;return t|0}l=e+40|0;k=e+48|0;s=r*+h[l>>3]+b*+h[k>>3];do{if(!(d<1.0e-10)){m=+h[e+128>>3];o=s-n;q=o*o-m*(d-s-s+ +h[e+136>>3]);if(q<0.0){t=2;i=j;return t|0}p=+Q(+q);q=(p-o)/m;u=(-o-p)/m;m=q>u?q:u;if(m>1.0){if(m+-1.0<1.0e-13){v=1.0}else{v=q<u?q:u}}else{v=m}m=v<-1.0&v+1.0>-1.0e-13?-1.0:v;if(m>1.0|m<-1.0){t=2;i=j;return t|0}else{h[g>>3]=+Ve(m);w=1.0-m;break}}else{h[g>>3]=90.0- +Q(+(d/(s+1.0)))*57.29577951308232;w=d*.5}}while(0);d=w*+h[k>>3]-b;b=r-w*+h[l>>3];if(d==0.0&b==0.0){h[f>>3]=0.0;t=0;i=j;return t|0}else{h[f>>3]=+Xe(b,d);t=0;i=j;return t|0}return 0}function $d(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==106){l=+h[e+112>>3];m=90.0-d;n=m*l;o=+Se(b);p=n*o;h[f>>3]=p;q=+Re(b);r=n*q;s=-r;h[g>>3]=s;i=j;return 0}a[e]=4411969;a[e+1|0]=17234;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=106;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;t=+h[k>>3];if(t==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;u=1.0}else{v=t*3.141592653589793/180.0;h[e+112>>3]=v;h[e+120>>3]=1.0/v;u=v}c[e+1888>>2]=7;c[e+1892>>2]=8;l=u;m=90.0-d;n=m*l;o=+Se(b);p=n*o;h[f>>3]=p;q=+Re(b);r=n*q;s=-r;h[g>>3]=s;i=j;return 0}function ae(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0,p=0.0,q=0.0,r=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=106){a[e]=4411969;a[e+1|0]=17234;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=106;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;l=+h[k>>3];if(l==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0}else{m=l*3.141592653589793/180.0;h[e+112>>3]=m;h[e+120>>3]=1.0/m}c[e+1888>>2]=7;c[e+1892>>2]=8}m=+Q(+(b*b+d*d));if(m==0.0){n=0.0;h[f>>3]=n;o=e+120|0;p=+h[o>>3];q=m*p;r=90.0-q;h[g>>3]=r;i=j;return 0}n=+Xe(b,-d);h[f>>3]=n;o=e+120|0;p=+h[o>>3];q=m*p;r=90.0-q;h[g>>3]=r;i=j;return 0}function be(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0.0;g=i;j=d+4|0;k=c[j>>2]|0;if((((k|0)>-1?k:0-k|0)|0)!=107?(Kd(d)|0)!=0:0){l=1;i=g;return l|0}m=(90.0-b)*3.141592653589793/180.0;b=(m*(m*(m*(m*(m*(m*(m*(m*(m*(m*0.0+ +h[d+104>>3])+ +h[d+96>>3])+ +h[d+88>>3])+ +h[d+80>>3])+ +h[d+72>>3])+ +h[d+64>>3])+ +h[d+56>>3])+ +h[d+48>>3])+ +h[d+40>>3])+ +h[d+32>>3])*+h[d+24>>3];h[e>>3]=b*+Se(a);h[f>>3]=-(b*+Re(a));if((c[j>>2]|0)>0?m>+h[d+112>>3]:0){l=2;i=g;return l|0}l=0;i=g;return l|0}function ce(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0;g=i;j=c[d+4>>2]|0;if((((j|0)>-1?j:0-j|0)|0)!=107?(Kd(d)|0)!=0:0){k=1;i=g;return k|0}j=c[d+272>>2]|0;l=+Q(+(a*a+b*b));m=l/+h[d+24>>3];if((j|0)<1){k=1;i=g;return k|0}a:do{if((j|0)==2){l=+h[d+48>>3];n=+h[d+40>>3];o=n*n-l*4.0*(+h[d+32>>3]-m);if(o<0.0){k=2;i=g;return k|0}p=+Q(+o);o=l*2.0;l=(p-n)/o;q=(-n-p)/o;o=l<q?l:q;if(o<-1.0e-13){r=l>q?l:q}else{r=o}if(r<0.0){if(r<-1.0e-13){k=2}else{s=0.0;break}i=g;return k|0}if(r>3.141592653589793){if(r>3.141592653589893){k=2;i=g;return k|0}else{s=3.141592653589793}}else{s=r}}else if((j|0)==1){s=(m- +h[d+32>>3])/+h[d+40>>3]}else{o=+h[d+32>>3];q=+h[d+112>>3];l=+h[d+120>>3];if(m<o){if(m<o+-1.0e-13){k=2}else{s=0.0;break}i=g;return k|0}if(m>l){if(m>l+1.0e-13){k=2}else{s=q;break}i=g;return k|0}if((j|0)>-1){t=0;u=o;v=l;w=0.0;x=q}else{p=0.0-m;y=0;n=o;o=l;l=0.0;z=q;while(1){q=(o-m)/(o-n);if(!(q<.1)){if(q>.9){A=.9}else{A=q}}else{A=.1}q=z-(z-l)*A;if(m>0.0){if(m<1.0e-13){s=q;break a}else{B=0.0;C=o;D=q;E=z}}else{if(p<1.0e-13){s=q;break a}else{B=n;C=0.0;D=l;E=q}}F=y+1|0;if(!(+P(+(E-D))<1.0e-13)&(F|0)<100){y=F;n=B;o=C;l=D;z=E}else{s=q;break a}}}while(1){z=(v-m)/(v-u);if(!(z<.1)){if(z>.9){G=.9}else{G=z}}else{G=.1}z=x-(x-w)*G;y=j;l=0.0;while(1){l=z*l+ +h[d+(y<<3)+32>>3];if((y|0)<=0){break}else{y=y+ -1|0}}if(l<m){if(m-l<1.0e-13){s=z;break a}else{H=l;I=v;J=z;K=x}}else{if(l-m<1.0e-13){s=z;break a}else{H=u;I=l;J=w;K=z}}y=t+1|0;if(!(+P(+(K-J))<1.0e-13)&(y|0)<100){t=y;u=H;v=I;w=J;x=K}else{s=z;break}}}}while(0);if(m==0.0){L=0.0}else{L=+Xe(a,-b)}h[e>>3]=L;h[f>>3]=90.0-s*180.0/3.141592653589793;k=0;i=g;return k|0}function de(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==108){l=+h[e+112>>3]}else{a[e]=4277594;a[e+1|0]=16709;a[e+2|0]=65;a[e+3|0]=0;c[k>>2]=108;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;m=+h[k>>3];if(m==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648;n=114.59155902616465}else{o=m*2.0;h[e+112>>3]=o;h[e+120>>3]=1.0/o;n=o}c[e+1888>>2]=9;c[e+1892>>2]=10;l=n}n=l*+Se((90.0-d)*.5);h[f>>3]=n*+Se(b);h[g>>3]=-(n*+Re(b));i=j;return 0}function ee(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0;j=i;k=e+4|0;if((c[k>>2]|0)!=108){a[e]=4277594;a[e+1|0]=16709;a[e+2|0]=65;a[e+3|0]=0;c[k>>2]=108;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;l=+h[k>>3];if(l==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648}else{m=l*2.0;h[e+112>>3]=m;h[e+120>>3]=1.0/m}c[e+1888>>2]=9;c[e+1892>>2]=10}m=+Q(+(b*b+d*d));if(m==0.0){n=0.0}else{n=+Xe(b,-d)}h[f>>3]=n;n=m*+h[e+120>>3];if(+P(+n)>1.0){if(+P(+(m- +h[e+112>>3]))<1.0e-12){o=-90.0}else{p=2;i=j;return p|0}}else{o=90.0- +Ve(n)*2.0}h[g>>3]=o;p=0;i=j;return p|0}function fe(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=109){a[e]=5392705;a[e+1|0]=21065;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=109;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;l=+h[k>>3];if(l==0.0){h[k>>3]=57.29577951308232;m=57.29577951308232}else{m=l}l=m*2.0;k=e+112|0;h[k>>3]=l;m=+h[e+40>>3];do{if(!(m==90.0)){if(m>-90.0){n=+Re((90.0-m)*.5);o=n*n;p=+_(+n)*o/(1.0-o);h[e+120>>3]=p;o=.5-p;h[e+128>>3]=o;q=o;r=+h[k>>3];break}else{s=1;i=j;return s|0}}else{h[e+120>>3]=-.5;h[e+128>>3]=1.0;q=1.0;r=l}}while(0);h[e+136>>3]=q*r;h[e+144>>3]=1.0e-4;h[e+152>>3]=q*1.0e-4;h[e+160>>3]=57.29577951308232/q;c[e+1888>>2]=11;c[e+1892>>2]=12}do{if(!(d==90.0)){if(!(d>-90.0)){s=2;i=j;return s|0}q=90.0-d;r=q*.017453292519943295*.5;if(r<+h[e+144>>3]){t=r*+h[e+136>>3];break}else{r=+Re(q*.5);q=+Q(+(1.0-r*r))/r;l=+_(+r)/q;t=-(+h[e+112>>3]*(l+q*+h[e+120>>3]));break}}else{t=0.0}}while(0);h[f>>3]=t*+Se(b);h[g>>3]=-(t*+Re(b));s=0;i=j;return s|0}function ge(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==109){l=+h[e+112>>3]}else{a[e]=5392705;a[e+1|0]=21065;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=109;h[e+8>>3]=0.0;h[e+16>>3]=90.0;k=e+24|0;m=+h[k>>3];if(m==0.0){h[k>>3]=57.29577951308232;n=57.29577951308232}else{n=m}m=n*2.0;k=e+112|0;h[k>>3]=m;n=+h[e+40>>3];do{if(!(n==90.0)){if(n>-90.0){o=+Re((90.0-n)*.5);p=o*o;q=+_(+o)*p/(1.0-p);h[e+120>>3]=q;p=.5-q;h[e+128>>3]=p;r=p;s=+h[k>>3];break}else{t=1;i=j;return t|0}}else{h[e+120>>3]=-.5;h[e+128>>3]=1.0;r=1.0;s=m}}while(0);h[e+136>>3]=r*s;h[e+144>>3]=1.0e-4;h[e+152>>3]=r*1.0e-4;h[e+160>>3]=57.29577951308232/r;c[e+1888>>2]=11;c[e+1892>>2]=12;l=s}s=+Q(+(b*b+d*d))/l;if(s==0.0){u=0.0;v=0.0}else{do{if(!(s<+h[e+152>>3])){l=+h[e+120>>3];k=0;r=0.0;m=1.0;while(1){w=m*.5;n=+Q(+(1.0-w*w))/w;x=-(+_(+w)/n+n*l);y=k+1|0;if(s<=x){z=k;A=r;B=m;break}if((y|0)<30){k=y;r=x;m=w}else{z=y;A=x;B=w;break}}if((z|0)==30){t=2;i=j;return t|0}else{C=0;D=A;E=x;F=B;G=w}while(1){m=(E-s)/(E-D);if(!(m<.1)){if(m>.9){H=.9}else{H=m}}else{H=.1}I=G-(G-F)*H;m=+Q(+(1.0-I*I))/I;r=+_(+I)/m+m*l;m=-r;if(s>m){if(s+r<1.0e-12){J=C;break}else{K=m;L=E;M=I;N=G}}else{if(m-s<1.0e-12){J=C;break}else{K=D;L=m;M=F;N=I}}k=C+1|0;if((k|0)<100){C=k;D=K;E=L;F=M;G=N}else{J=k;break}}if((J|0)==100){t=2;i=j;return t|0}else{O=+Ue(I);break}}else{O=s*+h[e+160>>3]}}while(0);u=+Xe(b,-d);v=O}h[f>>3]=u;h[g>>3]=90.0-v*2.0;t=0;i=j;return t|0}function he(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==201){l=+h[e+40>>3]}else{a[e]=5265731;a[e+1|0]=20569;a[e+2|0]=80;a[e+3|0]=0;c[k>>2]=201;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];do{if(n==0.0){h[m>>3]=57.29577951308232;o=+h[e+48>>3];h[e+112>>3]=o;if(o==0.0){p=1;i=j;return p|0}h[e+120>>3]=1.0/o;q=+h[e+40>>3];r=(o+q)*57.29577951308232;h[e+128>>3]=r;if(r==0.0){p=1;i=j;return p|0}else{h[e+136>>3]=1.0/r;s=q;break}}else{q=+h[e+48>>3];r=n*q*3.141592653589793/180.0;h[e+112>>3]=r;if(r==0.0){p=1;i=j;return p|0}h[e+120>>3]=1.0/r;r=+h[e+40>>3];o=n*(q+r);h[e+128>>3]=o;if(o==0.0){p=1;i=j;return p|0}else{h[e+136>>3]=1.0/o;s=r;break}}}while(0);c[e+1888>>2]=13;c[e+1892>>2]=14;l=s}s=l+ +Re(d);if(s==0.0){p=2;i=j;return p|0}h[f>>3]=+h[e+112>>3]*b;b=+h[e+128>>3];h[g>>3]=b*+Se(d)/s;p=0;i=j;return p|0}function ie(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==201){l=+h[e+120>>3]}else{a[e]=5265731;a[e+1|0]=20569;a[e+2|0]=80;a[e+3|0]=0;c[k>>2]=201;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];do{if(n==0.0){h[m>>3]=57.29577951308232;o=+h[e+48>>3];h[e+112>>3]=o;if(o==0.0){p=1;i=j;return p|0}q=1.0/o;h[e+120>>3]=q;r=(o+ +h[e+40>>3])*57.29577951308232;h[e+128>>3]=r;if(r==0.0){p=1;i=j;return p|0}else{h[e+136>>3]=1.0/r;s=q;break}}else{q=+h[e+48>>3];r=n*q*3.141592653589793/180.0;h[e+112>>3]=r;if(r==0.0){p=1;i=j;return p|0}o=1.0/r;h[e+120>>3]=o;r=n*(q+ +h[e+40>>3]);h[e+128>>3]=r;if(r==0.0){p=1;i=j;return p|0}else{h[e+136>>3]=1.0/r;s=o;break}}}while(0);c[e+1888>>2]=13;c[e+1892>>2]=14;l=s}h[f>>3]=l*b;b=+h[e+136>>3]*d;d=+Xe(b,1.0);h[g>>3]=d+ +Ve(b*+h[e+40>>3]/+Q(+(b*b+1.0)));p=0;i=j;return p|0}function je(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0,q=0.0,r=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==202){l=+h[e+112>>3]}else{a[e]=4277571;a[e+1|0]=16709;a[e+2|0]=65;a[e+3|0]=0;c[k>>2]=202;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];do{if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;o=+h[e+40>>3];if(o<=0.0|o>1.0){p=1;i=j;return p|0}else{h[e+128>>3]=57.29577951308232/o;h[e+136>>3]=o/57.29577951308232;q=1.0;break}}else{o=n*3.141592653589793/180.0;h[e+112>>3]=o;h[e+120>>3]=57.29577951308232/n;r=+h[e+40>>3];if(r<=0.0|r>1.0){p=1;i=j;return p|0}else{h[e+128>>3]=n/r;h[e+136>>3]=r/n;q=o;break}}}while(0);c[e+1888>>2]=15;c[e+1892>>2]=16;l=q}h[f>>3]=l*b;b=+h[e+128>>3];h[g>>3]=b*+Se(d);p=0;i=j;return p|0}function ke(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==202){l=+h[e+136>>3]}else{a[e]=4277571;a[e+1|0]=16709;a[e+2|0]=65;a[e+3|0]=0;c[k>>2]=202;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];do{if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;o=+h[e+40>>3];if(o<=0.0|o>1.0){p=1;i=j;return p|0}else{h[e+128>>3]=57.29577951308232/o;q=o/57.29577951308232;h[e+136>>3]=q;r=q;break}}else{h[e+112>>3]=n*3.141592653589793/180.0;h[e+120>>3]=57.29577951308232/n;q=+h[e+40>>3];if(q<=0.0|q>1.0){p=1;i=j;return p|0}else{h[e+128>>3]=n/q;o=q/n;h[e+136>>3]=o;r=o;break}}}while(0);c[e+1888>>2]=15;c[e+1892>>2]=16;l=r}r=l*d;d=+P(+r);do{if(d>1.0){if(d>1.0000000000001){p=2;i=j;return p|0}else{s=r<0.0?-1.0:1.0;break}}else{s=r}}while(0);h[f>>3]=+h[e+120>>3]*b;h[g>>3]=+Ve(s);p=0;i=j;return p|0}function le(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==203){l=e+112|0;m=l;n=+h[l>>3];o=n*b;h[f>>3]=o;p=+h[m>>3];q=p*d;h[g>>3]=q;i=j;return 0}a[e]=5390659;a[e+1|0]=21057;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=203;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;r=+h[l>>3];if(r==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;s=1.0}else{t=r*3.141592653589793/180.0;h[e+112>>3]=t;h[e+120>>3]=1.0/t;s=t}c[e+1888>>2]=17;c[e+1892>>2]=18;m=e+112|0;n=s;o=n*b;h[f>>3]=o;p=+h[m>>3];q=p*d;h[g>>3]=q;i=j;return 0}function me(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==203){l=e+120|0;m=l;n=+h[l>>3];o=n*b;h[f>>3]=o;p=+h[m>>3];q=p*d;h[g>>3]=q;i=j;return 0}a[e]=5390659;a[e+1|0]=21057;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=203;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;r=+h[l>>3];if(r==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;s=1.0}else{t=r*3.141592653589793/180.0;h[e+112>>3]=t;r=1.0/t;h[e+120>>3]=r;s=r}c[e+1888>>2]=17;c[e+1892>>2]=18;m=e+120|0;n=s;o=n*b;h[f>>3]=o;p=+h[m>>3];q=p*d;h[g>>3]=q;i=j;return 0}function ne(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0;j=i;k=e+4|0;if((c[k>>2]|0)!=204){a[e]=5391693;a[e+1|0]=21061;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=204;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0}else{n=m*3.141592653589793/180.0;h[e+112>>3]=n;h[e+120>>3]=1.0/n}c[e+1888>>2]=19;c[e+1892>>2]=20}if(d<=-90.0|d>=90.0){o=2;i=j;return o|0}h[f>>3]=+h[e+112>>3]*b;b=+h[e+24>>3];h[g>>3]=b*+_(+(+Te((d+90.0)*.5)));o=0;i=j;return o|0}function oe(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0,o=0.0,p=0.0,q=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==204){l=e+24|0;m=+h[e+120>>3]}else{a[e]=5391693;a[e+1|0]=21061;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=204;k=e+8|0;n=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;o=+h[n>>3];if(o==0.0){h[n>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;p=1.0}else{q=o*3.141592653589793/180.0;h[e+112>>3]=q;o=1.0/q;h[e+120>>3]=o;p=o}c[e+1888>>2]=19;c[e+1892>>2]=20;l=n;m=p}h[f>>3]=m*b;h[g>>3]=+We(+Z(+(d/+h[l>>3])))*2.0+-90.0;i=j;return 0}function pe(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==301){l=e+112|0;m=l;n=+h[l>>3];o=n*b;p=+Re(d);q=o*p;h[f>>3]=q;r=+h[m>>3];s=r*d;h[g>>3]=s;i=j;return 0}a[e]=4998739;a[e+1|0]=19526;a[e+2|0]=76;a[e+3|0]=0;c[k>>2]=301;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;t=+h[l>>3];if(t==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;u=1.0}else{v=t*3.141592653589793/180.0;h[e+112>>3]=v;h[e+120>>3]=1.0/v;u=v}c[e+1888>>2]=21;c[e+1892>>2]=22;m=e+112|0;n=u;o=n*b;p=+Re(d);q=o*p;h[f>>3]=q;r=+h[m>>3];s=r*d;h[g>>3]=s;i=j;return 0}function qe(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==301){l=+h[e+24>>3]}else{a[e]=4998739;a[e+1|0]=19526;a[e+2|0]=76;a[e+3|0]=0;c[k>>2]=301;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;o=57.29577951308232}else{p=n*3.141592653589793/180.0;h[e+112>>3]=p;h[e+120>>3]=1.0/p;o=n}c[e+1888>>2]=21;c[e+1892>>2]=22;l=o}o=+S(+(d/l));m=e+120|0;if(o==0.0){q=0.0;h[f>>3]=q;r=+h[m>>3];s=r*d;h[g>>3]=s;i=j;return 0}q=+h[m>>3]*b/o;h[f>>3]=q;r=+h[m>>3];s=r*d;h[g>>3]=s;i=j;return 0}function re(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=302){a[e]=5390672;a[e+1|0]=21057;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=302;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=180.0;h[e+136>>3]=.005555555555555556}else{n=m*3.141592653589793;m=n/180.0;h[e+112>>3]=m;h[e+120>>3]=1.0/m;h[e+128>>3]=n;h[e+136>>3]=1.0/n}c[e+1888>>2]=23;c[e+1892>>2]=24}n=+Se(d/3.0);h[f>>3]=+h[e+112>>3]*b*(1.0-n*n*4.0);h[g>>3]=n*+h[e+128>>3];i=j;return 0}function se(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==302){l=+h[e+136>>3]}else{a[e]=5390672;a[e+1|0]=21057;a[e+2|0]=82;a[e+3|0]=0;c[k>>2]=302;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=180.0;h[e+136>>3]=.005555555555555556;o=.005555555555555556}else{p=n*3.141592653589793;n=p/180.0;h[e+112>>3]=n;h[e+120>>3]=1.0/n;h[e+128>>3]=p;n=1.0/p;h[e+136>>3]=n;o=n}c[e+1888>>2]=23;c[e+1892>>2]=24;l=o}o=l*d;if(o>1.0|o<-1.0){q=2;i=j;return q|0}d=1.0-o*o*4.0;if(d==0.0){if(b==0.0){r=0.0}else{q=2;i=j;return q|0}}else{r=+h[e+120>>3]*b/d}h[f>>3]=r;h[g>>3]=+Ve(o)*3.0;q=0;i=j;return q|0}function te(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=303){a[e]=5001037;a[e+1|0]=19535;a[e+2|0]=76;a[e+3|0]=0;c[k>>2]=303;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;n=57.29577951308232}else{n=m}m=n*1.4142135623730951;h[e+112>>3]=m;h[e+120>>3]=m/90.0;h[e+128>>3]=1.0/m;h[e+136>>3]=90.0/n;h[e+144>>3]=.6366197723675814;c[e+1888>>2]=25;c[e+1892>>2]=26}if(+P(+d)==90.0){h[f>>3]=0.0;n=+P(+(+h[e+112>>3]));if(d<0.0){o=-n}else{o=n}h[g>>3]=o;i=j;return 0}if(d==0.0){h[f>>3]=+h[e+120>>3]*b;h[g>>3]=0.0;i=j;return 0}o=+Se(d)*3.141592653589793;l=0;d=o;n=-3.141592653589793;m=3.141592653589793;while(1){p=d-o+ +T(+d);if(p<0.0){if(p>-1.0e-13){q=d;break}else{r=d;s=m}}else{if(p<1.0e-13){q=d;break}else{r=n;s=d}}p=(r+s)*.5;k=l+1|0;if((k|0)<100){l=k;d=p;n=r;m=s}else{q=p;break}}s=q*.5;h[f>>3]=+h[e+120>>3]*b*+S(+s);h[g>>3]=+h[e+112>>3]*+T(+s);i=j;return 0}function ue(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0,t=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==303){l=+h[e+24>>3]}else{a[e]=5001037;a[e+1|0]=19535;a[e+2|0]=76;a[e+3|0]=0;c[k>>2]=303;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;o=57.29577951308232}else{o=n}n=o*1.4142135623730951;h[e+112>>3]=n;h[e+120>>3]=n/90.0;h[e+128>>3]=1.0/n;h[e+136>>3]=90.0/o;h[e+144>>3]=.6366197723675814;c[e+1888>>2]=25;c[e+1892>>2]=26;l=o}o=d/l;l=2.0-o*o;if(l<=1.0e-12){if(l<-1.0e-12){p=2;i=j;return p|0}if(+P(+b)>1.0e-12){p=2;i=j;return p|0}else{q=0.0;r=0.0}}else{n=+Q(+l);q=n;r=+h[e+136>>3]*b/n}h[f>>3]=r;r=+h[e+128>>3]*d;d=+P(+r);do{if(d>1.0){if(d>1.000000000001){p=2;i=j;return p|0}else{s=(r<0.0?-1.0:1.0)+o*q/3.141592653589793;break}}else{n=+W(+r);s=n*+h[e+144>>3]+o*q/3.141592653589793}}while(0);q=+P(+s);do{if(q>1.0){if(q>1.000000000001){p=2;i=j;return p|0}else{t=s<0.0?-1.0:1.0;break}}else{t=s}}while(0);h[g>>3]=+Ve(t);p=0;i=j;return p|0}function ve(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==401){l=e+112|0}else{a[e]=5523777;a[e+1|0]=21577;a[e+2|0]=84;a[e+3|0]=0;c[k>>2]=401;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;o=57.29577951308232}else{o=n}n=o*2.0;p=o*n;m=e+112|0;h[m>>3]=p;o=1.0/(p*2.0);h[e+120>>3]=o;h[e+128>>3]=o*.25;h[e+136>>3]=1.0/n;c[e+1888>>2]=27;c[e+1892>>2]=28;l=m}n=+Re(d);o=+h[l>>3];p=b*.5;b=+Q(+(o/(n*+Re(p)+1.0)));h[f>>3]=+Se(p)*n*b*2.0;h[g>>3]=b*+Se(d);i=j;return 0}function we(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0,r=0,s=0.0,t=0.0,u=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==401){l=+h[e+128>>3];m=+h[e+120>>3]}else{a[e]=5523777;a[e+1|0]=21577;a[e+2|0]=84;a[e+3|0]=0;c[k>>2]=401;k=e+8|0;n=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;o=+h[n>>3];if(o==0.0){h[n>>3]=57.29577951308232;p=57.29577951308232}else{p=o}o=p*2.0;q=p*o;h[e+112>>3]=q;p=1.0/(q*2.0);h[e+120>>3]=p;q=p*.25;h[e+128>>3]=q;h[e+136>>3]=1.0/o;c[e+1888>>2]=27;c[e+1892>>2]=28;l=q;m=p}p=1.0-b*b*l-d*d*m;if(p<0.0){if(p<-1.0e-13){r=2;i=j;return r|0}else{s=0.0}}else{s=p}p=+Q(+s);s=p*d/+h[e+24>>3];d=+P(+s);do{if(d>1.0){if(d>1.0000000000001){r=2;i=j;return r|0}else{t=s<0.0?-1.0:1.0;break}}else{t=s}}while(0);s=p*p*2.0+-1.0;d=p*b*+h[e+136>>3];if(s==0.0&d==0.0){u=0.0}else{u=+Xe(d,s)*2.0}h[f>>3]=u;h[g>>3]=+Ve(t);r=0;i=j;return r|0}function xe(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0.0,n=0.0,o=0,p=0.0,q=0.0;g=i;j=d+4|0;k=c[j>>2]|0;if((((k|0)>-1?k:0-k|0)|0)!=501?(Ld(d)|0)!=0:0){l=1;i=g;return l|0}m=b- +h[d+40>>3];b=+Re(m);if(b==0.0){l=2;i=g;return l|0}k=d+112|0;n=+h[k>>3]*a;o=d+128|0;a=+h[o>>3];p=+h[d+136>>3];q=a-p*+Se(m)/b;h[e>>3]=q*+Se(n);b=+h[o>>3];h[f>>3]=b-q*+Re(n);if((c[j>>2]|0)>0?q*+h[k>>3]<0.0:0){l=2;i=g;return l|0}l=0;i=g;return l|0}function ye(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0;g=i;j=c[d+4>>2]|0;if((((j|0)>-1?j:0-j|0)|0)!=501?(Ld(d)|0)!=0:0){k=1;i=g;return k|0}l=+h[d+128>>3]-b;b=+Q(+(a*a+l*l));j=d+40|0;if(+h[j>>3]<0.0){m=-b}else{m=b}if(m==0.0){n=0.0}else{n=+Xe(a/m,l/m)}h[e>>3]=n*+h[d+120>>3];n=+h[j>>3];h[f>>3]=n+ +We(+h[d+152>>3]-m*+h[d+144>>3]);k=0;i=g;return k|0}function ze(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0;g=i;if((c[d+4>>2]|0)!=502?(Md(d)|0)!=0:0){j=1;i=g;return j|0}k=+h[d+112>>3]*a;if(b==-90.0){l=+h[d+176>>3]}else{a=+h[d+136>>3];m=+h[d+144>>3];n=+h[d+152>>3];l=a*+Q(+(m-n*+Se(b)))}h[e>>3]=l*+Se(k);b=+h[d+128>>3];h[f>>3]=b-l*+Re(k);j=0;i=g;return j|0}function Ae(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0;g=i;if((c[d+4>>2]|0)!=502?(Md(d)|0)!=0:0){j=1;i=g;return j|0}k=+h[d+128>>3]-b;b=+Q(+(a*a+k*k));if(+h[d+40>>3]<0.0){l=-b}else{l=b}if(l==0.0){m=0.0}else{m=+Xe(a/l,k/l)}h[e>>3]=m*+h[d+120>>3];if(+P(+(l- +h[d+176>>3]))<1.0e-12){h[f>>3]=-90.0;j=0;i=g;return j|0}m=(+h[d+160>>3]-l*l)*+h[d+168>>3];if(!(+P(+m)>1.0)){h[f>>3]=+Ve(m);j=0;i=g;return j|0}if(+P(+(m+-1.0))<1.0e-12){h[f>>3]=90.0;j=0;i=g;return j|0}if(!(+P(+(m+1.0))<1.0e-12)){j=2;i=g;return j|0}h[f>>3]=-90.0;j=0;i=g;return j|0}function Be(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0;g=i;if((c[d+4>>2]|0)!=503?(Nd(d)|0)!=0:0){j=1;i=g;return j|0}k=+h[d+112>>3]*a;a=+h[d+136>>3]-b;h[e>>3]=a*+Se(k);b=+h[d+128>>3];h[f>>3]=b-a*+Re(k);j=0;i=g;return j|0}function Ce(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0;g=i;if((c[d+4>>2]|0)!=503?(Nd(d)|0)!=0:0){j=1;i=g;return j|0}k=+h[d+128>>3]-b;b=+Q(+(a*a+k*k));if(+h[d+40>>3]<0.0){l=-b}else{l=b}if(l==0.0){m=0.0}else{m=+Xe(a/l,k/l)}h[e>>3]=m*+h[d+120>>3];h[f>>3]=+h[d+136>>3]-l;j=0;i=g;return j|0}function De(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0.0,m=0.0,n=0.0;g=i;if((c[d+4>>2]|0)!=504?(Od(d)|0)!=0:0){j=1;i=g;return j|0}k=d+112|0;l=+h[k>>3];m=l*a;if(b==-90.0){if(l<0.0){n=0.0}else{j=2;i=g;return j|0}}else{l=+h[d+136>>3];a=+Te((90.0-b)*.5);n=l*+R(+a,+(+h[k>>3]))}h[e>>3]=n*+Se(m);a=+h[d+128>>3];h[f>>3]=a-n*+Re(m);j=0;i=g;return j|0}function Ee(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0;g=i;if((c[d+4>>2]|0)!=504?(Od(d)|0)!=0:0){j=1;i=g;return j|0}k=+h[d+128>>3]-b;b=+Q(+(a*a+k*k));if(+h[d+40>>3]<0.0){l=-b}else{l=b}if(l==0.0){h[e>>3]=+h[d+120>>3]*0.0;if(+h[d+112>>3]<0.0){m=-90.0}else{j=2;i=g;return j|0}}else{b=+Xe(a/l,k/l);n=d+120|0;h[e>>3]=b*+h[n>>3];m=90.0- +We(+R(+(l*+h[d+144>>3]),+(+h[n>>3])))*2.0}h[f>>3]=m;j=0;i=g;return j|0}function Fe(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0.0,t=0.0;j=i;k=e+4|0;l=c[k>>2]|0;if(!(+h[e+40>>3]==0.0)){if((l|0)!=601){Pd(e)|0}m=e+128|0;n=+h[m>>3]- +h[e+120>>3]*d;o=+h[e+24>>3]*b;p=o*+Re(d)/n;h[f>>3]=n*+Se(p);o=+h[m>>3];q=o-n*+Re(p);h[g>>3]=q;i=j;return 0}if((l|0)==301){l=e+112|0;r=l;s=+h[l>>3]}else{a[e]=4998739;a[e+1|0]=19526;a[e+2|0]=76;a[e+3|0]=0;c[k>>2]=301;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;p=+h[l>>3];if(p==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;t=1.0}else{n=p*3.141592653589793/180.0;h[e+112>>3]=n;h[e+120>>3]=1.0/n;t=n}c[e+1888>>2]=21;c[e+1892>>2]=22;r=e+112|0;s=t}h[f>>3]=s*b*+Re(d);q=+h[r>>3]*d;h[g>>3]=q;i=j;return 0}function Ge(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0,o=0.0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0;j=i;k=e+40|0;l=+h[k>>3];m=e+4|0;n=c[m>>2]|0;if(l==0.0){if((n|0)==301){o=+h[e+24>>3]}else{a[e]=4998739;a[e+1|0]=19526;a[e+2|0]=76;a[e+3|0]=0;c[m>>2]=301;m=e+8|0;p=e+24|0;c[m+0>>2]=0;c[m+4>>2]=0;c[m+8>>2]=0;c[m+12>>2]=0;q=+h[p>>3];if(q==0.0){h[p>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;r=57.29577951308232}else{s=q*3.141592653589793/180.0;h[e+112>>3]=s;h[e+120>>3]=1.0/s;r=q}c[e+1888>>2]=21;c[e+1892>>2]=22;o=r}r=+S(+(d/o));p=e+120|0;if(r==0.0){t=0.0}else{t=+h[p>>3]*b/r}h[f>>3]=t;h[g>>3]=+h[p>>3]*d;i=j;return 0}else{if((n|0)==601){u=l}else{Pd(e)|0;u=+h[k>>3]}k=e+128|0;l=+h[k>>3];t=l-d;d=+Q(+(b*b+t*t));if(u<0.0){v=-d}else{v=d}if(v==0.0){w=l;x=0.0}else{l=+Xe(b/v,t/v);w=+h[k>>3];x=l}l=(w-v)/+h[e+120>>3];h[g>>3]=l;w=+Re(l);if(w==0.0){y=0.0}else{y=x*(v/+h[e+24>>3])/w}h[f>>3]=y;i=j;return 0}return 0}function He(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=602){a[e]=5194576;a[e+1|0]=20291;a[e+2|0]=79;a[e+3|0]=0;c[k>>2]=602;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=114.59155902616465}else{n=m*3.141592653589793/180.0;h[e+112>>3]=n;h[e+120>>3]=1.0/n;h[e+128>>3]=m*2.0}c[e+1888>>2]=29;c[e+1892>>2]=30}m=+Re(d);n=+Se(d);o=n*b;if(n==0.0){h[f>>3]=+h[e+112>>3]*b;p=0.0;h[g>>3]=p;i=j;return 0}else{b=m/n;l=e+24|0;n=b*+h[l>>3];h[f>>3]=n*+Se(o);n=+h[l>>3];p=n*(d*3.141592653589793/180.0+b*(1.0- +Re(o)));h[g>>3]=p;i=j;return 0}return 0}function Ie(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0,y=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==602){l=+h[e+120>>3]}else{a[e]=5194576;a[e+1|0]=20291;a[e+2|0]=79;a[e+3|0]=0;c[k>>2]=602;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=114.59155902616465;o=1.0}else{p=n*3.141592653589793/180.0;h[e+112>>3]=p;q=1.0/p;h[e+120>>3]=q;h[e+128>>3]=n*2.0;o=q}c[e+1888>>2]=29;c[e+1892>>2]=30;l=o}o=+P(+(l*d));if(o<1.0e-12){h[f>>3]=l*b;h[g>>3]=0.0;i=j;return 0}if(+P(+(o+-90.0))<1.0e-12){h[f>>3]=0.0;h[g>>3]=d<0.0?-90.0:90.0;i=j;return 0}o=d>0.0?90.0:-90.0;l=b*b;m=e+112|0;q=d-o*+h[m>>3];k=e+128|0;n=-999.0;p=l+q*q;r=0;q=0.0;s=o;while(1){if(n<-100.0){t=(q+s)*.5}else{o=p/(p-n);if(!(o<.1)){if(o>.9){u=.9}else{u=o}}else{u=.1}t=s-(s-q)*u}h[g>>3]=t;v=d-t*+h[m>>3];w=+Te(t);o=l+v*(v- +h[k>>3]/w);if(+P(+o)<1.0e-12){break}if(+P(+(s-q))<1.0e-12){break}x=o>0.0;y=+h[g>>3];r=r+1|0;if((r|0)>=64){break}else{n=x?n:o;p=x?o:p;q=x?q:y;s=x?y:s}}s=+h[e+24>>3]-w*v;v=w*b;if(s==0.0&v==0.0){h[f>>3]=0.0;i=j;return 0}else{b=+Xe(v,s);h[f>>3]=b/+Se(+h[g>>3]);i=j;return 0}return 0}function Je(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0,s=0.0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0.0,B=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=701){a[e]=4412244;a[e+1|0]=17235;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=701;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223}else{n=m*3.141592653589793*.25;h[e+112>>3]=n;h[e+120>>3]=1.0/n}c[e+1888>>2]=31;c[e+1892>>2]=32}n=+Re(d);m=n*+Re(b);o=n*+Se(b);b=+Se(d);l=m>b;d=l?m:b;k=o>d;n=k?o:d;d=-m;p=n<d;q=p?d:n;n=-o;r=q<n;s=r?n:q;q=-b;t=s<q;u=t?q:s;switch((t?5:r?4:p?3:k?2:l&1)|0){case 2:{v=2.0;w=d/u;x=0.0;y=b/u;break};case 1:{v=0.0;w=o/u;x=0.0;y=b/u;break};case 3:{v=4.0;w=n/u;x=0.0;y=b/u;break};case 0:{v=0.0;w=o/u;x=2.0;y=d/u;break};case 4:{v=6.0;w=m/u;x=0.0;y=b/u;break};case 5:{v=0.0;w=o/u;x=-2.0;y=m/u;break};default:{v=0.0;w=0.0;x=0.0;y=0.0}}u=+P(+w);do{if(u>1.0){if(u>1.000000000001){z=2;i=j;return z|0}else{A=w<0.0?-1.0:1.0;break}}else{A=w}}while(0);w=+P(+y);do{if(w>1.0){if(w>1.000000000001){z=2;i=j;return z|0}else{B=y<0.0?-1.0:1.0;break}}else{B=y}}while(0);l=e+112|0;h[f>>3]=(v+A)*+h[l>>3];h[g>>3]=(x+B)*+h[l>>3];z=0;i=j;return z|0}function Ke(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==701){l=+h[e+120>>3]}else{a[e]=4412244;a[e+1|0]=17235;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=701;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223;o=.022222222222222223}else{p=n*3.141592653589793*.25;h[e+112>>3]=p;n=1.0/p;h[e+120>>3]=n;o=n}c[e+1888>>2]=31;c[e+1892>>2]=32;l=o}o=l*b;b=l*d;d=+P(+o);if(!(d<=1.0)){if(d>7.0){q=2;i=j;return q|0}if(+P(+b)>1.0){q=2;i=j;return q|0}}else{if(+P(+b)>3.0){q=2;i=j;return q|0}}if(o<-1.0){r=o+8.0}else{r=o}do{if(!(r>5.0)){if(r>3.0){o=r+-4.0;d=-1.0/+Q(+(b*b+(o*o+1.0)));s=d;t=o*d;u=-(b*d);break}if(r>1.0){d=r+-2.0;o=1.0/+Q(+(b*b+(d*d+1.0)));s=-(d*o);t=o;u=b*o;break}if(b>1.0){o=b+-2.0;d=1.0/+Q(+(o*o+(r*r+1.0)));s=-(o*d);t=r*d;u=d;break}if(b<-1.0){d=b+2.0;o=-1.0/+Q(+(d*d+(r*r+1.0)));l=-o;s=d*l;t=r*l;u=o;break}else{o=1.0/+Q(+(b*b+(r*r+1.0)));s=o;t=r*o;u=b*o;break}}else{o=r+-6.0;l=-1.0/+Q(+(b*b+(o*o+1.0)));d=-l;s=o*d;t=l;u=b*d}}while(0);if(s==0.0&t==0.0){v=0.0}else{v=+Xe(t,s)}h[f>>3]=v;h[g>>3]=+Ve(u);q=0;i=j;return q|0}function Le(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0,s=0.0,t=0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0,E=0.0,F=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=702){a[e]=4412227;a[e+1|0]=17235;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=702;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223}else{n=m*3.141592653589793*.25;h[e+112>>3]=n;h[e+120>>3]=1.0/n}c[e+1888>>2]=33;c[e+1892>>2]=34}n=+Re(d);m=n*+Re(b);o=n*+Se(b);b=+Se(d);l=m>b;d=l?m:b;k=o>d;n=k?o:d;d=-m;p=n<d;q=p?d:n;n=-o;r=q<n;s=r?n:q;q=-b;t=s<q;u=t?q:s;v=t?5:r?4:p?3:k?2:l&1;switch(v|0){case 2:{w=b;x=2.0;y=d;z=0.0;break};case 1:{w=b;x=0.0;y=o;z=0.0;break};case 4:{w=b;x=6.0;y=m;z=0.0;break};case 0:{w=d;x=0.0;y=o;z=2.0;break};case 3:{w=b;x=4.0;y=n;z=0.0;break};default:{l=(v|0)==5;w=l?m:0.0;x=0.0;y=l?o:0.0;z=l?-2.0:0.0}}o=y/u;y=w/u;u=o*o;w=y*y;m=1.0-u;n=1.0-w;b=+P(+(o*y));if(u>1.0e-16){A=u*u}else{A=0.0}if(w>1.0e-16){B=w*w}else{B=0.0}if(b>1.0e-16){C=u*w*.15384112298488617}else{C=0.0}b=o*(u+m*(u*(-.15959623456001282-m*(u*-.021776249632239342+.07591962069272995))+(w*(u*.004869491793215275+m*-.1316167116165161+n*(B*.10695946961641312+(A*-.1782512068748474+(u*.08097013086080551+.14118963479995728+w*-.2815285325050354+C))))+1.374848484992981)));o=y*(w+n*(w*(-.15959623456001282-n*(w*-.021776249632239342+.07591962069272995))+(u*(w*.004869491793215275+n*-.1316167116165161+m*(A*.10695946961641312+(B*-.1782512068748474+(u*-.2815285325050354+(w*.08097013086080551+.14118963479995728)+C))))+1.374848484992981)));C=+P(+b);do{if(C>1.0){if(C>1.0000001000000012){D=2;i=j;return D|0}else{E=b<0.0?-1.0:1.0;break}}else{E=b}}while(0);b=+P(+o);do{if(b>1.0){if(b>1.0000001000000012){D=2;i=j;return D|0}else{F=o<0.0?-1.0:1.0;break}}else{F=o}}while(0);l=e+112|0;h[f>>3]=(x+E)*+h[l>>3];h[g>>3]=+h[l>>3]*(z+F);D=0;i=j;return D|0}function Me(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==702){l=+h[e+120>>3]}else{a[e]=4412227;a[e+1|0]=17235;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=702;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223;o=.022222222222222223}else{p=n*3.141592653589793*.25;h[e+112>>3]=p;n=1.0/p;h[e+120>>3]=n;o=n}c[e+1888>>2]=33;c[e+1892>>2]=34;l=o}o=l*b;b=l*d;d=+P(+o);if(!(d<=1.0)){if(d>7.0){q=2;i=j;return q|0}if(+P(+b)>1.0){q=2;i=j;return q|0}}else{if(+P(+b)>3.0){q=2;i=j;return q|0}}if(o<-1.0){r=o+8.0}else{r=o}do{if(!(r>5.0)){if(r>3.0){s=3;t=r+-4.0;u=b;break}if(r>1.0){s=2;t=r+-2.0;u=b;break}if(b>1.0){s=0;t=r;u=b+-2.0;break}if(b<-1.0){s=5;t=r;u=b+2.0}else{s=1;t=r;u=b}}else{s=4;t=r+-6.0;u=b}}while(0);b=t*t;r=u*u;o=t;t=o+o*(1.0-b)*(b*(b*(b*(b*(b*(b*.025843750685453415+.25795793533325195)+-.6293006539344788)+.5485238432884216)+-.22797055542469025)+-.07629968971014023)+-.2729269564151764+r*(b*(b*(b*(b*(b*-.5302233695983887+1.715475082397461)+-1.7411445379257202)+.48051509261131287)+-.014715650118887424)+-.028194520622491837+r*(b*(b*(b*(b*-.8318046927452087+.9893810153007507)+.30803316831588745)+-.5680093765258789)+.27058160305023193+r*(b*(b*(b*.08693841099739075+-.9367857575416565)+1.5088008642196655)+-.6044155955314636+r*(b*(b*.3388744592666626+-1.4160192012786865)+.934120774269104+r*(r*.14381584525108337+(b*.5203223824501038+-.6391530632972717)))))));o=u;u=o+o*(1.0-r)*(r*(r*(r*(r*(r*(r*.025843750685453415+.25795793533325195)+-.6293006539344788)+.5485238432884216)+-.22797055542469025)+-.07629968971014023)+-.2729269564151764+b*(r*(r*(r*(r*(r*-.5302233695983887+1.715475082397461)+-1.7411445379257202)+.48051509261131287)+-.014715650118887424)+-.028194520622491837+b*(r*(r*(r*(r*-.8318046927452087+.9893810153007507)+.30803316831588745)+-.5680093765258789)+.27058160305023193+b*(r*(r*(r*.08693841099739075+-.9367857575416565)+1.5088008642196655)+-.6044155955314636+b*(r*(r*.3388744592666626+-1.4160192012786865)+.934120774269104+b*(r*.5203223824501038+-.6391530632972717+b*.14381584525108337))))));switch(s|0){case 1:{b=1.0/+Q(+(u*u+t*t+1.0));v=b;w=t*b;x=u*b;break};case 4:{b=-1.0/+Q(+(u*u+t*t+1.0));v=-t*b;w=b;x=-u*b;break};case 0:{b=1.0/+Q(+(u*u+t*t+1.0));v=-u*b;w=t*b;x=b;break};case 5:{b=-1.0/+Q(+(u*u+t*t+1.0));v=-u*b;w=-t*b;x=b;break};case 3:{b=-1.0/+Q(+(u*u+t*t+1.0));v=b;w=t*b;x=-u*b;break};case 2:{b=1.0/+Q(+(u*u+t*t+1.0));v=-t*b;w=b;x=u*b;break};default:{v=0.0;w=0.0;x=0.0}}if(v==0.0&w==0.0){y=0.0}else{y=+Xe(w,v)}h[f>>3]=y;h[g>>3]=+Ve(x);q=0;i=j;return q|0}function Ne(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0,t=0.0,u=0,v=0.0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0;j=i;k=e+4|0;if((c[k>>2]|0)!=703){a[e]=4412241;a[e+1|0]=17235;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=703;k=e+8|0;l=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;m=+h[l>>3];if(m==0.0){h[l>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223}else{n=m*3.141592653589793*.25;h[e+112>>3]=n;h[e+120>>3]=1.0/n}c[e+1888>>2]=35;c[e+1892>>2]=36}if(+P(+d)==90.0){h[f>>3]=0.0;n=+P(+(+h[e+112>>3]*2.0));if(d<0.0){o=-n}else{o=n}h[g>>3]=o;p=0;i=j;return p|0}o=+Re(d);n=o*+Re(b);m=o*+Se(b);o=+Se(d);l=n>o;q=l?n:o;k=m>q;r=k?m:q;q=-n;s=r<q;t=s?q:r;r=-m;u=t<r;v=u?r:t;t=-o;w=v<t;x=1.0-(w?t:v);switch((w?5:u?4:s?3:k?2:l&1)|0){case 1:{if(x<1.0e-8){v=d*3.141592653589793/180.0;t=+qa(+b,360.0);if(t<-180.0){y=t+360.0}else{y=t}if(y>180.0){z=y+-360.0}else{z=y}y=z*.017453292519943295;A=o;B=(v*v+y*y)*.5;C=0.0;D=m;E=0.0}else{A=o;B=x;C=0.0;D=m;E=0.0}break};case 3:{if(x<1.0e-8){y=d*3.141592653589793/180.0;v=+qa(+b,360.0);if(v<0.0){F=v+360.0}else{F=v}v=(180.0-F)*3.141592653589793/180.0;A=o;B=(y*y+v*v)*.5;C=4.0;D=r;E=0.0}else{A=o;B=x;C=4.0;D=r;E=0.0}break};case 0:{if(x<1.0e-8){r=(90.0-d)*3.141592653589793/180.0;A=q;B=r*r*.5;C=0.0;D=m;E=2.0}else{A=q;B=x;C=0.0;D=m;E=2.0}break};case 2:{if(x<1.0e-8){r=d*3.141592653589793/180.0;v=+qa(+b,360.0);if(v<-180.0){G=v+360.0}else{G=v}v=(90.0-G)*3.141592653589793/180.0;A=o;B=(r*r+v*v)*.5;C=2.0;D=q;E=0.0}else{A=o;B=x;C=2.0;D=q;E=0.0}break};case 4:{if(x<1.0e-8){q=d*3.141592653589793/180.0;v=+qa(+b,360.0);if(v>180.0){H=v+-360.0}else{H=v}v=H*((H+90.0)*3.141592653589793/180.0);A=o;B=(q*q+v*v)*.5;C=6.0;D=n;E=0.0}else{A=o;B=x;C=6.0;D=n;E=0.0}break};case 5:{if(x<1.0e-8){o=(d+90.0)*3.141592653589793/180.0;A=n;B=o*o*.5;C=0.0;D=m;E=-2.0}else{A=n;B=x;C=0.0;D=m;E=-2.0}break};default:{A=0.0;B=x;C=0.0;D=0.0;E=0.0}}do{if(!(D==0.0&A==0.0)){x=+P(+A);if(x<=-D){m=A/D;n=m*m+1.0;o=-+Q(+(B/(1.0-1.0/+Q(+(n+1.0)))));d=+We(m);I=o;J=o/15.0*(d- +Ve(m/+Q(+(n+n))));break}if(D>=x){x=A/D;n=x*x+1.0;m=+Q(+(B/(1.0-1.0/+Q(+(n+1.0)))));d=+We(x);I=m;J=m/15.0*(d- +Ve(x/+Q(+(n+n))));break}n=+P(+D);if(n<-A){x=D/A;d=x*x+1.0;m=-+Q(+(B/(1.0-1.0/+Q(+(d+1.0)))));o=+We(x);I=m/15.0*(o- +Ve(x/+Q(+(d+d))));J=m;break}if(A>n){n=D/A;m=n*n+1.0;d=+Q(+(B/(1.0-1.0/+Q(+(m+1.0)))));x=+We(n);I=d/15.0*(x- +Ve(n/+Q(+(m+m))));J=d}else{I=0.0;J=0.0}}else{I=0.0;J=0.0}}while(0);B=+P(+I);do{if(B>1.0){if(B>1.000000000001){p=2;i=j;return p|0}else{K=I<0.0?-1.0:1.0;break}}else{K=I}}while(0);I=+P(+J);do{if(I>1.0){if(I>1.000000000001){p=2;i=j;return p|0}else{L=J<0.0?-1.0:1.0;break}}else{L=J}}while(0);l=e+112|0;h[f>>3]=(C+K)*+h[l>>3];h[g>>3]=(E+L)*+h[l>>3];p=0;i=j;return p|0}function Oe(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0;j=i;k=e+4|0;if((c[k>>2]|0)==703){l=+h[e+120>>3]}else{a[e]=4412241;a[e+1|0]=17235;a[e+2|0]=67;a[e+3|0]=0;c[k>>2]=703;k=e+8|0;m=e+24|0;c[k+0>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;n=+h[m>>3];if(n==0.0){h[m>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223;o=.022222222222222223}else{p=n*3.141592653589793*.25;h[e+112>>3]=p;n=1.0/p;h[e+120>>3]=n;o=n}c[e+1888>>2]=35;c[e+1892>>2]=36;l=o}o=l*b;b=l*d;d=+P(+o);if(!(d<=1.0)){if(d>7.0){q=2;i=j;return q|0}if(+P(+b)>1.0){q=2;i=j;return q|0}}else{if(+P(+b)>3.0){q=2;i=j;return q|0}}if(o<-1.0){r=o+8.0}else{r=o}do{if(!(r>5.0)){if(r>3.0){s=3;t=r+-4.0;u=b;break}if(r>1.0){s=2;t=r+-2.0;u=b;break}if(b>1.0){s=0;t=r;u=b+-2.0;break}if(b<-1.0){s=5;t=r;u=b+2.0}else{s=1;t=r;u=b}}else{s=4;t=r+-6.0;u=b}}while(0);e=+P(+t)>+P(+u);if(e){if(t==0.0){v=0.0;w=1.0;x=0.0;y=1.0;z=30}else{b=u*15.0/t;r=+Se(b);o=r/(+Re(b)+-.7071067811865475);b=o*o+1.0;A=t*t*(1.0-1.0/+Q(+(b+1.0)));B=o;C=b;z=28}}else{if(u==0.0){v=0.0;w=1.0;x=0.0;y=1.0;z=30}else{b=t*15.0/u;o=+Se(b);r=o/(+Re(b)+-.7071067811865475);b=r*r+1.0;A=u*u*(1.0-1.0/+Q(+(b+1.0)));B=r;C=b;z=28}}if((z|0)==28){b=1.0-A;if(b<-1.0){if(b<-1.000000000001){q=2;i=j;return q|0}else{D=B;E=-1.0;F=0.0}}else{v=B;w=b;x=A;y=C;z=30}}if((z|0)==30){D=v;E=w;F=+Q(+(x*(2.0-x)/y))}a:do{switch(s|0){case 2:{if(e){if(t>0.0){G=-F}else{G=F}H=G;I=E;J=-(D*G);break a}else{if(u<0.0){K=-F}else{K=F}H=-(D*K);I=E;J=K;break a}break};case 3:{y=-E;if(e){if(t>0.0){L=-F}else{L=F}H=y;I=L;J=-(D*L);break a}else{if(u<0.0){M=-F}else{M=F}H=y;I=-(D*M);J=M;break a}break};case 1:{if(e){if(t<0.0){N=-F}else{N=F}H=E;I=N;J=D*N;break a}else{if(u<0.0){O=-F}else{O=F}H=E;I=D*O;J=O;break a}break};case 5:{y=-E;if(e){if(t<0.0){R=-F}else{R=F}H=D*R;I=R;J=y;break a}else{if(u<0.0){S=-F}else{S=F}H=S;I=D*S;J=y;break a}break};case 4:{y=-E;if(e){if(t<0.0){T=-F}else{T=F}H=T;I=y;J=D*T;break a}else{if(u<0.0){U=-F}else{U=F}H=D*U;I=y;J=U;break a}break};case 0:{if(e){if(t<0.0){V=-F}else{V=F}H=-(D*V);I=V;J=E;break a}else{if(u>0.0){W=-F}else{W=F}H=W;I=-(D*W);J=E;break a}break};default:{H=0.0;I=0.0;J=0.0}}}while(0);if(H==0.0&I==0.0){X=0.0}else{X=+Xe(I,H)}h[f>>3]=X;h[g>>3]=+Ve(J);q=0;i=j;return q|0}function Pe(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0,g=0.0,j=0.0,k=0.0,l=0.0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;f=i;g=+Re(b);j=+Se(b);k=a- +h[c>>3];a=+Re(k);l=+Se(k);m=c+32|0;n=c+24|0;o=j*+h[m>>3]-a*g*+h[n>>3];if(+P(+o)<1.0e-5){p=+Re(+h[c+8>>3]+b);q=(1.0-a)*g*+h[n>>3]-p}else{q=o}o=g*l;if(q!=0.0|o!=-0.0){r=+Xe(-o,q)}else{r=k+-180.0}l=r+ +h[c+16>>3];h[d>>3]=l;if(!(l>180.0)){if(l<-180.0){h[d>>3]=l+360.0}}else{h[d>>3]=l+-360.0}if(+qa(+k,180.0)==0.0){k=a*+h[c+8>>3]+b;if(k>90.0){s=180.0-k}else{s=k}h[e>>3]=s;if(!(s<-90.0)){i=f;return 0}h[e>>3]=-180.0-s;i=f;return 0}s=j*+h[n>>3]+a*g*+h[m>>3];if(!(+P(+s)>.99)){h[e>>3]=+Ve(s);i=f;return 0}g=+Ue(+Q(+(o*o+q*q)));if(s<0.0){h[e>>3]=-g;i=f;return 0}else{h[e>>3]=g;i=f;return 0}return 0}function Qe(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0,g=0.0,j=0.0,k=0.0,l=0.0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;f=i;g=+Re(b);j=+Se(b);k=a- +h[c+16>>3];a=+Re(k);l=+Se(k);m=c+32|0;n=c+24|0;o=j*+h[m>>3]-a*g*+h[n>>3];if(+P(+o)<1.0e-5){p=+Re(+h[c+8>>3]+b);q=(1.0-a)*g*+h[n>>3]-p}else{q=o}o=g*l;if(q!=0.0|o!=-0.0){r=+Xe(-o,q)}else{r=k+180.0}l=r+ +h[c>>3];h[d>>3]=l;if(!(+h[c>>3]>=0.0)){if(l>0.0){r=l+-360.0;h[d>>3]=r;s=r}else{s=l}}else{if(l<0.0){r=l+360.0;h[d>>3]=r;s=r}else{s=l}}if(!(s>360.0)){if(s<-360.0){h[d>>3]=s+360.0}}else{h[d>>3]=s+-360.0}if(+qa(+k,180.0)==0.0){k=a*+h[c+8>>3]+b;if(k>90.0){t=180.0-k}else{t=k}h[e>>3]=t;if(!(t<-90.0)){i=f;return 0}h[e>>3]=-180.0-t;i=f;return 0}t=j*+h[n>>3]+a*g*+h[m>>3];if(!(+P(+t)>.99)){h[e>>3]=+Ve(t);i=f;return 0}g=+Ue(+Q(+(o*o+q*q)));if(t<0.0){h[e>>3]=-g;i=f;return 0}else{h[e>>3]=g;i=f;return 0}return 0}function Re(a){a=+a;var b=0,c=0.0,d=0.0,e=0.0;b=i;c=+qa(+a,360.0);d=+P(+c);if(!(c==0.0)){if(!(d==90.0)){if(!(d==180.0)){if(d==270.0){e=0.0}else{e=+S(+(a*.017453292519943295))}}else{e=-1.0}}else{e=0.0}}else{e=1.0}i=b;return+e}function Se(a){a=+a;var b=0,c=0.0,d=0.0;b=i;c=+qa(+(a+-90.0),360.0);if(!(c==0.0)){if(!(c==90.0)){if(!(c==180.0)){if(c==270.0){d=0.0}else{d=+T(+(a*.017453292519943295))}}else{d=-1.0}}else{d=0.0}}else{d=1.0}i=b;return+d}function Te(a){a=+a;var b=0,c=0.0,d=0.0;b=i;c=+qa(+a,360.0);if(!(c==0.0)?!(+P(+c)==180.0):0){if(!(c==45.0|c==225.0)){if(c==-135.0|c==-315.0){d=-1.0}else{d=+U(+(a*.017453292519943295))}}else{d=1.0}}else{d=0.0}i=b;return+d}function Ue(a){a=+a;var b=0,c=0.0,d=0;b=i;if(!(a>=1.0)){if(!(a==0.0)){if(a<=-1.0&a+1.0>-1.0e-10){c=180.0}else{d=5}}else{c=90.0}}else{if(a+-1.0<1.0e-10){c=0.0}else{d=5}}if((d|0)==5){c=+V(+a)*57.29577951308232}i=b;return+c}function Ve(a){a=+a;var b=0,c=0.0,d=0;b=i;if(!(a<=-1.0)){if(!(a==0.0)){if(a>=1.0&a+-1.0<1.0e-10){c=90.0}else{d=5}}else{c=0.0}}else{if(a+1.0>-1.0e-10){c=-90.0}else{d=5}}if((d|0)==5){c=+W(+a)*57.29577951308232}i=b;return+c}function We(a){a=+a;var b=0,c=0.0;b=i;if(!(a==-1.0)){if(!(a==0.0)){if(a==1.0){c=45.0}else{c=+X(+a)*57.29577951308232}}else{c=0.0}}else{c=-45.0}i=b;return+c}function Xe(a,b){a=+a;b=+b;var c=0,d=0.0,e=0;c=i;if(a==0.0){if(!(b>=0.0)){if(b<0.0){d=180.0}else{e=7}}else{d=0.0}}else{if(b==0.0){if(!(a>0.0)){if(a<0.0){d=-90.0}else{e=7}}else{d=90.0}}else{e=7}}if((e|0)==7){d=+Y(+a,+b)*57.29577951308232}i=c;return+d}function Ye(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+32|0;e=d;f=d+8|0;if((c[a+5968>>2]|0)!=1){i=d;return}g=a+3324|0;if((c[g>>2]|0)==2){c[g>>2]=3;c[a+5976>>2]=0;c[a+6784>>2]=0;c[a+7592>>2]=0;c[a+8400>>2]=0;i=d;return}g=a+5976|0;if((Ec(b,12288,g)|0)!=0){h=c[g>>2]|0;g=(h|0)<0;if(!g){j=(h<<3)+8|0;k=0;while(1){Eg(a+(k*80|0)+5984|0,0,j|0)|0;if((k|0)==(h|0)){break}else{k=k+1|0}}if(!g){g=h+1|0;k=0;j=g;while(1){if((h-k|0)>=0){l=0;do{c[e>>2]=k;c[e+4>>2]=l;Na(f|0,12360,e|0)|0;Lc(b,f,a+(k*80|0)+(l<<3)+5984|0)|0;l=l+1|0}while((l|0)!=(j|0))}k=k+1|0;if((k|0)==(g|0)){break}else{j=j+ -1|0}}}}}else{_b(12296)}j=a+6784|0;if((Ec(b,12368,j)|0)!=0){g=c[j>>2]|0;j=(g|0)<0;if(!j){k=(g<<3)+8|0;h=0;while(1){Eg(a+(h*80|0)+6792|0,0,k|0)|0;if((h|0)==(g|0)){break}else{h=h+1|0}}if(!j){j=g+1|0;h=0;k=j;while(1){if((g-h|0)>=0){l=0;do{c[e>>2]=h;c[e+4>>2]=l;Na(f|0,12440,e|0)|0;Lc(b,f,a+(h*80|0)+(l<<3)+6792|0)|0;l=l+1|0}while((l|0)!=(k|0))}h=h+1|0;if((h|0)==(j|0)){break}else{k=k+ -1|0}}}}}else{_b(12376)}k=a+7592|0;if((Ec(b,12448,k)|0)!=0){j=c[k>>2]|0;k=(j|0)<0;if(!k){h=(j<<3)+8|0;g=0;while(1){Eg(a+(g*80|0)+7600|0,0,h|0)|0;if((g|0)==(j|0)){break}else{g=g+1|0}}if(!k){k=j+1|0;g=0;h=k;while(1){if((j-g|0)>=0){l=0;do{c[e>>2]=g;c[e+4>>2]=l;Na(f|0,12528,e|0)|0;Lc(b,f,a+(g*80|0)+(l<<3)+7600|0)|0;l=l+1|0}while((l|0)!=(h|0))}g=g+1|0;if((g|0)==(k|0)){break}else{h=h+ -1|0}}}}}else{_b(12464)}h=a+8400|0;if((Ec(b,12544,h)|0)==0){_b(12560);i=d;return}k=c[h>>2]|0;h=(k|0)<0;if(h){i=d;return}g=(k<<3)+8|0;j=0;while(1){Eg(a+(j*80|0)+8408|0,0,g|0)|0;if((j|0)==(k|0)){break}else{j=j+1|0}}if(h){i=d;return}h=k+1|0;j=0;g=h;while(1){if((k-j|0)>=0){l=0;do{c[e>>2]=j;c[e+4>>2]=l;Na(f|0,12624,e|0)|0;Lc(b,f,a+(j*80|0)+(l<<3)+8408|0)|0;l=l+1|0}while((l|0)!=(g|0))}j=j+1|0;if((j|0)==(h|0)){break}else{g=g+ -1|0}}i=d;return}function Ze(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0,m=0,n=0.0,o=0.0,p=0,q=0,r=0.0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0,y=0.0,z=0.0;g=i;i=i+80|0;j=g;if((c[a+5968>>2]|0)!=1){h[e>>3]=b;k=d;h[f>>3]=k;i=g;return}l=c[a+7592>>2]|0;m=c[a+8400>>2]|0;n=b- +h[a+16>>3];o=d- +h[a+24>>3];if((l|0)>=0){p=0;while(1){q=l-p|0;r=+h[a+(q*80|0)+(p<<3)+7600>>3];s=j+(p<<3)|0;h[s>>3]=r;if((p|0)>0){t=p;u=r;do{t=t+ -1|0;u=o*u+ +h[a+(q*80|0)+(t<<3)+7600>>3]}while((t|0)>0);h[s>>3]=u}if((p|0)==(l|0)){break}else{p=p+1|0}}r=+h[j>>3];if((l|0)>0){p=l+1|0;t=l;v=r;while(1){w=n*v+ +h[j+(p-t<<3)>>3];l=t+ -1|0;if((l|0)>0){t=l;v=w}else{x=j;y=w;break}}}else{x=j;y=r}}else{x=j;y=0.0}h[e>>3]=y;if((m|0)>=0){t=0;while(1){p=m-t|0;y=+h[a+(p*80|0)+(t<<3)+8408>>3];l=j+(t<<3)|0;h[l>>3]=y;if((t|0)>0){q=t;r=y;do{q=q+ -1|0;r=o*r+ +h[a+(p*80|0)+(q<<3)+8408>>3]}while((q|0)>0);h[l>>3]=r}if((t|0)==(m|0)){break}else{t=t+1|0}}o=+h[x>>3];if((m|0)>0){t=m+1|0;a=m;u=o;while(1){y=n*u+ +h[j+(t-a<<3)>>3];m=a+ -1|0;if((m|0)>0){a=m;u=y}else{z=y;break}}}else{z=o}}else{z=+h[x>>3]}h[f>>3]=z;h[e>>3]=+h[e>>3]+b;k=+h[f>>3]+d;h[f>>3]=k;i=g;return}function _e(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0,m=0,n=0.0,o=0.0,p=0,q=0,r=0.0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0,y=0.0,z=0.0;g=i;i=i+80|0;j=g;if((c[a+5968>>2]|0)!=1){h[e>>3]=b;k=d;h[f>>3]=k;i=g;return}l=c[a+5976>>2]|0;m=c[a+6784>>2]|0;n=b- +h[a+16>>3];o=d- +h[a+24>>3];if((l|0)>=0){p=0;while(1){q=l-p|0;r=+h[a+(q*80|0)+(p<<3)+5984>>3];s=j+(p<<3)|0;h[s>>3]=r;if((p|0)>0){t=p;u=r;do{t=t+ -1|0;u=o*u+ +h[a+(q*80|0)+(t<<3)+5984>>3]}while((t|0)>0);h[s>>3]=u}if((p|0)==(l|0)){break}else{p=p+1|0}}r=+h[j>>3];if((l|0)>0){p=l+1|0;t=l;v=r;while(1){w=n*v+ +h[j+(p-t<<3)>>3];l=t+ -1|0;if((l|0)>0){t=l;v=w}else{x=j;y=w;break}}}else{x=j;y=r}}else{x=j;y=0.0}h[e>>3]=y;if((m|0)>=0){t=0;while(1){p=m-t|0;y=+h[a+(p*80|0)+(t<<3)+6792>>3];l=j+(t<<3)|0;h[l>>3]=y;if((t|0)>0){q=t;r=y;do{q=q+ -1|0;r=o*r+ +h[a+(p*80|0)+(q<<3)+6792>>3]}while((q|0)>0);h[l>>3]=r}if((t|0)==(m|0)){break}else{t=t+1|0}}o=+h[x>>3];if((m|0)>0){t=m+1|0;a=m;u=o;while(1){y=n*u+ +h[j+(t-a<<3)>>3];m=a+ -1|0;if((m|0)>0){a=m;u=y}else{z=y;break}}}else{z=o}}else{z=+h[x>>3]}h[f>>3]=z;h[e>>3]=+h[e>>3]+b;k=+h[f>>3]+d;h[f>>3]=k;i=g;return}function $e(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;if((Dg(b|0)|0)<9){c[a+5968>>2]=0;i=d;return}e=a+5968|0;if((Ag(b+8|0,12640,4)|0)==0){c[e>>2]=1;i=d;return}else{c[e>>2]=0;i=d;return}}function af(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0.0,k=0.0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;e=i;i=i+16|0;f=e;c[3162]=0;g=(d|0)==0;h=b;while(1){if((a[h]|0)==32){h=h+1|0}else{break}}b=g?f:d;j=+wg(h,b);d=c[b>>2]|0;if(($f(h,46)|0)!=0){c[3162]=46}f=a[d]|0;g=f<<24>>24;switch(f<<24>>24){case 32:case 58:case 100:case 104:case 109:{break};default:{k=j;i=e;return+k}}l=d;if((l-h|0)>=5){k=j;i=e;return+k}m=d+1|0;n=a[m]|0;if(!(((n<<24>>24)+ -48|0)>>>0<10)){if(!(n<<24>>24==32)){k=j;i=e;return+k}if(!(((a[d+2|0]|0)+ -48|0)>>>0<10)){k=j;i=e;return+k}}c[3162]=g;c[b>>2]=m;if((a[h]|0)==45){o=-j;p=-1.0}else{o=j;p=1.0}j=+wg(m,b);do{if(!(f<<24>>24==109)){m=c[b>>2]|0;h=a[m]|0;if(h<<24>>24==32|h<<24>>24==58|h<<24>>24==109?(m-l|0)<4:0){h=m+1|0;g=a[h]|0;if(!(((g<<24>>24)+ -48|0)>>>0<10)){if(!(g<<24>>24==32)){q=o;r=j;s=0.0;break}if(!(((a[m+2|0]|0)+ -48|0)>>>0<10)){q=o;r=j;s=0.0;break}}c[b>>2]=h;q=o;r=j;s=+wg(h,b)}else{q=o;r=j;s=0.0}}else{q=0.0;r=o;s=j}}while(0);k=p*(q+r/60.0+s/3600.0);i=e;return+k}function bf(a,b,d,e,f,j,l,m,n){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;j=j|0;l=+l;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0.0,t=0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0;o=i;i=i+48|0;p=o;q=o+36|0;r=o+32|0;s=l;c[r>>2]=0;if((c[58]|0)!=0){c[p>>2]=b;c[p+4>>2]=d;c[p+8>>2]=e;t=p+12|0;h[k>>3]=s;c[t>>2]=c[k>>2];c[t+4>>2]=c[k+4>>2];c[p+20>>2]=m;c[p+24>>2]=n;Ma(12656,p|0)|0}t=cf(a,e,r,b,d,m,n)|0;n=c[r>>2]|0;Zf(n,t,4,4);l=+g[n>>2];u=+g[n+(t+ -1<<2)>>2];r=t+1|0;if((r|0)<2){v=1}else{v=(r|0)/2|0}r=v+ -1|0;m=n+(r<<2)|0;w=+g[m>>2];if(((t|0)%2|0|0)!=1&(v|0)<(t|0)){x=(w+ +g[n+(v<<2)>>2])*.5}else{x=w}w=+(t|0);d=~~(w*.5);b=(d|0)<5?5:d;d=~~(w*.01+.5);e=(d|0)<1?1:d;d=df(n,t,o+40|0,q,2.5,e,5)|0;if((d|0)<(b|0)){g[f>>2]=l;y=u}else{w=+g[q>>2];if(s>0.0){z=w/s;g[q>>2]=z;A=z}else{A=w}w=x- +(r|0)*A;g[f>>2]=l>w?l:w;w=x+ +(t-v|0)*A;y=u<w?u:w}g[j>>2]=y;if((c[58]|0)==0){hg(n);i=o;return}y=+g[m>>2];h[k>>3]=l;c[p>>2]=c[k>>2];c[p+4>>2]=c[k+4>>2];m=p+8|0;h[k>>3]=u;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];m=p+16|0;h[k>>3]=y;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];m=p+24|0;h[k>>3]=x;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];Ma(12704,p|0)|0;c[p>>2]=b;c[p+4>>2]=e;c[p+8>>2]=d;Ma(12752,p|0)|0;x=+g[f>>2];y=+g[j>>2];h[k>>3]=+g[q>>2];c[p>>2]=c[k>>2];c[p+4>>2]=c[k+4>>2];c[p+8>>2]=v;v=p+12|0;h[k>>3]=x;c[v>>2]=c[k>>2];c[v+4>>2]=c[k+4>>2];v=p+20|0;h[k>>3]=y;c[v>>2]=c[k>>2];c[v+4>>2]=c[k+4>>2];Ma(12800,p|0)|0;hg(n);i=o;return}function cf(d,e,f,j,k,l,m){d=d|0;e=e|0;f=f|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;n=i;i=i+16|0;o=n;p=(j|0)<(m|0)?j:m;q=(p|0)<1?1:p;p=j+ -1|0;r=(p+q|0)/(q|0)|0;s=(r|0)<2?2:r;r=(p+s|0)/(s|0)|0;p=(r|0)<1?1:r;if((c[58]|0)==0){t=1}else{c[o>>2]=q;c[o+4>>2]=s;c[o+8>>2]=p;Ma(12856,o|0)|0;t=(c[58]|0)==0}q=(l|0)/(m|0)|0;m=(q|0)<1?1:q;q=(l+ -1+p|0)/(p|0)|0;l=(q|0)>(k|0)?k:q;q=(m|0)>(l|0)?m:l;l=(k|0)/(q|0)|0;r=(l|0)<2?2:l;u=(k+ -1+r|0)/(r|0)|0;if(!t){c[o>>2]=m;c[o+4>>2]=q;c[o+8>>2]=r;c[o+12>>2]=u;Ma(12912,o|0)|0}o=aa(u,p)|0;u=gg(o<<2)|0;c[f>>2]=u;f=j<<2;q=gg(f)|0;m=(r+1|0)/2|0;if((m|0)>=(k|0)){v=0;hg(q);i=n;return v|0}t=(p|0)>0;w=(j|0)>0;x=j<<1;y=j<<3;if((e|0)==8){z=m;A=0;B=u;while(1){C=aa(z+ -1|0,j)|0;if(w){D=0;do{g[q+(D<<2)>>2]=+(a[d+(D+C)|0]|0);D=D+1|0}while((D|0)!=(j|0))}a:do{if(t){D=0;C=0;while(1){g[B+(D<<2)>>2]=+g[q+(C<<2)>>2];E=D+1|0;if((E|0)==(p|0)){break a}D=E;C=C+s|0}}}while(0);C=A+p|0;if((C|0)>(o|0)){v=C;F=29;break}D=z+r|0;if((D|0)<(k|0)){z=D;A=C;B=B+(p<<2)|0}else{v=C;F=29;break}}if((F|0)==29){hg(q);i=n;return v|0}}B=(aa(m+ -1|0,j)|0)<<2;A=(aa((l|0)>2?l:2,j)|0)<<2;l=j<<2;z=0;C=m;m=0;D=u;while(1){u=d+(B+(aa(A,z)|0))|0;if((e|0)==32){E=d+(aa(f,C+ -1|0)|0)|0;if(w){G=0;do{g[q+(G<<2)>>2]=+(c[E+(G<<2)>>2]|0);G=G+1|0}while((G|0)!=(j|0))}}else if((e|0)==-32){if(w){Kg(q|0,u|0,l|0)|0}}else if((e|0)==-64){G=d+(aa(y,C+ -1|0)|0)|0;if(w){E=0;do{g[q+(E<<2)>>2]=+h[G+(E<<3)>>3];E=E+1|0}while((E|0)!=(j|0))}}else if((e|0)==16?(E=d+(aa(x,C+ -1|0)|0)|0,w):0){G=0;do{g[q+(G<<2)>>2]=+(b[E+(G<<1)>>1]|0);G=G+1|0}while((G|0)!=(j|0))}b:do{if(t){G=0;E=0;while(1){g[D+(G<<2)>>2]=+g[q+(E<<2)>>2];u=G+1|0;if((u|0)==(p|0)){break b}G=u;E=E+s|0}}}while(0);E=m+p|0;if((E|0)>(o|0)){v=E;F=29;break}G=C+r|0;if((G|0)<(k|0)){z=z+1|0;C=G;m=E;D=D+(p<<2)|0}else{v=E;F=29;break}}if((F|0)==29){hg(q);i=n;return v|0}return 0}function df(b,c,d,e,f,h,j){b=b|0;c=c|0;d=d|0;e=e|0;f=+f;h=h|0;j=j|0;var k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0.0,D=0,E=0,F=0,G=0,H=0.0,I=0.0,J=0.0,K=0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,R=0.0,S=0.0,T=0.0,U=0,V=0,W=0.0,X=0,Y=0,Z=0.0,_=0.0,$=0.0,ba=0,ca=0.0,da=0.0,ea=0.0,fa=0.0,ga=0,ha=0.0,ia=0.0,ja=0.0,ka=0.0,la=0.0,ma=0.0,na=0,oa=0.0,pa=0.0,qa=0.0,ra=0,sa=0.0,ta=0.0;k=i;l=f;if((c|0)<1){m=0;i=k;return m|0}if((c|0)==1){g[d>>2]=+g[b+4>>2];g[e>>2]=0.0;m=1;i=k;return m|0}f=2.0/+(c+ -1|0);n=c<<2;o=gg(n)|0;p=gg(n)|0;n=ig(c,1)|0;q=0;while(1){g[p+(q<<2)>>2]=f*+(q|0)+-1.0;r=q+1|0;if((r|0)==(c|0)){s=0.0;t=0.0;u=0.0;v=0;break}else{q=r}}do{w=+g[p+(v<<2)>>2];x=+g[b+(v<<2)>>2];s=s+w*w;t=t+w*x;u=u+x;v=v+1|0}while((v|0)!=(c|0));x=+(c|0);w=u/x;y=t/s;v=~~(x*.5);q=(v|0)<5?5:v;if((j|0)>0){x=l;v=~h;r=~c;l=0.0;z=u;u=t;t=s;s=y;A=c;B=0;C=w;while(1){D=0;while(1){g[o+(D<<2)>>2]=+g[b+(D<<2)>>2]-(C+s*+g[p+(D<<2)>>2]);E=D+1|0;if((E|0)==(c|0)){F=0;G=0;H=0.0;I=0.0;break}else{D=E}}while(1){if((a[n+F|0]|0)==0){J=+g[o+(F<<2)>>2];K=G+1|0;L=H+J;M=I+J*J}else{K=G;L=H;M=I}F=F+1|0;if((F|0)==(c|0)){break}else{G=K;H=L;I=M}}if(!(K>>>0<2)){D=K+ -1|0;J=M/+(D|0)-L*L/+(aa(D,K)|0);if(J<0.0){N=0.0}else{N=+Q(+J)}}else{N=-999.0}J=x*N;O=-J;P=t;R=u;S=z;T=l;D=0;E=v;U=c;while(1){V=~((E|0)>(r|0)?E:r);if((a[n+D|0]|0)!=1){W=+g[o+(D<<2)>>2];if(W<O|W>J?(X=D-h|0,Y=(X|0)<0?0:X,X=D+h|0,(Y|0)<(((X|0)>(c|0)?c:X)|0)):0){W=P;Z=R;_=T;$=S;X=Y;Y=U;while(1){ba=n+X|0;do{if((a[ba]|0)!=1){if((X|0)>(D|0)){a[ba]=2;ca=W;da=Z;ea=$;fa=_;ga=Y;break}else{ha=+g[p+(X<<2)>>2];ia=+g[b+(X<<2)>>2];a[ba]=1;ca=W-ha*ha;da=Z-ha*ia;ea=$-ia;fa=_-ha;ga=Y+ -1|0;break}}else{ca=W;da=Z;ea=$;fa=_;ga=Y}}while(0);ba=X+1|0;if((ba|0)==(V|0)){ja=fa;ka=ca;la=da;ma=ea;na=ga;break}else{W=ca;Z=da;_=fa;$=ea;X=ba;Y=ga}}}else{ja=T;ka=P;la=R;ma=S;na=U}}else{ja=T;ka=P;la=R;ma=S;na=U+ -1|0}D=D+1|0;if((D|0)==(c|0)){break}else{P=ka;R=la;S=ma;T=ja;E=E+ -1|0;U=na}}if((na|0)>0){T=ja/ka;S=(ma-la*T)/(+(na|0)-ja*T);oa=(la-ja*S)/ka;pa=S}else{oa=s;pa=C}U=B+1|0;if((na|0)>=(q|0)&(na|0)<(A|0)&(U|0)<(j|0)){l=ja;z=ma;u=la;t=ka;s=oa;A=na;B=U;C=pa}else{qa=oa;ra=na;sa=pa;break}}}else{qa=y;ra=c;sa=w}g[d>>2]=sa-qa;sa=f*qa;g[e>>2]=sa;if(!(sa>=0.0)){ta=-sa}else{ta=sa}if(ta<.001){g[e>>2]=f*y}hg(o);hg(p);hg(n);m=ra;i=k;return m|0}function ef(a,b){a=a|0;b=b|0;return(+g[a>>2]<=+g[b>>2]?-1:1)|0}function ff(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;e=i;f=a>>>16;g=a&65535;if((c|0)==1){a=(d[b]|0)+g|0;h=a>>>0>65520?a+ -65521|0:a;a=h+f|0;j=(a>>>0>65520?a+15|0:a)<<16|h;i=e;return j|0}if((b|0)==0){j=1;i=e;return j|0}if(c>>>0<16){if((c|0)==0){k=g;l=f}else{h=b;a=c;m=g;n=f;while(1){o=a+ -1|0;p=(d[h]|0)+m|0;q=p+n|0;if((o|0)==0){k=p;l=q;break}else{h=h+1|0;a=o;m=p;n=q}}}j=((l>>>0)%65521|0)<<16|(k>>>0>65520?k+ -65521|0:k);i=e;return j|0}if(c>>>0>5551){k=b;l=c;n=g;m=f;do{l=l+ -5552|0;a=k;h=n;q=347;p=m;while(1){o=(d[a]|0)+h|0;r=o+(d[a+1|0]|0)|0;s=r+(d[a+2|0]|0)|0;t=s+(d[a+3|0]|0)|0;u=t+(d[a+4|0]|0)|0;v=u+(d[a+5|0]|0)|0;w=v+(d[a+6|0]|0)|0;x=w+(d[a+7|0]|0)|0;y=x+(d[a+8|0]|0)|0;z=y+(d[a+9|0]|0)|0;A=z+(d[a+10|0]|0)|0;B=A+(d[a+11|0]|0)|0;C=B+(d[a+12|0]|0)|0;D=C+(d[a+13|0]|0)|0;E=D+(d[a+14|0]|0)|0;h=E+(d[a+15|0]|0)|0;p=o+p+r+s+t+u+v+w+x+y+z+A+B+C+D+E+h|0;q=q+ -1|0;if((q|0)==0){break}else{a=a+16|0}}k=k+5552|0;n=(h>>>0)%65521|0;m=(p>>>0)%65521|0}while(l>>>0>5551);if((l|0)!=0){if(l>>>0>15){F=l;G=k;H=n;I=m;J=15}else{K=l;L=k;M=n;N=m;J=16}}else{O=n;P=m}}else{F=c;G=b;H=g;I=f;J=15}if((J|0)==15){while(1){J=0;F=F+ -16|0;f=(d[G]|0)+H|0;g=f+(d[G+1|0]|0)|0;b=g+(d[G+2|0]|0)|0;c=b+(d[G+3|0]|0)|0;m=c+(d[G+4|0]|0)|0;n=m+(d[G+5|0]|0)|0;k=n+(d[G+6|0]|0)|0;l=k+(d[G+7|0]|0)|0;a=l+(d[G+8|0]|0)|0;q=a+(d[G+9|0]|0)|0;E=q+(d[G+10|0]|0)|0;D=E+(d[G+11|0]|0)|0;C=D+(d[G+12|0]|0)|0;B=C+(d[G+13|0]|0)|0;A=B+(d[G+14|0]|0)|0;H=A+(d[G+15|0]|0)|0;I=f+I+g+b+c+m+n+k+l+a+q+E+D+C+B+A+H|0;G=G+16|0;if(!(F>>>0>15)){break}else{J=15}}if((F|0)==0){Q=H;R=I;J=17}else{K=F;L=G;M=H;N=I;J=16}}if((J|0)==16){while(1){J=0;I=K+ -1|0;H=(d[L]|0)+M|0;G=H+N|0;if((I|0)==0){Q=H;R=G;J=17;break}else{K=I;L=L+1|0;M=H;N=G;J=16}}}if((J|0)==17){O=(Q>>>0)%65521|0;P=(R>>>0)%65521|0}j=P<<16|O;i=e;return j|0}function gf(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;if((b|0)==0){g=0;i=f;return g|0}h=~a;a:do{if((e|0)!=0){a=b;j=e;k=h;while(1){if((a&3|0)==0){break}l=c[12968+(((d[a]|0)^k&255)<<2)>>2]^k>>>8;m=j+ -1|0;if((m|0)==0){n=l;break a}else{a=a+1|0;j=m;k=l}}if(j>>>0>31){l=j;m=a;o=k;while(1){p=c[m>>2]^o;q=c[15016+((p>>>8&255)<<2)>>2]^c[16040+((p&255)<<2)>>2]^c[13992+((p>>>16&255)<<2)>>2]^c[12968+(p>>>24<<2)>>2]^c[m+4>>2];p=c[15016+((q>>>8&255)<<2)>>2]^c[16040+((q&255)<<2)>>2]^c[13992+((q>>>16&255)<<2)>>2]^c[12968+(q>>>24<<2)>>2]^c[m+8>>2];q=c[15016+((p>>>8&255)<<2)>>2]^c[16040+((p&255)<<2)>>2]^c[13992+((p>>>16&255)<<2)>>2]^c[12968+(p>>>24<<2)>>2]^c[m+12>>2];p=c[15016+((q>>>8&255)<<2)>>2]^c[16040+((q&255)<<2)>>2]^c[13992+((q>>>16&255)<<2)>>2]^c[12968+(q>>>24<<2)>>2]^c[m+16>>2];q=c[15016+((p>>>8&255)<<2)>>2]^c[16040+((p&255)<<2)>>2]^c[13992+((p>>>16&255)<<2)>>2]^c[12968+(p>>>24<<2)>>2]^c[m+20>>2];p=c[15016+((q>>>8&255)<<2)>>2]^c[16040+((q&255)<<2)>>2]^c[13992+((q>>>16&255)<<2)>>2]^c[12968+(q>>>24<<2)>>2]^c[m+24>>2];q=m+32|0;r=c[15016+((p>>>8&255)<<2)>>2]^c[16040+((p&255)<<2)>>2]^c[13992+((p>>>16&255)<<2)>>2]^c[12968+(p>>>24<<2)>>2]^c[m+28>>2];p=c[15016+((r>>>8&255)<<2)>>2]^c[16040+((r&255)<<2)>>2]^c[13992+((r>>>16&255)<<2)>>2]^c[12968+(r>>>24<<2)>>2];r=l+ -32|0;if(r>>>0>31){l=r;m=q;o=p}else{s=r;t=q;u=p;break}}}else{s=j;t=a;u=k}if(s>>>0>3){o=s;m=t;l=u;while(1){p=m+4|0;q=c[m>>2]^l;r=c[15016+((q>>>8&255)<<2)>>2]^c[16040+((q&255)<<2)>>2]^c[13992+((q>>>16&255)<<2)>>2]^c[12968+(q>>>24<<2)>>2];q=o+ -4|0;if(q>>>0>3){o=q;m=p;l=r}else{v=q;w=p;x=r;break}}}else{v=s;w=t;x=u}if((v|0)==0){n=x}else{l=w;m=v;o=x;while(1){k=c[12968+(((d[l]|0)^o&255)<<2)>>2]^o>>>8;a=m+ -1|0;if((a|0)==0){n=k;break}else{l=l+1|0;m=a;o=k}}}}else{n=h}}while(0);g=~n;i=f;return g|0}function hf(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0;l=i;if((j|0)==0){m=-6;i=l;return m|0}if(!((a[j]|0)==49&(k|0)==56)){m=-6;i=l;return m|0}if((b|0)==0){m=-2;i=l;return m|0}k=b+24|0;c[k>>2]=0;j=b+32|0;n=c[j>>2]|0;if((n|0)==0){c[j>>2]=1;c[b+40>>2]=0;o=1}else{o=n}n=b+36|0;if((c[n>>2]|0)==0){c[n>>2]=1}n=(d|0)==-1?6:d;if((f|0)<0){p=0-f|0;q=0}else{d=(f|0)>15;p=d?f+ -16|0:f;q=d?2:1}if(!((g+ -1|0)>>>0<9&(e|0)==8)){m=-2;i=l;return m|0}if((p+ -8|0)>>>0>7|n>>>0>9|h>>>0>4){m=-2;i=l;return m|0}e=(p|0)==8?9:p;p=b+40|0;d=kb[o&1](c[p>>2]|0,1,5828)|0;if((d|0)==0){m=-4;i=l;return m|0}c[b+28>>2]=d;c[d>>2]=b;c[d+24>>2]=q;c[d+28>>2]=0;c[d+48>>2]=e;q=1<<e;e=d+44|0;c[e>>2]=q;c[d+52>>2]=q+ -1;o=g+7|0;c[d+80>>2]=o;f=1<<o;o=d+76|0;c[o>>2]=f;c[d+84>>2]=f+ -1;c[d+88>>2]=((g+9|0)>>>0)/3|0;f=d+56|0;c[f>>2]=kb[c[j>>2]&1](c[p>>2]|0,q,2)|0;q=kb[c[j>>2]&1](c[p>>2]|0,c[e>>2]|0,2)|0;r=d+64|0;c[r>>2]=q;Eg(q|0,0,c[e>>2]<<1|0)|0;e=d+68|0;c[e>>2]=kb[c[j>>2]&1](c[p>>2]|0,c[o>>2]|0,2)|0;c[d+5824>>2]=0;o=1<<g+6;g=d+5788|0;c[g>>2]=o;q=kb[c[j>>2]&1](c[p>>2]|0,o,4)|0;c[d+8>>2]=q;o=c[g>>2]|0;c[d+12>>2]=o<<2;if(((c[f>>2]|0)!=0?(c[r>>2]|0)!=0:0)?!((c[e>>2]|0)==0|(q|0)==0):0){c[d+5796>>2]=q+(o>>>1<<1);c[d+5784>>2]=q+(o*3|0);c[d+132>>2]=n;c[d+136>>2]=h;a[d+36|0]=8;m=kf(b)|0;i=l;return m|0}c[d+4>>2]=666;c[k>>2]=c[27632>>2];jf(b)|0;m=-4;i=l;return m|0}function jf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;if((a|0)==0){d=-2;i=b;return d|0}e=a+28|0;f=c[e>>2]|0;if((f|0)==0){d=-2;i=b;return d|0}g=c[f+4>>2]|0;switch(g|0){case 42:case 69:case 73:case 91:case 103:case 113:case 666:{break};default:{d=-2;i=b;return d|0}}h=c[f+8>>2]|0;if((h|0)==0){j=f}else{mb[c[a+36>>2]&1](c[a+40>>2]|0,h);j=c[e>>2]|0}h=c[j+68>>2]|0;if((h|0)==0){k=j}else{mb[c[a+36>>2]&1](c[a+40>>2]|0,h);k=c[e>>2]|0}h=c[k+64>>2]|0;if((h|0)==0){l=k}else{mb[c[a+36>>2]&1](c[a+40>>2]|0,h);l=c[e>>2]|0}h=c[l+56>>2]|0;k=a+36|0;if((h|0)==0){m=a+40|0;n=l}else{l=a+40|0;mb[c[k>>2]&1](c[l>>2]|0,h);m=l;n=c[e>>2]|0}mb[c[k>>2]&1](c[m>>2]|0,n);c[e>>2]=0;d=(g|0)==113?-3:0;i=b;return d|0}function kf(a){a=a|0;var d=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;if((a|0)==0){f=-2;i=d;return f|0}g=c[a+28>>2]|0;if((g|0)==0){f=-2;i=d;return f|0}if((c[a+32>>2]|0)==0){f=-2;i=d;return f|0}if((c[a+36>>2]|0)==0){f=-2;i=d;return f|0}c[a+20>>2]=0;c[a+8>>2]=0;c[a+24>>2]=0;c[a+44>>2]=2;c[g+20>>2]=0;c[g+16>>2]=c[g+8>>2];h=g+24|0;j=c[h>>2]|0;if((j|0)<0){k=0-j|0;c[h>>2]=k;l=k}else{l=j}c[g+4>>2]=(l|0)!=0?42:113;if((l|0)==2){m=gf(0,0,0)|0}else{m=ff(0,0,0)|0}c[a+48>>2]=m;c[g+40>>2]=0;Of(g);c[g+60>>2]=c[g+44>>2]<<1;m=c[g+76>>2]|0;a=c[g+68>>2]|0;b[a+(m+ -1<<1)>>1]=0;Eg(a|0,0,(m<<1)+ -2|0)|0;m=c[g+132>>2]|0;c[g+128>>2]=e[21162+(m*12|0)>>1]|0;c[g+140>>2]=e[21160+(m*12|0)>>1]|0;c[g+144>>2]=e[21164+(m*12|0)>>1]|0;c[g+124>>2]=e[21166+(m*12|0)>>1]|0;c[g+108>>2]=0;c[g+92>>2]=0;c[g+116>>2]=0;c[g+120>>2]=2;c[g+96>>2]=2;c[g+112>>2]=0;c[g+104>>2]=0;c[g+72>>2]=0;f=0;i=d;return f|0}



function lf(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0;g=i;if((e|0)==0){h=-2;i=g;return h|0}j=e+28|0;k=c[j>>2]|0;if((k|0)==0|f>>>0>5){h=-2;i=g;return h|0}l=e+12|0;do{if((c[l>>2]|0)!=0){if((c[e>>2]|0)==0?(c[e+4>>2]|0)!=0:0){break}m=k+4|0;n=c[m>>2]|0;o=(f|0)==4;if((n|0)!=666|o){p=e+16|0;if((c[p>>2]|0)==0){c[e+24>>2]=c[27636>>2];h=-5;i=g;return h|0}c[k>>2]=e;q=k+40|0;r=c[q>>2]|0;c[q>>2]=f;do{if((n|0)==42){if((c[k+24>>2]|0)!=2){s=(c[k+48>>2]<<12)+ -30720|0;if((c[k+136>>2]|0)<=1?(t=c[k+132>>2]|0,(t|0)>=2):0){if((t|0)<6){u=64}else{u=(t|0)==6?128:192}}else{u=0}t=u|s;s=k+108|0;v=(c[s>>2]|0)==0?t:t|32;c[m>>2]=113;t=k+20|0;w=c[t>>2]|0;c[t>>2]=w+1;x=k+8|0;a[(c[x>>2]|0)+w|0]=v>>>8;w=c[t>>2]|0;c[t>>2]=w+1;a[(c[x>>2]|0)+w|0]=(v|((v>>>0)%31|0))^31;v=e+48|0;if((c[s>>2]|0)!=0){s=c[v>>2]|0;w=c[t>>2]|0;c[t>>2]=w+1;a[(c[x>>2]|0)+w|0]=s>>>24;w=c[t>>2]|0;c[t>>2]=w+1;a[(c[x>>2]|0)+w|0]=s>>>16;s=c[v>>2]|0;w=c[t>>2]|0;c[t>>2]=w+1;a[(c[x>>2]|0)+w|0]=s>>>8;w=c[t>>2]|0;c[t>>2]=w+1;a[(c[x>>2]|0)+w|0]=s}c[v>>2]=ff(0,0,0)|0;y=c[m>>2]|0;z=32;break}v=e+48|0;c[v>>2]=gf(0,0,0)|0;s=k+20|0;w=c[s>>2]|0;c[s>>2]=w+1;x=k+8|0;a[(c[x>>2]|0)+w|0]=31;w=c[s>>2]|0;c[s>>2]=w+1;a[(c[x>>2]|0)+w|0]=-117;w=c[s>>2]|0;c[s>>2]=w+1;a[(c[x>>2]|0)+w|0]=8;w=k+28|0;t=c[w>>2]|0;if((t|0)==0){A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=0;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=0;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=0;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=0;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=0;A=c[k+132>>2]|0;if((A|0)!=9){if((c[k+136>>2]|0)>1){B=4}else{B=(A|0)<2?4:0}}else{B=2}A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=B;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=3;c[m>>2]=113;break}A=(((c[t+44>>2]|0)!=0?2:0)|(c[t>>2]|0)!=0|((c[t+16>>2]|0)==0?0:4)|((c[t+28>>2]|0)==0?0:8)|((c[t+36>>2]|0)==0?0:16))&255;t=c[s>>2]|0;c[s>>2]=t+1;a[(c[x>>2]|0)+t|0]=A;A=c[(c[w>>2]|0)+4>>2]&255;t=c[s>>2]|0;c[s>>2]=t+1;a[(c[x>>2]|0)+t|0]=A;A=(c[(c[w>>2]|0)+4>>2]|0)>>>8&255;t=c[s>>2]|0;c[s>>2]=t+1;a[(c[x>>2]|0)+t|0]=A;A=(c[(c[w>>2]|0)+4>>2]|0)>>>16&255;t=c[s>>2]|0;c[s>>2]=t+1;a[(c[x>>2]|0)+t|0]=A;A=(c[(c[w>>2]|0)+4>>2]|0)>>>24&255;t=c[s>>2]|0;c[s>>2]=t+1;a[(c[x>>2]|0)+t|0]=A;A=c[k+132>>2]|0;if((A|0)!=9){if((c[k+136>>2]|0)>1){C=4}else{C=(A|0)<2?4:0}}else{C=2}A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=C;A=c[(c[w>>2]|0)+12>>2]&255;t=c[s>>2]|0;c[s>>2]=t+1;a[(c[x>>2]|0)+t|0]=A;A=c[w>>2]|0;if((c[A+16>>2]|0)==0){D=A}else{t=c[A+20>>2]&255;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=t;t=(c[(c[w>>2]|0)+20>>2]|0)>>>8&255;A=c[s>>2]|0;c[s>>2]=A+1;a[(c[x>>2]|0)+A|0]=t;D=c[w>>2]|0}if((c[D+44>>2]|0)!=0){c[v>>2]=gf(c[v>>2]|0,c[x>>2]|0,c[s>>2]|0)|0}c[k+32>>2]=0;c[m>>2]=69;E=w;z=34}else{y=n;z=32}}while(0);if((z|0)==32){if((y|0)==69){E=k+28|0;z=34}else{F=y;z=55}}do{if((z|0)==34){n=c[E>>2]|0;if((c[n+16>>2]|0)==0){c[m>>2]=73;G=n;z=57;break}w=k+20|0;s=c[w>>2]|0;x=k+32|0;v=c[x>>2]|0;a:do{if(v>>>0<(c[n+20>>2]&65535)>>>0){t=k+12|0;A=e+48|0;H=k+8|0;I=e+20|0;J=v;K=s;L=n;M=s;while(1){if((K|0)==(c[t>>2]|0)){if((c[L+44>>2]|0)!=0&K>>>0>M>>>0){c[A>>2]=gf(c[A>>2]|0,(c[H>>2]|0)+M|0,K-M|0)|0}N=c[j>>2]|0;O=c[N+20>>2]|0;P=c[p>>2]|0;Q=O>>>0>P>>>0?P:O;if((Q|0)!=0?(Kg(c[l>>2]|0,c[N+16>>2]|0,Q|0)|0,c[l>>2]=(c[l>>2]|0)+Q,N=(c[j>>2]|0)+16|0,c[N>>2]=(c[N>>2]|0)+Q,c[I>>2]=(c[I>>2]|0)+Q,c[p>>2]=(c[p>>2]|0)-Q,N=c[j>>2]|0,O=N+20|0,P=c[O>>2]|0,c[O>>2]=P-Q,(P|0)==(Q|0)):0){c[N+16>>2]=c[N+8>>2]}R=c[w>>2]|0;if((R|0)==(c[t>>2]|0)){break}S=c[E>>2]|0;T=c[x>>2]|0;U=R;V=R}else{S=L;T=J;U=K;V=M}N=a[(c[S+16>>2]|0)+T|0]|0;c[w>>2]=U+1;a[(c[H>>2]|0)+U|0]=N;N=(c[x>>2]|0)+1|0;c[x>>2]=N;Q=c[E>>2]|0;if(!(N>>>0<(c[Q+20>>2]&65535)>>>0)){W=Q;X=V;break a}J=N;K=c[w>>2]|0;L=Q;M=V}W=c[E>>2]|0;X=R}else{W=n;X=s}}while(0);if((c[W+44>>2]|0)!=0?(s=c[w>>2]|0,s>>>0>X>>>0):0){n=e+48|0;c[n>>2]=gf(c[n>>2]|0,(c[k+8>>2]|0)+X|0,s-X|0)|0;Y=c[E>>2]|0}else{Y=W}if((c[x>>2]|0)==(c[Y+20>>2]|0)){c[x>>2]=0;c[m>>2]=73;G=Y;z=57;break}else{F=c[m>>2]|0;z=55;break}}}while(0);if((z|0)==55){if((F|0)==73){G=c[k+28>>2]|0;z=57}else{Z=F;z=76}}do{if((z|0)==57){s=k+28|0;if((c[G+28>>2]|0)==0){c[m>>2]=91;_=s;z=78;break}n=k+20|0;v=c[n>>2]|0;M=k+12|0;L=e+48|0;K=k+8|0;J=e+20|0;H=k+32|0;t=v;I=v;while(1){if((t|0)==(c[M>>2]|0)){if((c[(c[s>>2]|0)+44>>2]|0)!=0&t>>>0>I>>>0){c[L>>2]=gf(c[L>>2]|0,(c[K>>2]|0)+I|0,t-I|0)|0}v=c[j>>2]|0;A=c[v+20>>2]|0;Q=c[p>>2]|0;N=A>>>0>Q>>>0?Q:A;if((N|0)!=0?(Kg(c[l>>2]|0,c[v+16>>2]|0,N|0)|0,c[l>>2]=(c[l>>2]|0)+N,v=(c[j>>2]|0)+16|0,c[v>>2]=(c[v>>2]|0)+N,c[J>>2]=(c[J>>2]|0)+N,c[p>>2]=(c[p>>2]|0)-N,v=c[j>>2]|0,A=v+20|0,Q=c[A>>2]|0,c[A>>2]=Q-N,(Q|0)==(N|0)):0){c[v+16>>2]=c[v+8>>2]}v=c[n>>2]|0;if((v|0)==(c[M>>2]|0)){$=v;aa=1;break}else{ba=v;ca=v}}else{ba=t;ca=I}v=c[H>>2]|0;c[H>>2]=v+1;da=a[(c[(c[s>>2]|0)+28>>2]|0)+v|0]|0;c[n>>2]=ba+1;a[(c[K>>2]|0)+ba|0]=da;if(da<<24>>24==0){z=68;break}t=c[n>>2]|0;I=ca}if((z|0)==68){$=ca;aa=da&255}if((c[(c[s>>2]|0)+44>>2]|0)!=0?(I=c[n>>2]|0,I>>>0>$>>>0):0){c[L>>2]=gf(c[L>>2]|0,(c[K>>2]|0)+$|0,I-$|0)|0}if((aa|0)==0){c[H>>2]=0;c[m>>2]=91;_=s;z=78;break}else{Z=c[m>>2]|0;z=76;break}}}while(0);if((z|0)==76){if((Z|0)==91){_=k+28|0;z=78}else{ea=Z;z=97}}do{if((z|0)==78){if((c[(c[_>>2]|0)+36>>2]|0)==0){c[m>>2]=103;fa=_;z=99;break}I=k+20|0;t=c[I>>2]|0;M=k+12|0;J=e+48|0;x=k+8|0;w=e+20|0;v=k+32|0;N=t;Q=t;while(1){if((N|0)==(c[M>>2]|0)){if((c[(c[_>>2]|0)+44>>2]|0)!=0&N>>>0>Q>>>0){c[J>>2]=gf(c[J>>2]|0,(c[x>>2]|0)+Q|0,N-Q|0)|0}t=c[j>>2]|0;A=c[t+20>>2]|0;P=c[p>>2]|0;O=A>>>0>P>>>0?P:A;if((O|0)!=0?(Kg(c[l>>2]|0,c[t+16>>2]|0,O|0)|0,c[l>>2]=(c[l>>2]|0)+O,t=(c[j>>2]|0)+16|0,c[t>>2]=(c[t>>2]|0)+O,c[w>>2]=(c[w>>2]|0)+O,c[p>>2]=(c[p>>2]|0)-O,t=c[j>>2]|0,A=t+20|0,P=c[A>>2]|0,c[A>>2]=P-O,(P|0)==(O|0)):0){c[t+16>>2]=c[t+8>>2]}t=c[I>>2]|0;if((t|0)==(c[M>>2]|0)){ga=t;ha=1;break}else{ia=t;ja=t}}else{ia=N;ja=Q}t=c[v>>2]|0;c[v>>2]=t+1;ka=a[(c[(c[_>>2]|0)+36>>2]|0)+t|0]|0;c[I>>2]=ia+1;a[(c[x>>2]|0)+ia|0]=ka;if(ka<<24>>24==0){z=89;break}N=c[I>>2]|0;Q=ja}if((z|0)==89){ga=ja;ha=ka&255}if((c[(c[_>>2]|0)+44>>2]|0)!=0?(Q=c[I>>2]|0,Q>>>0>ga>>>0):0){c[J>>2]=gf(c[J>>2]|0,(c[x>>2]|0)+ga|0,Q-ga|0)|0}if((ha|0)==0){c[m>>2]=103;fa=_;z=99;break}else{ea=c[m>>2]|0;z=97;break}}}while(0);if((z|0)==97?(ea|0)==103:0){fa=k+28|0;z=99}do{if((z|0)==99){if((c[(c[fa>>2]|0)+44>>2]|0)==0){c[m>>2]=113;break}Q=k+20|0;N=k+12|0;if((((c[Q>>2]|0)+2|0)>>>0>(c[N>>2]|0)>>>0?(v=c[j>>2]|0,M=c[v+20>>2]|0,w=c[p>>2]|0,s=M>>>0>w>>>0?w:M,(s|0)!=0):0)?(Kg(c[l>>2]|0,c[v+16>>2]|0,s|0)|0,c[l>>2]=(c[l>>2]|0)+s,v=(c[j>>2]|0)+16|0,c[v>>2]=(c[v>>2]|0)+s,v=e+20|0,c[v>>2]=(c[v>>2]|0)+s,c[p>>2]=(c[p>>2]|0)-s,v=c[j>>2]|0,M=v+20|0,w=c[M>>2]|0,c[M>>2]=w-s,(w|0)==(s|0)):0){c[v+16>>2]=c[v+8>>2]}v=c[Q>>2]|0;if(!((v+2|0)>>>0>(c[N>>2]|0)>>>0)){N=e+48|0;s=c[N>>2]&255;c[Q>>2]=v+1;w=k+8|0;a[(c[w>>2]|0)+v|0]=s;s=(c[N>>2]|0)>>>8&255;v=c[Q>>2]|0;c[Q>>2]=v+1;a[(c[w>>2]|0)+v|0]=s;c[N>>2]=gf(0,0,0)|0;c[m>>2]=113}}}while(0);N=k+20|0;if((c[N>>2]|0)==0){if((c[e+4>>2]|0)==0?(r|0)>=(f|0)&(f|0)!=4:0){c[e+24>>2]=c[27636>>2];h=-5;i=g;return h|0}}else{s=c[j>>2]|0;v=c[s+20>>2]|0;w=c[p>>2]|0;Q=v>>>0>w>>>0?w:v;if((Q|0)==0){la=w}else{Kg(c[l>>2]|0,c[s+16>>2]|0,Q|0)|0;c[l>>2]=(c[l>>2]|0)+Q;s=(c[j>>2]|0)+16|0;c[s>>2]=(c[s>>2]|0)+Q;s=e+20|0;c[s>>2]=(c[s>>2]|0)+Q;c[p>>2]=(c[p>>2]|0)-Q;s=c[j>>2]|0;w=s+20|0;v=c[w>>2]|0;c[w>>2]=v-Q;if((v|0)==(Q|0)){c[s+16>>2]=c[s+8>>2]}la=c[p>>2]|0}if((la|0)==0){c[q>>2]=-1;h=0;i=g;return h|0}}s=(c[m>>2]|0)==666;Q=(c[e+4>>2]|0)==0;if(s){if(Q){z=121}else{c[e+24>>2]=c[27636>>2];h=-5;i=g;return h|0}}else{if(Q){z=121}else{z=124}}do{if((z|0)==121){if((c[k+116>>2]|0)==0){if((f|0)!=0){if(s){break}else{z=124;break}}else{h=0;i=g;return h|0}}else{z=124}}}while(0);do{if((z|0)==124){s=c[k+136>>2]|0;b:do{if((s|0)==3){r=k+116|0;Q=(f|0)==0;v=k+96|0;w=k+108|0;M=k+5792|0;H=k+5796|0;K=k+5784|0;L=k+(d[24760]<<2)+2440|0;n=k+5788|0;t=k+56|0;O=k+92|0;while(1){P=c[r>>2]|0;if(P>>>0<258){mf(k);A=c[r>>2]|0;if(A>>>0<258&Q){break b}if((A|0)==0){break}c[v>>2]=0;if(A>>>0>2){ma=A;z=151}else{na=c[w>>2]|0;z=166}}else{c[v>>2]=0;ma=P;z=151}if((z|0)==151){z=0;P=c[w>>2]|0;if((P|0)!=0){A=c[t>>2]|0;oa=a[A+(P+ -1)|0]|0;if((oa<<24>>24==(a[A+P|0]|0)?oa<<24>>24==(a[A+(P+1)|0]|0):0)?(pa=A+(P+2)|0,oa<<24>>24==(a[pa]|0)):0){qa=A+(P+258)|0;A=pa;while(1){pa=A+1|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+2|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+3|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+4|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+5|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+6|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+7|0;if(!(oa<<24>>24==(a[pa]|0))){ra=pa;break}pa=A+8|0;if(oa<<24>>24==(a[pa]|0)&pa>>>0<qa>>>0){A=pa}else{ra=pa;break}}A=ra-qa+258|0;oa=A>>>0>ma>>>0?ma:A;c[v>>2]=oa;if(oa>>>0>2){A=oa+253|0;oa=c[M>>2]|0;b[(c[H>>2]|0)+(oa<<1)>>1]=1;c[M>>2]=oa+1;a[(c[K>>2]|0)+oa|0]=A;oa=k+((d[25272+(A&255)|0]|256)+1<<2)+148|0;b[oa>>1]=(b[oa>>1]|0)+1<<16>>16;b[L>>1]=(b[L>>1]|0)+1<<16>>16;oa=(c[M>>2]|0)==((c[n>>2]|0)+ -1|0)|0;A=c[v>>2]|0;c[r>>2]=(c[r>>2]|0)-A;pa=(c[w>>2]|0)+A|0;c[w>>2]=pa;c[v>>2]=0;sa=pa;ta=oa}else{na=P;z=166}}else{na=P;z=166}}else{na=0;z=166}}if((z|0)==166){z=0;oa=a[(c[t>>2]|0)+na|0]|0;pa=c[M>>2]|0;b[(c[H>>2]|0)+(pa<<1)>>1]=0;c[M>>2]=pa+1;a[(c[K>>2]|0)+pa|0]=oa;pa=k+((oa&255)<<2)+148|0;b[pa>>1]=(b[pa>>1]|0)+1<<16>>16;pa=(c[M>>2]|0)==((c[n>>2]|0)+ -1|0)|0;c[r>>2]=(c[r>>2]|0)+ -1;oa=(c[w>>2]|0)+1|0;c[w>>2]=oa;sa=oa;ta=pa}if((ta|0)==0){continue}pa=c[O>>2]|0;if((pa|0)>-1){ua=(c[t>>2]|0)+pa|0}else{ua=0}Sf(k,ua,sa-pa|0,0);c[O>>2]=c[w>>2];pa=c[k>>2]|0;oa=pa+28|0;A=c[oa>>2]|0;va=c[A+20>>2]|0;wa=pa+16|0;xa=c[wa>>2]|0;ya=va>>>0>xa>>>0?xa:va;if((ya|0)!=0?(va=pa+12|0,Kg(c[va>>2]|0,c[A+16>>2]|0,ya|0)|0,c[va>>2]=(c[va>>2]|0)+ya,va=(c[oa>>2]|0)+16|0,c[va>>2]=(c[va>>2]|0)+ya,va=pa+20|0,c[va>>2]=(c[va>>2]|0)+ya,c[wa>>2]=(c[wa>>2]|0)-ya,wa=c[oa>>2]|0,oa=wa+20|0,va=c[oa>>2]|0,c[oa>>2]=va-ya,(va|0)==(ya|0)):0){c[wa+16>>2]=c[wa+8>>2]}if((c[(c[k>>2]|0)+16>>2]|0)==0){break b}}r=c[O>>2]|0;if((r|0)>-1){za=(c[t>>2]|0)+r|0}else{za=0}Sf(k,za,(c[w>>2]|0)-r|0,o&1);c[O>>2]=c[w>>2];r=c[k>>2]|0;n=r+28|0;M=c[n>>2]|0;K=c[M+20>>2]|0;H=r+16|0;v=c[H>>2]|0;L=K>>>0>v>>>0?v:K;if((L|0)!=0?(K=r+12|0,Kg(c[K>>2]|0,c[M+16>>2]|0,L|0)|0,c[K>>2]=(c[K>>2]|0)+L,K=(c[n>>2]|0)+16|0,c[K>>2]=(c[K>>2]|0)+L,K=r+20|0,c[K>>2]=(c[K>>2]|0)+L,c[H>>2]=(c[H>>2]|0)-L,H=c[n>>2]|0,n=H+20|0,K=c[n>>2]|0,c[n>>2]=K-L,(K|0)==(L|0)):0){c[H+16>>2]=c[H+8>>2]}if((c[(c[k>>2]|0)+16>>2]|0)==0){Aa=o?2:0;z=183;break}else{Aa=o?3:1;z=183;break}}else if((s|0)==2){H=k+116|0;L=k+96|0;K=k+108|0;n=k+56|0;r=k+5792|0;M=k+5796|0;v=k+5784|0;Q=k+5788|0;wa=k+92|0;while(1){if((c[H>>2]|0)==0?(mf(k),(c[H>>2]|0)==0):0){break}c[L>>2]=0;ya=a[(c[n>>2]|0)+(c[K>>2]|0)|0]|0;va=c[r>>2]|0;b[(c[M>>2]|0)+(va<<1)>>1]=0;c[r>>2]=va+1;a[(c[v>>2]|0)+va|0]=ya;va=k+((ya&255)<<2)+148|0;b[va>>1]=(b[va>>1]|0)+1<<16>>16;va=(c[r>>2]|0)==((c[Q>>2]|0)+ -1|0);c[H>>2]=(c[H>>2]|0)+ -1;ya=(c[K>>2]|0)+1|0;c[K>>2]=ya;if(!va){continue}va=c[wa>>2]|0;if((va|0)>-1){Ba=(c[n>>2]|0)+va|0}else{Ba=0}Sf(k,Ba,ya-va|0,0);c[wa>>2]=c[K>>2];va=c[k>>2]|0;ya=va+28|0;oa=c[ya>>2]|0;pa=c[oa+20>>2]|0;A=va+16|0;xa=c[A>>2]|0;Ca=pa>>>0>xa>>>0?xa:pa;if((Ca|0)!=0?(pa=va+12|0,Kg(c[pa>>2]|0,c[oa+16>>2]|0,Ca|0)|0,c[pa>>2]=(c[pa>>2]|0)+Ca,pa=(c[ya>>2]|0)+16|0,c[pa>>2]=(c[pa>>2]|0)+Ca,pa=va+20|0,c[pa>>2]=(c[pa>>2]|0)+Ca,c[A>>2]=(c[A>>2]|0)-Ca,A=c[ya>>2]|0,ya=A+20|0,pa=c[ya>>2]|0,c[ya>>2]=pa-Ca,(pa|0)==(Ca|0)):0){c[A+16>>2]=c[A+8>>2]}if((c[(c[k>>2]|0)+16>>2]|0)==0){break b}}if((f|0)!=0){H=c[wa>>2]|0;if((H|0)>-1){Da=(c[n>>2]|0)+H|0}else{Da=0}Sf(k,Da,(c[K>>2]|0)-H|0,o&1);c[wa>>2]=c[K>>2];H=c[k>>2]|0;Q=H+28|0;r=c[Q>>2]|0;v=c[r+20>>2]|0;M=H+16|0;L=c[M>>2]|0;w=v>>>0>L>>>0?L:v;if((w|0)!=0?(v=H+12|0,Kg(c[v>>2]|0,c[r+16>>2]|0,w|0)|0,c[v>>2]=(c[v>>2]|0)+w,v=(c[Q>>2]|0)+16|0,c[v>>2]=(c[v>>2]|0)+w,v=H+20|0,c[v>>2]=(c[v>>2]|0)+w,c[M>>2]=(c[M>>2]|0)-w,M=c[Q>>2]|0,Q=M+20|0,v=c[Q>>2]|0,c[Q>>2]=v-w,(v|0)==(w|0)):0){c[M+16>>2]=c[M+8>>2]}if((c[(c[k>>2]|0)+16>>2]|0)==0){Aa=o?2:0;z=183;break}else{Aa=o?3:1;z=183;break}}}else{Aa=nb[c[21168+((c[k+132>>2]|0)*12|0)>>2]&7](k,f)|0;z=183}}while(0);if((z|0)==183){if((Aa&-2|0)==2){c[m>>2]=666}if((Aa&-3|0)!=0){if((Aa|0)!=1){break}if((f|0)==1){Rf(k)}else if(((f|0)!=5?(Qf(k,0,0,0),(f|0)==3):0)?(s=c[k+76>>2]|0,x=c[k+68>>2]|0,b[x+(s+ -1<<1)>>1]=0,Eg(x|0,0,(s<<1)+ -2|0)|0,(c[k+116>>2]|0)==0):0){c[k+108>>2]=0;c[k+92>>2]=0}s=c[j>>2]|0;x=c[s+20>>2]|0;J=c[p>>2]|0;I=x>>>0>J>>>0?J:x;if((I|0)==0){Ea=J}else{Kg(c[l>>2]|0,c[s+16>>2]|0,I|0)|0;c[l>>2]=(c[l>>2]|0)+I;s=(c[j>>2]|0)+16|0;c[s>>2]=(c[s>>2]|0)+I;s=e+20|0;c[s>>2]=(c[s>>2]|0)+I;c[p>>2]=(c[p>>2]|0)-I;s=c[j>>2]|0;J=s+20|0;x=c[J>>2]|0;c[J>>2]=x-I;if((x|0)==(I|0)){c[s+16>>2]=c[s+8>>2]}Ea=c[p>>2]|0}if((Ea|0)!=0){break}c[q>>2]=-1;h=0;i=g;return h|0}}if((c[p>>2]|0)!=0){h=0;i=g;return h|0}c[q>>2]=-1;h=0;i=g;return h|0}}while(0);if(!o){h=0;i=g;return h|0}q=k+24|0;m=c[q>>2]|0;if((m|0)<1){h=1;i=g;return h|0}s=e+48|0;I=c[s>>2]|0;if((m|0)==2){m=c[N>>2]|0;c[N>>2]=m+1;x=k+8|0;a[(c[x>>2]|0)+m|0]=I;m=(c[s>>2]|0)>>>8&255;J=c[N>>2]|0;c[N>>2]=J+1;a[(c[x>>2]|0)+J|0]=m;m=(c[s>>2]|0)>>>16&255;J=c[N>>2]|0;c[N>>2]=J+1;a[(c[x>>2]|0)+J|0]=m;m=(c[s>>2]|0)>>>24&255;J=c[N>>2]|0;c[N>>2]=J+1;a[(c[x>>2]|0)+J|0]=m;m=e+8|0;J=c[m>>2]&255;M=c[N>>2]|0;c[N>>2]=M+1;a[(c[x>>2]|0)+M|0]=J;J=(c[m>>2]|0)>>>8&255;M=c[N>>2]|0;c[N>>2]=M+1;a[(c[x>>2]|0)+M|0]=J;J=(c[m>>2]|0)>>>16&255;M=c[N>>2]|0;c[N>>2]=M+1;a[(c[x>>2]|0)+M|0]=J;J=(c[m>>2]|0)>>>24&255;m=c[N>>2]|0;c[N>>2]=m+1;a[(c[x>>2]|0)+m|0]=J}else{J=c[N>>2]|0;c[N>>2]=J+1;m=k+8|0;a[(c[m>>2]|0)+J|0]=I>>>24;J=c[N>>2]|0;c[N>>2]=J+1;a[(c[m>>2]|0)+J|0]=I>>>16;I=c[s>>2]|0;s=c[N>>2]|0;c[N>>2]=s+1;a[(c[m>>2]|0)+s|0]=I>>>8;s=c[N>>2]|0;c[N>>2]=s+1;a[(c[m>>2]|0)+s|0]=I}I=c[j>>2]|0;s=c[I+20>>2]|0;m=c[p>>2]|0;J=s>>>0>m>>>0?m:s;if((J|0)!=0?(Kg(c[l>>2]|0,c[I+16>>2]|0,J|0)|0,c[l>>2]=(c[l>>2]|0)+J,I=(c[j>>2]|0)+16|0,c[I>>2]=(c[I>>2]|0)+J,I=e+20|0,c[I>>2]=(c[I>>2]|0)+J,c[p>>2]=(c[p>>2]|0)-J,I=c[j>>2]|0,s=I+20|0,m=c[s>>2]|0,c[s>>2]=m-J,(m|0)==(J|0)):0){c[I+16>>2]=c[I+8>>2]}I=c[q>>2]|0;if((I|0)>0){c[q>>2]=0-I}h=(c[N>>2]|0)==0|0;i=g;return h|0}}}while(0);c[e+24>>2]=c[27624>>2];h=-2;i=g;return h|0}function mf(a){a=a|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;f=i;g=a+44|0;h=c[g>>2]|0;j=a+60|0;k=a+116|0;l=a+108|0;m=h+ -262|0;n=a+56|0;o=a+72|0;p=a+88|0;q=a+84|0;r=a+112|0;s=a+92|0;t=a+76|0;u=a+68|0;v=a+64|0;w=c[k>>2]|0;x=h;while(1){y=c[l>>2]|0;z=(c[j>>2]|0)-w-y|0;if(y>>>0<(m+x|0)>>>0){A=y;B=z}else{y=c[n>>2]|0;Kg(y|0,y+h|0,h|0)|0;c[r>>2]=(c[r>>2]|0)-h;y=(c[l>>2]|0)-h|0;c[l>>2]=y;c[s>>2]=(c[s>>2]|0)-h;C=c[t>>2]|0;D=C;E=(c[u>>2]|0)+(C<<1)|0;do{E=E+ -2|0;C=e[E>>1]|0;if(C>>>0<h>>>0){F=0}else{F=C-h&65535}b[E>>1]=F;D=D+ -1|0}while((D|0)!=0);D=h;E=(c[v>>2]|0)+(h<<1)|0;do{E=E+ -2|0;C=e[E>>1]|0;if(C>>>0<h>>>0){G=0}else{G=C-h&65535}b[E>>1]=G;D=D+ -1|0}while((D|0)!=0);A=y;B=z+h|0}D=c[a>>2]|0;E=D+4|0;C=c[E>>2]|0;if((C|0)==0){H=28;break}I=c[k>>2]|0;J=(c[n>>2]|0)+(I+A)|0;K=C>>>0>B>>>0?B:C;if((K|0)==0){L=0;M=I}else{c[E>>2]=C-K;C=c[(c[D+28>>2]|0)+24>>2]|0;if((C|0)==2){E=D+48|0;c[E>>2]=gf(c[E>>2]|0,c[D>>2]|0,K)|0;N=D}else if((C|0)==1){C=D+48|0;c[C>>2]=ff(c[C>>2]|0,c[D>>2]|0,K)|0;N=D}else{N=D}Kg(J|0,c[N>>2]|0,K|0)|0;c[N>>2]=(c[N>>2]|0)+K;J=D+8|0;c[J>>2]=(c[J>>2]|0)+K;L=K;M=c[k>>2]|0}O=M+L|0;c[k>>2]=O;if(O>>>0>2?(K=c[l>>2]|0,J=c[n>>2]|0,D=d[J+K|0]|0,c[o>>2]=D,c[o>>2]=((d[J+(K+1)|0]|0)^D<<c[p>>2])&c[q>>2],!(O>>>0<262)):0){break}if((c[(c[a>>2]|0)+4>>2]|0)==0){break}w=O;x=c[g>>2]|0}if((H|0)==28){i=f;return}H=a+5824|0;a=c[H>>2]|0;g=c[j>>2]|0;if(!(a>>>0<g>>>0)){i=f;return}j=O+(c[l>>2]|0)|0;if(a>>>0<j>>>0){l=g-j|0;O=l>>>0>258?258:l;Eg((c[n>>2]|0)+j|0,0,O|0)|0;c[H>>2]=O+j;i=f;return}O=j+258|0;if(!(a>>>0<O>>>0)){i=f;return}j=O-a|0;O=g-a|0;g=j>>>0>O>>>0?O:j;Eg((c[n>>2]|0)+a|0,0,g|0)|0;c[H>>2]=(c[H>>2]|0)+g;i=f;return}function nf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=i;e=(c[a+12>>2]|0)+ -5|0;f=e>>>0<65535?e:65535;e=a+116|0;g=a+108|0;h=a+92|0;j=a+44|0;k=a+56|0;while(1){l=c[e>>2]|0;if(l>>>0<2){mf(a);m=c[e>>2]|0;if((m|b|0)==0){n=0;o=28;break}if((m|0)==0){o=20;break}else{p=m}}else{p=l}l=(c[g>>2]|0)+p|0;c[g>>2]=l;c[e>>2]=0;m=c[h>>2]|0;q=m+f|0;if((l|0)!=0&l>>>0<q>>>0){r=l;s=m}else{c[e>>2]=l-q;c[g>>2]=q;if((m|0)>-1){t=(c[k>>2]|0)+m|0}else{t=0}Sf(a,t,f,0);c[h>>2]=c[g>>2];m=c[a>>2]|0;q=m+28|0;l=c[q>>2]|0;u=c[l+20>>2]|0;v=m+16|0;w=c[v>>2]|0;x=u>>>0>w>>>0?w:u;if((x|0)!=0?(u=m+12|0,Kg(c[u>>2]|0,c[l+16>>2]|0,x|0)|0,c[u>>2]=(c[u>>2]|0)+x,u=(c[q>>2]|0)+16|0,c[u>>2]=(c[u>>2]|0)+x,u=m+20|0,c[u>>2]=(c[u>>2]|0)+x,c[v>>2]=(c[v>>2]|0)-x,v=c[q>>2]|0,q=v+20|0,u=c[q>>2]|0,c[q>>2]=u-x,(u|0)==(x|0)):0){c[v+16>>2]=c[v+8>>2]}if((c[(c[a>>2]|0)+16>>2]|0)==0){n=0;o=28;break}r=c[g>>2]|0;s=c[h>>2]|0}v=r-s|0;if(v>>>0<((c[j>>2]|0)+ -262|0)>>>0){continue}if((s|0)>-1){y=(c[k>>2]|0)+s|0}else{y=0}Sf(a,y,v,0);c[h>>2]=c[g>>2];v=c[a>>2]|0;x=v+28|0;u=c[x>>2]|0;q=c[u+20>>2]|0;m=v+16|0;l=c[m>>2]|0;w=q>>>0>l>>>0?l:q;if((w|0)!=0?(q=v+12|0,Kg(c[q>>2]|0,c[u+16>>2]|0,w|0)|0,c[q>>2]=(c[q>>2]|0)+w,q=(c[x>>2]|0)+16|0,c[q>>2]=(c[q>>2]|0)+w,q=v+20|0,c[q>>2]=(c[q>>2]|0)+w,c[m>>2]=(c[m>>2]|0)-w,m=c[x>>2]|0,x=m+20|0,q=c[x>>2]|0,c[x>>2]=q-w,(q|0)==(w|0)):0){c[m+16>>2]=c[m+8>>2]}if((c[(c[a>>2]|0)+16>>2]|0)==0){n=0;o=28;break}}if((o|0)==20){y=c[h>>2]|0;if((y|0)>-1){z=(c[k>>2]|0)+y|0}else{z=0}k=(b|0)==4;Sf(a,z,(c[g>>2]|0)-y|0,k&1);c[h>>2]=c[g>>2];g=c[a>>2]|0;h=g+28|0;y=c[h>>2]|0;z=c[y+20>>2]|0;b=g+16|0;s=c[b>>2]|0;j=z>>>0>s>>>0?s:z;if((j|0)!=0?(z=g+12|0,Kg(c[z>>2]|0,c[y+16>>2]|0,j|0)|0,c[z>>2]=(c[z>>2]|0)+j,z=(c[h>>2]|0)+16|0,c[z>>2]=(c[z>>2]|0)+j,z=g+20|0,c[z>>2]=(c[z>>2]|0)+j,c[b>>2]=(c[b>>2]|0)-j,b=c[h>>2]|0,h=b+20|0,z=c[h>>2]|0,c[h>>2]=z-j,(z|0)==(j|0)):0){c[b+16>>2]=c[b+8>>2]}if((c[(c[a>>2]|0)+16>>2]|0)==0){n=k?2:0;i=d;return n|0}else{n=k?3:1;i=d;return n|0}}else if((o|0)==28){i=d;return n|0}return 0}function of(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;g=i;h=e+116|0;j=(f|0)==0;k=e+72|0;l=e+88|0;m=e+108|0;n=e+56|0;o=e+84|0;p=e+68|0;q=e+52|0;r=e+64|0;s=e+44|0;t=e+96|0;u=e+112|0;v=e+5792|0;w=e+5796|0;x=e+5784|0;y=e+5788|0;z=e+128|0;A=e+92|0;while(1){if((c[h>>2]|0)>>>0<262){mf(e);B=c[h>>2]|0;if(B>>>0<262&j){C=0;D=34;break}if((B|0)==0){D=26;break}if(!(B>>>0>2)){D=9}else{D=6}}else{D=6}if((D|0)==6){D=0;B=c[m>>2]|0;E=((d[(c[n>>2]|0)+(B+2)|0]|0)^c[k>>2]<<c[l>>2])&c[o>>2];c[k>>2]=E;F=(c[p>>2]|0)+(E<<1)|0;E=b[F>>1]|0;b[(c[r>>2]|0)+((c[q>>2]&B)<<1)>>1]=E;G=E&65535;b[F>>1]=B;if(!(E<<16>>16==0)?!((B-G|0)>>>0>((c[s>>2]|0)+ -262|0)>>>0):0){B=qf(e,G)|0;c[t>>2]=B;H=B}else{D=9}}if((D|0)==9){D=0;H=c[t>>2]|0}do{if(H>>>0>2){B=H+253|0;G=(c[m>>2]|0)-(c[u>>2]|0)|0;E=c[v>>2]|0;b[(c[w>>2]|0)+(E<<1)>>1]=G;c[v>>2]=E+1;a[(c[x>>2]|0)+E|0]=B;E=e+((d[25272+(B&255)|0]|0|256)+1<<2)+148|0;b[E>>1]=(b[E>>1]|0)+1<<16>>16;E=G+65535&65535;if(E>>>0<256){I=E}else{I=(E>>>7)+256|0}E=e+((d[24760+I|0]|0)<<2)+2440|0;b[E>>1]=(b[E>>1]|0)+1<<16>>16;E=(c[v>>2]|0)==((c[y>>2]|0)+ -1|0)|0;G=c[t>>2]|0;B=(c[h>>2]|0)-G|0;c[h>>2]=B;if(!(G>>>0<=(c[z>>2]|0)>>>0&B>>>0>2)){B=(c[m>>2]|0)+G|0;c[m>>2]=B;c[t>>2]=0;F=c[n>>2]|0;J=d[F+B|0]|0;c[k>>2]=J;c[k>>2]=((d[F+(B+1)|0]|0)^J<<c[l>>2])&c[o>>2];K=B;L=E;break}B=G+ -1|0;c[t>>2]=B;G=c[l>>2]|0;J=c[n>>2]|0;F=c[o>>2]|0;M=c[p>>2]|0;N=c[q>>2]|0;O=c[r>>2]|0;P=B;B=c[m>>2]|0;Q=c[k>>2]|0;while(1){R=B+1|0;c[m>>2]=R;Q=((d[J+(B+3)|0]|0)^Q<<G)&F;c[k>>2]=Q;S=M+(Q<<1)|0;b[O+((N&R)<<1)>>1]=b[S>>1]|0;b[S>>1]=R;P=P+ -1|0;c[t>>2]=P;if((P|0)==0){break}else{B=R}}P=B+2|0;c[m>>2]=P;K=P;L=E}else{P=a[(c[n>>2]|0)+(c[m>>2]|0)|0]|0;N=c[v>>2]|0;b[(c[w>>2]|0)+(N<<1)>>1]=0;c[v>>2]=N+1;a[(c[x>>2]|0)+N|0]=P;N=e+((P&255)<<2)+148|0;b[N>>1]=(b[N>>1]|0)+1<<16>>16;N=(c[v>>2]|0)==((c[y>>2]|0)+ -1|0)|0;c[h>>2]=(c[h>>2]|0)+ -1;P=(c[m>>2]|0)+1|0;c[m>>2]=P;K=P;L=N}}while(0);if((L|0)==0){continue}N=c[A>>2]|0;if((N|0)>-1){T=(c[n>>2]|0)+N|0}else{T=0}Sf(e,T,K-N|0,0);c[A>>2]=c[m>>2];N=c[e>>2]|0;P=N+28|0;O=c[P>>2]|0;Q=c[O+20>>2]|0;M=N+16|0;F=c[M>>2]|0;G=Q>>>0>F>>>0?F:Q;if((G|0)!=0?(Q=N+12|0,Kg(c[Q>>2]|0,c[O+16>>2]|0,G|0)|0,c[Q>>2]=(c[Q>>2]|0)+G,Q=(c[P>>2]|0)+16|0,c[Q>>2]=(c[Q>>2]|0)+G,Q=N+20|0,c[Q>>2]=(c[Q>>2]|0)+G,c[M>>2]=(c[M>>2]|0)-G,M=c[P>>2]|0,P=M+20|0,Q=c[P>>2]|0,c[P>>2]=Q-G,(Q|0)==(G|0)):0){c[M+16>>2]=c[M+8>>2]}if((c[(c[e>>2]|0)+16>>2]|0)==0){C=0;D=34;break}}if((D|0)==26){K=c[A>>2]|0;if((K|0)>-1){U=(c[n>>2]|0)+K|0}else{U=0}n=(f|0)==4;Sf(e,U,(c[m>>2]|0)-K|0,n&1);c[A>>2]=c[m>>2];m=c[e>>2]|0;A=m+28|0;K=c[A>>2]|0;U=c[K+20>>2]|0;f=m+16|0;T=c[f>>2]|0;L=U>>>0>T>>>0?T:U;if((L|0)!=0?(U=m+12|0,Kg(c[U>>2]|0,c[K+16>>2]|0,L|0)|0,c[U>>2]=(c[U>>2]|0)+L,U=(c[A>>2]|0)+16|0,c[U>>2]=(c[U>>2]|0)+L,U=m+20|0,c[U>>2]=(c[U>>2]|0)+L,c[f>>2]=(c[f>>2]|0)-L,f=c[A>>2]|0,A=f+20|0,U=c[A>>2]|0,c[A>>2]=U-L,(U|0)==(L|0)):0){c[f+16>>2]=c[f+8>>2]}if((c[(c[e>>2]|0)+16>>2]|0)==0){C=n?2:0;i=g;return C|0}else{C=n?3:1;i=g;return C|0}}else if((D|0)==34){i=g;return C|0}return 0}function pf(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;g=i;h=e+116|0;j=(f|0)==0;k=e+72|0;l=e+88|0;m=e+108|0;n=e+56|0;o=e+84|0;p=e+68|0;q=e+52|0;r=e+64|0;s=e+96|0;t=e+120|0;u=e+112|0;v=e+100|0;w=e+5792|0;x=e+5796|0;y=e+5784|0;z=e+5788|0;A=e+104|0;B=e+92|0;C=e+128|0;D=e+44|0;E=e+136|0;a:while(1){F=c[h>>2]|0;while(1){if(F>>>0<262){mf(e);G=c[h>>2]|0;if(G>>>0<262&j){H=0;I=50;break a}if((G|0)==0){I=40;break a}if(!(G>>>0>2)){c[t>>2]=c[s>>2];c[v>>2]=c[u>>2];c[s>>2]=2;J=2;I=16}else{I=8}}else{I=8}do{if((I|0)==8){I=0;G=c[m>>2]|0;K=((d[(c[n>>2]|0)+(G+2)|0]|0)^c[k>>2]<<c[l>>2])&c[o>>2];c[k>>2]=K;L=(c[p>>2]|0)+(K<<1)|0;K=b[L>>1]|0;b[(c[r>>2]|0)+((c[q>>2]&G)<<1)>>1]=K;M=K&65535;b[L>>1]=G;G=c[s>>2]|0;c[t>>2]=G;c[v>>2]=c[u>>2];c[s>>2]=2;if(!(K<<16>>16==0)){if(G>>>0<(c[C>>2]|0)>>>0){if(!(((c[m>>2]|0)-M|0)>>>0>((c[D>>2]|0)+ -262|0)>>>0)){K=qf(e,M)|0;c[s>>2]=K;if(K>>>0<6){if((c[E>>2]|0)!=1){if((K|0)!=3){J=K;I=16;break}if(!(((c[m>>2]|0)-(c[u>>2]|0)|0)>>>0>4096)){J=3;I=16;break}}c[s>>2]=2;J=2;I=16}else{J=K;I=16}}else{J=2;I=16}}else{N=G;O=2}}else{J=2;I=16}}}while(0);if((I|0)==16){I=0;N=c[t>>2]|0;O=J}if(!(N>>>0<3|O>>>0>N>>>0)){break}if((c[A>>2]|0)==0){c[A>>2]=1;c[m>>2]=(c[m>>2]|0)+1;G=(c[h>>2]|0)+ -1|0;c[h>>2]=G;F=G;continue}G=a[(c[n>>2]|0)+((c[m>>2]|0)+ -1)|0]|0;K=c[w>>2]|0;b[(c[x>>2]|0)+(K<<1)>>1]=0;c[w>>2]=K+1;a[(c[y>>2]|0)+K|0]=G;K=e+((G&255)<<2)+148|0;b[K>>1]=(b[K>>1]|0)+1<<16>>16;if((c[w>>2]|0)==((c[z>>2]|0)+ -1|0)){K=c[B>>2]|0;if((K|0)>-1){P=(c[n>>2]|0)+K|0}else{P=0}Sf(e,P,(c[m>>2]|0)-K|0,0);c[B>>2]=c[m>>2];K=c[e>>2]|0;G=K+28|0;M=c[G>>2]|0;L=c[M+20>>2]|0;Q=K+16|0;R=c[Q>>2]|0;S=L>>>0>R>>>0?R:L;if((S|0)!=0?(L=K+12|0,Kg(c[L>>2]|0,c[M+16>>2]|0,S|0)|0,c[L>>2]=(c[L>>2]|0)+S,L=(c[G>>2]|0)+16|0,c[L>>2]=(c[L>>2]|0)+S,L=K+20|0,c[L>>2]=(c[L>>2]|0)+S,c[Q>>2]=(c[Q>>2]|0)-S,Q=c[G>>2]|0,G=Q+20|0,L=c[G>>2]|0,c[G>>2]=L-S,(L|0)==(S|0)):0){c[Q+16>>2]=c[Q+8>>2]}}c[m>>2]=(c[m>>2]|0)+1;Q=(c[h>>2]|0)+ -1|0;c[h>>2]=Q;if((c[(c[e>>2]|0)+16>>2]|0)==0){H=0;I=50;break a}else{F=Q}}F=c[m>>2]|0;Q=F+ -3+(c[h>>2]|0)|0;S=N+253|0;L=F+65535-(c[v>>2]|0)|0;F=c[w>>2]|0;b[(c[x>>2]|0)+(F<<1)>>1]=L;c[w>>2]=F+1;a[(c[y>>2]|0)+F|0]=S;F=e+((d[25272+(S&255)|0]|0|256)+1<<2)+148|0;b[F>>1]=(b[F>>1]|0)+1<<16>>16;F=L+65535&65535;if(F>>>0<256){T=F}else{T=(F>>>7)+256|0}F=e+((d[24760+T|0]|0)<<2)+2440|0;b[F>>1]=(b[F>>1]|0)+1<<16>>16;F=c[w>>2]|0;L=(c[z>>2]|0)+ -1|0;S=c[t>>2]|0;c[h>>2]=1-S+(c[h>>2]|0);G=S+ -2|0;c[t>>2]=G;S=c[m>>2]|0;K=G;while(1){G=S+1|0;c[m>>2]=G;if(!(G>>>0>Q>>>0)){M=((d[(c[n>>2]|0)+(S+3)|0]|0)^c[k>>2]<<c[l>>2])&c[o>>2];c[k>>2]=M;R=(c[p>>2]|0)+(M<<1)|0;b[(c[r>>2]|0)+((c[q>>2]&G)<<1)>>1]=b[R>>1]|0;b[R>>1]=G}K=K+ -1|0;c[t>>2]=K;if((K|0)==0){break}else{S=G}}c[A>>2]=0;c[s>>2]=2;K=S+2|0;c[m>>2]=K;if((F|0)!=(L|0)){continue}Q=c[B>>2]|0;if((Q|0)>-1){U=(c[n>>2]|0)+Q|0}else{U=0}Sf(e,U,K-Q|0,0);c[B>>2]=c[m>>2];Q=c[e>>2]|0;K=Q+28|0;G=c[K>>2]|0;R=c[G+20>>2]|0;M=Q+16|0;V=c[M>>2]|0;W=R>>>0>V>>>0?V:R;if((W|0)!=0?(R=Q+12|0,Kg(c[R>>2]|0,c[G+16>>2]|0,W|0)|0,c[R>>2]=(c[R>>2]|0)+W,R=(c[K>>2]|0)+16|0,c[R>>2]=(c[R>>2]|0)+W,R=Q+20|0,c[R>>2]=(c[R>>2]|0)+W,c[M>>2]=(c[M>>2]|0)-W,M=c[K>>2]|0,K=M+20|0,R=c[K>>2]|0,c[K>>2]=R-W,(R|0)==(W|0)):0){c[M+16>>2]=c[M+8>>2]}if((c[(c[e>>2]|0)+16>>2]|0)==0){H=0;I=50;break}}if((I|0)==40){if((c[A>>2]|0)!=0){U=a[(c[n>>2]|0)+((c[m>>2]|0)+ -1)|0]|0;s=c[w>>2]|0;b[(c[x>>2]|0)+(s<<1)>>1]=0;c[w>>2]=s+1;a[(c[y>>2]|0)+s|0]=U;s=e+((U&255)<<2)+148|0;b[s>>1]=(b[s>>1]|0)+1<<16>>16;c[A>>2]=0}A=c[B>>2]|0;if((A|0)>-1){X=(c[n>>2]|0)+A|0}else{X=0}n=(f|0)==4;Sf(e,X,(c[m>>2]|0)-A|0,n&1);c[B>>2]=c[m>>2];m=c[e>>2]|0;B=m+28|0;A=c[B>>2]|0;X=c[A+20>>2]|0;f=m+16|0;s=c[f>>2]|0;U=X>>>0>s>>>0?s:X;if((U|0)!=0?(X=m+12|0,Kg(c[X>>2]|0,c[A+16>>2]|0,U|0)|0,c[X>>2]=(c[X>>2]|0)+U,X=(c[B>>2]|0)+16|0,c[X>>2]=(c[X>>2]|0)+U,X=m+20|0,c[X>>2]=(c[X>>2]|0)+U,c[f>>2]=(c[f>>2]|0)-U,f=c[B>>2]|0,B=f+20|0,X=c[B>>2]|0,c[B>>2]=X-U,(X|0)==(U|0)):0){c[f+16>>2]=c[f+8>>2]}if((c[(c[e>>2]|0)+16>>2]|0)==0){H=n?2:0;i=g;return H|0}else{H=n?3:1;i=g;return H|0}}else if((I|0)==50){i=g;return H|0}return 0}function qf(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;g=c[b+124>>2]|0;h=c[b+56>>2]|0;j=c[b+108>>2]|0;k=h+j|0;l=c[b+120>>2]|0;m=c[b+144>>2]|0;n=(c[b+44>>2]|0)+ -262|0;o=j>>>0>n>>>0?j-n|0:0;n=c[b+64>>2]|0;p=c[b+52>>2]|0;q=h+(j+258)|0;r=c[b+116>>2]|0;s=m>>>0>r>>>0?r:m;m=b+112|0;t=h+(j+1)|0;u=h+(j+2)|0;v=q;w=j+257|0;x=d;d=l;y=l>>>0<(c[b+140>>2]|0)>>>0?g:g>>>2;g=a[h+(l+j)|0]|0;b=a[h+(j+ -1+l)|0]|0;while(1){l=h+x|0;if((((a[h+(x+d)|0]|0)==g<<24>>24?(a[h+(d+ -1+x)|0]|0)==b<<24>>24:0)?(a[l]|0)==(a[k]|0):0)?(a[h+(x+1)|0]|0)==(a[t]|0):0){l=h+(x+2)|0;z=u;while(1){A=z+1|0;if((a[A]|0)!=(a[l+1|0]|0)){B=A;break}A=z+2|0;if((a[A]|0)!=(a[l+2|0]|0)){B=A;break}A=z+3|0;if((a[A]|0)!=(a[l+3|0]|0)){B=A;break}A=z+4|0;if((a[A]|0)!=(a[l+4|0]|0)){B=A;break}A=z+5|0;if((a[A]|0)!=(a[l+5|0]|0)){B=A;break}A=z+6|0;if((a[A]|0)!=(a[l+6|0]|0)){B=A;break}A=z+7|0;if((a[A]|0)!=(a[l+7|0]|0)){B=A;break}A=z+8|0;C=l+8|0;if((a[A]|0)==(a[C]|0)&A>>>0<q>>>0){l=C;z=A}else{B=A;break}}z=B-v|0;l=z+258|0;if((l|0)>(d|0)){c[m>>2]=x;if((l|0)>=(s|0)){D=l;E=20;break}F=l;G=a[h+(l+j)|0]|0;H=a[h+(w+z)|0]|0}else{F=d;G=g;H=b}}else{F=d;G=g;H=b}z=e[n+((x&p)<<1)>>1]|0;if(!(z>>>0>o>>>0)){D=F;E=20;break}l=y+ -1|0;if((l|0)==0){D=F;E=20;break}else{x=z;d=F;y=l;g=G;b=H}}if((E|0)==20){i=f;return(D>>>0>r>>>0?r:D)|0}return 0}function rf(a){a=a|0;var b=0,d=0;b=i;do{if((a|0)!=0){if((c[a>>2]|0)==7247){d=Af(a)|0;break}else{d=Ff(a)|0;break}}else{d=-2}}while(0);i=b;return d|0}function sf(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=tf(a,-1,b)|0;i=c;return d|0}function tf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+16|0;g=f;h=gg(140)|0;if((h|0)==0){j=0;i=f;return j|0}c[h+16>>2]=0;c[h+20>>2]=8192;k=h+80|0;c[k>>2]=0;c[h>>2]=0;l=h+60|0;c[l>>2]=-1;m=h+64|0;c[m>>2]=0;n=a[e]|0;if(!(n<<24>>24==0)){o=e;e=n;n=0;a:while(1){p=e<<24>>24;b:do{if((e+ -48<<24>>24&255)<10){c[l>>2]=p+ -48;q=n}else{switch(p|0){case 70:{c[m>>2]=4;q=n;break b;break};case 43:{r=9;break a;break};case 82:{c[m>>2]=3;q=n;break b;break};case 102:{c[m>>2]=1;q=n;break b;break};case 104:{c[m>>2]=2;q=n;break b;break};case 119:{c[h>>2]=31153;q=31153;break b;break};case 97:{c[h>>2]=1;q=1;break b;break};case 114:{c[h>>2]=7247;q=7247;break b;break};default:{q=n;break b}}}}while(0);o=o+1|0;e=a[o]|0;if(e<<24>>24==0){break}else{n=q}}if((r|0)==9){hg(h);j=0;i=f;return j|0}if((q|0)!=0){q=gg((Dg(b|0)|0)+1|0)|0;r=h+8|0;c[r>>2]=q;if((q|0)==0){hg(h);j=0;i=f;return j|0}Lg(q|0,b|0)|0;if((d|0)==-1){q=c[h>>2]|0;if((q|0)==7247){s=32768}else{s=(q|0)==31153?33345:33857}c[g>>2]=438;q=Aa(b|0,s|0,g|0)|0;c[h+4>>2]=q;if((q|0)==-1){hg(c[r>>2]|0);hg(h);j=0;i=f;return j|0}else{t=q}}else{c[h+4>>2]=d;t=d}d=c[h>>2]|0;if((d|0)==1){c[h>>2]=31153}else if((d|0)==7247?(d=ra(t|0,0,1)|0,c[h+44>>2]=(d|0)==-1?0:d,(c[h>>2]|0)==7247):0){c[h+36>>2]=0;c[h+40>>2]=0;c[h+52>>2]=0;c[h+56>>2]=1}c[h+72>>2]=0;d=c[k>>2]|0;t=h+76|0;if((d|0)!=0){if(!((c[t>>2]|0)==-4)){hg(d)}c[k>>2]=0}c[t>>2]=0;c[h+12>>2]=0;c[h+88>>2]=0;j=h;i=f;return j|0}}hg(h);j=0;i=f;return j|0}function uf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;if((a|0)==0){f=-1;i=e;return f|0}g=c[a>>2]|0;if(!((g|0)==31153|(g|0)==7247)){f=-1;i=e;return f|0}h=a+76|0;if((c[h>>2]|0)!=0|d>>>0>1){f=-1;i=e;return f|0}if((d|0)!=0){d=a+72|0;if((c[d>>2]|0)==0){j=b;k=d}else{j=(c[a+68>>2]|0)+b|0;k=d}}else{j=b-(c[a+12>>2]|0)|0;k=a+72|0}c[k>>2]=0;b=(g|0)==7247;if((b?(c[a+52>>2]|0)==1:0)?(d=a+12|0,((c[d>>2]|0)+j|0)>=(c[a+48>>2]|0)):0){l=a+36|0;if((ra(c[a+4>>2]|0,j-(c[l>>2]|0)|0,1)|0)==-1){f=-1;i=e;return f|0}c[l>>2]=0;c[a+40>>2]=0;c[k>>2]=0;l=a+80|0;m=c[l>>2]|0;if((m|0)!=0){if(!((c[h>>2]|0)==-4)){hg(m)}c[l>>2]=0}c[h>>2]=0;c[a+88>>2]=0;l=(c[d>>2]|0)+j|0;c[d>>2]=l;f=l;i=e;return f|0}if((j|0)<0){if(!b){f=-1;i=e;return f|0}b=a+12|0;l=(c[b>>2]|0)+j|0;if((l|0)<0){f=-1;i=e;return f|0}if((ra(c[a+4>>2]|0,c[a+44>>2]|0,0)|0)==-1){f=-1;i=e;return f|0}d=c[a>>2]|0;if((d|0)==7247){c[a+36>>2]=0;c[a+40>>2]=0;c[a+52>>2]=0;c[a+56>>2]=1}c[k>>2]=0;m=a+80|0;n=c[m>>2]|0;if((n|0)==0){o=d}else{if((c[h>>2]|0)==-4){p=d}else{hg(n);p=c[a>>2]|0}c[m>>2]=0;o=p}c[h>>2]=0;c[b>>2]=0;c[a+88>>2]=0;q=l;r=o}else{q=j;r=g}if((r|0)==7247){r=a+36|0;g=c[r>>2]|0;j=(g|0)<0|(g|0)>(q|0)?q:g;c[r>>2]=g-j;g=a+32|0;c[g>>2]=(c[g>>2]|0)+j;g=a+12|0;c[g>>2]=j+(c[g>>2]|0);s=q-j|0}else{s=q}if((s|0)!=0){c[k>>2]=1;c[a+68>>2]=s}f=(c[a+12>>2]|0)+s|0;i=e;return f|0}function vf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=b+80|0;h=c[g>>2]|0;j=b+76|0;if((h|0)!=0){if(!((c[j>>2]|0)==-4)){hg(h)}c[g>>2]=0}c[j>>2]=d;if((e|0)==0){i=f;return}if((d|0)==-4){c[g>>2]=e;i=f;return}d=c[b+8>>2]|0;b=Dg(d|0)|0;h=gg(b+3+(Dg(e|0)|0)|0)|0;c[g>>2]=h;if((h|0)==0){c[j>>2]=-4;c[g>>2]=21280;i=f;return}else{Lg(h|0,d|0)|0;d=c[g>>2]|0;h=d+(Dg(d|0)|0)|0;a[h+0|0]=a[21296|0]|0;a[h+1|0]=a[21297|0]|0;a[h+2|0]=a[21298|0]|0;Fg(c[g>>2]|0,e|0)|0;i=f;return}}function wf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;e=uf(a,b,c)|0;i=d;return e|0}function xf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;e=i;if((a|0)==0){f=-1;i=e;return f|0}if((c[a>>2]|0)!=7247){f=-1;i=e;return f|0}if((c[a+76>>2]|0)!=0){f=-1;i=e;return f|0}if((d|0)<0){vf(a,-5,21304);f=-1;i=e;return f|0}if((d|0)==0){f=0;i=e;return f|0}g=a+72|0;a:do{if((c[g>>2]|0)!=0){c[g>>2]=0;h=c[a+68>>2]|0;j=a+36|0;k=a+40|0;l=a+88|0;m=a+32|0;n=a+12|0;if((h|0)!=0){o=a+52|0;p=a+28|0;q=a+16|0;r=a+4|0;s=a+100|0;t=a+96|0;u=h;b:while(1){c:while(1){v=c[j>>2]|0;while(1){if((v|0)!=0){break c}if((c[k>>2]|0)!=0?(c[l>>2]|0)==0:0){w=j;x=k;y=m;z=l;A=n;break a}h=c[o>>2]|0;if((h|0)!=0){B=h;break}if((zf(a)|0)==-1){f=-1;C=59;break b}h=c[j>>2]|0;if((h|0)==0){C=21;break}else{v=h}}if((C|0)==21){C=0;B=c[o>>2]|0}if((B|0)==2){c[s>>2]=c[q>>2]<<1;c[t>>2]=c[p>>2];if((yf(a)|0)==-1){f=-1;C=59;break b}else{continue}}else if((B|0)!=1){continue}h=c[p>>2]|0;D=c[q>>2]<<1;c[j>>2]=0;E=0;do{F=Za(c[r>>2]|0,h+E|0,D-E|0)|0;if((F|0)<1){C=26;break}E=(c[j>>2]|0)+F|0;c[j>>2]=E}while(E>>>0<D>>>0);if((C|0)==26){C=0;if((F|0)<0){C=28;break b}c[k>>2]=1}c[m>>2]=c[p>>2]}D=(v|0)<0|(v|0)>(u|0)?u:v;c[j>>2]=v-D;c[m>>2]=(c[m>>2]|0)+D;c[n>>2]=(c[n>>2]|0)+D;if((u|0)==(D|0)){w=j;x=k;y=m;z=l;A=n;break a}else{u=u-D|0}}if((C|0)==28){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);f=-1;i=e;return f|0}else if((C|0)==59){i=e;return f|0}}else{w=j;x=k;y=m;z=l;A=n}}else{w=a+36|0;x=a+40|0;y=a+32|0;z=a+88|0;A=a+12|0}}while(0);v=a+52|0;F=a+28|0;B=a+16|0;g=a+4|0;u=a+100|0;p=a+96|0;r=b;b=d;d=0;d:while(1){q=c[w>>2]|0;e:do{if((q|0)==0){if((c[x>>2]|0)!=0?(c[z>>2]|0)==0:0){f=d;C=59;break d}t=c[v>>2]|0;if((t|0)!=0){if(b>>>0<c[B>>2]<<1>>>0){G=t}else{if((t|0)==1){H=0}else{c[u>>2]=b;c[p>>2]=r;if((yf(a)|0)==-1){f=-1;C=59;break d}t=c[w>>2]|0;c[w>>2]=0;I=t;C=57;break}while(1){J=Za(c[g>>2]|0,r+H|0,b-H|0)|0;if((J|0)<1){break}t=J+H|0;if(t>>>0<b>>>0){H=t}else{I=t;C=57;break e}}if((J|0)<0){C=54;break d}c[x>>2]=1;I=H;C=57;break}}else{if((zf(a)|0)==-1){f=-1;C=59;break d}if((c[w>>2]|0)!=0){K=r;L=b;M=d;break}G=c[v>>2]|0}if((G|0)==2){c[u>>2]=c[B>>2]<<1;c[p>>2]=c[F>>2];if((yf(a)|0)==-1){f=-1;C=59;break d}else{K=r;L=b;M=d;break}}else if((G|0)!=1){K=r;L=b;M=d;break}t=c[F>>2]|0;s=c[B>>2]<<1;c[w>>2]=0;o=0;do{N=Za(c[g>>2]|0,t+o|0,s-o|0)|0;if((N|0)<1){C=44;break}o=(c[w>>2]|0)+N|0;c[w>>2]=o}while(o>>>0<s>>>0);if((C|0)==44){C=0;if((N|0)<0){C=46;break d}c[x>>2]=1}c[y>>2]=c[F>>2];K=r;L=b;M=d}else{s=q>>>0>b>>>0?b:q;Kg(r|0,c[y>>2]|0,s|0)|0;c[y>>2]=(c[y>>2]|0)+s;c[w>>2]=(c[w>>2]|0)-s;I=s;C=57}}while(0);if((C|0)==57){C=0;c[A>>2]=(c[A>>2]|0)+I;K=r+I|0;L=b-I|0;M=I+d|0}if((L|0)==0){f=M;C=59;break}else{r=K;b=L;d=M}}if((C|0)==46){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);f=-1;i=e;return f|0}else if((C|0)==54){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);f=-1;i=e;return f|0}else if((C|0)==59){i=e;return f|0}return 0}function yf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;b=i;i=i+16|0;d=b+4|0;e=b;f=a+84|0;g=a+100|0;h=c[g>>2]|0;j=a+88|0;k=a+76|0;l=a+40|0;m=a+24|0;n=a+16|0;o=a+4|0;p=a+84|0;while(1){if((c[j>>2]|0)==0){if((c[k>>2]|0)!=0){q=-1;r=27;break}if((c[l>>2]|0)!=0){r=12;break}s=c[m>>2]|0;t=c[n>>2]|0;c[j>>2]=0;u=0;while(1){v=Za(c[o>>2]|0,s+u|0,t-u|0)|0;if((v|0)<1){r=8;break}w=(c[j>>2]|0)+v|0;c[j>>2]=w;if(w>>>0<t>>>0){u=w}else{x=w;break}}if((r|0)==8){r=0;if((v|0)<0){r=10;break}c[l>>2]=1;x=c[j>>2]|0}c[p>>2]=c[m>>2];if((x|0)==0){r=12;break}}u=Kf(f,0)|0;if((u|0)==-4){r=15;break}else if((u|0)==-3){r=16;break}else if((u|0)==2|(u|0)==-2){r=14;break}y=c[g>>2]|0;z=(u|0)==1;if((y|0)==0|z){r=18;break}}if((r|0)==10){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);q=-1;i=b;return q|0}else if((r|0)==12){vf(a,-3,21432);q=-1;i=b;return q|0}else if((r|0)==14){vf(a,-2,21456);q=-1;i=b;return q|0}else if((r|0)==15){vf(a,-4,21344);q=-1;i=b;return q|0}else if((r|0)==16){g=c[a+108>>2]|0;vf(a,-3,(g|0)==0?21496:g);q=-1;i=b;return q|0}else if((r|0)==18){g=h-y|0;c[a+36>>2]=g;y=(c[a+96>>2]|0)+(0-g)|0;c[a+32>>2]=y;h=a+132|0;c[h>>2]=gf(c[h>>2]|0,y,g)|0;if(!z){q=0;i=b;return q|0}if(!((Bf(a,d)|0)==-1)?!((Bf(a,e)|0)==-1):0){if((c[d>>2]|0)!=(c[h>>2]|0)){vf(a,-3,21520);q=-1;i=b;return q|0}if((c[e>>2]|0)==(c[a+104>>2]|0)){c[a+52>>2]=0;q=0;i=b;return q|0}else{vf(a,-3,21544);q=-1;i=b;return q|0}}vf(a,-3,21432);q=-1;i=b;return q|0}else if((r|0)==27){i=b;return q|0}return 0}function zf(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0;e=i;f=b+84|0;g=b+16|0;do{if((c[g>>2]|0)==0){h=c[b+20>>2]|0;j=gg(h)|0;k=b+24|0;c[k>>2]=j;l=gg(h<<1)|0;m=b+28|0;c[m>>2]=l;n=(l|0)==0;if(!((j|0)==0|n)){c[g>>2]=h;c[b+116>>2]=0;c[b+120>>2]=0;c[b+124>>2]=0;h=b+88|0;c[h>>2]=0;c[f>>2]=0;if((Jf(f,-15,21360,56)|0)==0){o=h;break}hg(c[m>>2]|0);hg(c[k>>2]|0);c[g>>2]=0;vf(b,-4,21344);p=-1;i=e;return p|0}if(n){q=j}else{hg(l);q=c[k>>2]|0}if((q|0)!=0){hg(q)}vf(b,-4,21344);p=-1;i=e;return p|0}else{o=b+88|0}}while(0);q=c[o>>2]|0;if((q|0)==0){if((c[b+76>>2]|0)!=0){p=-1;i=e;return p|0}k=b+40|0;if((c[k>>2]|0)!=0){p=0;i=e;return p|0}l=b+24|0;j=c[l>>2]|0;n=c[g>>2]|0;c[o>>2]=0;m=b+4|0;h=0;while(1){r=Za(c[m>>2]|0,j+h|0,n-h|0)|0;if((r|0)<1){s=17;break}t=(c[o>>2]|0)+r|0;c[o>>2]=t;if(t>>>0<n>>>0){h=t}else{u=t;break}}do{if((s|0)==17){if((r|0)>=0){c[k>>2]=1;u=c[o>>2]|0;break}vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);p=-1;i=e;return p|0}}while(0);c[b+84>>2]=c[l>>2];if((u|0)==0){p=0;i=e;return p|0}else{v=u}}else{v=q}q=c[f>>2]|0;if((a[q]|0)==31){u=v+ -1|0;c[o>>2]=u;l=q+1|0;c[f>>2]=l;if((u|0)==0){if((c[b+76>>2]|0)!=0){p=-1;i=e;return p|0}q=b+40|0;if((c[q>>2]|0)==0){k=b+24|0;r=c[k>>2]|0;h=c[g>>2]|0;c[o>>2]=0;n=b+4|0;j=0;while(1){w=Za(c[n>>2]|0,r+j|0,h-j|0)|0;if((w|0)<1){s=29;break}m=(c[o>>2]|0)+w|0;c[o>>2]=m;if(m>>>0<h>>>0){j=m}else{x=m;break}}do{if((s|0)==29){if((w|0)>=0){c[q>>2]=1;x=c[o>>2]|0;break}vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);p=-1;i=e;return p|0}}while(0);q=c[k>>2]|0;c[b+84>>2]=q;if((x|0)!=0){y=q;z=x;s=33}}}else{y=l;z=u;s=33}if((s|0)==33?(a[y]|0)==-117:0){u=z+ -1|0;c[o>>2]=u;z=y+1|0;c[f>>2]=z;a:do{if((u|0)==0){if((c[b+76>>2]|0)==0?(y=b+40|0,(c[y>>2]|0)==0):0){l=b+24|0;x=c[l>>2]|0;q=c[g>>2]|0;c[o>>2]=0;k=b+4|0;w=0;while(1){A=Za(c[k>>2]|0,x+w|0,q-w|0)|0;if((A|0)<1){s=40;break}j=(c[o>>2]|0)+A|0;c[o>>2]=j;if(j>>>0<q>>>0){w=j}else{B=j;break}}do{if((s|0)==40){if((A|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);break a}else{c[y>>2]=1;B=c[o>>2]|0;break}}}while(0);y=c[l>>2]|0;c[b+84>>2]=y;if((B|0)!=0){C=B;D=y;s=44}}}else{C=u;D=z;s=44}}while(0);if((s|0)==44?(z=C+ -1|0,c[o>>2]=z,C=D+1|0,c[f>>2]=C,(a[D]|0)==8):0){b:do{if((z|0)==0){if((c[b+76>>2]|0)==0?(D=b+40|0,(c[D>>2]|0)==0):0){u=b+24|0;B=c[u>>2]|0;A=c[g>>2]|0;c[o>>2]=0;y=b+4|0;w=0;while(1){E=Za(c[y>>2]|0,B+w|0,A-w|0)|0;if((E|0)<1){s=52;break}q=(c[o>>2]|0)+E|0;c[o>>2]=q;if(q>>>0<A>>>0){w=q}else{F=q;break}}do{if((s|0)==52){if((E|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);break b}else{c[D>>2]=1;F=c[o>>2]|0;break}}}while(0);D=c[u>>2]|0;c[b+84>>2]=D;if((F|0)!=0){G=F;H=D;s=56}}}else{G=z;H=C;s=56}}while(0);if((s|0)==56?(C=G+ -1|0,c[o>>2]=C,G=H+1|0,c[f>>2]=G,z=d[H]|0,(z&224|0)==0):0){c:do{if((C|0)==0){H=b+76|0;if((c[H>>2]|0)==0){F=b+40|0;if((c[F>>2]|0)==0){E=b+24|0;D=c[E>>2]|0;w=c[g>>2]|0;c[o>>2]=0;A=b+4|0;B=0;while(1){I=Za(c[A>>2]|0,D+B|0,w-B|0)|0;if((I|0)<1){s=64;break}y=(c[o>>2]|0)+I|0;c[o>>2]=y;if(y>>>0<w>>>0){B=y}else{J=y;break}}do{if((s|0)==64){if((I|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);K=c[o>>2]|0;s=69;break c}else{c[F>>2]=1;J=c[o>>2]|0;break}}}while(0);F=c[E>>2]|0;c[b+84>>2]=F;if((J|0)!=0){L=J;M=F;s=68}else{N=H;s=71}}else{N=H;s=71}}else{s=70}}else{L=C;M=G;s=68}}while(0);if((s|0)==68){G=L+ -1|0;c[o>>2]=G;c[f>>2]=M+1;K=G;s=69}if((s|0)==69){if((K|0)==0){s=70}else{O=K;s=80}}if((s|0)==70){N=b+76|0;s=71}d:do{if((s|0)==71){if((c[N>>2]|0)==0){K=b+40|0;if((c[K>>2]|0)==0){G=b+24|0;M=c[G>>2]|0;L=c[g>>2]|0;c[o>>2]=0;C=b+4|0;J=0;while(1){P=Za(c[C>>2]|0,M+J|0,L-J|0)|0;if((P|0)<1){s=76;break}I=(c[o>>2]|0)+P|0;c[o>>2]=I;if(I>>>0<L>>>0){J=I}else{Q=I;break}}do{if((s|0)==76){if((P|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);R=c[o>>2]|0;s=81;break d}else{c[K>>2]=1;Q=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[G>>2];if((Q|0)!=0){O=Q;s=80}else{S=N;s=83}}else{S=N;s=83}}else{s=82}}}while(0);if((s|0)==80){N=O+ -1|0;c[o>>2]=N;c[f>>2]=(c[f>>2]|0)+1;R=N;s=81}if((s|0)==81){if((R|0)==0){s=82}else{T=R;s=92}}if((s|0)==82){S=b+76|0;s=83}e:do{if((s|0)==83){if((c[S>>2]|0)==0){R=b+40|0;if((c[R>>2]|0)==0){N=b+24|0;O=c[N>>2]|0;Q=c[g>>2]|0;c[o>>2]=0;P=b+4|0;K=0;while(1){U=Za(c[P>>2]|0,O+K|0,Q-K|0)|0;if((U|0)<1){s=88;break}J=(c[o>>2]|0)+U|0;c[o>>2]=J;if(J>>>0<Q>>>0){K=J}else{V=J;break}}do{if((s|0)==88){if((U|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);W=c[o>>2]|0;s=93;break e}else{c[R>>2]=1;V=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[N>>2];if((V|0)!=0){T=V;s=92}else{X=S;s=95}}else{X=S;s=95}}else{s=94}}}while(0);if((s|0)==92){S=T+ -1|0;c[o>>2]=S;c[f>>2]=(c[f>>2]|0)+1;W=S;s=93}if((s|0)==93){if((W|0)==0){s=94}else{Y=W;s=104}}if((s|0)==94){X=b+76|0;s=95}f:do{if((s|0)==95){if((c[X>>2]|0)==0){W=b+40|0;if((c[W>>2]|0)==0){S=b+24|0;T=c[S>>2]|0;V=c[g>>2]|0;c[o>>2]=0;U=b+4|0;R=0;while(1){Z=Za(c[U>>2]|0,T+R|0,V-R|0)|0;if((Z|0)<1){s=100;break}K=(c[o>>2]|0)+Z|0;c[o>>2]=K;if(K>>>0<V>>>0){R=K}else{_=K;break}}do{if((s|0)==100){if((Z|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);$=c[o>>2]|0;s=105;break f}else{c[W>>2]=1;_=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[S>>2];if((_|0)!=0){Y=_;s=104}else{aa=X;s=107}}else{aa=X;s=107}}else{s=106}}}while(0);if((s|0)==104){X=Y+ -1|0;c[o>>2]=X;c[f>>2]=(c[f>>2]|0)+1;$=X;s=105}if((s|0)==105){if(($|0)==0){s=106}else{ba=$;s=116}}if((s|0)==106){aa=b+76|0;s=107}g:do{if((s|0)==107){if((c[aa>>2]|0)==0){$=b+40|0;if((c[$>>2]|0)==0){X=b+24|0;Y=c[X>>2]|0;_=c[g>>2]|0;c[o>>2]=0;Z=b+4|0;W=0;while(1){ca=Za(c[Z>>2]|0,Y+W|0,_-W|0)|0;if((ca|0)<1){s=112;break}R=(c[o>>2]|0)+ca|0;c[o>>2]=R;if(R>>>0<_>>>0){W=R}else{da=R;break}}do{if((s|0)==112){if((ca|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);ea=c[o>>2]|0;s=117;break g}else{c[$>>2]=1;da=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[X>>2];if((da|0)!=0){ba=da;s=116}else{fa=aa;s=119}}else{fa=aa;s=119}}else{s=118}}}while(0);if((s|0)==116){aa=ba+ -1|0;c[o>>2]=aa;c[f>>2]=(c[f>>2]|0)+1;ea=aa;s=117}if((s|0)==117){if((ea|0)==0){s=118}else{ga=ea;s=128}}if((s|0)==118){fa=b+76|0;s=119}h:do{if(((s|0)==119?(c[fa>>2]|0)==0:0)?(ea=b+40|0,(c[ea>>2]|0)==0):0){aa=b+24|0;ba=c[aa>>2]|0;da=c[g>>2]|0;c[o>>2]=0;ca=b+4|0;$=0;while(1){ha=Za(c[ca>>2]|0,ba+$|0,da-$|0)|0;if((ha|0)<1){s=124;break}W=(c[o>>2]|0)+ha|0;c[o>>2]=W;if(W>>>0<da>>>0){$=W}else{ia=W;break}}do{if((s|0)==124){if((ha|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);break h}else{c[ea>>2]=1;ia=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[aa>>2];if((ia|0)!=0){ga=ia;s=128}}}while(0);if((s|0)==128){c[o>>2]=ga+ -1;c[f>>2]=(c[f>>2]|0)+1}i:do{if((z&4|0)!=0){ga=c[o>>2]|0;j:do{if((ga|0)==0){ia=b+76|0;if((c[ia>>2]|0)==0){ha=b+40|0;if((c[ha>>2]|0)==0){fa=b+24|0;ea=c[fa>>2]|0;$=c[g>>2]|0;c[o>>2]=0;da=b+4|0;ba=0;while(1){ja=Za(c[da>>2]|0,ea+ba|0,$-ba|0)|0;if((ja|0)<1){s=136;break}ca=(c[o>>2]|0)+ja|0;c[o>>2]=ca;if(ca>>>0<$>>>0){ba=ca}else{ka=ca;break}}do{if((s|0)==136){if((ja|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);la=-1;ma=c[o>>2]|0;s=141;break j}else{c[ha>>2]=1;ka=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[fa>>2];if((ka|0)!=0){na=ka;s=140}else{oa=ia;pa=-1;s=143}}else{oa=ia;pa=-1;s=143}}else{qa=-1;s=142}}else{na=ga;s=140}}while(0);if((s|0)==140){ga=na+ -1|0;c[o>>2]=ga;aa=c[f>>2]|0;c[f>>2]=aa+1;la=d[aa]|0;ma=ga;s=141}if((s|0)==141){if((ma|0)==0){qa=la;s=142}else{ra=ma;sa=la;s=152}}if((s|0)==142){oa=b+76|0;pa=qa;s=143}k:do{if((s|0)==143){if((c[oa>>2]|0)==0?(ga=b+40|0,(c[ga>>2]|0)==0):0){aa=b+24|0;ha=c[aa>>2]|0;ba=c[g>>2]|0;c[o>>2]=0;$=b+4|0;ea=0;while(1){ta=Za(c[$>>2]|0,ha+ea|0,ba-ea|0)|0;if((ta|0)<1){s=148;break}da=(c[o>>2]|0)+ta|0;c[o>>2]=da;if(da>>>0<ba>>>0){ea=da}else{ua=da;break}}do{if((s|0)==148){if((ta|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);va=-256;wa=pa;break k}else{c[ga>>2]=1;ua=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[aa>>2];if((ua|0)!=0){ra=ua;sa=pa;s=152}else{va=-256;wa=pa}}else{va=-256;wa=pa}}}while(0);if((s|0)==152){c[o>>2]=ra+ -1;ga=c[f>>2]|0;c[f>>2]=ga+1;va=d[ga]<<8;wa=sa}ga=va+wa|0;if((ga|0)!=0){ea=b+76|0;ba=b+40|0;ha=b+24|0;$=b+4|0;ia=b+84|0;fa=ga;ga=c[o>>2]|0;while(1){fa=fa+ -1|0;if((ga|0)==0){if((c[ea>>2]|0)!=0){break i}if((c[ba>>2]|0)!=0){break i}da=c[ha>>2]|0;ca=c[g>>2]|0;c[o>>2]=0;X=0;while(1){xa=Za(c[$>>2]|0,da+X|0,ca-X|0)|0;if((xa|0)<1){s=161;break}W=(c[o>>2]|0)+xa|0;c[o>>2]=W;if(W>>>0<ca>>>0){X=W}else{ya=W;break}}if((s|0)==161){s=0;if((xa|0)<0){break}c[ba>>2]=1;ya=c[o>>2]|0}c[ia>>2]=c[ha>>2];if((ya|0)==0){break i}else{za=ya}}else{za=ga}ga=za+ -1|0;c[o>>2]=ga;c[f>>2]=(c[f>>2]|0)+1;if((fa|0)==0){break i}}vf(b,-1,db(c[(Sa()|0)>>2]|0)|0)}}}while(0);l:do{if((z&8|0)!=0){za=b+76|0;ya=b+40|0;xa=b+24|0;wa=b+4|0;va=b+84|0;sa=c[o>>2]|0;while(1){if((sa|0)==0){if((c[za>>2]|0)!=0){break l}if((c[ya>>2]|0)!=0){break l}ra=c[xa>>2]|0;pa=c[g>>2]|0;c[o>>2]=0;ua=0;while(1){Aa=Za(c[wa>>2]|0,ra+ua|0,pa-ua|0)|0;if((Aa|0)<1){s=174;break}ta=(c[o>>2]|0)+Aa|0;c[o>>2]=ta;if(ta>>>0<pa>>>0){ua=ta}else{Ba=ta;break}}if((s|0)==174){s=0;if((Aa|0)<0){break}c[ya>>2]=1;Ba=c[o>>2]|0}c[va>>2]=c[xa>>2];if((Ba|0)==0){break l}else{Ca=Ba}}else{Ca=sa}sa=Ca+ -1|0;c[o>>2]=sa;ua=c[f>>2]|0;c[f>>2]=ua+1;if((a[ua]|0)==0){break l}}vf(b,-1,db(c[(Sa()|0)>>2]|0)|0)}}while(0);m:do{if((z&16|0)!=0){Ca=b+76|0;Ba=b+40|0;Aa=b+24|0;sa=b+4|0;xa=b+84|0;va=c[o>>2]|0;while(1){if((va|0)==0){if((c[Ca>>2]|0)!=0){break m}if((c[Ba>>2]|0)!=0){break m}ya=c[Aa>>2]|0;wa=c[g>>2]|0;c[o>>2]=0;za=0;while(1){Da=Za(c[sa>>2]|0,ya+za|0,wa-za|0)|0;if((Da|0)<1){s=187;break}ua=(c[o>>2]|0)+Da|0;c[o>>2]=ua;if(ua>>>0<wa>>>0){za=ua}else{Ea=ua;break}}if((s|0)==187){s=0;if((Da|0)<0){break}c[Ba>>2]=1;Ea=c[o>>2]|0}c[xa>>2]=c[Aa>>2];if((Ea|0)==0){break m}else{Fa=Ea}}else{Fa=va}va=Fa+ -1|0;c[o>>2]=va;za=c[f>>2]|0;c[f>>2]=za+1;if((a[za]|0)==0){break m}}vf(b,-1,db(c[(Sa()|0)>>2]|0)|0)}}while(0);n:do{if((z&2|0)!=0){Fa=c[o>>2]|0;o:do{if((Fa|0)==0){Ea=b+76|0;if((c[Ea>>2]|0)==0){Da=b+40|0;if((c[Da>>2]|0)==0){va=b+24|0;Aa=c[va>>2]|0;xa=c[g>>2]|0;c[o>>2]=0;Ba=b+4|0;sa=0;while(1){Ga=Za(c[Ba>>2]|0,Aa+sa|0,xa-sa|0)|0;if((Ga|0)<1){s=199;break}Ca=(c[o>>2]|0)+Ga|0;c[o>>2]=Ca;if(Ca>>>0<xa>>>0){sa=Ca}else{Ha=Ca;break}}do{if((s|0)==199){if((Ga|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);Ia=c[o>>2]|0;s=204;break o}else{c[Da>>2]=1;Ha=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[va>>2];if((Ha|0)!=0){Ja=Ha;s=203}else{Ka=Ea;s=206}}else{Ka=Ea;s=206}}else{s=205}}else{Ja=Fa;s=203}}while(0);if((s|0)==203){Fa=Ja+ -1|0;c[o>>2]=Fa;c[f>>2]=(c[f>>2]|0)+1;Ia=Fa;s=204}if((s|0)==204){if((Ia|0)==0){s=205}else{La=Ia}}if((s|0)==205){Ka=b+76|0;s=206}if((s|0)==206){if((c[Ka>>2]|0)!=0){break}Fa=b+40|0;if((c[Fa>>2]|0)!=0){break}Da=b+24|0;sa=c[Da>>2]|0;xa=c[g>>2]|0;c[o>>2]=0;Aa=b+4|0;Ba=0;while(1){Ma=Za(c[Aa>>2]|0,sa+Ba|0,xa-Ba|0)|0;if((Ma|0)<1){s=211;break}Ca=(c[o>>2]|0)+Ma|0;c[o>>2]=Ca;if(Ca>>>0<xa>>>0){Ba=Ca}else{Na=Ca;break}}do{if((s|0)==211){if((Ma|0)<0){vf(b,-1,db(c[(Sa()|0)>>2]|0)|0);break n}else{c[Fa>>2]=1;Na=c[o>>2]|0;break}}}while(0);c[b+84>>2]=c[Da>>2];if((Na|0)==0){break}else{La=Na}}c[o>>2]=La+ -1;c[f>>2]=(c[f>>2]|0)+1}}while(0);Hf(f)|0;c[b+132>>2]=gf(0,0,0)|0;c[b+52>>2]=2;c[b+56>>2]=0;p=0;i=e;return p|0}vf(b,-3,21400);p=-1;i=e;return p|0}vf(b,-3,21368);p=-1;i=e;return p|0}La=b+28|0;a[c[La>>2]|0]=31;c[b+36>>2]=1;Oa=La;Pa=c[o>>2]|0}else{Oa=b+28|0;Pa=v}c[b+48>>2]=c[b+12>>2];v=c[Oa>>2]|0;c[b+32>>2]=v;if((Pa|0)!=0){Oa=b+36|0;Kg(v+(c[Oa>>2]|0)|0,c[f>>2]|0,Pa|0)|0;c[Oa>>2]=(c[Oa>>2]|0)+(c[o>>2]|0);c[o>>2]=0}c[b+52>>2]=1;c[b+56>>2]=1;p=0;i=e;return p|0}function Af(a){a=a|0;var b=0,d=0,e=0;b=i;if((a|0)==0){d=-2;i=b;return d|0}if((c[a>>2]|0)!=7247){d=-2;i=b;return d|0}if((c[a+16>>2]|0)!=0){Mf(a+84|0)|0;hg(c[a+28>>2]|0);hg(c[a+24>>2]|0)}vf(a,0,0);hg(c[a+8>>2]|0);e=ib(c[a+4>>2]|0)|0;hg(a);d=((e|0)!=0)<<31>>31;i=b;return d|0}function Bf(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;f=a+84|0;g=a+88|0;h=c[g>>2]|0;a:do{if((h|0)==0){j=a+76|0;if((c[j>>2]|0)==0){k=a+40|0;if((c[k>>2]|0)==0){l=a+24|0;m=c[l>>2]|0;n=c[a+16>>2]|0;c[g>>2]=0;o=a+4|0;p=0;while(1){q=Za(c[o>>2]|0,m+p|0,n-p|0)|0;if((q|0)<1){r=7;break}s=(c[g>>2]|0)+q|0;c[g>>2]=s;if(s>>>0<n>>>0){p=s}else{t=s;break}}do{if((r|0)==7){if((q|0)<0){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);u=-1;v=c[g>>2]|0;r=12;break a}else{c[k>>2]=1;t=c[g>>2]|0;break}}}while(0);c[a+84>>2]=c[l>>2];if((t|0)!=0){w=t;r=11}else{x=j;y=-1;r=14}}else{x=j;y=-1;r=14}}else{z=-1;r=13}}else{w=h;r=11}}while(0);if((r|0)==11){h=w+ -1|0;c[g>>2]=h;w=c[f>>2]|0;c[f>>2]=w+1;u=d[w]|0;v=h;r=12}if((r|0)==12){if((v|0)==0){z=u;r=13}else{A=u;B=v;r=25}}if((r|0)==13){x=a+76|0;y=z;r=14}b:do{if((r|0)==14){if((c[x>>2]|0)!=0){C=y+ -256|0;r=27;break}z=a+40|0;if((c[z>>2]|0)==0){v=a+24|0;u=c[v>>2]|0;h=c[a+16>>2]|0;c[g>>2]=0;w=a+4|0;t=0;while(1){D=Za(c[w>>2]|0,u+t|0,h-t|0)|0;if((D|0)<1){r=20;break}q=(c[g>>2]|0)+D|0;c[g>>2]=q;if(q>>>0<h>>>0){t=q}else{E=q;break}}do{if((r|0)==20){if((D|0)<0){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);F=y;G=-256;H=c[g>>2]|0;r=26;break b}else{c[z>>2]=1;E=c[g>>2]|0;break}}}while(0);c[a+84>>2]=c[v>>2];if((E|0)!=0){A=y;B=E;r=25;break}}I=x;J=y+ -256|0;r=28}}while(0);if((r|0)==25){y=B+ -1|0;c[g>>2]=y;B=c[f>>2]|0;c[f>>2]=B+1;F=A;G=(d[B]|0)<<8;H=y;r=26}if((r|0)==26){y=G+F|0;if((H|0)==0){C=y;r=27}else{K=H;L=y;r=39}}if((r|0)==27){I=a+76|0;J=C;r=28}c:do{if((r|0)==28){if((c[I>>2]|0)!=0){M=J+ -65536|0;r=41;break}C=a+40|0;if((c[C>>2]|0)==0){y=a+24|0;H=c[y>>2]|0;F=c[a+16>>2]|0;c[g>>2]=0;G=a+4|0;B=0;while(1){N=Za(c[G>>2]|0,H+B|0,F-B|0)|0;if((N|0)<1){r=34;break}A=(c[g>>2]|0)+N|0;c[g>>2]=A;if(A>>>0<F>>>0){B=A}else{O=A;break}}do{if((r|0)==34){if((N|0)<0){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);P=J;Q=-65536;R=c[g>>2]|0;r=40;break c}else{c[C>>2]=1;O=c[g>>2]|0;break}}}while(0);c[a+84>>2]=c[y>>2];if((O|0)!=0){K=O;L=J;r=39;break}}S=I;T=J+ -65536|0;r=42}}while(0);if((r|0)==39){J=K+ -1|0;c[g>>2]=J;K=c[f>>2]|0;c[f>>2]=K+1;P=L;Q=(d[K]|0)<<16;R=J;r=40}if((r|0)==40){J=Q+P|0;if((R|0)==0){M=J;r=41}else{U=R;V=J}}if((r|0)==41){S=a+76|0;T=M;r=42}if((r|0)==42){if((c[S>>2]|0)!=0){W=-1;i=e;return W|0}S=a+40|0;if((c[S>>2]|0)!=0){W=-1;i=e;return W|0}M=a+24|0;J=c[M>>2]|0;R=c[a+16>>2]|0;c[g>>2]=0;P=a+4|0;Q=0;while(1){X=Za(c[P>>2]|0,J+Q|0,R-Q|0)|0;if((X|0)<1){r=47;break}K=(c[g>>2]|0)+X|0;c[g>>2]=K;if(K>>>0<R>>>0){Q=K}else{Y=K;break}}do{if((r|0)==47){if((X|0)>=0){c[S>>2]=1;Y=c[g>>2]|0;break}vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);W=-1;i=e;return W|0}}while(0);c[a+84>>2]=c[M>>2];if((Y|0)==0){W=-1;i=e;return W|0}else{U=Y;V=T}}c[g>>2]=U+ -1;U=c[f>>2]|0;c[f>>2]=U+1;c[b>>2]=((d[U]|0)<<24)+V;W=0;i=e;return W|0}function Cf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;if((a|0)==0){f=0;i=e;return f|0}g=a+84|0;if((c[a>>2]|0)!=31153){f=0;i=e;return f|0}if((c[a+76>>2]|0)!=0){f=0;i=e;return f|0}if((d|0)<0){vf(a,-5,21568);f=0;i=e;return f|0}if((d|0)==0){f=0;i=e;return f|0}h=a+16|0;if((c[h>>2]|0)==0?(Df(a)|0)==-1:0){f=0;i=e;return f|0}j=a+72|0;a:do{if((c[j>>2]|0)!=0){c[j>>2]=0;k=c[a+68>>2]|0;l=a+88|0;if((c[l>>2]|0)!=0?(Ef(a,0)|0)==-1:0){f=0;i=e;return f|0}if((k|0)!=0){m=a+24|0;n=a+12|0;o=k;k=0;while(1){p=c[h>>2]|0;q=(p|0)<0|(p|0)>(o|0)?o:p;if(!k){Eg(c[m>>2]|0,0,q|0)|0}c[l>>2]=q;c[g>>2]=c[m>>2];c[n>>2]=(c[n>>2]|0)+q;if((Ef(a,0)|0)==-1){f=0;break}if((o|0)==(q|0)){break a}o=o-q|0;k=1}i=e;return f|0}}}while(0);j=a+88|0;b:do{if(!((c[h>>2]|0)>>>0>d>>>0)){if((c[j>>2]|0)!=0?(Ef(a,0)|0)==-1:0){f=0;i=e;return f|0}c[j>>2]=d;c[g>>2]=b;k=a+12|0;c[k>>2]=(c[k>>2]|0)+d;if((Ef(a,0)|0)==-1){f=0;i=e;return f|0}}else{k=a+24|0;o=a+12|0;n=b;m=d;while(1){l=c[j>>2]|0;if((l|0)==0){q=c[k>>2]|0;c[g>>2]=q;r=q}else{r=c[g>>2]|0}q=(c[h>>2]|0)-l|0;p=q>>>0>m>>>0?m:q;Kg(r+l|0,n|0,p|0)|0;c[j>>2]=(c[j>>2]|0)+p;c[o>>2]=(c[o>>2]|0)+p;if((m|0)==(p|0)){break b}if((Ef(a,0)|0)==-1){f=0;break}n=n+p|0;m=m-p|0}i=e;return f|0}}while(0);f=d;i=e;return f|0}function Df(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;d=a+20|0;e=c[d>>2]|0;f=gg(e)|0;g=a+24|0;c[g>>2]=f;h=gg(e)|0;e=a+28|0;c[e>>2]=h;j=(h|0)==0;if(!((f|0)==0|j)){c[a+116>>2]=0;c[a+120>>2]=0;c[a+124>>2]=0;if((hf(a+84|0,c[a+60>>2]|0,8,31,8,c[a+64>>2]|0,21664,56)|0)==0){k=c[d>>2]|0;c[a+16>>2]=k;c[a+100>>2]=k;k=c[e>>2]|0;c[a+96>>2]=k;c[a+32>>2]=k;l=0;i=b;return l|0}else{hg(c[g>>2]|0);vf(a,-4,21648);l=-1;i=b;return l|0}}if(j){m=f}else{hg(h);m=c[g>>2]|0}if((m|0)!=0){hg(m)}vf(a,-4,21648);l=-1;i=b;return l|0}function Ef(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;d=i;e=a+84|0;f=a+16|0;if((c[f>>2]|0)==0?(Df(a)|0)==-1:0){g=-1;i=d;return g|0}h=a+100|0;j=a+96|0;k=a+32|0;l=a+28|0;m=a+4|0;a:do{if((b|0)==4){n=c[h>>2]|0;o=0;while(1){if((n|0)==0|(o|0)==1){p=c[j>>2]|0;q=c[k>>2]|0;r=p-q|0;if((p|0)==(q|0)){s=n}else{p=Qa(c[m>>2]|0,q|0,r|0)|0;if(!((p|0)>-1&(p|0)==(r|0))){t=30;break a}s=c[h>>2]|0}if((s|0)==0){r=c[f>>2]|0;c[h>>2]=r;p=c[l>>2]|0;c[j>>2]=p;u=p;v=r}else{u=c[j>>2]|0;v=s}c[k>>2]=u;w=v}else{w=n}r=lf(e,4)|0;if((r|0)==-2){t=36;break a}p=c[h>>2]|0;if((w|0)==(p|0)){t=38;break}else{n=p;o=r}}}else if((b|0)==0){o=c[h>>2]|0;while(1){if((o|0)==0){n=c[j>>2]|0;r=c[k>>2]|0;p=n-r|0;if((n|0)!=(r|0)){n=Qa(c[m>>2]|0,r|0,p|0)|0;if(!((n|0)>-1&(n|0)==(p|0))){t=30;break a}p=c[h>>2]|0;if((p|0)!=0){x=c[j>>2]|0;y=p}else{t=10}}else{t=10}if((t|0)==10){t=0;p=c[f>>2]|0;c[h>>2]=p;n=c[l>>2]|0;c[j>>2]=n;x=n;y=p}c[k>>2]=x;z=y}else{z=o}if((lf(e,0)|0)==-2){t=36;break a}p=c[h>>2]|0;if((z|0)==(p|0)){t=38;break}else{o=p}}}else{o=c[h>>2]|0;while(1){if((o|0)!=0&(b|0)==0){A=o}else{p=c[j>>2]|0;n=c[k>>2]|0;r=p-n|0;if((p|0)==(n|0)){B=o}else{p=Qa(c[m>>2]|0,n|0,r|0)|0;if(!((p|0)>-1&(p|0)==(r|0))){t=30;break a}B=c[h>>2]|0}if((B|0)==0){r=c[f>>2]|0;c[h>>2]=r;p=c[l>>2]|0;c[j>>2]=p;C=p;D=r}else{C=c[j>>2]|0;D=B}c[k>>2]=C;A=D}if((lf(e,b)|0)==-2){t=36;break a}r=c[h>>2]|0;if((A|0)==(r|0)){t=38;break}else{o=r}}}}while(0);if((t|0)==30){vf(a,-1,db(c[(Sa()|0)>>2]|0)|0);g=-1;i=d;return g|0}else if((t|0)==36){vf(a,-2,21608);g=-1;i=d;return g|0}else if((t|0)==38){if((b|0)!=4){g=0;i=d;return g|0}kf(e)|0;g=0;i=d;return g|0}return 0}function Ff(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=i;if((a|0)==0){d=-2;i=b;return d|0}if((c[a>>2]|0)!=31153){d=-2;i=b;return d|0}e=a+72|0;a:do{if((c[e>>2]|0)!=0){c[e>>2]=0;f=c[a+68>>2]|0;g=a+88|0;if((c[g>>2]|0)!=0?(Ef(a,0)|0)==-1:0){h=-1;break}if((f|0)!=0){j=a+16|0;k=a+24|0;l=a+84|0;m=a+12|0;n=f;f=0;while(1){o=c[j>>2]|0;p=(o|0)<0|(o|0)>(n|0)?n:o;if(!f){Eg(c[k>>2]|0,0,p|0)|0}c[g>>2]=p;c[l>>2]=c[k>>2];c[m>>2]=(c[m>>2]|0)+p;if((Ef(a,0)|0)==-1){h=-1;break a}if((n|0)==(p|0)){h=0;break}else{n=n-p|0;f=1}}}else{h=0}}else{h=0}}while(0);e=(Ef(a,4)|0)+h|0;jf(a+84|0)|0;hg(c[a+28>>2]|0);hg(c[a+24>>2]|0);vf(a,0,0);hg(c[a+8>>2]|0);h=ib(c[a+4>>2]|0)|0;hg(a);d=((e|0)!=(0-h|0))<<31>>31;i=b;return d|0}function Gf(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0;g=i;h=c[e+28>>2]|0;j=c[e>>2]|0;k=e+4|0;l=j+((c[k>>2]|0)+ -6)|0;m=e+12|0;n=c[m>>2]|0;o=e+16|0;p=c[o>>2]|0;q=n+(p+ -258)|0;r=c[h+44>>2]|0;s=c[h+48>>2]|0;t=c[h+52>>2]|0;u=h+56|0;v=h+60|0;w=c[h+76>>2]|0;x=c[h+80>>2]|0;y=(1<<c[h+84>>2])+ -1|0;z=(1<<c[h+88>>2])+ -1|0;A=n+(p+~f)|0;f=h+7104|0;p=t+ -1|0;B=(s|0)==0;C=(c[h+40>>2]|0)+ -1|0;D=C+s|0;E=s+ -1|0;F=A+ -1|0;G=A-s|0;H=c[v>>2]|0;I=c[u>>2]|0;J=j+ -1|0;j=n+ -1|0;a:while(1){if(H>>>0<15){n=J+2|0;K=H+16|0;L=((d[J+1|0]|0)<<H)+I+((d[n]|0)<<H+8)|0;M=n}else{K=H;L=I;M=J}n=L&y;N=a[w+(n<<2)|0]|0;O=b[w+(n<<2)+2>>1]|0;P=d[w+(n<<2)+1|0]|0;n=L>>>P;Q=K-P|0;do{if(!(N<<24>>24==0)){R=N&255;S=Q;T=n;P=O;while(1){if((R&16|0)!=0){break}if((R&64|0)!=0){U=55;break a}V=(T&(1<<R)+ -1)+(P&65535)|0;W=a[w+(V<<2)|0]|0;X=b[w+(V<<2)+2>>1]|0;Y=d[w+(V<<2)+1|0]|0;Z=T>>>Y;_=S-Y|0;if(W<<24>>24==0){U=6;break}else{R=W&255;S=_;T=Z;P=X}}if((U|0)==6){U=0;$=Z;aa=_;ba=X&255;U=7;break}W=P&65535;Y=R&15;if((Y|0)==0){ca=S;da=T;ea=M;fa=W}else{if(S>>>0<Y>>>0){V=M+1|0;ga=S+8|0;ha=((d[V]|0)<<S)+T|0;ia=V}else{ga=S;ha=T;ia=M}ca=ga-Y|0;da=ha>>>Y;ea=ia;fa=(ha&(1<<Y)+ -1)+W|0}if(ca>>>0<15){W=ea+2|0;ja=ca+16|0;ka=((d[ea+1|0]|0)<<ca)+da+((d[W]|0)<<ca+8)|0;la=W}else{ja=ca;ka=da;la=ea}W=ka&z;Y=b[x+(W<<2)+2>>1]|0;V=d[x+(W<<2)+1|0]|0;ma=ka>>>V;na=ja-V|0;V=d[x+(W<<2)|0]|0;if((V&16|0)==0){W=V;oa=ma;pa=na;qa=Y;while(1){if((W&64|0)!=0){U=52;break a}ra=(oa&(1<<W)+ -1)+(qa&65535)|0;sa=b[x+(ra<<2)+2>>1]|0;ta=d[x+(ra<<2)+1|0]|0;ua=oa>>>ta;va=pa-ta|0;ta=d[x+(ra<<2)|0]|0;if((ta&16|0)==0){W=ta;oa=ua;pa=va;qa=sa}else{wa=ua;xa=va;ya=ta;za=sa;break}}}else{wa=ma;xa=na;ya=V;za=Y}qa=za&65535;W=ya&15;if(xa>>>0<W>>>0){P=la+1|0;sa=((d[P]|0)<<xa)+wa|0;ta=xa+8|0;if(ta>>>0<W>>>0){va=la+2|0;Aa=xa+16|0;Ba=((d[va]|0)<<ta)+sa|0;Ca=va}else{Aa=ta;Ba=sa;Ca=P}}else{Aa=xa;Ba=wa;Ca=la}P=(Ba&(1<<W)+ -1)+qa|0;Da=Ba>>>W;Ea=Aa-W|0;W=j;qa=W-A|0;if(!(P>>>0>qa>>>0)){sa=j+(0-P)|0;ta=fa;va=j;while(1){a[va+1|0]=a[sa+1|0]|0;a[va+2|0]=a[sa+2|0]|0;ua=sa+3|0;Fa=va+3|0;a[Fa]=a[ua]|0;ta=ta+ -3|0;if(!(ta>>>0>2)){break}else{sa=ua;va=Fa}}if((ta|0)==0){Ga=Ea;Ha=Da;Ia=Ca;Ja=Fa;break}Y=va+4|0;a[Y]=a[sa+4|0]|0;if(!(ta>>>0>1)){Ga=Ea;Ha=Da;Ia=Ca;Ja=Y;break}Y=va+5|0;a[Y]=a[sa+5|0]|0;Ga=Ea;Ha=Da;Ia=Ca;Ja=Y;break}Y=P-qa|0;if(Y>>>0>r>>>0?(c[f>>2]|0)!=0:0){U=22;break a}do{if(B){V=t+(C-Y)|0;if(Y>>>0<fa>>>0){na=fa-Y|0;ma=P-W|0;ua=V;ra=Y;Ka=j;do{ua=ua+1|0;Ka=Ka+1|0;a[Ka]=a[ua]|0;ra=ra+ -1|0}while((ra|0)!=0);La=j+(F+ma+(1-P))|0;Ma=na;Na=j+(A+ma)|0}else{La=V;Ma=fa;Na=j}}else{if(!(s>>>0<Y>>>0)){ra=t+(E-Y)|0;if(!(Y>>>0<fa>>>0)){La=ra;Ma=fa;Na=j;break}ua=fa-Y|0;Ka=P-W|0;Oa=ra;ra=Y;Pa=j;do{Oa=Oa+1|0;Pa=Pa+1|0;a[Pa]=a[Oa]|0;ra=ra+ -1|0}while((ra|0)!=0);La=j+(F+Ka+(1-P))|0;Ma=ua;Na=j+(A+Ka)|0;break}ra=t+(D-Y)|0;Oa=Y-s|0;if(Oa>>>0<fa>>>0){Pa=fa-Oa|0;V=P-W|0;ma=ra;na=Oa;Oa=j;do{ma=ma+1|0;Oa=Oa+1|0;a[Oa]=a[ma]|0;na=na+ -1|0}while((na|0)!=0);na=j+(G+V)|0;if(s>>>0<Pa>>>0){ma=Pa-s|0;Oa=p;Ka=s;ua=na;do{Oa=Oa+1|0;ua=ua+1|0;a[ua]=a[Oa]|0;Ka=Ka+ -1|0}while((Ka|0)!=0);La=j+(F+V+(1-P))|0;Ma=ma;Na=j+(A+V)|0}else{La=p;Ma=Pa;Na=na}}else{La=ra;Ma=fa;Na=j}}}while(0);if(Ma>>>0>2){P=La;W=Ma;Y=Na;while(1){a[Y+1|0]=a[P+1|0]|0;a[Y+2|0]=a[P+2|0]|0;qa=P+3|0;sa=Y+3|0;a[sa]=a[qa]|0;va=W+ -3|0;if(va>>>0>2){P=qa;W=va;Y=sa}else{Qa=qa;Ra=va;Sa=sa;break}}}else{Qa=La;Ra=Ma;Sa=Na}if((Ra|0)!=0){Y=Sa+1|0;a[Y]=a[Qa+1|0]|0;if(Ra>>>0>1){W=Sa+2|0;a[W]=a[Qa+2|0]|0;Ga=Ea;Ha=Da;Ia=Ca;Ja=W}else{Ga=Ea;Ha=Da;Ia=Ca;Ja=Y}}else{Ga=Ea;Ha=Da;Ia=Ca;Ja=Sa}}else{$=n;aa=Q;ba=O&255;U=7}}while(0);if((U|0)==7){U=0;O=j+1|0;a[O]=ba;Ga=aa;Ha=$;Ia=M;Ja=O}if(Ia>>>0<l>>>0&Ja>>>0<q>>>0){H=Ga;I=Ha;J=Ia;j=Ja}else{Ta=Ga;Ua=Ha;Va=Ia;Wa=Ja;break}}do{if((U|0)==22){c[e+24>>2]=21672;c[h>>2]=29;Ta=Ea;Ua=Da;Va=Ca;Wa=j}else if((U|0)==52){c[e+24>>2]=21704;c[h>>2]=29;Ta=pa;Ua=oa;Va=la;Wa=j}else if((U|0)==55){if((R&32|0)==0){c[e+24>>2]=21728;c[h>>2]=29;Ta=S;Ua=T;Va=M;Wa=j;break}else{c[h>>2]=11;Ta=S;Ua=T;Va=M;Wa=j;break}}}while(0);j=Ta>>>3;M=Va+(0-j)|0;T=Ta-(j<<3)|0;Ta=(1<<T)+ -1&Ua;c[e>>2]=Va+(1-j);c[m>>2]=Wa+1;if(M>>>0<l>>>0){Xa=l-M|0}else{Xa=l-M|0}c[k>>2]=Xa+5;if(Wa>>>0<q>>>0){Ya=q-Wa|0;Za=Ya+257|0;c[o>>2]=Za;c[u>>2]=Ta;c[v>>2]=T;i=g;return}else{Ya=q-Wa|0;Za=Ya+257|0;c[o>>2]=Za;c[u>>2]=Ta;c[v>>2]=T;i=g;return}}function Hf(a){a=a|0;var b=0,d=0,e=0;b=i;if((a|0)==0){d=-2;i=b;return d|0}e=c[a+28>>2]|0;if((e|0)==0){d=-2;i=b;return d|0}c[e+28>>2]=0;c[a+20>>2]=0;c[a+8>>2]=0;c[a+24>>2]=0;c[a+48>>2]=1;c[e>>2]=0;c[e+4>>2]=0;c[e+12>>2]=0;c[e+20>>2]=32768;c[e+32>>2]=0;c[e+40>>2]=0;c[e+44>>2]=0;c[e+48>>2]=0;c[e+56>>2]=0;c[e+60>>2]=0;a=e+1328|0;c[e+108>>2]=a;c[e+80>>2]=a;c[e+76>>2]=a;c[e+7104>>2]=1;c[e+7108>>2]=-1;d=0;i=b;return d|0}function If(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;if((a|0)==0){e=-2;i=d;return e|0}f=a+28|0;g=c[f>>2]|0;if((g|0)==0){e=-2;i=d;return e|0}if((b|0)<0){h=0-b|0;j=0}else{h=(b|0)<48?b&15:b;j=(b>>4)+1|0}if((h|0)!=0&(h+ -8|0)>>>0>7){e=-2;i=d;return e|0}b=g+52|0;k=c[b>>2]|0;l=g+36|0;if((k|0)!=0?(c[l>>2]|0)!=(h|0):0){mb[c[a+36>>2]&1](c[a+40>>2]|0,k);c[b>>2]=0}c[g+8>>2]=j;c[l>>2]=h;h=c[f>>2]|0;if((h|0)==0){e=-2;i=d;return e|0}c[h+28>>2]=0;c[a+20>>2]=0;c[a+8>>2]=0;c[a+24>>2]=0;c[a+48>>2]=1;c[h>>2]=0;c[h+4>>2]=0;c[h+12>>2]=0;c[h+20>>2]=32768;c[h+32>>2]=0;c[h+40>>2]=0;c[h+44>>2]=0;c[h+48>>2]=0;c[h+56>>2]=0;c[h+60>>2]=0;a=h+1328|0;c[h+108>>2]=a;c[h+80>>2]=a;c[h+76>>2]=a;c[h+7104>>2]=1;c[h+7108>>2]=-1;e=0;i=d;return e|0}function Jf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;if((e|0)==0){h=-6;i=g;return h|0}if(!((a[e]|0)==49&(f|0)==56)){h=-6;i=g;return h|0}if((b|0)==0){h=-2;i=g;return h|0}c[b+24>>2]=0;f=b+32|0;e=c[f>>2]|0;if((e|0)==0){c[f>>2]=1;c[b+40>>2]=0;j=1}else{j=e}e=b+36|0;if((c[e>>2]|0)==0){c[e>>2]=1}f=b+40|0;k=kb[j&1](c[f>>2]|0,1,7116)|0;if((k|0)==0){h=-4;i=g;return h|0}j=b+28|0;c[j>>2]=k;c[k+52>>2]=0;l=If(b,d)|0;if((l|0)==0){h=0;i=g;return h|0}mb[c[e>>2]&1](c[f>>2]|0,k);c[j>>2]=0;h=l;i=g;return h|0}function Kf(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0,Ac=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Gc=0,Hc=0,Ic=0,Jc=0,Kc=0,Lc=0,Mc=0,Nc=0,Oc=0,Pc=0,Qc=0,Rc=0,Sc=0,Tc=0,Uc=0,Vc=0,Wc=0,Xc=0,Yc=0,Zc=0,_c=0,$c=0,ad=0,bd=0,cd=0,dd=0,ed=0,fd=0,gd=0,hd=0,id=0,jd=0,kd=0,ld=0,md=0,nd=0,od=0,pd=0,qd=0,rd=0,sd=0,td=0,ud=0,vd=0,wd=0,xd=0,yd=0,zd=0,Ad=0,Bd=0,Cd=0,Dd=0,Ed=0,Fd=0,Gd=0,Hd=0,Id=0,Jd=0,Kd=0,Ld=0,Md=0,Nd=0,Od=0,Pd=0,Qd=0,Rd=0,Sd=0,Td=0,Ud=0,Vd=0,Wd=0,Xd=0,Yd=0,Zd=0,_d=0,$d=0,ae=0,be=0,ce=0,de=0,ee=0,fe=0,ge=0,he=0,ie=0,je=0,ke=0,le=0,me=0,ne=0,oe=0,pe=0,qe=0,re=0,se=0,te=0,ue=0,ve=0,we=0,xe=0,ye=0,ze=0,Ae=0,Be=0,Ce=0,De=0,Ee=0,Fe=0,Ge=0,He=0,Ie=0,Je=0,Ke=0,Le=0,Me=0,Ne=0,Oe=0,Pe=0,Qe=0,Re=0,Se=0,Te=0,Ue=0,Ve=0,We=0,Xe=0,Ye=0,Ze=0,_e=0,$e=0,af=0,bf=0,cf=0,df=0,ef=0,hf=0,jf=0,kf=0,lf=0,mf=0,nf=0,of=0,pf=0,qf=0,rf=0,sf=0,tf=0,uf=0,vf=0,wf=0,xf=0,yf=0,zf=0,Af=0,Bf=0,Cf=0,Df=0,Ef=0,Ff=0,Hf=0,If=0,Jf=0,Kf=0,Mf=0,Of=0,Pf=0,Qf=0,Rf=0,Sf=0,Tf=0,Uf=0,Vf=0,Wf=0,Xf=0,Yf=0,Zf=0,_f=0,$f=0,ag=0,bg=0,cg=0,dg=0,eg=0,fg=0,gg=0,hg=0,ig=0,jg=0,kg=0,lg=0,mg=0,ng=0,og=0,pg=0,qg=0,rg=0,sg=0,tg=0,ug=0,vg=0,wg=0,xg=0,yg=0,zg=0,Ag=0,Bg=0,Cg=0,Dg=0,Eg=0,Fg=0,Gg=0,Hg=0,Ig=0,Jg=0;h=i;i=i+16|0;j=h;if((f|0)==0){k=-2;i=h;return k|0}l=c[f+28>>2]|0;if((l|0)==0){k=-2;i=h;return k|0}m=f+12|0;n=c[m>>2]|0;if((n|0)==0){k=-2;i=h;return k|0}o=c[f>>2]|0;if((o|0)==0?(c[f+4>>2]|0)!=0:0){k=-2;i=h;return k|0}p=c[l>>2]|0;if((p|0)==11){c[l>>2]=12;q=12;r=c[f>>2]|0;s=c[m>>2]|0}else{q=p;r=o;s=n}n=f+16|0;o=c[n>>2]|0;p=f+4|0;t=c[p>>2]|0;u=l+56|0;v=l+60|0;w=l+8|0;x=l+24|0;y=j+1|0;z=l+16|0;A=l+32|0;B=f+24|0;C=l+36|0;D=l+20|0;E=f+48|0;F=l+64|0;G=l+12|0;H=(g+ -5|0)>>>0<2;I=l+4|0;J=l+76|0;K=l+84|0;L=l+80|0;M=l+88|0;N=(g|0)==6;O=l+7108|0;P=l+72|0;Q=l+7112|0;R=l+68|0;S=l+44|0;T=l+7104|0;U=l+48|0;V=l+52|0;W=l+40|0;X=f+20|0;Y=l+28|0;Z=l+96|0;_=l+100|0;$=l+92|0;aa=l+104|0;ba=l+1328|0;ca=l+108|0;da=l+112|0;ea=l+752|0;fa=l+624|0;ga=j+2|0;ha=j+3|0;ia=q;q=c[v>>2]|0;ja=t;ka=c[u>>2]|0;la=o;ma=r;r=o;o=s;s=0;a:while(1){b:do{switch(ia|0){case 28:{na=q;oa=ja;pa=ka;qa=la;ra=ma;sa=1;ta=285;break a;break};case 16:{if(q>>>0<14){ua=q;va=ja;wa=ka;xa=ma;while(1){if((va|0)==0){ya=ua;za=0;Aa=wa;Ba=la;Ca=xa;Da=r;Ea=s;break a}Ga=va+ -1|0;Ha=xa+1|0;Ia=(d[xa]<<ua)+wa|0;Ja=ua+8|0;if(Ja>>>0<14){ua=Ja;va=Ga;wa=Ia;xa=Ha}else{Ka=Ja;La=Ga;Ma=Ia;Na=Ha;break}}}else{Ka=q;La=ja;Ma=ka;Na=ma}xa=(Ma&31)+257|0;c[Z>>2]=xa;wa=(Ma>>>5&31)+1|0;c[_>>2]=wa;c[$>>2]=(Ma>>>10&15)+4;va=Ma>>>14;ua=Ka+ -14|0;if(xa>>>0>286|wa>>>0>30){c[B>>2]=21992;c[l>>2]=29;Oa=ua;Pa=La;Qa=va;Ra=la;Sa=Na;Ta=r;Ua=o;Va=s;break b}else{c[aa>>2]=0;c[l>>2]=17;Wa=0;Xa=ua;Ya=La;Za=va;_a=Na;ta=154;break b}break};case 21:{$a=c[P>>2]|0;ab=q;bb=ja;cb=ka;db=ma;eb=s;ta=221;break};case 23:{fb=c[P>>2]|0;gb=q;hb=ja;ib=ka;jb=ma;kb=s;ta=240;break};case 1:{if(q>>>0<16){va=q;ua=ja;wa=ka;xa=ma;while(1){if((ua|0)==0){ya=va;za=0;Aa=wa;Ba=la;Ca=xa;Da=r;Ea=s;break a}Ha=ua+ -1|0;Ia=xa+1|0;Ga=(d[xa]<<va)+wa|0;Ja=va+8|0;if(Ja>>>0<16){va=Ja;ua=Ha;wa=Ga;xa=Ia}else{lb=Ja;mb=Ha;nb=Ga;ob=Ia;break}}}else{lb=q;mb=ja;nb=ka;ob=ma}c[z>>2]=nb;if((nb&255|0)!=8){c[B>>2]=21824;c[l>>2]=29;Oa=lb;Pa=mb;Qa=nb;Ra=la;Sa=ob;Ta=r;Ua=o;Va=s;break b}if((nb&57344|0)!=0){c[B>>2]=21880;c[l>>2]=29;Oa=lb;Pa=mb;Qa=nb;Ra=la;Sa=ob;Ta=r;Ua=o;Va=s;break b}xa=c[A>>2]|0;if((xa|0)==0){pb=nb}else{c[xa>>2]=nb>>>8&1;pb=c[z>>2]|0}if((pb&512|0)!=0){a[j]=nb;a[y]=nb>>>8;c[x>>2]=gf(c[x>>2]|0,j,2)|0}c[l>>2]=2;qb=0;rb=mb;sb=0;tb=ob;ta=47;break};case 22:{ub=q;vb=ja;wb=ka;xb=ma;yb=s;ta=228;break};case 10:{zb=q;Ab=ja;Bb=ka;Cb=ma;ta=121;break};case 7:{Db=q;Eb=ja;Fb=ka;Gb=ma;ta=96;break};case 5:{Hb=q;Ib=ja;Jb=ka;Kb=ma;ta=73;break};case 8:{Lb=q;Mb=ja;Nb=ka;Ob=ma;ta=109;break};case 11:{Pb=q;Qb=ja;Rb=ka;Sb=ma;ta=124;break};case 12:{Tb=q;Ub=ja;Vb=ka;Wb=ma;ta=125;break};case 13:{xa=q&7;wa=ka>>>xa;ua=q-xa|0;if(ua>>>0<32){xa=ua;va=ja;Ia=wa;Ga=ma;while(1){if((va|0)==0){ya=xa;za=0;Aa=Ia;Ba=la;Ca=Ga;Da=r;Ea=s;break a}Ha=va+ -1|0;Ja=Ga+1|0;Xb=(d[Ga]<<xa)+Ia|0;Yb=xa+8|0;if(Yb>>>0<32){xa=Yb;va=Ha;Ia=Xb;Ga=Ja}else{Zb=Yb;_b=Ha;$b=Xb;ac=Ja;break}}}else{Zb=ua;_b=ja;$b=wa;ac=ma}Ga=$b&65535;if((Ga|0)==($b>>>16^65535|0)){c[F>>2]=Ga;c[l>>2]=14;if(N){na=0;oa=_b;pa=0;qa=la;ra=ac;sa=s;ta=285;break a}else{bc=0;cc=_b;dc=0;ec=ac;ta=143;break b}}else{c[B>>2]=21960;c[l>>2]=29;Oa=Zb;Pa=_b;Qa=$b;Ra=la;Sa=ac;Ta=r;Ua=o;Va=s;break b}break};case 14:{bc=q;cc=ja;dc=ka;ec=ma;ta=143;break};case 15:{fc=q;gc=ja;hc=ka;ic=ma;ta=144;break};case 17:{Ga=c[aa>>2]|0;if(Ga>>>0<(c[$>>2]|0)>>>0){Wa=Ga;Xa=q;Ya=ja;Za=ka;_a=ma;ta=154}else{jc=Ga;kc=q;lc=ja;mc=ka;nc=ma;ta=158}break};case 0:{Ga=c[w>>2]|0;if((Ga|0)==0){c[l>>2]=12;Oa=q;Pa=ja;Qa=ka;Ra=la;Sa=ma;Ta=r;Ua=o;Va=s;break b}if(q>>>0<16){Ia=q;va=ja;xa=ka;Ja=ma;while(1){if((va|0)==0){ya=Ia;za=0;Aa=xa;Ba=la;Ca=Ja;Da=r;Ea=s;break a}Xb=va+ -1|0;Ha=Ja+1|0;Yb=(d[Ja]<<Ia)+xa|0;oc=Ia+8|0;if(oc>>>0<16){Ia=oc;va=Xb;xa=Yb;Ja=Ha}else{pc=oc;qc=Xb;rc=Yb;sc=Ha;break}}}else{pc=q;qc=ja;rc=ka;sc=ma}if((Ga&2|0)!=0&(rc|0)==35615){c[x>>2]=gf(0,0,0)|0;a[j]=31;a[y]=-117;c[x>>2]=gf(c[x>>2]|0,j,2)|0;c[l>>2]=1;Oa=0;Pa=qc;Qa=0;Ra=la;Sa=sc;Ta=r;Ua=o;Va=s;break b}c[z>>2]=0;Ja=c[A>>2]|0;if((Ja|0)==0){tc=Ga}else{c[Ja+48>>2]=-1;tc=c[w>>2]|0}if((tc&1|0)!=0?((((rc<<8&65280)+(rc>>>8)|0)>>>0)%31|0|0)==0:0){if((rc&15|0)!=8){c[B>>2]=21824;c[l>>2]=29;Oa=pc;Pa=qc;Qa=rc;Ra=la;Sa=sc;Ta=r;Ua=o;Va=s;break b}Ja=rc>>>4;xa=pc+ -4|0;va=(Ja&15)+8|0;Ia=c[C>>2]|0;if((Ia|0)!=0){if(va>>>0>Ia>>>0){c[B>>2]=21856;c[l>>2]=29;Oa=xa;Pa=qc;Qa=Ja;Ra=la;Sa=sc;Ta=r;Ua=o;Va=s;break b}}else{c[C>>2]=va}c[D>>2]=1<<va;va=ff(0,0,0)|0;c[x>>2]=va;c[E>>2]=va;c[l>>2]=rc>>>12&2^11;Oa=0;Pa=qc;Qa=0;Ra=la;Sa=sc;Ta=r;Ua=o;Va=s;break b}c[B>>2]=21800;c[l>>2]=29;Oa=pc;Pa=qc;Qa=rc;Ra=la;Sa=sc;Ta=r;Ua=o;Va=s;break};case 24:{uc=q;vc=ja;wc=ka;xc=ma;yc=s;ta=246;break};case 9:{if(q>>>0<32){va=q;Ja=ja;xa=ka;Ia=ma;while(1){if((Ja|0)==0){ya=va;za=0;Aa=xa;Ba=la;Ca=Ia;Da=r;Ea=s;break a}wa=Ja+ -1|0;ua=Ia+1|0;Ha=(d[Ia]<<va)+xa|0;Yb=va+8|0;if(Yb>>>0<32){va=Yb;Ja=wa;xa=Ha;Ia=ua}else{zc=wa;Ac=Ha;Bc=ua;break}}}else{zc=ja;Ac=ka;Bc=ma}Ia=Fa(Ac|0)|0;c[x>>2]=Ia;c[E>>2]=Ia;c[l>>2]=10;zb=0;Ab=zc;Bb=0;Cb=Bc;ta=121;break};case 30:{ta=299;break a;break};case 18:{Cc=c[aa>>2]|0;Dc=q;Ec=ja;Fc=ka;Gc=ma;Hc=s;ta=164;break};case 6:{Ic=q;Jc=ja;Kc=ka;Lc=ma;ta=83;break};case 29:{ya=q;za=ja;Aa=ka;Ba=la;Ca=ma;Da=r;Ea=-3;break a;break};case 19:{Mc=q;Nc=ja;Oc=ka;Pc=ma;Qc=s;ta=201;break};case 20:{Rc=q;Sc=ja;Tc=ka;Uc=ma;Vc=s;ta=202;break};case 25:{if((la|0)==0){na=q;oa=ja;pa=ka;qa=0;ra=ma;sa=s;ta=285;break a}a[o]=c[F>>2];c[l>>2]=20;Oa=q;Pa=ja;Qa=ka;Ra=la+ -1|0;Sa=ma;Ta=r;Ua=o+1|0;Va=s;break};case 26:{if((c[w>>2]|0)!=0){if(q>>>0<32){Ia=q;xa=ja;Ja=ka;va=ma;while(1){if((xa|0)==0){ya=Ia;za=0;Aa=Ja;Ba=la;Ca=va;Da=r;Ea=s;break a}Ga=xa+ -1|0;ua=va+1|0;Ha=(d[va]<<Ia)+Ja|0;wa=Ia+8|0;if(wa>>>0<32){Ia=wa;xa=Ga;Ja=Ha;va=ua}else{Wc=wa;Xc=Ga;Yc=Ha;Zc=ua;break}}}else{Wc=q;Xc=ja;Yc=ka;Zc=ma}va=r-la|0;c[X>>2]=(c[X>>2]|0)+va;c[Y>>2]=(c[Y>>2]|0)+va;if((r|0)!=(la|0)){Ja=c[x>>2]|0;xa=o+(0-va)|0;if((c[z>>2]|0)==0){_c=ff(Ja,xa,va)|0}else{_c=gf(Ja,xa,va)|0}c[x>>2]=_c;c[E>>2]=_c}if((c[z>>2]|0)==0){$c=Fa(Yc|0)|0}else{$c=Yc}if(($c|0)==(c[x>>2]|0)){ad=0;bd=Xc;cd=0;dd=Zc;ed=la}else{c[B>>2]=22280;c[l>>2]=29;Oa=Wc;Pa=Xc;Qa=Yc;Ra=la;Sa=Zc;Ta=la;Ua=o;Va=s;break b}}else{ad=q;bd=ja;cd=ka;dd=ma;ed=r}c[l>>2]=27;fd=ad;gd=bd;hd=cd;id=dd;jd=ed;ta=277;break};case 27:{fd=q;gd=ja;hd=ka;id=ma;jd=r;ta=277;break};case 2:{if(q>>>0<32){qb=q;rb=ja;sb=ka;tb=ma;ta=47}else{kd=ja;ld=ka;md=ma;ta=49}break};case 4:{nd=q;od=ja;pd=ka;qd=ma;ta=62;break};case 3:{if(q>>>0<16){rd=q;sd=ja;td=ka;ud=ma;ta=55}else{vd=ja;wd=ka;xd=ma;ta=57}break};default:{k=-2;ta=300;break a}}}while(0);if((ta|0)==47){while(1){ta=0;if((rb|0)==0){ya=qb;za=0;Aa=sb;Ba=la;Ca=tb;Da=r;Ea=s;break a}va=rb+ -1|0;xa=tb+1|0;Ja=(d[tb]<<qb)+sb|0;Ia=qb+8|0;if(Ia>>>0<32){qb=Ia;rb=va;sb=Ja;tb=xa;ta=47}else{kd=va;ld=Ja;md=xa;ta=49;break}}}else if((ta|0)==121){ta=0;if((c[G>>2]|0)==0){ta=122;break}xa=ff(0,0,0)|0;c[x>>2]=xa;c[E>>2]=xa;c[l>>2]=11;Pb=zb;Qb=Ab;Rb=Bb;Sb=Cb;ta=124}else if((ta|0)==143){ta=0;c[l>>2]=15;fc=bc;gc=cc;hc=dc;ic=ec;ta=144}else if((ta|0)==154){while(1){ta=0;if(Xa>>>0<3){xa=Xa;Ja=Ya;va=Za;Ia=_a;while(1){if((Ja|0)==0){ya=xa;za=0;Aa=va;Ba=la;Ca=Ia;Da=r;Ea=s;break a}ua=Ja+ -1|0;Ha=Ia+1|0;Ga=(d[Ia]<<xa)+va|0;wa=xa+8|0;if(wa>>>0<3){xa=wa;Ja=ua;va=Ga;Ia=Ha}else{yd=wa;zd=ua;Ad=Ga;Bd=Ha;break}}}else{yd=Xa;zd=Ya;Ad=Za;Bd=_a}c[aa>>2]=Wa+1;b[l+(e[21760+(Wa<<1)>>1]<<1)+112>>1]=Ad&7;Ia=Ad>>>3;va=yd+ -3|0;Ja=c[aa>>2]|0;if(Ja>>>0<(c[$>>2]|0)>>>0){Wa=Ja;Xa=va;Ya=zd;Za=Ia;_a=Bd;ta=154}else{jc=Ja;kc=va;lc=zd;mc=Ia;nc=Bd;ta=158;break}}}else if((ta|0)==277){ta=0;if((c[w>>2]|0)==0){Cd=fd;Dd=gd;Ed=hd;Fd=id;ta=284;break}if((c[z>>2]|0)==0){Cd=fd;Dd=gd;Ed=hd;Fd=id;ta=284;break}if(fd>>>0<32){Ia=fd;va=gd;Ja=hd;xa=id;while(1){if((va|0)==0){ya=Ia;za=0;Aa=Ja;Ba=la;Ca=xa;Da=jd;Ea=s;break a}Ha=va+ -1|0;Ga=xa+1|0;ua=(d[xa]<<Ia)+Ja|0;wa=Ia+8|0;if(wa>>>0<32){Ia=wa;va=Ha;Ja=ua;xa=Ga}else{Gd=wa;Hd=Ha;Id=ua;Jd=Ga;break}}}else{Gd=fd;Hd=gd;Id=hd;Jd=id}if((Id|0)==(c[Y>>2]|0)){Cd=0;Dd=Hd;Ed=0;Fd=Jd;ta=284;break}c[B>>2]=22304;c[l>>2]=29;Oa=Gd;Pa=Hd;Qa=Id;Ra=la;Sa=Jd;Ta=jd;Ua=o;Va=s}do{if((ta|0)==49){ta=0;xa=c[A>>2]|0;if((xa|0)!=0){c[xa+4>>2]=ld}if((c[z>>2]&512|0)!=0){a[j]=ld;a[y]=ld>>>8;a[ga]=ld>>>16;a[ha]=ld>>>24;c[x>>2]=gf(c[x>>2]|0,j,4)|0}c[l>>2]=3;rd=0;sd=kd;td=0;ud=md;ta=55}else if((ta|0)==124){ta=0;if(H){na=Pb;oa=Qb;pa=Rb;qa=la;ra=Sb;sa=s;ta=285;break a}else{Tb=Pb;Ub=Qb;Vb=Rb;Wb=Sb;ta=125}}else if((ta|0)==144){ta=0;xa=c[F>>2]|0;if((xa|0)==0){c[l>>2]=11;Oa=fc;Pa=gc;Qa=hc;Ra=la;Sa=ic;Ta=r;Ua=o;Va=s;break}Ja=xa>>>0>gc>>>0?gc:xa;xa=Ja>>>0>la>>>0?la:Ja;if((xa|0)==0){na=fc;oa=gc;pa=hc;qa=la;ra=ic;sa=s;ta=285;break a}Kg(o|0,ic|0,xa|0)|0;c[F>>2]=(c[F>>2]|0)-xa;Oa=fc;Pa=gc-xa|0;Qa=hc;Ra=la-xa|0;Sa=ic+xa|0;Ta=r;Ua=o+xa|0;Va=s}else if((ta|0)==158){ta=0;if(jc>>>0<19){xa=jc;while(1){Ja=xa+1|0;b[l+(e[21760+(xa<<1)>>1]<<1)+112>>1]=0;if((Ja|0)==19){break}else{xa=Ja}}c[aa>>2]=19}c[ca>>2]=ba;c[J>>2]=ba;c[K>>2]=7;xa=Nf(0,da,19,ca,K,ea)|0;if((xa|0)==0){c[aa>>2]=0;c[l>>2]=18;Cc=0;Dc=kc;Ec=lc;Fc=mc;Gc=nc;Hc=0;ta=164;break}else{c[B>>2]=22032;c[l>>2]=29;Oa=kc;Pa=lc;Qa=mc;Ra=la;Sa=nc;Ta=r;Ua=o;Va=xa;break}}}while(0);c:do{if((ta|0)==55){while(1){ta=0;if((sd|0)==0){ya=rd;za=0;Aa=td;Ba=la;Ca=ud;Da=r;Ea=s;break a}xa=sd+ -1|0;Ja=ud+1|0;va=(d[ud]<<rd)+td|0;Ia=rd+8|0;if(Ia>>>0<16){rd=Ia;sd=xa;td=va;ud=Ja;ta=55}else{vd=xa;wd=va;xd=Ja;ta=57;break}}}else if((ta|0)==125){ta=0;if((c[I>>2]|0)!=0){Ja=Tb&7;c[l>>2]=26;Oa=Tb-Ja|0;Pa=Ub;Qa=Vb>>>Ja;Ra=la;Sa=Wb;Ta=r;Ua=o;Va=s;break}if(Tb>>>0<3){Ja=Tb;va=Ub;xa=Vb;Ia=Wb;while(1){if((va|0)==0){ya=Ja;za=0;Aa=xa;Ba=la;Ca=Ia;Da=r;Ea=s;break a}Ga=va+ -1|0;ua=Ia+1|0;Ha=(d[Ia]<<Ja)+xa|0;wa=Ja+8|0;if(wa>>>0<3){Ja=wa;va=Ga;xa=Ha;Ia=ua}else{Kd=wa;Ld=Ga;Md=Ha;Nd=ua;break}}}else{Kd=Tb;Ld=Ub;Md=Vb;Nd=Wb}c[I>>2]=Md&1;Ia=Md>>>1&3;if((Ia|0)==0){c[l>>2]=13}else if((Ia|0)==1){c[J>>2]=22328;c[K>>2]=9;c[L>>2]=24376;c[M>>2]=5;c[l>>2]=19;if(N){ta=133;break a}}else if((Ia|0)==2){c[l>>2]=16}else if((Ia|0)==3){c[B>>2]=21936;c[l>>2]=29}Oa=Kd+ -3|0;Pa=Ld;Qa=Md>>>3;Ra=la;Sa=Nd;Ta=r;Ua=o;Va=s}else if((ta|0)==164){ta=0;Ia=c[Z>>2]|0;xa=c[_>>2]|0;do{if(Cc>>>0<(xa+Ia|0)>>>0){va=Cc;Ja=xa;ua=Ia;Ha=Dc;Ga=Ec;wa=Fc;Yb=Gc;d:while(1){Xb=(1<<c[K>>2])+ -1|0;oc=Xb&wa;Od=c[J>>2]|0;Pd=d[Od+(oc<<2)+1|0]|0;if(Pd>>>0>Ha>>>0){Qd=Ha;Rd=Ga;Sd=wa;Td=Yb;while(1){if((Rd|0)==0){ya=Qd;za=0;Aa=Sd;Ba=la;Ca=Td;Da=r;Ea=Hc;break a}Ud=Rd+ -1|0;Vd=Td+1|0;Wd=(d[Td]<<Qd)+Sd|0;Xd=Qd+8|0;Yd=Xb&Wd;Zd=d[Od+(Yd<<2)+1|0]|0;if(Zd>>>0>Xd>>>0){Qd=Xd;Rd=Ud;Sd=Wd;Td=Vd}else{_d=Zd;$d=Yd;ae=Xd;be=Ud;ce=Wd;de=Vd;break}}}else{_d=Pd;$d=oc;ae=Ha;be=Ga;ce=wa;de=Yb}Td=b[Od+($d<<2)+2>>1]|0;e:do{if((Td&65535)<16){if(ae>>>0<_d>>>0){Sd=ae;Rd=be;Qd=ce;Xb=de;while(1){if((Rd|0)==0){ya=Sd;za=0;Aa=Qd;Ba=la;Ca=Xb;Da=r;Ea=Hc;break a}Vd=Rd+ -1|0;Wd=Xb+1|0;Ud=(d[Xb]<<Sd)+Qd|0;Xd=Sd+8|0;if(Xd>>>0<_d>>>0){Sd=Xd;Rd=Vd;Qd=Ud;Xb=Wd}else{ee=Xd;fe=Vd;ge=Ud;he=Wd;break}}}else{ee=ae;fe=be;ge=ce;he=de}c[aa>>2]=va+1;b[l+(va<<1)+112>>1]=Td;ie=ee-_d|0;je=fe;ke=ge>>>_d;le=he}else{if(Td<<16>>16==16){Xb=_d+2|0;if(ae>>>0<Xb>>>0){Qd=ae;Rd=be;Sd=ce;Wd=de;while(1){if((Rd|0)==0){ya=Qd;za=0;Aa=Sd;Ba=la;Ca=Wd;Da=r;Ea=Hc;break a}Ud=Rd+ -1|0;Vd=Wd+1|0;Xd=(d[Wd]<<Qd)+Sd|0;Yd=Qd+8|0;if(Yd>>>0<Xb>>>0){Qd=Yd;Rd=Ud;Sd=Xd;Wd=Vd}else{me=Yd;ne=Ud;oe=Xd;pe=Vd;break}}}else{me=ae;ne=be;oe=ce;pe=de}qe=oe>>>_d;re=me-_d|0;if((va|0)==0){ta=181;break d}se=re+ -2|0;te=(qe&3)+3|0;ue=ne;ve=qe>>>2;we=b[l+(va+ -1<<1)+112>>1]|0;xe=pe}else if(Td<<16>>16==17){Wd=_d+3|0;if(ae>>>0<Wd>>>0){Sd=ae;Rd=be;Qd=ce;Xb=de;while(1){if((Rd|0)==0){ya=Sd;za=0;Aa=Qd;Ba=la;Ca=Xb;Da=r;Ea=Hc;break a}Vd=Rd+ -1|0;Xd=Xb+1|0;Ud=(d[Xb]<<Sd)+Qd|0;Yd=Sd+8|0;if(Yd>>>0<Wd>>>0){Sd=Yd;Rd=Vd;Qd=Ud;Xb=Xd}else{ye=Yd;ze=Vd;Ae=Ud;Be=Xd;break}}}else{ye=ae;ze=be;Ae=ce;Be=de}Xb=Ae>>>_d;se=-3-_d+ye|0;te=(Xb&7)+3|0;ue=ze;ve=Xb>>>3;we=0;xe=Be}else{Xb=_d+7|0;if(ae>>>0<Xb>>>0){Qd=ae;Rd=be;Sd=ce;Wd=de;while(1){if((Rd|0)==0){ya=Qd;za=0;Aa=Sd;Ba=la;Ca=Wd;Da=r;Ea=Hc;break a}Xd=Rd+ -1|0;Ud=Wd+1|0;Vd=(d[Wd]<<Qd)+Sd|0;Yd=Qd+8|0;if(Yd>>>0<Xb>>>0){Qd=Yd;Rd=Xd;Sd=Vd;Wd=Ud}else{Ce=Yd;De=Xd;Ee=Vd;Fe=Ud;break}}}else{Ce=ae;De=be;Ee=ce;Fe=de}Wd=Ee>>>_d;se=-7-_d+Ce|0;te=(Wd&127)+11|0;ue=De;ve=Wd>>>7;we=0;xe=Fe}if((va+te|0)>>>0>(Ja+ua|0)>>>0){ta=190;break d}else{Ge=va;He=te}while(1){Wd=He+ -1|0;c[aa>>2]=Ge+1;b[l+(Ge<<1)+112>>1]=we;if((Wd|0)==0){ie=se;je=ue;ke=ve;le=xe;break e}Ge=c[aa>>2]|0;He=Wd}}}while(0);Td=c[aa>>2]|0;Ie=c[Z>>2]|0;Od=c[_>>2]|0;if(Td>>>0<(Od+Ie|0)>>>0){va=Td;Ja=Od;ua=Ie;Ha=ie;Ga=je;wa=ke;Yb=le}else{ta=193;break}}if((ta|0)==181){ta=0;c[B>>2]=22064;c[l>>2]=29;Oa=re;Pa=ne;Qa=qe;Ra=la;Sa=pe;Ta=r;Ua=o;Va=Hc;break c}else if((ta|0)==190){ta=0;c[B>>2]=22064;c[l>>2]=29;Oa=se;Pa=ue;Qa=ve;Ra=la;Sa=xe;Ta=r;Ua=o;Va=Hc;break c}else if((ta|0)==193){ta=0;if((c[l>>2]|0)==29){Oa=ie;Pa=je;Qa=ke;Ra=la;Sa=le;Ta=r;Ua=o;Va=Hc;break c}else{Je=Ie;Ke=ie;Le=je;Me=ke;Ne=le;break}}}else{Je=Ia;Ke=Dc;Le=Ec;Me=Fc;Ne=Gc}}while(0);if((b[fa>>1]|0)==0){c[B>>2]=22096;c[l>>2]=29;Oa=Ke;Pa=Le;Qa=Me;Ra=la;Sa=Ne;Ta=r;Ua=o;Va=Hc;break}c[ca>>2]=ba;c[J>>2]=ba;c[K>>2]=9;Ia=Nf(1,da,Je,ca,K,ea)|0;if((Ia|0)!=0){c[B>>2]=22136;c[l>>2]=29;Oa=Ke;Pa=Le;Qa=Me;Ra=la;Sa=Ne;Ta=r;Ua=o;Va=Ia;break}c[L>>2]=c[ca>>2];c[M>>2]=6;Ia=Nf(2,l+(c[Z>>2]<<1)+112|0,c[_>>2]|0,ca,M,ea)|0;if((Ia|0)==0){c[l>>2]=19;if(N){na=Ke;oa=Le;pa=Me;qa=la;ra=Ne;sa=0;ta=285;break a}else{Mc=Ke;Nc=Le;Oc=Me;Pc=Ne;Qc=0;ta=201;break}}else{c[B>>2]=22168;c[l>>2]=29;Oa=Ke;Pa=Le;Qa=Me;Ra=la;Sa=Ne;Ta=r;Ua=o;Va=Ia;break}}}while(0);if((ta|0)==57){ta=0;Ia=c[A>>2]|0;if((Ia|0)!=0){c[Ia+8>>2]=wd&255;c[Ia+12>>2]=wd>>>8}if((c[z>>2]&512|0)!=0){a[j]=wd;a[y]=wd>>>8;c[x>>2]=gf(c[x>>2]|0,j,2)|0}c[l>>2]=4;nd=0;od=vd;pd=0;qd=xd;ta=62}else if((ta|0)==201){ta=0;c[l>>2]=20;Rc=Mc;Sc=Nc;Tc=Oc;Uc=Pc;Vc=Qc;ta=202}do{if((ta|0)==62){ta=0;Ia=c[z>>2]|0;if((Ia&1024|0)==0){xa=c[A>>2]|0;if((xa|0)==0){Oe=nd;Pe=od;Qe=pd;Re=qd}else{c[xa+16>>2]=0;Oe=nd;Pe=od;Qe=pd;Re=qd}}else{if(nd>>>0<16){xa=nd;Yb=od;wa=pd;Ga=qd;while(1){if((Yb|0)==0){ya=xa;za=0;Aa=wa;Ba=la;Ca=Ga;Da=r;Ea=s;break a}Ha=Yb+ -1|0;ua=Ga+1|0;Ja=(d[Ga]<<xa)+wa|0;va=xa+8|0;if(va>>>0<16){xa=va;Yb=Ha;wa=Ja;Ga=ua}else{Se=Ha;Te=Ja;Ue=ua;break}}}else{Se=od;Te=pd;Ue=qd}c[F>>2]=Te;Ga=c[A>>2]|0;if((Ga|0)==0){Ve=Ia}else{c[Ga+20>>2]=Te;Ve=c[z>>2]|0}if((Ve&512|0)==0){Oe=0;Pe=Se;Qe=0;Re=Ue}else{a[j]=Te;a[y]=Te>>>8;c[x>>2]=gf(c[x>>2]|0,j,2)|0;Oe=0;Pe=Se;Qe=0;Re=Ue}}c[l>>2]=5;Hb=Oe;Ib=Pe;Jb=Qe;Kb=Re;ta=73}else if((ta|0)==202){ta=0;if(Sc>>>0>5&la>>>0>257){c[m>>2]=o;c[n>>2]=la;c[f>>2]=Uc;c[p>>2]=Sc;c[u>>2]=Tc;c[v>>2]=Rc;Gf(f,r);Ga=c[m>>2]|0;wa=c[n>>2]|0;Yb=c[f>>2]|0;xa=c[p>>2]|0;ua=c[u>>2]|0;Ja=c[v>>2]|0;if((c[l>>2]|0)!=11){Oa=Ja;Pa=xa;Qa=ua;Ra=wa;Sa=Yb;Ta=r;Ua=Ga;Va=Vc;break}c[O>>2]=-1;Oa=Ja;Pa=xa;Qa=ua;Ra=wa;Sa=Yb;Ta=r;Ua=Ga;Va=Vc;break}c[O>>2]=0;Ga=(1<<c[K>>2])+ -1|0;Yb=Ga&Tc;wa=c[J>>2]|0;ua=a[wa+(Yb<<2)+1|0]|0;xa=ua&255;if(xa>>>0>Rc>>>0){Ja=Rc;Ha=Sc;va=Tc;Od=Uc;while(1){if((Ha|0)==0){ya=Ja;za=0;Aa=va;Ba=la;Ca=Od;Da=r;Ea=Vc;break a}Td=Ha+ -1|0;oc=Od+1|0;Pd=(d[Od]<<Ja)+va|0;Wd=Ja+8|0;Sd=Ga&Pd;Rd=a[wa+(Sd<<2)+1|0]|0;Qd=Rd&255;if(Qd>>>0>Wd>>>0){Ja=Wd;Ha=Td;va=Pd;Od=oc}else{We=Rd;Xe=Qd;Ye=Sd;Ze=Wd;_e=Td;$e=Pd;af=oc;break}}}else{We=ua;Xe=xa;Ye=Yb;Ze=Rc;_e=Sc;$e=Tc;af=Uc}Od=a[wa+(Ye<<2)|0]|0;va=b[wa+(Ye<<2)+2>>1]|0;Ha=Od&255;if(!(Od<<24>>24==0)){if((Ha&240|0)==0){Ja=va&65535;Ga=(1<<Xe+Ha)+ -1|0;Ha=(($e&Ga)>>>Xe)+Ja|0;Ia=a[wa+(Ha<<2)+1|0]|0;if(((Ia&255)+Xe|0)>>>0>Ze>>>0){oc=Ze;Pd=_e;Td=$e;Wd=af;while(1){if((Pd|0)==0){ya=oc;za=0;Aa=Td;Ba=la;Ca=Wd;Da=r;Ea=Vc;break a}Sd=Pd+ -1|0;Qd=Wd+1|0;Rd=(d[Wd]<<oc)+Td|0;Xb=oc+8|0;Ud=((Rd&Ga)>>>Xe)+Ja|0;Vd=a[wa+(Ud<<2)+1|0]|0;if(((Vd&255)+Xe|0)>>>0>Xb>>>0){oc=Xb;Pd=Sd;Td=Rd;Wd=Qd}else{bf=Ud;cf=Vd;df=Xb;ef=Sd;hf=Rd;jf=Qd;break}}}else{bf=Ha;cf=Ia;df=Ze;ef=_e;hf=$e;jf=af}Wd=b[wa+(bf<<2)+2>>1]|0;Td=a[wa+(bf<<2)|0]|0;c[O>>2]=Xe;kf=Xe;lf=df-Xe|0;mf=ef;nf=Td;of=cf;pf=Wd;qf=hf>>>Xe;rf=jf}else{kf=0;lf=Ze;mf=_e;nf=Od;of=We;pf=va;qf=$e;rf=af}}else{kf=0;lf=Ze;mf=_e;nf=0;of=We;pf=va;qf=$e;rf=af}Wd=of&255;Td=qf>>>Wd;Pd=lf-Wd|0;c[O>>2]=kf+Wd;c[F>>2]=pf&65535;Wd=nf&255;if(nf<<24>>24==0){c[l>>2]=25;Oa=Pd;Pa=mf;Qa=Td;Ra=la;Sa=rf;Ta=r;Ua=o;Va=Vc;break}if((Wd&32|0)!=0){c[O>>2]=-1;c[l>>2]=11;Oa=Pd;Pa=mf;Qa=Td;Ra=la;Sa=rf;Ta=r;Ua=o;Va=Vc;break}if((Wd&64|0)==0){oc=Wd&15;c[P>>2]=oc;c[l>>2]=21;$a=oc;ab=Pd;bb=mf;cb=Td;db=rf;eb=Vc;ta=221;break}else{c[B>>2]=22192;c[l>>2]=29;Oa=Pd;Pa=mf;Qa=Td;Ra=la;Sa=rf;Ta=r;Ua=o;Va=Vc;break}}}while(0);if((ta|0)==73){ta=0;Td=c[z>>2]|0;if((Td&1024|0)!=0){Pd=c[F>>2]|0;oc=Pd>>>0>Ib>>>0?Ib:Pd;if((oc|0)==0){sf=Pd;tf=Ib;uf=Kb}else{Wd=c[A>>2]|0;if((Wd|0)!=0?(Ja=c[Wd+16>>2]|0,(Ja|0)!=0):0){Ga=(c[Wd+20>>2]|0)-Pd|0;Pd=c[Wd+24>>2]|0;Kg(Ja+Ga|0,Kb|0,((Ga+oc|0)>>>0>Pd>>>0?Pd-Ga|0:oc)|0)|0;vf=c[z>>2]|0}else{vf=Td}if((vf&512|0)!=0){c[x>>2]=gf(c[x>>2]|0,Kb,oc)|0}Td=(c[F>>2]|0)-oc|0;c[F>>2]=Td;sf=Td;tf=Ib-oc|0;uf=Kb+oc|0}if((sf|0)==0){wf=tf;xf=uf}else{na=Hb;oa=tf;pa=Jb;qa=la;ra=uf;sa=s;ta=285;break}}else{wf=Ib;xf=Kb}c[F>>2]=0;c[l>>2]=6;Ic=Hb;Jc=wf;Kc=Jb;Lc=xf;ta=83}else if((ta|0)==221){ta=0;if(($a|0)==0){yf=c[F>>2]|0;zf=ab;Af=bb;Bf=cb;Cf=db}else{if(ab>>>0<$a>>>0){oc=ab;Td=bb;Ga=cb;Pd=db;while(1){if((Td|0)==0){ya=oc;za=0;Aa=Ga;Ba=la;Ca=Pd;Da=r;Ea=eb;break a}Ja=Td+ -1|0;Wd=Pd+1|0;Yb=(d[Pd]<<oc)+Ga|0;xa=oc+8|0;if(xa>>>0<$a>>>0){oc=xa;Td=Ja;Ga=Yb;Pd=Wd}else{Df=xa;Ef=Ja;Ff=Yb;Hf=Wd;break}}}else{Df=ab;Ef=bb;Ff=cb;Hf=db}Pd=(c[F>>2]|0)+((1<<$a)+ -1&Ff)|0;c[F>>2]=Pd;c[O>>2]=(c[O>>2]|0)+$a;yf=Pd;zf=Df-$a|0;Af=Ef;Bf=Ff>>>$a;Cf=Hf}c[Q>>2]=yf;c[l>>2]=22;ub=zf;vb=Af;wb=Bf;xb=Cf;yb=eb;ta=228}do{if((ta|0)==83){ta=0;if((c[z>>2]&2048|0)==0){Pd=c[A>>2]|0;if((Pd|0)==0){If=Jc;Jf=Lc}else{c[Pd+28>>2]=0;If=Jc;Jf=Lc}}else{if((Jc|0)==0){na=Ic;oa=0;pa=Kc;qa=la;ra=Lc;sa=s;ta=285;break a}else{Kf=0}while(1){Mf=Kf+1|0;Pd=a[Lc+Kf|0]|0;Ga=c[A>>2]|0;if(((Ga|0)!=0?(Td=c[Ga+28>>2]|0,(Td|0)!=0):0)?(oc=c[F>>2]|0,oc>>>0<(c[Ga+32>>2]|0)>>>0):0){c[F>>2]=oc+1;a[Td+oc|0]=Pd}Of=Pd<<24>>24!=0;if(Of&Mf>>>0<Jc>>>0){Kf=Mf}else{break}}if((c[z>>2]&512|0)!=0){c[x>>2]=gf(c[x>>2]|0,Lc,Mf)|0}va=Jc-Mf|0;Od=Lc+Mf|0;if(Of){na=Ic;oa=va;pa=Kc;qa=la;ra=Od;sa=s;ta=285;break a}else{If=va;Jf=Od}}c[F>>2]=0;c[l>>2]=7;Db=Ic;Eb=If;Fb=Kc;Gb=Jf;ta=96}else if((ta|0)==228){ta=0;Od=(1<<c[M>>2])+ -1|0;va=Od&wb;wa=c[L>>2]|0;Ia=a[wa+(va<<2)+1|0]|0;Ha=Ia&255;if(Ha>>>0>ub>>>0){Pd=ub;oc=vb;Td=wb;Ga=xb;while(1){if((oc|0)==0){ya=Pd;za=0;Aa=Td;Ba=la;Ca=Ga;Da=r;Ea=yb;break a}Wd=oc+ -1|0;Yb=Ga+1|0;Ja=(d[Ga]<<Pd)+Td|0;xa=Pd+8|0;ua=Od&Ja;Qd=a[wa+(ua<<2)+1|0]|0;Rd=Qd&255;if(Rd>>>0>xa>>>0){Pd=xa;oc=Wd;Td=Ja;Ga=Yb}else{Pf=Qd;Qf=Rd;Rf=ua;Sf=xa;Tf=Wd;Uf=Ja;Vf=Yb;break}}}else{Pf=Ia;Qf=Ha;Rf=va;Sf=ub;Tf=vb;Uf=wb;Vf=xb}Ga=a[wa+(Rf<<2)|0]|0;Td=b[wa+(Rf<<2)+2>>1]|0;oc=Ga&255;if((oc&240|0)==0){Pd=Td&65535;Od=(1<<Qf+oc)+ -1|0;oc=((Uf&Od)>>>Qf)+Pd|0;Yb=a[wa+(oc<<2)+1|0]|0;if(((Yb&255)+Qf|0)>>>0>Sf>>>0){Ja=Sf;Wd=Tf;xa=Uf;ua=Vf;while(1){if((Wd|0)==0){ya=Ja;za=0;Aa=xa;Ba=la;Ca=ua;Da=r;Ea=yb;break a}Rd=Wd+ -1|0;Qd=ua+1|0;Sd=(d[ua]<<Ja)+xa|0;Xb=Ja+8|0;Vd=((Sd&Od)>>>Qf)+Pd|0;Ud=a[wa+(Vd<<2)+1|0]|0;if(((Ud&255)+Qf|0)>>>0>Xb>>>0){Ja=Xb;Wd=Rd;xa=Sd;ua=Qd}else{Wf=Vd;Xf=Ud;Yf=Xb;Zf=Rd;_f=Sd;$f=Qd;break}}}else{Wf=oc;Xf=Yb;Yf=Sf;Zf=Tf;_f=Uf;$f=Vf}ua=b[wa+(Wf<<2)+2>>1]|0;xa=a[wa+(Wf<<2)|0]|0;Wd=(c[O>>2]|0)+Qf|0;c[O>>2]=Wd;ag=Wd;bg=Yf-Qf|0;cg=Zf;dg=xa;eg=Xf;fg=ua;gg=_f>>>Qf;hg=$f}else{ag=c[O>>2]|0;bg=Sf;cg=Tf;dg=Ga;eg=Pf;fg=Td;gg=Uf;hg=Vf}ua=eg&255;xa=gg>>>ua;Wd=bg-ua|0;c[O>>2]=ag+ua;ua=dg&255;if((ua&64|0)==0){c[R>>2]=fg&65535;Ja=ua&15;c[P>>2]=Ja;c[l>>2]=23;fb=Ja;gb=Wd;hb=cg;ib=xa;jb=hg;kb=yb;ta=240;break}else{c[B>>2]=22224;c[l>>2]=29;Oa=Wd;Pa=cg;Qa=xa;Ra=la;Sa=hg;Ta=r;Ua=o;Va=yb;break}}}while(0);if((ta|0)==96){ta=0;if((c[z>>2]&4096|0)==0){xa=c[A>>2]|0;if((xa|0)==0){ig=Eb;jg=Gb}else{c[xa+36>>2]=0;ig=Eb;jg=Gb}}else{if((Eb|0)==0){na=Db;oa=0;pa=Fb;qa=la;ra=Gb;sa=s;ta=285;break}else{kg=0}while(1){lg=kg+1|0;xa=a[Gb+kg|0]|0;Wd=c[A>>2]|0;if(((Wd|0)!=0?(Ja=c[Wd+36>>2]|0,(Ja|0)!=0):0)?(ua=c[F>>2]|0,ua>>>0<(c[Wd+40>>2]|0)>>>0):0){c[F>>2]=ua+1;a[Ja+ua|0]=xa}mg=xa<<24>>24!=0;if(mg&lg>>>0<Eb>>>0){kg=lg}else{break}}if((c[z>>2]&512|0)!=0){c[x>>2]=gf(c[x>>2]|0,Gb,lg)|0}xa=Eb-lg|0;ua=Gb+lg|0;if(mg){na=Db;oa=xa;pa=Fb;qa=la;ra=ua;sa=s;ta=285;break}else{ig=xa;jg=ua}}c[l>>2]=8;Lb=Db;Mb=ig;Nb=Fb;Ob=jg;ta=109}else if((ta|0)==240){ta=0;if((fb|0)==0){ng=gb;og=hb;pg=ib;qg=jb}else{if(gb>>>0<fb>>>0){ua=gb;xa=hb;Ja=ib;Wd=jb;while(1){if((xa|0)==0){ya=ua;za=0;Aa=Ja;Ba=la;Ca=Wd;Da=r;Ea=kb;break a}Pd=xa+ -1|0;Od=Wd+1|0;va=(d[Wd]<<ua)+Ja|0;Ha=ua+8|0;if(Ha>>>0<fb>>>0){ua=Ha;xa=Pd;Ja=va;Wd=Od}else{rg=Ha;sg=Pd;tg=va;ug=Od;break}}}else{rg=gb;sg=hb;tg=ib;ug=jb}c[R>>2]=(c[R>>2]|0)+((1<<fb)+ -1&tg);c[O>>2]=(c[O>>2]|0)+fb;ng=rg-fb|0;og=sg;pg=tg>>>fb;qg=ug}c[l>>2]=24;uc=ng;vc=og;wc=pg;xc=qg;yc=kb;ta=246}do{if((ta|0)==109){ta=0;Wd=c[z>>2]|0;if((Wd&512|0)!=0){if(Lb>>>0<16){Ja=Lb;xa=Mb;ua=Nb;Od=Ob;while(1){if((xa|0)==0){ya=Ja;za=0;Aa=ua;Ba=la;Ca=Od;Da=r;Ea=s;break a}va=xa+ -1|0;Pd=Od+1|0;Ha=(d[Od]<<Ja)+ua|0;Ia=Ja+8|0;if(Ia>>>0<16){Ja=Ia;xa=va;ua=Ha;Od=Pd}else{vg=Ia;wg=va;xg=Ha;yg=Pd;break}}}else{vg=Lb;wg=Mb;xg=Nb;yg=Ob}if((xg|0)==(c[x>>2]&65535|0)){zg=0;Ag=wg;Bg=0;Cg=yg}else{c[B>>2]=21912;c[l>>2]=29;Oa=vg;Pa=wg;Qa=xg;Ra=la;Sa=yg;Ta=r;Ua=o;Va=s;break}}else{zg=Lb;Ag=Mb;Bg=Nb;Cg=Ob}Od=c[A>>2]|0;if((Od|0)!=0){c[Od+44>>2]=Wd>>>9&1;c[Od+48>>2]=1}Od=gf(0,0,0)|0;c[x>>2]=Od;c[E>>2]=Od;c[l>>2]=11;Oa=zg;Pa=Ag;Qa=Bg;Ra=la;Sa=Cg;Ta=r;Ua=o;Va=s}else if((ta|0)==246){ta=0;if((la|0)==0){na=uc;oa=vc;pa=wc;qa=0;ra=xc;sa=yc;ta=285;break a}Od=r-la|0;ua=c[R>>2]|0;if(ua>>>0>Od>>>0){xa=ua-Od|0;if(xa>>>0>(c[S>>2]|0)>>>0?(c[T>>2]|0)!=0:0){c[B>>2]=22248;c[l>>2]=29;Oa=uc;Pa=vc;Qa=wc;Ra=la;Sa=xc;Ta=r;Ua=o;Va=yc;break}Od=c[U>>2]|0;if(xa>>>0>Od>>>0){Ja=xa-Od|0;Dg=Ja;Eg=(c[V>>2]|0)+((c[W>>2]|0)-Ja)|0}else{Dg=xa;Eg=(c[V>>2]|0)+(Od-xa)|0}xa=c[F>>2]|0;Fg=xa;Gg=Dg>>>0>xa>>>0?xa:Dg;Hg=Eg}else{xa=c[F>>2]|0;Fg=xa;Gg=xa;Hg=o+(0-ua)|0}ua=Gg>>>0>la>>>0?la:Gg;c[F>>2]=Fg-ua;xa=~la;Od=~Gg;Ja=xa>>>0>Od>>>0?xa:Od;Od=ua;xa=Hg;Td=o;while(1){a[Td]=a[xa]|0;Od=Od+ -1|0;if((Od|0)==0){break}else{xa=xa+1|0;Td=Td+1|0}}Td=la-ua|0;xa=o+~Ja|0;if((c[F>>2]|0)==0){c[l>>2]=20;Oa=uc;Pa=vc;Qa=wc;Ra=Td;Sa=xc;Ta=r;Ua=xa;Va=yc}else{Oa=uc;Pa=vc;Qa=wc;Ra=Td;Sa=xc;Ta=r;Ua=xa;Va=yc}}}while(0);ia=c[l>>2]|0;q=Oa;ja=Pa;ka=Qa;la=Ra;ma=Sa;r=Ta;o=Ua;s=Va}if((ta|0)==122){c[m>>2]=o;c[n>>2]=la;c[f>>2]=Cb;c[p>>2]=Ab;c[u>>2]=Bb;c[v>>2]=zb;k=2;i=h;return k|0}else if((ta|0)==133){ya=Kd+ -3|0;za=Ld;Aa=Md>>>3;Ba=la;Ca=Nd;Da=r;Ea=s}else if((ta|0)==284){c[l>>2]=28;ya=Cd;za=Dd;Aa=Ed;Ba=la;Ca=Fd;Da=jd;Ea=1}else if((ta|0)==285){ya=na;za=oa;Aa=pa;Ba=qa;Ca=ra;Da=r;Ea=sa}else if((ta|0)==299){k=-4;i=h;return k|0}else if((ta|0)==300){i=h;return k|0}c[m>>2]=o;c[n>>2]=Ba;c[f>>2]=Ca;c[p>>2]=za;c[u>>2]=Aa;c[v>>2]=ya;if((c[W>>2]|0)==0){if((c[l>>2]|0)>>>0<26?(Da|0)!=(c[n>>2]|0):0){ta=289}}else{ta=289}if((ta|0)==289?(Lf(f,Da)|0)!=0:0){c[l>>2]=30;k=-4;i=h;return k|0}ta=c[p>>2]|0;p=c[n>>2]|0;n=Da-p|0;W=f+8|0;c[W>>2]=t-ta+(c[W>>2]|0);c[X>>2]=(c[X>>2]|0)+n;c[Y>>2]=(c[Y>>2]|0)+n;Y=(Da|0)==(p|0);if(!((c[w>>2]|0)==0|Y)){w=c[x>>2]|0;p=(c[m>>2]|0)+(0-n)|0;if((c[z>>2]|0)==0){Ig=ff(w,p,n)|0}else{Ig=gf(w,p,n)|0}c[x>>2]=Ig;c[E>>2]=Ig}Ig=c[l>>2]|0;if((Ig|0)==19){Jg=256}else{Jg=(Ig|0)==14?256:0}c[f+44>>2]=((c[I>>2]|0)!=0?64:0)+(c[v>>2]|0)+((Ig|0)==11?128:0)+Jg;k=((t|0)==(ta|0)&Y|(g|0)==4)&(Ea|0)==0?-5:Ea;i=h;return k|0}function Lf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;e=c[a+28>>2]|0;f=e+52|0;g=c[f>>2]|0;if((g|0)==0){h=kb[c[a+32>>2]&1](c[a+40>>2]|0,1<<c[e+36>>2],1)|0;c[f>>2]=h;if((h|0)==0){j=1;i=d;return j|0}else{k=h}}else{k=g}g=e+40|0;h=c[g>>2]|0;if((h|0)==0){l=1<<c[e+36>>2];c[g>>2]=l;c[e+48>>2]=0;c[e+44>>2]=0;m=l}else{m=h}h=b-(c[a+16>>2]|0)|0;if(!(h>>>0<m>>>0)){Kg(k|0,(c[a+12>>2]|0)+(0-m)|0,m|0)|0;c[e+48>>2]=0;c[e+44>>2]=c[g>>2];j=0;i=d;return j|0}b=e+48|0;l=c[b>>2]|0;n=m-l|0;m=n>>>0>h>>>0?h:n;n=a+12|0;Kg(k+l|0,(c[n>>2]|0)+(0-h)|0,m|0)|0;l=h-m|0;if((h|0)!=(m|0)){Kg(c[f>>2]|0,(c[n>>2]|0)+(0-l)|0,l|0)|0;c[b>>2]=l;c[e+44>>2]=c[g>>2];j=0;i=d;return j|0}l=(c[b>>2]|0)+h|0;n=c[g>>2]|0;c[b>>2]=(l|0)==(n|0)?0:l;l=e+44|0;e=c[l>>2]|0;if(!(e>>>0<n>>>0)){j=0;i=d;return j|0}c[l>>2]=e+h;j=0;i=d;return j|0}function Mf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;if((a|0)==0){d=-2;i=b;return d|0}e=a+28|0;f=c[e>>2]|0;if((f|0)==0){d=-2;i=b;return d|0}g=a+36|0;h=c[g>>2]|0;if((h|0)==0){d=-2;i=b;return d|0}j=c[f+52>>2]|0;k=a+40|0;if((j|0)==0){l=h;m=f}else{mb[h&1](c[k>>2]|0,j);l=c[g>>2]|0;m=c[e>>2]|0}mb[l&1](c[k>>2]|0,m);c[e>>2]=0;d=0;i=b;return d|0}function Nf(d,f,g,h,j,k){d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;l=i;i=i+64|0;m=l+32|0;n=l;o=m+0|0;p=o+32|0;do{b[o>>1]=0;o=o+2|0}while((o|0)<(p|0));o=(g|0)==0;if(!o){p=0;do{q=m+(e[f+(p<<1)>>1]<<1)|0;b[q>>1]=(b[q>>1]|0)+1<<16>>16;p=p+1|0}while((p|0)!=(g|0))}p=c[j>>2]|0;q=15;while(1){r=q+ -1|0;if((b[m+(q<<1)>>1]|0)!=0){break}if((r|0)==0){s=7;break}else{q=r}}if((s|0)==7){r=c[h>>2]|0;c[h>>2]=r+4;a[r]=64;a[r+1|0]=1;b[r+2>>1]=0;r=c[h>>2]|0;c[h>>2]=r+4;a[r]=64;a[r+1|0]=1;b[r+2>>1]=0;c[j>>2]=1;t=0;i=l;return t|0}r=p>>>0>q>>>0?q:p;a:do{if(q>>>0>1){p=1;while(1){u=p+1|0;if((b[m+(p<<1)>>1]|0)!=0){v=p;break a}if(u>>>0<q>>>0){p=u}else{v=u;break}}}else{v=1}}while(0);p=r>>>0<v>>>0?v:r;r=1;u=1;do{r=(r<<1)-(e[m+(u<<1)>>1]|0)|0;u=u+1|0;if((r|0)<0){t=-1;s=56;break}}while(u>>>0<16);if((s|0)==56){i=l;return t|0}if((r|0)>0?!((d|0)!=0&(q|0)==1):0){t=-1;i=l;return t|0}b[n+2>>1]=0;r=0;u=1;do{r=(e[m+(u<<1)>>1]|0)+(r&65535)|0;u=u+1|0;b[n+(u<<1)>>1]=r}while((u|0)!=15);if(!o){o=0;do{u=b[f+(o<<1)>>1]|0;if(!(u<<16>>16==0)){r=n+((u&65535)<<1)|0;u=b[r>>1]|0;b[r>>1]=u+1<<16>>16;b[k+((u&65535)<<1)>>1]=o}o=o+1|0}while((o|0)!=(g|0))}if((d|0)==0){w=0;x=1<<p;y=0;z=k;A=19;B=k}else if((d|0)==1){g=1<<p;if(g>>>0>851){t=1;i=l;return t|0}else{w=0;x=g;y=1;z=24504+ -514|0;A=256;B=24568+ -514|0}}else{g=1<<p;o=(d|0)==2;if(o&g>>>0>591){t=1;i=l;return t|0}else{w=o;x=g;y=0;z=24632;A=-1;B=24696}}g=x+ -1|0;o=p&255;d=p;n=0;u=0;r=v;v=-1;C=c[h>>2]|0;D=0;E=x;b:while(1){x=1<<d;F=u;G=r;H=D;while(1){I=G-n|0;J=I&255;K=b[k+(H<<1)>>1]|0;L=K&65535;if((L|0)>=(A|0)){if((L|0)>(A|0)){M=b[B+(L<<1)>>1]&255;N=b[z+(L<<1)>>1]|0}else{M=96;N=0}}else{M=0;N=K}K=1<<I;I=F>>>n;L=x;while(1){O=L-K|0;P=O+I|0;a[C+(P<<2)|0]=M;a[C+(P<<2)+1|0]=J;b[C+(P<<2)+2>>1]=N;if((L|0)==(K|0)){break}else{L=O}}L=1<<G+ -1;while(1){if((L&F|0)==0){break}else{L=L>>>1}}if((L|0)==0){Q=0}else{Q=(L+ -1&F)+L|0}R=H+1|0;K=m+(G<<1)|0;I=(b[K>>1]|0)+ -1<<16>>16;b[K>>1]=I;if(I<<16>>16==0){if((G|0)==(q|0)){break b}S=e[f+(e[k+(R<<1)>>1]<<1)>>1]|0}else{S=G}if(!(S>>>0>p>>>0)){F=Q;G=S;H=R;continue}T=Q&g;if((T|0)==(v|0)){F=Q;G=S;H=R}else{break}}H=(n|0)==0?p:n;G=C+(x<<2)|0;F=S-H|0;c:do{if(S>>>0<q>>>0){I=S;K=F;O=1<<F;while(1){P=O-(e[m+(I<<1)>>1]|0)|0;if((P|0)<1){U=K;break c}V=K+1|0;W=V+H|0;if(W>>>0<q>>>0){I=W;K=V;O=P<<1}else{U=V;break}}}else{U=F}}while(0);F=(1<<U)+E|0;if(y&F>>>0>851|w&F>>>0>591){t=1;s=56;break}a[(c[h>>2]|0)+(T<<2)|0]=U;a[(c[h>>2]|0)+(T<<2)+1|0]=o;x=c[h>>2]|0;b[x+(T<<2)+2>>1]=(G-x|0)>>>2;d=U;n=H;u=Q;r=S;v=T;C=G;D=R;E=F}if((s|0)==56){i=l;return t|0}d:do{if((Q|0)!=0){s=n;R=J;D=Q;T=q;S=C;while(1){if((s|0)!=0){if((D&g|0)==(v|0)){X=s;Y=R;Z=T;_=S}else{X=0;Y=o;Z=p;_=c[h>>2]|0}}else{X=0;Y=R;Z=T;_=S}r=D>>>X;a[_+(r<<2)|0]=64;a[_+(r<<2)+1|0]=Y;b[_+(r<<2)+2>>1]=0;r=1<<Z+ -1;while(1){if((r&D|0)==0){break}else{r=r>>>1}}if((r|0)==0){break d}D=(r+ -1&D)+r|0;if((D|0)==0){break}else{s=X;R=Y;T=Z;S=_}}}}while(0);c[h>>2]=(c[h>>2]|0)+(E<<2);c[j>>2]=p;t=0;i=l;return t|0}function Of(a){a=a|0;var d=0;d=i;c[a+2840>>2]=a+148;c[a+2848>>2]=25528;c[a+2852>>2]=a+2440;c[a+2860>>2]=25552;c[a+2864>>2]=a+2684;c[a+2872>>2]=25576;b[a+5816>>1]=0;c[a+5820>>2]=0;c[a+5812>>2]=8;Pf(a);i=d;return}function Pf(a){a=a|0;var d=0,e=0;d=i;e=0;do{b[a+(e<<2)+148>>1]=0;e=e+1|0}while((e|0)!=286);b[a+2440>>1]=0;b[a+2444>>1]=0;b[a+2448>>1]=0;b[a+2452>>1]=0;b[a+2456>>1]=0;b[a+2460>>1]=0;b[a+2464>>1]=0;b[a+2468>>1]=0;b[a+2472>>1]=0;b[a+2476>>1]=0;b[a+2480>>1]=0;b[a+2484>>1]=0;b[a+2488>>1]=0;b[a+2492>>1]=0;b[a+2496>>1]=0;b[a+2500>>1]=0;b[a+2504>>1]=0;b[a+2508>>1]=0;b[a+2512>>1]=0;b[a+2516>>1]=0;b[a+2520>>1]=0;b[a+2524>>1]=0;b[a+2528>>1]=0;b[a+2532>>1]=0;b[a+2536>>1]=0;b[a+2540>>1]=0;b[a+2544>>1]=0;b[a+2548>>1]=0;b[a+2552>>1]=0;b[a+2556>>1]=0;b[a+2684>>1]=0;b[a+2688>>1]=0;b[a+2692>>1]=0;b[a+2696>>1]=0;b[a+2700>>1]=0;b[a+2704>>1]=0;b[a+2708>>1]=0;b[a+2712>>1]=0;b[a+2716>>1]=0;b[a+2720>>1]=0;b[a+2724>>1]=0;b[a+2728>>1]=0;b[a+2732>>1]=0;b[a+2736>>1]=0;b[a+2740>>1]=0;b[a+2744>>1]=0;b[a+2748>>1]=0;b[a+2752>>1]=0;b[a+2756>>1]=0;b[a+1172>>1]=1;c[a+5804>>2]=0;c[a+5800>>2]=0;c[a+5808>>2]=0;c[a+5792>>2]=0;i=d;return}function Qf(d,f,g,h){d=d|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=i;k=d+5820|0;l=c[k>>2]|0;m=h&65535;h=d+5816|0;n=e[h>>1]|0|m<<l;b[h>>1]=n;if((l|0)>13){o=d+20|0;p=c[o>>2]|0;c[o>>2]=p+1;q=d+8|0;a[(c[q>>2]|0)+p|0]=n;p=(e[h>>1]|0)>>>8&255;r=c[o>>2]|0;c[o>>2]=r+1;a[(c[q>>2]|0)+r|0]=p;p=c[k>>2]|0;r=m>>>(16-p|0);b[h>>1]=r;s=r;t=p+ -13|0}else{s=n;t=l+3|0}l=s&255;c[k>>2]=t;do{if((t|0)<=8){s=d+20|0;if((t|0)>0){n=c[s>>2]|0;c[s>>2]=n+1;p=d+8|0;a[(c[p>>2]|0)+n|0]=l;u=s;v=p;break}else{u=s;v=d+8|0;break}}else{s=d+20|0;p=c[s>>2]|0;c[s>>2]=p+1;n=d+8|0;a[(c[n>>2]|0)+p|0]=l;p=(e[h>>1]|0)>>>8&255;r=c[s>>2]|0;c[s>>2]=r+1;a[(c[n>>2]|0)+r|0]=p;u=s;v=n}}while(0);b[h>>1]=0;c[k>>2]=0;c[d+5812>>2]=8;d=c[u>>2]|0;c[u>>2]=d+1;a[(c[v>>2]|0)+d|0]=g;d=c[u>>2]|0;c[u>>2]=d+1;a[(c[v>>2]|0)+d|0]=g>>>8;d=g&65535^65535;k=c[u>>2]|0;c[u>>2]=k+1;a[(c[v>>2]|0)+k|0]=d;k=c[u>>2]|0;c[u>>2]=k+1;a[(c[v>>2]|0)+k|0]=d>>>8;if((g|0)==0){i=j;return}else{w=g;x=f}while(1){w=w+ -1|0;f=a[x]|0;g=c[u>>2]|0;c[u>>2]=g+1;a[(c[v>>2]|0)+g|0]=f;if((w|0)==0){break}else{x=x+1|0}}i=j;return}function Rf(d){d=d|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;g=d+5820|0;h=c[g>>2]|0;j=d+5816|0;k=e[j>>1]|0|2<<h;l=k&65535;b[j>>1]=l;if((h|0)>13){m=d+20|0;n=c[m>>2]|0;c[m>>2]=n+1;o=d+8|0;a[(c[o>>2]|0)+n|0]=k;k=(e[j>>1]|0)>>>8&255;n=c[m>>2]|0;c[m>>2]=n+1;a[(c[o>>2]|0)+n|0]=k;k=c[g>>2]|0;n=2>>>(16-k|0)&65535;b[j>>1]=n;p=n;q=k+ -13|0}else{p=l;q=h+3|0}c[g>>2]=q;if((q|0)>9){h=d+20|0;l=c[h>>2]|0;c[h>>2]=l+1;k=d+8|0;a[(c[k>>2]|0)+l|0]=p;l=(e[j>>1]|0)>>>8&255;n=c[h>>2]|0;c[h>>2]=n+1;a[(c[k>>2]|0)+n|0]=l;b[j>>1]=0;r=(c[g>>2]|0)+ -9|0;s=0}else{r=q+7|0;s=p}c[g>>2]=r;if((r|0)!=16){if((r|0)>7){p=d+20|0;q=c[p>>2]|0;c[p>>2]=q+1;a[(c[d+8>>2]|0)+q|0]=s;q=(e[j>>1]|0)>>>8;b[j>>1]=q;p=(c[g>>2]|0)+ -8|0;c[g>>2]=p;t=p;u=q}else{t=r;u=s}}else{r=d+20|0;q=c[r>>2]|0;c[r>>2]=q+1;p=d+8|0;a[(c[p>>2]|0)+q|0]=s;s=(e[j>>1]|0)>>>8&255;q=c[r>>2]|0;c[r>>2]=q+1;a[(c[p>>2]|0)+q|0]=s;b[j>>1]=0;c[g>>2]=0;t=0;u=0}s=d+5812|0;if((11-t+(c[s>>2]|0)|0)>=9){c[s>>2]=7;i=f;return}q=u&65535|2<<t;b[j>>1]=q;if((t|0)>13){u=d+20|0;p=c[u>>2]|0;c[u>>2]=p+1;r=d+8|0;a[(c[r>>2]|0)+p|0]=q;p=(e[j>>1]|0)>>>8&255;l=c[u>>2]|0;c[u>>2]=l+1;a[(c[r>>2]|0)+l|0]=p;p=c[g>>2]|0;l=2>>>(16-p|0);b[j>>1]=l;v=l;w=p+ -13|0}else{v=q;w=t+3|0}t=v&255;c[g>>2]=w;if((w|0)>9){v=d+20|0;q=c[v>>2]|0;c[v>>2]=q+1;p=d+8|0;a[(c[p>>2]|0)+q|0]=t;q=(e[j>>1]|0)>>>8&255;l=c[v>>2]|0;c[v>>2]=l+1;a[(c[p>>2]|0)+l|0]=q;b[j>>1]=0;x=0;y=(c[g>>2]|0)+ -9|0}else{x=t;y=w+7|0}c[g>>2]=y;if((y|0)==16){w=d+20|0;t=c[w>>2]|0;c[w>>2]=t+1;q=d+8|0;a[(c[q>>2]|0)+t|0]=x;t=(e[j>>1]|0)>>>8&255;l=c[w>>2]|0;c[w>>2]=l+1;a[(c[q>>2]|0)+l|0]=t;b[j>>1]=0;c[g>>2]=0;c[s>>2]=7;i=f;return}if((y|0)<=7){c[s>>2]=7;i=f;return}y=d+20|0;t=c[y>>2]|0;c[y>>2]=t+1;a[(c[d+8>>2]|0)+t|0]=x;b[j>>1]=(e[j>>1]|0)>>>8;c[g>>2]=(c[g>>2]|0)+ -8;c[s>>2]=7;i=f;return}function Sf(f,g,h,j){f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;k=i;if((c[f+132>>2]|0)>0){l=(c[f>>2]|0)+44|0;if((c[l>>2]|0)==2){m=-201342849;n=0;while(1){if((m&1|0)!=0?(b[f+(n<<2)+148>>1]|0)!=0:0){o=0;break}p=n+1|0;if((p|0)<32){m=m>>>1;n=p}else{q=6;break}}a:do{if((q|0)==6){if(((b[f+184>>1]|0)==0?(b[f+188>>1]|0)==0:0)?(b[f+200>>1]|0)==0:0){n=32;while(1){m=n+1|0;if((b[f+(n<<2)+148>>1]|0)!=0){o=1;break a}if((m|0)<256){n=m}else{o=0;break}}}else{o=1}}}while(0);c[l>>2]=o}Tf(f,f+2840|0);Tf(f,f+2852|0);Wf(f,f+148|0,c[f+2844>>2]|0);Wf(f,f+2440|0,c[f+2856>>2]|0);Tf(f,f+2864|0);o=18;while(1){l=o+ -1|0;if((b[f+(d[27352+o|0]<<2)+2686>>1]|0)!=0){r=o;break}if((l|0)>2){o=l}else{r=l;break}}o=f+5800|0;l=(r*3|0)+17+(c[o>>2]|0)|0;c[o>>2]=l;o=(l+10|0)>>>3;l=((c[f+5804>>2]|0)+10|0)>>>3;s=r;t=l>>>0>o>>>0?o:l;u=l}else{l=h+5|0;s=0;t=l;u=l}do{if((h+4|0)>>>0>t>>>0|(g|0)==0){l=f+5820|0;o=c[l>>2]|0;r=(o|0)>13;if((c[f+136>>2]|0)==4|(u|0)==(t|0)){q=j+2&65535;n=f+5816|0;m=e[n>>1]|q<<o;b[n>>1]=m;if(r){p=f+20|0;v=c[p>>2]|0;c[p>>2]=v+1;w=f+8|0;a[(c[w>>2]|0)+v|0]=m;m=(e[n>>1]|0)>>>8&255;v=c[p>>2]|0;c[p>>2]=v+1;a[(c[w>>2]|0)+v|0]=m;m=c[l>>2]|0;b[n>>1]=q>>>(16-m|0);x=m+ -13|0}else{x=o+3|0}c[l>>2]=x;Uf(f,25600,26752);break}m=j+4&65535;q=f+5816|0;n=e[q>>1]|m<<o;b[q>>1]=n;if(r){r=f+20|0;v=c[r>>2]|0;c[r>>2]=v+1;w=f+8|0;a[(c[w>>2]|0)+v|0]=n;v=(e[q>>1]|0)>>>8&255;p=c[r>>2]|0;c[r>>2]=p+1;a[(c[w>>2]|0)+p|0]=v;v=c[l>>2]|0;p=m>>>(16-v|0);b[q>>1]=p;y=p;z=v+ -13|0}else{y=n;z=o+3|0}c[l>>2]=z;o=c[f+2844>>2]|0;n=c[f+2856>>2]|0;v=o+65280&65535;p=y&65535|v<<z;b[q>>1]=p;if((z|0)>11){m=f+20|0;w=c[m>>2]|0;c[m>>2]=w+1;r=f+8|0;a[(c[r>>2]|0)+w|0]=p;w=(e[q>>1]|0)>>>8&255;A=c[m>>2]|0;c[m>>2]=A+1;a[(c[r>>2]|0)+A|0]=w;w=c[l>>2]|0;A=v>>>(16-w|0);b[q>>1]=A;B=w+ -11|0;C=A}else{B=z+5|0;C=p}c[l>>2]=B;p=n&65535;A=p<<B|C&65535;b[q>>1]=A;if((B|0)>11){w=f+20|0;v=c[w>>2]|0;c[w>>2]=v+1;r=f+8|0;a[(c[r>>2]|0)+v|0]=A;v=(e[q>>1]|0)>>>8&255;m=c[w>>2]|0;c[w>>2]=m+1;a[(c[r>>2]|0)+m|0]=v;v=c[l>>2]|0;m=p>>>(16-v|0);b[q>>1]=m;D=v+ -11|0;E=m}else{D=B+5|0;E=A}c[l>>2]=D;A=s+65533&65535;m=A<<D|E&65535;b[q>>1]=m;if((D|0)>12){v=f+20|0;p=c[v>>2]|0;c[v>>2]=p+1;r=f+8|0;a[(c[r>>2]|0)+p|0]=m;p=(e[q>>1]|0)>>>8&255;w=c[v>>2]|0;c[v>>2]=w+1;a[(c[r>>2]|0)+w|0]=p;p=c[l>>2]|0;w=A>>>(16-p|0);b[q>>1]=w;F=w;G=p+ -12|0}else{F=m;G=D+4|0}c[l>>2]=G;if((s|0)>-1){m=f+20|0;p=f+8|0;w=G;A=F;r=0;while(1){v=e[f+(d[27352+r|0]<<2)+2686>>1]|0;H=v<<w|A&65535;b[q>>1]=H;if((w|0)>13){I=c[m>>2]|0;c[m>>2]=I+1;a[(c[p>>2]|0)+I|0]=H;I=(e[q>>1]|0)>>>8&255;J=c[m>>2]|0;c[m>>2]=J+1;a[(c[p>>2]|0)+J|0]=I;I=c[l>>2]|0;J=v>>>(16-I|0);b[q>>1]=J;K=J;L=I+ -13|0}else{K=H;L=w+3|0}c[l>>2]=L;if((r|0)==(s|0)){break}else{w=L;A=K;r=r+1|0}}}r=f+148|0;Vf(f,r,o);A=f+2440|0;Vf(f,A,n);Uf(f,r,A)}else{Qf(f,g,h,j)}}while(0);Pf(f);if((j|0)==0){i=k;return}j=f+5820|0;h=c[j>>2]|0;if((h|0)<=8){g=f+5816|0;if((h|0)>0){h=b[g>>1]&255;K=f+20|0;L=c[K>>2]|0;c[K>>2]=L+1;a[(c[f+8>>2]|0)+L|0]=h;M=g}else{M=g}}else{g=f+5816|0;h=b[g>>1]&255;L=f+20|0;K=c[L>>2]|0;c[L>>2]=K+1;s=f+8|0;a[(c[s>>2]|0)+K|0]=h;h=(e[g>>1]|0)>>>8&255;K=c[L>>2]|0;c[L>>2]=K+1;a[(c[s>>2]|0)+K|0]=h;M=g}b[M>>1]=0;c[j>>2]=0;i=k;return}function Tf(f,g){f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;h=i;i=i+32|0;j=h;k=c[g>>2]|0;l=g+8|0;m=c[l>>2]|0;n=c[m>>2]|0;o=c[m+12>>2]|0;m=f+5200|0;c[m>>2]=0;p=f+5204|0;c[p>>2]=573;if((o|0)>0){q=-1;r=0;while(1){if((b[k+(r<<2)>>1]|0)==0){b[k+(r<<2)+2>>1]=0;s=q}else{t=(c[m>>2]|0)+1|0;c[m>>2]=t;c[f+(t<<2)+2908>>2]=r;a[f+r+5208|0]=0;s=r}r=r+1|0;if((r|0)==(o|0)){break}else{q=s}}q=c[m>>2]|0;if((q|0)<2){u=q;v=s;w=3}else{x=s}}else{u=0;v=-1;w=3}if((w|0)==3){w=f+5800|0;s=f+5804|0;if((n|0)==0){q=u;r=v;while(1){t=(r|0)<2;y=r+1|0;z=t?y:r;A=t?y:0;y=q+1|0;c[m>>2]=y;c[f+(y<<2)+2908>>2]=A;b[k+(A<<2)>>1]=1;a[f+A+5208|0]=0;c[w>>2]=(c[w>>2]|0)+ -1;A=c[m>>2]|0;if((A|0)<2){q=A;r=z}else{x=z;break}}}else{r=u;u=v;while(1){v=(u|0)<2;q=u+1|0;z=v?q:u;A=v?q:0;q=r+1|0;c[m>>2]=q;c[f+(q<<2)+2908>>2]=A;b[k+(A<<2)>>1]=1;a[f+A+5208|0]=0;c[w>>2]=(c[w>>2]|0)+ -1;c[s>>2]=(c[s>>2]|0)-(e[n+(A<<2)+2>>1]|0);A=c[m>>2]|0;if((A|0)<2){r=A;u=z}else{x=z;break}}}}u=g+4|0;c[u>>2]=x;r=c[m>>2]|0;if((r|0)>1){n=r;s=(r|0)/2|0;while(1){w=c[f+(s<<2)+2908>>2]|0;z=f+w+5208|0;A=s<<1;a:do{if((A|0)>(n|0)){B=s}else{q=k+(w<<2)|0;v=s;y=n;t=A;while(1){do{if((t|0)<(y|0)){C=t|1;D=c[f+(C<<2)+2908>>2]|0;E=b[k+(D<<2)>>1]|0;F=c[f+(t<<2)+2908>>2]|0;G=b[k+(F<<2)>>1]|0;if(!((E&65535)<(G&65535))){if(!(E<<16>>16==G<<16>>16)){H=t;break}if((d[f+D+5208|0]|0)>(d[f+F+5208|0]|0)){H=t;break}}H=C}else{H=t}}while(0);C=b[q>>1]|0;F=c[f+(H<<2)+2908>>2]|0;D=b[k+(F<<2)>>1]|0;if((C&65535)<(D&65535)){B=v;break a}if(C<<16>>16==D<<16>>16?(d[z]|0)<=(d[f+F+5208|0]|0):0){B=v;break a}c[f+(v<<2)+2908>>2]=F;F=H<<1;D=c[m>>2]|0;if((F|0)>(D|0)){B=H;break}else{v=H;y=D;t=F}}}}while(0);c[f+(B<<2)+2908>>2]=w;z=s+ -1|0;A=c[m>>2]|0;if((z|0)>0){n=A;s=z}else{I=A;break}}}else{I=r}r=f+2912|0;s=I;I=o;while(1){o=c[r>>2]|0;n=s+ -1|0;c[m>>2]=n;B=c[f+(s<<2)+2908>>2]|0;c[r>>2]=B;H=f+B+5208|0;b:do{if((s|0)<3){J=1}else{A=k+(B<<2)|0;z=1;t=n;y=2;while(1){do{if((y|0)<(t|0)){v=y|1;q=c[f+(v<<2)+2908>>2]|0;F=b[k+(q<<2)>>1]|0;D=c[f+(y<<2)+2908>>2]|0;C=b[k+(D<<2)>>1]|0;if(!((F&65535)<(C&65535))){if(!(F<<16>>16==C<<16>>16)){K=y;break}if((d[f+q+5208|0]|0)>(d[f+D+5208|0]|0)){K=y;break}}K=v}else{K=y}}while(0);v=b[A>>1]|0;D=c[f+(K<<2)+2908>>2]|0;q=b[k+(D<<2)>>1]|0;if((v&65535)<(q&65535)){J=z;break b}if(v<<16>>16==q<<16>>16?(d[H]|0)<=(d[f+D+5208|0]|0):0){J=z;break b}c[f+(z<<2)+2908>>2]=D;D=K<<1;q=c[m>>2]|0;if((D|0)>(q|0)){J=K;break}else{z=K;t=q;y=D}}}}while(0);c[f+(J<<2)+2908>>2]=B;H=c[r>>2]|0;n=(c[p>>2]|0)+ -1|0;c[p>>2]=n;c[f+(n<<2)+2908>>2]=o;n=(c[p>>2]|0)+ -1|0;c[p>>2]=n;c[f+(n<<2)+2908>>2]=H;n=k+(I<<2)|0;b[n>>1]=(e[k+(H<<2)>>1]|0)+(e[k+(o<<2)>>1]|0);w=a[f+o+5208|0]|0;y=a[f+H+5208|0]|0;t=f+I+5208|0;a[t]=(((w&255)<(y&255)?y:w)&255)+1;w=I&65535;b[k+(H<<2)+2>>1]=w;b[k+(o<<2)+2>>1]=w;w=I+1|0;c[r>>2]=I;H=c[m>>2]|0;c:do{if((H|0)<2){L=1}else{y=1;z=H;A=2;while(1){do{if((A|0)<(z|0)){D=A|1;q=c[f+(D<<2)+2908>>2]|0;v=b[k+(q<<2)>>1]|0;C=c[f+(A<<2)+2908>>2]|0;F=b[k+(C<<2)>>1]|0;if(!((v&65535)<(F&65535))){if(!(v<<16>>16==F<<16>>16)){M=A;break}if((d[f+q+5208|0]|0)>(d[f+C+5208|0]|0)){M=A;break}}M=D}else{M=A}}while(0);D=b[n>>1]|0;C=c[f+(M<<2)+2908>>2]|0;q=b[k+(C<<2)>>1]|0;if((D&65535)<(q&65535)){L=y;break c}if(D<<16>>16==q<<16>>16?(d[t]|0)<=(d[f+C+5208|0]|0):0){L=y;break c}c[f+(y<<2)+2908>>2]=C;C=M<<1;q=c[m>>2]|0;if((C|0)>(q|0)){L=M;break}else{y=M;z=q;A=C}}}}while(0);c[f+(L<<2)+2908>>2]=I;t=c[m>>2]|0;if((t|0)>1){s=t;I=w}else{break}}I=c[r>>2]|0;r=(c[p>>2]|0)+ -1|0;c[p>>2]=r;c[f+(r<<2)+2908>>2]=I;I=c[g>>2]|0;g=c[u>>2]|0;u=c[l>>2]|0;l=c[u>>2]|0;r=c[u+4>>2]|0;s=c[u+8>>2]|0;m=c[u+16>>2]|0;u=f+2876|0;L=u+32|0;do{b[u>>1]=0;u=u+2|0}while((u|0)<(L|0));u=c[p>>2]|0;b[I+(c[f+(u<<2)+2908>>2]<<2)+2>>1]=0;p=u+1|0;d:do{if((p|0)<573){u=f+5800|0;L=f+5804|0;if((l|0)==0){M=p;J=0;while(1){K=c[f+(M<<2)+2908>>2]|0;t=I+(K<<2)+2|0;n=e[I+(e[t>>1]<<2)+2>>1]|0;H=(n|0)<(m|0);o=H?n+1|0:m;n=(H&1^1)+J|0;b[t>>1]=o;if((K|0)<=(g|0)){t=f+(o<<1)+2876|0;b[t>>1]=(b[t>>1]|0)+1<<16>>16;if((K|0)<(s|0)){N=0}else{N=c[r+(K-s<<2)>>2]|0}t=aa(e[I+(K<<2)>>1]|0,N+o|0)|0;c[u>>2]=t+(c[u>>2]|0)}t=M+1|0;if((t|0)==573){O=n;break}else{M=t;J=n}}}else{J=p;M=0;while(1){w=c[f+(J<<2)+2908>>2]|0;n=I+(w<<2)+2|0;t=e[I+(e[n>>1]<<2)+2>>1]|0;o=(t|0)<(m|0);K=o?t+1|0:m;t=(o&1^1)+M|0;b[n>>1]=K;if((w|0)<=(g|0)){n=f+(K<<1)+2876|0;b[n>>1]=(b[n>>1]|0)+1<<16>>16;if((w|0)<(s|0)){P=0}else{P=c[r+(w-s<<2)>>2]|0}n=e[I+(w<<2)>>1]|0;o=aa(n,P+K|0)|0;c[u>>2]=o+(c[u>>2]|0);o=aa((e[l+(w<<2)+2>>1]|0)+P|0,n)|0;c[L>>2]=o+(c[L>>2]|0)}o=J+1|0;if((o|0)==573){O=t;break}else{J=o;M=t}}}if((O|0)!=0){M=f+(m<<1)+2876|0;J=O;do{L=m;while(1){t=L+ -1|0;Q=f+(t<<1)+2876|0;R=b[Q>>1]|0;if(R<<16>>16==0){L=t}else{break}}b[Q>>1]=R+ -1<<16>>16;t=f+(L<<1)+2876|0;b[t>>1]=(e[t>>1]|0)+2;S=(b[M>>1]|0)+ -1<<16>>16;b[M>>1]=S;J=J+ -2|0}while((J|0)>0);if((m|0)!=0){J=S;M=m;t=573;while(1){o=M&65535;if(J<<16>>16==0){T=t}else{n=t;w=J&65535;while(1){K=n;do{K=K+ -1|0;U=c[f+(K<<2)+2908>>2]|0}while((U|0)>(g|0));H=I+(U<<2)+2|0;B=e[H>>1]|0;if((B|0)!=(M|0)){A=aa(e[I+(U<<2)>>1]|0,M-B|0)|0;c[u>>2]=A+(c[u>>2]|0);b[H>>1]=o}H=w+ -1|0;if((H|0)==0){T=K;break}else{n=K;w=H}}}w=M+ -1|0;if((w|0)==0){break d}J=b[f+(w<<1)+2876>>1]|0;M=w;t=T}}}}}while(0);T=1;U=0;do{U=(e[f+(T+ -1<<1)+2876>>1]|0)+(U&65534)<<1;b[j+(T<<1)>>1]=U;T=T+1|0}while((T|0)!=16);if((x|0)<0){i=h;return}else{V=0}while(1){T=b[k+(V<<2)+2>>1]|0;U=T&65535;if(!(T<<16>>16==0)){T=j+(U<<1)|0;f=b[T>>1]|0;b[T>>1]=f+1<<16>>16;T=U;U=f&65535;f=0;while(1){W=f|U&1;T=T+ -1|0;if((T|0)<=0){break}else{U=U>>>1;f=W<<1}}b[k+(V<<2)>>1]=W}if((V|0)==(x|0)){break}else{V=V+1|0}}i=h;return}function Uf(f,g,h){f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;j=i;k=f+5792|0;if((c[k>>2]|0)==0){l=c[f+5820>>2]|0;m=b[f+5816>>1]|0}else{n=f+5796|0;o=f+5784|0;p=f+5820|0;q=f+5816|0;r=f+20|0;s=f+8|0;t=0;while(1){u=b[(c[n>>2]|0)+(t<<1)>>1]|0;v=u&65535;w=t+1|0;x=d[(c[o>>2]|0)+t|0]|0;do{if(u<<16>>16==0){y=e[g+(x<<2)+2>>1]|0;z=c[p>>2]|0;A=e[g+(x<<2)>>1]|0;B=e[q>>1]|0|A<<z;C=B&65535;b[q>>1]=C;if((z|0)>(16-y|0)){D=c[r>>2]|0;c[r>>2]=D+1;a[(c[s>>2]|0)+D|0]=B;B=(e[q>>1]|0)>>>8&255;D=c[r>>2]|0;c[r>>2]=D+1;a[(c[s>>2]|0)+D|0]=B;B=c[p>>2]|0;D=A>>>(16-B|0)&65535;b[q>>1]=D;A=y+ -16+B|0;c[p>>2]=A;E=D;F=A;break}else{A=z+y|0;c[p>>2]=A;E=C;F=A;break}}else{A=d[25272+x|0]|0;C=(A|256)+1|0;y=e[g+(C<<2)+2>>1]|0;z=c[p>>2]|0;D=e[g+(C<<2)>>1]|0;C=e[q>>1]|0|D<<z;B=C&65535;b[q>>1]=B;if((z|0)>(16-y|0)){G=c[r>>2]|0;c[r>>2]=G+1;a[(c[s>>2]|0)+G|0]=C;C=(e[q>>1]|0)>>>8&255;G=c[r>>2]|0;c[r>>2]=G+1;a[(c[s>>2]|0)+G|0]=C;C=c[p>>2]|0;G=D>>>(16-C|0)&65535;b[q>>1]=G;H=G;I=y+ -16+C|0}else{H=B;I=z+y|0}c[p>>2]=I;y=c[26872+(A<<2)>>2]|0;do{if((A+ -8|0)>>>0<20){z=x-(c[26992+(A<<2)>>2]|0)&65535;B=z<<I|H&65535;C=B&65535;b[q>>1]=C;if((I|0)>(16-y|0)){G=c[r>>2]|0;c[r>>2]=G+1;a[(c[s>>2]|0)+G|0]=B;B=(e[q>>1]|0)>>>8&255;G=c[r>>2]|0;c[r>>2]=G+1;a[(c[s>>2]|0)+G|0]=B;B=c[p>>2]|0;G=z>>>(16-B|0)&65535;b[q>>1]=G;z=y+ -16+B|0;c[p>>2]=z;J=z;K=G;break}else{G=I+y|0;c[p>>2]=G;J=G;K=C;break}}else{J=I;K=H}}while(0);y=v+ -1|0;if(y>>>0<256){L=y}else{L=(y>>>7)+256|0}A=d[24760+L|0]|0;C=e[h+(A<<2)+2>>1]|0;G=e[h+(A<<2)>>1]|0;z=K&65535|G<<J;B=z&65535;b[q>>1]=B;if((J|0)>(16-C|0)){D=c[r>>2]|0;c[r>>2]=D+1;a[(c[s>>2]|0)+D|0]=z;z=(e[q>>1]|0)>>>8&255;D=c[r>>2]|0;c[r>>2]=D+1;a[(c[s>>2]|0)+D|0]=z;z=c[p>>2]|0;D=G>>>(16-z|0)&65535;b[q>>1]=D;M=C+ -16+z|0;N=D}else{M=J+C|0;N=B}c[p>>2]=M;B=c[27112+(A<<2)>>2]|0;if((A+ -4|0)>>>0<26){C=y-(c[27232+(A<<2)>>2]|0)&65535;A=C<<M|N&65535;y=A&65535;b[q>>1]=y;if((M|0)>(16-B|0)){D=c[r>>2]|0;c[r>>2]=D+1;a[(c[s>>2]|0)+D|0]=A;A=(e[q>>1]|0)>>>8&255;D=c[r>>2]|0;c[r>>2]=D+1;a[(c[s>>2]|0)+D|0]=A;A=c[p>>2]|0;D=C>>>(16-A|0)&65535;b[q>>1]=D;C=B+ -16+A|0;c[p>>2]=C;E=D;F=C;break}else{C=M+B|0;c[p>>2]=C;E=y;F=C;break}}else{E=N;F=M}}}while(0);if(w>>>0<(c[k>>2]|0)>>>0){t=w}else{l=F;m=E;break}}}E=g+1026|0;F=e[E>>1]|0;t=f+5820|0;k=e[g+1024>>1]|0;g=f+5816|0;M=m&65535|k<<l;b[g>>1]=M;if((l|0)>(16-F|0)){m=f+20|0;N=c[m>>2]|0;c[m>>2]=N+1;p=f+8|0;a[(c[p>>2]|0)+N|0]=M;M=(e[g>>1]|0)>>>8&255;N=c[m>>2]|0;c[m>>2]=N+1;a[(c[p>>2]|0)+N|0]=M;M=c[t>>2]|0;b[g>>1]=k>>>(16-M|0);O=F+ -16+M|0;c[t>>2]=O;P=b[E>>1]|0;Q=P&65535;R=f+5812|0;c[R>>2]=Q;i=j;return}else{O=l+F|0;c[t>>2]=O;P=b[E>>1]|0;Q=P&65535;R=f+5812|0;c[R>>2]=Q;i=j;return}}function Vf(d,f,g){d=d|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;h=i;j=b[f+2>>1]|0;k=j<<16>>16==0;l=d+2754|0;m=d+5820|0;n=d+2752|0;o=d+5816|0;p=d+20|0;q=d+8|0;r=d+2758|0;s=d+2756|0;t=d+2750|0;u=d+2748|0;v=k?138:7;w=k?3:4;k=0;x=j&65535;j=-1;a:while(1){y=0;z=k;while(1){if((z|0)>(g|0)){break a}z=z+1|0;A=b[f+(z<<2)+2>>1]|0;B=A&65535;C=y+1|0;D=(x|0)==(B|0);if(!((C|0)<(v|0)&D)){break}else{y=C}}do{if((C|0)>=(w|0)){if((x|0)!=0){if((x|0)==(j|0)){E=b[o>>1]|0;F=c[m>>2]|0;G=C}else{H=e[d+(x<<2)+2686>>1]|0;I=c[m>>2]|0;J=e[d+(x<<2)+2684>>1]|0;K=e[o>>1]|0|J<<I;L=K&65535;b[o>>1]=L;if((I|0)>(16-H|0)){M=c[p>>2]|0;c[p>>2]=M+1;a[(c[q>>2]|0)+M|0]=K;K=(e[o>>1]|0)>>>8&255;M=c[p>>2]|0;c[p>>2]=M+1;a[(c[q>>2]|0)+M|0]=K;K=c[m>>2]|0;M=J>>>(16-K|0)&65535;b[o>>1]=M;N=M;O=H+ -16+K|0}else{N=L;O=I+H|0}c[m>>2]=O;E=N;F=O;G=y}H=e[t>>1]|0;I=e[u>>1]|0;L=E&65535|I<<F;b[o>>1]=L;if((F|0)>(16-H|0)){K=c[p>>2]|0;c[p>>2]=K+1;a[(c[q>>2]|0)+K|0]=L;K=(e[o>>1]|0)>>>8&255;M=c[p>>2]|0;c[p>>2]=M+1;a[(c[q>>2]|0)+M|0]=K;K=c[m>>2]|0;M=I>>>(16-K|0);b[o>>1]=M;P=H+ -16+K|0;Q=M}else{P=F+H|0;Q=L}c[m>>2]=P;L=G+65533&65535;H=Q&65535|L<<P;b[o>>1]=H;if((P|0)>14){M=c[p>>2]|0;c[p>>2]=M+1;a[(c[q>>2]|0)+M|0]=H;H=(e[o>>1]|0)>>>8&255;M=c[p>>2]|0;c[p>>2]=M+1;a[(c[q>>2]|0)+M|0]=H;H=c[m>>2]|0;b[o>>1]=L>>>(16-H|0);c[m>>2]=H+ -14;break}else{c[m>>2]=P+2;break}}if((C|0)<11){H=e[l>>1]|0;L=c[m>>2]|0;M=e[n>>1]|0;K=e[o>>1]|0|M<<L;b[o>>1]=K;if((L|0)>(16-H|0)){I=c[p>>2]|0;c[p>>2]=I+1;a[(c[q>>2]|0)+I|0]=K;I=(e[o>>1]|0)>>>8&255;J=c[p>>2]|0;c[p>>2]=J+1;a[(c[q>>2]|0)+J|0]=I;I=c[m>>2]|0;J=M>>>(16-I|0);b[o>>1]=J;R=H+ -16+I|0;S=J}else{R=L+H|0;S=K}c[m>>2]=R;K=y+65534&65535;H=S&65535|K<<R;b[o>>1]=H;if((R|0)>13){L=c[p>>2]|0;c[p>>2]=L+1;a[(c[q>>2]|0)+L|0]=H;H=(e[o>>1]|0)>>>8&255;L=c[p>>2]|0;c[p>>2]=L+1;a[(c[q>>2]|0)+L|0]=H;H=c[m>>2]|0;b[o>>1]=K>>>(16-H|0);c[m>>2]=H+ -13;break}else{c[m>>2]=R+3;break}}else{H=e[r>>1]|0;K=c[m>>2]|0;L=e[s>>1]|0;J=e[o>>1]|0|L<<K;b[o>>1]=J;if((K|0)>(16-H|0)){I=c[p>>2]|0;c[p>>2]=I+1;a[(c[q>>2]|0)+I|0]=J;I=(e[o>>1]|0)>>>8&255;M=c[p>>2]|0;c[p>>2]=M+1;a[(c[q>>2]|0)+M|0]=I;I=c[m>>2]|0;M=L>>>(16-I|0);b[o>>1]=M;T=H+ -16+I|0;U=M}else{T=K+H|0;U=J}c[m>>2]=T;J=y+65526&65535;H=U&65535|J<<T;b[o>>1]=H;if((T|0)>9){K=c[p>>2]|0;c[p>>2]=K+1;a[(c[q>>2]|0)+K|0]=H;H=(e[o>>1]|0)>>>8&255;K=c[p>>2]|0;c[p>>2]=K+1;a[(c[q>>2]|0)+K|0]=H;H=c[m>>2]|0;b[o>>1]=J>>>(16-H|0);c[m>>2]=H+ -9;break}else{c[m>>2]=T+7;break}}}else{H=d+(x<<2)+2686|0;J=d+(x<<2)+2684|0;K=c[m>>2]|0;M=b[o>>1]|0;I=C;while(1){L=e[H>>1]|0;V=e[J>>1]|0;W=M&65535|V<<K;X=W&65535;b[o>>1]=X;if((K|0)>(16-L|0)){Y=c[p>>2]|0;c[p>>2]=Y+1;a[(c[q>>2]|0)+Y|0]=W;W=(e[o>>1]|0)>>>8&255;Y=c[p>>2]|0;c[p>>2]=Y+1;a[(c[q>>2]|0)+Y|0]=W;W=c[m>>2]|0;Y=V>>>(16-W|0)&65535;b[o>>1]=Y;Z=Y;_=L+ -16+W|0}else{Z=X;_=K+L|0}c[m>>2]=_;I=I+ -1|0;if((I|0)==0){break}else{K=_;M=Z}}}}while(0);if(A<<16>>16==0){$=x;v=138;w=3;k=z;x=B;j=$;continue}$=x;v=D?6:7;w=D?3:4;k=z;x=B;j=$}i=h;return}function Wf(a,c,d){a=a|0;c=c|0;d=d|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;g=b[c+2>>1]|0;h=g<<16>>16==0;b[c+(d+1<<2)+2>>1]=-1;j=a+2752|0;k=a+2756|0;l=a+2748|0;m=h?138:7;n=h?3:4;h=0;o=g&65535;g=-1;a:while(1){p=0;q=h;do{if((q|0)>(d|0)){break a}q=q+1|0;r=b[c+(q<<2)+2>>1]|0;s=r&65535;p=p+1|0;t=(o|0)==(s|0)}while((p|0)<(m|0)&t);do{if((p|0)>=(n|0)){if((o|0)==0){if((p|0)<11){b[j>>1]=(b[j>>1]|0)+1<<16>>16;break}else{b[k>>1]=(b[k>>1]|0)+1<<16>>16;break}}else{if((o|0)!=(g|0)){u=a+(o<<2)+2684|0;b[u>>1]=(b[u>>1]|0)+1<<16>>16}b[l>>1]=(b[l>>1]|0)+1<<16>>16;break}}else{u=a+(o<<2)+2684|0;b[u>>1]=(e[u>>1]|0)+p}}while(0);if(r<<16>>16==0){v=o;m=138;n=3;h=q;o=s;g=v;continue}v=o;m=t?6:7;n=t?3:4;h=q;o=s;g=v}i=f;return}function Xf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;a=i;d=gg(aa(c,b)|0)|0;i=a;return d|0}function Yf(a,b){a=a|0;b=b|0;a=i;hg(b);i=a;return}function Zf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0;f=i;i=i+944|0;g=f+680|0;h=f+424|0;j=f+192|0;k=f;l=aa(d,b)|0;if((l|0)==0){i=f;return}b=l-d|0;c[k+4>>2]=d;c[k>>2]=d;m=d;n=d;o=2;while(1){p=m+d+n|0;c[k+(o<<2)>>2]=p;if(p>>>0<l>>>0){q=n;n=p;o=o+1|0;m=q}else{break}}m=0-d|0;o=a+b|0;if((b|0)>0){b=(d|0)==0;n=d>>>0>256?256:d;l=(n|0)==(d|0);q=o;p=1;r=0;s=a;t=1;while(1){do{if((p&3|0)!=3){u=t+ -1|0;a:do{if((c[k+(u<<2)>>2]|0)>>>0<(q-s|0)>>>0){c[j>>2]=s;if((t|0)>1){v=t;w=s;x=s;y=1;while(1){z=w+m|0;A=v+ -2|0;B=w+(0-((c[k+(A<<2)>>2]|0)+d))|0;if((nb[e&7](x,B)|0)>-1?(nb[e&7](x,z)|0)>-1:0){C=y;break}D=y+1|0;E=j+(y<<2)|0;if((nb[e&7](B,z)|0)>-1){c[E>>2]=B;F=B;G=v+ -1|0}else{c[E>>2]=z;F=z;G=A}if((G|0)<=1){C=D;break}v=G;w=F;x=c[j>>2]|0;y=D}if((C|0)>=2?(y=j+(C<<2)|0,c[y>>2]=g,!b):0){if((C|0)>0){H=d;I=g}else{x=c[j>>2]|0;Kg(g|0,x|0,n|0)|0;if(l){break}else{J=d;K=n}while(1){J=J-K|0;K=J>>>0>256?256:J;Kg(g|0,x|0,K|0)|0;if((J|0)==(K|0)){break a}}}while(1){x=H>>>0>256?256:H;w=c[j>>2]|0;Kg(I|0,w|0,x|0)|0;v=w;w=0;while(1){D=w+1|0;A=c[j+(D<<2)>>2]|0;Kg(v|0,A|0,x|0)|0;c[j+(w<<2)>>2]=v+x;if((D|0)==(C|0)){break}else{v=A;w=D}}if((H|0)==(x|0)){break a}H=H-x|0;I=c[y>>2]|0}}}}else{_f(s,d,e,p,r,t,0,k)}}while(0);if((t|0)==1){L=p<<1;M=p>>>31|r<<1;N=0;break}else{y=u>>>0>31;w=y?0:p;v=y?t+ -33|0:u;L=w<<v;M=w>>>(32-v|0)|(y?p:r)<<v;N=1;break}}else{c[j>>2]=s;b:do{if((t|0)>1){v=t;y=s;w=s;D=1;while(1){A=y+m|0;z=v+ -2|0;E=y+(0-((c[k+(z<<2)>>2]|0)+d))|0;if((nb[e&7](w,E)|0)>-1?(nb[e&7](w,A)|0)>-1:0){O=D;break}B=D+1|0;P=j+(D<<2)|0;if((nb[e&7](E,A)|0)>-1){c[P>>2]=E;Q=E;R=v+ -1|0}else{c[P>>2]=A;Q=A;R=z}if((R|0)<=1){O=B;break}v=R;y=Q;w=c[j>>2]|0;D=B}if((O|0)>=2?(D=j+(O<<2)|0,c[D>>2]=h,!b):0){if((O|0)>0){S=d;T=h}else{w=c[j>>2]|0;Kg(h|0,w|0,n|0)|0;if(l){break}else{U=d;V=n}while(1){U=U-V|0;V=U>>>0>256?256:U;Kg(h|0,w|0,V|0)|0;if((U|0)==(V|0)){break b}}}while(1){w=S>>>0>256?256:S;y=c[j>>2]|0;Kg(T|0,y|0,w|0)|0;v=y;y=0;while(1){B=y+1|0;z=c[j+(B<<2)>>2]|0;Kg(v|0,z|0,w|0)|0;c[j+(y<<2)>>2]=v+w;if((B|0)==(O|0)){break}else{v=z;y=B}}if((S|0)==(w|0)){break b}S=S-w|0;T=c[D>>2]|0}}}}while(0);L=p>>>2|r<<30;M=r>>>2;N=t+2|0}}while(0);u=L|1;D=s+d|0;if(D>>>0<o>>>0){p=u;r=M;s=D;t=N}else{W=M;X=u;Y=D;Z=N;break}}}else{W=0;X=1;Y=a;Z=1}_f(Y,d,e,X,W,Z,0,k);a=X;X=W;W=Y;Y=Z;while(1){if((Y|0)==1){if((a|0)==1){if((X|0)==0){break}else{_=52}}}else{_=52}if((_|0)==52?(_=0,(Y|0)>=2):0){Z=a>>>30;N=Y+ -2|0;M=(a<<1&2147483646|Z<<31)^3;t=(Z|X<<2)>>>1;_f(W+(0-((c[k+(N<<2)>>2]|0)+d))|0,d,e,M,t,Y+ -1|0,1,k);s=t<<1|Z&1;Z=M<<1|1;M=W+m|0;_f(M,d,e,Z,s,N,1,k);a=Z;X=s;W=M;Y=N;continue}N=a+ -1|0;if((N|0)!=0){if((N&1|0)==0){M=N;N=0;do{N=N+1|0;M=M>>>1}while((M&1|0)==0);if((N|0)!=0){$=N}else{_=57}}else{_=57}if((_|0)==57){_=0;if((X|0)!=0){if((X&1|0)==0){M=X;s=0;while(1){Z=s+1|0;t=M>>>1;if((t&1|0)==0){M=t;s=Z}else{ba=Z;break}}}else{ba=0}}else{ba=32}$=(ba|0)==0?0:ba+32|0}if($>>>0>31){ca=$;_=62}else{da=$;ea=a;fa=X;ga=$}}else{ca=32;_=62}if((_|0)==62){_=0;da=ca+ -32|0;ea=X;fa=0;ga=ca}a=fa<<32-da|ea>>>da;X=fa>>>da;W=W+m|0;Y=ga+Y|0}i=f;return}function _f(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;k=i;i=i+752|0;l=k+232|0;m=k+488|0;n=k;c[n>>2]=a;o=0-b|0;a:do{if((e|0)==1&(f|0)==0){p=a;q=g;r=h;s=1;t=18}else{u=g;v=a;w=h;x=e;y=f;z=a;A=1;while(1){B=v+(0-(c[j+(u<<2)>>2]|0))|0;if((nb[d&7](B,z)|0)<1){p=v;q=u;r=w;s=A;t=18;break a}if((w|0)==0&(u|0)>1){C=c[j+(u+ -2<<2)>>2]|0;if((nb[d&7](v+o|0,B)|0)>-1){D=v;E=u;F=A;break a}if((nb[d&7](v+(0-(C+b))|0,B)|0)>-1){D=v;E=u;F=A;break a}}C=A+1|0;c[n+(A<<2)>>2]=B;G=x+ -1|0;if((G|0)!=0){if((G&1|0)==0){H=G;G=0;do{G=G+1|0;H=H>>>1}while((H&1|0)==0);if((G|0)!=0){I=G}else{t=10}}else{t=10}if((t|0)==10){t=0;if((y|0)!=0){if((y&1|0)==0){H=y;J=0;while(1){K=J+1|0;L=H>>>1;if((L&1|0)==0){H=L;J=K}else{M=K;break}}}else{M=0}}else{M=32}I=(M|0)==0?0:M+32|0}if(I>>>0>31){N=I;t=15}else{O=I;P=x;Q=y;R=I}}else{N=32;t=15}if((t|0)==15){t=0;O=N+ -32|0;P=y;Q=0;R=N}J=Q<<32-O|P>>>O;H=Q>>>O;G=R+u|0;if((J|0)==1&(H|0)==0){D=B;E=G;F=C;break a}u=G;v=B;w=0;x=J;y=H;z=c[n>>2]|0;A=C}}}while(0);if((t|0)==18){if((r|0)==0){D=p;E=q;F=s}else{i=k;return}}b:do{if((F|0)>=2?(s=n+(F<<2)|0,c[s>>2]=l,(b|0)!=0):0){if((F|0)>0){S=b;T=l}else{q=b>>>0>256?256:b;p=c[n>>2]|0;Kg(l|0,p|0,q|0)|0;if((q|0)==(b|0)){break}else{U=b;V=q}while(1){U=U-V|0;V=U>>>0>256?256:U;Kg(l|0,p|0,V|0)|0;if((U|0)==(V|0)){break b}}}while(1){p=S>>>0>256?256:S;q=c[n>>2]|0;Kg(T|0,q|0,p|0)|0;r=q;q=0;while(1){t=q+1|0;R=c[n+(t<<2)>>2]|0;Kg(r|0,R|0,p|0)|0;c[n+(q<<2)>>2]=r+p;if((t|0)==(F|0)){break}else{r=R;q=t}}if((S|0)==(p|0)){break b}S=S-p|0;T=c[s>>2]|0}}}while(0);c[l>>2]=D;c:do{if((E|0)>1){T=E;S=D;F=D;n=1;while(1){V=S+o|0;U=T+ -2|0;s=S+(0-((c[j+(U<<2)>>2]|0)+b))|0;if((nb[d&7](F,s)|0)>-1?(nb[d&7](F,V)|0)>-1:0){W=n;break}q=n+1|0;r=l+(n<<2)|0;if((nb[d&7](s,V)|0)>-1){c[r>>2]=s;X=s;Y=T+ -1|0}else{c[r>>2]=V;X=V;Y=U}if((Y|0)<=1){W=q;break}T=Y;S=X;F=c[l>>2]|0;n=q}if((W|0)>=2?(n=l+(W<<2)|0,c[n>>2]=m,(b|0)!=0):0){if((W|0)>0){Z=b;_=m}else{F=b>>>0>256?256:b;S=c[l>>2]|0;Kg(m|0,S|0,F|0)|0;if((F|0)==(b|0)){$=m;break}else{aa=b;ba=F}while(1){F=aa-ba|0;T=F>>>0>256?256:F;Kg(m|0,S|0,T|0)|0;if((F|0)==(T|0)){$=m;break c}else{aa=F;ba=T}}}while(1){S=Z>>>0>256?256:Z;T=c[l>>2]|0;Kg(_|0,T|0,S|0)|0;F=T;T=0;while(1){q=T+1|0;U=c[l+(q<<2)>>2]|0;Kg(F|0,U|0,S|0)|0;c[l+(T<<2)>>2]=F+S;if((q|0)==(W|0)){break}else{F=U;T=q}}if((Z|0)==(S|0)){$=m;break c}Z=Z-S|0;_=c[n>>2]|0}}else{$=m}}else{$=m}}while(0);i=k;return}function $f(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;e=ag(b,c)|0;i=d;return((a[e]|0)==(c&255)<<24>>24?e:0)|0}function ag(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=d&255;if((f|0)==0){g=b+(Dg(b|0)|0)|0;i=e;return g|0}a:do{if((b&3|0)!=0){h=d&255;j=b;while(1){k=a[j]|0;if(k<<24>>24==0){g=j;l=13;break}m=j+1|0;if(k<<24>>24==h<<24>>24){g=j;l=13;break}if((m&3|0)==0){n=m;break a}else{j=m}}if((l|0)==13){i=e;return g|0}}else{n=b}}while(0);b=aa(f,16843009)|0;f=c[n>>2]|0;b:do{if(((f&-2139062144^-2139062144)&f+ -16843009|0)==0){l=f;j=n;while(1){h=l^b;m=j+4|0;if(((h&-2139062144^-2139062144)&h+ -16843009|0)!=0){o=j;break b}h=c[m>>2]|0;if(((h&-2139062144^-2139062144)&h+ -16843009|0)==0){l=h;j=m}else{o=m;break}}}else{o=n}}while(0);n=d&255;d=o;while(1){o=a[d]|0;if(o<<24>>24==0|o<<24>>24==n<<24>>24){g=d;break}else{d=d+1|0}}i=e;return g|0}function bg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+32|0;f=e;g=a[d]|0;if(!(g<<24>>24==0)?(a[d+1|0]|0)!=0:0){c[f+0>>2]=0;c[f+4>>2]=0;c[f+8>>2]=0;c[f+12>>2]=0;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;c[f+28>>2]=0;h=d;d=g;do{j=d&255;k=f+(j>>>5<<2)|0;c[k>>2]=c[k>>2]|1<<(j&31);h=h+1|0;d=a[h]|0}while(!(d<<24>>24==0));d=a[b]|0;a:do{if(d<<24>>24==0){l=b}else{h=b;j=d;while(1){k=j&255;m=h+1|0;if((c[f+(k>>>5<<2)>>2]&1<<(k&31)|0)!=0){l=h;break a}k=a[m]|0;if(k<<24>>24==0){l=m;break}else{h=m;j=k}}}}while(0);n=l-b|0;i=e;return n|0}n=(ag(b,g<<24>>24)|0)-b|0;i=e;return n|0}function cg(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=(Dg(a|0)|0)+1|0;d=gg(c)|0;if((d|0)==0){e=0;i=b;return e|0}Kg(d|0,a|0,c|0)|0;e=d;i=b;return e|0}function dg(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=b+(Dg(b|0)|0)|0;a:do{if((d|0)==0){g=f}else{h=d;j=c;k=f;while(1){l=a[j]|0;if(l<<24>>24==0){g=k;break a}m=h+ -1|0;n=k+1|0;a[k]=l;if((m|0)==0){g=n;break}else{h=m;j=j+1|0;k=n}}}}while(0);a[g]=0;i=e;return b|0}function eg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+32|0;f=e;c[f+0>>2]=0;c[f+4>>2]=0;c[f+8>>2]=0;c[f+12>>2]=0;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;c[f+28>>2]=0;g=a[d]|0;if(g<<24>>24==0){h=0;i=e;return h|0}if((a[d+1|0]|0)==0){j=b;while(1){if((a[j]|0)==g<<24>>24){j=j+1|0}else{break}}h=j-b|0;i=e;return h|0}else{k=d;l=g}do{g=l&255;d=f+(g>>>5<<2)|0;c[d>>2]=c[d>>2]|1<<(g&31);k=k+1|0;l=a[k]|0}while(!(l<<24>>24==0));l=a[b]|0;a:do{if(l<<24>>24==0){m=b}else{k=b;g=l;while(1){d=g&255;j=k+1|0;if((c[f+(d>>>5<<2)>>2]&1<<(d&31)|0)==0){m=k;break a}d=a[j]|0;if(d<<24>>24==0){m=j;break}else{k=j;g=d}}}}while(0);h=m-b|0;i=e;return h|0}function fg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((b|0)==0){f=c[6912]|0;if((f|0)==0){g=0;i=e;return g|0}else{h=f}}else{h=b}b=eg(h,d)|0;f=h+b|0;if((a[f]|0)==0){c[6912]=0;g=0;i=e;return g|0}j=(bg(f,d)|0)+b|0;b=h+j|0;c[6912]=b;if((a[b]|0)==0){c[6912]=0;g=f;i=e;return g|0}else{c[6912]=h+(j+1);a[b]=0;g=f;i=e;return g|0}return 0}



function gg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ja=0,Ka=0,La=0,Ma=0;b=i;do{if(a>>>0<245){if(a>>>0<11){d=16}else{d=a+11&-8}e=d>>>3;f=c[6914]|0;g=f>>>e;if((g&3|0)!=0){h=(g&1^1)+e|0;j=h<<1;k=27696+(j<<2)|0;l=27696+(j+2<<2)|0;j=c[l>>2]|0;m=j+8|0;n=c[m>>2]|0;do{if((k|0)!=(n|0)){if(n>>>0<(c[27672>>2]|0)>>>0){_a()}o=n+12|0;if((c[o>>2]|0)==(j|0)){c[o>>2]=k;c[l>>2]=n;break}else{_a()}}else{c[6914]=f&~(1<<h)}}while(0);n=h<<3;c[j+4>>2]=n|3;l=j+(n|4)|0;c[l>>2]=c[l>>2]|1;p=m;i=b;return p|0}if(d>>>0>(c[27664>>2]|0)>>>0){if((g|0)!=0){l=2<<e;n=g<<e&(l|0-l);l=(n&0-n)+ -1|0;n=l>>>12&16;k=l>>>n;l=k>>>5&8;o=k>>>l;k=o>>>2&4;q=o>>>k;o=q>>>1&2;r=q>>>o;q=r>>>1&1;s=(l|n|k|o|q)+(r>>>q)|0;q=s<<1;r=27696+(q<<2)|0;o=27696+(q+2<<2)|0;q=c[o>>2]|0;k=q+8|0;n=c[k>>2]|0;do{if((r|0)!=(n|0)){if(n>>>0<(c[27672>>2]|0)>>>0){_a()}l=n+12|0;if((c[l>>2]|0)==(q|0)){c[l>>2]=r;c[o>>2]=n;break}else{_a()}}else{c[6914]=f&~(1<<s)}}while(0);f=s<<3;n=f-d|0;c[q+4>>2]=d|3;o=q+d|0;c[q+(d|4)>>2]=n|1;c[q+f>>2]=n;f=c[27664>>2]|0;if((f|0)!=0){r=c[27676>>2]|0;e=f>>>3;f=e<<1;g=27696+(f<<2)|0;m=c[6914]|0;j=1<<e;if((m&j|0)!=0){e=27696+(f+2<<2)|0;h=c[e>>2]|0;if(h>>>0<(c[27672>>2]|0)>>>0){_a()}else{t=e;u=h}}else{c[6914]=m|j;t=27696+(f+2<<2)|0;u=g}c[t>>2]=r;c[u+12>>2]=r;c[r+8>>2]=u;c[r+12>>2]=g}c[27664>>2]=n;c[27676>>2]=o;p=k;i=b;return p|0}o=c[27660>>2]|0;if((o|0)!=0){n=(o&0-o)+ -1|0;o=n>>>12&16;g=n>>>o;n=g>>>5&8;r=g>>>n;g=r>>>2&4;f=r>>>g;r=f>>>1&2;j=f>>>r;f=j>>>1&1;m=c[27960+((n|o|g|r|f)+(j>>>f)<<2)>>2]|0;f=(c[m+4>>2]&-8)-d|0;j=m;r=m;while(1){m=c[j+16>>2]|0;if((m|0)==0){g=c[j+20>>2]|0;if((g|0)==0){break}else{v=g}}else{v=m}m=(c[v+4>>2]&-8)-d|0;g=m>>>0<f>>>0;f=g?m:f;j=v;r=g?v:r}j=c[27672>>2]|0;if(r>>>0<j>>>0){_a()}k=r+d|0;if(!(r>>>0<k>>>0)){_a()}q=c[r+24>>2]|0;s=c[r+12>>2]|0;do{if((s|0)==(r|0)){g=r+20|0;m=c[g>>2]|0;if((m|0)==0){o=r+16|0;n=c[o>>2]|0;if((n|0)==0){w=0;break}else{x=n;y=o}}else{x=m;y=g}while(1){g=x+20|0;m=c[g>>2]|0;if((m|0)!=0){x=m;y=g;continue}g=x+16|0;m=c[g>>2]|0;if((m|0)==0){break}else{x=m;y=g}}if(y>>>0<j>>>0){_a()}else{c[y>>2]=0;w=x;break}}else{g=c[r+8>>2]|0;if(g>>>0<j>>>0){_a()}m=g+12|0;if((c[m>>2]|0)!=(r|0)){_a()}o=s+8|0;if((c[o>>2]|0)==(r|0)){c[m>>2]=s;c[o>>2]=g;w=s;break}else{_a()}}}while(0);do{if((q|0)!=0){s=c[r+28>>2]|0;j=27960+(s<<2)|0;if((r|0)==(c[j>>2]|0)){c[j>>2]=w;if((w|0)==0){c[27660>>2]=c[27660>>2]&~(1<<s);break}}else{if(q>>>0<(c[27672>>2]|0)>>>0){_a()}s=q+16|0;if((c[s>>2]|0)==(r|0)){c[s>>2]=w}else{c[q+20>>2]=w}if((w|0)==0){break}}if(w>>>0<(c[27672>>2]|0)>>>0){_a()}c[w+24>>2]=q;s=c[r+16>>2]|0;do{if((s|0)!=0){if(s>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[w+16>>2]=s;c[s+24>>2]=w;break}}}while(0);s=c[r+20>>2]|0;if((s|0)!=0){if(s>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[w+20>>2]=s;c[s+24>>2]=w;break}}}}while(0);if(f>>>0<16){q=f+d|0;c[r+4>>2]=q|3;s=r+(q+4)|0;c[s>>2]=c[s>>2]|1}else{c[r+4>>2]=d|3;c[r+(d|4)>>2]=f|1;c[r+(f+d)>>2]=f;s=c[27664>>2]|0;if((s|0)!=0){q=c[27676>>2]|0;j=s>>>3;s=j<<1;g=27696+(s<<2)|0;o=c[6914]|0;m=1<<j;if((o&m|0)!=0){j=27696+(s+2<<2)|0;n=c[j>>2]|0;if(n>>>0<(c[27672>>2]|0)>>>0){_a()}else{z=j;A=n}}else{c[6914]=o|m;z=27696+(s+2<<2)|0;A=g}c[z>>2]=q;c[A+12>>2]=q;c[q+8>>2]=A;c[q+12>>2]=g}c[27664>>2]=f;c[27676>>2]=k}p=r+8|0;i=b;return p|0}else{B=d}}else{B=d}}else{if(!(a>>>0>4294967231)){g=a+11|0;q=g&-8;s=c[27660>>2]|0;if((s|0)!=0){m=0-q|0;o=g>>>8;if((o|0)!=0){if(q>>>0>16777215){C=31}else{g=(o+1048320|0)>>>16&8;n=o<<g;o=(n+520192|0)>>>16&4;j=n<<o;n=(j+245760|0)>>>16&2;h=14-(o|g|n)+(j<<n>>>15)|0;C=q>>>(h+7|0)&1|h<<1}}else{C=0}h=c[27960+(C<<2)>>2]|0;a:do{if((h|0)==0){D=m;E=0;F=0}else{if((C|0)==31){G=0}else{G=25-(C>>>1)|0}n=m;j=0;g=q<<G;o=h;e=0;while(1){l=c[o+4>>2]&-8;H=l-q|0;if(H>>>0<n>>>0){if((l|0)==(q|0)){D=H;E=o;F=o;break a}else{I=H;J=o}}else{I=n;J=e}H=c[o+20>>2]|0;l=c[o+(g>>>31<<2)+16>>2]|0;K=(H|0)==0|(H|0)==(l|0)?j:H;if((l|0)==0){D=I;E=K;F=J;break}else{n=I;j=K;g=g<<1;o=l;e=J}}}}while(0);if((E|0)==0&(F|0)==0){h=2<<C;m=s&(h|0-h);if((m|0)==0){B=q;break}h=(m&0-m)+ -1|0;m=h>>>12&16;r=h>>>m;h=r>>>5&8;k=r>>>h;r=k>>>2&4;f=k>>>r;k=f>>>1&2;e=f>>>k;f=e>>>1&1;L=c[27960+((h|m|r|k|f)+(e>>>f)<<2)>>2]|0}else{L=E}if((L|0)==0){M=D;N=F}else{f=D;e=L;k=F;while(1){r=(c[e+4>>2]&-8)-q|0;m=r>>>0<f>>>0;h=m?r:f;r=m?e:k;m=c[e+16>>2]|0;if((m|0)!=0){f=h;e=m;k=r;continue}m=c[e+20>>2]|0;if((m|0)==0){M=h;N=r;break}else{f=h;e=m;k=r}}}if((N|0)!=0?M>>>0<((c[27664>>2]|0)-q|0)>>>0:0){k=c[27672>>2]|0;if(N>>>0<k>>>0){_a()}e=N+q|0;if(!(N>>>0<e>>>0)){_a()}f=c[N+24>>2]|0;s=c[N+12>>2]|0;do{if((s|0)==(N|0)){r=N+20|0;m=c[r>>2]|0;if((m|0)==0){h=N+16|0;o=c[h>>2]|0;if((o|0)==0){O=0;break}else{P=o;Q=h}}else{P=m;Q=r}while(1){r=P+20|0;m=c[r>>2]|0;if((m|0)!=0){P=m;Q=r;continue}r=P+16|0;m=c[r>>2]|0;if((m|0)==0){break}else{P=m;Q=r}}if(Q>>>0<k>>>0){_a()}else{c[Q>>2]=0;O=P;break}}else{r=c[N+8>>2]|0;if(r>>>0<k>>>0){_a()}m=r+12|0;if((c[m>>2]|0)!=(N|0)){_a()}h=s+8|0;if((c[h>>2]|0)==(N|0)){c[m>>2]=s;c[h>>2]=r;O=s;break}else{_a()}}}while(0);do{if((f|0)!=0){s=c[N+28>>2]|0;k=27960+(s<<2)|0;if((N|0)==(c[k>>2]|0)){c[k>>2]=O;if((O|0)==0){c[27660>>2]=c[27660>>2]&~(1<<s);break}}else{if(f>>>0<(c[27672>>2]|0)>>>0){_a()}s=f+16|0;if((c[s>>2]|0)==(N|0)){c[s>>2]=O}else{c[f+20>>2]=O}if((O|0)==0){break}}if(O>>>0<(c[27672>>2]|0)>>>0){_a()}c[O+24>>2]=f;s=c[N+16>>2]|0;do{if((s|0)!=0){if(s>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[O+16>>2]=s;c[s+24>>2]=O;break}}}while(0);s=c[N+20>>2]|0;if((s|0)!=0){if(s>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[O+20>>2]=s;c[s+24>>2]=O;break}}}}while(0);b:do{if(!(M>>>0<16)){c[N+4>>2]=q|3;c[N+(q|4)>>2]=M|1;c[N+(M+q)>>2]=M;f=M>>>3;if(M>>>0<256){s=f<<1;k=27696+(s<<2)|0;r=c[6914]|0;h=1<<f;if((r&h|0)!=0){f=27696+(s+2<<2)|0;m=c[f>>2]|0;if(m>>>0<(c[27672>>2]|0)>>>0){_a()}else{R=f;S=m}}else{c[6914]=r|h;R=27696+(s+2<<2)|0;S=k}c[R>>2]=e;c[S+12>>2]=e;c[N+(q+8)>>2]=S;c[N+(q+12)>>2]=k;break}k=M>>>8;if((k|0)!=0){if(M>>>0>16777215){T=31}else{s=(k+1048320|0)>>>16&8;h=k<<s;k=(h+520192|0)>>>16&4;r=h<<k;h=(r+245760|0)>>>16&2;m=14-(k|s|h)+(r<<h>>>15)|0;T=M>>>(m+7|0)&1|m<<1}}else{T=0}m=27960+(T<<2)|0;c[N+(q+28)>>2]=T;c[N+(q+20)>>2]=0;c[N+(q+16)>>2]=0;h=c[27660>>2]|0;r=1<<T;if((h&r|0)==0){c[27660>>2]=h|r;c[m>>2]=e;c[N+(q+24)>>2]=m;c[N+(q+12)>>2]=e;c[N+(q+8)>>2]=e;break}r=c[m>>2]|0;if((T|0)==31){U=0}else{U=25-(T>>>1)|0}c:do{if((c[r+4>>2]&-8|0)!=(M|0)){m=M<<U;h=r;while(1){V=h+(m>>>31<<2)+16|0;s=c[V>>2]|0;if((s|0)==0){break}if((c[s+4>>2]&-8|0)==(M|0)){W=s;break c}else{m=m<<1;h=s}}if(V>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[V>>2]=e;c[N+(q+24)>>2]=h;c[N+(q+12)>>2]=e;c[N+(q+8)>>2]=e;break b}}else{W=r}}while(0);r=W+8|0;m=c[r>>2]|0;s=c[27672>>2]|0;if(W>>>0<s>>>0){_a()}if(m>>>0<s>>>0){_a()}else{c[m+12>>2]=e;c[r>>2]=e;c[N+(q+8)>>2]=m;c[N+(q+12)>>2]=W;c[N+(q+24)>>2]=0;break}}else{m=M+q|0;c[N+4>>2]=m|3;r=N+(m+4)|0;c[r>>2]=c[r>>2]|1}}while(0);p=N+8|0;i=b;return p|0}else{B=q}}else{B=q}}else{B=-1}}}while(0);N=c[27664>>2]|0;if(!(B>>>0>N>>>0)){M=N-B|0;W=c[27676>>2]|0;if(M>>>0>15){c[27676>>2]=W+B;c[27664>>2]=M;c[W+(B+4)>>2]=M|1;c[W+N>>2]=M;c[W+4>>2]=B|3}else{c[27664>>2]=0;c[27676>>2]=0;c[W+4>>2]=N|3;M=W+(N+4)|0;c[M>>2]=c[M>>2]|1}p=W+8|0;i=b;return p|0}W=c[27668>>2]|0;if(B>>>0<W>>>0){M=W-B|0;c[27668>>2]=M;W=c[27680>>2]|0;c[27680>>2]=W+B;c[W+(B+4)>>2]=M|1;c[W+4>>2]=B|3;p=W+8|0;i=b;return p|0}do{if((c[7032]|0)==0){W=Ia(30)|0;if((W+ -1&W|0)==0){c[28136>>2]=W;c[28132>>2]=W;c[28140>>2]=-1;c[28144>>2]=-1;c[28148>>2]=0;c[28100>>2]=0;c[7032]=(bb(0)|0)&-16^1431655768;break}else{_a()}}}while(0);W=B+48|0;M=c[28136>>2]|0;N=B+47|0;V=M+N|0;U=0-M|0;M=V&U;if(!(M>>>0>B>>>0)){p=0;i=b;return p|0}T=c[28096>>2]|0;if((T|0)!=0?(S=c[28088>>2]|0,R=S+M|0,R>>>0<=S>>>0|R>>>0>T>>>0):0){p=0;i=b;return p|0}d:do{if((c[28100>>2]&4|0)==0){T=c[27680>>2]|0;e:do{if((T|0)!=0){R=28104|0;while(1){S=c[R>>2]|0;if(!(S>>>0>T>>>0)?(X=R+4|0,(S+(c[X>>2]|0)|0)>>>0>T>>>0):0){break}S=c[R+8>>2]|0;if((S|0)==0){Y=182;break e}else{R=S}}if((R|0)!=0){S=V-(c[27668>>2]|0)&U;if(S>>>0<2147483647){O=Ca(S|0)|0;P=(O|0)==((c[R>>2]|0)+(c[X>>2]|0)|0);Z=O;_=S;$=P?O:-1;aa=P?S:0;Y=191}else{ba=0}}else{Y=182}}else{Y=182}}while(0);do{if((Y|0)==182){T=Ca(0)|0;if((T|0)!=(-1|0)){q=T;S=c[28132>>2]|0;P=S+ -1|0;if((P&q|0)==0){ca=M}else{ca=M-q+(P+q&0-S)|0}S=c[28088>>2]|0;q=S+ca|0;if(ca>>>0>B>>>0&ca>>>0<2147483647){P=c[28096>>2]|0;if((P|0)!=0?q>>>0<=S>>>0|q>>>0>P>>>0:0){ba=0;break}P=Ca(ca|0)|0;q=(P|0)==(T|0);Z=P;_=ca;$=q?T:-1;aa=q?ca:0;Y=191}else{ba=0}}else{ba=0}}}while(0);f:do{if((Y|0)==191){q=0-_|0;if(($|0)!=(-1|0)){da=$;ea=aa;Y=202;break d}do{if((Z|0)!=(-1|0)&_>>>0<2147483647&_>>>0<W>>>0?(T=c[28136>>2]|0,P=N-_+T&0-T,P>>>0<2147483647):0){if((Ca(P|0)|0)==(-1|0)){Ca(q|0)|0;ba=aa;break f}else{fa=P+_|0;break}}else{fa=_}}while(0);if((Z|0)==(-1|0)){ba=aa}else{da=Z;ea=fa;Y=202;break d}}}while(0);c[28100>>2]=c[28100>>2]|4;ga=ba;Y=199}else{ga=0;Y=199}}while(0);if((((Y|0)==199?M>>>0<2147483647:0)?(ba=Ca(M|0)|0,M=Ca(0)|0,(M|0)!=(-1|0)&(ba|0)!=(-1|0)&ba>>>0<M>>>0):0)?(fa=M-ba|0,M=fa>>>0>(B+40|0)>>>0,M):0){da=ba;ea=M?fa:ga;Y=202}if((Y|0)==202){ga=(c[28088>>2]|0)+ea|0;c[28088>>2]=ga;if(ga>>>0>(c[28092>>2]|0)>>>0){c[28092>>2]=ga}ga=c[27680>>2]|0;g:do{if((ga|0)!=0){fa=28104|0;while(1){ha=c[fa>>2]|0;ia=fa+4|0;ja=c[ia>>2]|0;if((da|0)==(ha+ja|0)){Y=214;break}M=c[fa+8>>2]|0;if((M|0)==0){break}else{fa=M}}if(((Y|0)==214?(c[fa+12>>2]&8|0)==0:0)?ga>>>0>=ha>>>0&ga>>>0<da>>>0:0){c[ia>>2]=ja+ea;M=(c[27668>>2]|0)+ea|0;ba=ga+8|0;if((ba&7|0)==0){ka=0}else{ka=0-ba&7}ba=M-ka|0;c[27680>>2]=ga+ka;c[27668>>2]=ba;c[ga+(ka+4)>>2]=ba|1;c[ga+(M+4)>>2]=40;c[27684>>2]=c[28144>>2];break}if(da>>>0<(c[27672>>2]|0)>>>0){c[27672>>2]=da}M=da+ea|0;ba=28104|0;while(1){if((c[ba>>2]|0)==(M|0)){Y=224;break}Z=c[ba+8>>2]|0;if((Z|0)==0){break}else{ba=Z}}if((Y|0)==224?(c[ba+12>>2]&8|0)==0:0){c[ba>>2]=da;M=ba+4|0;c[M>>2]=(c[M>>2]|0)+ea;M=da+8|0;if((M&7|0)==0){la=0}else{la=0-M&7}M=da+(ea+8)|0;if((M&7|0)==0){ma=0}else{ma=0-M&7}M=da+(ma+ea)|0;fa=la+B|0;Z=da+fa|0;aa=M-(da+la)-B|0;c[da+(la+4)>>2]=B|3;h:do{if((M|0)!=(c[27680>>2]|0)){if((M|0)==(c[27676>>2]|0)){_=(c[27664>>2]|0)+aa|0;c[27664>>2]=_;c[27676>>2]=Z;c[da+(fa+4)>>2]=_|1;c[da+(_+fa)>>2]=_;break}_=ea+4|0;N=c[da+(_+ma)>>2]|0;if((N&3|0)==1){W=N&-8;$=N>>>3;do{if(!(N>>>0<256)){ca=c[da+((ma|24)+ea)>>2]|0;X=c[da+(ea+12+ma)>>2]|0;do{if((X|0)==(M|0)){U=ma|16;V=da+(_+U)|0;q=c[V>>2]|0;if((q|0)==0){R=da+(U+ea)|0;U=c[R>>2]|0;if((U|0)==0){na=0;break}else{oa=U;pa=R}}else{oa=q;pa=V}while(1){V=oa+20|0;q=c[V>>2]|0;if((q|0)!=0){oa=q;pa=V;continue}V=oa+16|0;q=c[V>>2]|0;if((q|0)==0){break}else{oa=q;pa=V}}if(pa>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[pa>>2]=0;na=oa;break}}else{V=c[da+((ma|8)+ea)>>2]|0;if(V>>>0<(c[27672>>2]|0)>>>0){_a()}q=V+12|0;if((c[q>>2]|0)!=(M|0)){_a()}R=X+8|0;if((c[R>>2]|0)==(M|0)){c[q>>2]=X;c[R>>2]=V;na=X;break}else{_a()}}}while(0);if((ca|0)!=0){X=c[da+(ea+28+ma)>>2]|0;h=27960+(X<<2)|0;if((M|0)==(c[h>>2]|0)){c[h>>2]=na;if((na|0)==0){c[27660>>2]=c[27660>>2]&~(1<<X);break}}else{if(ca>>>0<(c[27672>>2]|0)>>>0){_a()}X=ca+16|0;if((c[X>>2]|0)==(M|0)){c[X>>2]=na}else{c[ca+20>>2]=na}if((na|0)==0){break}}if(na>>>0<(c[27672>>2]|0)>>>0){_a()}c[na+24>>2]=ca;X=ma|16;h=c[da+(X+ea)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[na+16>>2]=h;c[h+24>>2]=na;break}}}while(0);h=c[da+(_+X)>>2]|0;if((h|0)!=0){if(h>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[na+20>>2]=h;c[h+24>>2]=na;break}}}}else{h=c[da+((ma|8)+ea)>>2]|0;ca=c[da+(ea+12+ma)>>2]|0;V=27696+($<<1<<2)|0;if((h|0)!=(V|0)){if(h>>>0<(c[27672>>2]|0)>>>0){_a()}if((c[h+12>>2]|0)!=(M|0)){_a()}}if((ca|0)==(h|0)){c[6914]=c[6914]&~(1<<$);break}if((ca|0)!=(V|0)){if(ca>>>0<(c[27672>>2]|0)>>>0){_a()}V=ca+8|0;if((c[V>>2]|0)==(M|0)){qa=V}else{_a()}}else{qa=ca+8|0}c[h+12>>2]=ca;c[qa>>2]=h}}while(0);ra=da+((W|ma)+ea)|0;sa=W+aa|0}else{ra=M;sa=aa}$=ra+4|0;c[$>>2]=c[$>>2]&-2;c[da+(fa+4)>>2]=sa|1;c[da+(sa+fa)>>2]=sa;$=sa>>>3;if(sa>>>0<256){_=$<<1;N=27696+(_<<2)|0;h=c[6914]|0;ca=1<<$;if((h&ca|0)!=0){$=27696+(_+2<<2)|0;V=c[$>>2]|0;if(V>>>0<(c[27672>>2]|0)>>>0){_a()}else{ta=$;ua=V}}else{c[6914]=h|ca;ta=27696+(_+2<<2)|0;ua=N}c[ta>>2]=Z;c[ua+12>>2]=Z;c[da+(fa+8)>>2]=ua;c[da+(fa+12)>>2]=N;break}N=sa>>>8;if((N|0)!=0){if(sa>>>0>16777215){va=31}else{_=(N+1048320|0)>>>16&8;ca=N<<_;N=(ca+520192|0)>>>16&4;h=ca<<N;ca=(h+245760|0)>>>16&2;V=14-(N|_|ca)+(h<<ca>>>15)|0;va=sa>>>(V+7|0)&1|V<<1}}else{va=0}V=27960+(va<<2)|0;c[da+(fa+28)>>2]=va;c[da+(fa+20)>>2]=0;c[da+(fa+16)>>2]=0;ca=c[27660>>2]|0;h=1<<va;if((ca&h|0)==0){c[27660>>2]=ca|h;c[V>>2]=Z;c[da+(fa+24)>>2]=V;c[da+(fa+12)>>2]=Z;c[da+(fa+8)>>2]=Z;break}h=c[V>>2]|0;if((va|0)==31){wa=0}else{wa=25-(va>>>1)|0}i:do{if((c[h+4>>2]&-8|0)!=(sa|0)){V=sa<<wa;ca=h;while(1){xa=ca+(V>>>31<<2)+16|0;_=c[xa>>2]|0;if((_|0)==0){break}if((c[_+4>>2]&-8|0)==(sa|0)){ya=_;break i}else{V=V<<1;ca=_}}if(xa>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[xa>>2]=Z;c[da+(fa+24)>>2]=ca;c[da+(fa+12)>>2]=Z;c[da+(fa+8)>>2]=Z;break h}}else{ya=h}}while(0);h=ya+8|0;W=c[h>>2]|0;V=c[27672>>2]|0;if(ya>>>0<V>>>0){_a()}if(W>>>0<V>>>0){_a()}else{c[W+12>>2]=Z;c[h>>2]=Z;c[da+(fa+8)>>2]=W;c[da+(fa+12)>>2]=ya;c[da+(fa+24)>>2]=0;break}}else{W=(c[27668>>2]|0)+aa|0;c[27668>>2]=W;c[27680>>2]=Z;c[da+(fa+4)>>2]=W|1}}while(0);p=da+(la|8)|0;i=b;return p|0}fa=28104|0;while(1){za=c[fa>>2]|0;if(!(za>>>0>ga>>>0)?(Aa=c[fa+4>>2]|0,Ba=za+Aa|0,Ba>>>0>ga>>>0):0){break}fa=c[fa+8>>2]|0}fa=za+(Aa+ -39)|0;if((fa&7|0)==0){Da=0}else{Da=0-fa&7}fa=za+(Aa+ -47+Da)|0;Z=fa>>>0<(ga+16|0)>>>0?ga:fa;fa=Z+8|0;aa=da+8|0;if((aa&7|0)==0){Ea=0}else{Ea=0-aa&7}aa=ea+ -40-Ea|0;c[27680>>2]=da+Ea;c[27668>>2]=aa;c[da+(Ea+4)>>2]=aa|1;c[da+(ea+ -36)>>2]=40;c[27684>>2]=c[28144>>2];c[Z+4>>2]=27;c[fa+0>>2]=c[28104>>2];c[fa+4>>2]=c[28108>>2];c[fa+8>>2]=c[28112>>2];c[fa+12>>2]=c[28116>>2];c[28104>>2]=da;c[28108>>2]=ea;c[28116>>2]=0;c[28112>>2]=fa;fa=Z+28|0;c[fa>>2]=7;if((Z+32|0)>>>0<Ba>>>0){aa=fa;while(1){fa=aa+4|0;c[fa>>2]=7;if((aa+8|0)>>>0<Ba>>>0){aa=fa}else{break}}}if((Z|0)!=(ga|0)){aa=Z-ga|0;fa=ga+(aa+4)|0;c[fa>>2]=c[fa>>2]&-2;c[ga+4>>2]=aa|1;c[ga+aa>>2]=aa;fa=aa>>>3;if(aa>>>0<256){M=fa<<1;ba=27696+(M<<2)|0;W=c[6914]|0;h=1<<fa;if((W&h|0)!=0){fa=27696+(M+2<<2)|0;V=c[fa>>2]|0;if(V>>>0<(c[27672>>2]|0)>>>0){_a()}else{Fa=fa;Ga=V}}else{c[6914]=W|h;Fa=27696+(M+2<<2)|0;Ga=ba}c[Fa>>2]=ga;c[Ga+12>>2]=ga;c[ga+8>>2]=Ga;c[ga+12>>2]=ba;break}ba=aa>>>8;if((ba|0)!=0){if(aa>>>0>16777215){Ha=31}else{M=(ba+1048320|0)>>>16&8;h=ba<<M;ba=(h+520192|0)>>>16&4;W=h<<ba;h=(W+245760|0)>>>16&2;V=14-(ba|M|h)+(W<<h>>>15)|0;Ha=aa>>>(V+7|0)&1|V<<1}}else{Ha=0}V=27960+(Ha<<2)|0;c[ga+28>>2]=Ha;c[ga+20>>2]=0;c[ga+16>>2]=0;h=c[27660>>2]|0;W=1<<Ha;if((h&W|0)==0){c[27660>>2]=h|W;c[V>>2]=ga;c[ga+24>>2]=V;c[ga+12>>2]=ga;c[ga+8>>2]=ga;break}W=c[V>>2]|0;if((Ha|0)==31){Ja=0}else{Ja=25-(Ha>>>1)|0}j:do{if((c[W+4>>2]&-8|0)!=(aa|0)){V=aa<<Ja;h=W;while(1){Ka=h+(V>>>31<<2)+16|0;M=c[Ka>>2]|0;if((M|0)==0){break}if((c[M+4>>2]&-8|0)==(aa|0)){La=M;break j}else{V=V<<1;h=M}}if(Ka>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[Ka>>2]=ga;c[ga+24>>2]=h;c[ga+12>>2]=ga;c[ga+8>>2]=ga;break g}}else{La=W}}while(0);W=La+8|0;aa=c[W>>2]|0;Z=c[27672>>2]|0;if(La>>>0<Z>>>0){_a()}if(aa>>>0<Z>>>0){_a()}else{c[aa+12>>2]=ga;c[W>>2]=ga;c[ga+8>>2]=aa;c[ga+12>>2]=La;c[ga+24>>2]=0;break}}}else{aa=c[27672>>2]|0;if((aa|0)==0|da>>>0<aa>>>0){c[27672>>2]=da}c[28104>>2]=da;c[28108>>2]=ea;c[28116>>2]=0;c[27692>>2]=c[7032];c[27688>>2]=-1;aa=0;do{W=aa<<1;Z=27696+(W<<2)|0;c[27696+(W+3<<2)>>2]=Z;c[27696+(W+2<<2)>>2]=Z;aa=aa+1|0}while((aa|0)!=32);aa=da+8|0;if((aa&7|0)==0){Ma=0}else{Ma=0-aa&7}aa=ea+ -40-Ma|0;c[27680>>2]=da+Ma;c[27668>>2]=aa;c[da+(Ma+4)>>2]=aa|1;c[da+(ea+ -36)>>2]=40;c[27684>>2]=c[28144>>2]}}while(0);ea=c[27668>>2]|0;if(ea>>>0>B>>>0){da=ea-B|0;c[27668>>2]=da;ea=c[27680>>2]|0;c[27680>>2]=ea+B;c[ea+(B+4)>>2]=da|1;c[ea+4>>2]=B|3;p=ea+8|0;i=b;return p|0}}c[(Sa()|0)>>2]=12;p=0;i=b;return p|0}function hg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=i;if((a|0)==0){i=b;return}d=a+ -8|0;e=c[27672>>2]|0;if(d>>>0<e>>>0){_a()}f=c[a+ -4>>2]|0;g=f&3;if((g|0)==1){_a()}h=f&-8;j=a+(h+ -8)|0;do{if((f&1|0)==0){k=c[d>>2]|0;if((g|0)==0){i=b;return}l=-8-k|0;m=a+l|0;n=k+h|0;if(m>>>0<e>>>0){_a()}if((m|0)==(c[27676>>2]|0)){o=a+(h+ -4)|0;if((c[o>>2]&3|0)!=3){p=m;q=n;break}c[27664>>2]=n;c[o>>2]=c[o>>2]&-2;c[a+(l+4)>>2]=n|1;c[j>>2]=n;i=b;return}o=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;r=c[a+(l+12)>>2]|0;s=27696+(o<<1<<2)|0;if((k|0)!=(s|0)){if(k>>>0<e>>>0){_a()}if((c[k+12>>2]|0)!=(m|0)){_a()}}if((r|0)==(k|0)){c[6914]=c[6914]&~(1<<o);p=m;q=n;break}if((r|0)!=(s|0)){if(r>>>0<e>>>0){_a()}s=r+8|0;if((c[s>>2]|0)==(m|0)){t=s}else{_a()}}else{t=r+8|0}c[k+12>>2]=r;c[t>>2]=k;p=m;q=n;break}k=c[a+(l+24)>>2]|0;r=c[a+(l+12)>>2]|0;do{if((r|0)==(m|0)){s=a+(l+20)|0;o=c[s>>2]|0;if((o|0)==0){u=a+(l+16)|0;v=c[u>>2]|0;if((v|0)==0){w=0;break}else{x=v;y=u}}else{x=o;y=s}while(1){s=x+20|0;o=c[s>>2]|0;if((o|0)!=0){x=o;y=s;continue}s=x+16|0;o=c[s>>2]|0;if((o|0)==0){break}else{x=o;y=s}}if(y>>>0<e>>>0){_a()}else{c[y>>2]=0;w=x;break}}else{s=c[a+(l+8)>>2]|0;if(s>>>0<e>>>0){_a()}o=s+12|0;if((c[o>>2]|0)!=(m|0)){_a()}u=r+8|0;if((c[u>>2]|0)==(m|0)){c[o>>2]=r;c[u>>2]=s;w=r;break}else{_a()}}}while(0);if((k|0)!=0){r=c[a+(l+28)>>2]|0;s=27960+(r<<2)|0;if((m|0)==(c[s>>2]|0)){c[s>>2]=w;if((w|0)==0){c[27660>>2]=c[27660>>2]&~(1<<r);p=m;q=n;break}}else{if(k>>>0<(c[27672>>2]|0)>>>0){_a()}r=k+16|0;if((c[r>>2]|0)==(m|0)){c[r>>2]=w}else{c[k+20>>2]=w}if((w|0)==0){p=m;q=n;break}}if(w>>>0<(c[27672>>2]|0)>>>0){_a()}c[w+24>>2]=k;r=c[a+(l+16)>>2]|0;do{if((r|0)!=0){if(r>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[w+16>>2]=r;c[r+24>>2]=w;break}}}while(0);r=c[a+(l+20)>>2]|0;if((r|0)!=0){if(r>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[w+20>>2]=r;c[r+24>>2]=w;p=m;q=n;break}}else{p=m;q=n}}else{p=m;q=n}}else{p=d;q=h}}while(0);if(!(p>>>0<j>>>0)){_a()}d=a+(h+ -4)|0;w=c[d>>2]|0;if((w&1|0)==0){_a()}if((w&2|0)==0){if((j|0)==(c[27680>>2]|0)){e=(c[27668>>2]|0)+q|0;c[27668>>2]=e;c[27680>>2]=p;c[p+4>>2]=e|1;if((p|0)!=(c[27676>>2]|0)){i=b;return}c[27676>>2]=0;c[27664>>2]=0;i=b;return}if((j|0)==(c[27676>>2]|0)){e=(c[27664>>2]|0)+q|0;c[27664>>2]=e;c[27676>>2]=p;c[p+4>>2]=e|1;c[p+e>>2]=e;i=b;return}e=(w&-8)+q|0;x=w>>>3;do{if(!(w>>>0<256)){y=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(j|0)){g=a+(h+12)|0;f=c[g>>2]|0;if((f|0)==0){r=a+(h+8)|0;k=c[r>>2]|0;if((k|0)==0){z=0;break}else{A=k;B=r}}else{A=f;B=g}while(1){g=A+20|0;f=c[g>>2]|0;if((f|0)!=0){A=f;B=g;continue}g=A+16|0;f=c[g>>2]|0;if((f|0)==0){break}else{A=f;B=g}}if(B>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[B>>2]=0;z=A;break}}else{g=c[a+h>>2]|0;if(g>>>0<(c[27672>>2]|0)>>>0){_a()}f=g+12|0;if((c[f>>2]|0)!=(j|0)){_a()}r=t+8|0;if((c[r>>2]|0)==(j|0)){c[f>>2]=t;c[r>>2]=g;z=t;break}else{_a()}}}while(0);if((y|0)!=0){t=c[a+(h+20)>>2]|0;n=27960+(t<<2)|0;if((j|0)==(c[n>>2]|0)){c[n>>2]=z;if((z|0)==0){c[27660>>2]=c[27660>>2]&~(1<<t);break}}else{if(y>>>0<(c[27672>>2]|0)>>>0){_a()}t=y+16|0;if((c[t>>2]|0)==(j|0)){c[t>>2]=z}else{c[y+20>>2]=z}if((z|0)==0){break}}if(z>>>0<(c[27672>>2]|0)>>>0){_a()}c[z+24>>2]=y;t=c[a+(h+8)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[z+16>>2]=t;c[t+24>>2]=z;break}}}while(0);t=c[a+(h+12)>>2]|0;if((t|0)!=0){if(t>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[z+20>>2]=t;c[t+24>>2]=z;break}}}}else{t=c[a+h>>2]|0;y=c[a+(h|4)>>2]|0;n=27696+(x<<1<<2)|0;if((t|0)!=(n|0)){if(t>>>0<(c[27672>>2]|0)>>>0){_a()}if((c[t+12>>2]|0)!=(j|0)){_a()}}if((y|0)==(t|0)){c[6914]=c[6914]&~(1<<x);break}if((y|0)!=(n|0)){if(y>>>0<(c[27672>>2]|0)>>>0){_a()}n=y+8|0;if((c[n>>2]|0)==(j|0)){C=n}else{_a()}}else{C=y+8|0}c[t+12>>2]=y;c[C>>2]=t}}while(0);c[p+4>>2]=e|1;c[p+e>>2]=e;if((p|0)==(c[27676>>2]|0)){c[27664>>2]=e;i=b;return}else{D=e}}else{c[d>>2]=w&-2;c[p+4>>2]=q|1;c[p+q>>2]=q;D=q}q=D>>>3;if(D>>>0<256){w=q<<1;d=27696+(w<<2)|0;e=c[6914]|0;C=1<<q;if((e&C|0)!=0){q=27696+(w+2<<2)|0;j=c[q>>2]|0;if(j>>>0<(c[27672>>2]|0)>>>0){_a()}else{E=q;F=j}}else{c[6914]=e|C;E=27696+(w+2<<2)|0;F=d}c[E>>2]=p;c[F+12>>2]=p;c[p+8>>2]=F;c[p+12>>2]=d;i=b;return}d=D>>>8;if((d|0)!=0){if(D>>>0>16777215){G=31}else{F=(d+1048320|0)>>>16&8;E=d<<F;d=(E+520192|0)>>>16&4;w=E<<d;E=(w+245760|0)>>>16&2;C=14-(d|F|E)+(w<<E>>>15)|0;G=D>>>(C+7|0)&1|C<<1}}else{G=0}C=27960+(G<<2)|0;c[p+28>>2]=G;c[p+20>>2]=0;c[p+16>>2]=0;E=c[27660>>2]|0;w=1<<G;a:do{if((E&w|0)!=0){F=c[C>>2]|0;if((G|0)==31){H=0}else{H=25-(G>>>1)|0}b:do{if((c[F+4>>2]&-8|0)!=(D|0)){d=D<<H;e=F;while(1){I=e+(d>>>31<<2)+16|0;j=c[I>>2]|0;if((j|0)==0){break}if((c[j+4>>2]&-8|0)==(D|0)){J=j;break b}else{d=d<<1;e=j}}if(I>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[I>>2]=p;c[p+24>>2]=e;c[p+12>>2]=p;c[p+8>>2]=p;break a}}else{J=F}}while(0);F=J+8|0;d=c[F>>2]|0;j=c[27672>>2]|0;if(J>>>0<j>>>0){_a()}if(d>>>0<j>>>0){_a()}else{c[d+12>>2]=p;c[F>>2]=p;c[p+8>>2]=d;c[p+12>>2]=J;c[p+24>>2]=0;break}}else{c[27660>>2]=E|w;c[C>>2]=p;c[p+24>>2]=C;c[p+12>>2]=p;c[p+8>>2]=p}}while(0);p=(c[27688>>2]|0)+ -1|0;c[27688>>2]=p;if((p|0)==0){K=28112|0}else{i=b;return}while(1){p=c[K>>2]|0;if((p|0)==0){break}else{K=p+8|0}}c[27688>>2]=-1;i=b;return}function ig(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;if((a|0)!=0){e=aa(b,a)|0;if((b|a)>>>0>65535){f=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}else{f=e}}else{f=0}e=gg(f)|0;if((e|0)==0){i=d;return e|0}if((c[e+ -4>>2]&3|0)==0){i=d;return e|0}Eg(e|0,0,f|0)|0;i=d;return e|0}function jg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;do{if((a|0)!=0){if(b>>>0>4294967231){c[(Sa()|0)>>2]=12;e=0;break}if(b>>>0<11){f=16}else{f=b+11&-8}g=kg(a+ -8|0,f)|0;if((g|0)!=0){e=g+8|0;break}g=gg(b)|0;if((g|0)==0){e=0}else{h=c[a+ -4>>2]|0;j=(h&-8)-((h&3|0)==0?8:4)|0;Kg(g|0,a|0,(j>>>0<b>>>0?j:b)|0)|0;hg(a);e=g}}else{e=gg(b)|0}}while(0);i=d;return e|0}function kg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;e=a+4|0;f=c[e>>2]|0;g=f&-8;h=a+g|0;j=c[27672>>2]|0;if(a>>>0<j>>>0){_a()}k=f&3;if(!((k|0)!=1&a>>>0<h>>>0)){_a()}l=a+(g|4)|0;m=c[l>>2]|0;if((m&1|0)==0){_a()}if((k|0)==0){if(b>>>0<256){n=0;i=d;return n|0}if(!(g>>>0<(b+4|0)>>>0)?!((g-b|0)>>>0>c[28136>>2]<<1>>>0):0){n=a;i=d;return n|0}n=0;i=d;return n|0}if(!(g>>>0<b>>>0)){k=g-b|0;if(!(k>>>0>15)){n=a;i=d;return n|0}c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;lg(a+b|0,k);n=a;i=d;return n|0}if((h|0)==(c[27680>>2]|0)){k=(c[27668>>2]|0)+g|0;if(!(k>>>0>b>>>0)){n=0;i=d;return n|0}l=k-b|0;c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=l|1;c[27680>>2]=a+b;c[27668>>2]=l;n=a;i=d;return n|0}if((h|0)==(c[27676>>2]|0)){l=(c[27664>>2]|0)+g|0;if(l>>>0<b>>>0){n=0;i=d;return n|0}k=l-b|0;if(k>>>0>15){c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=k|1;c[a+l>>2]=k;o=a+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=a+b|0;q=k}else{c[e>>2]=f&1|l|2;f=a+(l+4)|0;c[f>>2]=c[f>>2]|1;p=0;q=0}c[27664>>2]=q;c[27676>>2]=p;n=a;i=d;return n|0}if((m&2|0)!=0){n=0;i=d;return n|0}p=(m&-8)+g|0;if(p>>>0<b>>>0){n=0;i=d;return n|0}q=p-b|0;f=m>>>3;do{if(!(m>>>0<256)){l=c[a+(g+24)>>2]|0;k=c[a+(g+12)>>2]|0;do{if((k|0)==(h|0)){o=a+(g+20)|0;r=c[o>>2]|0;if((r|0)==0){s=a+(g+16)|0;t=c[s>>2]|0;if((t|0)==0){u=0;break}else{v=t;w=s}}else{v=r;w=o}while(1){o=v+20|0;r=c[o>>2]|0;if((r|0)!=0){v=r;w=o;continue}o=v+16|0;r=c[o>>2]|0;if((r|0)==0){break}else{v=r;w=o}}if(w>>>0<j>>>0){_a()}else{c[w>>2]=0;u=v;break}}else{o=c[a+(g+8)>>2]|0;if(o>>>0<j>>>0){_a()}r=o+12|0;if((c[r>>2]|0)!=(h|0)){_a()}s=k+8|0;if((c[s>>2]|0)==(h|0)){c[r>>2]=k;c[s>>2]=o;u=k;break}else{_a()}}}while(0);if((l|0)!=0){k=c[a+(g+28)>>2]|0;o=27960+(k<<2)|0;if((h|0)==(c[o>>2]|0)){c[o>>2]=u;if((u|0)==0){c[27660>>2]=c[27660>>2]&~(1<<k);break}}else{if(l>>>0<(c[27672>>2]|0)>>>0){_a()}k=l+16|0;if((c[k>>2]|0)==(h|0)){c[k>>2]=u}else{c[l+20>>2]=u}if((u|0)==0){break}}if(u>>>0<(c[27672>>2]|0)>>>0){_a()}c[u+24>>2]=l;k=c[a+(g+16)>>2]|0;do{if((k|0)!=0){if(k>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[u+16>>2]=k;c[k+24>>2]=u;break}}}while(0);k=c[a+(g+20)>>2]|0;if((k|0)!=0){if(k>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[u+20>>2]=k;c[k+24>>2]=u;break}}}}else{k=c[a+(g+8)>>2]|0;l=c[a+(g+12)>>2]|0;o=27696+(f<<1<<2)|0;if((k|0)!=(o|0)){if(k>>>0<j>>>0){_a()}if((c[k+12>>2]|0)!=(h|0)){_a()}}if((l|0)==(k|0)){c[6914]=c[6914]&~(1<<f);break}if((l|0)!=(o|0)){if(l>>>0<j>>>0){_a()}o=l+8|0;if((c[o>>2]|0)==(h|0)){x=o}else{_a()}}else{x=l+8|0}c[k+12>>2]=l;c[x>>2]=k}}while(0);if(q>>>0<16){c[e>>2]=p|c[e>>2]&1|2;x=a+(p|4)|0;c[x>>2]=c[x>>2]|1;n=a;i=d;return n|0}else{c[e>>2]=c[e>>2]&1|b|2;c[a+(b+4)>>2]=q|3;e=a+(p|4)|0;c[e>>2]=c[e>>2]|1;lg(a+b|0,q);n=a;i=d;return n|0}return 0}function lg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;e=a+b|0;f=c[a+4>>2]|0;do{if((f&1|0)==0){g=c[a>>2]|0;if((f&3|0)==0){i=d;return}h=a+(0-g)|0;j=g+b|0;k=c[27672>>2]|0;if(h>>>0<k>>>0){_a()}if((h|0)==(c[27676>>2]|0)){l=a+(b+4)|0;if((c[l>>2]&3|0)!=3){m=h;n=j;break}c[27664>>2]=j;c[l>>2]=c[l>>2]&-2;c[a+(4-g)>>2]=j|1;c[e>>2]=j;i=d;return}l=g>>>3;if(g>>>0<256){o=c[a+(8-g)>>2]|0;p=c[a+(12-g)>>2]|0;q=27696+(l<<1<<2)|0;if((o|0)!=(q|0)){if(o>>>0<k>>>0){_a()}if((c[o+12>>2]|0)!=(h|0)){_a()}}if((p|0)==(o|0)){c[6914]=c[6914]&~(1<<l);m=h;n=j;break}if((p|0)!=(q|0)){if(p>>>0<k>>>0){_a()}q=p+8|0;if((c[q>>2]|0)==(h|0)){r=q}else{_a()}}else{r=p+8|0}c[o+12>>2]=p;c[r>>2]=o;m=h;n=j;break}o=c[a+(24-g)>>2]|0;p=c[a+(12-g)>>2]|0;do{if((p|0)==(h|0)){q=16-g|0;l=a+(q+4)|0;s=c[l>>2]|0;if((s|0)==0){t=a+q|0;q=c[t>>2]|0;if((q|0)==0){u=0;break}else{v=q;w=t}}else{v=s;w=l}while(1){l=v+20|0;s=c[l>>2]|0;if((s|0)!=0){v=s;w=l;continue}l=v+16|0;s=c[l>>2]|0;if((s|0)==0){break}else{v=s;w=l}}if(w>>>0<k>>>0){_a()}else{c[w>>2]=0;u=v;break}}else{l=c[a+(8-g)>>2]|0;if(l>>>0<k>>>0){_a()}s=l+12|0;if((c[s>>2]|0)!=(h|0)){_a()}t=p+8|0;if((c[t>>2]|0)==(h|0)){c[s>>2]=p;c[t>>2]=l;u=p;break}else{_a()}}}while(0);if((o|0)!=0){p=c[a+(28-g)>>2]|0;k=27960+(p<<2)|0;if((h|0)==(c[k>>2]|0)){c[k>>2]=u;if((u|0)==0){c[27660>>2]=c[27660>>2]&~(1<<p);m=h;n=j;break}}else{if(o>>>0<(c[27672>>2]|0)>>>0){_a()}p=o+16|0;if((c[p>>2]|0)==(h|0)){c[p>>2]=u}else{c[o+20>>2]=u}if((u|0)==0){m=h;n=j;break}}if(u>>>0<(c[27672>>2]|0)>>>0){_a()}c[u+24>>2]=o;p=16-g|0;k=c[a+p>>2]|0;do{if((k|0)!=0){if(k>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[u+16>>2]=k;c[k+24>>2]=u;break}}}while(0);k=c[a+(p+4)>>2]|0;if((k|0)!=0){if(k>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[u+20>>2]=k;c[k+24>>2]=u;m=h;n=j;break}}else{m=h;n=j}}else{m=h;n=j}}else{m=a;n=b}}while(0);u=c[27672>>2]|0;if(e>>>0<u>>>0){_a()}v=a+(b+4)|0;w=c[v>>2]|0;if((w&2|0)==0){if((e|0)==(c[27680>>2]|0)){r=(c[27668>>2]|0)+n|0;c[27668>>2]=r;c[27680>>2]=m;c[m+4>>2]=r|1;if((m|0)!=(c[27676>>2]|0)){i=d;return}c[27676>>2]=0;c[27664>>2]=0;i=d;return}if((e|0)==(c[27676>>2]|0)){r=(c[27664>>2]|0)+n|0;c[27664>>2]=r;c[27676>>2]=m;c[m+4>>2]=r|1;c[m+r>>2]=r;i=d;return}r=(w&-8)+n|0;f=w>>>3;do{if(!(w>>>0<256)){k=c[a+(b+24)>>2]|0;g=c[a+(b+12)>>2]|0;do{if((g|0)==(e|0)){o=a+(b+20)|0;l=c[o>>2]|0;if((l|0)==0){t=a+(b+16)|0;s=c[t>>2]|0;if((s|0)==0){x=0;break}else{y=s;z=t}}else{y=l;z=o}while(1){o=y+20|0;l=c[o>>2]|0;if((l|0)!=0){y=l;z=o;continue}o=y+16|0;l=c[o>>2]|0;if((l|0)==0){break}else{y=l;z=o}}if(z>>>0<u>>>0){_a()}else{c[z>>2]=0;x=y;break}}else{o=c[a+(b+8)>>2]|0;if(o>>>0<u>>>0){_a()}l=o+12|0;if((c[l>>2]|0)!=(e|0)){_a()}t=g+8|0;if((c[t>>2]|0)==(e|0)){c[l>>2]=g;c[t>>2]=o;x=g;break}else{_a()}}}while(0);if((k|0)!=0){g=c[a+(b+28)>>2]|0;j=27960+(g<<2)|0;if((e|0)==(c[j>>2]|0)){c[j>>2]=x;if((x|0)==0){c[27660>>2]=c[27660>>2]&~(1<<g);break}}else{if(k>>>0<(c[27672>>2]|0)>>>0){_a()}g=k+16|0;if((c[g>>2]|0)==(e|0)){c[g>>2]=x}else{c[k+20>>2]=x}if((x|0)==0){break}}if(x>>>0<(c[27672>>2]|0)>>>0){_a()}c[x+24>>2]=k;g=c[a+(b+16)>>2]|0;do{if((g|0)!=0){if(g>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[x+16>>2]=g;c[g+24>>2]=x;break}}}while(0);g=c[a+(b+20)>>2]|0;if((g|0)!=0){if(g>>>0<(c[27672>>2]|0)>>>0){_a()}else{c[x+20>>2]=g;c[g+24>>2]=x;break}}}}else{g=c[a+(b+8)>>2]|0;k=c[a+(b+12)>>2]|0;j=27696+(f<<1<<2)|0;if((g|0)!=(j|0)){if(g>>>0<u>>>0){_a()}if((c[g+12>>2]|0)!=(e|0)){_a()}}if((k|0)==(g|0)){c[6914]=c[6914]&~(1<<f);break}if((k|0)!=(j|0)){if(k>>>0<u>>>0){_a()}j=k+8|0;if((c[j>>2]|0)==(e|0)){A=j}else{_a()}}else{A=k+8|0}c[g+12>>2]=k;c[A>>2]=g}}while(0);c[m+4>>2]=r|1;c[m+r>>2]=r;if((m|0)==(c[27676>>2]|0)){c[27664>>2]=r;i=d;return}else{B=r}}else{c[v>>2]=w&-2;c[m+4>>2]=n|1;c[m+n>>2]=n;B=n}n=B>>>3;if(B>>>0<256){w=n<<1;v=27696+(w<<2)|0;r=c[6914]|0;A=1<<n;if((r&A|0)!=0){n=27696+(w+2<<2)|0;e=c[n>>2]|0;if(e>>>0<(c[27672>>2]|0)>>>0){_a()}else{C=n;D=e}}else{c[6914]=r|A;C=27696+(w+2<<2)|0;D=v}c[C>>2]=m;c[D+12>>2]=m;c[m+8>>2]=D;c[m+12>>2]=v;i=d;return}v=B>>>8;if((v|0)!=0){if(B>>>0>16777215){E=31}else{D=(v+1048320|0)>>>16&8;C=v<<D;v=(C+520192|0)>>>16&4;w=C<<v;C=(w+245760|0)>>>16&2;A=14-(v|D|C)+(w<<C>>>15)|0;E=B>>>(A+7|0)&1|A<<1}}else{E=0}A=27960+(E<<2)|0;c[m+28>>2]=E;c[m+20>>2]=0;c[m+16>>2]=0;C=c[27660>>2]|0;w=1<<E;if((C&w|0)==0){c[27660>>2]=C|w;c[A>>2]=m;c[m+24>>2]=A;c[m+12>>2]=m;c[m+8>>2]=m;i=d;return}w=c[A>>2]|0;if((E|0)==31){F=0}else{F=25-(E>>>1)|0}a:do{if((c[w+4>>2]&-8|0)==(B|0)){G=w}else{E=B<<F;A=w;while(1){H=A+(E>>>31<<2)+16|0;C=c[H>>2]|0;if((C|0)==0){break}if((c[C+4>>2]&-8|0)==(B|0)){G=C;break a}else{E=E<<1;A=C}}if(H>>>0<(c[27672>>2]|0)>>>0){_a()}c[H>>2]=m;c[m+24>>2]=A;c[m+12>>2]=m;c[m+8>>2]=m;i=d;return}}while(0);H=G+8|0;B=c[H>>2]|0;w=c[27672>>2]|0;if(G>>>0<w>>>0){_a()}if(B>>>0<w>>>0){_a()}c[B+12>>2]=m;c[H>>2]=m;c[m+8>>2]=B;c[m+12>>2]=G;c[m+24>>2]=0;i=d;return}function mg(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,Q=0,R=0.0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,ba=0.0,ca=0,da=0.0,ea=0,fa=0.0,ga=0,ha=0.0,ia=0,ja=0.0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,ra=0,sa=0.0,ta=0,ua=0.0,va=0,wa=0,xa=0,ya=0,za=0.0,Aa=0,Ba=0.0,Ca=0.0,Da=0,Ea=0.0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Ta=0,Ua=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0.0,sc=0,tc=0,uc=0.0,vc=0.0,wc=0.0,xc=0.0,yc=0.0,zc=0.0,Ac=0,Bc=0,Cc=0.0,Dc=0,Ec=0.0,Fc=0,Gc=0,Hc=0,Ic=0;g=i;i=i+512|0;h=g;if((e|0)==1){j=53;k=-1074}else if((e|0)==0){j=24;k=-149}else if((e|0)==2){j=53;k=-1074}else{l=0.0;i=g;return+l}e=b+4|0;m=b+100|0;do{n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;o=d[n]|0}else{o=pg(b)|0}}while((fb(o|0)|0)!=0);do{if((o|0)==43|(o|0)==45){n=1-(((o|0)==45)<<1)|0;p=c[e>>2]|0;if(p>>>0<(c[m>>2]|0)>>>0){c[e>>2]=p+1;q=d[p]|0;r=n;break}else{q=pg(b)|0;r=n;break}}else{q=o;r=1}}while(0);o=q;q=0;while(1){if((o|32|0)!=(a[28152+q|0]|0)){s=o;v=q;break}do{if(q>>>0<7){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;w=d[n]|0;break}else{w=pg(b)|0;break}}else{w=o}}while(0);n=q+1|0;if(n>>>0<8){o=w;q=n}else{s=w;v=n;break}}do{if((v|0)==3){x=23}else if((v|0)!=8){w=(f|0)==0;if(!(v>>>0<4|w)){if((v|0)==8){break}else{x=23;break}}a:do{if((v|0)==0){q=s;o=0;while(1){if((q|32|0)!=(a[28168+o|0]|0)){y=q;z=o;break a}do{if(o>>>0<2){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;A=d[n]|0;break}else{A=pg(b)|0;break}}else{A=q}}while(0);n=o+1|0;if(n>>>0<3){q=A;o=n}else{y=A;z=n;break}}}else{y=s;z=v}}while(0);if((z|0)==0){do{if((y|0)==48){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;B=d[o]|0}else{B=pg(b)|0}if((B|32|0)!=120){if((c[m>>2]|0)==0){C=48;break}c[e>>2]=(c[e>>2]|0)+ -1;C=48;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;F=0}else{D=pg(b)|0;F=0}while(1){if((D|0)==46){x=70;break}else if((D|0)!=48){G=0;H=0;I=0;J=0;K=D;L=F;M=0;N=0;O=1.0;Q=0;R=0.0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;F=1;continue}else{D=pg(b)|0;F=1;continue}}b:do{if((x|0)==70){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;S=d[o]|0}else{S=pg(b)|0}if((S|0)==48){o=-1;q=-1;while(1){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;T=d[n]|0}else{T=pg(b)|0}if((T|0)!=48){G=0;H=0;I=o;J=q;K=T;L=1;M=1;N=0;O=1.0;Q=0;R=0.0;break b}n=Ig(o|0,q|0,-1,-1)|0;o=n;q=E}}else{G=0;H=0;I=0;J=0;K=S;L=F;M=1;N=0;O=1.0;Q=0;R=0.0}}}while(0);c:while(1){q=K+ -48|0;do{if(!(q>>>0<10)){o=K|32;n=(K|0)==46;if(!((o+ -97|0)>>>0<6|n)){U=K;break c}if(n){if((M|0)==0){V=H;W=G;X=H;Y=G;Z=L;_=1;$=N;ba=O;ca=Q;da=R;break}else{U=46;break c}}else{ea=(K|0)>57?o+ -87|0:q;x=84;break}}else{ea=q;x=84}}while(0);if((x|0)==84){x=0;do{if(!((G|0)<0|(G|0)==0&H>>>0<8)){if((G|0)<0|(G|0)==0&H>>>0<14){fa=O*.0625;ga=N;ha=fa;ia=Q;ja=R+fa*+(ea|0);break}if((ea|0)!=0&(N|0)==0){ga=1;ha=O;ia=Q;ja=R+O*.5}else{ga=N;ha=O;ia=Q;ja=R}}else{ga=N;ha=O;ia=ea+(Q<<4)|0;ja=R}}while(0);q=Ig(H|0,G|0,1,0)|0;V=I;W=J;X=q;Y=E;Z=1;_=M;$=ga;ba=ha;ca=ia;da=ja}q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;G=Y;H=X;I=V;J=W;K=d[q]|0;L=Z;M=_;N=$;O=ba;Q=ca;R=da;continue}else{G=Y;H=X;I=V;J=W;K=pg(b)|0;L=Z;M=_;N=$;O=ba;Q=ca;R=da;continue}}if((L|0)==0){q=(c[m>>2]|0)==0;if(!q){c[e>>2]=(c[e>>2]|0)+ -1}if(!w){if(!q?(q=c[e>>2]|0,c[e>>2]=q+ -1,(M|0)!=0):0){c[e>>2]=q+ -2}}else{og(b,0)}l=+(r|0)*0.0;i=g;return+l}q=(M|0)==0;o=q?H:I;n=q?G:J;if((G|0)<0|(G|0)==0&H>>>0<8){q=H;p=G;ka=Q;while(1){la=ka<<4;ma=Ig(q|0,p|0,1,0)|0;na=E;if((na|0)<0|(na|0)==0&ma>>>0<8){q=ma;p=na;ka=la}else{oa=la;break}}}else{oa=Q}do{if((U|32|0)==112){ka=ng(b,f)|0;p=E;if((ka|0)==0&(p|0)==-2147483648){if(w){og(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){pa=0;ra=0;break}c[e>>2]=(c[e>>2]|0)+ -1;pa=0;ra=0;break}}else{pa=ka;ra=p}}else{if((c[m>>2]|0)==0){pa=0;ra=0}else{c[e>>2]=(c[e>>2]|0)+ -1;pa=0;ra=0}}}while(0);p=Gg(o|0,n|0,2)|0;ka=Ig(p|0,E|0,-32,-1)|0;p=Ig(ka|0,E|0,pa|0,ra|0)|0;ka=E;if((oa|0)==0){l=+(r|0)*0.0;i=g;return+l}if((ka|0)>0|(ka|0)==0&p>>>0>(0-k|0)>>>0){c[(Sa()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}q=k+ -106|0;la=((q|0)<0)<<31>>31;if((ka|0)<(la|0)|(ka|0)==(la|0)&p>>>0<q>>>0){c[(Sa()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((oa|0)>-1){q=p;la=ka;na=oa;fa=R;while(1){ma=na<<1;if(!(fa>=.5)){sa=fa;ta=ma}else{sa=fa+-1.0;ta=ma|1}ua=fa+sa;ma=Ig(q|0,la|0,-1,-1)|0;va=E;if((ta|0)>-1){q=ma;la=va;na=ta;fa=ua}else{wa=ma;xa=va;ya=ta;za=ua;break}}}else{wa=p;xa=ka;ya=oa;za=R}na=Cg(32,0,k|0,((k|0)<0)<<31>>31|0)|0;la=Ig(wa|0,xa|0,na|0,E|0)|0;na=E;if(0>(na|0)|0==(na|0)&j>>>0>la>>>0){Aa=(la|0)<0?0:la}else{Aa=j}if((Aa|0)<53){fa=+(r|0);ua=+Va(+(+qg(1.0,84-Aa|0)),+fa);if((Aa|0)<32&za!=0.0){la=ya&1;Ba=fa;Ca=ua;Da=(la^1)+ya|0;Ea=(la|0)==0?0.0:za}else{Ba=fa;Ca=ua;Da=ya;Ea=za}}else{Ba=+(r|0);Ca=0.0;Da=ya;Ea=za}ua=Ba*Ea+(Ca+Ba*+(Da>>>0))-Ca;if(!(ua!=0.0)){c[(Sa()|0)>>2]=34}l=+rg(ua,wa);i=g;return+l}else{C=y}}while(0);la=k+j|0;na=0-la|0;q=C;n=0;while(1){if((q|0)==46){x=139;break}else if((q|0)!=48){Fa=q;Ga=0;Ha=0;Ia=n;Ja=0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;q=d[o]|0;n=1;continue}else{q=pg(b)|0;n=1;continue}}d:do{if((x|0)==139){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;Ka=d[q]|0}else{Ka=pg(b)|0}if((Ka|0)==48){q=-1;o=-1;while(1){va=c[e>>2]|0;if(va>>>0<(c[m>>2]|0)>>>0){c[e>>2]=va+1;La=d[va]|0}else{La=pg(b)|0}if((La|0)!=48){Fa=La;Ga=q;Ha=o;Ia=1;Ja=1;break d}va=Ig(q|0,o|0,-1,-1)|0;q=va;o=E}}else{Fa=Ka;Ga=0;Ha=0;Ia=n;Ja=1}}}while(0);c[h>>2]=0;n=Fa+ -48|0;o=(Fa|0)==46;e:do{if(n>>>0<10|o){q=h+496|0;ka=Fa;p=0;va=0;ma=o;Ma=n;Na=Ga;Oa=Ha;Pa=Ia;Qa=Ja;Ra=0;Ta=0;Ua=0;while(1){do{if(ma){if((Qa|0)==0){Wa=p;Xa=va;Ya=p;Za=va;_a=Pa;$a=1;ab=Ra;bb=Ta;cb=Ua}else{db=ka;eb=Na;gb=Oa;hb=p;ib=va;jb=Pa;kb=Ra;lb=Ta;mb=Ua;break e}}else{nb=Ig(p|0,va|0,1,0)|0;ob=E;pb=(ka|0)!=48;if((Ta|0)>=125){if(!pb){Wa=Na;Xa=Oa;Ya=nb;Za=ob;_a=Pa;$a=Qa;ab=Ra;bb=Ta;cb=Ua;break}c[q>>2]=c[q>>2]|1;Wa=Na;Xa=Oa;Ya=nb;Za=ob;_a=Pa;$a=Qa;ab=Ra;bb=Ta;cb=Ua;break}qb=h+(Ta<<2)|0;if((Ra|0)==0){rb=Ma}else{rb=ka+ -48+((c[qb>>2]|0)*10|0)|0}c[qb>>2]=rb;qb=Ra+1|0;sb=(qb|0)==9;Wa=Na;Xa=Oa;Ya=nb;Za=ob;_a=1;$a=Qa;ab=sb?0:qb;bb=(sb&1)+Ta|0;cb=pb?nb:Ua}}while(0);nb=c[e>>2]|0;if(nb>>>0<(c[m>>2]|0)>>>0){c[e>>2]=nb+1;tb=d[nb]|0}else{tb=pg(b)|0}nb=tb+ -48|0;pb=(tb|0)==46;if(nb>>>0<10|pb){ka=tb;p=Ya;va=Za;ma=pb;Ma=nb;Na=Wa;Oa=Xa;Pa=_a;Qa=$a;Ra=ab;Ta=bb;Ua=cb}else{ub=tb;vb=Ya;wb=Wa;xb=Za;yb=Xa;zb=_a;Ab=$a;Bb=ab;Cb=bb;Db=cb;x=162;break}}}else{ub=Fa;vb=0;wb=Ga;xb=0;yb=Ha;zb=Ia;Ab=Ja;Bb=0;Cb=0;Db=0;x=162}}while(0);if((x|0)==162){n=(Ab|0)==0;db=ub;eb=n?vb:wb;gb=n?xb:yb;hb=vb;ib=xb;jb=zb;kb=Bb;lb=Cb;mb=Db}n=(jb|0)!=0;if(n?(db|32|0)==101:0){o=ng(b,f)|0;Ua=E;do{if((o|0)==0&(Ua|0)==-2147483648){if(w){og(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){Eb=0;Fb=0;break}c[e>>2]=(c[e>>2]|0)+ -1;Eb=0;Fb=0;break}}else{Eb=o;Fb=Ua}}while(0);Ua=Ig(Eb|0,Fb|0,eb|0,gb|0)|0;Gb=Ua;Hb=E}else{if((db|0)>-1?(c[m>>2]|0)!=0:0){c[e>>2]=(c[e>>2]|0)+ -1;Gb=eb;Hb=gb}else{Gb=eb;Hb=gb}}if(!n){c[(Sa()|0)>>2]=22;og(b,0);l=0.0;i=g;return+l}Ua=c[h>>2]|0;if((Ua|0)==0){l=+(r|0)*0.0;i=g;return+l}do{if((Gb|0)==(hb|0)&(Hb|0)==(ib|0)&((ib|0)<0|(ib|0)==0&hb>>>0<10)){if(!(j>>>0>30)?(Ua>>>j|0)!=0:0){break}l=+(r|0)*+(Ua>>>0);i=g;return+l}}while(0);Ua=(k|0)/-2|0;n=((Ua|0)<0)<<31>>31;if((Hb|0)>(n|0)|(Hb|0)==(n|0)&Gb>>>0>Ua>>>0){c[(Sa()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}Ua=k+ -106|0;n=((Ua|0)<0)<<31>>31;if((Hb|0)<(n|0)|(Hb|0)==(n|0)&Gb>>>0<Ua>>>0){c[(Sa()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((kb|0)==0){Ib=lb}else{if((kb|0)<9){Ua=h+(lb<<2)|0;n=c[Ua>>2]|0;o=kb;do{n=n*10|0;o=o+1|0}while((o|0)!=9);c[Ua>>2]=n}Ib=lb+1|0}do{if((mb|0)<9?(mb|0)<=(Gb|0)&(Gb|0)<18:0){if((Gb|0)==9){l=+(r|0)*+((c[h>>2]|0)>>>0);i=g;return+l}if((Gb|0)<9){l=+(r|0)*+((c[h>>2]|0)>>>0)/+(c[28184+(8-Gb<<2)>>2]|0);i=g;return+l}o=j+27+(aa(Gb,-3)|0)|0;Ta=c[h>>2]|0;if((o|0)<=30?(Ta>>>o|0)!=0:0){break}l=+(r|0)*+(Ta>>>0)*+(c[28184+(Gb+ -10<<2)>>2]|0);i=g;return+l}}while(0);n=(Gb|0)%9|0;if((n|0)==0){Jb=0;Kb=0;Lb=Gb;Mb=Ib}else{Ua=(Gb|0)>-1?n:n+9|0;n=c[28184+(8-Ua<<2)>>2]|0;if((Ib|0)!=0){Ta=1e9/(n|0)|0;o=0;Ra=0;Qa=0;Pa=Gb;while(1){Oa=h+(Qa<<2)|0;Na=c[Oa>>2]|0;Ma=((Na>>>0)/(n>>>0)|0)+Ra|0;c[Oa>>2]=Ma;Nb=aa((Na>>>0)%(n>>>0)|0,Ta)|0;Na=Qa+1|0;if((Qa|0)==(o|0)&(Ma|0)==0){Ob=Na&127;Pb=Pa+ -9|0}else{Ob=o;Pb=Pa}if((Na|0)==(Ib|0)){break}else{o=Ob;Ra=Nb;Qa=Na;Pa=Pb}}if((Nb|0)==0){Qb=Ob;Rb=Pb;Sb=Ib}else{c[h+(Ib<<2)>>2]=Nb;Qb=Ob;Rb=Pb;Sb=Ib+1|0}}else{Qb=0;Rb=Gb;Sb=0}Jb=Qb;Kb=0;Lb=9-Ua+Rb|0;Mb=Sb}f:while(1){Pa=h+(Jb<<2)|0;if((Lb|0)<18){Qa=Kb;Ra=Mb;while(1){o=0;Ta=Ra+127|0;n=Ra;while(1){Na=Ta&127;Ma=h+(Na<<2)|0;Oa=Gg(c[Ma>>2]|0,0,29)|0;ma=Ig(Oa|0,E|0,o|0,0)|0;Oa=E;if(Oa>>>0>0|(Oa|0)==0&ma>>>0>1e9){va=Ug(ma|0,Oa|0,1e9,0)|0;p=Vg(ma|0,Oa|0,1e9,0)|0;Tb=p;Ub=va}else{Tb=ma;Ub=0}c[Ma>>2]=Tb;Ma=(Na|0)==(Jb|0);if((Na|0)!=(n+127&127|0)|Ma){Vb=n}else{Vb=(Tb|0)==0?Na:n}if(Ma){break}else{o=Ub;Ta=Na+ -1|0;n=Vb}}n=Qa+ -29|0;if((Ub|0)==0){Qa=n;Ra=Vb}else{Wb=n;Xb=Ub;Yb=Vb;break}}}else{if((Lb|0)==18){Zb=Kb;_b=Mb}else{$b=Jb;ac=Kb;bc=Lb;cc=Mb;break}while(1){if(!((c[Pa>>2]|0)>>>0<9007199)){$b=Jb;ac=Zb;bc=18;cc=_b;break f}Ra=0;Qa=_b+127|0;n=_b;while(1){Ta=Qa&127;o=h+(Ta<<2)|0;Na=Gg(c[o>>2]|0,0,29)|0;Ma=Ig(Na|0,E|0,Ra|0,0)|0;Na=E;if(Na>>>0>0|(Na|0)==0&Ma>>>0>1e9){ma=Ug(Ma|0,Na|0,1e9,0)|0;va=Vg(Ma|0,Na|0,1e9,0)|0;dc=va;ec=ma}else{dc=Ma;ec=0}c[o>>2]=dc;o=(Ta|0)==(Jb|0);if((Ta|0)!=(n+127&127|0)|o){fc=n}else{fc=(dc|0)==0?Ta:n}if(o){break}else{Ra=ec;Qa=Ta+ -1|0;n=fc}}n=Zb+ -29|0;if((ec|0)==0){Zb=n;_b=fc}else{Wb=n;Xb=ec;Yb=fc;break}}}Pa=Jb+127&127;if((Pa|0)==(Yb|0)){n=Yb+127&127;Qa=h+((Yb+126&127)<<2)|0;c[Qa>>2]=c[Qa>>2]|c[h+(n<<2)>>2];gc=n}else{gc=Yb}c[h+(Pa<<2)>>2]=Xb;Jb=Pa;Kb=Wb;Lb=Lb+9|0;Mb=gc}g:while(1){hc=cc+1&127;Ua=h+((cc+127&127)<<2)|0;Pa=$b;n=ac;Qa=bc;while(1){Ra=(Qa|0)==18;Ta=(Qa|0)>27?9:1;ic=Pa;jc=n;while(1){o=0;while(1){Ma=o+ic&127;if((Ma|0)==(cc|0)){kc=2;break}ma=c[h+(Ma<<2)>>2]|0;Ma=c[28176+(o<<2)>>2]|0;if(ma>>>0<Ma>>>0){kc=2;break}va=o+1|0;if(ma>>>0>Ma>>>0){kc=o;break}if((va|0)<2){o=va}else{kc=va;break}}if((kc|0)==2&Ra){break g}lc=Ta+jc|0;if((ic|0)==(cc|0)){ic=cc;jc=lc}else{break}}Ra=(1<<Ta)+ -1|0;o=1e9>>>Ta;mc=ic;nc=0;va=ic;oc=Qa;do{Ma=h+(va<<2)|0;ma=c[Ma>>2]|0;Na=(ma>>>Ta)+nc|0;c[Ma>>2]=Na;nc=aa(ma&Ra,o)|0;ma=(va|0)==(mc|0)&(Na|0)==0;va=va+1&127;oc=ma?oc+ -9|0:oc;mc=ma?va:mc}while((va|0)!=(cc|0));if((nc|0)==0){Pa=mc;n=lc;Qa=oc;continue}if((hc|0)!=(mc|0)){break}c[Ua>>2]=c[Ua>>2]|1;Pa=mc;n=lc;Qa=oc}c[h+(cc<<2)>>2]=nc;$b=mc;ac=lc;bc=oc;cc=hc}Qa=ic&127;if((Qa|0)==(cc|0)){c[h+(hc+ -1<<2)>>2]=0;pc=hc}else{pc=cc}ua=+((c[h+(Qa<<2)>>2]|0)>>>0);Qa=ic+1&127;if((Qa|0)==(pc|0)){n=pc+1&127;c[h+(n+ -1<<2)>>2]=0;qc=n}else{qc=pc}fa=+(r|0);rc=fa*(ua*1.0e9+ +((c[h+(Qa<<2)>>2]|0)>>>0));Qa=jc+53|0;n=Qa-k|0;if((n|0)<(j|0)){sc=(n|0)<0?0:n;tc=1}else{sc=j;tc=0}if((sc|0)<53){ua=+Va(+(+qg(1.0,105-sc|0)),+rc);uc=+qa(+rc,+(+qg(1.0,53-sc|0)));vc=ua;wc=uc;xc=ua+(rc-uc)}else{vc=0.0;wc=0.0;xc=rc}Pa=ic+2&127;if((Pa|0)!=(qc|0)){Ua=c[h+(Pa<<2)>>2]|0;do{if(!(Ua>>>0<5e8)){if(Ua>>>0>5e8){yc=fa*.75+wc;break}if((ic+3&127|0)==(qc|0)){yc=fa*.5+wc;break}else{yc=fa*.75+wc;break}}else{if((Ua|0)==0?(ic+3&127|0)==(qc|0):0){yc=wc;break}yc=fa*.25+wc}}while(0);if((53-sc|0)>1?!(+qa(+yc,1.0)!=0.0):0){zc=yc+1.0}else{zc=yc}}else{zc=wc}fa=xc+zc-vc;do{if((Qa&2147483647|0)>(-2-la|0)){if(!(+P(+fa)>=9007199254740992.0)){Ac=tc;Bc=jc;Cc=fa}else{Ac=(tc|0)!=0&(sc|0)==(n|0)?0:tc;Bc=jc+1|0;Cc=fa*.5}if((Bc+50|0)<=(na|0)?!((Ac|0)!=0&zc!=0.0):0){Dc=Bc;Ec=Cc;break}c[(Sa()|0)>>2]=34;Dc=Bc;Ec=Cc}else{Dc=jc;Ec=fa}}while(0);l=+rg(Ec,Dc);i=g;return+l}else if((z|0)==3){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;Fc=d[na]|0}else{Fc=pg(b)|0}if((Fc|0)==40){Gc=1}else{if((c[m>>2]|0)==0){l=t;i=g;return+l}c[e>>2]=(c[e>>2]|0)+ -1;l=t;i=g;return+l}while(1){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;Hc=d[na]|0}else{Hc=pg(b)|0}if(!((Hc+ -48|0)>>>0<10|(Hc+ -65|0)>>>0<26)?!((Hc+ -97|0)>>>0<26|(Hc|0)==95):0){break}Gc=Gc+1|0}if((Hc|0)==41){l=t;i=g;return+l}na=(c[m>>2]|0)==0;if(!na){c[e>>2]=(c[e>>2]|0)+ -1}if(w){c[(Sa()|0)>>2]=22;og(b,0);l=0.0;i=g;return+l}if((Gc|0)==0|na){l=t;i=g;return+l}else{Ic=Gc}while(1){na=Ic+ -1|0;c[e>>2]=(c[e>>2]|0)+ -1;if((na|0)==0){l=t;break}else{Ic=na}}i=g;return+l}else{if((c[m>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)+ -1}c[(Sa()|0)>>2]=22;og(b,0);l=0.0;i=g;return+l}}}while(0);if((x|0)==23){x=(c[m>>2]|0)==0;if(!x){c[e>>2]=(c[e>>2]|0)+ -1}if(!(v>>>0<4|(f|0)==0|x)){x=v;do{c[e>>2]=(c[e>>2]|0)+ -1;x=x+ -1|0}while(x>>>0>3)}}l=+(r|0)*u;i=g;return+l}function ng(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;f=a+4|0;g=c[f>>2]|0;h=a+100|0;if(g>>>0<(c[h>>2]|0)>>>0){c[f>>2]=g+1;j=d[g]|0}else{j=pg(a)|0}if((j|0)==43|(j|0)==45){g=(j|0)==45|0;k=c[f>>2]|0;if(k>>>0<(c[h>>2]|0)>>>0){c[f>>2]=k+1;l=d[k]|0}else{l=pg(a)|0}if(!((l+ -48|0)>>>0<10|(b|0)==0)?(c[h>>2]|0)!=0:0){c[f>>2]=(c[f>>2]|0)+ -1;m=l;n=g}else{m=l;n=g}}else{m=j;n=0}if((m+ -48|0)>>>0>9){if((c[h>>2]|0)==0){o=-2147483648;p=0;E=o;i=e;return p|0}c[f>>2]=(c[f>>2]|0)+ -1;o=-2147483648;p=0;E=o;i=e;return p|0}else{q=m;r=0}while(1){s=q+ -48+r|0;m=c[f>>2]|0;if(m>>>0<(c[h>>2]|0)>>>0){c[f>>2]=m+1;t=d[m]|0}else{t=pg(a)|0}if(!((t+ -48|0)>>>0<10&(s|0)<214748364)){break}q=t;r=s*10|0}r=((s|0)<0)<<31>>31;if((t+ -48|0)>>>0<10){q=s;m=r;j=t;while(1){g=Tg(q|0,m|0,10,0)|0;l=E;b=Ig(j|0,((j|0)<0)<<31>>31|0,-48,-1)|0;k=Ig(b|0,E|0,g|0,l|0)|0;l=E;g=c[f>>2]|0;if(g>>>0<(c[h>>2]|0)>>>0){c[f>>2]=g+1;u=d[g]|0}else{u=pg(a)|0}if((u+ -48|0)>>>0<10&((l|0)<21474836|(l|0)==21474836&k>>>0<2061584302)){q=k;m=l;j=u}else{v=k;w=l;x=u;break}}}else{v=s;w=r;x=t}if((x+ -48|0)>>>0<10){do{x=c[f>>2]|0;if(x>>>0<(c[h>>2]|0)>>>0){c[f>>2]=x+1;y=d[x]|0}else{y=pg(a)|0}}while((y+ -48|0)>>>0<10)}if((c[h>>2]|0)!=0){c[f>>2]=(c[f>>2]|0)+ -1}f=(n|0)!=0;n=Cg(0,0,v|0,w|0)|0;o=f?E:w;p=f?n:v;E=o;i=e;return p|0}function og(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a+104>>2]=b;e=c[a+8>>2]|0;f=c[a+4>>2]|0;g=e-f|0;c[a+108>>2]=g;if((b|0)!=0&(g|0)>(b|0)){c[a+100>>2]=f+b;i=d;return}else{c[a+100>>2]=e;i=d;return}}function pg(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=b+104|0;g=c[f>>2]|0;if(!((g|0)!=0?(c[b+108>>2]|0)>=(g|0):0)){h=3}if((h|0)==3?(h=tg(b)|0,(h|0)>=0):0){g=c[f>>2]|0;f=c[b+8>>2]|0;if((g|0)!=0?(j=c[b+4>>2]|0,k=g-(c[b+108>>2]|0)+ -1|0,(f-j|0)>(k|0)):0){c[b+100>>2]=j+k}else{c[b+100>>2]=f}k=c[b+4>>2]|0;if((f|0)!=0){j=b+108|0;c[j>>2]=f+1-k+(c[j>>2]|0)}j=k+ -1|0;if((d[j]|0|0)==(h|0)){l=h;i=e;return l|0}a[j]=h;l=h;i=e;return l|0}c[b+100>>2]=0;l=-1;i=e;return l|0}function qg(a,b){a=+a;b=b|0;var d=0,e=0.0,f=0,g=0,j=0,l=0.0;d=i;if((b|0)>1023){e=a*8.98846567431158e+307;f=b+ -1023|0;if((f|0)>1023){g=b+ -2046|0;j=(g|0)>1023?1023:g;l=e*8.98846567431158e+307}else{j=f;l=e}}else{if((b|0)<-1022){e=a*2.2250738585072014e-308;f=b+1022|0;if((f|0)<-1022){g=b+2044|0;j=(g|0)<-1022?-1022:g;l=e*2.2250738585072014e-308}else{j=f;l=e}}else{j=b;l=a}}b=Gg(j+1023|0,0,52)|0;j=E;c[k>>2]=b;c[k+4>>2]=j;a=l*+h[k>>3];i=d;return+a}function rg(a,b){a=+a;b=b|0;var c=0,d=0.0;c=i;d=+qg(a,b);i=c;return+d}function sg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=b+74|0;f=a[e]|0;a[e]=f+255|f;f=b+20|0;e=b+44|0;if((c[f>>2]|0)>>>0>(c[e>>2]|0)>>>0){kb[c[b+36>>2]&1](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[f>>2]=0;f=c[b>>2]|0;if((f&20|0)==0){g=c[e>>2]|0;c[b+8>>2]=g;c[b+4>>2]=g;h=0;i=d;return h|0}if((f&4|0)==0){h=-1;i=d;return h|0}c[b>>2]=f|32;h=-1;i=d;return h|0}function tg(a){a=a|0;var b=0,e=0,f=0;b=i;i=i+16|0;e=b;if((c[a+8>>2]|0)==0?(sg(a)|0)!=0:0){f=-1}else{if((kb[c[a+32>>2]&1](a,e,1)|0)==1){f=d[e]|0}else{f=-1}}i=b;return f|0}function ug(a){a=a|0;var b=0,c=0.0;b=i;c=+wg(a,0);i=b;return+c}function vg(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;c=i;d=b;while(1){e=d+1|0;if((fb(a[d]|0)|0)==0){break}else{d=e}}b=a[d]|0;f=b<<24>>24;if((f|0)==45){g=1;h=5}else if((f|0)==43){g=0;h=5}else{j=d;k=b;l=0}if((h|0)==5){j=e;k=a[e]|0;l=g}if((cb(k<<24>>24|0)|0)==0){m=0;n=(l|0)!=0;o=0-m|0;p=n?m:o;i=c;return p|0}else{q=j;r=0}while(1){j=q+1|0;k=(r*10|0)+48-(a[q]|0)|0;if((cb(a[j]|0)|0)==0){m=k;break}else{q=j;r=k}}n=(l|0)!=0;o=0-m|0;p=n?m:o;i=c;return p|0}function wg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0.0,j=0,k=0;d=i;i=i+112|0;e=d;f=e+0|0;g=f+112|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(g|0));f=e+4|0;c[f>>2]=a;g=e+8|0;c[g>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;og(e,0);h=+mg(e,1,1);j=(c[f>>2]|0)-(c[g>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){i=d;return+h}if((j|0)==0){k=a}else{k=a+j|0}c[b>>2]=k;i=d;return+h}function xg(b,c){b=b|0;c=c|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;f=a[b]|0;a:do{if(f<<24>>24==0){g=0;h=c}else{j=f;k=f&255;l=b;m=c;while(1){n=a[m]|0;if(n<<24>>24==0){g=j;h=m;break a}if(!(j<<24>>24==n<<24>>24)?(n=Jg(k|0)|0,(n|0)!=(Jg(d[m]|0|0)|0)):0){break}n=l+1|0;o=m+1|0;p=a[n]|0;if(p<<24>>24==0){g=0;h=o;break a}else{j=p;k=p&255;l=n;m=o}}g=a[l]|0;h=m}}while(0);c=Jg(g&255|0)|0;g=c-(Jg(d[h]|0|0)|0)|0;i=e;return g|0}function yg(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;e=a[b]|0;f=a[c]|0;if(e<<24>>24!=f<<24>>24|e<<24>>24==0|f<<24>>24==0){g=e;h=f;j=g&255;k=h&255;l=j-k|0;i=d;return l|0}else{m=b;n=c}while(1){c=m+1|0;b=n+1|0;f=a[c]|0;e=a[b]|0;if(f<<24>>24!=e<<24>>24|f<<24>>24==0|e<<24>>24==0){g=f;h=e;break}else{m=c;n=b}}j=g&255;k=h&255;l=j-k|0;i=d;return l|0}function zg(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;if((e|0)==0){g=0;i=f;return g|0}h=a[b]|0;a:do{if(h<<24>>24==0){j=0;k=c}else{l=e;m=h;n=h&255;o=b;p=c;while(1){q=l+ -1|0;r=a[p]|0;if(r<<24>>24==0|(q|0)==0){j=m;k=p;break a}if(!(m<<24>>24==r<<24>>24)?(r=Jg(n|0)|0,(r|0)!=(Jg(d[p]|0|0)|0)):0){break}r=o+1|0;s=p+1|0;t=a[r]|0;if(t<<24>>24==0){j=0;k=s;break a}else{l=q;m=t;n=t&255;o=r;p=s}}j=a[o]|0;k=p}}while(0);c=Jg(j&255|0)|0;g=c-(Jg(d[k]|0|0)|0)|0;i=f;return g|0}function Ag(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;if((e|0)==0){g=0;i=f;return g|0}h=a[b]|0;a:do{if(h<<24>>24==0){j=0;k=c}else{l=e;m=h;n=b;o=c;while(1){p=l+ -1|0;q=a[o]|0;if(!((p|0)!=0&q<<24>>24!=0&m<<24>>24==q<<24>>24)){j=m;k=o;break a}q=n+1|0;r=o+1|0;s=a[q]|0;if(s<<24>>24==0){j=0;k=r;break}else{l=p;m=s;n=q;o=r}}}}while(0);g=(j&255)-(d[k]|0)|0;i=f;return g|0}function Bg(){}function Cg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(E=e,a-c>>>0|0)|0}function Dg(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Eg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function Fg(b,c){b=b|0;c=c|0;var d=0,e=0;d=b+(Dg(b)|0)|0;do{a[d+e|0]=a[c+e|0];e=e+1|0}while(a[c+(e-1)|0]|0);return b|0}function Gg(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){E=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}E=a<<c-32;return 0}function Hg(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function Ig(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(E=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function Jg(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function Kg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return Ga(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Lg(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function Mg(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){E=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}E=0;return b>>>c-32|0}function Ng(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){E=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}E=(b|0)<0?-1:0;return b>>c-32|0}function Og(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function Pg(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function Qg(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=aa(d,c)|0;f=a>>>16;a=(e>>>16)+(aa(d,f)|0)|0;d=b>>>16;b=aa(d,c)|0;return(E=(a>>>16)+(aa(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function Rg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=Cg(e^a,f^b,e,f)|0;b=E;a=g^e;e=h^f;f=Cg((Wg(i,b,Cg(g^c,h^d,g,h)|0,E,0)|0)^a,E^e,a,e)|0;return f|0}function Sg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=Cg(h^a,j^b,h,j)|0;b=E;Wg(m,b,Cg(k^d,l^e,k,l)|0,E,g)|0;l=Cg(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=E;i=f;return(E=j,l)|0}function Tg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=Qg(e,a)|0;f=E;return(E=(aa(b,a)|0)+(aa(d,e)|0)+f|f&0,c|0|0)|0}function Ug(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=Wg(a,b,c,d,0)|0;return e|0}function Vg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;Wg(a,b,d,e,g)|0;i=f;return(E=c[g+4>>2]|0,c[g>>2]|0)|0}function Wg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(E=n,o)|0}else{if(!m){n=0;o=0;return(E=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(E=n,o)|0}}m=(l|0)==0;do{if((j|0)!=0){if(!m){p=(Og(l|0)|0)-(Og(i|0)|0)|0;if(p>>>0<=31){q=p+1|0;r=31-p|0;s=p-31>>31;t=q;u=g>>>(q>>>0)&s|i<<r;v=i>>>(q>>>0)&s;w=0;x=g<<r;break}if((f|0)==0){n=0;o=0;return(E=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(E=n,o)|0}r=j-1|0;if((r&j|0)!=0){s=(Og(j|0)|0)+33-(Og(i|0)|0)|0;q=64-s|0;p=32-s|0;y=p>>31;z=s-32|0;A=z>>31;t=s;u=p-1>>31&i>>>(z>>>0)|(i<<p|g>>>(s>>>0))&A;v=A&i>>>(s>>>0);w=g<<q&y;x=(i<<q|g>>>(z>>>0))&y|g<<p&s-33>>31;break}if((f|0)!=0){c[f>>2]=r&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(E=n,o)|0}else{r=Pg(j|0)|0;n=i>>>(r>>>0)|0;o=i<<32-r|g>>>(r>>>0)|0;return(E=n,o)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(E=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(E=n,o)|0}r=l-1|0;if((r&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=r&i|b&0}n=0;o=i>>>((Pg(l|0)|0)>>>0);return(E=n,o)|0}r=(Og(l|0)|0)-(Og(i|0)|0)|0;if(r>>>0<=30){s=r+1|0;p=31-r|0;t=s;u=i<<p|g>>>(s>>>0);v=i>>>(s>>>0);w=0;x=g<<p;break}if((f|0)==0){n=0;o=0;return(E=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(E=n,o)|0}}while(0);if((t|0)==0){B=x;C=w;D=v;F=u;G=0;H=0}else{b=d|0|0;d=k|e&0;e=Ig(b,d,-1,-1)|0;k=E;h=x;x=w;w=v;v=u;u=t;t=0;while(1){I=x>>>31|h<<1;J=t|x<<1;a=v<<1|h>>>31|0;g=v>>>31|w<<1|0;Cg(e,k,a,g)|0;i=E;l=i>>31|((i|0)<0?-1:0)<<1;K=l&1;L=Cg(a,g,l&b,(((i|0)<0?-1:0)>>31|((i|0)<0?-1:0)<<1)&d)|0;M=E;i=u-1|0;if((i|0)==0){break}else{h=I;x=J;w=M;v=L;u=i;t=K}}B=I;C=J;D=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=F;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(E=n,o)|0}function Xg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return kb[a&1](b|0,c|0,d|0)|0}function Yg(a,b,c,d,e,f){a=a|0;b=+b;c=+c;d=d|0;e=e|0;f=f|0;return lb[a&63](+b,+c,d|0,e|0,f|0)|0}function Zg(a,b,c){a=a|0;b=b|0;c=c|0;mb[a&1](b|0,c|0)}function _g(a,b,c){a=a|0;b=b|0;c=c|0;return nb[a&7](b|0,c|0)|0}function $g(a,b,c){a=a|0;b=b|0;c=c|0;ba(0);return 0}function ah(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;ba(1);return 0}function bh(a,b){a=a|0;b=b|0;ba(2)}function ch(a,b){a=a|0;b=b|0;ba(3);return 0}




// EMSCRIPTEN_END_FUNCS
var kb=[$g,Xf];var lb=[ah,Ud,Vd,Xd,Yd,Zd,_d,$d,ae,de,ee,fe,ge,he,ie,je,ke,le,me,ne,oe,pe,qe,re,se,te,ue,ve,we,He,Ie,Je,Ke,Le,Me,Ne,Oe,Qd,Rd,Sd,Td,be,ce,xe,ye,ze,Ae,Be,Ce,De,Ee,Fe,Ge,ah,ah,ah,ah,ah,ah,ah,ah,ah,ah,ah];var mb=[bh,Yf];var nb=[ch,nf,of,pf,ef,ch,ch,ch];return{_strlen:Dg,_strcat:Fg,_gzread:xf,_wcsunits:Ib,_zscale:Lb,_initwcs:Eb,_wcssys:Hb,_pix2wcsstr:Fb,_calloc:ig,_bitshift64Shl:Gg,_gzwrite:Cf,_saostrtod:Kb,_strncpy:Hg,_memset:Eg,_memcpy:Kg,_gzclose:rf,_i64Subtract:Cg,_realloc:jg,_i64Add:Ig,_wcs2pixstr:Gb,_gzopen:sf,_gzseek:wf,_free:hg,_tolower:Jg,_malloc:gg,_reg2wcsstr:Jb,_strcpy:Lg,runPostSets:Bg,stackAlloc:ob,stackSave:pb,stackRestore:qb,setThrew:rb,setTempRet0:ub,setTempRet1:vb,setTempRet2:wb,setTempRet3:xb,setTempRet4:yb,setTempRet5:zb,setTempRet6:Ab,setTempRet7:Bb,setTempRet8:Cb,setTempRet9:Db,dynCall_iiii:Xg,dynCall_iddiii:Yg,dynCall_vii:Zg,dynCall_iii:_g}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiii": invoke_iiii, "invoke_iddiii": invoke_iddiii, "invoke_vii": invoke_vii, "invoke_iii": invoke_iii, "_fabs": _fabs, "_sin": _sin, "_exp": _exp, "_llvm_pow_f64": _llvm_pow_f64, "_acos": _acos, "_atan2": _atan2, "_fmod": _fmod, "_lseek": _lseek, "__reallyNegative": __reallyNegative, "_asin": _asin, "_atan": _atan, "___buildEnvironment": ___buildEnvironment, "_fflush": _fflush, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_fprintf": _fprintf, "_open": _open, "_fabsf": _fabsf, "_sbrk": _sbrk, "_send": _send, "_snprintf": _snprintf, "_llvm_bswap_i32": _llvm_bswap_i32, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_fileno": _fileno, "_sysconf": _sysconf, "___setErrNo": ___setErrNo, "_cos": _cos, "_pread": _pread, "_printf": _printf, "_sprintf": _sprintf, "_log": _log, "_toupper": _toupper, "_write": _write, "_isupper": _isupper, "___errno_location": ___errno_location, "_recv": _recv, "_tan": _tan, "_copysign": _copysign, "_getenv": _getenv, "_mkport": _mkport, "__exit": __exit, "_read": _read, "_abort": _abort, "_islower": _islower, "_fwrite": _fwrite, "_time": _time, "_isdigit": _isdigit, "_strerror": _strerror, "__formatString": __formatString, "_isspace": _isspace, "_sqrt": _sqrt, "_exit": _exit, "_close": _close, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _strcat = Module["_strcat"] = asm["_strcat"];
var _gzread = Module["_gzread"] = asm["_gzread"];
var _wcsunits = Module["_wcsunits"] = asm["_wcsunits"];
var _zscale = Module["_zscale"] = asm["_zscale"];
var _initwcs = Module["_initwcs"] = asm["_initwcs"];
var _wcssys = Module["_wcssys"] = asm["_wcssys"];
var _pix2wcsstr = Module["_pix2wcsstr"] = asm["_pix2wcsstr"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _gzwrite = Module["_gzwrite"] = asm["_gzwrite"];
var _saostrtod = Module["_saostrtod"] = asm["_saostrtod"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _memset = Module["_memset"] = asm["_memset"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _gzclose = Module["_gzclose"] = asm["_gzclose"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _wcs2pixstr = Module["_wcs2pixstr"] = asm["_wcs2pixstr"];
var _gzopen = Module["_gzopen"] = asm["_gzopen"];
var _gzseek = Module["_gzseek"] = asm["_gzseek"];
var _free = Module["_free"] = asm["_free"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _reg2wcsstr = Module["_reg2wcsstr"] = asm["_reg2wcsstr"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_iddiii = Module["dynCall_iddiii"] = asm["dynCall_iddiii"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };


// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}





Module['arrfile'] = function(filename, arr) {
  try{ FS.unlink("/" + filename); }
  catch(e){ ; }
  FS.createDataFile("/", filename, arr, true, true);
  return {path: filename, size: arr.byteLength};
};

Module['gzcompress'] = function(data) { // TODO: Accept strings
  var gzFile = ccall('gzopen', 'number', ['string', 'string'], ['output.gz', 'wb']);
  var buffer = _malloc(data.length);
  HEAPU8.set(data, buffer);
  ccall('gzwrite', 'number', ['number', 'number', 'number'], [gzFile, buffer, data.length]);
  ccall('gzclose', 'number', ['number'], [gzFile]);
  _free(buffer);
  var ret = new Uint8Array(FS.root.contents['output.gz'].contents);
  FS.unlink('output.gz');
  return ret;
};

Module['gzdecompress'] = function(data) {
  var BUFSIZE = 1024*1024;
  FS.createDataFile('/', 'input.gz', data, true, true);
  var gzFile = ccall('gzopen', 'number', ['string', 'string'], ['input.gz', 'rb']);
  var buffer = _malloc(BUFSIZE);
  var chunks = [];
  var total = 0;
  var len;
  while( (len = ccall('gzread', 'number', ['number', 'number', 'number'], [gzFile, buffer, BUFSIZE])) > 0) {
    chunks.push(new Uint8Array(len));
    chunks[chunks.length-1].set(HEAPU8.subarray(buffer, buffer+len));
    total += len;
  }
  ccall('gzclose', 'number', ['number'], [gzFile]);
  FS.unlink('input.gz');
  _free(buffer);
  var ret = new Uint8Array(total);
  var curr = 0;
  for (var i = 0; i < chunks.length; i++) {
    ret.set(chunks[i], curr);
    curr += chunks[i].length;
  }
  return ret;
};



  return {
      initwcs:  Module.cwrap('initwcs', 'number', ['string', 'number']),
      wcssys:  Module.cwrap('wcssys', 'string', ['number', 'string']),
      wcsunits:  Module.cwrap('wcsunits', 'string', ['number', 'string']),
      pix2wcs: Module.cwrap('pix2wcsstr', 'string', ['number', 'number', 'number']),
      wcs2pix: Module.cwrap('wcs2pixstr', 'string', ['number', 'number', 'number']),
      reg2wcs: Module.cwrap('reg2wcsstr', 'string', ['number', 'string']),
      saostrtod: Module.cwrap('saostrtod', 'number', ['string']),
      zscale: Module.cwrap('zscale', 'string', ['number', 'number', 'number', 'number', 'number', 'number']),
      arrfile: Module["arrfile"],
      gzopen: Module.cwrap('gzopen', 'number', ['string', 'string']),
      gzread: Module.cwrap('gzread', 'number', ['number', 'number', 'number']),
      gzwrite: Module.cwrap('gzwrite', 'number', ['number', 'number', 'number']),
      gzclose: Module.cwrap('gzclose', 'number', ['number']),
      gzseek: Module.cwrap('gzseek', 'number', ['number', 'number', 'number']),
      compress: Module['gzcompress'],
      decompress: Module['gzdecompress']
  };
})();

