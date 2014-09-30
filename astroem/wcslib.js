// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
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
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
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
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
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
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (ENVIRONMENT_IS_WEB) {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
    this['Module'] = Module;
  } else if (ENVIRONMENT_IS_WORKER) {
    // We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
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
  Module['load'] = function(f) {
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
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
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
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
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
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
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
    if (type == 'i64' || type == 'double' || vararg) return 8;
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
          alignSize = type.alignSize || QUANTUM_SIZE;
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
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
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
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
      Runtime.funcWrappers[func] = function() {
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
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
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
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
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
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
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
    HEAP8[(((buffer)+(i))|0)]=chr
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
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
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
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addOnPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 9080;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,65,90,80,0,83,90,80,0,84,65,78,0,83,84,71,0,83,73,78,0,65,82,67,0,90,80,78,0,90,69,65,0,65,73,82,0,67,89,80,0,67,69,65,0,67,65,82,0,77,69,82,0,67,79,80,0,67,79,69,0,67,79,68,0,67,79,79,0,83,70,76,0,80,65,82,0,77,79,76,0,65,73,84,0,66,79,78,0,80,67,79,0,84,83,67,0,67,83,67,0,81,83,67,0,26,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,28,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,30,0,0,0,31,0,0,0,44,66,124,35,100,255,239,63,206,4,147,55,81,230,134,63,201,87,119,237,8,231,115,63,8,49,216,60,72,85,196,190,141,82,239,197,175,26,93,190,79,75,150,130,180,74,73,190,206,4,147,55,81,230,134,191,110,20,118,229,124,255,239,63,190,2,89,23,76,127,252,190,141,82,239,197,175,26,93,62,186,92,192,248,87,85,196,190,213,61,80,36,200,25,210,61,192,143,86,244,8,231,115,191,40,252,144,126,141,121,252,190,190,45,6,62,231,255,239,63,79,75,150,130,180,74,73,62,213,61,80,36,200,25,210,61,56,97,156,141,155,85,196,190,37,201,115,125,31,14,66,191,237,156,102,129,118,135,206,63,237,128,235,138,25,225,219,191,138,238,48,88,55,255,239,63,235,42,147,208,76,230,134,63,26,132,28,8,135,230,115,63,12,31,17,83,34,137,206,191,58,234,232,184,26,217,101,191,7,35,246,9,160,24,137,63,235,42,147,208,76,230,134,191,233,248,162,28,80,255,239,63,8,168,211,46,100,125,252,190,137,181,248,20,0,227,219,63,180,173,102,157,241,125,129,191,174,14,128,184,171,87,97,63,26,132,28,8,135,230,115,191,247,97,247,252,180,122,252,190,137,77,92,117,186,255,239,63,125,150,201,34,100,255,239,63,15,157,207,213,158,230,134,191,92,113,244,103,237,229,115,191,26,77,59,180,100,85,196,62,52,175,17,131,3,27,93,190,173,87,210,121,59,74,73,190,20,1,96,210,158,230,134,63,3,186,248,225,124,255,239,63,250,59,9,220,34,127,252,190,52,175,17,131,3,27,93,62,91,229,82,109,116,85,196,62,232,167,8,110,48,27,210,189,73,225,178,117,237,229,115,63,235,19,108,31,83,119,252,190,10,30,195,64,231,255,239,63,173,87,210,121,59,74,73,62,185,158,187,181,171,23,210,189,73,125,255,4,184,85,196,62,37,201,115,125,31,14,66,191,211,48,124,68,76,137,206,191,34,223,165,212,37,227,219,63,45,6,81,239,144,255,239,63,108,197,229,21,219,230,134,191,214,96,142,220,162,229,115,191,180,174,209,114,160,135,206,63,58,234,232,184,26,217,101,191,180,173,102,157,241,125,129,191,108,197,229,21,219,230,134,63,26,73,6,169,169,255,239,63,26,238,175,96,19,128,252,190,134,170,152,74,63,225,219,191,7,35,246,9,160,24,137,63,174,14,128,184,171,87,97,63,214,96,142,220,162,229,115,63,212,213,62,153,86,117,252,190,150,50,62,6,10,0,240,63,32,108,111,110,103,45,110,112,97,0,0,0,0,0,0,0,67,78,80,73,88,50,0,0,9,108,111,110,103,45,110,112,97,0,0,0,0,0,0,0,67,78,80,73,88,49,0,0,89,80,73,88,69,76,83,90,0,0,0,0,0,0,0,0,88,80,73,88,69,76,83,90,0,0,0,0,0,0,0,0,66,80,95,79,82,68,69,82,0,0,0,0,0,0,0,0,80,76,84,83,67,65,76,69,0,0,0,0,0,0,0,0,90,80,78,0,0,0,0,0,67,85,66,69,70,65,67,69,0,0,0,0,0,0,0,0,37,50,46,48,102,58,37,50,46,48,102,58,37,53,46,51,102,32,37,99,37,50,46,48,102,58,37,50,46,48,102,58,37,53,46,51,102,32,37,115,0,0,0,0,0,0,0,0,84,104,101,32,100,101,103,114,101,101,32,111,102,32,116,104,101,32,112,111,108,121,110,111,109,32,40,37,100,41,32,101,120,99,101,101,100,115,32,116,104,101,32,109,97,120,105,109,117,109,10,97,108,108,111,119,101,100,32,111,110,101,32,40,37,100,41,0,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,120,32,111,114,100,101,114,32,37,100,10,0,0,0,0,0,0,0,32,101,99,108,105,112,116,105,99,0,0,0,0,0,0,0,70,75,53,0,0,0,0,0,78,65,88,73,83,50,0,0,45,48,0,0,0,0,0,0,102,107,52,0,0,0,0,0,9,101,99,108,105,112,116,105,99,0,0,0,0,0,0,0,70,75,52,0,0,0,0,0,32,103,97,108,97,99,116,105,99,0,0,0,0,0,0,0,69,81,85,73,78,79,88,0,9,103,97,108,97,99,116,105,99,0,0,0,0,0,0,0,80,76,84,68,69,67,83,0,37,115,44,32,37,115,0,0,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,0,0,0,0,0,0,80,76,84,68,69,67,77,0,42,42,42,42,42,42,42,42,42,42,42,42,42,9,42,42,42,42,42,42,42,42,42,42,42,42,42,0,0,0,0,0,80,76,84,68,69,67,68,0,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,42,0,0,0,0,0,80,76,84,68,69,67,83,78,0,0,0,0,0,0,0,0,42,42,42,42,42,42,42,42,42,9,42,42,42,42,42,42,42,42,42,42,0,0,0,0,80,76,84,82,65,83,0,0,65,80,95,37,100,95,37,100,0,0,0,0,0,0,0,0,37,115,32,37,115,0,0,0,80,76,84,82,65,77,0,0,65,82,67,0,0,0,0,0,37,115,9,37,115,0,0,0,80,76,84,82,65,72,0,0,84,78,88,95,71,83,68,69,82,58,32,117,110,107,110,111,119,110,32,115,117,114,102,97,99,101,32,116,121,112,101,32,37,100,10,0,0,0,0,0,87,67,83,73,78,73,84,67,58,32,78,111,32,105,109,97,103,101,32,115,99,97,108,101,32,102,111,114,32,87,67,83,32,37,99,0,0,0,0,0,87,67,83,73,78,73,84,58,32,78,111,32,78,65,88,73,83,49,32,111,114,32,73,77,65,71,69,87,32,107,101,121,119,111,114,100,0,0,0,0,70,75,52,0,0,0,0,0,74,50,48,48,48,0,0,0,85,84,77,73,68,0,0,0,66,49,57,53,48,0,0,0,85,84,0,0,0,0,0,0,37,46,52,102,0,0,0,0,69,80,79,67,72,0,0,0,37,46,54,102,44,32,37,46,54,102,0,0,0,0,0,0,105,109,115,121,115,0,0,0,68,65,84,69,0,0,0,0,73,77,83,89,83,0,0,0,68,65,84,69,45,79,66,83,0,0,0,0,0,0,0,0,77,74,68,45,79,66,83,0,80,73,88,69,76,0,0,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,65,80,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,76,73,78,69,65,82,0,0,83,73,78,0,0,0,0,0,87,67,83,73,78,73,84,58,32,115,101,116,116,105,110,103,32,67,68,69,76,84,32,116,111,32,49,0,0,0,0,0,42,69,114,114,111,114,42,58,32,112,111,108,121,110,111,109,105,97,108,32,71,82,79,85,80,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,108,97,116,99,111,114,0,0,84,78,88,95,71,83,68,69,82,58,32,111,114,100,101,114,32,111,102,32,100,101,114,105,118,97,116,105,118,101,115,32,99,97,110,110,111,116,32,98,101,32,60,32,48,10,0,0,67,82,79,84,65,49,0,0,73,77,65,71,69,87,0,0,49,57,53,48,46,48,0,0,67,82,79,84,65,50,0,0,80,67,37,49,100,95,37,49,100,0,0,0,0,0,0,0,80,67,49,95,49,0,0,0,37,115,40,0,0,0,0,0,80,67,48,48,37,49,100,48,48,37,49,100,0,0,0,0,80,67,48,48,49,48,48,49,0,0,0,0,0,0,0,0,80,73,88,83,67,65,76,50,0,0,0,0,0,0,0,0,89,80,73,88,83,73,90,69,0,0,0,0,0,0,0,0,65,80,95,79,82,68,69,82,0,0,0,0,0,0,0,0,83,69,67,80,73,88,50,0,83,84,71,0,0,0,0,0,83,69,67,80,73,88,49,0,112,111,108,121,45,62,100,101,103,114,101,101,32,40,112,111,108,121,45,62,110,103,114,111,117,112,32,101,108,101,109,101,110,116,115,41,32,33,0,0,108,110,103,99,111,114,0,0,84,78,88,95,71,83,69,86,65,76,58,32,117,110,107,110,111,119,110,32,115,117,114,102,97,99,101,32,116,121,112,101,10,0,0,0,0,0,0,0,88,80,73,88,83,73,90,69,0,0,0,0,0,0,0,0,78,65,88,73,83,49,0,0,49,57,53,48,0,0,0,0,80,73,88,83,67,65,76,49,0,0,0,0,0,0,0,0,80,73,88,83,67,65,76,69,0,0,0,0,0,0,0,0,83,69,67,80,73,88,0,0,67,68,69,76,84,50,0,0,67,68,69,76,84,49,0,0,67,79,50,95,37,100,0,0,67,79,50,95,49,0,0,0,66,95,37,100,95,37,100,0,67,79,49,95,37,100,0,0,84,65,78,0,0,0,0,0,80,76,65,84,69,0,0,0,112,111,108,121,45,62,103,114,111,117,112,32,40,112,111,108,121,45,62,110,100,105,109,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,112,114,111,106,112,37,100,0,65,95,79,82,68,69,82,0,108,97,116,99,111,114,0,0,67,79,49,95,49,0,0,0,37,115,95,48,48,49,0,0,87,67,83,73,78,73,84,58,32,78,111,32,87,67,83,65,88,69,83,44,32,78,65,88,73,83,44,32,111,114,32,87,67,83,68,73,77,32,107,101,121,119,111,114,100,0,0,0,102,107,53,0,0,0,0,0,67,68,50,95,50,0,0,0,83,80,65,45,0,0,0,0,67,68,50,95,49,0,0,0,78,80,79,76,69,0,0,0,67,68,49,95,50,0,0,0,59,0,0,0,0,0,0,0,76,65,84,0,0,0,0,0,67,68,49,95,49,0,0,0,78,80,79,76,0,0,0,0,80,86,37,100,95,37,100,0,37,45,52,115,37,52,115,0,80,86,37,100,95,51,0,0,68,69,84,0,0,0,0,0,80,86,37,100,95,50,0,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,66,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,0,80,73,88,69,76,0,0,0,80,86,37,100,95,49,0,0,83,90,80,0,0,0,0,0,76,73,78,69,65,82,0,0,80,82,79,74,80,37,100,0,42,69,114,114,111,114,42,58,32,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,108,110,103,99,111,114,0,0,80,82,79,74,82,48,0,0,37,37,46,37,100,102,0,0,87,67,83,68,73,77,0,0,70,75,53,0,0,0,0,0,76,79,78,71,0,0,0,0,76,65,84,80,79,76,69,0,76,79,78,80,79,76,69,0,67,82,86,65,76,50,0,0,115,101,120,97,103,101,115,105,109,97,108,0,0,0,0,0,67,82,86,65,76,49,0,0,10,62,32,37,115,37,115,10,10,0,0,0,0,0,0,0,67,82,80,73,88,50,0,0,67,82,80,73,88,49,0,0,87,65,84,49,0,0,0,0,87,65,84,50,0,0,0,0,66,95,79,82,68,69,82,0,67,85,78,73,84,50,0,0,65,90,80,0,0,0,0,0,87,65,84,49,0,0,0,0,112,105,120,101,108,0,0,0,84,104,101,32,100,105,109,101,110,115,105,111,110,97,108,105,116,121,32,111,102,32,116,104,101,32,112,111,108,121,110,111,109,32,40,37,100,41,32,101,120,99,101,101,100,115,32,116,104,101,32,109,97,120,105,109,117,109,10,97,108,108,111,119,101,100,32,111,110,101,32,40,37,100,41,0,0,0,0,0,108,111,110,103,112,111,108,101,0,0,0,0,0,0,0,0,114,111,0,0,0,0,0,0,117,110,105,116,115,0,0,0,37,115,95,48,49,0,0,0,37,37,37,100,100,0,0,0,78,65,88,73,83,0,0,0,105,99,114,115,0,0,0,0,87,65,84,49,0,0,0,0,37,37,37,52,100,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,54,46,51,102,32,37,99,37,48,50,100,58,37,48,50,100,58,37,48,53,46,50,102,0,0,0,0,0,67,85,78,73,84,49,0,0,37,37,37,100,46,37,100,102,0,0,0,0,0,0,0,0,71,65,76,50,70,75,53,58,32,74,50,48,48,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,67,84,89,80,69,52,0,0,100,101,103,114,101,101,115,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,0,0,0,0,0,0,71,65,76,50,70,75,53,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,37,100,0,0,0,0,0,0,67,84,89,80,69,51,0,0,81,83,67,0,0,0,0,0,78,67,80,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,52,46,49,102,0,0,0,0,0,0,70,75,53,50,71,65,76,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,67,83,67,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,53,46,50,102,0,0,0,0,0,0,70,75,53,50,71,65,76,58,32,74,50,48,48,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,68,69,67,0,0,0,0,0,84,83,67,0,0,0,0,0,71,76,83,0,0,0,0,0,42,69,114,114,111,114,42,58,32,78,111,32,99,111,110,118,101,114,103,101,110,99,101,32,105,110,32,49,48,48,32,83,86,68,32,105,116,101,114,97,116,105,111,110,115,32,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,54,46,51,102,0,0,0,0,0,0,71,65,76,50,70,75,52,58,32,66,49,57,53,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,76,65,84,0,0,0,0,0,69,78,68,0,0,0,0,0,80,67,79,0,0,0,0,0,76,84,0,0,0,0,0,0,116,109,112,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,65,95,37,100,95,37,100,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,55,46,52,102,0,0,0,0,0,0,71,65,76,50,70,75,52,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,67,84,89,80,69,50,0,0,66,79,78,0,0,0,0,0,37,99,37,99,76,84,0,0,114,118,49,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,56,46,53,102,0,0,0,0,0,0,70,75,52,50,71,65,76,58,32,108,111,110,103,32,61,32,37,46,53,102,32,108,97,116,32,61,32,37,46,53,102,10,0,0,0,0,0,0,0,0,67,84,89,80,69,49,0,0,112,111,108,121,32,40,49,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,87,65,84,50,0,0,0,0,67,79,79,0,0,0,0,0,108,111,110,103,112,111,108,101,0,0,0,0,0,0,0,0,37,99,37,99,76,78,0,0,105,110,32,115,118,100,102,105,116,40,41,0,0,0,0,0,37,99,37,48,50,100,58,37,48,50,100,58,37,48,57,46,54,102,0,0,0,0,0,0,70,75,52,50,71,65,76,58,32,66,49,57,53,48,32,82,65,44,68,101,99,61,32,37,115,10,0,0,0,0,0,0,86,69,76,79,67,73,84,89,0,0,0,0,0,0,0,0,37,115,95,37,100,0,0,0,67,79,68,0,0,0,0,0,76,78,0,0,0,0,0,0,42,69,114,114,111,114,42,58,32,78,111,116,32,101,110,111,117,103,104,32,114,111,119,115,32,102,111,114,32,115,111,108,118,105,110,103,32,116,104,101,32,115,121,115,116,101,109,32,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,50,100,0,0,87,67,83,65,88,69,83,0,73,67,82,83,0,0,0,0,90,83,79,85,82,67,69,0,50,48,48,48,0,0,0,0,67,79,69,0,0,0,0,0,76,65,84,0,0,0,0,0,112,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,52,46,49,102,0,0,0,0,0,0,0,0,86,83,79,85,82,67,69,0,67,79,80,0,0,0,0,0,37,115,45,37,115,0,0,0,119,109,97,116,32,40,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,87,67,83,73,78,73,84,58,32,100,101,112,101,110,100,101,100,32,111,110,32,87,67,83,32,99,111,117,108,100,32,110,111,116,32,98,101,32,115,101,116,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,53,46,50,102,0,0,0,0,0,0,0,0,87,67,83,73,78,73,84,78,58,32,87,67,83,32,110,97,109,101,32,37,115,32,110,111,116,32,109,97,116,99,104,101,100,32,105,110,32,70,73,84,83,32,104,101,97,100,101,114,10,0,0,0,0,0,0,0,108,105,110,101,97,114,0,0,65,73,84,0,0,0,0,0,37,99,76,65,84,0,0,0,118,109,97,116,32,40,110,42,110,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,87,67,83,68,69,80,0,0,37,48,50,100,58,37,48,50,100,58,37,48,54,46,51,102,0,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,77,79,76,0,0,0,0,0,37,99,76,79,78,0,0,0,68,67,45,70,76,65,71,0,37,48,50,100,58,37,48,50,100,58,37,48,55,46,52,102,0,0,0,0,0,0,0,0,44,32,37,46,51,102,0,0,80,65,82,0,0,0,0,0,76,79,78,0,0,0,0,0,68,69,84,69,67,84,79,82,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,56,46,53,102,0,0,0,0,0,0,0,0,101,108,108,105,112,115,101,0,83,70,76,0,0,0,0,0,82,65,45,45,45,37,115,0,73,78,83,84,82,85,77,69,0,0,0,0,0,0,0,0,37,48,50,100,58,37,48,50,100,58,37,48,57,46,54,102,0,0,0,0,0,0,0,0,98,111,120,0,0,0,0,0,45,83,73,80,0,0,0,0,77,69,82,0,0,0,0,0,68,69,67,45,0,0,0,0,98,101,116,97,32,40,110,99,111,101,102,102,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,0,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,65,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,0,45,84,65,66,0,0,0,0,44,32,37,46,54,102,100,0,67,65,82,0,0,0,0,0,68,69,67,45,45,37,115,0,97,108,112,104,97,32,40,109,97,116,115,105,122,101,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,0,0,0,67,84,89,80,69,0,0,0,44,32,37,46,54,102,39,0,78,111,116,32,101,110,111,117,103,104,32,109,101,109,111,114,121,32,102,111,114,32,0,0,87,65,84,49,95,48,48,49,61,32,39,119,116,121,112,101,61,122,112,120,32,97,120,116,121,112,101,61,114,97,32,112,114,111,106,112,48,61,48,46,32,112,114,111,106,112,49,61,49,46,32,112,114,111,106,112,50,61,48,46,32,112,114,111,106,112,51,61,51,51,55,46,55,52,32,112,114,111,106,39,87,65,84,50,95,48,48,49,61,32,39,119,116,121,112,101,61,122,112,120,32,97,120,116,121,112,101,61,100,101,99,32,112,114,111,106,112,48,61,48,46,32,112,114,111,106,112,49,61,49,46,32,112,114,111,106,112,50,61,48,46,32,112,114,111,106,112,51,61,51,51,55,46,55,52,32,112,114,111,39,0,0,0,0,0,0,0,0,67,69,65,0,0,0,0,0,87,65,84,50,0,0,0,0,112,111,108,121,95,102,117,110,99,40,41,0,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,117,110,107,110,111,119,110,32,115,117,114,102,97,99,101,32,116,121,112,101,32,37,100,10,0,0,87,67,83,73,78,73,84,58,32,77,105,115,115,105,110,103,32,107,101,121,119,111,114,100,32,37,115,32,97,115,115,117,109,101,100,32,49,10,0,0,44,32,37,46,50,102,34,0,65,76,84,65,90,0,0,0,72,69,76,73,79,69,67,76,0,0,0,0,0,0,0,0,83,71,65,76,65,67,84,67,0,0,0,0,0,0,0,0,69,67,76,73,80,84,73,67,0,0,0,0,0,0,0,0,37,115,95,49,0,0,0,0,71,65,76,65,67,84,73,67,0,0,0,0,0,0,0,0,67,89,80,0,0,0,0,0,82,65,0,0,0,0,0,0,69,67,76,0,0,0,0,0,42,73,110,116,101,114,110,97,108,32,69,114,114,111,114,42,58,32,79,110,101,32,111,102,32,120,32,111,114,32,101,120,116,98,97,115,105,115,32,115,104,111,117,108,100,32,98,101,32,100,105,102,102,101,114,101,110,116,32,102,114,111,109,32,78,85,76,76,10,105,110,32,0,0,0,0,0,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,121,32,114,97,110,103,101,32,37,102,45,37,102,10,0,0,0,0,37,100,0,0,0,0,0,0,71,65,76,0,0,0,0,0,73,67,82,83,0,0,0,0,50,48,48,48,46,48,0,0,82,65,68,69,67,83,89,83,0,0,0,0,0,0,0,0,87,67,83,78,65,77,69,0,82,65,68,69,67,83,89,83,37,99,0,0,0,0,0,0,44,32,37,115,44,32,37,115,0,0,0,0,0,0,0,0,69,81,85,73,78,79,88,37,99,0,0,0,0,0,0,0,87,65,82,78,73,78,71,58,32,83,105,103,110,105,102,105,99,97,110,116,32,105,110,97,99,99,117,114,97,99,121,32,108,105,107,101,108,121,32,116,111,32,111,99,99,117,114,32,105,110,32,112,114,111,106,101,99,116,105,111,110,0,0,0,42,69,114,114,111,114,42,58,32,105,110,99,111,114,114,101,99,116,32,108,105,110,101,97,114,32,99,111,110,118,101,114,115,105,111,110,32,105,110,32,37,115,0,0,0,0,0,0,84,65,78,0,0,0,0,0,66,80,95,37,100,95,37,100,0,0,0,0,0,0,0,0,87,67,83,73,78,73,84,58,32,78,111,32,105,109,97,103,101,32,115,99,97,108,101,0,65,73,82,0,0,0,0,0,82,65,45,45,0,0,0,0,68,69,67,45,45,84,65,78,0,0,0,0,0,0,0,0,112,111,108,121,45,62,99,111,101,102,102,32,40,112,111,108,121,45,62,110,99,111,101,102,102,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,120,32,114,97,110,103,101,32,37,102,45,37,102,10,0,0,0,0,87,67,83,73,78,73,84,58,32,78,111,32,78,65,88,73,83,50,32,111,114,32,73,77,65,71,69,72,32,107,101,121,119,111,114,100,0,0,0,0,82,65,45,45,45,84,65,78,0,0,0,0,0,0,0,0,76,79,78,71,80,79,76,69,0,0,0,0,0,0,0,0,87,67,83,73,78,73,84,32,78,111,32,68,69,67,32,119,105,116,104,32,83,69,67,80,73,88,44,32,110,111,32,87,67,83,0,0,0,0,0,0,68,69,67,0,0,0,0,0,87,67,83,73,78,73,84,58,32,78,111,32,82,65,32,119,105,116,104,32,83,69,67,80,73,88,44,32,110,111,32,87,67,83,0,0,0,0,0,0,44,32,37,46,54,102,44,32,37,46,54,102,0,0,0,0,87,67,83,95,67,79,77,77,65,78,68,37,100,0,0,0,68,69,67,45,45,68,83,83,0,0,0,0,0,0,0,0,87,67,83,95,67,79,77,77,65,78,68,0,0,0,0,0,82,65,45,45,45,68,83,83,0,0,0,0,0,0,0,0,82,65,0,0,0,0,0,0,68,73,83,84,73,78,73,84,58,32,77,105,115,115,105,110,103,32,66,80,95,79,82,68,69,82,32,107,101,121,119,111,114,100,32,102,111,114,32,83,112,105,116,122,101,114,32,100,105,115,116,111,114,116,105,111,110,0,0,0,0,0,0,0,65,77,68,89,37,100,0,0,90,69,65,0,0,0,0,0,37,46,51,115,0,0,0,0,42,42,42,42,42,42,42,42,42,42,9,42,42,42,42,42,42,42,42,42,0,0,0,0,65,77,68,89,49,0,0,0,112,111,108,121,45,62,98,97,115,105,115,32,40,112,111,108,121,45,62,110,99,111,101,102,102,32,101,108,101,109,101,110,116,115,41,32,33,0,0,0,119,102,95,103,115,114,101,115,116,111,114,101,58,32,105,108,108,101,103,97,108,32,121,32,111,114,100,101,114,32,37,100,10,0,0,0,0,0,0,0,73,77,65,71,69,72,0,0,65,77,68,88,37,100,0,0,112,105,120,101,108,0,0,0,65,77,68,88,49,0,0,0,32,108,111,110,103,45,115,112,97,0,0,0,0,0,0,0,80,80,79,37,100,0,0,0,9,108,111,110,103,45,115,112,97,0,0,0,0,0,0,0,80,80,79,49,0,0,0,0,112,111,108,121,103,111,110,0,101,99,108,105,112,116,105,99,0,0,0,0,0,0,0,0,103,97,108,97,99,116,105,99,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
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
  Module["_tolower"] = _tolower; 
  Module["_strncasecmp"] = _strncasecmp; 
  Module["_strcasecmp"] = _strcasecmp;
  Module["_strncpy"] = _strncpy;
  Module["_strlen"] = _strlen;function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  var ___strtok_state=0;
  function _strtok_r(s, delim, lasts) {
      var skip_leading_delim = 1;
      var spanp;
      var c, sc;
      var tok;
      if (s == 0 && (s = getValue(lasts, 'i8*')) == 0) {
        return 0;
      }
      cont: while (1) {
        c = getValue(s++, 'i8');
        for (spanp = delim; (sc = getValue(spanp++, 'i8')) != 0;) {
          if (c == sc) {
            if (skip_leading_delim) {
              continue cont;
            } else {
              setValue(lasts, s, 'i8*');
              setValue(s - 1, 0, 'i8');
              return s - 1;
            }
          }
        }
        break;
      }
      if (c == 0) {
        setValue(lasts, 0, 'i8*');
        return 0;
      }
      tok = s - 1;
      for (;;) {
        c = getValue(s++, 'i8');
        spanp = delim;
        do {
          if ((sc = getValue(spanp++, 'i8')) == c) {
            if (c == 0) {
              s = 0;
            } else {
              setValue(s - 1, 0, 'i8');
            }
            setValue(lasts, s, 'i8*');
            return tok;
          }
        } while (sc != 0);
      }
      abort('strtok_r error!');
    }function _strtok(s, delim) {
      return _strtok_r(s, delim, ___strtok_state);
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
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
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
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
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
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
          } else {
            var precision = 6; // Standard default.
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
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
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
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
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
              HEAP32[((ptr)>>2)]=ret.length
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
    }function _snprintf(s, n, format, varargs) {
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
  function _strncat(pdest, psrc, num) {
      var len = _strlen(pdest);
      var i = 0;
      while(1) {
        HEAP8[((pdest+len+i)|0)]=HEAP8[((psrc+i)|0)];
        if (HEAP8[(((pdest)+(len+i))|0)] == 0) break;
        i ++;
        if (i == num) {
          HEAP8[(((pdest)+(len+i))|0)]=0
          break;
        }
      }
      return pdest;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }
  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,EDOTDOT:76,EBADMSG:77,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"No message of desired type",36:"Identifier removed",37:"Channel number out of range",38:"Level 2 not synchronized",39:"Level 3 halted",40:"Level 3 reset",41:"Link number out of range",42:"Protocol driver not attached",43:"No CSI structure available",44:"Level 2 halted",45:"Deadlock condition",46:"No record locks available",50:"Invalid exchange",51:"Invalid request descriptor",52:"Exchange full",53:"No anode",54:"Invalid request code",55:"Invalid slot",56:"File locking deadlock error",57:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",74:"Multihop attempted",76:"Cross mount point (not really error)",77:"Trying to read unreadable message",80:"Given log. name not unique",81:"f.d. invalid for this operation",82:"Remote address changed",83:"Can   access a needed shared lib",84:"Accessing a corrupted shared lib",85:".lib section in a.out corrupted",86:"Attempting to link in too many libs",87:"Attempting to exec a shared library",88:"Function not implemented",90:"Directory not empty",91:"File or path name too long",92:"Too many symbolic links",95:"Operation not supported on transport endpoint",96:"Protocol family not supported",104:"Connection reset by peer",105:"No buffer space available",106:"Address family not supported by protocol family",107:"Protocol wrong type for socket",108:"Socket operation on non-socket",109:"Protocol not available",110:"Can't send after socket shutdown",111:"Connection refused",112:"Address already in use",113:"Connection aborted",114:"Network is unreachable",115:"Network interface is not configured",116:"Connection timed out",117:"Host is down",118:"Host is unreachable",119:"Connection already in progress",120:"Socket already connected",121:"Destination address required",122:"Message too long",123:"Unknown protocol",124:"Socket type not supported",125:"Address not available",126:"Connection reset by network",127:"Socket is already connected",128:"Socket is not connected",129:"Too many references",131:"Too many users",132:"Quota exceeded",133:"Stale file handle",134:"Not supported",135:"No medium (in tape drive)",138:"Illegal byte sequence",139:"Value too large for defined data type",140:"Operation canceled",141:"State not recoverable",142:"Previous owner died",143:"Streams pipe error"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
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
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
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
  var TTY={ttys:[],register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          // this wouldn't be required if the library wasn't eval'd at first...
          if (!TTY.utf8) {
            TTY.utf8 = new Runtime.UTF8Processor();
          }
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
              if (process.stdin.destroyed) {
                return undefined;
              }
              result = process.stdin.read();
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
  var MEMFS={mount:function (mount) {
        return MEMFS.create_node(null, '/', 0040000 | 0777, 0);
      },create_node:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
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
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.create_node(parent, name, mode, dev);
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
          var node = MEMFS.create_node(parent, newname, 0777 | 0120000, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (contents.subarray) { // typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          stream.node.timestamp = Date.now();
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
          if (!(flags & 0x02)) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            assert(contents.buffer === buffer || contents.buffer === buffer.buffer);
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
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,nodes:[null],devices:[null],streams:[null],nextInode:1,name_table:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.name_table.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.name_table[hash];
        FS.name_table[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.name_table[hash] === node) {
          FS.name_table[hash] = node.name_next;
        } else {
          var current = FS.name_table[hash];
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
        for (var node = FS.name_table[hash]; node; node = node.name_next) {
          if (node.parent.id === parent.id && node.name === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 0170000) === 0100000;
      },isDir:function (mode) {
        return (mode & 0170000) === 0040000;
      },isLink:function (mode) {
        return (mode & 0170000) === 0120000;
      },isChrdev:function (mode) {
        return (mode & 0170000) === 0020000;
      },isBlkdev:function (mode) {
        return (mode & 0170000) === 0060000;
      },isFIFO:function (mode) {
        return (mode & 0170000) === 0010000;
      },cwd:function () {
        return FS.currentPath;
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.currentPath, path);
        opts = opts || { recurse_count: 0 };
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
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
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
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },flagModes:{"r":0,"rs":8192,"r+":2,"w":1537,"wx":3585,"xw":3585,"w+":1538,"wx+":3586,"xw+":3586,"a":521,"ax":2569,"xa":2569,"a+":522,"ax+":2570,"xa+":2570},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 3;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 1024)) {
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
      },mayMknod:function (mode) {
        switch (mode & 0170000) {
          case 0100000:
          case 0020000:
          case 0060000:
          case 0010000:
          case 0140000:
            return 0;
          default:
            return ERRNO_CODES.EINVAL;
        }
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
          if (FS.isRoot(node) || FS.getPath(node) === FS.currentPath) {
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
          if ((flags & 3) !== 0 ||  // opening for write
              (flags & 1024)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
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
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
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
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 3) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 3) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 8); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
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
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current, 0777);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = input && output ? 0777 : (input ? 0333 : 0555);
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
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
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
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
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
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
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
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = PATH.resolve(PATH.join(parent, name));
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
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
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp', 0777);
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev', 0777);
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', 0666, FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', 0666, FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', 0666, FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm', 0777);
        FS.mkdir('/dev/shm/tmp', 0777);
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
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.name_table = new Array(4096);
        FS.root = FS.createNode(null, '/', 0040000 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
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
      },mount:function (type, opts, mountpoint) {
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
        }
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        return root;
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
        mode &= 4095;
        mode |= 0100000;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode &= 511 | 0001000;
        mode |= 0040000;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        mode |= 0020000;
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
        var lookup = FS.lookupPath(path, { follow: false });
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
        if ((stream.flags & 3) === 0) {
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
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 512)) {
          mode = (mode & 4095) | 0100000;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 0200000)
          });
          node = lookup.node;
          path = lookup.path;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 512)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 2048)) {
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
          flags &= ~1024;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 1024)) {
          FS.truncate(node, 0);
        }
        // register the stream with the filesystem
        var stream = FS.createStream({
          path: path,
          node: node,
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
        if ((stream.flags & 3) === 1) {
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
      },write:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
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
        if (stream.flags & 8) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
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
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      }};
  function _send(fd, buf, len, flags) {
      var info = FS.getStream(fd);
      if (!info) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (info.socket.readyState === WebSocket.CLOSING || info.socket.readyState === WebSocket.CLOSED) {
        ___setErrNo(ERRNO_CODES.ENOTCONN);
        return -1;
      } else if (info.socket.readyState === WebSocket.CONNECTING) {
        ___setErrNo(ERRNO_CODES.EAGAIN);
        return -1;
      }
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
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
      if (stream && ('socket' in stream)) {
        return _send(fildes, buf, nbyte, 0);
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
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
  Module["_strcpy"] = _strcpy;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  Module["_strcat"] = _strcat;
  var _cos=Math.cos;
  var _sin=Math.sin;
  var _sqrt=Math.sqrt;
  var _fabs=Math.abs;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)),ret>>>0)|0);
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _llvm_memset_p0i8_i64=_memset;
  var _atan2=Math.atan2;
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
        HEAP32[((envPtr)>>2)]=poolPtr
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
        for (var j = 0; j < line.length; j++) {
          HEAP8[(((poolPtr)+(j))|0)]=line.charCodeAt(j);
        }
        HEAP8[(((poolPtr)+(j))|0)]=0;
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
  function _fmod(x, y) {
      return x % y;
    }
  var _asin=Math.asin;
  var _atan=Math.atan;
  var _acos=Math.acos;
  var _log=Math.log;
  var _tan=Math.tan;
  var _exp=Math.exp;
  var _llvm_pow_f64=Math.pow;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  var _fabsf=Math.abs;
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
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
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
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
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
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
          img.onload = function() {
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
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
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
            audio.onerror = function(event) {
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
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
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
          Module.ctx = ctx;
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
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
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
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
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
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
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
        xhr.onload = function() {
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
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___strtok_state = Runtime.staticAlloc(4);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
___buildEnvironment(ENV);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iffiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iffiii"](index,a1,a2,a3,a4,a5);
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
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stderr|0;var n=+env.NaN;var o=+env.Infinity;var p=0;var q=0;var r=0;var s=0;var t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0.0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=global.Math.floor;var N=global.Math.abs;var O=global.Math.sqrt;var P=global.Math.pow;var Q=global.Math.cos;var R=global.Math.sin;var S=global.Math.tan;var T=global.Math.acos;var U=global.Math.asin;var V=global.Math.atan;var W=global.Math.atan2;var X=global.Math.exp;var Y=global.Math.log;var Z=global.Math.ceil;var _=global.Math.imul;var $=env.abort;var aa=env.assert;var ab=env.asmPrintInt;var ac=env.asmPrintFloat;var ad=env.min;var ae=env.invoke_vi;var af=env.invoke_ii;var ag=env.invoke_v;var ah=env.invoke_iffiii;var ai=env.invoke_iii;var aj=env._strncmp;var ak=env._fabsf;var al=env._snprintf;var am=env._strtok_r;var an=env._abort;var ao=env._fprintf;var ap=env._sqrt;var aq=env._toupper;var ar=env._fflush;var as=env.___buildEnvironment;var at=env.__reallyNegative;var au=env._tan;var av=env._strchr;var aw=env._asin;var ax=env._strtol;var ay=env._log;var az=env._fabs;var aA=env._strtok;var aB=env.___setErrNo;var aC=env._fwrite;var aD=env._send;var aE=env._write;var aF=env._exit;var aG=env._sprintf;var aH=env._llvm_lifetime_end;var aI=env._strdup;var aJ=env._sin;var aK=env._strncat;var aL=env._atan2;var aM=env._atan;var aN=env.__exit;var aO=env._time;var aP=env.__formatString;var aQ=env._getenv;var aR=env._atoi;var aS=env._cos;var aT=env._pwrite;var aU=env._llvm_pow_f64;var aV=env._sbrk;var aW=env.___errno_location;var aX=env._fmod;var aY=env._isspace;var aZ=env._llvm_lifetime_start;var a_=env.__parseInt;var a$=env._sysconf;var a0=env._islower;var a1=env._exp;var a2=env._acos;var a3=env._isupper;var a4=env._strcmp;
// EMSCRIPTEN_START_FUNCS
function ba(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function bb(){return i|0}function bc(a){a=a|0;i=a}function bd(a,b){a=a|0;b=b|0;if((p|0)==0){p=a;q=b}}function be(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function bf(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function bg(a){a=a|0;C=a}function bh(a){a=a|0;D=a}function bi(a){a=a|0;E=a}function bj(a){a=a|0;F=a}function bk(a){a=a|0;G=a}function bl(a){a=a|0;H=a}function bm(a){a=a|0;I=a}function bn(a){a=a|0;J=a}function bo(a){a=a|0;K=a}function bp(a){a=a|0;L=a}function bq(){}function br(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((d|0)>0){e=by(b,d)|0}else{e=bz(b)|0}b=(e|0)==0;if(!b){bH(e,bP(e)|0)}d=c[1618]|0;do{if((d|0)==0){c[1618]=10;f=ei(41040)|0;c[1624]=f;if((f|0)==0){g=-4}else{h=10;break}return g|0}else{h=d}}while(0);d=c[50]|0;L12:do{if((d|0)<(h|0)){i=d}else{f=h;j=c[1624]|0;while(1){k=f+10|0;c[1618]=k;l=el(j,k*4104|0)|0;k=l;c[1624]=k;if((l|0)==0){g=-3;break}l=c[1618]|0;m=c[50]|0;if((m|0)<(l|0)){i=m;break L12}else{f=l;j=k}}return g|0}}while(0);if(b){g=-1;return g|0}c[(c[1624]|0)+(i*4104|0)>>2]=e;c[(c[1624]|0)+((c[50]|0)*4104|0)+4>>2]=0;a[(c[1624]|0)+((c[50]|0)*4104|0)+8|0]=0;c[50]=(c[50]|0)+1;g=i;return g|0}function bs(b,d,e){b=b|0;d=+d;e=+e;var f=0,g=0,h=0,i=0;f=c[1624]|0;g=c[f+(b*4104|0)>>2]|0;if((g|0)==0){h=0;return h|0}i=f+(b*4104|0)+8|0;a[i]=0;bR(g,d,e,i,4096)|0;h=i;return h|0}function bt(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((b|0)>0&(c[1618]|0)>(b|0)){e=(c[1624]|0)+(b*4104|0)|0}else{e=0}b=e|0;f=c[b>>2]|0;if((f|0)==0){g=0;return g|0}h=e+8|0;a[h]=0;L35:do{if((d|0)!=0){if((a[d]|0)==0){break}do{if((es(d|0,6208)|0)==0){i=f}else{if((es(d|0,6192)|0)==0){i=f;break}if((es(d|0,4272)|0)==0){i=f;break}if(+bZ(d)<=0.0){break L35}i=c[b>>2]|0}}while(0);bH(i,d)}}while(0);et(h|0,bN(c[b>>2]|0)|0,4096)|0;if((es(h|0,6208)|0)==0){ev(h|0,6208,9)|0;g=h;return g|0}if((es(h|0,6192)|0)==0){ev(h|0,6192,9)|0;g=h;return g|0}b=a[h]|0;if(b<<24>>24==0){g=h;return g|0}else{j=h;k=b}while(1){if((a0(k<<24>>24|0)|0)!=0){a[j]=(aq(a[j]|0)|0)&255}b=j+1|0;d=a[b]|0;if(d<<24>>24==0){g=h;break}else{j=b;k=d}}return g|0}function bu(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=c[1624]|0;f=c[e+(b*4104|0)>>2]|0;if((f|0)==0){g=0;return g|0}h=e+(b*4104|0)+8|0;a[h]=0;do{if((d|0)!=0){if((a[d]|0)==0){break}if((es(d|0,3144)|0)==0){bO(f,1)|0;c[e+(b*4104|0)+4>>2]=1;break}else{bO(f,0)|0;c[e+(b*4104|0)+4>>2]=0;break}}}while(0);switch(c[e+(b*4104|0)+4>>2]|0){case 1:{et(h|0,3144,4095)|0;break};case 0:{et(h|0,2768,4095)|0;break};default:{}}b=a[h]|0;if(b<<24>>24==0){g=h;return g|0}else{i=h;j=b}while(1){if((a3(j<<24>>24|0)|0)!=0){a[i]=(eq(a[i]|0)|0)&255}b=i+1|0;e=a[b]|0;if(e<<24>>24==0){g=h;break}else{i=b;j=e}}return g|0}function bv(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0.0,z=0,A=0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0,I=0.0;e=i;i=i+12336|0;f=e+12288|0;g=e+12296|0;j=e+12304|0;k=e+12312|0;l=e+12320|0;m=e+12328|0;if((b|0)>0&(c[1618]|0)>(b|0)){n=(c[1624]|0)+(b*4104|0)|0}else{n=0}c[f>>2]=0;c[g>>2]=0;b=n|0;if((c[b>>2]|0)==0){o=0;i=e;return o|0}p=n+8|0;a[p]=0;q=aA(aI(d|0)|0,2496)|0;if((q|0)==0){o=p;i=e;return o|0}d=e|0;r=n+4|0;n=e+4096|0;s=e+8192|0;t=q;while(1){q=av(t|0,32)|0;if((q|0)==0){c[f>>2]=8608;u=0;v=8608}else{w=q+1|0;c[f>>2]=w;a[q]=0;u=t;v=w}x=+eo(v,g);do{if(x!=0.0){y=+eo(c[g>>2]|0,f);if(y==0.0){break}bQ(c[b>>2]|0,x,y,j,k);w=(u|0)!=0;if(w){al(d|0,4096,1984,(z=i,i=i+8|0,c[z>>2]=u,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}switch(c[r>>2]|0){case 1:{y=+h[k>>3];al(d|0,4096,1648,(z=i,i=i+16|0,h[z>>3]=+h[j>>3],h[z+8>>3]=y,z)|0)|0;i=z;aK(p|0,d|0,4095)|0;break};case 0:{cs(n,4095,+h[j>>3],3);ct(s,4095,+h[k>>3],3);al(d|0,4096,1256,(z=i,i=i+16|0,c[z>>2]=n,c[z+8>>2]=s,z)|0)|0;i=z;aK(p|0,d|0,4095)|0;break};default:{y=+h[k>>3];al(d|0,4096,1648,(z=i,i=i+16|0,h[z>>3]=+h[j>>3],h[z+8>>3]=y,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}}q=(a4(u|0,6184)|0)==0;y=+eo(c[f>>2]|0,g);A=y!=0.0;L111:do{if(q){if(A){B=y}else{C=y;break}while(1){D=+eo(c[g>>2]|0,f);if(D==0.0){C=B;break L111}bQ(c[b>>2]|0,B,D,j,k);switch(c[r>>2]|0){case 1:{D=+h[k>>3];al(d|0,4096,5816,(z=i,i=i+16|0,h[z>>3]=+h[j>>3],h[z+8>>3]=D,z)|0)|0;i=z;aK(p|0,d|0,4095)|0;break};case 0:{cs(n,4095,+h[j>>3],3);ct(s,4095,+h[k>>3],3);al(d|0,4096,5352,(z=i,i=i+16|0,c[z>>2]=n,c[z+8>>2]=s,z)|0)|0;i=z;aK(p|0,d|0,4095)|0;break};default:{D=+h[k>>3];al(d|0,4096,5816,(z=i,i=i+16|0,h[z>>3]=+h[j>>3],h[z+8>>3]=D,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}}D=+eo(c[f>>2]|0,g);if(D!=0.0){B=D}else{C=D;break L111}}}else{if(A){E=y}else{C=y;break}while(1){D=+eo(c[g>>2]|0,f);if(D==0.0){C=E;break L111}F=+eo(c[f>>2]|0,g);if(F==0.0){C=E;break L111}G=+eo(c[g>>2]|0,f);if(G==0.0){C=E;break L111}bQ(c[b>>2]|0,E,D,j,k);bQ(c[b>>2]|0,F,G,l,m);G=+bS(+h[j>>3],+h[k>>3],+h[l>>3],+h[m>>3])*3600.0;do{if(G>60.0){if(G>3600.0){F=G/3600.0;al(d|0,4096,4672,(z=i,i=i+8|0,h[z>>3]=F,z)|0)|0;i=z;aK(p|0,d|0,4095)|0;break}else{F=G/60.0;al(d|0,4096,4736,(z=i,i=i+8|0,h[z>>3]=F,z)|0)|0;i=z;aK(p|0,d|0,4095)|0;break}}else{al(d|0,4096,5048,(z=i,i=i+8|0,h[z>>3]=G,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}}while(0);G=+eo(c[f>>2]|0,g);if(G!=0.0){E=G}else{C=G;break}}}}while(0);if((a4(u|0,4536)|0)==0){H=102}else{if((a4(u|0,4472)|0)==0){H=102}}if((H|0)==102){H=0;if(C<0.0){y=C;while(1){G=y+6.283185307179586;if(G<0.0){y=G}else{I=G;break}}}else{I=C}y=I*57.29577951308232;al(d|0,4096,4408,(z=i,i=i+8|0,h[z>>3]=y,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}if(w){al(d|0,4096,4352,(z=i,i=i+1|0,i=i+7>>3<<3,c[z>>2]=0,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}al(d|0,4096,2496,(z=i,i=i+1|0,i=i+7>>3<<3,c[z>>2]=0,z)|0)|0;i=z;aK(p|0,d|0,4095)|0}}while(0);A=aA(0,2496)|0;if((A|0)==0){o=p;break}else{t=A}}i=e;return o|0}function bw(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0.0,ak=0.0,al=0,am=0,an=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,aw=0,ax=0,ay=0.0,az=0.0,aA=0.0,aB=0.0,aC=0,aD=0.0,aE=0,aF=0.0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0.0,aX=0.0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a5=0;e=i;i=i+928|0;f=e|0;g=e+8|0;j=e+16|0;k=e+48|0;l=e+80|0;n=e+112|0;o=e+120|0;p=e+128|0;q=e+136|0;r=e+144|0;s=e+152|0;t=e+160|0;v=e+168|0;w=e+176|0;x=e+184|0;y=e+192|0;z=e+200|0;A=e+208|0;B=e+216|0;C=e+224|0;D=e+232|0;E=e+240|0;F=e+248|0;G=e+280|0;H=G;I=i;i=i+16|0;J=i;i=i+4|0;i=i+7>>3<<3;K=i;i=i+4|0;i=i+7>>3<<3;L=i;i=i+4|0;i=i+7>>3<<3;M=i;i=i+80|0;N=i;i=i+64|0;O=i;i=i+1|0;i=i+7>>3<<3;P=i;i=i+8|0;S=i;i=i+8|0;T=i;i=i+8|0;U=ej(1,9336)|0;V=U;W=a[d]|0;d=W<<24>>24==32?0:W;a[O]=d;a[U+9324|0]=d;d=N|0;if((cn(b,5328,O,63,d)|0)!=0){N=ej((eu(d|0)|0)+2|0,1)|0;c[U+9320>>2]=N;ew(N|0,d|0)|0}N=U+3984|0;c[N>>2]=0;c[U+3956>>2]=0;c[U+3924>>2]=0;c[U+3952>>2]=-1;W=U+3268|0;c[W>>2]=0;X=U+3272|0;c[X>>2]=0;h[D>>3]=0.0;h[E>>3]=0.0;Y=F|0;Z=F+8|0;$=F+16|0;aa=F+24|0;ab=G|0;ey(F|0,0,32);h[ab>>3]=0.0;F=U+3300|0;c[F>>2]=0;ac=U+48|0;h[ac>>3]=0.0;c[L>>2]=0;cc(b,4e3,O,L)|0;ad=c[L>>2]|0;do{if((ad|0)==0){cd(b,4e3,L)|0;ae=c[L>>2]|0;if((ae|0)!=0){af=ae;break}cd(b,3008,L)|0;ae=c[L>>2]|0;if((ae|0)!=0){af=ae;break}cd(b,2720,L)|0;af=c[L>>2]|0}else{af=ad}}while(0);if((af|0)<1){bK(2400);bD(V);ag=0;i=e;return ag|0}if((af|0)>2){c[L>>2]=2;ah=2}else{ah=af}af=U+3316|0;c[af>>2]=ah;ad=U+3320|0;c[ad>>2]=ah;c[U+3960>>2]=ah;ah=U+136|0;h[ah>>3]=0.0;ck(b,2200,ah)|0;ai=+h[ah>>3];if(ai<1.0){ck(b,1936,ah)|0;ak=+h[ah>>3]}else{ak=ai}if(ak<1.0){bK(1552);bD(V);ag=0;i=e;return ag|0}ae=U+144|0;h[ae>>3]=0.0;ck(b,1160,ae)|0;if(+h[ae>>3]<1.0){ck(b,6104,ae)|0}al=c[L>>2]|0;do{if((al|0)>1){if(+h[ae>>3]>=1.0){am=131;break}bK(5656);bD(V);ag=0;i=e;return ag|0}else{if((al|0)>0){am=131}else{an=0}}}while(0);if((am|0)==131){al=I|0;ap=M|0;aq=0;ar=0;while(1){a[al]=a[3008]|0;a[al+1|0]=a[3009|0]|0;a[al+2|0]=a[3010|0]|0;a[al+3|0]=a[3011|0]|0;a[al+4|0]=a[3012|0]|0;a[al+5|0]=a[3013|0]|0;as=aq+1|0;aG(ap|0,5280,(at=i,i=i+8|0,c[at>>2]=as,at)|0)|0;i=at;ex(al|0,ap|0)|0;L184:do{if((cd(b,al,K)|0)==0){L186:do{switch(aq|0){case 1:{ak=+h[ae>>3];if(ak<=1.0){break L186}c[K>>2]=~~ak;break L184;break};case 0:{ak=+h[ah>>3];if(ak<=1.0){break L186}c[K>>2]=~~ak;break L184;break};default:{}}}while(0);au=c[m>>2]|0;ao(au|0,5008,(at=i,i=i+8|0,c[at>>2]=al,at)|0)|0;i=at}}while(0);a[al]=a[4728]|0;a[al+1|0]=a[4729|0]|0;a[al+2|0]=a[4730|0]|0;a[al+3|0]=a[4731|0]|0;a[al+4|0]=a[4732|0]|0;a[al+5|0]=a[4733|0]|0;ex(al|0,ap|0)|0;do{if((co(b,al,16,ap)|0)!=0){if((cp(ap,4664)|0)==0){break}c[K>>2]=0}}while(0);au=((c[K>>2]|0)>1)+ar|0;if((as|0)<(c[L>>2]|0)){aq=as;ar=au}else{an=au;break}}}c[L>>2]=an;c[ad>>2]=an;c[af>>2]=an;co(b,4496,16,U+3336|0)|0;cd(b,4432,U+3332|0)|0;an=U+3324|0;c[an>>2]=bT()|0;ad=U+9328|0;c[ad>>2]=0;cd(b,4376,ad)|0;ad=U+832|0;ey(ad|0,0,648);ey(H|0,0,648);ar=c[L>>2]|0;aq=(ar|0)>0;do{if(aq){ap=ad;al=0;do{h[ap+((_(ar,al)|0)+al<<3)>>3]=1.0;al=al+1|0;}while((al|0)<(ar|0));if(aq){aw=0}else{am=149;break}do{h[G+((_(ar,aw)|0)+aw<<3)>>3]=1.0;aw=aw+1|0;}while((aw|0)<(ar|0));al=U+760|0;ey(al|0,0,72);if(!aq){ax=al;break}ap=al;as=0;while(1){h[ap+(as<<3)>>3]=1.0;au=as+1|0;if((au|0)<(ar|0)){as=au}else{ax=al;break}}}else{am=149}}while(0);if((am|0)==149){ar=U+760|0;ey(ar|0,0,72);ax=ar}L212:do{if((cn(b,4320,O,63,d)|0)==0){c[U+9312>>2]=0}else{ar=bx(b,d)|0;a[f]=ar;do{if(ar<<24>>24==95){aq=c[m>>2]|0;ao(aq|0,4216,(at=i,i=i+8|0,c[at>>2]=d,at)|0)|0;i=at;c[U+9312>>2]=0}else{aq=bw(b,f)|0;c[U+9312>>2]=aq;if((aq|0)==0){break}c[aq+9316>>2]=V;break L212}}while(0);bK(4144);bD(V);ag=0;i=e;return ag|0}}while(0);f=U+3224|0;d=f;ar=U+3232|0;ey(f|0,0,16);do{if((cj(b,4096,O,d)|0)==0){if((cj(b,4016,O,ar)|0)!=0){h[d>>3]=+h[ar>>3]*299792.5;break}if((ck(b,3888,d)|0)==0){break}h[ar>>3]=+h[d>>3]/299792.5}else{h[ar>>3]=+h[d>>3]/299792.5}}while(0);d=U+4096|0;ey(d|0,0,80);ar=j|0;do{if((cn(b,3744,O,16,ar)|0)==0){j=a[O]|0;switch(j<<24>>24){case 0:case 32:{break};default:{f=M|0;aG(f|0,1512,(at=i,i=i+8|0,c[at>>2]=j<<24>>24,at)|0)|0;i=at;bK(f);bD(V);ag=0;i=e;return ag|0}}if((cb(b,1464)|0)!=0){c[U+3260>>2]=29;f=cb(b,1464)|0;ck(f,1464,r)|0;ck(f,1440,s)|0;ck(f,1408,t)|0;h[U+152>>3]=(+h[r>>3]+ +h[s>>3]/60.0+ +h[t>>3]/3600.0)*15.0*3.141592653589793/180.0;a[q]=43;co(f,1368,1,q)|0;ak=(a[q]|0)==45?-1.0:1.0;ck(f,1336,v)|0;ck(f,1296,w)|0;ck(f,1248,x)|0;h[U+160>>3]=ak*(+h[v>>3]+ +h[w>>3]/60.0+ +h[x>>3]/3600.0)*3.141592653589793/180.0;f=U+120|0;ck(b,1224,f)|0;cd(b,1224,J)|0;j=U+3764|0;aq=j;u=(c[J>>2]|0)==1950?3427142:3492678;a[aq]=u&255;u=u>>8;a[aq+1|0]=u&255;u=u>>8;a[aq+2|0]=u&255;u=u>>8;a[aq+3|0]=u&255;aq=U+128|0;h[aq>>3]=+h[f>>3];ck(b,1640,aq)|0;aq=U+3892|0;ak=+h[r>>3];ai=+h[s>>3];ay=+h[t>>3];f=a[q]|0;az=+h[v>>3];aA=+h[w>>3];aB=+h[x>>3];aG(aq|0,976,(at=i,i=i+64|0,h[at>>3]=ak,h[at+8>>3]=ai,h[at+16>>3]=ay,c[at+24>>2]=f,h[at+32>>3]=az,h[at+40>>3]=aA,h[at+48>>3]=aB,c[at+56>>2]=j,at)|0)|0;i=at;j=U+168|0;ck(b,936,j)|0;j=U+192|0;ck(b,904,j)|0;j=U+200|0;ck(b,888,j)|0;j=U+176|0;ck(b,880,j)|0;j=U+184|0;ck(b,856,j)|0;j=cb(b,6176)|0;f=I|0;aq=U+208|0;aG(f|0,6152,(at=i,i=i+8|0,c[at>>2]=1,at)|0)|0;i=at;aw=aq;h[aw>>3]=0.0;ck(j,f,aw)|0;aG(f|0,6152,(at=i,i=i+8|0,c[at>>2]=2,at)|0)|0;i=at;aw=U+216|0;h[aw>>3]=0.0;ck(j,f,aw)|0;aG(f|0,6152,(at=i,i=i+8|0,c[at>>2]=3,at)|0)|0;i=at;aw=U+224|0;h[aw>>3]=0.0;ck(j,f,aw)|0;aG(f|0,6152,(at=i,i=i+8|0,c[at>>2]=4,at)|0)|0;i=at;aw=U+232|0;h[aw>>3]=0.0;ck(j,f,aw)|0;aG(f|0,6152,(at=i,i=i+8|0,c[at>>2]=5,at)|0)|0;i=at;aw=U+240|0;h[aw>>3]=0.0;ck(j,f,aw)|0;aG(f|0,6152,(at=i,i=i+8|0,c[at>>2]=6,at)|0)|0;i=at;aw=U+248|0;h[aw>>3]=0.0;ck(j,f,aw)|0;aw=cb(b,6128)|0;j=U+256|0;aq=0;while(1){al=aq+1|0;aG(f|0,6112,(at=i,i=i+8|0,c[at>>2]=al,at)|0)|0;i=at;as=j+(aq<<3)|0;h[as>>3]=0.0;ck(aw,f,as)|0;if((al|0)<20){aq=al}else{break}}aq=cb(b,6016)|0;aw=U+416|0;j=0;while(1){al=j+1|0;aG(f|0,5968,(at=i,i=i+8|0,c[at>>2]=al,at)|0)|0;i=at;as=aw+(j<<3)|0;h[as>>3]=0.0;ck(aq,f,as)|0;if((al|0)<20){j=al}else{break}}j=U+3312|0;c[j>>2]=1;f=U+3449|0;a[f]=a[5896]|0;a[f+1|0]=a[5897|0]|0;a[f+2|0]=a[5898|0]|0;f=U+3458|0;u=4408644;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;f=U+3467|0;u=5460804;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[U+3292>>2]=0;c[U+3288>>2]=3;f=U+3368|0;ev(f|0,5880,9)|0;f=U+3377|0;ev(f|0,5848,9)|0;aB=+h[ah>>3]*.5;f=U+616|0;h[f>>3]=aB;aA=+h[ae>>3]*.5;aq=U+624|0;h[aq>>3]=aA;h[U+16>>3]=aB;h[U+24>>3]=aA;cO(aB,aA,V,z,B)|0;aA=+h[z>>3];h[U+688>>3]=aA;aB=+h[B>>3];h[U+696>>3]=aB;h[U>>3]=aA;h[U+8>>3]=aB;cO(+h[f>>3],+h[aq>>3]+1.0,V,A,C)|0;aB=+h[C>>3]- +h[B>>3];h[U+40>>3]=aB;h[U+32>>3]=-0.0-aB;bC(V);c[j>>2]=1;bM(V);aB=+h[ac>>3]*3.141592653589793/180.0;h[S>>3]=aB;aA=+h[f>>3];az=aA+ +Q(+aB);aA=+h[aq>>3];cO(az,aA+ +R(+aB),V,A,C)|0;j=ax;h[j>>3]=-0.0- +bS(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);aB=+h[f>>3];aA=+h[S>>3];az=aB+ +R(+aA);aB=+h[aq>>3];cO(az,aB+ +Q(+aA),V,A,C)|0;aA=+bS(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);h[U+768>>3]=aA;bG(V,+h[j>>3],aA,+h[ac>>3]);aC=j;break}do{if((cb(b,2248)|0)==0){if((cb(b,2232)|0)!=0){break}if((cb(b,2216)|0)!=0){break}if((cb(b,2184)|0)!=0){break}if((cb(b,2088)|0)!=0){break}bK(5520);bD(V);ag=0;i=e;return ag|0}}while(0);h[y>>3]=0.0;ck(b,2248,y)|0;aA=+h[y>>3];if(aA==0.0){ck(b,2232,y)|0;aD=+h[y>>3]}else{aD=aA}do{if(aD==0.0){ck(b,2088,y)|0;aA=+h[y>>3];if(aA!=0.0){h[D>>3]=(-0.0-aA)/3600.0;ck(b,2072,y)|0;h[E>>3]=+h[y>>3]/3600.0;break}ck(b,2184,y)|0;aA=+h[y>>3];if(aA!=0.0){h[D>>3]=(-0.0-aA)/3600.0;ck(b,2040,y)|0;h[E>>3]=+h[y>>3]/3600.0;break}else{ck(b,2216,y)|0;h[D>>3]=(-0.0- +h[y>>3])/3600.0;ck(b,2024,y)|0;h[E>>3]=+h[y>>3]/3600.0;break}}else{aA=aD/3600.0;h[E>>3]=aA;h[D>>3]=-0.0-aA}}while(0);h[S>>3]=0.0;ck(b,1928,S)|0;if(+h[ac>>3]==0.0){ck(b,1952,S)|0}bG(V,+h[D>>3],+h[E>>3],+h[S>>3]);j=U+616|0;h[j>>3]=+h[ah>>3]*.5+.5;aq=U+624|0;h[aq>>3]=+h[ae>>3]*.5+.5;if((cb(b,2816)|0)!=0){ck(b,2816,j)|0;ck(b,2808,aq)|0}h[U+16>>3]=+h[j>>3];h[U+24>>3]=+h[aq>>3];aq=U+688|0;h[aq>>3]=-999.0;if((cg(b,5896,aq)|0)==0){bK(5776);bD(V);ag=0;i=e;return ag|0}j=U+696|0;h[j>>3]=-999.0;if((ch(b,3376,j)|0)==0){bK(5728);bD(V);ag=0;i=e;return ag|0}aA=+h[aq>>3];h[U>>3]=aA;aB=+h[j>>3];h[U+8>>3]=aB;j=U+3304|0;c[j>>2]=0;h[U+3992>>3]=aA;h[U+4e3>>3]=aB;aq=U+4008|0;h[aq>>3]=999.0;if((ck(b,2752,aq)|0)==0){ck(b,5712,aq)|0}aq=U+4016|0;h[aq>>3]=999.0;ck(b,2744,aq)|0;do{if((ck(b,1704,P)|0)==0){aq=U+128|0;if((cl(b,1688,aq)|0)==0){if((cl(b,1672,aq)|0)!=0){break}if((ck(b,1640,aq)|0)!=0){break}h[aq>>3]=+h[U+120>>3];break}f=l|0;co(b,1688,32,f)|0;if((av(f|0,84)|0)!=0){break}if((ck(b,1624,T)|0)!=0){h[aq>>3]=+h[aq>>3]+ +h[T>>3]/8765.812770744;break}if((ck(b,1608,T)|0)==0){break}h[aq>>3]=+h[aq>>3]+ +h[T>>3]/8765.812770744}else{h[U+128>>3]=(+h[P>>3]-15019.81352)/365.242198781+1900.0}}while(0);bF(V,5696,5560)|0;c[j>>2]=0;a[g]=0;bB(b,V,g);bC(V);c[U+3292>>2]=0;c[U+3288>>2]=3;c[U+3312>>2]=1;aC=ax}else{aq=k|0;ew(aq|0,ar|0)|0;f=(cn(b,3632,O,16,aq)|0)==0;aw=U+3368|0;ew(aw|0,ar|0)|0;aw=U+3377|0;ew(aw|0,aq|0)|0;if((cp(aq,3504)|0)==0){aE=(cp(aq,3376)|0)==0?1:2}else{aE=2}aw=U+3386|0;a[aw]=0;cn(b,3224,O,9,aw)|0;aw=U+3395|0;a[aw]=0;cn(b,3136,O,9,aw)|0;if((bF(V,ar,aq)|0)!=0){bD(V);ag=0;i=e;return ag|0}aq=U+3260|0;do{if((c[aq>>2]|0)==0){aw=U+3476|0;do{if((cn(b,3080,O,16,aw)|0)==0){if((cx(b,3024,2984,16,aw)|0)!=0){break}a[aw]=0}}while(0);if((a4(aw|0,2872)|0)==0){c[aq>>2]=-1}if(f){break}al=U+3508|0;do{if((cn(b,2848,O,16,al)|0)==0){if((cx(b,2832,2984,16,al)|0)!=0){break}a[al]=0}}while(0);if((a4(aw|0,2872)|0)!=0){break}c[aq>>2]=-1}}while(0);f=U+616|0;h[f>>3]=1.0;cj(b,2816,O,f)|0;j=U+624|0;h[j>>3]=1.0;cj(b,2808,O,j)|0;h[U+16>>3]=+h[f>>3];h[U+24>>3]=+h[j>>3];al=U+688|0;h[al>>3]=0.0;cj(b,2784,O,al)|0;as=U+696|0;h[as>>3]=0.0;cj(b,2760,O,as)|0;switch(c[U+3884>>2]|0){case 7:{h[as>>3]=90.0- +h[as>>3];am=186;break};case 8:{aB=+h[as>>3]+-90.0;h[as>>3]=aB;aF=aB;break};default:{am=186}}if((am|0)==186){aF=+h[as>>3]}aB=+h[al>>3];h[U>>3]=aB;h[U+8>>3]=aF;al=U+3992|0;if((c[U+3304>>2]|0)==0){h[al>>3]=aB;h[U+4e3>>3]=aF}else{h[al>>3]=aF;h[U+4e3>>3]=aB}al=U+3176|0;h[al>>3]=999.0;cj(b,2752,O,al)|0;h[U+4008>>3]=+h[al>>3];al=U+3184|0;h[al>>3]=999.0;cj(b,2744,O,al)|0;h[U+4016>>3]=+h[al>>3];c[U+3964>>2]=f;al=ax;c[U+3972>>2]=al;c[U+3968>>2]=ad;as=U+4088|0;h[as>>3]=0.0;cj(b,2704,O,as)|0;as=I|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=0,at)|0)|0;i=at;ap=d;cj(b,as,O,ap)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=1,at)|0)|0;i=at;au=U+4104|0;cj(b,as,O,au)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=2,at)|0)|0;i=at;aH=U+4112|0;cj(b,as,O,aH)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=3,at)|0)|0;i=at;aI=U+4120|0;cj(b,as,O,aI)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=4,at)|0)|0;i=at;aJ=U+4128|0;cj(b,as,O,aJ)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=5,at)|0)|0;i=at;aK=U+4136|0;cj(b,as,O,aK)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=6,at)|0)|0;i=at;aL=U+4144|0;cj(b,as,O,aL)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=7,at)|0)|0;i=at;aM=U+4152|0;cj(b,as,O,aM)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=8,at)|0)|0;i=at;aN=U+4160|0;cj(b,as,O,aN)|0;aG(as|0,2664,(at=i,i=i+8|0,c[at>>2]=9,at)|0)|0;i=at;aO=U+4168|0;cj(b,as,O,aO)|0;aP=n|0;aG(aP|0,2640,(at=i,i=i+8|0,c[at>>2]=aE,at)|0)|0;i=at;aQ=o|0;aG(aQ|0,2560,(at=i,i=i+8|0,c[at>>2]=aE,at)|0)|0;i=at;aR=p|0;aG(aR|0,2544,(at=i,i=i+8|0,c[at>>2]=aE,at)|0)|0;i=at;aS=c[aq>>2]|0;switch(aS|0){case 7:{aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=0,at)|0)|0;i=at;cj(b,as,O,ap)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=1,at)|0)|0;i=at;cj(b,as,O,au)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=2,at)|0)|0;i=at;cj(b,as,O,aH)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=3,at)|0)|0;i=at;cj(b,as,O,aI)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=4,at)|0)|0;i=at;cj(b,as,O,aJ)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=5,at)|0)|0;i=at;cj(b,as,O,aK)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=6,at)|0)|0;i=at;cj(b,as,O,aL)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=7,at)|0)|0;i=at;cj(b,as,O,aM)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=8,at)|0)|0;i=at;cj(b,as,O,aN)|0;aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=aE,c[at+8>>2]=9,at)|0)|0;i=at;cj(b,as,O,aO)|0;am=209;break};case 1:case 4:case 14:case 16:case 15:case 17:{cj(b,aP,O,U+4104|0)|0;cj(b,aQ,O,U+4112|0)|0;am=209;break};case 2:{cj(b,aP,O,U+4104|0)|0;cj(b,aQ,O,U+4112|0)|0;aO=U+4120|0;if(+h[aO>>3]==0.0){h[aO>>3]=90.0}cj(b,aR,O,aO)|0;am=209;break};case 13:{aO=U+4104|0;if(+h[aO>>3]==0.0){h[aO>>3]=1.0}cj(b,aP,O,aO)|0;am=209;break};case 10:{aO=U+4104|0;if(+h[aO>>3]==0.0){h[aO>>3]=1.0}cj(b,aP,O,aO)|0;aO=U+4112|0;if(+h[aO>>3]==0.0){h[aO>>3]=1.0}cj(b,aQ,O,aO)|0;am=209;break};case 9:{aO=U+4104|0;if(+h[aO>>3]==0.0){h[aO>>3]=90.0}cj(b,aP,O,aO)|0;am=209;break};case 18:{cj(b,aP,O,U+4104|0)|0;am=209;break};default:{aT=aS}}if((am|0)==209){aT=c[aq>>2]|0}do{if((aT|0)==31){if((cE(b,V)|0)==0){aU=c[aq>>2]|0;am=214;break}else{a[U+3374|0]=65;a[U+3375|0]=78;a[U+3383|0]=65;a[U+3384|0]=78;c[aq>>2]=3;break}}else{aU=aT;am=214}}while(0);L296:do{if((am|0)==214){do{if((aU|0)==32){if((cL(b,V)|0)==0){aV=c[aq>>2]|0;break}else{a[U+3375|0]=78;a[U+3384|0]=78;c[aq>>2]=7;break L296}}else{aV=aU}}while(0);if((aV|0)!=33){break}a[U+3374|0]=65;a[U+3375|0]=78;a[U+3383|0]=65;a[U+3384|0]=78;c[aq>>2]=3}}while(0);if((c[an>>2]|0)>0){bB(b,V,O)}bC(V);eg(V,b);c[W>>2]=0;c[X>>2]=0;aw=cj(b,2512,O,Y)|0;aS=cj(b,2488,O,Z)|0;aP=cj(b,2472,O,$)|0;aO=cj(b,2456,O,aa)|0;do{if((c[an>>2]|0)==2){am=233}else{aQ=cb(b,2384)|0;if((aQ|0)==0){am=233;break}c[aq>>2]=30;aR=U+3467|0;a[aR]=a[2312]|0;a[aR+1|0]=a[2313|0]|0;a[aR+2|0]=a[2314|0]|0;a[aR+3|0]=a[2315|0]|0;a[aR+4|0]=a[2316|0]|0;a[aR+5|0]=a[2317|0]|0;aR=U+256|0;aN=0;while(1){aM=aN+1|0;aG(as|0,2296,(at=i,i=i+8|0,c[at>>2]=aM,at)|0)|0;i=at;aL=aR+(aN<<3)|0;h[aL>>3]=0.0;if((ck(aQ,as,aL)|0)!=0){c[W>>2]=aM}if((aM|0)<20){aN=aM}else{break}}aN=cb(b,2280)|0;aQ=U+416|0;aR=0;while(1){aM=aR+1|0;aG(as|0,2272,(at=i,i=i+8|0,c[at>>2]=aM,at)|0)|0;i=at;aL=aQ+(aR<<3)|0;h[aL>>3]=0.0;if((ck(aN,as,aL)|0)!=0){c[X>>2]=aM}if((aM|0)<20){aR=aM}else{break}}cC(+h[f>>3],+h[j>>3],V,z,B)|0;cC(+h[f>>3],+h[j>>3]+1.0,V,A,C)|0;aB=+h[C>>3]- +h[B>>3];aR=U+40|0;h[aR>>3]=aB;aN=U+32|0;h[aN>>3]=-0.0-aB;c[U+3312>>2]=1;bM(V);h[S>>3]=+h[ac>>3]*3.141592653589793/180.0;cC(+h[f>>3],+h[j>>3],V,z,B)|0;aB=+h[f>>3];aA=+h[S>>3];az=aB+ +Q(+aA);aB=+h[j>>3];cC(az,aB+ +R(+aA),V,A,C)|0;aA=-0.0- +bS(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);h[al>>3]=aA;h[aN>>3]=aA;aA=+h[f>>3];aB=+h[S>>3];az=aA+ +R(+aB);aA=+h[j>>3];cC(az,aA+ +Q(+aB),V,A,C)|0;aB=+bS(+h[z>>3],+h[B>>3],+h[A>>3],+h[C>>3]);h[U+768>>3]=aB;h[aR>>3]=aB;aR=U+56|0;h[aR>>3]=+h[Y>>3];h[U+64>>3]=+h[Z>>3];h[U+72>>3]=+h[$>>3];h[U+80>>3]=+h[aa>>3];c0(2,aR,U+88|0)|0}}while(0);L324:do{if((am|0)==233){if((aS|aw|aP|aO|0)!=0){c[F>>2]=1;bJ(V,Y);break}if((cj(b,2264,O,D)|0)==0){h[U+32>>3]=1.0;h[U+40>>3]=1.0;h[al>>3]=1.0;h[U+768>>3]=1.0;h[ac>>3]=0.0;c[F>>2]=0;bK(1800);break}cj(b,2256,O,E)|0;do{if(+h[D>>3]==0.0){am=239}else{if(+h[ae>>3]<=1.0){am=266;break}aB=+h[E>>3];if(aB==0.0){am=239}else{aW=aB}}}while(0);L335:do{if((am|0)==239){do{if((cb(b,2248)|0)==0){if((cb(b,2232)|0)!=0){break}if((cb(b,2216)|0)!=0){break}if((cb(b,2184)|0)!=0){break}if((cb(b,2088)|0)==0){am=266;break L335}}}while(0);h[y>>3]=0.0;ck(b,2248,y)|0;aB=+h[y>>3];if(aB==0.0){ck(b,2232,y)|0;aX=+h[y>>3]}else{aX=aB}if(aX!=0.0){if(+h[D>>3]==0.0){h[D>>3]=(-0.0-aX)/3600.0}aB=+h[E>>3];if(aB!=0.0){aW=aB;break}aB=aX/3600.0;h[E>>3]=aB;aW=aB;break}ck(b,2088,y)|0;aB=+h[y>>3];if(aB!=0.0){if(+h[D>>3]==0.0){h[D>>3]=(-0.0-aB)/3600.0}aB=+h[E>>3];if(aB!=0.0){aW=aB;break}ck(b,2072,y)|0;aB=+h[y>>3]/3600.0;h[E>>3]=aB;aW=aB;break}ck(b,2184,y)|0;aB=+h[y>>3];if(aB!=0.0){if(+h[D>>3]==0.0){h[D>>3]=(-0.0-aB)/3600.0}aB=+h[E>>3];if(aB!=0.0){aW=aB;break}ck(b,2040,y)|0;aB=+h[y>>3]/3600.0;h[E>>3]=aB;aW=aB;break}ck(b,2216,y)|0;aB=+h[y>>3];do{if(aB!=0.0){if(+h[D>>3]!=0.0){break}h[D>>3]=(-0.0-aB)/3600.0}}while(0);aB=+h[E>>3];if(aB!=0.0){aW=aB;break}ck(b,2024,y)|0;aB=+h[y>>3]/3600.0;h[E>>3]=aB;aW=aB}}while(0);if((am|0)==266){aW=+h[E>>3]}do{if(aW==0.0){if(+h[ae>>3]<=1.0){break}h[E>>3]=-0.0- +h[D>>3]}}while(0);h[U+776>>3]=1.0;h[U+784>>3]=1.0;ey(H|0,0,648);ey(ad|0,0,648);j=c[L>>2]|0;if((j|0)>0){f=0;do{h[G+((_(j,f)|0)+f<<3)>>3]=1.0;f=f+1|0;}while((f|0)<(j|0))}do{if((a[O]|0)==0){if((ck(b,2008,ab)|0)==0){break}j=c[L>>2]|0;if((j|0)>0){f=0;aR=0;aN=j;while(1){c[K>>2]=0;j=aR+1|0;if((aN|0)>0){aQ=0;aM=f;while(1){aL=G+(aM<<3)|0;h[aL>>3]=(aR|0)==(aQ|0)?1.0:0.0;aG(as|0,1992,(at=i,i=i+16|0,c[at>>2]=j,c[at+8>>2]=aQ+1,at)|0)|0;i=at;aK=aM+1|0;ck(b,as,aL)|0;aL=(c[K>>2]|0)+1|0;c[K>>2]=aL;aJ=c[L>>2]|0;if((aL|0)<(aJ|0)){aQ=aL;aM=aK}else{aY=aK;aZ=aJ;break}}}else{aY=f;aZ=aN}if((j|0)<(aZ|0)){f=aY;aR=j;aN=aZ}else{break}}}bL(V,+h[D>>3],+h[E>>3],ab);break L324}}while(0);if((cj(b,1976,O,ab)|0)==0){h[S>>3]=0.0;if((aE|0)==2){cj(b,1952,O,S)|0}else{cj(b,1928,O,S)|0}bG(V,+h[D>>3],+h[E>>3],+h[S>>3]);break}aN=c[L>>2]|0;if((aN|0)>0){aR=0;f=0;aM=aN;while(1){c[K>>2]=0;aN=f+1|0;if((aM|0)>0){aQ=0;aJ=aR;while(1){aK=G+(aJ<<3)|0;h[aK>>3]=(f|0)==(aQ|0)?1.0:0.0;aG(as|0,1960,(at=i,i=i+16|0,c[at>>2]=aN,c[at+8>>2]=aQ+1,at)|0)|0;i=at;aL=aJ+1|0;cj(b,as,O,aK)|0;aK=(c[K>>2]|0)+1|0;c[K>>2]=aK;aI=c[L>>2]|0;if((aK|0)<(aI|0)){aQ=aK;aJ=aL}else{a_=aL;a$=aI;break}}}else{a_=aR;a$=aM}if((aN|0)<(a$|0)){aR=a_;f=aN;aM=a$}else{break}}}bL(V,+h[D>>3],+h[E>>3],ab)}}while(0);do{if((c[aq>>2]|0)==3){if((c[af>>2]|0)!=2){break}aO=U+3168|0;aP=c[aO>>2]|0;if((aP|0)!=0){cS(aP);c[aO>>2]=0}aO=U+3172|0;aP=c[aO>>2]|0;if((aP|0)!=0){cS(aP);c[aO>>2]=0}c[U+1560>>2]=0;aO=U+1568|0;aP=U+4344|0;aw=0;do{h[aO+(aw<<3)>>3]=0.0;h[aP+(aw<<3)>>3]=0.0;aw=aw+1|0;}while((aw|0)<200);c[K>>2]=0;aw=0;aS=0;while(1){aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=1,c[at+8>>2]=aw,at)|0)|0;i=at;if((cj(b,as,O,aO+(c[K>>2]<<3)|0)|0)==0){aM=c[K>>2]|0;h[aO+(aM<<3)>>3]=0.0;a0=aS;a1=aM}else{a0=aS+1|0;a1=c[K>>2]|0}aM=a1+1|0;c[K>>2]=aM;if((aM|0)<100){aw=aM;aS=a0}else{break}}c[K>>2]=0;aS=0;aw=a0;while(1){aG(as|0,2528,(at=i,i=i+16|0,c[at>>2]=2,c[at+8>>2]=aS,at)|0)|0;i=at;if((cj(b,as,O,aO+((c[K>>2]|0)+100<<3)|0)|0)==0){aM=c[K>>2]|0;h[aO+(aM+100<<3)>>3]=0.0;a2=aw;a3=aM}else{a2=aw+1|0;a3=c[K>>2]|0}aM=a3+1|0;c[K>>2]=aM;if((aM|0)<100){aS=aM;aw=a2}else{break}}if((a2|0)<=0){break}aw=U+3948|0;aS=U+3944|0;aM=100;f=0;while(1){aB=+h[aO+(((c[aw>>2]|0)*100|0)+aM<<3)>>3];h[aP+(aM<<3)>>3]=aB;aA=+h[aO+(((c[aS>>2]|0)*100|0)+aM<<3)>>3];h[aP+(aM+100<<3)>>3]=aA;if((f|0)==0){a5=aB!=0.0|aA!=0.0?aM+1|0:0}else{a5=f}if((aM|0)>0){aM=aM-1|0;f=a5}else{break}}bA(V);c[N>>2]=0}}while(0);as=U+3467|0;if((aj(as|0,1784,6)|0)==0){am=311}else{if((aj(as|0,1712,5)|0)==0){am=311}}if((am|0)==311){c[U+3292>>2]=-1;c[U+3288>>2]=5}do{if((ck(b,1704,P)|0)==0){as=U+128|0;if((cl(b,1688,as)|0)==0){if((cl(b,1672,as)|0)!=0){break}if((ck(b,1640,as)|0)!=0){break}h[as>>3]=+h[U+120>>3];break}aq=l|0;co(b,1688,32,aq)|0;if((av(aq|0,84)|0)!=0){break}if((ck(b,1624,T)|0)!=0){h[as>>3]=+h[as>>3]+ +h[T>>3]/8765.812770744;break}if((ck(b,1608,T)|0)==0){break}h[as>>3]=+h[as>>3]+ +h[T>>3]/8765.812770744}else{h[U+128>>3]=(+h[P>>3]-15019.81352)/365.242198781+1900.0}}while(0);c[U+3312>>2]=1;aC=al}}while(0);c[U+3964>>2]=U+616;c[U+3972>>2]=aC;c[U+3968>>2]=ad;c[U+3284>>2]=1;c[U+3296>>2]=0;c[U+3328>>2]=0;bI(V);ag=V;i=e;return ag|0}function bx(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+88|0;f=e|0;g=e+16|0;if((d|0)==0){h=0;i=e;return h|0}j=eu(d|0)|0;k=ej(1,j+1|0)|0;if((j|0)>0){l=0;do{m=a[d+l|0]|0;if((m-97&255)<26){a[k+l|0]=m-32&255}else{a[k+l|0]=m}l=l+1|0;}while((l|0)<(j|0))}a[k+j|0]=0;if((eu(k|0)|0)==1){h=a[k]|0;i=e;return h|0}j=f|0;l=f;c[l>>2]=1314079575;c[l+4>>2]=4541761;a[f+8|0]=0;l=f+7|0;f=g|0;d=95;m=0;while(1){if((m|0)>0){n=m+64&255}else{n=0}a[l]=n;if((co(b,j,72,f)|0)==0){o=d}else{p=eu(f|0)|0;q=ej(1,p+1|0)|0;if((p|0)>0){r=0;do{s=a[g+r|0]|0;if((s-97&255)<26){a[q+r|0]=s-32&255}else{a[q+r|0]=s}r=r+1|0;}while((r|0)<(p|0))}a[q+p|0]=0;r=(a4(q|0,k|0)|0)==0?n:d;ek(q);o=r}r=m+1|0;if((r|0)<27){d=o;m=r}else{break}}ek(k);h=o;i=e;return h|0}function by(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;a[e]=0;ca(b,c)|0;c=bw(b,e)|0;i=d;return c|0}function bz(b){b=b|0;var c=0,d=0,e=0;c=i;i=i+8|0;d=c|0;a[d]=0;e=bw(b,d)|0;i=c;return e|0}function bA(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,P=0,Q=0,R=0,S=0,T=0,U=0;b=i;i=i+176|0;d=b|0;e=b+16|0;f=b+32|0;g=b+48|0;j=b+56|0;k=b+64|0;l=b+144|0;m=b+152|0;n=b+160|0;o=b+168|0;c[g>>2]=1;c[g+4>>2]=1;p=c[a+3944>>2]|0;q=c[a+3948>>2]|0;if((c[a+3316>>2]|0)!=2){i=b;return}r=a+3928|0;if((a4(r|0,5496)|0)!=0){i=b;return}do{if(+h[a+1568+((p*100|0|1)<<3)>>3]==0.0){if(+h[a+1568+((q*100|0|1)<<3)>>3]!=0.0){break}i=b;return}}while(0);s=a+9312|0;t=c[s>>2]|0;if((t|0)==0){h[l>>3]=0.0;h[m>>3]=0.0;h[n>>3]=+h[a+136>>3];h[o>>3]=+h[a+144>>3]}else{bQ(t,0.0,0.0,l,m);bQ(c[s>>2]|0,+h[a+136>>3],+h[a+144>>3],n,o)}if((p|0)==0){u=+h[l>>3];v=+h[m>>3];w=v;x=u;y=+h[o>>3]-v;z=+h[n>>3]-u}else{u=+h[m>>3];v=+h[l>>3];w=v;x=u;y=+h[n>>3]-v;z=+h[o>>3]-u}u=y/11.0;y=z/11.0;o=ej(288,8)|0;n=o;l=ej(144,8)|0;m=l;s=ej(144,8)|0;t=s;z=w+.5;A=f+(q<<3)|0;h[A>>3]=z;B=e+(q<<3)|0;h[B>>3]=z;z=x+.5;C=f+(p<<3)|0;h[C>>3]=z;D=e+(p<<3)|0;h[D>>3]=z;E=e|0;e=a+3956|0;F=d|0;G=d+(p<<3)|0;p=d+(q<<3)|0;q=a+4064|0;d=k|0;k=m;H=t;I=n;J=11;x=z;while(1){h[D>>3]=x;K=H+96|0;L=k;M=H;P=I;Q=11;while(1){if((c2(E,e,F)|0)!=0){aG(d|0,5448,(R=i,i=i+8|0,c[R>>2]=r,R)|0)|0;i=R;bK(d)}h[L>>3]=+h[G>>3];h[M>>3]=+h[p>>3];dl(q,+h[G>>3],+h[p>>3],P,P+8|0)|0;h[D>>3]=y+ +h[D>>3];if((Q|0)==0){break}else{L=L+8|0;M=M+8|0;P=P+16|0;Q=Q-1|0}}h[B>>3]=u+ +h[B>>3];if((J|0)==0){break}k=k+96|0;H=K;I=I+192|0;J=J-1|0;x=+h[C>>3]}J=f|0;c2(J,e,F)|0;h[G>>3]=+h[G>>3]+.0002777777777777778;c1(F,e,E)|0;x=+h[D>>3]- +h[C>>3];u=+h[B>>3]- +h[A>>3];y=+O(+(x*x+u*u))*3600.0;if(y==0.0){aG(d|0,5448,(R=i,i=i+8|0,c[R>>2]=r,R)|0)|0;i=R;bK(d)}u=.04/y;c[j>>2]=1;G=g;g=1;f=0;L600:while(1){if((g|0)>1){cS(f)}S=cT(G,2,j,1)|0;cU(S,n,m,0,144,0);I=m;H=n;k=143;while(1){y=+cR(S,H);if(+N(+(y- +h[I>>3]))>u){break}if((k|0)==0){T=437;break L600}else{I=I+8|0;H=H+16|0;k=k-1|0}}k=(c[j>>2]|0)+1|0;c[j>>2]=k;if((k|0)>9){T=439;break}else{g=k;f=S}}if((T|0)==439){bK(5384);c[a+1560>>2]=1}else if((T|0)==437){c[j>>2]=(c[j>>2]|0)+1}c[a+3168>>2]=S;c[a+5944>>2]=S;c2(J,e,F)|0;h[p>>3]=+h[p>>3]+.0002777777777777778;c1(F,e,E)|0;u=+h[D>>3]- +h[C>>3];y=+h[B>>3]- +h[A>>3];x=+O(+(u*u+y*y))*3600.0;if(x==0.0){aG(d|0,5448,(R=i,i=i+8|0,c[R>>2]=r,R)|0)|0;i=R;bK(d)}y=.04/x;c[j>>2]=1;d=1;R=S;L616:while(1){if((d|0)>1){cS(R)}U=cT(G,2,j,1)|0;cU(U,n,t,0,144,0);S=t;r=n;A=143;while(1){x=+cR(U,r);if(+N(+(x- +h[S>>3]))>y){break}if((A|0)==0){T=448;break L616}else{S=S+8|0;r=r+16|0;A=A-1|0}}A=(c[j>>2]|0)+1|0;c[j>>2]=A;if((A|0)>9){T=450;break}else{d=A;R=U}}if((T|0)==448){c[j>>2]=(c[j>>2]|0)+1}else if((T|0)==450){bK(5384);c[a+1560>>2]=1}c[a+3172>>2]=U;c[a+5948>>2]=U;ek(o);ek(l);ek(s);i=b;return}function bB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0;f=i;i=i+40|0;g=f|0;j=f+8|0;k=j|0;l=i;i=i+32|0;m=i;i=i+16|0;n=i;i=i+16|0;o=n|0;p=i;i=i+32|0;q=i;i=i+8|0;c[g>>2]=0;r=j;a[r]=0;j=l|0;a[j]=0;s=a[e]|0;t=n;if(s<<24>>24==0){c[o>>2]=1230328133;c[o+4>>2]=5787470;n=m|0;ev(n|0,5312,9)|0}else{n=s<<24>>24;aG(t|0,5368,(s=i,i=i+8|0,c[s>>2]=n,s)|0)|0;i=s;n=m|0;v=a[e]|0;aG(n|0,5336,(s=i,i=i+8|0,c[s>>2]=v,s)|0)|0;i=s}do{if((co(b,t,31,j)|0)==0){if((co(b,1224,31,j)|0)==0){break}c[o>>2]=1230328133;c[o+4>>2]=5787470}}while(0);o=m|0;do{if((co(b,o,31,r)|0)==0){if((co(b,5312,31,r)|0)==0){break}ev(o|0,5312,9)|0}}while(0);L643:do{switch(a[j]|0){case 74:{m=l+1|0;h[d+120>>3]=+ep(m);c[g>>2]=aR(m|0)|0;c[k>>2]=3492678;w=0;x=486;break};case 66:{m=l+1|0;h[d+120>>3]=+ep(m);c[g>>2]=~~+ep(m);c[k>>2]=3427142;w=0;x=486;break};default:{if((cd(b,t,g)|0)!=0){m=d+120|0;ck(b,t,m)|0;w=1;x=486;break L643}if((cd(b,1640,g)|0)!=0){if((c[g>>2]|0)==0){c[g>>2]=1950;h[d+120>>3]=1950.0;w=0;x=486;break L643}else{m=d+120|0;ck(b,1640,m)|0;w=1;x=486;break L643}}if((a[r]|0)==0){w=0;x=486;break L643}if((aj(r|0,1200,3)|0)==0){h[d+120>>3]=1950.0;c[g>>2]=1950;y=0;break L643}if((aj(r|0,5296,4)|0)==0){h[d+120>>3]=2.0e3;c[g>>2]=2e3;y=0;break L643}if((aj(r|0,1152,3)|0)==0){h[d+120>>3]=2.0e3;c[g>>2]=2e3;y=0;break L643}if((aj(r|0,5288,3)|0)==0){h[d+120>>3]=2.0e3;c[g>>2]=2e3;y=0;break L643}if((aj(r|0,5152,3)|0)!=0){w=0;x=486;break L643}h[d+120>>3]=2.0e3;c[g>>2]=2e3;y=0}}}while(0);do{if((x|0)==486){if((c[g>>2]|0)!=0){y=w;break}h[d+120>>3]=2.0e3;c[g>>2]=2e3;t=d+3449|0;if((aj(t|0,5896,2)|0)!=0){if((aj(t|0,3376,3)|0)!=0){y=w;break}}c[k>>2]=3492678;y=w}}while(0);w=d+128|0;do{if((cl(b,1688,w)|0)==0){if((cl(b,1672,w)|0)!=0){x=499;break}if((ck(b,1640,w)|0)!=0){x=499;break}z=+h[d+120>>3];h[w>>3]=z;A=z}else{k=p|0;co(b,1688,32,k)|0;if((av(k|0,84)|0)!=0){x=499;break}if((ck(b,1624,q)|0)!=0){z=+h[w>>3]+ +h[q>>3]/8765.812770744;h[w>>3]=z;A=z;break}if((ck(b,1608,q)|0)==0){x=499;break}z=+h[w>>3]+ +h[q>>3]/8765.812770744;h[w>>3]=z;A=z}}while(0);if((x|0)==499){A=+h[w>>3]}if(A==0.0){h[w>>3]=+h[d+120>>3]}do{if((a[r]|0)==0){co(b,o,31,r)|0;if((a[r]|0)!=0){x=504;break}if((c[d+3884>>2]|0)==7){break}w=d+3764|0;if((c[g>>2]|0)>1980){u=3492678;a[w]=u&255;u=u>>8;a[w+1|0]=u&255;u=u>>8;a[w+2|0]=u&255;u=u>>8;a[w+3|0]=u&255;break}else{u=3427142;a[w]=u&255;u=u>>8;a[w+1|0]=u&255;u=u>>8;a[w+2|0]=u&255;u=u>>8;a[w+3|0]=u&255;break}}else{x=504}}while(0);do{if((x|0)==504){o=d+3764|0;ew(o|0,r|0)|0;if((y|0)!=0){break}if((aj(o|0,1200,3)|0)==0){h[d+120>>3]=1950.0;break}if((aj(o|0,1152,3)|0)==0){h[d+120>>3]=2.0e3;break}if((aj(o|0,5296,4)|0)==0){h[d+120>>3]=2.0e3;break}if((aj(o|0,5288,3)|0)!=0){break}if((c[g>>2]|0)!=0){break}h[d+120>>3]=2.0e3}}while(0);switch(a[d+3449|0]|0){case 71:{g=d+3764|0;ev(g|0,5120,9)|0;B=g;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return};case 69:{g=d+3764|0;ev(g|0,5096,9)|0;B=g;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return};case 83:{g=d+3764|0;ev(g|0,5080,9)|0;B=g;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return};case 72:{g=d+3764|0;ev(g|0,5064,9)|0;B=g;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return};case 65:{g=d+3764|0;a[g]=a[5056]|0;a[g+1|0]=a[5057|0]|0;a[g+2|0]=a[5058|0]|0;a[g+3|0]=a[5059|0]|0;a[g+4|0]=a[5060|0]|0;a[g+5|0]=a[5061|0]|0;B=g;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return};case 76:{g=d+3764|0;a[g]=a[1784]|0;a[g+1|0]=a[1785|0]|0;a[g+2|0]=a[1786|0]|0;a[g+3|0]=a[1787|0]|0;a[g+4|0]=a[1788|0]|0;a[g+5|0]=a[1789|0]|0;a[g+6|0]=a[1790|0]|0;B=g;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return};default:{B=d+3764|0;C=bY(B)|0;D=d+3884|0;c[D>>2]=C;i=f;return}}}function bC(b){b=b|0;var d=0,e=0,f=0,g=0,i=0;d=b+3764|0;e=c[b+3260>>2]|0;if((a[d]|0)==0){f=e;g=536}else{if((e|0)==0){f=0;g=536}else{i=e}}if((g|0)==536){a[d]=a[1784]|0;a[d+1|0]=a[1785|0]|0;a[d+2|0]=a[1786|0]|0;a[d+3|0]=a[1787|0]|0;a[d+4|0]=a[1788|0]|0;a[d+5|0]=a[1789|0]|0;a[d+6|0]=a[1790|0]|0;i=f}if((i|0)==-1){a[d]=a[1712]|0;a[d+1|0]=a[1713|0]|0;a[d+2|0]=a[1714|0]|0;a[d+3|0]=a[1715|0]|0;a[d+4|0]=a[1716|0]|0;a[d+5|0]=a[1717|0]|0}i=bY(d)|0;c[b+3884>>2]=i;do{if((i|0)==2){f=b+3796|0;u=3427142;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255}else{f=b+3796|0;if((i|0)==1){g=f;u=3492678;a[g]=u&255;u=u>>8;a[g+1|0]=u&255;u=u>>8;a[g+2|0]=u&255;u=u>>8;a[g+3|0]=u&255;break}else{ew(f|0,d|0)|0;break}}}while(0);c[b+3888>>2]=bY(b+3796|0)|0;i=b+120|0;h[b+3872>>3]=+h[i>>3];f=b+3828|0;ew(f|0,d|0)|0;c[b+3880>>2]=bY(f)|0;h[b+3864>>3]=+h[i>>3];return}function bD(a){a=a|0;var b=0,d=0;if((a|0)==0){return}if((c[a+3312>>2]|0)==0){ek(a);return}b=a+9312|0;d=c[b>>2]|0;if((d|0)!=0){bD(d);c[b>>2]=0}bE(a);b=c[a+9320>>2]|0;if((b|0)!=0){ek(b)}b=c[a+3980>>2]|0;if((b|0)!=0){ek(b)}b=c[a+3976>>2]|0;if((b|0)!=0){ek(b)}b=c[a+3168>>2]|0;if((b|0)!=0){cS(b)}b=c[a+3172>>2]|0;if((b|0)!=0){cS(b)}ek(a);return}function bE(a){a=a|0;var b=0;b=c[1578]|0;if((b|0)!=0){ek(b);c[1578]=0}b=c[1579]|0;if((b|0)!=0){ek(b);c[1579]=0}b=c[1580]|0;if((b|0)!=0){ek(b);c[1580]=0}b=c[1581]|0;if((b|0)!=0){ek(b);c[1581]=0}b=c[1582]|0;if((b|0)!=0){ek(b);c[1582]=0}b=c[1583]|0;if((b|0)!=0){ek(b);c[1583]=0}b=c[1584]|0;if((b|0)!=0){ek(b);c[1584]=0}b=c[1585]|0;if((b|0)!=0){ek(b);c[1585]=0}b=c[1586]|0;if((b|0)!=0){ek(b);c[1586]=0}b=c[1587]|0;if((b|0)!=0){ek(b);c[1587]=0}if((a|0)==0){return}if((c[a+3312>>2]|0)==0){return}b=c[a+9208>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9212>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9216>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9220>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9224>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9228>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9232>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9236>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9240>>2]|0;if((b|0)!=0){ek(b)}b=c[a+9244>>2]|0;if((b|0)==0){return}ek(b);return}function bF(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0;f=i;i=i+136|0;g=f|0;h=g;c[g>>2]=5130572;c[g+4>>2]=5265985;c[g+8>>2]=5266003;c[g+12>>2]=5128532;c[g+16>>2]=5130579;c[g+20>>2]=4674643;c[g+24>>2]=4411969;c[g+28>>2]=5132378;c[g+32>>2]=4277594;c[g+36>>2]=5392705;c[g+40>>2]=5265731;c[g+44>>2]=5390659;c[g+48>>2]=5391693;c[g+52>>2]=4277571;c[g+56>>2]=5263171;c[g+60>>2]=4476739;c[g+64>>2]=4542275;c[g+68>>2]=5197635;c[g+72>>2]=5132098;c[g+76>>2]=5194576;c[g+80>>2]=4998739;c[g+84>>2]=5390672;c[g+88>>2]=5523777;c[g+92>>2]=5001037;c[g+96>>2]=4412227;c[g+100>>2]=4412241;c[g+104>>2]=4412244;c[g+108>>2]=5260110;c[g+112>>2]=5459015;c[g+116>>2]=5460804;c[g+120>>2]=5524560;c[g+124>>2]=5787220;c[g+128>>2]=5787738;c[g+132>>2]=5656660;if((aj(d|0,2736,4)|0)==0){g=d;u=1313819736;a[g]=u&255;u=u>>8;a[g+1|0]=u&255;u=u>>8;a[g+2|0]=u&255;u=u>>8;a[g+3|0]=u&255}g=b+3368|0;ew(g|0,d|0)|0;j=b+3449|0;ew(j|0,d|0)|0;k=b+3467|0;ew(k|0,d|0)|0;L845:do{if((aj(d|0,2656,6)|0)==0){c[b+3260>>2]=0}else{if((aj(d|0,2632,6)|0)==0){c[b+3260>>2]=-1;break}if((cp(d,2552)|0)!=0){c[b+3260>>2]=-1;break}l=a[d]|0;L854:do{switch(l<<24>>24){case 82:case 68:case 65:{break};default:{if((a[d+1|0]|0)==76){break L854}c[b+3260>>2]=0;i=f;return 0}}}while(0);a[j]=l;a[b+3450|0]=a[d+1|0]|0;m=a[d+2|0]|0;n=b+3451|0;do{if(m<<24>>24==45){a[n]=0;o=3}else{a[n]=m;p=a[d+3|0]|0;q=b+3452|0;if(p<<24>>24==45){a[q]=0;o=4;break}else{a[q]=p;a[b+3453|0]=0;o=4;break}}}while(0);m=((a[d+o|0]|0)==45)+o|0;n=m+((a[d+m|0]|0)==45)|0;m=n+((a[d+n|0]|0)==45)|0;n=m+((a[d+m|0]|0)==45)|0;a[k]=a[d+n|0]|0;a[b+3468|0]=a[d+(n+1)|0]|0;a[b+3469|0]=a[d+(n+2)|0]|0;a[b+3470|0]=0;aG(g|0,2536,(r=i,i=i+16|0,c[r>>2]=j,c[r+8>>2]=k,r)|0)|0;i=r;if((a[g]|0)==32){a[g]=45}n=b+3369|0;if((a[n]|0)==32){a[n]=45}n=b+3370|0;if((a[n]|0)==32){a[n]=45}n=b+3371|0;if((a[n]|0)==32){a[n]=45}n=b+3372|0;if((a[n]|0)==32){a[n]=45}n=b+3373|0;if((a[n]|0)==32){a[n]=45}n=b+3374|0;if((a[n]|0)==32){a[n]=45}m=b+3375|0;if((a[m]|0)==32){a[m]=45}l=b+3260|0;c[l>>2]=0;p=1;q=0;while(1){if((aj(k|0,h+(p<<2)|0,3)|0)==0){c[l>>2]=p;s=p}else{s=q}t=p+1|0;if((t|0)<34){p=t;q=s}else{break}}q=b+3324|0;switch(c[q>>2]|0){case 0:{c[q>>2]=3;break L845;break};case 1:{c[q>>2]=2;break};case 2:{break};default:{break L845}}switch(s|0){case 31:{a[n]=65;a[m]=78;c[l>>2]=3;break L845;break};case 32:{a[n]=80;a[m]=78;c[l>>2]=7;break L845;break};default:{break L845}}}}while(0);do{if((aj(e|0,2520,4)|0)==0){a[e]=a[d]|0;s=e+1|0;a[s]=a[2504]|0;a[s+1|0]=a[2505|0]|0;a[s+2|0]=a[2506|0]|0;c[b+3264>>2]=90;s=b+3764|0;a[s]=a[2480]|0;a[s+1|0]=a[2481|0]|0;a[s+2|0]=a[2482|0]|0;a[s+3|0]=a[2483|0]|0;a[s+4|0]=a[2484|0]|0;a[s+5|0]=a[2485|0]|0;c[b+3884>>2]=7}else{if((aj(e|0,2464,4)|0)==0){a[e]=a[d]|0;s=e+1|0;a[s]=a[2504]|0;a[s+1|0]=a[2505|0]|0;a[s+2|0]=a[2506|0]|0;c[b+3264>>2]=-90;s=b+3764|0;u=4280403;a[s]=u&255;u=u>>8;a[s+1|0]=u&255;u=u>>8;a[s+2|0]=u&255;u=u>>8;a[s+3|0]=u&255;c[b+3884>>2]=8;break}else{c[b+3264>>2]=0;break}}}while(0);s=b+3377|0;ew(s|0,e|0)|0;h=b+3458|0;ew(h|0,e|0)|0;L911:do{if((aj(e|0,2656,6)|0)==0){c[b+3260>>2]=0}else{if((aj(e|0,2632,6)|0)==0){c[b+3260>>2]=-1;break}g=a[e]|0;L917:do{switch(g<<24>>24){case 82:case 68:case 65:{break};default:{if((a[e+1|0]|0)==76){break L917}c[b+3260>>2]=0;break L911}}}while(0);a[h]=g;l=e+1|0;a[b+3459|0]=a[l]|0;m=a[e+2|0]|0;n=b+3460|0;do{if(m<<24>>24==45){a[n]=0;v=3}else{a[n]=m;j=a[e+3|0]|0;o=b+3461|0;if(j<<24>>24==45){a[o]=0;v=4;break}else{a[o]=j;a[b+3462|0]=0;v=4;break}}}while(0);m=((a[e+v|0]|0)==45)+v|0;n=m+((a[e+m|0]|0)==45)|0;m=n+((a[e+n|0]|0)==45)|0;n=m+((a[e+m|0]|0)==45)|0;a[k]=a[e+n|0]|0;a[b+3468|0]=a[e+(n+1)|0]|0;a[b+3469|0]=a[e+(n+2)|0]|0;a[b+3470|0]=0;do{if((aj(d|0,5768,3)|0)==0){w=658}else{if((aj(d+1|0,2504,3)|0)==0){w=658;break}c[b+3304>>2]=0}}while(0);if((w|0)==658){c[b+3304>>2]=1}do{if((a[l]|0)==76){w=662}else{if((a[e]|0)==65){w=662;break}c[b+3292>>2]=0;c[b+3288>>2]=3}}while(0);if((w|0)==662){c[b+3292>>2]=1;c[b+3288>>2]=5}aG(s|0,2536,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=k,r)|0)|0;i=r;if((a[s]|0)==32){a[s]=45}l=b+3378|0;if((a[l]|0)==32){a[l]=45}l=b+3379|0;if((a[l]|0)==32){a[l]=45}l=b+3380|0;if((a[l]|0)==32){a[l]=45}l=b+3381|0;if((a[l]|0)==32){a[l]=45}l=b+3382|0;if((a[l]|0)==32){a[l]=45}l=b+3383|0;if((a[l]|0)==32){a[l]=45}l=b+3384|0;if((a[l]|0)!=32){break}a[l]=45}}while(0);eh(b,d);i=f;return 0}function bG(a,b,d,e){a=a|0;b=+b;d=+d;e=+e;var f=0,g=0,i=0,j=0,k=0.0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0;f=c[a+3316>>2]|0;g=(f|0)>2?2:f;i=a+760|0;h[i>>3]=b;j=a+768|0;k=d!=0.0?d:b;h[j>>3]=k;h[a+32>>3]=b;h[a+40>>3]=k;if((g|0)>0){l=(f|0)<2?f:2;f=a+832|0;m=0;while(1){n=f;o=0;while(1){h[n>>3]=(m|0)==(o|0)?1.0:0.0;p=o+1|0;if((p|0)<(g|0)){n=n+8|0;o=p}else{break}}o=m+1|0;if((o|0)<(g|0)){f=f+(l<<3)|0;m=o}else{break}}}c[a+3300>>2]=0;m=a+48|0;if(e<0.0){q=e+360.0}else{q=e}if(q<360.0){r=q}else{r=q+-360.0}h[m>>3]=r;q=r*3.141592653589793/180.0;r=+Q(+q);if(b*d>0.0){s=-0.0-q}else{s=q}q=+R(+s);s=+h[i>>3];l=a+56|0;h[l>>3]=r*s;d=+h[j>>3];b=+N(+d);if(s<0.0){h[a+64>>3]=q*(-0.0-b)}else{h[a+64>>3]=q*b}b=+N(+s);if(d<0.0){h[a+72>>3]=q*b}else{h[a+72>>3]=q*(-0.0-b)}h[a+80>>3]=r*d;c0(2,l,a+88|0)|0;bW(a);d=+h[i>>3];i=d<0.0;if((c[a+3304>>2]|0)!=0){do{if(i){if(+h[j>>3]<=0.0){break}c[a+3256>>2]=1;r=+h[m>>3];b=r+-90.0;l=a+3200|0;if(b<-180.0){h[l>>3]=b+360.0;h[a+3208>>3]=r;h[a+3216>>3]=b+360.0;return}else{h[l>>3]=b;h[a+3208>>3]=r;h[a+3216>>3]=b;return}}}while(0);do{if(d>0.0){if(+h[j>>3]<0.0){c[a+3256>>2]=1;b=+h[m>>3];r=b+90.0;if(r>180.0){t=r+-360.0}else{t=r}h[a+3200>>3]=t;h[a+3208>>3]=b;r=b+-90.0;l=a+3216|0;h[l>>3]=r;if(r>=-180.0){return}h[l>>3]=r+360.0;return}else{if(+h[j>>3]<=0.0){break}c[a+3256>>2]=0;r=+h[m>>3]+90.0;l=a+3200|0;if(r>180.0){b=r+-360.0;h[l>>3]=b;h[a+3208>>3]=b;h[a+3216>>3]=r+-360.0;return}else{h[l>>3]=r;h[a+3208>>3]=r;h[a+3216>>3]=r;return}}}}while(0);if(!i){return}if(+h[j>>3]>=0.0){return}c[a+3256>>2]=0;t=+h[m>>3];r=t+-90.0;if(r<-180.0){u=r+360.0}else{u=r}h[a+3200>>3]=u;h[a+3208>>3]=u;u=t+90.0;l=a+3216|0;h[l>>3]=u;if(u<=180.0){return}h[l>>3]=u+-360.0;return}do{if(i){if(+h[j>>3]<=0.0){break}c[a+3256>>2]=0;u=+h[m>>3];h[a+3200>>3]=u;t=u+90.0;if(t>180.0){v=t+-360.0}else{v=t}h[a+3208>>3]=v;t=u+180.0;l=a+3216|0;h[l>>3]=t;if(t<=180.0){return}h[l>>3]=t+-360.0;return}}while(0);do{if(d>0.0){if(+h[j>>3]>=0.0){if(+h[j>>3]<=0.0){break}c[a+3256>>2]=1;v=+h[m>>3];h[a+3200>>3]=-0.0-v;t=90.0-v;if(t>180.0){w=t+-360.0}else{w=t}h[a+3208>>3]=w;h[a+3216>>3]=v;return}c[a+3256>>2]=0;v=+h[m>>3]+180.0;if(v>180.0){x=v+-360.0}else{x=v}h[a+3200>>3]=x;v=x+90.0;if(v>180.0){y=v+-360.0}else{y=v}h[a+3208>>3]=y;v=x+180.0;l=a+3216|0;h[l>>3]=v;if(v<=180.0){return}h[l>>3]=v+-360.0;return}}while(0);if(!i){return}if(+h[j>>3]>=0.0){return}c[a+3256>>2]=1;x=+h[m>>3];y=x+180.0;if(y>180.0){z=y+-360.0}else{z=y}h[a+3200>>3]=z;y=z+90.0;if(y>180.0){A=y+-360.0}else{A=y}h[a+3208>>3]=A;A=x+90.0;m=a+3216|0;h[m>>3]=A;if(A<=180.0){return}h[m>>3]=A+-360.0;return}function bH(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0,m=0.0,n=0;e=i;if((b|0)==0){i=e;return}f=b+3312|0;if((c[f>>2]|0)==0){i=e;return}do{if((d|0)==0){g=790}else{if((a[d]|0)==0){g=790;break}if((a4(d|0,1680)|0)==0){g=790;break}if((a4(d|0,1664)|0)==0){g=790;break}j=bY(d)|0;if((j|0)<0){i=e;return}k=c[b+3884>>2]|0;if((j|0)!=(k|0)&(k-5|0)>>>0<2){i=e;return}else{k=b+3796|0;ew(k|0,d|0)|0;h[b+3872>>3]=+bZ(d);l=j;break}}}while(0);L1100:do{if((g|0)==790){d=c[b+3884>>2]|0;j=b+3796|0;k=b+3764|0;ew(j|0,k|0)|0;m=+h[b+120>>3];h[b+3872>>3]=m;switch(d|0){case 2:{if(m==1950.0){a[j]=a[1616]|0;a[j+1|0]=a[1617|0]|0;a[j+2|0]=a[1618|0]|0;a[j+3|0]=a[1619|0]|0;a[j+4|0]=a[1620|0]|0;a[j+5|0]=a[1621|0]|0;l=2;break L1100}a[j]=66;aG(b+3797|0,1632,(n=i,i=i+8|0,h[n>>3]=m,n)|0)|0;i=n;k=(eu(j|0)|0)-1+(b+3796)|0;if((a[k]|0)==48){a[k]=0}k=(eu(j|0)|0)-1+(b+3796)|0;if((a[k]|0)==48){a[k]=0}k=(eu(j|0)|0)-1+(b+3796)|0;if((a[k]|0)!=48){l=2;break L1100}a[k]=0;l=2;break L1100;break};case 1:{if(m==2.0e3){a[j]=a[1600]|0;a[j+1|0]=a[1601|0]|0;a[j+2|0]=a[1602|0]|0;a[j+3|0]=a[1603|0]|0;a[j+4|0]=a[1604|0]|0;a[j+5|0]=a[1605|0]|0;l=1;break L1100}a[j]=74;aG(b+3797|0,1632,(n=i,i=i+8|0,h[n>>3]=m,n)|0)|0;i=n;k=(eu(j|0)|0)-1+(b+3796)|0;if((a[k]|0)==48){a[k]=0}k=(eu(j|0)|0)-1+(b+3796)|0;if((a[k]|0)==48){a[k]=0}k=(eu(j|0)|0)-1+(b+3796)|0;if((a[k]|0)!=48){l=1;break L1100}a[k]=0;l=1;break L1100;break};default:{l=d;break L1100}}}}while(0);c[b+3888>>2]=l;if((c[f>>2]|0)==0){i=e;return}switch(l|0){case 3:case 4:case 9:{c[b+3292>>2]=1;c[b+3288>>2]=5;i=e;return};case 5:{c[b+3292>>2]=1;c[b+3288>>2]=5;i=e;return};case 7:case 8:{c[b+3292>>2]=1;c[b+3288>>2]=5;i=e;return};default:{c[b+3292>>2]=0;c[b+3288>>2]=3;i=e;return}}}function bI(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;i=i+16|0;if((b|0)==0){i=d;return}e=b+3312|0;if((c[e>>2]|0)==0){i=d;return}f=d|0;g=0;L1145:while(1){if((g|0)==0){ev(f|0,5864,12)|0}else{aG(f|0,5832,(h=i,i=i+8|0,c[h>>2]=g,h)|0)|0;i=h}h=c[6312+(g<<2)>>2]|0;L1151:do{if((h|0)==0){j=aQ(f|0)|0;if((j|0)!=0){if((c[e>>2]|0)==0){break}k=eu(j|0)|0;if((k|0)<=0){break}l=b+9208+(g<<2)|0;m=c[l>>2]|0;if((m|0)!=0){ek(m)}m=ej(k+2|0,1)|0;c[l>>2]=m;if((m|0)==0){break}else{n=0;o=m}do{m=a[j+n|0]|0;a[o+n|0]=m<<24>>24==95?32:m;n=n+1|0;o=c[l>>2]|0}while((n|0)<(k|0));a[o+k|0]=0;break}L1173:do{switch(g|0){case 1:{if((c[e>>2]|0)==0){break L1173}l=b+9212|0;j=c[l>>2]|0;if((j|0)!=0){ek(j)}j=ej(13,1)|0;c[l>>2]=j;if((j|0)==0){break L1151}a[j]=115;a[j+1|0]=117;a[j+2|0]=97;a[j+3|0]=50;a[j+4|0]=32;a[j+5|0]=45;a[j+6|0]=97;a[j+7|0]=104;a[j+8|0]=32;a[j+9|0]=37;a[j+10|0]=115;a[j+11|0]=0;break L1151;break};case 2:{if((c[e>>2]|0)==0){break L1173}j=b+9216|0;l=c[j>>2]|0;if((l|0)!=0){ek(l)}l=ej(13,1)|0;c[j>>2]=l;if((l|0)==0){break L1151}a[l]=115;a[l+1|0]=103;a[l+2|0]=115;a[l+3|0]=99;a[l+4|0]=32;a[l+5|0]=45;a[l+6|0]=97;a[l+7|0]=104;a[l+8|0]=32;a[l+9|0]=37;a[l+10|0]=115;a[l+11|0]=0;break L1151;break};case 3:{if((c[e>>2]|0)==0){break L1173}l=b+9220|0;j=c[l>>2]|0;if((j|0)!=0){ek(j)}j=ej(13,1)|0;c[l>>2]=j;if((j|0)==0){break L1151}a[j]=115;a[j+1|0]=116;a[j+2|0]=121;a[j+3|0]=50;a[j+4|0]=32;a[j+5|0]=45;a[j+6|0]=97;a[j+7|0]=104;a[j+8|0]=32;a[j+9|0]=37;a[j+10|0]=115;a[j+11|0]=0;break L1151;break};case 4:{if((c[e>>2]|0)==0){break L1173}j=b+9224|0;l=c[j>>2]|0;if((l|0)!=0){ek(l)}l=ej(13,1)|0;c[j>>2]=l;if((l|0)==0){break L1151}a[l]=115;a[l+1|0]=112;a[l+2|0]=112;a[l+3|0]=109;a[l+4|0]=32;a[l+5|0]=45;a[l+6|0]=97;a[l+7|0]=104;a[l+8|0]=32;a[l+9|0]=37;a[l+10|0]=115;a[l+11|0]=0;break L1151;break};case 5:{if((c[e>>2]|0)==0){break L1173}l=b+9228|0;j=c[l>>2]|0;if((j|0)!=0){ek(j)}j=ej(13,1)|0;c[l>>2]=j;if((j|0)==0){break L1151}a[j]=115;a[j+1|0]=115;a[j+2|0]=97;a[j+3|0]=111;a[j+4|0]=32;a[j+5|0]=45;a[j+6|0]=97;a[j+7|0]=104;a[j+8|0]=32;a[j+9|0]=37;a[j+10|0]=115;a[j+11|0]=0;break L1151;break};default:{c[b+9208+(g<<2)>>2]=0;break L1151}}}while(0);g=g+1|0;continue L1145}else{if((c[e>>2]|0)==0){break}k=eu(h|0)|0;if((k|0)<=0){break}j=b+9208+(g<<2)|0;l=c[j>>2]|0;if((l|0)!=0){ek(l)}l=ej(k+2|0,1)|0;c[j>>2]=l;if((l|0)==0){break}else{p=0;q=l}do{l=a[h+p|0]|0;a[q+p|0]=l<<24>>24==95?32:l;p=p+1|0;q=c[j>>2]|0}while((p|0)<(k|0));a[q+k|0]=0}}while(0);g=g+1|0;if((g|0)>=10){break}}i=d;return}function bJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,i=0.0,j=0.0;if((b|0)==0){return}c[a+3300>>2]=1;d=a+56|0;h[d>>3]=+h[b>>3];e=b+8|0;h[a+64>>3]=+h[e>>3];f=b+16|0;h[a+72>>3]=+h[f>>3];g=b+24|0;h[a+80>>3]=+h[g>>3];c0(2,d,a+88|0)|0;i=+h[b>>3];j=+h[f>>3];b=a+32|0;h[b>>3]=+O(+(i*i+j*j));j=+h[e>>3];i=+h[g>>3];g=a+40|0;h[g>>3]=+O(+(j*j+i*i));if((c[a+3304>>2]|0)!=0){i=+h[e>>3];h[e>>3]=-0.0- +h[f>>3];h[f>>3]=-0.0-i}bW(a);c[a+3312>>2]=1;bM(a);h[a+760>>3]=+h[b>>3];h[a+768>>3]=+h[g>>3];return}function bK(a){a=a|0;ew(6232|0,a|0)|0;return}function bL(a,b,d,e){a=a|0;b=+b;d=+d;e=e|0;var f=0,g=0,i=0,j=0,k=0.0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if((e|0)==0){return}f=a+3316|0;g=c[f>>2]|0;if((g-1|0)>>>0>8){i=c[a+3320>>2]|0;c[f>>2]=i;j=i}else{j=g}g=a+760|0;h[g>>3]=b;i=a+768|0;k=d!=0.0?d:b;h[i>>3]=k;h[a+32>>3]=b;h[a+40>>3]=k;do{if((j|0)>0){f=a+832|0;l=e;m=0;while(1){n=l+(j<<3)|0;o=f;p=l;q=0;while(1){h[o>>3]=+h[p>>3];r=q+1|0;if((r|0)<(j|0)){o=o+8|0;p=p+8|0;q=r}else{break}}q=m+1|0;if((q|0)<(j|0)){f=f+(j<<3)|0;l=n;m=q}else{break}}k=+h[g>>3];m=a+56|0;h[m>>3]=+h[e>>3]*k;if((j|0)<=1){s=m;t=899;break}h[a+64>>3]=+h[e+8>>3]*k;k=+h[i>>3];h[a+72>>3]=+h[e+(j<<3)>>3]*k;h[a+80>>3]=+h[e+(j+1<<3)>>3]*k;u=m}else{m=a+56|0;h[m>>3]=+h[e>>3]*b;s=m;t=899}}while(0);if((t|0)==899){ey(a+64|0,0,16);h[a+80>>3]=1.0;u=s}c0(2,u,a+88|0)|0;c[a+3300>>2]=1;c$(a+3956|0)|0;c[a+3312>>2]=1;bM(a);return}function bM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0,r=0.0,s=0.0,t=0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0;b=i;i=i+56|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;j=b+32|0;k=b+40|0;l=b+48|0;do{if(+h[a+136>>3]>=1.5){if(+h[a+144>>3]<1.5){break}if((c[a+3884>>2]|0)==6){i=b;return}m=a+32|0;h[m>>3]=+N(+(+h[m>>3]));n=a+40|0;h[n>>3]=+N(+(+h[n>>3]));o=+h[a+16>>3];p=+h[a+24>>3];bQ(a,o,p,e,f);q=a+3304|0;r=+h[e>>3];if((c[q>>2]|0)==0){s=+h[f>>3];t=a+3828|0;bU(a,r+ +h[m>>3],s,t,j,l,d);bU(a,r,s+ +h[n>>3],t,g,k,d)}else{s=+h[f>>3];t=a+3828|0;bU(a,r+ +h[n>>3],s,t,j,l,d);bU(a,r,s+ +h[m>>3],t,g,k,d)}s=+W(+(+h[k>>3]-p),+(+h[g>>3]-o))*180.0/3.141592653589793;if(s<-90.0){u=s+360.0}else{u=s}h[a+3208>>3]=u;s=+W(+(+h[l>>3]-p),+(+h[j>>3]-o))*180.0/3.141592653589793;if(s<-90.0){v=s+360.0}else{v=s}h[a+3216>>3]=v;if(u<-90.0){s=u+270.0;h[a+3200>>3]=s;w=s}else{s=u+-90.0;h[a+3200>>3]=s;w=s}t=(c[q>>2]|0)==0;do{if(t){h[a+48>>3]=w;x=w}else{s=w+90.0;q=a+48|0;h[q>>3]=s;if(s>=0.0){x=s;break}o=s+360.0;h[q>>3]=o;x=o}}while(0);q=a+48|0;if(x<0.0){o=x+360.0;h[q>>3]=o;y=o}else{y=x}if(y>=360.0){h[q>>3]=y+-360.0}q=a+3256|0;o=v-u;z=o<280.0&o>260.0?1:o<-80.0&o>-100.0&1;c[q>>2]=z;o=u-v;if(o>80.0&o<100.0){c[q>>2]=1;A=1}else{A=(z|0)!=0}if(t){if(A){i=b;return}h[m>>3]=-0.0- +h[m>>3];i=b;return}else{if(!A){i=b;return}h[n>>3]=-0.0- +h[n>>3];i=b;return}}}while(0);v=+h[a+48>>3];h[a+3200>>3]=v;h[a+3208>>3]=v+90.0;h[a+3216>>3]=v+180.0;i=b;return}function bN(a){a=a|0;var b=0;if((a|0)==0){b=0}else{b=(c[a+3312>>2]|0)!=0}return(b?a+3796|0:0)|0}function bO(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((a|0)==0){d=0;return d|0}if((c[a+3312>>2]|0)==0){d=0;return d|0}e=a+3292|0;f=c[e>>2]|0;c[e>>2]=b;do{if((b|0)==1&(f|0)==0){e=a+3288|0;if((c[e>>2]|0)!=3){break}c[e>>2]=6}}while(0);if(!((b|0)==0&(f|0)==1)){d=f;return d|0}f=a+3288|0;if((c[f>>2]|0)!=5){d=1;return d|0}c[f>>2]=3;d=1;return d|0}function bP(a){a=a|0;var b=0;if((a|0)==0){b=0}else{b=(c[a+3312>>2]|0)!=0}return(b?a+3764|0:0)|0}function bQ(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0,z=0.0;g=i;i=i+144|0;j=g|0;k=g+32|0;l=g+64|0;m=g+96|0;n=g+104|0;o=g+112|0;p=g+120|0;q=g+128|0;r=g+136|0;if((a|0)==0){i=g;return}if((c[a+3312>>2]|0)==0){i=g;return}h[a+576>>3]=b;h[a+584>>3]=d;h[a+592>>3]=+h[1];s=a+3308|0;c[s>>2]=0;t=c[a+9312>>2]|0;if((t|0)==0){d7(a,b,d,o,p)}else{bQ(t,b,d,o,p)}t=a+3260|0;u=c[t>>2]|0;L1323:do{switch(u|0){case 29:{if((cO(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=984;break L1323}c[s>>2]=1;w=0.0;x=0.0;break};case 30:{if((cC(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=984;break L1323}c[s>>2]=1;w=0.0;x=0.0;break};case 31:{if((cF(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=984;break L1323}c[s>>2]=1;w=0.0;x=0.0;break};case 32:{if((cM(+h[o>>3],+h[p>>3],a,q,r)|0)==0){v=984;break L1323}c[s>>2]=1;w=0.0;x=0.0;break};default:{d=+h[o>>3];b=+h[p>>3];if((c[a+3324>>2]|0)==2|(u|0)<1){if((cA(d,b,a,q,r)|0)==0){v=984;break L1323}c[s>>2]=1;w=0.0;x=0.0;break L1323}h[q>>3]=0.0;h[r>>3]=0.0;y=l|0;h[y>>3]=d;h[l+8>>3]=b;if((u-24|0)>>>0<3){h[l+16>>3]=+((c[1622]|0)+1|0)}else{h[l+16>>3]=+h[1]}h[l+24>>3]=1.0;ey(k|0,0,32);if((c_(a+3368|0,a+3924|0,y,a+3956|0,k|0,a+4064|0,m,n,a+688|0,a+3984|0,j|0)|0)==0){h[q>>3]=+h[j+(c[a+3944>>2]<<3)>>3];h[r>>3]=+h[j+(c[a+3948>>2]<<3)>>3];v=984;break L1323}else{c[s>>2]=1;w=0.0;x=0.0;break L1323}}}}while(0);do{if((v|0)==984){if((c[s>>2]|0)!=0){w=0.0;x=0.0;break}if((c[t>>2]|0)>0){bX(c[a+3884>>2]|0,c[a+3888>>2]|0,+h[a+120>>3],+h[a+3872>>3],q,r,+h[a+128>>3])}switch(c[a+3264>>2]|0){case 90:{b=90.0- +h[r>>3];h[r>>3]=b;z=b;break};case-90:{b=+h[r>>3]+-90.0;h[r>>3]=b;z=b;break};default:{z=+h[r>>3]}}b=+h[q>>3];h[a+600>>3]=b;h[a+608>>3]=z;w=z;x=b}}while(0);h[e>>3]=x;h[f>>3]=w;f=c[a+3888>>2]|0;if((f|0)<1){i=g;return}switch(f|0){case 10:case 6:{i=g;return};default:{}}w=+h[e>>3];if(w<0.0){h[e>>3]=w+360.0;i=g;return}if(w<=360.0){i=g;return}h[e>>3]=w+-360.0;i=g;return}function bR(b,d,e,f,g){b=b|0;d=+d;e=+e;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;j=i;i=i+80|0;k=j|0;l=j+8|0;m=j+16|0;n=j+48|0;do{if((b|0)!=0){if((c[b+3312>>2]|0)==0){break}bQ(b,d,e,k,l);if((c[b+3308>>2]|0)!=0){o=f;p=o|0;u=543581775;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;p=o+4|0;u=7364973;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;q=1;i=j;return q|0}L1378:do{switch(c[b+3292>>2]|0){case 0:{p=b+3288|0;o=c[p>>2]|0;r=(o<<1)+18|0;if((r|0)>=(g|0)){if((c[b+3296>>2]|0)==0){et(f|0,1264,g|0)|0;s=0;break L1378}else{et(f|0,1304,g|0)|0;s=0;break L1378}}t=m|0;v=+h[k>>3];if(((c[b+3888>>2]|0)-1|0)>>>0<2){cs(t,32,v,o);ct(n|0,32,+h[l>>3],(c[p>>2]|0)-1|0)}else{ct(t,32,v,o);ct(n|0,32,+h[l>>3],c[p>>2]|0)}p=n|0;if((c[b+3296>>2]|0)==0){aG(f|0,1432,(w=i,i=i+16|0,c[w>>2]=t,c[w+8>>2]=p,w)|0)|0;i=w}else{aG(f|0,1456,(w=i,i=i+16|0,c[w>>2]=t,c[w+8>>2]=p,w)|0)|0;i=w}s=g-r|0;break};case 1:{r=b+3288|0;p=c[r>>2]|0;t=(p<<1)+9|0;if((t|0)>=(g|0)){if((c[b+3296>>2]|0)==0){et(f|0,1344,g|0)|0;s=0;break L1378}else{et(f|0,1384,g|0)|0;s=0;break L1378}}o=m|0;cu(o,32,+h[k>>3],p);p=n|0;cu(p,32,+h[l>>3],c[r>>2]|0);if((c[b+3296>>2]|0)==0){aG(f|0,1432,(w=i,i=i+16|0,c[w>>2]=o,c[w+8>>2]=p,w)|0)|0;i=w}else{aG(f|0,1456,(w=i,i=i+16|0,c[w>>2]=o,c[w+8>>2]=p,w)|0)|0;i=w}s=g-t|0;break};default:{s=g}}}while(0);switch(c[b+3888>>2]|0){case 4:{if((s|0)<=9){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}t=(c[b+3296>>2]|0)==0;p=f+(eu(f|0)|0)|0;if(t){ev(p|0,1136,10)|0;q=1;i=j;return q|0}else{ev(p|0,1184,10)|0;q=1;i=j;return q|0}break};case 3:{if((s|0)<=9){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}p=(c[b+3296>>2]|0)==0;t=f+(eu(f|0)|0)|0;if(p){ev(t|0,1208,10)|0;q=1;i=j;return q|0}else{ev(t|0,1232,10)|0;q=1;i=j;return q|0}break};case 7:{if((s|0)<=7){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}t=(c[b+3296>>2]|0)==0;p=f+(eu(f|0)|0)|0;if(t){ev(p|0,840,10)|0;q=1;i=j;return q|0}else{ev(p|0,864,10)|0;q=1;i=j;return q|0}break};case 9:{if((s|0)<=9){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}p=(c[b+3296>>2]|0)==0;t=f+(eu(f|0)|0)|0;if(p){p=t|0;u=1634496544;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;p=t+4|0;u=7628142;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;q=1;i=j;return q|0}else{p=t|0;u=1634496521;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;p=t+4|0;u=7628142;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;q=1;i=j;return q|0}break};case 5:{if((s|0)<=7){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}p=(c[b+3296>>2]|0)==0;t=f+(eu(f|0)|0)|0;if(p){p=t|0;u=1953259808;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;p=t+4|0;u=8020269;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;q=1;i=j;return q|0}else{p=t|0;u=1953259785;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;p=t+4|0;u=8020269;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;q=1;i=j;return q|0}break};case 8:{if((s|0)<=7){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}p=(c[b+3296>>2]|0)==0;t=f+(eu(f|0)|0)|0;if(p){ev(t|0,6136,10)|0;q=1;i=j;return q|0}else{ev(t|0,6160,10)|0;q=1;i=j;return q|0}break};case 2:case 1:{t=b+3796|0;if((s|0)<=((eu(t|0)|0)+1|0)){q=1;i=j;return q|0}if((c[b+3284>>2]|0)==0){q=1;i=j;return q|0}p=(c[b+3296>>2]|0)==0;o=f+(eu(f|0)|0)|0;u=p?32:9;a[o]=u&255;u=u>>8;a[o+1|0]=u&255;ex(f|0,t|0)|0;q=1;i=j;return q|0};default:{t=m|0;o=b+3288|0;cv(t,+h[k>>3],0,c[o>>2]|0);p=n|0;cv(p,+h[l>>3],0,c[o>>2]|0);o=eu(t|0)|0;r=o+1+(eu(p|0)|0)|0;x=b+3476|0;y=b+3508|0;z=(eu(x|0)|0)+2+(eu(y|0)|0)|0;A=b+3884|0;do{if((c[A>>2]|0)==6){if((c[b+3328>>2]|0)!=1){B=r;break}C=z+r|0;if((s|0)<=(C|0)){B=r;break}if((a[x]|0)!=0){D=m+o|0;u=32;a[D]=u&255;u=u>>8;a[D+1|0]=u&255;ex(t|0,x|0)|0}if((a[y]|0)==0){B=C;break}D=n+(eu(p|0)|0)|0;u=32;a[D]=u&255;u=u>>8;a[D+1|0]=u&255;ex(p|0,y|0)|0;B=C}else{B=r}}while(0);r=(c[b+3296>>2]|0)!=0;do{if((s|0)>(B|0)){if(r){aG(f|0,1456,(w=i,i=i+16|0,c[w>>2]=t,c[w+8>>2]=p,w)|0)|0;i=w;break}else{aG(f|0,1432,(w=i,i=i+16|0,c[w>>2]=t,c[w+8>>2]=p,w)|0)|0;i=w;break}}else{if(r){et(f|0,5992,s|0)|0;break}else{et(f|0,1344,s|0)|0;break}}}while(0);if((c[A>>2]|0)!=6){q=1;i=j;return q|0}r=b+3328|0;if((c[r>>2]|0)==1){q=1;i=j;return q|0}do{if((s|0)>(B+7|0)){p=f+(eu(f|0)|0)|0;t=p|0;u=1852402720;a[t]=u&255;u=u>>8;a[t+1|0]=u&255;u=u>>8;a[t+2|0]=u&255;u=u>>8;a[t+3|0]=u&255;t=p+4|0;u=7496037;a[t]=u&255;u=u>>8;a[t+1|0]=u&255;u=u>>8;a[t+2|0]=u&255;u=u>>8;a[t+3|0]=u&255;if((c[A>>2]|0)==6){break}else{q=1}i=j;return q|0}}while(0);if((c[r>>2]|0)!=2){q=1;i=j;return q|0}if((s|0)<=(z+7+B|0)){q=1;i=j;return q|0}if((a[x]|0)!=0){A=f+(eu(f|0)|0)|0;u=32;a[A]=u&255;u=u>>8;a[A+1|0]=u&255;ex(f|0,x|0)|0}if((a[y]|0)==0){q=1;i=j;return q|0}A=f+(eu(f|0)|0)|0;u=32;a[A]=u&255;u=u>>8;a[A+1|0]=u&255;ex(f|0,y|0)|0;q=1;i=j;return q|0}}}}while(0);if((g|0)<=0){q=0;i=j;return q|0}a[f]=0;q=0;i=j;return q|0}function bS(a,b,c,d){a=+a;b=+b;c=+c;d=+d;var e=0,f=0,g=0,j=0,k=0;e=i;i=i+48|0;f=e|0;g=e+24|0;j=f|0;b9(a,b,1.0,j);k=g|0;b9(c,d,1.0,k);d=+h[j>>3]- +h[k>>3];c=+h[f+8>>3]- +h[g+8>>3];b=+h[f+16>>3]- +h[g+16>>3];a=(d*d+0.0+c*c+b*b)*.25;b=a>1.0?1.0:a;a=+O(+b);c=+W(+a,+(+O(+(1.0-b))))*2.0*180.0/3.141592653589793;i=e;return+c}function bT(){return c[1556]|0}function bU(a,b,d,e,f,g,j){a=a|0;b=+b;d=+d;e=e|0;f=f|0;g=g|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0.0,t=0,u=0.0,v=0.0;k=i;i=i+32|0;l=k|0;m=k+8|0;n=k+16|0;o=k+24|0;if((a|0)==0){i=k;return}if((c[a+3312>>2]|0)==0){i=k;return}c[j>>2]=0;h[l>>3]=b;h[m>>3]=d;switch(c[a+3264>>2]|0){case 90:{h[m>>3]=90.0-d;break};case-90:{h[m>>3]=d+-90.0;break};default:{}}if((e|0)==0){p=c[a+3884>>2]|0;q=+h[a+120>>3]}else{r=bY(e)|0;p=r;q=+bZ(e)}h[a+592>>3]=1.0;L1552:do{if((p|0)>0){switch(p|0){case 10:case 6:{break L1552;break};default:{}}bX(p,c[a+3884>>2]|0,q,+h[a+120>>3],l,m,+h[a+128>>3])}}while(0);p=c[a+3260>>2]|0;L1556:do{switch(p|0){case 29:{if((cP(+h[l>>3],+h[m>>3],a,n,o)|0)==0){break L1556}c[j>>2]=1;break};case 30:{if((cD(+h[l>>3],+h[m>>3],a,n,o)|0)==0){break L1556}c[j>>2]=1;break};case 31:{if((cG(+h[l>>3],+h[m>>3],a,n,o)|0)==0){break L1556}c[j>>2]=1;break};case 32:{if((cN(+h[l>>3],+h[m>>3],a,n,o)|0)==0){break L1556}c[j>>2]=1;break};default:{q=+h[l>>3];s=+h[m>>3];if((c[a+3324>>2]|0)==2|(p|0)<1){if((cB(q,s,a,n,o)|0)==0){break L1556}c[j>>2]=1;break L1556}else{if((bV(q,s,a,n,o)|0)==0){break L1556}c[j>>2]=1;break L1556}}}}while(0);p=c[a+9312>>2]|0;s=+h[n>>3];q=+h[o>>3];L1572:do{if((p|0)==0){d6(a,s,q,f,g);o=c[j>>2]|0;if((o|0)!=0){t=o;break}u=+h[f>>3];do{if(u>=.5){v=+h[g>>3];if(v<.5){break}if(u<=+h[a+136>>3]+.5){if(v<=+h[a+144>>3]+.5){t=0;break L1572}}c[j>>2]=2;t=2;break L1572}}while(0);c[j>>2]=2;t=2}else{bU(p,s,q,0,f,g,j);t=c[j>>2]|0}}while(0);c[a+3308>>2]=t;h[a+600>>3]=b;h[a+608>>3]=d;h[a+576>>3]=+h[f>>3];h[a+584>>3]=+h[g>>3];i=k;return}function bV(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+112|0;j=g|0;k=g+32|0;l=g+64|0;m=g+96|0;n=g+104|0;h[e>>3]=0.0;h[f>>3]=0.0;o=d+3924|0;do{if((c[o>>2]|0)==137){p=d+3368|0}else{q=d+3368|0;if((cY(c[d+3960>>2]|0,q,o)|0)==0){p=q;break}else{r=1}i=g;return r|0}}while(0);ey(j|0,0,32);h[j+(c[d+3944>>2]<<3)>>3]=a;h[j+(c[d+3948>>2]<<3)>>3]=b;q=l|0;s=l+16|0;ey(l|0,0,16);h[s>>3]=1.0;h[l+24>>3]=1.0;ey(k|0,0,16);h[k+16>>3]=1.0;h[k+24>>3]=1.0;t=cZ(p,o,j|0,d+688|0,d+3984|0,m,n,d+4064|0,k|0,d+3956|0,q)|0;if((t|0)!=0){r=t;i=g;return r|0}h[e>>3]=+h[q>>3];h[f>>3]=+h[l+8>>3];b=+h[s>>3];if(((c[d+3260>>2]|0)-24|0)>>>0<3){h[d+592>>3]=b+-1.0;r=0;i=g;return r|0}else{h[d+592>>3]=b;r=0;i=g;return r|0}return 0}function bW(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,i=0,j=0;b=a+3316|0;d=c[b>>2]|0;e=(d|0)>2?2:d;if((e-1|0)>>>0>8){d=c[a+3320>>2]|0;c[b>>2]=d;f=d}else{f=e}e=_(f<<3,f)|0;d=a+3976|0;b=c[d>>2]|0;do{if((b|0)==0){g=ei(e)|0;i=g;c[d>>2]=i;if((g|0)!=0){j=i;break}return}else{j=b}}while(0);b=a+3980|0;do{if((c[b>>2]|0)==0){i=ei(e)|0;c[b>>2]=i;if((i|0)!=0){break}return}}while(0);e=a+3956|0;c[e>>2]=137;switch(f|0){case 3:{h[j>>3]=0.0;h[(c[d>>2]|0)+8>>3]=0.0;h[(c[d>>2]|0)+16>>3]=0.0;h[(c[d>>2]|0)+24>>3]=0.0;h[(c[d>>2]|0)+32>>3]=0.0;h[(c[d>>2]|0)+40>>3]=0.0;h[(c[d>>2]|0)+48>>3]=0.0;h[(c[d>>2]|0)+56>>3]=0.0;h[(c[d>>2]|0)+64>>3]=0.0;h[c[d>>2]>>3]=+h[a+56>>3];h[(c[d>>2]|0)+8>>3]=+h[a+64>>3];h[(c[d>>2]|0)+24>>3]=+h[a+72>>3];h[(c[d>>2]|0)+32>>3]=+h[a+80>>3];h[(c[d>>2]|0)+64>>3]=1.0;break};case 2:{h[j>>3]=+h[a+56>>3];h[(c[d>>2]|0)+8>>3]=+h[a+64>>3];h[(c[d>>2]|0)+16>>3]=+h[a+72>>3];h[(c[d>>2]|0)+24>>3]=+h[a+80>>3];break};case 4:{h[j>>3]=0.0;h[(c[d>>2]|0)+8>>3]=0.0;h[(c[d>>2]|0)+16>>3]=0.0;h[(c[d>>2]|0)+24>>3]=0.0;h[(c[d>>2]|0)+32>>3]=0.0;h[(c[d>>2]|0)+40>>3]=0.0;h[(c[d>>2]|0)+48>>3]=0.0;h[(c[d>>2]|0)+56>>3]=0.0;h[(c[d>>2]|0)+64>>3]=0.0;h[(c[d>>2]|0)+72>>3]=0.0;h[(c[d>>2]|0)+80>>3]=0.0;h[(c[d>>2]|0)+88>>3]=0.0;h[(c[d>>2]|0)+96>>3]=0.0;h[(c[d>>2]|0)+104>>3]=0.0;h[(c[d>>2]|0)+112>>3]=0.0;h[(c[d>>2]|0)+120>>3]=0.0;h[c[d>>2]>>3]=+h[a+56>>3];h[(c[d>>2]|0)+8>>3]=+h[a+64>>3];h[(c[d>>2]|0)+32>>3]=+h[a+72>>3];h[(c[d>>2]|0)+40>>3]=+h[a+80>>3];h[(c[d>>2]|0)+80>>3]=1.0;h[(c[d>>2]|0)+120>>3]=1.0;break};default:{}}c0(f,c[d>>2]|0,c[b>>2]|0)|0;c[a+3964>>2]=a+616;c[a+3972>>2]=a+760;c[a+3968>>2]=a+832;c[e>>2]=137;return}function bX(a,b,c,d,e,f,g){a=a|0;b=b|0;c=+c;d=+d;e=e|0;f=f|0;g=+g;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0.0,R=0.0,S=0,T=0,U=0,V=0.0;j=i;i=i+256|0;k=j|0;l=j+8|0;m=j+16|0;n=j+24|0;o=j+32|0;p=j+40|0;q=j+48|0;r=j+56|0;s=j+64|0;t=j+72|0;u=j+80|0;v=j+88|0;w=j+96|0;x=j+104|0;y=j+112|0;z=j+120|0;A=j+128|0;B=j+136|0;C=j+144|0;D=j+152|0;E=j+160|0;F=j+168|0;G=j+176|0;H=j+184|0;I=j+192|0;J=j+200|0;K=j+208|0;L=j+216|0;M=j+224|0;N=j+232|0;O=j+240|0;P=j+248|0;if(c==0.0){Q=(a|0)==2?1950.0:2.0e3}else{Q=c}if(d==0.0){R=(b|0)==2?1950.0:2.0e3}else{R=d}S=(b|0)==11;T=(a|0)==1&S&Q==2.0e3;d=T?Q:(a|0)==11&S?Q:R;S=T?b:a;a=(b|0)==1;T=(S|0)==11&a&d==2.0e3;R=T?d:Q;U=T?b:S;if((U|0)==(b|0)&R==d){i=j;return}S=R!=d;do{if(S){if((U|0)==2&R!=1950.0){b6(R,1950.0,e,f)}if(!((U|0)==1&R!=2.0e3)){break}b7(R,2.0e3,e,f)}}while(0);T=(b|0)==2;L1634:do{if(T){switch(U|0){case 3:{b1(e,f);break L1634;break};case 1:{if(g>0.0){h[O>>3]=0.0;h[P>>3]=0.0;h[M>>3]=0.0;h[N>>3]=0.0;b_(e,f,O,P,M,N);R=g+-1950.0;h[e>>3]=+h[e>>3]+R*+h[O>>3];h[f>>3]=+h[f>>3]+R*+h[P>>3];break L1634}else{h[K>>3]=0.0;h[L>>3]=0.0;h[I>>3]=0.0;h[J>>3]=0.0;b_(e,f,K,L,I,J);break L1634}break};case 4:{if(g>0.0){b5(e,f,g);h[G>>3]=0.0;h[H>>3]=0.0;h[E>>3]=0.0;h[F>>3]=0.0;b_(e,f,G,H,E,F);R=g+-1950.0;h[e>>3]=+h[e>>3]+R*+h[G>>3];h[f>>3]=+h[f>>3]+R*+h[H>>3];break L1634}else{b5(e,f,1950.0);h[C>>3]=0.0;h[D>>3]=0.0;h[A>>3]=0.0;h[B>>3]=0.0;b_(e,f,C,D,A,B);h[e>>3]=+h[e>>3]+ +h[C>>3]*0.0;h[f>>3]=+h[f>>3]+ +h[D>>3]*0.0;break L1634}break};default:{break L1634}}}else{switch(b|0){case 3:{switch(U|0){case 1:{b2(e,f);break L1634;break};case 4:{if(g>0.0){b5(e,f,g)}else{b5(e,f,2.0e3)}b2(e,f);break L1634;break};case 2:{b0(e,f);break L1634;break};default:{break L1634}}break};case 1:{switch(U|0){case 2:{if(g>0.0){h[y>>3]=0.0;h[z>>3]=0.0;h[w>>3]=0.0;h[x>>3]=0.0;b$(e,f,y,z,w,x);R=g+-2.0e3;h[e>>3]=+h[e>>3]+R*+h[y>>3];h[f>>3]=+h[f>>3]+R*+h[z>>3];break L1634}else{h[u>>3]=0.0;h[v>>3]=0.0;h[s>>3]=0.0;h[t>>3]=0.0;b$(e,f,u,v,s,t);break L1634}break};case 3:{b3(e,f);break L1634;break};case 4:{if(g>0.0){b5(e,f,g);break L1634}else{b5(e,f,2.0e3);break L1634}break};default:{break L1634}}break};case 4:{switch(U|0){case 2:{if(g>0.0){h[q>>3]=0.0;h[r>>3]=0.0;h[o>>3]=0.0;h[p>>3]=0.0;b$(e,f,q,r,o,p);R=g+-2.0e3;h[e>>3]=+h[e>>3]+R*+h[q>>3];h[f>>3]=+h[f>>3]+R*+h[r>>3];b4(e,f,g);break L1634}else{h[m>>3]=0.0;h[n>>3]=0.0;h[k>>3]=0.0;h[l>>3]=0.0;b$(e,f,m,n,k,l);h[e>>3]=+h[e>>3]+ +h[m>>3]*-50.0;h[f>>3]=+h[f>>3]+ +h[n>>3]*-50.0;b4(e,f,1950.0);break L1634}break};case 1:{if(g>0.0){b4(e,f,g);break L1634}else{b4(e,f,2.0e3);break L1634}break};case 3:{b3(e,f);if(g>0.0){b4(e,f,g);break L1634}else{b4(e,f,2.0e3);break L1634}break};default:{break L1634}}break};default:{break L1634}}}}while(0);do{if(S){if(T&d!=1950.0){b6(1950.0,d,e,f)}if(!(a&d!=2.0e3)){break}b7(2.0e3,d,e,f)}}while(0);d=+h[f>>3];do{if(d>90.0){h[f>>3]=180.0-d;g=+h[e>>3]+180.0;h[e>>3]=g;V=g}else{if(d<-90.0){h[f>>3]=-180.0-d;g=+h[e>>3]+180.0;h[e>>3]=g;V=g;break}else{V=+h[e>>3];break}}}while(0);if(V>360.0){h[e>>3]=V+-360.0;i=j;return}if(V>=0.0){i=j;return}h[e>>3]=V+360.0;i=j;return}function bY(b){b=b|0;var c=0,d=0,e=0.0;c=a[b]|0;L1706:do{switch(c<<24>>24){case 74:case 106:{d=1;break};default:{if((a4(b|0,4024)|0)==0){d=1;break L1706}if((a4(b|0,5304)|0)==0){d=1;break L1706}if((a4(b|0,4008)|0)==0){d=1;break L1706}if((a4(b|0,3016)|0)==0){d=1;break L1706}if((aj(b|0,2728,3)|0)==0){d=1;break L1706}if((aj(b|0,2448,3)|0)==0){d=1;break L1706}switch(c<<24>>24){case 66:case 98:{d=2;break L1706;break};default:{}}if((a4(b|0,2208)|0)==0){d=2;break L1706}if((a4(b|0,1944)|0)==0){d=2;break L1706}if((aj(b|0,1592,3)|0)==0){d=2;break L1706}if((aj(b|0,1176,3)|0)==0){d=2;break L1706}switch(c<<24>>24){case 71:case 103:{d=3;break L1706;break};case 69:case 101:{d=4;break L1706;break};case 65:case 97:{d=5;break L1706;break};case 78:case 110:{d=7;break L1706;break};case 76:case 108:{d=6;break L1706;break};case 73:case 105:{d=11;break L1706;break};default:{if((er(b|0,6120,5)|0)==0){d=10;break L1706}switch(c<<24>>24){case 80:case 112:{d=9;break L1706;break};default:{}}if((cf(b)|0)==0){d=-1;break L1706}e=+ep(b);if(e>1980.0){d=1;break L1706}d=e>1900.0?2:-1;break L1706}}}}}while(0);return d|0}function bZ(b){b=b|0;var c=0,d=0.0;c=a[b]|0;L1732:do{switch(c<<24>>24){case 74:case 106:case 66:case 98:{d=+ep(b+1|0);break};default:{if((aj(b|0,1592,3)|0)==0){d=1950.0;break L1732}if((aj(b|0,1176,3)|0)==0){d=1950.0;break L1732}if((aj(b|0,2728,3)|0)==0){d=2.0e3;break L1732}if((aj(b|0,2448,3)|0)==0){d=2.0e3;break L1732}if((aj(b|0,4008,4)|0)==0){d=2.0e3;break L1732}if((aj(b|0,3016,4)|0)==0){d=2.0e3;break L1732}if((c-49&255)>=2){d=0.0;break L1732}d=+ep(b)}}}while(0);return+d}function b_(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0;g=i;i=i+48|0;j=g|0;k=+h[a>>3]*3.141592653589793/180.0;l=+h[b>>3]*3.141592653589793/180.0;m=+h[c>>3]*36.0e4;n=+h[d>>3]*36.0e4;o=+R(+k);p=+Q(+k);k=+R(+l);q=+Q(+l);l=p*q;r=o*q;if(m!=0.0|n!=0.0){s=-0.0-m*r-n*p*k;t=m*l-n*o*k;u=n*q}else{s=0.0;t=0.0;u=0.0}v=0;do{h[j+(v<<3)>>3]=+h[264+(v*48|0)>>3]*l+0.0+ +h[272+(v*48|0)>>3]*r+ +h[280+(v*48|0)>>3]*k+ +h[288+(v*48|0)>>3]*s+ +h[296+(v*48|0)>>3]*t+ +h[304+(v*48|0)>>3]*u;v=v+1|0;}while((v|0)<6);u=+h[j>>3];t=+h[j+8>>3];s=+h[j+16>>3];k=+O(+(u*u+t*t+s*s));r=u*-162557.0e-11+t*-3.1919e-7+s*-1.3843e-7;l=u*r;q=u+k*-162557.0e-11-l;o=t*r;p=t+k*-3.1919e-7-o;w=s*r;r=s+k*-1.3843e-7-w;k=+O(+(r*r+(q*q+p*p)));p=u*.001245+t*-.00158+s*-659.0e-6;q=u+k*-162557.0e-11-l;l=t+k*-3.1919e-7-o;o=s+k*-1.3843e-7-w;w=+h[j+24>>3]+k*.001245-p*q;s=k*-.00158+ +h[j+32>>3]-p*l;t=k*-659.0e-6+ +h[j+40>>3]-p*o;p=q*q+l*l;u=+O(+p);do{if(q==0.0&l==0.0){x=0.0}else{r=+W(+l,+q);if(r>=0.0){x=r;break}x=r+6.283185307179586}}while(0);r=+W(+o,+u);if(u>1.0e-30){y=(q*s-l*w)/p;z=(t*p-o*(q*w+l*s))/(u*(o*o+p))}else{y=m;z=n}n=+h[e>>3];if(n<=1.0e-30){A=x*180.0;B=A/3.141592653589793;h[a>>3]=B;C=r*180.0;D=C/3.141592653589793;h[b>>3]=D;E=y/36.0e4;h[c>>3]=E;F=z/36.0e4;h[d>>3]=F;i=g;return}h[f>>3]=(o*t+(q*w+l*s))/(k*n*21.095);h[e>>3]=+h[e>>3]/k;A=x*180.0;B=A/3.141592653589793;h[a>>3]=B;C=r*180.0;D=C/3.141592653589793;h[b>>3]=D;E=y/36.0e4;h[c>>3]=E;F=z/36.0e4;h[d>>3]=F;i=g;return}function b$(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0;g=i;i=i+48|0;j=g|0;k=+h[a>>3]*3.141592653589793/180.0;l=+h[b>>3]*3.141592653589793/180.0;m=+h[c>>3]*36.0e4;n=+h[d>>3]*36.0e4;o=+R(+k);p=+Q(+k);k=+R(+l);q=+Q(+l);l=p*q;r=o*q;s=+h[f>>3];t=+h[e>>3];u=s*21.095*t;if(m!=0.0|n!=0.0){v=1311}else{if(s!=0.0&t!=0.0){v=1311}else{w=-.001245;x=.00158;y=659.0e-6}}if((v|0)==1311){w=m*q*(-0.0-o)-n*p*k+u*l+-.001245;x=m*l-n*o*k+u*r+.00158;y=n*q+u*k+659.0e-6}u=l*-162557.0e-11+r*-3.1919e-7+k*-1.3843e-7;q=u*l+(l+162557.0e-11);o=u*r+(r+3.1919e-7);p=u*k+(k+1.3843e-7);u=l*.001245+r*-.00158+k*-659.0e-6;s=w+u*l;l=x+u*r;r=y+u*k;v=0;do{h[j+(v<<3)>>3]=+h[552+(v*48|0)>>3]*q+0.0+ +h[560+(v*48|0)>>3]*o+ +h[568+(v*48|0)>>3]*p+ +h[576+(v*48|0)>>3]*s+ +h[584+(v*48|0)>>3]*l+ +h[592+(v*48|0)>>3]*r;v=v+1|0;}while((v|0)<6);r=+h[j>>3];l=+h[j+8>>3];s=+h[j+16>>3];p=+h[j+24>>3];o=+h[j+32>>3];q=+h[j+40>>3];k=r*r+l*l;u=+O(+k);y=k+s*s;x=+O(+y);w=r*p+l*o;z=w+s*q;do{if(r==0.0&l==0.0){A=0.0}else{B=+W(+l,+r);if(B>=0.0){A=B;break}A=B+6.283185307179586}}while(0);B=+W(+s,+u);if(u>1.0e-30){C=(r*o-l*p)/k;D=(k*q-s*w)/(y*u)}else{C=m;D=n}if(t<=1.0e-30){E=A*180.0;F=E/3.141592653589793;h[a>>3]=F;G=B*180.0;H=G/3.141592653589793;h[b>>3]=H;I=C/36.0e4;h[c>>3]=I;J=D/36.0e4;h[d>>3]=J;i=g;return}h[f>>3]=z/(x*t*21.095);h[e>>3]=+h[e>>3]/x;E=A*180.0;F=E/3.141592653589793;h[a>>3]=F;G=B*180.0;H=G/3.141592653589793;h[b>>3]=H;I=C/36.0e4;h[c>>3]=I;J=D/36.0e4;h[d>>3]=J;i=g;return}function b0(b,d){b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,u=0,v=0,w=0,x=0;e=i;f=+h[b>>3];g=+h[d>>3];j=f*3.141592653589793/180.0;k=g*3.141592653589793/180.0;l=+Q(+j);n=+Q(+k);o=l*n;l=n*+R(+j);j=+R(+k);k=o*-.066988739415+l*-.872755765852+j*-.483538914632;n=o*.492728466075+l*-.45034695802+j*.744584633283;p=+W(+n,+k);if(p<0.0){q=p+6.283185307179586}else{q=p}if(q>6.283185307179586){r=q-6.283185307179586}else{r=q}q=r*180.0/3.141592653589793;r=+W(+(o*-.867600811151+l*-.188374601723+j*.460199784784),+(+O(+(k*k+n*n))))*180.0/3.141592653589793;h[b>>3]=q;h[d>>3]=r;if((c[2126]|0)==0){i=e;return}n=f/15.0;d=~~n;f=(n- +(d|0))*60.0;b=~~f;if(g<0.0){s=45;t=-0.0-g}else{s=43;t=g}u=~~t;g=(t- +(u|0))*60.0;v=~~g;w=ei(32)|0;aG(w|0,3040,(x=i,i=i+56|0,c[x>>2]=d,c[x+8>>2]=b,h[x+16>>3]=(f- +(b|0))*60.0,c[x+24>>2]=s,c[x+32>>2]=u,c[x+40>>2]=v,h[x+48>>3]=(g- +(v|0))*60.0,x)|0)|0;i=x;v=w+6|0;if((a[v]|0)==32){a[v]=48}v=w+20|0;if((a[v]|0)==32){a[v]=48}ao(c[m>>2]|0,3856,(x=i,i=i+8|0,c[x>>2]=w,x)|0)|0;i=x;ao(c[m>>2]|0,3704,(x=i,i=i+16|0,h[x>>3]=q,h[x+8>>3]=r,x)|0)|0;i=x;ek(w);i=e;return}function b1(b,d){b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0,u=0.0,v=0,w=0,x=0;e=i;f=+h[b>>3];g=+h[d>>3];j=f*3.141592653589793/180.0;k=g*3.141592653589793/180.0;l=+Q(+j);n=+Q(+k);o=l*n;l=n*+R(+j);j=+R(+k);k=o*-.066988739415+l*.492728466075+j*-.867600811151;n=o*-.872755765852+l*-.45034695802+j*-.188374601723;p=+W(+n,+k);if(p<0.0){q=p+6.283185307179586}else{q=p}if(q>6.283185307179586){r=q-6.283185307179586}else{r=q}q=r*180.0/3.141592653589793;r=+W(+(o*-.483538914632+l*.744584633283+j*.460199784784),+(+O(+(k*k+n*n))))*180.0/3.141592653589793;h[b>>3]=q;h[d>>3]=r;if((c[2126]|0)==0){i=e;return}ao(c[m>>2]|0,3592,(d=i,i=i+16|0,h[d>>3]=f,h[d+8>>3]=g,d)|0)|0;i=d;g=q/15.0;b=~~g;q=(g- +(b|0))*60.0;s=~~q;if(r<0.0){t=45;u=-0.0-r}else{t=43;u=r}v=~~u;r=(u- +(v|0))*60.0;w=~~r;x=ei(32)|0;aG(x|0,3040,(d=i,i=i+56|0,c[d>>2]=b,c[d+8>>2]=s,h[d+16>>3]=(q- +(s|0))*60.0,c[d+24>>2]=t,c[d+32>>2]=v,c[d+40>>2]=w,h[d+48>>3]=(r- +(w|0))*60.0,d)|0)|0;i=d;w=x+6|0;if((a[w]|0)==32){a[w]=48}w=x+20|0;if((a[w]|0)==32){a[w]=48}ao(c[m>>2]|0,3472,(d=i,i=i+8|0,c[d>>2]=x,d)|0)|0;i=d;ek(x);i=e;return}function b2(b,d){b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,u=0,v=0,w=0,x=0;e=i;f=+h[b>>3];g=+h[d>>3];j=f*3.141592653589793/180.0;k=g*3.141592653589793/180.0;l=+Q(+j);n=+Q(+k);o=l*n;l=n*+R(+j);j=+R(+k);k=o*-.054875539726+l*-.87343710801+j*-.483834985808;n=o*.494109453312+l*-.444829589425+j*.74698225181;p=+W(+n,+k);if(p<0.0){q=p+6.283185307179586}else{q=p}if(q>6.283185307179586){r=q-6.283185307179586}else{r=q}q=r*180.0/3.141592653589793;r=+W(+(o*-.867666135858+l*-.198076386122+j*.455983795705),+(+O(+(k*k+n*n))))*180.0/3.141592653589793;h[b>>3]=q;h[d>>3]=r;if((c[2126]|0)==0){i=e;return}n=f/15.0;d=~~n;f=(n- +(d|0))*60.0;b=~~f;if(g<0.0){s=45;t=-0.0-g}else{s=43;t=g}u=~~t;g=(t- +(u|0))*60.0;v=~~g;w=ei(32)|0;aG(w|0,3040,(x=i,i=i+56|0,c[x>>2]=d,c[x+8>>2]=b,h[x+16>>3]=(f- +(b|0))*60.0,c[x+24>>2]=s,c[x+32>>2]=u,c[x+40>>2]=v,h[x+48>>3]=(g- +(v|0))*60.0,x)|0)|0;i=x;v=w+6|0;if((a[v]|0)==32){a[v]=48}v=w+20|0;if((a[v]|0)==32){a[v]=48}ao(c[m>>2]|0,3344,(x=i,i=i+8|0,c[x>>2]=w,x)|0)|0;i=x;ao(c[m>>2]|0,3272,(x=i,i=i+16|0,h[x>>3]=q,h[x+8>>3]=r,x)|0)|0;i=x;ek(w);i=e;return}function b3(b,d){b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0,u=0.0,v=0,w=0,x=0;e=i;f=+h[b>>3];g=+h[d>>3];j=f*3.141592653589793/180.0;k=g*3.141592653589793/180.0;l=+Q(+j);n=+Q(+k);o=l*n;l=n*+R(+j);j=+R(+k);k=o*-.054875539726+l*.494109453312+j*-.867666135858;n=o*-.87343710801+l*-.444829589425+j*-.198076386122;p=+W(+n,+k);if(p<0.0){q=p+6.283185307179586}else{q=p}if(q>6.283185307179586){r=q-6.283185307179586}else{r=q}q=r*180.0/3.141592653589793;r=+W(+(o*-.483834985808+l*.74698225181+j*.455983795705),+(+O(+(k*k+n*n))))*180.0/3.141592653589793;h[b>>3]=q;h[d>>3]=r;if((c[2126]|0)==0){i=e;return}ao(c[m>>2]|0,3176,(d=i,i=i+16|0,h[d>>3]=f,h[d+8>>3]=g,d)|0)|0;i=d;g=q/15.0;b=~~g;q=(g- +(b|0))*60.0;s=~~q;if(r<0.0){t=45;u=-0.0-r}else{t=43;u=r}v=~~u;r=(u- +(v|0))*60.0;w=~~r;x=ei(32)|0;aG(x|0,3040,(d=i,i=i+56|0,c[d>>2]=b,c[d+8>>2]=s,h[d+16>>3]=(q- +(s|0))*60.0,c[d+24>>2]=t,c[d+32>>2]=v,c[d+40>>2]=w,h[d+48>>3]=(r- +(w|0))*60.0,d)|0)|0;i=d;w=x+6|0;if((a[w]|0)==32){a[w]=48}w=x+20|0;if((a[w]|0)==32){a[w]=48}ao(c[m>>2]|0,3104,(d=i,i=i+8|0,c[d>>2]=x,d)|0)|0;i=d;ek(x);i=e;return}function b4(a,b,c){a=a|0;b=b|0;c=+c;var d=0,e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0;d=i;i=i+72|0;e=d|0;if(c!=2.0e3){b7(2.0e3,c,a,b)}f=+h[a>>3]*3.141592653589793/180.0;g=+h[b>>3]*3.141592653589793/180.0;j=+Q(+f);k=+Q(+g);l=j*k;j=k*+R(+f);f=+R(+g);g=(c+-2.0e3)*.01;m=e|0;b8(1,(g*(g*(g*.001813+-59.0e-5)-46.815)+84381.448)*48481368110953.0e-19,0.0,0.0,m);g=+h[m>>3]*l+0.0+ +h[e+8>>3]*j+ +h[e+16>>3]*f;c=+h[e+24>>3]*l+0.0+ +h[e+32>>3]*j+ +h[e+40>>3]*f;k=+h[e+48>>3]*l+0.0+ +h[e+56>>3]*j+ +h[e+64>>3]*f;f=+W(+c,+g);if(f<0.0){n=f+6.283185307179586}else{n=f}if(n<=6.283185307179586){o=n;p=g*g;q=c*c;r=p+q;s=+O(+r);t=+W(+k,+s);u=o*180.0;v=u/3.141592653589793;h[a>>3]=v;w=t*180.0;x=w/3.141592653589793;h[b>>3]=x;i=d;return}o=n-6.283185307179586;p=g*g;q=c*c;r=p+q;s=+O(+r);t=+W(+k,+s);u=o*180.0;v=u/3.141592653589793;h[a>>3]=v;w=t*180.0;x=w/3.141592653589793;h[b>>3]=x;i=d;return}function b5(a,b,c){a=a|0;b=b|0;c=+c;var d=0,e=0,f=0.0,g=0.0,j=0.0,k=0.0,l=0.0,m=0,n=0.0,o=0.0,p=0.0;d=i;i=i+72|0;e=d|0;f=+h[a>>3]*3.141592653589793/180.0;g=+h[b>>3]*3.141592653589793/180.0;j=+Q(+f);k=+Q(+g);l=j*k;j=k*+R(+f);f=+R(+g);g=(c+-2.0e3)*.01;m=e|0;b8(1,(g*(g*(g*.001813+-59.0e-5)-46.815)+84381.448)*48481368110953.0e-19,0.0,0.0,m);g=+h[m>>3]*l+0.0+ +h[e+24>>3]*j+ +h[e+48>>3]*f;k=+h[e+8>>3]*l+0.0+ +h[e+32>>3]*j+ +h[e+56>>3]*f;n=+h[e+16>>3]*l+0.0+ +h[e+40>>3]*j+ +h[e+64>>3]*f;f=+W(+k,+g);if(f<0.0){o=f+6.283185307179586}else{o=f}if(o>6.283185307179586){p=o-6.283185307179586}else{p=o}o=+W(+n,+(+O(+(g*g+k*k))));h[a>>3]=p*180.0/3.141592653589793;h[b>>3]=o*180.0/3.141592653589793;if(c==2.0e3){i=d;return}b7(c,2.0e3,a,b);i=d;return}function b6(a,b,c,d){a=+a;b=+b;c=c|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0;e=i;i=i+72|0;f=e|0;g=+h[c>>3]*3.141592653589793/180.0;j=+h[d>>3]*3.141592653589793/180.0;k=f|0;l=(a+-1850.0)/100.0;m=(b-a)/100.0;a=m*48481368110953.0e-19;b=l*(l*59.0e-6+1.3972)+2303.5548;n=l*365.0e-6;b8(323,-0.0-a*(b+m*(.30242-l*269.0e-6+m*.017996)),a*(l*(-.85294-n)+2005.1125+m*(-.42647-n-m*.041802)),-0.0-a*(b+m*(l*387.0e-6+1.09478+m*.018324)),k);m=+Q(+g);l=+Q(+j);b=m*l;m=l*+R(+g);g=+R(+j);j=+h[k>>3]*b+0.0+ +h[f+8>>3]*m+ +h[f+16>>3]*g;l=+h[f+24>>3]*b+0.0+ +h[f+32>>3]*m+ +h[f+40>>3]*g;a=+h[f+48>>3]*b+0.0+ +h[f+56>>3]*m+ +h[f+64>>3]*g;g=+W(+l,+j);if(g<0.0){o=g+6.283185307179586}else{o=g}if(o<=6.283185307179586){p=o;q=j*j;r=l*l;s=q+r;t=+O(+s);u=+W(+a,+t);v=p*180.0;w=v/3.141592653589793;h[c>>3]=w;x=u*180.0;y=x/3.141592653589793;h[d>>3]=y;i=e;return}p=o-6.283185307179586;q=j*j;r=l*l;s=q+r;t=+O(+s);u=+W(+a,+t);v=p*180.0;w=v/3.141592653589793;h[c>>3]=w;x=u*180.0;y=x/3.141592653589793;h[d>>3]=y;i=e;return}function b7(a,b,c,d){a=+a;b=+b;c=c|0;d=d|0;var e=0,f=0,g=0.0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0;e=i;i=i+72|0;f=e|0;g=+h[c>>3]*3.141592653589793/180.0;j=+h[d>>3]*3.141592653589793/180.0;k=f|0;l=(a+-2.0e3)/100.0;m=(b-a)/100.0;a=m*48481368110953.0e-19;b=l*(1.39656-l*139.0e-6)+2306.2181;n=l*217.0e-6;b8(323,-0.0-a*(b+m*(.30188-l*344.0e-6+m*.017998)),a*(l*(-.8533-n)+2004.3109+m*(-.42665-n-m*.041833)),-0.0-a*(b+m*(l*66.0e-6+1.09468+m*.018203)),k);m=+Q(+g);l=+Q(+j);b=m*l;m=l*+R(+g);g=+R(+j);j=b*+h[k>>3]+0.0+m*+h[f+8>>3]+g*+h[f+16>>3];l=b*+h[f+24>>3]+0.0+m*+h[f+32>>3]+g*+h[f+40>>3];a=b*+h[f+48>>3]+0.0+m*+h[f+56>>3]+g*+h[f+64>>3];g=+W(+l,+j);if(g<0.0){o=g+6.283185307179586}else{o=g}if(o<=6.283185307179586){p=o;q=j*j;r=l*l;s=q+r;t=+O(+s);u=+W(+a,+t);v=p*180.0;w=v/3.141592653589793;h[c>>3]=w;x=u*180.0;y=x/3.141592653589793;h[d>>3]=y;i=e;return}p=o-6.283185307179586;q=j*j;r=l*l;s=q+r;t=+O(+s);u=+W(+a,+t);v=p*180.0;w=v/3.141592653589793;h[c>>3]=w;x=u*180.0;y=x/3.141592653589793;h[d>>3]=y;i=e;return}function b8(a,b,d,e,f){a=a|0;b=+b;d=+d;e=+e;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0.0,E=0.0,F=0,G=0.0,H=0.0,I=0.0,J=0.0,K=0,L=0.0,M=0,N=0.0,O=0,P=0.0;g=i;i=i+184|0;j=g|0;k=g+24|0;l=g+96|0;m=g+168|0;n=f+8|0;h[f>>3]=1.0;o=f+16|0;h[n>>3]=0.0;h[o>>3]=0.0;p=f+24|0;h[p>>3]=0.0;h[f+32>>3]=1.0;h[f+40>>3]=0.0;h[f+48>>3]=0.0;h[f+56>>3]=0.0;h[f+64>>3]=1.0;q=(a|0)/100|0;c[m>>2]=q;if((a|0)>99){r=(q*-100|0)+a|0;s=1}else{r=a;s=0}a=(r|0)/10|0;c[m+(s<<2)>>2]=a;if((r|0)>9){t=(a*-10|0)+r|0;u=s+1|0}else{t=r;u=s}c[m+(u<<2)>>2]=t;s=((t|0)>0)+u|0;h[j>>3]=b;h[j+8>>3]=d;h[j+16>>3]=e;if((s|0)<=0){i=g;return}u=l|0;t=l+32|0;r=l+40|0;a=l+56|0;q=l+64|0;v=l+16|0;w=l+48|0;x=l+8|0;y=l+24|0;z=k|0;A=k+8|0;B=0;e=1.0;d=0.0;C=1.0;D=b;while(1){h[u>>3]=1.0;h[l+8>>3]=0.0;h[l+16>>3]=0.0;h[l+24>>3]=0.0;h[l+32>>3]=1.0;h[l+40>>3]=0.0;h[l+48>>3]=0.0;h[l+56>>3]=0.0;h[l+64>>3]=1.0;b=+R(+D);E=+Q(+D);F=c[m+(B<<2)>>2]|0;do{if((F|0)==1){h[t>>3]=E;h[r>>3]=b;h[a>>3]=-0.0-b;h[q>>3]=E}else{h[u>>3]=E;if((F|0)==2){h[v>>3]=-0.0-b;h[w>>3]=b;h[q>>3]=E;break}else{h[x>>3]=b;h[y>>3]=-0.0-b;h[t>>3]=E;break}}}while(0);E=+h[p>>3];b=+h[n>>3];G=+h[f+32>>3];H=+h[f+56>>3];I=+h[f+16>>3];J=+h[f+40>>3];F=0;do{K=F*3|0;L=+h[l+(K<<3)>>3];M=K+1|0;N=+h[l+(M<<3)>>3];O=K+2|0;P=+h[l+(O<<3)>>3];h[k+(K<<3)>>3]=L*e+0.0+N*E+P*d;h[k+(M<<3)>>3]=L*b+0.0+N*G+P*H;h[k+(O<<3)>>3]=L*I+0.0+N*J+P*C;F=F+1|0;}while((F|0)<3);J=+h[z>>3];h[f>>3]=J;h[n>>3]=+h[A>>3];h[o>>3]=+h[k+16>>3];h[f+24>>3]=+h[k+24>>3];h[f+32>>3]=+h[k+32>>3];h[f+40>>3]=+h[k+40>>3];I=+h[k+48>>3];h[f+48>>3]=I;h[f+56>>3]=+h[k+56>>3];H=+h[k+64>>3];h[f+64>>3]=H;F=B+1|0;if((F|0)>=(s|0)){break}B=F;e=J;d=I;C=H;D=+h[j+(F<<3)>>3]}i=g;return}function b9(a,b,c,d){a=+a;b=+b;c=+c;d=d|0;var e=0.0,f=0.0;e=a*3.141592653589793/180.0;a=b*3.141592653589793/180.0;b=+Q(+e)*c;f=+Q(+a);h[d>>3]=b*f;h[d+8>>3]=f*+R(+e)*c;h[d+16>>3]=+R(+a)*c;return}function ca(a,b){a=a|0;b=b|0;var d=0;if((b|0)>0){d=b}else{c[1620]=0;d=(cb(a,3512)|0)+80-a|0}c[1620]=d;return d|0}function cb(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=c[1620]|0;f=(e|0)==0?256e3:e;e=0;while(1){g=b+e|0;if((e|0)>=(f|0)){break}if((a[g]|0)<1){break}else{e=e+1|0}}f=g;if((e|0)<=0){h=0;return h|0}e=b;i=b;L1936:while(1){b=cq(i,d,f-i|0)|0;if((b|0)==0){h=0;j=1458;break}k=(b-e|0)%80|0;l=a[b+(eu(d|0)|0)|0]|0;L1939:do{if((k|0)>7){m=b+1|0}else{L1942:do{if(l<<24>>24>32){switch(l<<24>>24){case 127:case 61:{break L1942;break};default:{}}m=b+1|0;break L1939}}while(0);n=-k|0;o=b+n|0;if((n|0)<0){n=b+1|0;p=o;q=i;while(1){r=(a[p]|0)==32?q:n;s=p+1|0;if(s>>>0<b>>>0){p=s;q=r}else{t=r;break}}}else{t=i}if(b>>>0<t>>>0){m=t}else{h=o;j=1457;break L1936}}}while(0);if(m>>>0<g>>>0){i=m}else{h=0;j=1456;break}}if((j|0)==1456){return h|0}else if((j|0)==1458){return h|0}else if((j|0)==1457){return h|0}return 0}function cc(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+16|0;g=f|0;if((a[d]|0)<64){h=cd(b,c,e)|0;i=f;return h|0}else{j=g|0;ew(j|0,c|0)|0;k=eu(c|0)|0;a[g+k|0]=a[d]|0;a[g+(k+1)|0]=0;h=cd(b,j,e)|0;i=f;return h|0}return 0}function cd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,i=0.0;f=ce(b,d)|0;if((f|0)==0){g=0;return g|0}d=(a[f]|0)==35?f+1|0:f;if((eu(d|0)|0)>81){et(6352,d|0,81)|0;a[6433]=0}else{ew(6352,d|0)|0}do{if((cf(6352)|0)==2){d=av(6352,68)|0;if((d|0)!=0){a[d]=101}d=av(6352,100)|0;if((d|0)!=0){a[d]=101}d=av(6352,69)|0;if((d|0)==0){break}a[d]=101}}while(0);h=+ep(6352);i=h+.001;if(i>2147483647.0){c[e>>2]=2147483647;g=1;return g|0}if(h>=0.0){c[e>>2]=~~i;g=1;return g|0}i=h+-.001;if(i<-2147483648.0){c[e>>2]=-2147483648;g=1;return g|0}else{c[e>>2]=~~i;g=1;return g|0}return 0}function ce(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0;d=i;i=i+248|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+32|0;k=d+40|0;l=d+48|0;m=d+56|0;n=d+144|0;o=n|0;p=f|0;a[p]=39;a[f+1|0]=0;q=g|0;a[q]=34;a[g+1|0]=0;r=h|0;a[r]=91;a[h+1|0]=0;s=l|0;a[s]=44;a[l+1|0]=0;t=j|0;a[t]=93;a[j+1|0]=0;u=k|0;a[u]=47;a[k+1|0]=0;v=m|0;et(v|0,c|0,80)|0;c=eu(v|0)|0;w=eu(r|0)|0;L1994:do{if((w|0)==0){x=v;y=1513}else{L1996:do{if((c|0)!=0){r=w-1|0;z=a[h+r|0]|0;A=c+1-w|0;B=m+A|0;if((A|0)<=0){break}A=(w|0)==1;C=(w|0)==2;D=v;L1999:while(1){do{if((a[D]|0)==91){if(A){break L1999}if((a[D+r|0]|0)!=z<<24>>24){break}if(C){break L1999}else{E=1}while(1){if((E|0)>=(w|0)){break L1999}if((a[D+E|0]|0)==(a[h+E|0]|0)){E=E+1|0}else{break}}}}while(0);F=D+1|0;if(F>>>0<B>>>0){D=F}else{break L1996}}if((D|0)!=0){x=D;y=1513;break L1994}}}while(0);B=eu(v|0)|0;C=eu(s|0)|0;if((C|0)==0){x=v;y=1513;break}if((B|0)==0){G=0;break}z=C-1|0;r=a[l+z|0]|0;A=B+1-C|0;B=m+A|0;if((A|0)<=0){G=0;break}A=(C|0)==1;F=(C|0)==2;H=v;L2014:while(1){do{if((a[H]|0)==44){if(A){break L2014}if((a[H+z|0]|0)!=r<<24>>24){break}if(F){break L2014}else{I=1}while(1){if((I|0)>=(C|0)){break L2014}if((a[H+I|0]|0)==(a[l+I|0]|0)){I=I+1|0}else{break}}}}while(0);D=H+1|0;if(D>>>0<B>>>0){H=D}else{G=0;break L1994}}if((H|0)==0){G=0}else{x=H;y=1513}}}while(0);if((y|0)==1513){a[x]=0;G=x+1|0}x=cb(b,v)|0;if((x|0)==0){J=0;i=d;return J|0}ey(o|0,0,100);o=n|0;et(o|0,x|0,80)|0;x=eu(o|0)|0;v=eu(p|0)|0;L2031:do{if((v|0)==0){K=o}else{if((x|0)==0){K=0;break}b=a[p]|0;I=v-1|0;l=a[f+I|0]|0;m=x+1-v|0;s=n+m|0;if((m|0)<=0){K=0;break}m=(v|0)==1;E=(v|0)==2;h=o;while(1){do{if((a[h]|0)==b<<24>>24){if(m){K=h;break L2031}if((a[h+I|0]|0)!=l<<24>>24){break}if(E){K=h;break L2031}else{L=1}while(1){if((L|0)>=(v|0)){K=h;break L2031}if((a[h+L|0]|0)==(a[f+L|0]|0)){L=L+1|0}else{break}}}}while(0);w=h+1|0;if(w>>>0<s>>>0){h=w}else{K=0;break}}}}while(0);L=eu(o|0)|0;v=eu(u|0)|0;L2046:do{if((v|0)==0){M=o}else{if((L|0)==0){M=0;break}x=a[u]|0;h=v-1|0;s=a[k+h|0]|0;E=L+1-v|0;l=n+E|0;if((E|0)<=0){M=0;break}E=(v|0)==1;I=(v|0)==2;m=o;while(1){do{if((a[m]|0)==x<<24>>24){if(E){M=m;break L2046}if((a[m+h|0]|0)!=s<<24>>24){break}if(I){M=m;break L2046}else{N=1}while(1){if((N|0)>=(v|0)){M=m;break L2046}if((a[m+N|0]|0)==(a[k+N|0]|0)){N=N+1|0}else{break}}}}while(0);b=m+1|0;if(b>>>0<l>>>0){m=b}else{M=0;break}}}}while(0);L2061:do{if((K|0)==0){N=eu(o|0)|0;k=eu(q|0)|0;if((k|0)==0){O=o}else{if((N|0)==0){y=1616;break}v=a[q]|0;L=k-1|0;u=a[g+L|0]|0;m=N+1-k|0;N=n+m|0;if((m|0)<=0){y=1616;break}m=(k|0)==1;l=(k|0)==2;I=o;L2067:while(1){do{if((a[I]|0)==v<<24>>24){if(m){break L2067}if((a[I+L|0]|0)!=u<<24>>24){break}if(l){break L2067}else{P=1}while(1){if((P|0)>=(k|0)){break L2067}if((a[I+P|0]|0)==(a[g+P|0]|0)){P=P+1|0}else{break}}}}while(0);s=I+1|0;if(s>>>0<N>>>0){I=s}else{y=1616;break L2061}}if((I|0)==0){y=1616;break}else{O=I}}if((M|0)!=0&O>>>0<M>>>0){N=O+1|0;k=eu(N|0)|0;L2081:do{if((N|0)==0){Q=M}else{l=eu(q|0)|0;if((l|0)==0){R=N;S=O;y=1614;break L2061}if((k|0)==0){Q=M;break}u=a[q]|0;L=l-1|0;m=a[g+L|0]|0;v=k+1-l|0;s=O+(v+1)|0;if((v|0)<=0){Q=M;break}v=(l|0)==1;h=(l|0)==2;E=N;L2086:while(1){do{if((a[E]|0)==u<<24>>24){if(v){break L2086}if((a[E+L|0]|0)!=m<<24>>24){break}if(h){break L2086}else{T=1}while(1){if((T|0)>=(l|0)){break L2086}if((a[E+T|0]|0)==(a[g+T|0]|0)){T=T+1|0}else{break}}}}while(0);x=E+1|0;if(x>>>0<s>>>0){E=x}else{Q=M;break L2081}}if((E|0)==0){Q=M}else{R=E;S=O;y=1614;break L2061}}}while(0);while(1){N=Q-1|0;if((a[N]|0)==32){Q=N}else{R=Q;S=O;y=1614;break L2061}}}if((M|0)!=0){y=1616;break}N=O+1|0;k=eu(N|0)|0;L2101:do{if((N|0)!=0){I=eu(q|0)|0;if((I|0)==0){R=N;S=O;y=1614;break L2061}if((k|0)==0){break}s=a[q]|0;l=I-1|0;h=a[g+l|0]|0;m=k+1-I|0;L=O+(m+1)|0;if((m|0)<=0){break}m=(I|0)==1;v=(I|0)==2;u=N;L2106:while(1){do{if((a[u]|0)==s<<24>>24){if(m){break L2106}if((a[u+l|0]|0)!=h<<24>>24){break}if(v){break L2106}else{U=1}while(1){if((U|0)>=(I|0)){break L2106}if((a[u+U|0]|0)==(a[g+U|0]|0)){U=U+1|0}else{break}}}}while(0);x=u+1|0;if(x>>>0<L>>>0){u=x}else{break L2101}}if((u|0)!=0){R=u;S=O;y=1614;break L2061}}}while(0);N=n+79|0;while(1){if((a[N]|0)==32){N=N-1|0}else{break}}R=N+1|0;S=O;y=1614}else{if((M|0)!=0&K>>>0<M>>>0){k=K+1|0;L=eu(k|0)|0;L2124:do{if((k|0)==0){V=M}else{I=eu(p|0)|0;if((I|0)==0){R=k;S=K;y=1614;break L2061}if((L|0)==0){V=M;break}v=a[p]|0;h=I-1|0;l=a[f+h|0]|0;m=L+1-I|0;s=K+(m+1)|0;if((m|0)<=0){V=M;break}m=(I|0)==1;E=(I|0)==2;x=k;L2129:while(1){do{if((a[x]|0)==v<<24>>24){if(m){break L2129}if((a[x+h|0]|0)!=l<<24>>24){break}if(E){break L2129}else{W=1}while(1){if((W|0)>=(I|0)){break L2129}if((a[x+W|0]|0)==(a[f+W|0]|0)){W=W+1|0}else{break}}}}while(0);b=x+1|0;if(b>>>0<s>>>0){x=b}else{V=M;break L2124}}if((x|0)==0){V=M}else{R=x;S=K;y=1614;break L2061}}}while(0);while(1){k=V-1|0;if((a[k]|0)==32){V=k}else{R=V;S=K;y=1614;break L2061}}}if((M|0)!=0){y=1616;break}k=K+1|0;L=eu(k|0)|0;L2144:do{if((k|0)!=0){N=eu(p|0)|0;if((N|0)==0){R=k;S=K;y=1614;break L2061}if((L|0)==0){break}s=a[p]|0;I=N-1|0;E=a[f+I|0]|0;l=L+1-N|0;h=K+(l+1)|0;if((l|0)<=0){break}l=(N|0)==1;m=(N|0)==2;v=k;L2149:while(1){do{if((a[v]|0)==s<<24>>24){if(l){break L2149}if((a[v+I|0]|0)!=E<<24>>24){break}if(m){break L2149}else{X=1}while(1){if((X|0)>=(N|0)){break L2149}if((a[v+X|0]|0)==(a[f+X|0]|0)){X=X+1|0}else{break}}}}while(0);u=v+1|0;if(u>>>0<h>>>0){v=u}else{break L2144}}if((v|0)!=0){R=v;S=K;y=1614;break L2061}}}while(0);k=n+79|0;while(1){if((a[k]|0)==32){k=k-1|0}else{break}}R=k+1|0;S=K;y=1614}}while(0);do{if((y|0)==1614){if((S|0)==0){y=1616;break}Y=R;Z=S+1|0}}while(0);if((y|0)==1616){S=eu(o|0)|0;L2169:do{if((S|0)==0){_=0}else{R=n+S|0;if((S|0)>0){$=o}else{_=0;break}while(1){if((a[$]|0)==61){_=$;break L2169}K=$+1|0;if(K>>>0<R>>>0){$=K}else{_=0;break}}}}while(0);$=(_|0)==0?n+9|0:_+1|0;_=eu(o|0)|0;L2175:do{if((_|0)==0){aa=0}else{S=n+_|0;if((_|0)>0){ab=o}else{aa=0;break}while(1){if((a[ab]|0)==47){aa=ab;break L2175}R=ab+1|0;if(R>>>0<S>>>0){ab=R}else{aa=0;break}}}}while(0);Y=(aa|0)==0?n+79|0:aa;Z=$}if(a[208]|0){ac=Z}else{$=Z;while(1){if((a[$]|0)==32&$>>>0<Y>>>0){$=$+1|0}else{ac=$;break}}}a[Y]=0;L2186:do{if(!(a[208]|0)){$=Y;while(1){Z=$-1|0;switch(a[Z]|0){case 32:case 13:{break};default:{break L2186}}if(Z>>>0<=ac>>>0){break L2186}a[Z]=0;$=Z}}}while(0);Y=(a4(ac|0,1168)|0)==0?ac+1|0:ac;ew(8512,Y|0)|0;if((G|0)==0){J=8512;i=d;return J|0}ac=eu(G|0)|0;$=eu(t|0)|0;L2195:do{if(($|0)==0){ad=G;y=1644}else{if((ac|0)==0){break}Z=a[t]|0;aa=$-1|0;n=a[j+aa|0]|0;ab=ac+1-$|0;o=G+ab|0;if((ab|0)<=0){break}ab=($|0)==1;_=($|0)==2;S=G;L2199:while(1){do{if((a[S]|0)==Z<<24>>24){if(ab){break L2199}if((a[S+aa|0]|0)!=n<<24>>24){break}if(_){break L2199}else{ae=1}while(1){if((ae|0)>=($|0)){break L2199}if((a[S+ae|0]|0)==(a[j+ae|0]|0)){ae=ae+1|0}else{break}}}}while(0);v=S+1|0;if(v>>>0<o>>>0){S=v}else{break L2195}}if((S|0)!=0){ad=S;y=1644}}}while(0);if((y|0)==1644){a[ad]=0}if((cf(G)|0)==0){ad=eu(G|0)|0;if((ad|0)>0){y=0;do{ae=G+y|0;j=a[ae]|0;if((j-65&255)<26){a[ae]=j+32&255}y=y+1|0;}while((y|0)<(ad|0))}ad=cz(8512,G)|0;if((ad|0)==0){J=0;i=d;return J|0}ew(8512,ad|0)|0;J=8512;i=d;return J|0}ad=aR(G|0)|0;G=e|0;a[G]=32;a[e+1|0]=0;if((ad|0)>0){e=Y;y=1;while(1){af=aA(e|0,G|0)|0;j=y+1|0;if((j|0)>(ad|0)){break}else{e=0;y=j}}if((af|0)==0){J=0;i=d;return J|0}ew(8512,af|0)|0;J=8512;i=d;return J|0}if((ad|0)>=0){J=8512;i=d;return J|0}af=-ad|0;L2239:do{if((af|0)>1){ad=Y;y=1;while(1){e=av(ad|0,32)|0;if((e|0)==0){J=0;break}G=e+1|0;e=y+1|0;if((e|0)<(af|0)){ad=G;y=e}else{ag=G;break L2239}}i=d;return J|0}else{ag=Y}}while(0);if((ag|0)==0){J=0;i=d;return J|0}ew(8512,ag|0)|0;J=8512;i=d;return J|0}function cf(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;if((b|0)==0){c=0;return c|0}d=a[b]|0;switch(d<<24>>24){case 68:case 100:case 69:case 101:{c=0;return c|0};default:{}}e=eu(b|0)|0;while(1){f=e-1|0;if((a[b+f|0]|0)==32){e=f}else{break}}if((e|0)>0){g=0;h=0;i=0;j=1;k=d}else{c=0;return c|0}L2261:while(1){L2263:do{switch(k<<24>>24){case 10:{l=h;m=i;n=j;o=1692;break L2261;break};case 32:{if((h|0)==0){p=j;q=i;r=0}else{c=0;o=1702;break L2261}break};default:{L2265:do{if((k-48&255)<10){o=1685}else{switch(k<<24>>24){case 46:case 58:case 68:case 69:case 100:case 101:{o=1685;break L2265;break};case 43:case 45:{break};default:{c=0;o=1703;break L2261}}switch(a[b+(g+1)|0]|0){case 45:case 43:{c=0;o=1701;break L2261;break};default:{}}if((g|0)<=0){s=i;t=h;break}switch(a[b+(g-1)|0]|0){case 68:case 100:case 69:case 101:case 58:case 32:{s=i;t=h;break};default:{c=0;o=1699;break L2261}}}}while(0);do{if((o|0)==1685){o=0;if((k-47&255)<11){s=i;t=h+1|0;break}else{s=(k<<24>>24==58)+i|0;t=h;break}}}while(0);switch(k<<24>>24){case 46:case 100:case 101:{break};default:{p=j;q=s;r=t;break L2263}}p=2;q=s;r=t}}}while(0);d=g+1|0;if((d|0)>=(e|0)){l=r;m=q;n=p;o=1692;break}g=d;h=r;i=q;j=p;k=a[b+d|0]|0}if((o|0)==1692){if((l|0)<=0){c=0;return c|0}c=(m|0)==0?n:3;return c|0}else if((o|0)==1699){return c|0}else if((o|0)==1701){return c|0}else if((o|0)==1702){return c|0}else if((o|0)==1703){return c|0}return 0}function cg(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0.0,i=0.0,j=0,k=0;e=ce(b,c)|0;if((e|0)==0){f=0;return f|0}g=+ci(e);c=eu(e|0)|0;L2294:do{if((c|0)==0){i=g}else{b=e+c|0;if((c|0)>0){j=e}else{i=g;break}while(1){if((a[j]|0)==58){break}k=j+1|0;if(k>>>0<b>>>0){j=k}else{i=g;break L2294}}if((j|0)==0){i=g;break}i=g*15.0}}while(0);h[d>>3]=i;f=1;return f|0}function ch(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=ce(a,b)|0;if((d|0)==0){e=0;return e|0}h[c>>3]=+ci(d);e=1;return e|0}function ci(b){b=b|0;var c=0.0,d=0,e=0,f=0,g=0,h=0,i=0.0,j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0,q=0,r=0,s=0,t=0.0,u=0.0,v=0.0;if((b|0)==0){c=0.0;return+c}d=a[b]|0;if(d<<24>>24==0){c=0.0;return+c}else{e=b;f=d}L2314:while(1){switch(f<<24>>24){case 43:{g=1725;break L2314;break};case 32:{break};case 45:{g=1724;break L2314;break};default:{h=e;i=1.0;break L2314}}d=e+1|0;e=d;f=a[d]|0}if((g|0)==1725){h=e+1|0;i=1.0}else if((g|0)==1724){h=e+1|0;i=-1.0}e=eu(h|0)|0;f=(h|0)==0;L2321:do{if(!(f|(e|0)==0)){d=h+e|0;if((e|0)>0){j=h}else{break}while(1){if((a[j]|0)==44){break}b=j+1|0;if(b>>>0<d>>>0){j=b}else{break L2321}}if((j|0)==0){break}a[j]=32}}while(0);j=eu(h|0)|0;while(1){e=j-1|0;if((a[h+e|0]|0)==32){j=e}else{break}}e=eu(h|0)|0;L2332:do{if((e|0)==0){g=1739}else{d=h+e|0;if((e|0)>0){k=h}else{g=1739;break}while(1){if((a[k]|0)==58){break}b=k+1|0;if(b>>>0<d>>>0){k=b}else{g=1739;break L2332}}if((k|0)==0){g=1739}else{l=k}}}while(0);L2338:do{if((g|0)==1739){L2340:do{if(!(f|(j|0)==0)){k=h+j|0;if((j|0)>0){m=h}else{break}while(1){if((a[m]|0)==32){break}e=m+1|0;if(e>>>0<k>>>0){m=e}else{break L2340}}if((m|0)!=0){l=m;break L2338}}}while(0);if((cf(h)|0)!=2){c=i*+(aR(h|0)|0);return+c}k=av(h|0,68)|0;if((k|0)!=0){a[k]=101}k=av(h|0,100)|0;if((k|0)!=0){a[k]=101}k=av(h|0,69)|0;if((k|0)!=0){a[k]=101}c=i*+ep(h);return+c}}while(0);a[l]=0;n=+(aR(h|0)|0);a[l]=58;h=l+1|0;m=eu(h|0)|0;L2362:do{if((h|0)==0){o=0.0;g=1762}else{L2364:do{if((m|0)==0){g=1750}else{j=l+(m+1)|0;if((m|0)>0){p=h}else{g=1750;break}while(1){if((a[p]|0)==58){break}f=p+1|0;if(f>>>0<j>>>0){p=f}else{g=1750;break L2364}}if((p|0)==0){g=1750}else{q=p}}}while(0);L2370:do{if((g|0)==1750){j=eu(h|0)|0;L2372:do{if((j|0)!=0){f=l+(j+1)|0;if((j|0)>0){r=h}else{break}while(1){if((a[r]|0)==32){break}k=r+1|0;if(k>>>0<f>>>0){r=k}else{break L2372}}if((r|0)!=0){q=r;break L2370}}}while(0);j=eu(h|0)|0;if((j|0)==0){o=0.0;g=1762;break L2362}f=l+(j+1)|0;if((j|0)>0){s=h}else{o=0.0;g=1762;break L2362}while(1){if((a[s]|0)==46){break}j=s+1|0;if(j>>>0<f>>>0){s=j}else{o=0.0;g=1762;break L2362}}if((s|0)==0){o=0.0;g=1762;break L2362}o=+ep(h);g=1762;break L2362}}while(0);a[q]=0;t=+(aR(h|0)|0);a[q]=58;u=+ep(q+1|0);v=t}}while(0);do{if((g|0)==1762){if((a[h]|0)==0){u=0.0;v=o;break}u=0.0;v=+(aR(h|0)|0)}}while(0);c=i*(n+v/60.0+u/3600.0);return+c}function cj(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+16|0;g=f|0;if((a[d]|0)<64){h=ck(b,c,e)|0;i=f;return h|0}else{j=g|0;ew(j|0,c|0)|0;k=eu(c|0)|0;a[g+k|0]=a[d]|0;a[g+(k+1)|0]=0;h=ck(b,j,e)|0;i=f;return h|0}return 0}function ck(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;e=ce(b,c)|0;if((e|0)==0){f=0;return f|0}c=(a[e]|0)==35?e+1|0:e;if((eu(c|0)|0)>81){et(6352,c|0,81)|0;a[6433]=0}else{ew(6352,c|0)|0}do{if((cf(6352)|0)==2){c=av(6352,68)|0;if((c|0)!=0){a[c]=101}c=av(6352,100)|0;if((c|0)!=0){a[c]=101}c=av(6352,69)|0;if((c|0)==0){break}a[c]=101}}while(0);h[d>>3]=+ep(6352);f=1;return f|0}function cl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0;f=ce(b,d)|0;if((f|0)==0){g=0;return g|0}d=av(f|0,47)|0;b=av(f|0,45)|0;if(d>>>0>f>>>0){a[d]=0;i=~~+ep(f);a[d]=47;j=d+1|0;d=av(j|0,47)|0;if((d|0)==0){k=av(j|0,45)|0}else{k=d}if(k>>>0<=f>>>0){g=0;return g|0}a[k]=0;d=~~+ep(j);a[k]=47;j=~~+ep(k+1|0);k=(i|0)>31;l=k?i:j;m=k?j:i;if(l>>>0<50){n=l+2e3|0}else{n=(l|0)<100?l+1900|0:l}l=((n|0)%100|0|0)!=0|((n|0)%400|0|0)==0?(n&3|0)==0?29:28:28;c[55]=l;i=d-1|0;d=c[216+(i<<2)>>2]|0;if((m|0)>(d|0)){o=d}else{o=(m|0)<1?1:m}p=(l|0)==28?365.0:366.0;l=o-1|0;if((i|0)>0){o=l;m=0;while(1){d=(c[216+(m<<2)>>2]|0)+o|0;j=m+1|0;if((j|0)<(i|0)){o=d;m=j}else{q=d;break}}}else{q=l}h[e>>3]=+(n|0)+ +(q|0)/p;g=1;return g|0}if(b>>>0<=f>>>0){g=0;return g|0}a[b]=0;q=~~+ep(f);a[b]=45;n=b+1|0;b=av(n|0,45)|0;do{if(b>>>0>f>>>0){a[b]=0;l=~~+ep(n);a[b]=45;m=b+1|0;o=av(m|0,84)|0;if(o>>>0>f>>>0){a[o]=0;i=~~+ep(m);a[o]=84;r=i;s=l;t=o;break}else{r=~~+ep(m);s=l;t=o;break}}else{r=1;s=1;t=0}}while(0);b=(q|0)<32;n=b?r+1900|0:q;o=b?q:r;r=((n|0)%100|0|0)!=0|((n|0)%400|0|0)==0?(n&3|0)==0?29:28:28;c[55]=r;q=s-1|0;s=c[216+(q<<2)>>2]|0;if((o|0)>(s|0)){u=s}else{u=(o|0)<1?1:o}p=(r|0)==28?365.0:366.0;r=u-1|0;if((q|0)>0){u=r;o=0;while(1){s=(c[216+(o<<2)>>2]|0)+u|0;b=o+1|0;if((b|0)<(q|0)){u=s;o=b}else{v=s;break}}}else{v=r}h[e>>3]=+(n|0)+ +(v|0)/p;if(t>>>0<=f>>>0){g=1;return g|0}v=t+1|0;t=av(v|0,58)|0;do{if(t>>>0>f>>>0){a[t]=0;n=~~+ep(v);a[t]=58;r=t+1|0;o=av(r|0,58)|0;if(o>>>0>f>>>0){a[o]=0;u=~~+ep(r);a[o]=58;w=u;x=n;y=+ep(o+1|0);break}else{w=~~+ep(r);x=n;y=0.0;break}}else{w=0;x=0;y=0.0}}while(0);h[e>>3]=+h[e>>3]+(y+(+(x|0)*3600.0+ +(w|0)*60.0))/86400.0/p;g=1;return g|0}function cm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+24|0;h=g+16|0;j=g|0;aG(j|0,5112,(k=i,i=i+8|0,c[k>>2]=d,k)|0)|0;i=k;do{if((cb(b,j)|0)==0){aG(j|0,2992,(k=i,i=i+8|0,c[k>>2]=d,k)|0)|0;i=k;if((cb(b,j)|0)!=0){c[h>>2]=627012389;c[h+4>>2]=6566448;break}aG(j|0,2392,(k=i,i=i+8|0,c[k>>2]=d,k)|0)|0;i=k;if((cb(b,j)|0)!=0){c[h>>2]=627012389;c[h+4>>2]=6566704;break}if((cb(b,j)|0)==0){l=0;i=g;return l|0}else{c[h>>2]=627012389;c[h+4>>2]=6566704;break}}else{m=h;a[m]=a[3904]|0;a[m+1|0]=a[3905|0]|0;a[m+2|0]=a[3906|0]|0;a[m+3|0]=a[3907|0]|0;a[m+4|0]=a[3908|0]|0;a[m+5|0]=a[3909|0]|0}}while(0);a[208]=1;m=h;h=f;n=e;e=1;while(1){aG(j|0,m|0,(k=i,i=i+16|0,c[k>>2]=d,c[k+8>>2]=e,k)|0)|0;i=k;o=ce(b,j)|0;if((o|0)==0){p=e;break}q=eu(o|0)|0;if((q|0)>=(n|0)){r=1848;break}ew(h|0,o|0)|0;s=e+1|0;if((s|0)<500){h=h+q|0;n=n-q|0;e=s}else{p=s;break}}do{if((r|0)==1848){if((n|0)>1){j=n-1|0;et(h|0,o|0,j|0)|0;a[h+n|0]=0;p=e;break}else{a[f]=a[o]|0;p=e;break}}}while(0);a[208]=0;l=(p|0)>1|0;i=g;return l|0}function cn(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+16|0;h=g|0;do{if((a[d]|0)<64){j=ce(b,c)|0;if((j|0)==0){k=0;break}if((eu(j|0)|0)<(e|0)){ew(f|0,j|0)|0;k=1;break}if((e|0)>1){l=e-1|0;et(f|0,j|0,l|0)|0;k=1;break}else{a[f]=a[j]|0;k=1;break}}else{j=h|0;ew(j|0,c|0)|0;l=eu(c|0)|0;a[h+l|0]=a[d]|0;a[h+(l+1)|0]=0;l=ce(b,j)|0;if((l|0)==0){k=0;break}if((eu(l|0)|0)<(e|0)){ew(f|0,l|0)|0;k=1;break}if((e|0)>1){j=e-1|0;et(f|0,l|0,j|0)|0;k=1;break}else{a[f]=a[l]|0;k=1;break}}}while(0);i=g;return k|0}function co(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=ce(b,c)|0;if((f|0)==0){g=0;return g|0}if((eu(f|0)|0)<(d|0)){ew(e|0,f|0)|0;g=1;return g|0}if((d|0)>1){c=d-1|0;et(e|0,f|0,c|0)|0;g=1;return g|0}else{a[e]=a[f]|0;g=1;return g|0}return 0}function cp(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;d=eu(b|0)|0;if((b|0)==0|(c|0)==0){e=0;return e|0}f=eu(c|0)|0;if((f|0)==0){e=b;return e|0}if((d|0)==0){e=0;return e|0}g=a[c]|0;h=f-1|0;i=a[c+h|0]|0;j=d+1-f|0;d=b+j|0;if((j|0)<=0){e=0;return e|0}j=(f|0)==1;k=(f|0)==2;l=b;L2537:while(1){do{if((a[l]|0)==g<<24>>24){if(j){e=l;m=1894;break L2537}if((a[l+h|0]|0)!=i<<24>>24){break}if(k){e=l;m=1893;break L2537}else{n=1}while(1){if((n|0)>=(f|0)){e=l;m=1896;break L2537}if((a[l+n|0]|0)==(a[c+n|0]|0)){n=n+1|0}else{break}}}}while(0);b=l+1|0;if(b>>>0<d>>>0){l=b}else{e=0;m=1899;break}}if((m|0)==1896){return e|0}else if((m|0)==1894){return e|0}else if((m|0)==1899){return e|0}else if((m|0)==1893){return e|0}return 0}function cq(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if((b|0)==0|(c|0)==0){e=0;return e|0}f=eu(c|0)|0;if((f|0)==0){e=b;return e|0}if((d|0)==0){e=0;return e|0}do{if((f|0)<3){g=a[c]|0;if((g-97&255)<26){h=g-32&255}else{h=(g-65&255)<26?g+32&255:g}if((f|0)<=1){i=32;j=32;k=h;l=g;m=0;break}n=a[c+1|0]|0;if((n-97&255)<26){i=n-32&255;j=n;k=h;l=g;m=0;break}else{i=(n-65&255)<26?n+32&255:n;j=n;k=h;l=g;m=0;break}}else{g=ej(f,1)|0;n=0;do{o=a[c+n|0]|0;do{if((o-97&255)<26){a[g+n|0]=o-32&255}else{if((o-65&255)<26){a[g+n|0]=o+32&255;break}else{a[g+n|0]=o;break}}}while(0);n=n+1|0;}while((n|0)<(f|0));n=f-1|0;i=a[g+n|0]|0;j=a[c+n|0]|0;k=a[g]|0;l=a[c]|0;m=g}}while(0);h=d+1-f|0;d=b+h|0;L2584:do{if((h|0)>0){n=f-1|0;o=(f|0)>1;switch(f|0){case 2:{p=b;while(1){q=a[p]|0;if(q<<24>>24==l<<24>>24|q<<24>>24==k<<24>>24){q=a[p+n|0]|0;if(q<<24>>24==j<<24>>24|q<<24>>24==i<<24>>24){break}}q=p+1|0;if(q>>>0<d>>>0){p=q}else{break L2584}}if((m|0)==0){e=p;return e|0}ek(m);e=p;return e|0};case 1:{g=b;while(1){q=a[g]|0;if(q<<24>>24==l<<24>>24|q<<24>>24==k<<24>>24){break}q=g+1|0;if(q>>>0<d>>>0){g=q}else{break L2584}}if((m|0)==0){e=g;return e|0}ek(m);e=g;return e|0};default:{p=b;L2605:while(1){q=a[p]|0;L2607:do{if(q<<24>>24==l<<24>>24|q<<24>>24==k<<24>>24){r=a[p+n|0]|0;if(!(r<<24>>24==j<<24>>24|r<<24>>24==i<<24>>24)){break}if(o){s=1}else{break L2605}while(1){r=a[p+s|0]|0;if(r<<24>>24!=(a[c+s|0]|0)){if(r<<24>>24!=(a[m+s|0]|0)){break L2607}}s=s+1|0;if((s|0)>=(f|0)){break L2605}}}}while(0);q=p+1|0;if(q>>>0<d>>>0){p=q}else{break L2584}}if((m|0)==0){e=p;return e|0}ek(m);e=p;return e|0}}}}while(0);if((m|0)==0){e=0;return e|0}ek(m);e=0;return e|0}function cr(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((b|0)==0|(c|0)==0){e=0;return e|0}f=eu(c|0)|0;if((f|0)==0){e=b;return e|0}if((d|0)==0){e=0;return e|0}g=a[c]|0;h=f-1|0;i=a[c+h|0]|0;j=d+1-f|0;d=b+j|0;if((j|0)<=0){e=0;return e|0}j=(f|0)==1;k=(f|0)==2;l=b;L2639:while(1){do{if((a[l]|0)==g<<24>>24){if(j){e=l;m=1968;break L2639}if((a[l+h|0]|0)!=i<<24>>24){break}if(k){e=l;m=1970;break L2639}else{n=1}while(1){if((n|0)>=(f|0)){e=l;m=1967;break L2639}if((a[l+n|0]|0)==(a[c+n|0]|0)){n=n+1|0}else{break}}}}while(0);b=l+1|0;if(b>>>0<d>>>0){l=b}else{e=0;m=1974;break}}if((m|0)==1967){return e|0}else if((m|0)==1970){return e|0}else if((m|0)==1974){return e|0}else if((m|0)==1968){return e|0}return 0}function cs(b,d,e,f){b=b|0;d=d|0;e=+e;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+64|0;j=g|0;if(e<0.0){k=-1.0;l=-0.0-e}else{k=1.0;l=e}e=k*+aX(+l,360.0);if(e<0.0){m=e+360.0}else{m=e}e=m/15.0;n=~~e;m=(e- +(n|0))*60.0;o=~~m;e=(m- +(o|0))*60.0;do{if((f|0)>5){p=e>59.999999;m=p?0.0:e;q=(p&1)+o|0;p=(q|0)>59;r=p?0:q;q=((p&1)+n|0)%24|0;p=j|0;aG(p|0,4512,(s=i,i=i+24|0,c[s>>2]=q,c[s+8>>2]=r,h[s+16>>3]=m,s)|0)|0;i=s}else{if((f|0)>4){r=e>59.99999;m=r?0.0:e;q=(r&1)+o|0;r=(q|0)>59;p=r?0:q;q=((r&1)+n|0)%24|0;r=j|0;aG(r|0,4448,(s=i,i=i+24|0,c[s>>2]=q,c[s+8>>2]=p,h[s+16>>3]=m,s)|0)|0;i=s;break}if((f|0)>3){p=e>59.9999;m=p?0.0:e;q=(p&1)+o|0;p=(q|0)>59;r=p?0:q;q=((p&1)+n|0)%24|0;p=j|0;aG(p|0,4384,(s=i,i=i+24|0,c[s>>2]=q,c[s+8>>2]=r,h[s+16>>3]=m,s)|0)|0;i=s;break}if((f|0)>2){r=e>59.999;m=r?0.0:e;q=(r&1)+o|0;r=(q|0)>59;p=r?0:q;q=((r&1)+n|0)%24|0;r=j|0;aG(r|0,4328,(s=i,i=i+24|0,c[s>>2]=q,c[s+8>>2]=p,h[s+16>>3]=m,s)|0)|0;i=s;break}if((f|0)>1){p=e>59.99;m=p?0.0:e;q=(p&1)+o|0;p=(q|0)>59;r=p?0:q;q=((p&1)+n|0)%24|0;p=j|0;aG(p|0,4192,(s=i,i=i+24|0,c[s>>2]=q,c[s+8>>2]=r,h[s+16>>3]=m,s)|0)|0;i=s;break}if((f|0)>0){r=e>59.9;m=r?0.0:e;q=(r&1)+o|0;r=(q|0)>59;p=r?0:q;q=((r&1)+n|0)%24|0;r=j|0;aG(r|0,4072,(s=i,i=i+24|0,c[s>>2]=q,c[s+8>>2]=p,h[s+16>>3]=m,s)|0)|0;i=s;break}else{p=~~(e+.5);q=(p|0)>59;r=(q&1)+o|0;t=q?0:p;p=(r|0)>59;q=p?0:r;r=((p&1)+n|0)%24|0;p=j|0;aG(p|0,3984,(s=i,i=i+24|0,c[s>>2]=r,c[s+8>>2]=q,c[s+16>>2]=t,s)|0)|0;i=s;break}}}while(0);s=j|0;j=d-1|0;if((eu(s|0)|0)<(j|0)){ew(b|0,s|0)|0;i=g;return}else{et(b|0,s|0,j|0)|0;a[b+j|0]=0;i=g;return}}function ct(b,d,e,f){b=b|0;d=d|0;e=+e;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+64|0;j=g|0;if(e<0.0){k=-0.0-e;l=-1.0}else{k=e;l=1.0}e=l*+aX(+k,360.0);if(e>-180.0){m=e}else{m=e+360.0}if(m<0.0){n=-0.0-m;o=45}else{n=m;o=43}p=~~n;m=(n- +(p|0))*60.0;q=~~m;n=(m- +(q|0))*60.0;do{if((f|0)>5){r=n>59.999999;m=r?0.0:n;s=(r&1)+q|0;r=(s|0)>59;t=(r&1)+p|0;u=r?0:s;s=j|0;aG(s|0,3832,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=t,c[v+16>>2]=u,h[v+24>>3]=m,v)|0)|0;i=v}else{if((f|0)>4){u=n>59.99999;m=u?0.0:n;t=(u&1)+q|0;u=(t|0)>59;s=(u&1)+p|0;r=u?0:t;t=j|0;aG(t|0,3680,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=s,c[v+16>>2]=r,h[v+24>>3]=m,v)|0)|0;i=v;break}if((f|0)>3){r=n>59.9999;m=r?0.0:n;s=(r&1)+q|0;r=(s|0)>59;t=(r&1)+p|0;u=r?0:s;s=j|0;aG(s|0,3568,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=t,c[v+16>>2]=u,h[v+24>>3]=m,v)|0)|0;i=v;break}if((f|0)>2){u=n>59.999;m=u?0.0:n;t=(u&1)+q|0;u=(t|0)>59;s=(u&1)+p|0;r=u?0:t;t=j|0;aG(t|0,3448,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=s,c[v+16>>2]=r,h[v+24>>3]=m,v)|0)|0;i=v;break}if((f|0)>1){r=n>59.99;m=r?0.0:n;s=(r&1)+q|0;r=(s|0)>59;t=(r&1)+p|0;u=r?0:s;s=j|0;aG(s|0,3320,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=t,c[v+16>>2]=u,h[v+24>>3]=m,v)|0)|0;i=v;break}if((f|0)>0){u=n>59.9;m=u?0.0:n;t=(u&1)+q|0;u=(t|0)>59;s=(u&1)+p|0;r=u?0:t;t=j|0;aG(t|0,3248,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=s,c[v+16>>2]=r,h[v+24>>3]=m,v)|0)|0;i=v;break}else{r=~~(n+.5);s=(r|0)>59;t=(s&1)+q|0;u=s?0:r;r=(t|0)>59;s=(r&1)+p|0;w=r?0:t;t=j|0;aG(t|0,3152,(v=i,i=i+32|0,c[v>>2]=o,c[v+8>>2]=s,c[v+16>>2]=w,c[v+24>>2]=u,v)|0)|0;i=v;break}}}while(0);v=j|0;j=d-1|0;if((eu(v|0)|0)<(j|0)){ew(b|0,v|0)|0;i=g;return}else{et(b|0,v|0,j|0)|0;a[b+j|0]=0;i=g;return}}function cu(b,d,e,f){b=b|0;d=d|0;e=+e;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0,p=0;g=i;i=i+72|0;j=g+8|0;if(e<0.0){k=-1.0;l=-0.0-e}else{k=1.0;l=e}e=k*+aX(+l,360.0);if(e>-180.0){m=e}else{m=e+360.0}n=f+4|0;o=g|0;if((f|0)>0){aG(o|0,3088,(p=i,i=i+16|0,c[p>>2]=n,c[p+8>>2]=f,p)|0)|0;i=p;f=j|0;aG(f|0,o|0,(p=i,i=i+8|0,h[p>>3]=m,p)|0)|0;i=p}else{aG(o|0,3032,(p=i,i=i+8|0,c[p>>2]=n,p)|0)|0;i=p;n=j|0;f=~~m;aG(n|0,o|0,(p=i,i=i+8|0,c[p>>2]=f,p)|0)|0;i=p}p=j|0;j=d-1|0;if((eu(p|0)|0)<(j|0)){ew(b|0,p|0)|0;i=g;return}else{et(b|0,p|0,j|0)|0;a[b+j|0]=0;i=g;return}}function cv(a,b,d,e){a=a|0;b=+b;d=d|0;e=e|0;var f=0,g=0,j=0,k=0,l=0;f=i;i=i+8|0;g=f|0;j=(e|0)>0;if((d|0)>0){k=g|0;if(j){aG(k|0,3088|0,(l=i,i=i+16|0,c[l>>2]=d,c[l+8>>2]=e,l)|0)|0;i=l;aG(a|0,k|0,(l=i,i=i+8|0,h[l>>3]=b,l)|0)|0;i=l;i=f;return}else{aG(k|0,3e3|0,(l=i,i=i+8|0,c[l>>2]=d,l)|0)|0;i=l;d=~~b;aG(a|0,k|0,(l=i,i=i+8|0,c[l>>2]=d,l)|0)|0;i=l;i=f;return}}else{if(j){j=g|0;aG(j|0,2712|0,(l=i,i=i+8|0,c[l>>2]=e,l)|0)|0;i=l;aG(a|0,j|0,(l=i,i=i+8|0,h[l>>3]=b,l)|0)|0;i=l;i=f;return}else{j=~~b;aG(a|0,3216|0,(l=i,i=i+8|0,c[l>>2]=j,l)|0)|0;i=l;i=f;return}}}function cw(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;i=i+32|0;e=cz(a,b)|0;if((e|0)==0){f=0;i=d;return f|0}b=d|0;ew(b|0,e|0)|0;h[c>>3]=+ep(b);f=1;i=d;return f|0}function cx(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=ei(2e3)|0;if((cm(b,c,2e3,g)|0)==0){ek(g);h=0;return h|0}c=cz(g,d)|0;do{if((c|0)==0){i=0}else{if((eu(c|0)|0)<(e|0)){ew(f|0,c|0)|0;i=1;break}if((e|0)>1){d=e-1|0;et(f|0,c|0,d|0)|0;i=1;break}else{a[f]=a[c]|0;i=1;break}}}while(0);ek(g);h=i;return h|0}function cy(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;f=cz(b,c)|0;if((f|0)==0){g=0;return g|0}if((eu(f|0)|0)<(d|0)){ew(e|0,f|0)|0;g=1;return g|0}if((d|0)>1){c=d-1|0;et(e|0,f|0,c|0)|0;g=1;return g|0}else{a[e]=a[f]|0;g=1;return g|0}return 0}function cz(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+2040|0;e=d|0;f=d+8|0;g=d+16|0;h=d+40|0;j=h|0;k=f|0;a[k]=91;a[f+1|0]=0;f=g|0;a[f]=93;a[g+1|0]=0;g=d+24|0;ew(g|0,c|0)|0;c=cp(g,k)|0;k=(c|0)!=0;if(k){a[c]=0;l=0}else{l=0}while(1){m=b+l|0;if((l|0)>=57600){n=2079;break}if((a[m]|0)==0){n=2081;break}else{l=l+1|0}}do{if((n|0)==2081){o=eu(g|0)|0;if((l|0)>0){p=o;break}else{q=0}i=d;return q|0}else if((n|0)==2079){p=eu(g|0)|0}}while(0);l=m;o=b;L2793:while(1){r=cr(o,g,l-o|0)|0;if((r|0)==0){q=0;n=2112;break}s=a[r+p|0]|0;t=a[r-1|0]|0;if(s<<24>>24>32){switch(s<<24>>24){case 127:case 61:{n=2086;break};default:{}}}else{n=2086}if((n|0)==2086){n=0;if((r|0)==(b|0)){u=b;n=2089;break}switch(t<<24>>24){case 32:case 9:{u=r;n=2089;break L2793;break};default:{}}}t=r+1|0;if(t>>>0<m>>>0){o=t}else{q=0;n=2113;break}}if((n|0)==2112){i=d;return q|0}else if((n|0)==2113){i=d;return q|0}else if((n|0)==2089){if((u|0)==0){q=0;i=d;return q|0}n=u+p|0;L2809:while(1){switch(a[n]|0){case 32:case 61:{break};default:{break L2809}}n=n+1|0}if((n|0)==0){q=0;i=d;return q|0}ey(j|0,0,2e3);j=a[n]|0;L2816:do{if(j<<24>>24==34){p=0;u=n;while(1){o=u+1|0;m=a[o]|0;switch(m<<24>>24){case 0:case 34:{break L2816;break};default:{}}if((p|0)>=2e3){break L2816}a[h+p|0]=m;p=p+1|0;u=o}}else{u=0;p=n;o=j;while(1){switch(o<<24>>24){case 32:case 9:{break L2816;break};default:{}}if(!(o<<24>>24>0&(u|0)<2e3)){break L2816}m=p+1|0;a[h+u|0]=o;u=u+1|0;p=m;o=a[m]|0}}}while(0);if(!k){k=h|0;ew(6504,k|0)|0;q=6504;i=d;return q|0}k=c+1|0;c=cp(k,f)|0;if((c|0)==0){q=6504;i=d;return q|0}a[c]=0;c=aR(k|0)|0;if((c|0)<=0){q=6504;i=d;return q|0}k=e|0;a[k]=32;a[e+1|0]=44;a[e+2|0]=0;e=aA(h|0,k|0)|0;if((c|0)>1){h=1;while(1){f=aA(0,k|0)|0;j=h+1|0;if((j|0)<(c|0)){h=j}else{v=f;break}}}else{v=e}if((v|0)==0){q=6504;i=d;return q|0}ew(6504,v|0)|0;q=6504;i=d;return q|0}return 0}function cA(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0;g=c[d+3260>>2]|0;i=+h[d>>3];j=+h[d+8>>3];k=+h[d+16>>3];l=+h[d+24>>3];m=+h[d+32>>3];n=+h[d+40>>3];o=+h[d+48>>3]*3.141592653589793/180.0;p=+Q(+o);q=+R(+o);r=a-k;k=b-l;do{if((c[d+3300>>2]|0)==0){if(m==0.0|n==0.0){h[e>>3]=0.0;h[f>>3]=0.0;s=2;return s|0}else{l=r*m;b=k*n;if(o==0.0){t=l;u=b;break}t=l*p-b*q;u=b*p+l*q;break}}else{t=r*+h[d+56>>3]+k*+h[d+64>>3];u=r*+h[d+72>>3]+k*+h[d+80>>3]}}while(0);v=d+3304|0;d=(c[v>>2]|0)==0;k=d?u:t;r=d?t:u;h[e>>3]=i+r;h[f>>3]=j+k;if((g|0)<1){s=0;return s|0}d=(c[v>>2]|0)==0;u=i*3.141592653589793/180.0;i=j*3.141592653589793/180.0;t=d?i:u;o=d?u:i;u=r*3.141592653589793/180.0;r=k*3.141592653589793/180.0;k=u*u;l=k+r*r;b=+Q(+t);a=+R(+t);L2857:do{switch(g|0){case 3:case 31:case 33:case 32:{if(l>1.0){s=1;return s|0}w=b-r*a;if(w==0.0){s=1;return s|0}else{x=o+ +W(+u,+w);y=x;z=+V(+((r*b+a)*+Q(+(x-o))/w));break L2857}break};case 22:{w=n*p+m*q;x=(w==0.0?3.141592653589793:w*3.141592653589793)/180.0;w=i+x;A=+R(+w)/+O(+((+Q(+w)+1.0)*.5));w=+R(+i);B=+Q(+i);C=+O(+((B+1.0)*.5));D=A-w/C;A=x/(D==0.0?1.0:D);D=m*p-n*q;x=(D==0.0?3.141592653589793:D*3.141592653589793)/180.0;D=x*.5;E=B*2.0*+R(+D);F=x*+O(+((B*+Q(+D)+1.0)*.5))/(E==0.0?1.0:E);if(u==0.0&r==0.0){y=o;z=t;break L2857}E=r+w*A/C;C=E/A;w=4.0-k/(F*F*4.0)-C*C;if(w>4.0|w<2.0){s=1;return s|0}C=+O(+w)*.5;w=E*C/A;if(+N(+w)>1.0){s=1;return s|0}A=+U(+w);w=+Q(+A);if(+N(+w)<1.0e-5){s=1;return s|0}E=u*C/(F*2.0*w);if(+N(+E)>1.0){s=1;return s|0}else{y=o+ +U(+E)*2.0;z=A;break L2857}break};case 16:{A=1.0/+S(+t)-r;if(t<0.0){G=-0.0-A}else{G=A}y=o- +W(+u,+G)/a;z=+U(+((a*a*(1.0-(k+A*A))+1.0)*(1.0/(a*2.0))));break};case 27:{A=b-r*a;if(A==0.0){s=1;return s|0}E=o+ +W(+u,+A);w=+Q(+(E-o));if(w==0.0){s=1;return s|0}F=A/w;if(F>1.0|F<-1.0){s=1;return s|0}w=+T(+F);if(t>=0.0){y=E;z=w;break L2857}y=E;z=-0.0-w;break};case 28:case 20:{w=t+r;if(+N(+w)>1.5707963267948974){s=1;return s|0}E=+Q(+w);if(+N(+u)>E*6.28318530717959*.5){s=1;return s|0}if(E<=1.0e-5){y=o;z=w;break L2857}y=o+u/E;z=w;break};case 11:{y=o+u;z=t+r;break};case 12:{w=n*p+m*q;E=w==0.0?1.0:w;w=(j*.5+45.0)*3.141592653589793/180.0;F=+Y(+(+S(+w)));A=E*3.141592653589793/180.0/(+Y(+(+S(+(E*.5*.01745329252+w))))-F);w=+Q(+i);E=o+u/(w>0.0?w:1.0);if(+N(+(E-o))>6.28318530717959){s=1;return s|0}if(A!=0.0){H=(r+F*A)/A}else{H=0.0}y=E;z=+V(+(+X(+H)))*2.0-1.5707963267948974;break};case 4:{if(l>1.0){s=1;return s|0}E=+O(+(1.0-l));A=r*b+a*E;if(A>1.0|A<-1.0){s=1;return s|0}F=b*E-r*a;if(F==0.0&u==0.0){s=1;return s|0}else{E=+U(+A);y=o+ +W(+u,+F);z=E;break L2857}break};case 5:{E=(4.0-l)/(l+4.0);if(+N(+E)>1.0){s=1;return s|0}F=E+1.0;A=a*E+r*b*F*.5;if(+N(+A)>1.0){s=1;return s|0}E=+U(+A);A=+Q(+E);if(+N(+A)<1.0e-5){s=1;return s|0}w=u*F/(A*2.0);if(+N(+w)>1.0){s=1;return s|0}F=+U(+w);w=+R(+E);C=+Q(+F);D=a*w+1.0+b*A*C;if(+N(+D)<1.0e-5){s=1;return s|0}if(+N(+((b*w-a*A*C)*2.0/D-r))>1.0e-5){I=3.141592653589795-F}else{I=F}y=o+I;z=E;break};case 6:{if(l>=9.869604401089369){s=1;return s|0}E=+O(+l);F=+Q(+E);if(E!=0.0){J=+R(+E)/E}else{J=1.0}E=a*F+r*b*J;if(E>1.0|E<-1.0){s=1;return s|0}D=F-a*E;F=b*u*J;if(D==0.0&F==0.0){s=1;return s|0}else{C=+U(+E);y=o+ +W(+F,+D);z=C;break L2857}break};default:{y=0.0;z=0.0}}}while(0);if(y-o>3.141592653589795){K=y-6.28318530717959}else{K=y}if(K-o<-3.141592653589795){L=K+6.28318530717959}else{L=K}if(L<0.0){M=L+6.28318530717959}else{M=L}h[e>>3]=M*180.0/3.141592653589793;h[f>>3]=z*180.0/3.141592653589793;s=0;return s|0}function cB(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,P=0.0,U=0.0,V=0.0,W=0,X=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0;g=+h[d>>3];i=+h[d+8>>3];j=+h[d+16>>3];k=+h[d+24>>3];l=+h[d+32>>3];m=+h[d+40>>3];n=+h[d+48>>3]*3.141592653589793/180.0;o=+Q(+n);p=+R(+n);q=c[d+3260>>2]|0;r=(q|0)>0;if(r){s=(c[d+3304>>2]|0)==0;t=g*3.141592653589793/180.0;u=i*3.141592653589793/180.0;v=s?u:t;w=s?t:u;u=a-(s?g:i);t=j*l;do{if(t>180.0|t<-180.0){if(u>360.0){x=a+-360.0}else{x=a}if(u>=0.0){y=x;break}y=x+360.0}else{if(u>180.0){z=a+-360.0}else{z=a}if(u>=-180.0){y=z;break}y=z+360.0}}while(0);z=y*3.141592653589793/180.0;u=b*3.141592653589793/180.0;x=+Q(+u);t=+R(+u);A=z-w;B=x*+R(+A);C=t*+R(+v);D=x*+Q(+v);E=y;F=w;G=v;H=z;I=u;J=x;K=t;L=C+D*+Q(+A);M=B}else{E=a;F=0.0;G=0.0;H=0.0;I=0.0;J=0.0;K=0.0;L=0.0;M=0.0}L2979:do{switch(q|0){case 6:{a=+R(+G);B=+Q(+G);A=+Q(+(H-F));D=K*a+J*B*A;C=D<-1.0?-1.0:D;D=+T(+(C>1.0?1.0:C));if(D!=0.0){P=D/+R(+D)}else{P=1.0}U=M*P;V=(K*B-J*a*A)*P;break};case 27:{if(G==0.0){W=1;return W|0}else{A=+Q(+G);a=A-J*+Q(+(H-F));U=M;V=a/+R(+G);break L2979}break};case 12:{a=m*o+l*p;A=a==0.0?1.0:a;a=(i*.5+45.0)*3.141592653589793/180.0;B=+Y(+(+S(+a)));D=A*3.141592653589793/180.0/(+Y(+(+S(+(A*.5*.01745329252+a))))-B);a=+Q(+(i*3.141592653589793/180.0));A=+S(+(I*.5+.7853981633974487));if(A<1.0e-5){W=2;return W|0}else{U=(H-F)*(a>0.0?a:1.0);V=D*+Y(+A)-B*D;break L2979}break};case 16:{D=+R(+G);B=+S(+G);A=1.0/B;a=B*-2.0;C=B*B;t=B/3.0;B=a*a;x=(F-H)*D;D=I-G;u=A*(D*(a*.5+D*(C*.5+B*-.125+D*(t*.5+(C*a*-.25+a*B*.0625)+D*(C*.1875*B+(C*C*-.125-a*.25*t)-B*B*.0390625))))+1.0);B=x*x;if((c[d+3300>>2]|0)==0){X=l/+N(+l)}else{t=+h[d+56>>3];X=t/+N(+t)}U=(1.0-B/6.0)*x*u*X;V=A-(1.0-B*.5)*u;break};case 22:{u=(H-F)*.5;if(+N(+u)>1.5707963267948974){W=1;return W|0}B=m*o+l*p;A=(B==0.0?3.141592653589793:B*3.141592653589793)/180.0;B=i*3.141592653589793/180.0;x=A+B;t=+R(+x)/+O(+((+Q(+x)+1.0)*.5));x=+R(+B);a=+Q(+B);B=+O(+((a+1.0)*.5));C=t-x/B;t=A/(C==0.0?1.0:C);C=l*o-m*p;A=(C==0.0?3.141592653589793:C*3.141592653589793)/180.0;C=A*.5;D=a*2.0*+R(+C);z=+Q(+I);v=+O(+((z*+Q(+u)+1.0)*.5));if(+N(+v)<1.0e-5){W=3;return W|0}else{w=z*A*+O(+((a*+Q(+C)+1.0)*.5))/(D==0.0?1.0:D)*2.0;D=+R(+u)*w/v;U=D;V=t*+R(+I)/v-x*t/B;break L2979}break};case 31:case 33:case 32:case 3:{if(L>0.0){B=+R(+G);t=+Q(+G);x=+Q(+(H-F));v=K*B+J*t*x;U=M/v;V=(K*t-J*B*x)/v;break L2979}else{W=1;return W|0}break};case 4:{if(L<0.0){W=1;return W|0}else{v=K*+Q(+G);x=J*+R(+G);U=M;V=v-x*+Q(+(H-F));break L2979}break};case 11:{U=H-F;V=I-G;break};case 5:{if(+N(+I)>1.5707963267948974){W=1;return W|0}x=+R(+G);v=+Q(+G);B=+Q(+(H-F));t=K*x+1.0+J*v*B;if(+N(+t)<1.0e-5){W=1;return W|0}else{D=2.0/t;U=M*D;V=(K*v-J*x*B)*D;break L2979}break};case 28:case 20:{if(+N(+I)>1.5707963267948974){W=1;return W|0}if(+N(+G)>1.5707963267948974){W=1;return W|0}else{U=J*(H-F);V=I-G;break L2979}break};default:{U=M;V=0.0}}}while(0);if(r){Z=U*180.0/3.141592653589793;_=V*180.0/3.141592653589793}else{Z=E-g;_=b-i}r=(c[d+3304>>2]|0)==0;i=r?_:Z;b=r?Z:_;do{if((c[d+3300>>2]|0)==0){if(n!=0.0){$=o*b+p*i;aa=o*i-p*b}else{$=b;aa=i}if(l!=0.0){ab=$/l}else{ab=$}if(m==0.0){ac=ab;ad=aa;break}ac=ab;ad=aa/m}else{ac=b*+h[d+88>>3]+i*+h[d+96>>3];ad=b*+h[d+104>>3]+i*+h[d+112>>3]}}while(0);i=j+ac;h[e>>3]=i;do{if((q|0)==11){ac=+h[d+136>>3];if(i>ac){j=i-360.0/l;if(j<=0.0){break}h[e>>3]=j;break}if(i>=0.0){break}j=i+360.0/l;if(j>ac){break}h[e>>3]=j}}while(0);h[f>>3]=k+ad;W=0;return W|0}function cC(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0;g=c[d+3268>>2]|0;i=c[d+3272>>2]|0;j=a- +h[d+616>>3];a=b- +h[d+624>>3];b=j*j;k=a*a;l=j*b;m=a*k;n=b+k;o=+h[d+256>>3]+j*+h[d+264>>3]+a*+h[d+272>>3]+b*+h[d+280>>3]+k*+h[d+288>>3]+a*j*+h[d+296>>3];do{if((g|0)>6){p=o+l*+h[d+304>>3]+m*+h[d+312>>3];if((g|0)<=8){q=p;break}q=n*+h[d+336>>3]+(p+a*b*+h[d+320>>3]+k*j*+h[d+328>>3])+n*j*+h[d+344>>3]+n*a*+h[d+352>>3]}else{q=o}}while(0);o=+h[d+416>>3]+j*+h[d+424>>3]+a*+h[d+432>>3]+b*+h[d+440>>3]+k*+h[d+448>>3]+a*j*+h[d+456>>3];do{if((i|0)>6){p=o+l*+h[d+464>>3]+m*+h[d+472>>3];if((i|0)<=8){r=p;break}r=n*+h[d+496>>3]+(p+a*b*+h[d+480>>3]+j*k*+h[d+488>>3])+n*j*+h[d+504>>3]+n*a*+h[d+512>>3]}else{r=o}}while(0);o=r*3.141592653589793/180.0;r=+h[d+688>>3]*3.141592653589793/180.0;a=+h[d+696>>3]*3.141592653589793/180.0;n=+S(+a);j=1.0-o*n;k=+W(+(q*3.141592653589793/180.0/+Q(+a)),+j);a=r+k;if(a>=0.0){s=a;t=s*180.0;u=t/3.141592653589793;h[e>>3]=u;v=+Q(+k);w=o+n;x=j/w;y=v/x;z=+V(+y);A=z*180.0;B=A/3.141592653589793;h[f>>3]=B;return 0}s=a+6.28318530717959;t=s*180.0;u=t/3.141592653589793;h[e>>3]=u;v=+Q(+k);w=o+n;x=j/w;y=v/x;z=+V(+y);A=z*180.0;B=A/3.141592653589793;h[f>>3]=B;return 0}function cD(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0,K=0,L=0,M=0,O=0,P=0,R=0,T=0,U=0.0,V=0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0.0,ar=0.0,as=0.0,at=0.0,au=0.0,av=0.0,aw=0.0,ax=0,ay=0.0,az=0.0,aA=0.0,aB=0.0,aC=0;g=c[d+3268>>2]|0;i=c[d+3272>>2]|0;j=+S(+(b*3.141592653589793/180.0));b=+h[d+688>>3]*3.141592653589793/180.0;k=+h[d+696>>3]*3.141592653589793/180.0;l=+S(+k);m=+Q(+k);k=a*3.141592653589793/180.0-b;b=+S(+k);a=+Q(+k);k=(1.0-l*a/j)/(l+a/j);j=m*b*(1.0-l*k)*180.0/3.141592653589793;l=k*180.0/3.141592653589793;k=j*+h[d+88>>3]+l*+h[d+96>>3];b=j*+h[d+104>>3]+l*+h[d+112>>3];m=+h[d+256>>3];a=+h[d+264>>3];n=+h[d+272>>3];o=+h[d+280>>3];p=+h[d+288>>3];q=+h[d+296>>3];r=o*2.0;s=p*2.0;t=d+304|0;u=d+312|0;v=(g|0)>8;w=d+320|0;x=d+328|0;y=d+336|0;z=d+344|0;A=d+352|0;B=+h[d+416>>3];C=+h[d+424>>3];D=+h[d+432>>3];E=+h[d+440>>3];F=+h[d+448>>3];G=+h[d+456>>3];H=E*2.0;I=F*2.0;J=(i|0)>6;K=d+464|0;L=d+472|0;M=(i|0)>8;i=d+480|0;O=d+488|0;P=d+496|0;R=d+504|0;T=d+512|0;L3067:do{if((g|0)>6){U=b;V=0;W=k;while(1){X=U*W;Y=W*W;Z=U*U;_=W*Y;$=U*Z;aa=U*Y;ab=Z*W;ac=Z+Y;ad=+h[t>>3];ae=+h[u>>3];af=m+W*a+U*n+Y*o+Z*p+X*q+_*ad+$*ae;ag=a+W*r+U*q+Y*ad*3.0;ad=W*q+(n+U*s)+Z*ae*3.0;if(v){ae=+h[w>>3];ah=+h[x>>3];ai=+h[y>>3];aj=+h[z>>3];ak=+h[A>>3];al=ai*2.0;am=af+aa*ae+ab*ah+ac*ai+ac*W*aj+ac*U*ak;an=(Z+Y*3.0)*aj+(Z*ah+(ag+X*ae*2.0)+W*al)+X*ak*2.0;ao=(Z*3.0+Y)*ak+(ad+Y*ae+X*ah*2.0+U*al+X*aj*2.0)}else{am=af;an=ag;ao=ad}ad=B+W*C+U*D+Y*E+Z*F+X*G;ag=C+W*H+U*G;af=W*G+(D+U*I);do{if(J){aj=+h[K>>3];al=+h[L>>3];ah=ad+_*aj+$*al;ae=ag+Y*aj*3.0;aj=af+Z*al*3.0;if(!M){ap=ah;aq=ae;ar=aj;break}al=+h[i>>3];ak=+h[O>>3];ai=+h[P>>3];as=+h[R>>3];at=+h[T>>3];au=ai*2.0;ap=ah+aa*al+ab*ak+ac*ai+ac*W*as+ac*U*at;aq=(Z+Y*3.0)*as+(Z*ak+(ae+X*al*2.0)+W*au)+X*at*2.0;ar=(Z*3.0+Y)*at+(aj+Y*al+X*ak*2.0+U*au+X*as*2.0)}else{ap=ad;aq=ag;ar=af}}while(0);af=am-j;ag=ap-l;ad=an*ar-ao*aq;X=(ar*(-0.0-af)+ao*ag)/ad;Y=(af*aq+an*(-0.0-ag))/ad;ad=W+X;ag=U+Y;if(+N(+X)<5.0e-7){if(+N(+Y)<5.0e-7){av=ad;aw=ag;break L3067}}ax=V+1|0;if((ax|0)<50){U=ag;V=ax;W=ad}else{av=ad;aw=ag;break}}}else{W=b;V=0;U=k;while(1){ag=W*U;ad=U*U;Y=W*W;X=W*ad;af=Y*U;Z=Y+ad;ac=m+U*a+W*n+ad*o+Y*p+ag*q;ab=a+U*r+W*q;aa=U*q+(n+W*s);$=B+U*C+W*D+ad*E+Y*F+ag*G;_=C+U*H+W*G;as=U*G+(D+W*I);do{if(J){au=+h[K>>3];ak=+h[L>>3];al=$+U*ad*au+W*Y*ak;aj=_+ad*au*3.0;au=as+Y*ak*3.0;if(!M){ay=al;az=aj;aA=au;break}ak=+h[i>>3];at=+h[O>>3];ae=+h[P>>3];ai=+h[R>>3];ah=+h[T>>3];aB=ae*2.0;ay=al+X*ak+af*at+Z*ae+Z*U*ai+Z*W*ah;az=(Y+ad*3.0)*ai+(Y*at+(aj+ag*ak*2.0)+U*aB)+ag*ah*2.0;aA=(Y*3.0+ad)*ah+(au+ad*ak+ag*at*2.0+W*aB+ag*ai*2.0)}else{ay=$;az=_;aA=as}}while(0);as=ac-j;_=ay-l;$=ab*aA-aa*az;ag=(aA*(-0.0-as)+aa*_)/$;ad=(as*az+ab*(-0.0-_))/$;$=U+ag;_=W+ad;if(+N(+ag)<5.0e-7){if(+N(+ad)<5.0e-7){av=$;aw=_;break L3067}}ax=V+1|0;if((ax|0)<50){W=_;V=ax;U=$}else{av=$;aw=_;break}}}}while(0);h[e>>3]=av+ +h[d+616>>3];av=aw+ +h[d+624>>3];h[f>>3]=av;aw=+h[e>>3];if(aw<.5){aC=-1;return aC|0}if(aw>+h[d+136>>3]+.5|av<.5){aC=-1;return aC|0}if(av>+h[d+144>>3]+.5){aC=-1;return aC|0}aC=0;return aC|0}function cE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,i=0;d=ei(2e3)|0;e=ei(2e3)|0;cm(a,2864,2e3,d)|0;cm(a,4944,2e3,e)|0;a=ei(2e3)|0;f=ei(2e3)|0;g=b+3176|0;do{if(+h[g>>3]>360.0){if((cw(d,3792,g)|0)!=0){break}if((cw(e,3792,g)|0)!=0){break}h[g>>3]=180.0}}while(0);g=b+3192|0;do{if((cw(d,2976,g)|0)==0){if((cw(e,2976,g)|0)!=0){break}h[g>>3]=57.29577951308232}}while(0);do{if((cy(d,2696,2e3,a)|0)==0){if((cy(e,2696,2e3,a)|0)==0){c[b+5960>>2]=0;break}else{c[b+5960>>2]=cH(a)|0;break}}else{c[b+5960>>2]=cH(a)|0}}while(0);do{if((cy(e,2376,2e3,f)|0)==0){if((cy(d,2376,2e3,f)|0)==0){c[b+5964>>2]=0;break}else{c[b+5964>>2]=cH(f)|0;break}}else{c[b+5964>>2]=cH(f)|0}}while(0);bM(b);ek(d);ek(e);ek(a);ek(f);do{if((c[b+5964>>2]|0)==0){if((c[b+5960>>2]|0)==0){i=1}else{break}return i|0}}while(0);i=0;return i|0}function cF(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0.0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0;g=a- +h[d+616>>3];a=b- +h[d+624>>3];do{if((c[d+3300>>2]|0)==0){b=+h[d+760>>3];if(b==0.0){i=2;j=0.0;k=0.0;h[e>>3]=k;h[f>>3]=j;return i|0}l=+h[d+768>>3];if(l==0.0){i=2;j=0.0;k=0.0;h[e>>3]=k;h[f>>3]=j;return i|0}m=g*b;b=a*l;l=+h[d+48>>3];if(l==0.0){n=m;o=b;break}p=l*3.141592653589793/180.0;l=+Q(+p);q=+R(+p);n=m*l-b*q;o=b*l+m*q}else{n=g*+h[d+56>>3]+a*+h[d+64>>3];o=g*+h[d+72>>3]+a*+h[d+80>>3]}}while(0);r=(c[d+3304>>2]|0)==0|0;a=(90.0- +h[d+688+(r<<3)>>3])*3.141592653589793/180.0;g=+Q(+a);q=+R(+a);m=+h[d+3176>>3]*3.141592653589793/180.0;s=c[d+5960>>2]|0;if((s|0)==0){t=n}else{t=n+ +cI(s,n,o)}s=c[d+5964>>2]|0;if((s|0)==0){u=o}else{u=o+ +cI(s,n,o)}o=+O(+(t*t+u*u));if(o==0.0){v=0.0}else{v=+W(+t,+(-0.0-u))}u=+W(+(+h[d+3192>>3]),+o);o=+Q(+u);t=+R(+u);n=v-m;m=+Q(+n);v=+R(+n);l=g*o;b=q*t-l*m;if(+N(+b)<1.0e-5){w=l*(1.0-m)- +Q(+(a+u))}else{w=b}b=v*(-0.0-o);if(w!=0.0|b!=0.0){x=+W(+b,+w)}else{x=n+3.141592653589793}v=+h[d+688+((r^1)<<3)>>3];l=v+x*180.0/3.141592653589793;do{if(v<0.0){if(l<=0.0){y=l;break}y=l+-360.0}else{if(l>=0.0){y=l;break}y=l+360.0}}while(0);do{if(y>360.0){z=y+-360.0}else{if(y>=-360.0){z=y;break}z=y+360.0}}while(0);if(+aX(+n,3.141592653589793)==0.0){n=(u+a*m)*180.0/3.141592653589793;if(n>90.0){A=180.0-n}else{A=n}if(A>=-90.0){i=0;j=A;k=z;h[e>>3]=k;h[f>>3]=j;return i|0}i=0;j=-180.0-A;k=z;h[e>>3]=k;h[f>>3]=j;return i|0}A=g*t+q*o*m;if(+N(+A)<=.99){i=0;j=+U(+A)*180.0/3.141592653589793;k=z;h[e>>3]=k;h[f>>3]=j;return i|0}m=+T(+(+O(+(b*b+w*w))));if(A<0.0){i=0;j=m*-180.0/3.141592653589793;k=z;h[e>>3]=k;h[f>>3]=j;return i|0}else{i=0;j=m*180.0/3.141592653589793;k=z;h[e>>3]=k;h[f>>3]=j;return i|0}return 0}function cG(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0,C=0.0,D=0.0,E=0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0,P=0.0,S=0.0,V=0.0,X=0,Y=0.0,Z=0.0,_=0.0;g=d+3304|0;i=(c[g>>2]|0)==0|0;j=(a- +h[d+688+((i^1)<<3)>>3])*3.141592653589793/180.0;a=b*3.141592653589793/180.0;b=+Q(+j);k=+R(+j);l=+Q(+a);m=+R(+a);n=(90.0- +h[d+688+(i<<3)>>3])*3.141592653589793/180.0;o=+Q(+n);p=+R(+n);q=+h[d+3176>>3];if(q==999.0){r=3.141592653589793}else{r=q*3.141592653589793/180.0}q=l*o;s=m*p-b*q;if(+N(+s)<1.0e-5){t=(1.0-b)*q- +Q(+(a+n))}else{t=s}s=k*(-0.0-l);if(t!=0.0|s!=0.0){u=+W(+s,+t)}else{u=j-3.141592653589793}k=r+u;do{if(k>3.141592653589793){v=k-6.283185307179586}else{if(k>=-3.141592653589793){v=k;break}v=k+6.283185307179586}}while(0);do{if(+aX(+j,3.141592653589793)==0.0){k=a+b*n;if(k>1.5707963267948966){w=3.141592653589793-k}else{w=k}if(w>=-1.5707963267948966){x=w;break}x=-3.141592653589793-w}else{k=m*o+b*l*p;if(+N(+k)<=.99){x=+U(+k);break}u=+T(+(+O(+(s*s+t*t))));if(k>=0.0){x=u;break}x=-0.0-u}}while(0);t=+R(+x);L3215:do{if(t==0.0){y=0.0;z=0.0}else{s=+h[d+3192>>3];p=s*+Q(+x)/t;i=d+5960|0;A=d+5964|0;do{if((c[i>>2]|0)==0){if((c[A>>2]|0)!=0){break}B=(c[g>>2]|0)==0;s=p*+R(+v);l=+Q(+v)*(-0.0-p);y=B?s:l;z=B?l:s;break L3215}}while(0);s=p*+R(+v);l=+Q(+v)*(-0.0-p);B=0;b=s;o=l;while(1){if((B|0)>=500){C=b;D=o;break}E=c[i>>2]|0;if((E|0)==0){F=b;G=0.0;H=1.0}else{m=b+ +cI(E,b,o);w=+cJ(c[i>>2]|0,b,o,1,0)+1.0;F=m;G=+cJ(c[i>>2]|0,b,o,0,1);H=w}w=F-s;E=c[A>>2]|0;if((E|0)==0){I=1.0;J=0.0;K=o}else{m=o+ +cI(E,b,o);n=+cJ(c[A>>2]|0,b,o,1,0);I=+cJ(c[A>>2]|0,b,o,0,1)+1.0;J=n;K=m}m=K-l;n=H*I-G*J;if(n==0.0){C=b;D=o;break}a=(G*m+I*(-0.0-w))/n;j=(w*J+H*(-0.0-m))/n;n=b+a;u=o+j;k=+N(+a);r=k>+N(+j)?a:j;j=+N(+r);a=+N(+w);k=a>+N(+m)?w:m;if(+N(+(j>+N(+k)?r:k))<2.8e-8){C=n;D=u;break}else{B=B+1|0;b=n;o=u}}B=(c[g>>2]|0)==0;y=B?C:D;z=B?D:C}}while(0);if((c[d+3300>>2]|0)!=0){h[e>>3]=y*+h[d+88>>3]+z*+h[d+96>>3];h[f>>3]=y*+h[d+104>>3]+z*+h[d+112>>3];L=+h[e>>3];M=d+16|0;P=+h[M>>3];S=L+P;h[e>>3]=S;V=+h[f>>3];X=d+24|0;Y=+h[X>>3];Z=V+Y;h[f>>3]=Z;return 0}C=+h[d+48>>3];if(C!=0.0){D=C*3.141592653589793/180.0;C=+Q(+D);H=+R(+D);h[e>>3]=y*C+z*H;_=z*C-y*H}else{h[e>>3]=y;_=z}h[f>>3]=_;_=+h[d+32>>3];if(_!=0.0){h[e>>3]=+h[e>>3]/_}_=+h[d+40>>3];if(_==0.0){L=+h[e>>3];M=d+16|0;P=+h[M>>3];S=L+P;h[e>>3]=S;V=+h[f>>3];X=d+24|0;Y=+h[X>>3];Z=V+Y;h[f>>3]=Z;return 0}h[f>>3]=+h[f>>3]/_;L=+h[e>>3];M=d+16|0;P=+h[M>>3];S=L+P;h[e>>3]=S;V=+h[f>>3];X=d+24|0;Y=+h[X>>3];Z=V+Y;h[f>>3]=Z;return 0}function cH(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;i=i+8|0;e=d|0;if((a[b+1|0]|0)==0){f=0;i=d;return f|0}g=ei(160)|0;c[e>>2]=b;j=g;g=20;k=0;l=b;m=b;L3252:while(1){if((a[m]|0)==0){break}n=+eo(l,e);b=c[e>>2]|0;o=a[b]|0;if(o<<24>>24==46){p=b+1|0;c[e>>2]=p;q=p;r=a[p]|0}else{q=b;r=o}if(r<<24>>24==0){break}o=k+1|0;if((o|0)<(g|0)){s=j;t=g;u=q}else{b=g+20|0;p=el(j,b<<3)|0;s=p;t=b;u=c[e>>2]|0}h[s+(k<<3)>>3]=n;b=u;while(1){if((a[b]|0)==32){b=b+1|0}else{j=s;g=t;k=o;l=b;m=u;continue L3252}}}u=cK(j)|0;ek(j);f=(k|0)==0?0:u;i=d;return f|0}function cI(a,b,d){a=a|0;b=+b;d=+d;var e=0,f=0,g=0,i=0.0,j=0,k=0.0,l=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0,t=0.0,u=0,v=0,w=0.0,x=0,y=0,z=0.0,A=0,B=0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0,I=0.0,J=0.0,K=0,L=0.0,M=0.0,N=0;L3267:do{switch(c[a+32>>2]|0){case 3:{e=c[a+36>>2]|0;f=c[a+56>>2]|0;h[f>>3]=1.0;do{if((e|0)!=1){h[f+8>>3]=b;if((e|0)>2){g=2;i=b}else{break}do{i=i*b;h[f+(g<<3)>>3]=i;g=g+1|0;}while((g|0)<(e|0))}}while(0);e=c[a+40>>2]|0;f=c[a+60>>2]|0;h[f>>3]=1.0;if((e|0)==1){break L3267}h[f+8>>3]=d;if((e|0)>2){j=2;k=d}else{break L3267}do{k=k*d;h[f+(j<<3)>>3]=k;j=j+1|0;}while((j|0)<(e|0));break};case 2:{e=c[a+36>>2]|0;l=+h[a+8>>3];n=+h[a>>3];f=c[a+56>>2]|0;h[f>>3]=1.0;do{if((e|0)!=1){o=(l+b)*n;h[f+8>>3]=o;if((e|0)<=2){break}p=(o*o*3.0+-1.0)*.5;h[f+16>>3]=p;if((e|0)>3){q=2;r=p;s=3}else{break}while(1){p=+(s|0);t=(r*o*(p*2.0+-1.0)- +h[f+(q-1<<3)>>3]*(p+-1.0))/p;h[f+(s<<3)>>3]=t;u=s+1|0;if((u|0)<(e|0)){q=s;r=t;s=u}else{break}}}}while(0);e=c[a+40>>2]|0;n=+h[a+24>>3];l=+h[a+16>>3];f=c[a+60>>2]|0;h[f>>3]=1.0;if((e|0)==1){break L3267}o=(n+d)*l;h[f+8>>3]=o;if((e|0)<=2){break L3267}l=(o*o*3.0+-1.0)*.5;h[f+16>>3]=l;if((e|0)>3){v=2;w=l;x=3}else{break L3267}while(1){l=+(x|0);n=(w*o*(l*2.0+-1.0)- +h[f+(v-1<<3)>>3]*(l+-1.0))/l;h[f+(x<<3)>>3]=n;u=x+1|0;if((u|0)<(e|0)){v=x;w=n;x=u}else{break}}break};case 1:{e=c[a+36>>2]|0;o=+h[a+8>>3];n=+h[a>>3];f=c[a+56>>2]|0;h[f>>3]=1.0;do{if((e|0)!=1){l=(o+b)*n;h[f+8>>3]=l;if((e|0)<=2){break}t=l*2.0;p=t*l+-1.0;h[f+16>>3]=p;if((e|0)>3){y=2;z=p;A=3}else{break}while(1){p=t*z- +h[f+(y-1<<3)>>3];h[f+(A<<3)>>3]=p;u=A+1|0;if((u|0)<(e|0)){y=A;z=p;A=u}else{break}}}}while(0);e=c[a+40>>2]|0;n=+h[a+24>>3];o=+h[a+16>>3];f=c[a+60>>2]|0;h[f>>3]=1.0;if((e|0)==1){break L3267}t=(n+d)*o;h[f+8>>3]=t;if((e|0)<=2){break L3267}o=t*2.0;n=o*t+-1.0;h[f+16>>3]=n;if((e|0)>3){B=2;C=n;D=3}else{break L3267}while(1){n=o*C- +h[f+(B-1<<3)>>3];h[f+(D<<3)>>3]=n;u=D+1|0;if((u|0)<(e|0)){B=D;C=n;D=u}else{break}}break};default:{aC(2144,33,1,c[m>>2]|0)|0;E=0.0;return+E}}}while(0);D=c[a+36>>2]|0;B=c[a+40>>2]|0;A=(D|0)>(B|0)?D:B;if((B|0)<=0){E=0.0;return+E}y=c[a+60>>2]|0;x=a+52|0;v=a+56|0;switch(c[a+44>>2]|0){case 2:{C=0.0;a=0;s=0;q=D;while(1){if((q|0)>0){j=c[x>>2]|0;g=c[v>>2]|0;d=0.0;e=s;f=0;while(1){F=d+ +h[j+(e<<3)>>3]*+h[g+(f<<3)>>3];u=f+1|0;if((u|0)<(q|0)){d=F;e=e+1|0;f=u}else{break}}G=F;H=q+s|0}else{G=0.0;H=s}d=C+G*+h[y+(a<<3)>>3];f=(((a+1+D|0)>(A|0))<<31>>31)+q|0;e=a+1|0;if((e|0)<(B|0)){C=d;a=e;s=H;q=f}else{E=d;break}}return+E};case 0:{C=0.0;q=0;H=0;s=D;while(1){if((s|0)>0){a=c[x>>2]|0;A=c[v>>2]|0;G=0.0;f=H;e=0;while(1){I=G+ +h[a+(f<<3)>>3]*+h[A+(e<<3)>>3];g=e+1|0;if((g|0)<(s|0)){G=I;f=f+1|0;e=g}else{break}}J=I;K=s+H|0}else{J=0.0;K=H}G=C+J*+h[y+(q<<3)>>3];e=q+1|0;if((e|0)<(B|0)){C=G;q=e;H=K;s=1}else{E=G;break}}return+E};default:{C=0.0;s=0;K=0;while(1){if((D|0)>0){H=c[x>>2]|0;q=c[v>>2]|0;J=0.0;e=K;f=0;while(1){L=J+ +h[H+(e<<3)>>3]*+h[q+(f<<3)>>3];A=f+1|0;if((A|0)<(D|0)){J=L;e=e+1|0;f=A}else{break}}M=L;N=D+K|0}else{M=0.0;N=K}J=C+M*+h[y+(s<<3)>>3];f=s+1|0;if((f|0)<(B|0)){C=J;s=f;K=N}else{E=J;break}}return+E}}return 0.0}function cJ(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0.0,k=0,l=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0.0,V=0,W=0,X=0,Y=0,Z=0.0,$=0,aa=0,ab=0,ac=0.0,ad=0.0,ae=0,af=0,ag=0.0;g=i;if((a|0)==0){j=0.0;i=g;return+j}k=f|e;if((k|0)<0){l=c[m>>2]|0;aC(1880,46,1,l|0)|0;j=0.0;i=g;return+j}if((k|0)==0){j=+cI(a,b,d);i=g;return+j}k=ei(64)|0;l=k;n=a+36|0;o=c[n>>2]|0;p=o-1|0;q=(p|0)>(e|0)?e:p;p=a+40|0;e=c[p>>2]|0;r=e-1|0;s=(r|0)>(f|0)?f:r;r=c[a+32>>2]|0;f=k+32|0;c[f>>2]=r;if((r-1|0)>>>0>=3){t=c[m>>2]|0;ao(t|0,1472,(t=i,i=i+8|0,c[t>>2]=r,t)|0)|0;i=t;j=0.0;i=g;return+j}t=c[a+44>>2]|0;r=k+44|0;c[r>>2]=t;L3349:do{switch(t|0){case 0:{u=(q|0)>0;v=(s|0)>0;if(u&v){w=k+36|0;c[w>>2]=1;x=k+40|0;c[x>>2]=1;y=k+48|0;c[y>>2]=1;z=1;A=1;B=1;C=y;D=w;E=x;break L3349}if(u){u=o-q|0;x=(u|0)<1?1:u;u=k+36|0;c[u>>2]=x;w=k+40|0;c[w>>2]=1;y=k+48|0;c[y>>2]=x;z=x;A=x;B=1;C=y;D=u;E=w;break L3349}if(v){v=k+36|0;c[v>>2]=1;w=e-s|0;u=(w|0)<1?1:w;w=k+40|0;c[w>>2]=u;y=k+48|0;c[y>>2]=u;z=u;A=1;B=u;C=y;D=v;E=w;break L3349}else{z=0;A=0;B=0;C=k+48|0;D=k+36|0;E=k+40|0;break L3349}break};case 2:{w=((o|0)>(e|0)?o:e)-s-q|0;v=o-q|0;y=(w|0)<(v|0)?w:v;v=(y|0)<1?1:y;y=k+36|0;c[y>>2]=v;u=e-s|0;x=(w|0)<(u|0)?w:u;u=(x|0)<1?1:x;x=k+40|0;c[x>>2]=u;w=(v|0)<(u|0)?v:u;F=(_(u,v)|0)-((_(w-1|0,w)|0)/2|0)|0;w=k+48|0;c[w>>2]=F;z=F;A=v;B=u;C=w;D=y;E=x;break};default:{x=o-q|0;y=(x|0)<1?1:x;x=k+36|0;c[x>>2]=y;w=e-s|0;u=(w|0)<1?1:w;w=k+40|0;c[w>>2]=u;v=_(u,y)|0;F=k+48|0;c[F>>2]=v;z=v;A=y;B=u;C=F;D=x;E=w}}}while(0);e=k;h[e>>3]=+h[a>>3];h[k+8>>3]=+h[a+8>>3];o=k+16|0;h[o>>3]=+h[a+16>>3];h[k+24>>3]=+h[a+24>>3];t=k+52|0;c[t>>2]=ei(z<<3)|0;z=k+56|0;c[z>>2]=ei(A<<3)|0;A=k+60|0;c[A>>2]=ei(B<<3)|0;B=a+48|0;w=c[B>>2]|0;x=w<<3;F=c[1610]|0;if((x|0)>(F|0)){if((F|0)>0){G=el(c[2148]|0,x)|0}else{G=ei(x)|0}F=G;c[2148]=F;c[1610]=x;H=c[B>>2]|0;I=F}else{H=w;I=c[2148]|0}if((H|0)>0){w=a+52|0;a=0;do{h[I+(a<<3)>>3]=+h[(c[w>>2]|0)+(a<<3)>>3];a=a+1|0;}while((a|0)<(H|0))}L3376:do{switch(c[r>>2]|0){case 2:{H=c[n>>2]|0;a=c[p>>2]|0;w=((H|0)>(a|0)?H:a)+1|0;F=c[D>>2]|0;x=c[E>>2]|0;G=s+1|0;if((a|0)<(G|0)){break L3376}u=G+((F|0)>(x|0)?F:x)|0;x=1-s|0;y=q+1|0;v=1-q|0;J=a;a=I+(c[B>>2]<<3)|0;K=(c[t>>2]|0)+(c[C>>2]<<3)|0;L=H;H=F;while(1){F=w-J|0;M=(F|0)<(L|0)?F:L;F=(M|0)<0?0:M;M=u-J|0;N=(M|0)<(H|0)?M:H;M=(N|0)<0?0:N;N=a+(-F<<3)|0;O=K+(-M<<3)|0;Q=x+J|0;if((J|0)>(Q|0)){R=(M|0)>0;S=q-F|0;T=J;do{T=T-1|0;if(R){U=+(T|0);V=0;do{W=a+(S+V<<3)|0;h[W>>3]=U*+h[W>>3];V=V+1|0;}while((V|0)<(M|0))}}while((T|0)>(Q|0))}if((F|0)>=(y|0)){Q=F;while(1){T=v+Q|0;S=Q-1|0;if((Q|0)>=(T|0)){R=a+(S-F<<3)|0;V=Q;U=+h[R>>3];do{V=V-1|0;U=+(V|0)*U;}while((V|0)>=(T|0));h[R>>3]=U}if((S|0)<(y|0)){break}else{Q=S}}}if((M|0)>0){Q=q-F|0;T=0;do{h[K+(T-M<<3)>>3]=+h[a+(Q+T<<3)>>3];T=T+1|0;}while((T|0)<(M|0))}M=J-1|0;if((M|0)<(G|0)){break L3376}J=M;a=N;K=O;L=c[n>>2]|0;H=c[D>>2]|0}break};case 1:{H=(c[p>>2]|0)-1|0;if((H|0)<(s|0)){break L3376}L=c[n>>2]|0;K=c[D>>2]|0;a=(c[E>>2]|0)-1|0;J=_(H,L)|0;G=_(a,K)|0;a=1-s|0;y=q+1|0;v=1-q|0;x=H;H=I+(J<<3)|0;J=(c[t>>2]|0)+(G<<3)|0;G=L;L=K;while(1){K=a+x|0;if((x|0)<(K|0)){X=G;Y=L}else{u=x;w=L;while(1){if((w|0)>0){Z=+(u|0);M=0;while(1){T=H+(M+q<<3)|0;h[T>>3]=Z*+h[T>>3];T=M+1|0;Q=c[D>>2]|0;if((T|0)<(Q|0)){M=T}else{$=Q;break}}}else{$=w}M=u-1|0;if((M|0)<(K|0)){break}else{u=M;w=$}}X=c[n>>2]|0;Y=$}if((X|0)<(y|0)){aa=Y}else{w=X;while(1){u=v+w|0;K=w-1|0;if((w|0)>=(u|0)){O=H+(K<<3)|0;N=w;Z=+h[O>>3];do{N=N-1|0;Z=+(N|0)*Z;}while((N|0)>=(u|0));h[O>>3]=Z}if((K|0)<(y|0)){break}else{w=K}}aa=c[D>>2]|0}if((aa|0)>0){w=0;while(1){h[J+(w<<3)>>3]=+h[H+(w+q<<3)>>3];u=w+1|0;N=c[D>>2]|0;if((u|0)<(N|0)){w=u}else{ab=N;break}}}else{ab=aa}w=c[n>>2]|0;N=x-1|0;if((N|0)<(s|0)){break}else{x=N;H=H+(-w<<3)|0;J=J+(-ab<<3)|0;G=w;L=ab}}break};default:{L=(q|0)>0;G=(s|0)>0;if(L&G){h[c[t>>2]>>3]=0.0;break L3376}if(L){L=c[n>>2]|0;J=q+1|0;if((L|0)<(J|0)){break L3376}H=1-q|0;x=L;L=(c[t>>2]|0)+((c[C>>2]|0)-1<<3)|0;while(1){y=H+x|0;v=x-1|0;a=I+(v<<3)|0;U=+h[a>>3];if((x|0)<(y|0)){ac=U}else{w=x;ad=U;do{w=w-1|0;ad=ad*+(w|0);}while((w|0)>=(y|0));h[a>>3]=ad;ac=ad}h[L>>3]=ac;if((v|0)<(J|0)){break L3376}else{x=v;L=L-8|0}}}if(!G){break L3376}L=I+((c[B>>2]|0)-1<<3)|0;x=c[t>>2]|0;J=c[p>>2]|0;H=s+1|0;if((J|0)<(H|0)){ae=L}else{y=1-s|0;w=J;J=L;while(1){L=y+w|0;if((w|0)>=(L|0)){N=w;U=+h[J>>3];do{N=N-1|0;U=+(N|0)*U;}while((N|0)>=(L|0));h[J>>3]=U}L=J-8|0;N=w-1|0;if((N|0)<(H|0)){ae=L;break}else{w=N;J=L}}}if((c[C>>2]|0)>0){af=0}else{break L3376}while(1){J=af+1|0;h[x+(af<<3)>>3]=+h[ae+(J<<3)>>3];if((J|0)<(c[C>>2]|0)){af=J}else{break}}}}}while(0);ac=+cI(l,b,d);do{if((c[f>>2]|0)==3){if((k|0)==0){j=ac}else{ag=ac;break}i=g;return+j}else{d=+P(+(+h[e>>3]),+(+(q|0)));ag=ac*d*+P(+(+h[o>>3]),+(+(s|0)))}}while(0);s=c[z>>2]|0;if((s|0)!=0){ek(s)}s=c[A>>2]|0;if((s|0)!=0){ek(s)}s=c[t>>2]|0;if((s|0)!=0){ek(s)}ek(k);j=ag;i=g;return+j}function cK(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0.0,l=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0;b=i;d=~~(+h[a+8>>3]+.5);if((d|0)<1){e=c[m>>2]|0;ao(e|0,1096,(f=i,i=i+8|0,c[f>>2]=d,f)|0)|0;i=f;g=0;i=b;return g|0}e=~~(+h[a+16>>3]+.5);if((e|0)<1){j=c[m>>2]|0;ao(j|0,6064,(f=i,i=i+8|0,c[f>>2]=e,f)|0)|0;i=f;g=0;i=b;return g|0}k=+h[a+32>>3];l=+h[a+40>>3];if(l<=k){j=c[m>>2]|0;ao(j|0,5616,(f=i,i=i+16|0,h[f>>3]=k,h[f+8>>3]=l,f)|0)|0;i=f;g=0;i=b;return g|0}n=+h[a+48>>3];o=+h[a+56>>3];if(o<=n){j=c[m>>2]|0;ao(j|0,5240,(f=i,i=i+16|0,h[f>>3]=n,h[f+8>>3]=o,f)|0)|0;i=f;g=0;i=b;return g|0}j=~~(+h[a>>3]+.5);if((j-1|0)>>>0>=3){p=c[m>>2]|0;ao(p|0,4968,(f=i,i=i+8|0,c[f>>2]=j,f)|0)|0;i=f;g=0;i=b;return g|0}f=ei(64)|0;p=f;c[f+36>>2]=d;h[f>>3]=2.0/(l-k);h[f+8>>3]=(k+l)*-.5;c[f+40>>2]=e;h[f+16>>3]=2.0/(o-n);h[f+24>>3]=(n+o)*-.5;q=~~+h[a+24>>3];c[f+44>>2]=q;switch(q|0){case 2:{q=(d|0)<(e|0)?d:e;r=(_(e,d)|0)-((_(q-1|0,q)|0)/2|0)|0;c[f+48>>2]=r;s=r;break};case 1:{r=_(e,d)|0;c[f+48>>2]=r;s=r;break};case 0:{r=d-1+e|0;c[f+48>>2]=r;s=r;break};default:{s=0}}c[f+32>>2]=j;j=ei(s<<3)|0;c[f+52>>2]=j;if((s|0)>0){r=0;do{h[j+(r<<3)>>3]=+h[a+(r+8<<3)>>3];r=r+1|0;}while((r|0)<(s|0))}c[f+56>>2]=ei(d<<3)|0;c[f+60>>2]=ei(e<<3)|0;g=p;i=b;return g|0}function cL(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0;d=i;i=i+8|0;e=d|0;f=ei(2e3)|0;g=ei(2e3)|0;if((cm(a,2824,2e3,f)|0)==0){j=ei((eu(a|0)|0)+200|0)|0;ev(j|0,4768,161)|0;ex(j|0,a|0)|0;cm(j,2824,2e3,f)|0;cm(j,3776,2e3,g)|0;ek(j)}cm(a,3776,2e3,g)|0;a=ei(2e3)|0;j=ei(2e3)|0;k=b+3176|0;do{if(+h[k>>3]>360.0){if((cw(f,2960,k)|0)!=0){break}if((cw(g,2960,k)|0)!=0){break}h[k>>3]=180.0}}while(0);k=b+3192|0;do{if((cw(f,2688,k)|0)==0){if((cw(g,2688,k)|0)!=0){break}h[k>>3]=57.29577951308232}}while(0);k=e|0;e=0;do{aG(k|0,2360,(l=i,i=i+8|0,c[l>>2]=e,l)|0)|0;i=l;l=b+4096+(e<<3)|0;if((cw(f,k,l)|0)==0){h[l>>3]=0.0}e=e+1|0;}while((e|0)<10);do{if((cy(f,2136,2e3,a)|0)==0){if((cy(g,2136,2e3,a)|0)==0){c[b+5960>>2]=0;break}else{c[b+5960>>2]=cH(a)|0;break}}else{c[b+5960>>2]=cH(a)|0}}while(0);do{if((cy(g,1872,2e3,j)|0)==0){if((cy(f,1872,2e3,j)|0)==0){c[b+5964>>2]=0;m=9;break}else{c[b+5964>>2]=cH(j)|0;m=9;break}}else{c[b+5964>>2]=cH(j)|0;m=9}}while(0);while(1){if((m|0)<=-1){n=2631;break}if(+h[b+4096+(m<<3)>>3]==0.0){m=m-1|0}else{n=2633;break}}do{if((n|0)==2633){c[b+3276>>2]=m;if((m|0)<=2){break}o=0.0;p=0.0;q=+h[b+4104>>3];r=0.0;e=1;while(1){if((e|0)>=181){s=o;t=p;n=2639;break}u=+(e|0)*3.141592653589793/180.0;if((m|0)>0){v=m;w=0.0}else{x=0.0;y=u;n=2645;break}do{w=u*w+ +(v|0)*+h[b+4096+(v<<3)>>3];v=v-1|0;}while((v|0)>0);if(w>0.0){o=w;p=u;q=w;r=u;e=e+1|0}else{s=w;t=u;n=2639;break}}L3556:do{if((n|0)==2639){if(s>0.0){z=3.141592653589793;break}if((m|0)>0){A=1;B=r;C=q;D=t;E=s}else{x=s;y=t;n=2645;break}while(1){p=B-C*(D-B)/(E-C);e=m;o=0.0;do{o=p*o+ +(e|0)*+h[b+4096+(e<<3)>>3];e=e-1|0;}while((e|0)>0);if(+N(+o)<1.0e-13){z=p;break L3556}e=o<0.0;k=A+1|0;if((k|0)<11){A=k;B=e?B:p;C=e?C:o;D=e?p:D;E=e?o:E}else{z=p;break}}}}while(0);if((n|0)==2645){z=r-q*(y-r)/(x-q)}e=m;u=0.0;while(1){F=z*u+ +h[b+4096+(e<<3)>>3];if((e|0)>0){e=e-1|0;u=F}else{break}}h[b+3240>>3]=z;h[b+3248>>3]=F}else if((n|0)==2631){c[b+3276>>2]=m}}while(0);bM(b);ek(f);ek(g);ek(a);ek(j);do{if((c[b+5964>>2]|0)==0){if((c[b+5960>>2]|0)==0){G=1}else{break}i=d;return G|0}}while(0);G=0;i=d;return G|0}function cM(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,P=0.0,S=0.0,V=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0;g=a- +h[d+616>>3];a=b- +h[d+624>>3];L3579:do{if((c[d+3300>>2]|0)==0){b=+h[d+760>>3];do{if(b!=0.0){i=+h[d+768>>3];if(i==0.0){break}j=g*b;k=a*i;i=+h[d+48>>3];if(i==0.0){l=j;m=k;break L3579}n=i*3.141592653589793/180.0;i=+Q(+n);o=+R(+n);l=j*i-k*o;m=k*i+j*o;break L3579}}while(0);h[e>>3]=0.0;h[f>>3]=0.0;p=2;return p|0}else{l=g*+h[d+56>>3]+a*+h[d+64>>3];m=g*+h[d+72>>3]+a*+h[d+80>>3]}}while(0);q=(c[d+3304>>2]|0)==0|0;r=q^1;a=(90.0- +h[d+688+(q<<3)>>3])*3.141592653589793/180.0;g=+Q(+a);b=+R(+a);o=+h[d+3176>>3]*3.141592653589793/180.0;q=c[d+3276>>2]|0;s=c[d+5960>>2]|0;if((s|0)==0){t=l}else{t=l+ +cI(s,l,m)}s=c[d+5964>>2]|0;if((s|0)==0){u=m}else{u=m+ +cI(s,l,m)}m=+O(+(t*t+u*u));l=m/+h[d+3192>>3];if((q|0)<1){h[e>>3]=0.0;h[f>>3]=0.0;p=1;return p|0}L3599:do{switch(q|0){case 1:{v=(l- +h[d+4096>>3])/+h[d+4104>>3];break};case 2:{m=+h[d+4112>>3];j=+h[d+4104>>3];i=j*j-m*4.0*(+h[d+4096>>3]-l);if(i<0.0){h[e>>3]=0.0;h[f>>3]=0.0;p=1;return p|0}k=+O(+i);i=m*2.0;m=(k-j)/i;n=(-0.0-j-k)/i;i=m<n?m:n;if(i<-1.0e-13){w=m>n?m:n}else{w=i}if(w<0.0){if(w>=-1.0e-13){v=0.0;break L3599}h[e>>3]=0.0;h[f>>3]=0.0;p=1;return p|0}if(w<=3.141592653589793){v=w;break L3599}if(w<=3.141592653589893){v=3.141592653589793;break L3599}h[e>>3]=0.0;h[f>>3]=0.0;p=1;return p|0};default:{i=+h[d+4096>>3];n=+h[d+3240>>3];m=+h[d+3248>>3];if(l<i){if(l>=i+-1.0e-13){v=0.0;break L3599}h[e>>3]=0.0;h[f>>3]=0.0;p=1;return p|0}if(l>m){if(l<=m+1.0e-13){v=n;break L3599}h[e>>3]=0.0;h[f>>3]=0.0;p=1;return p|0}if((q|0)>-1){x=m;y=i;z=n;A=0.0;B=0.0;C=0}else{k=0.0-l;j=m;m=i;i=n;n=0.0;D=0.0;s=0;while(1){if((s|0)>=100){v=D;break L3599}E=(j-l)/(j-m);do{if(E<.1){F=.1}else{if(E<=.9){F=E;break}F=.9}}while(0);E=i-(i-n)*F;if(l>0.0){if(l<1.0e-13){v=E;break L3599}else{G=j;H=0.0;I=i;J=E}}else{if(k<1.0e-13){v=E;break L3599}else{G=0.0;H=m;I=E;J=n}}if(+N(+(I-J))<1.0e-13){v=E;break L3599}else{j=G;m=H;i=I;n=J;D=E;s=s+1|0}}}while(1){if((C|0)>=100){v=B;break L3599}D=(x-l)/(x-y);do{if(D<.1){K=.1}else{if(D<=.9){K=D;break}K=.9}}while(0);D=z-(z-A)*K;s=q;n=0.0;while(1){L=D*n+ +h[d+4096+(s<<3)>>3];if((s|0)>0){s=s-1|0;n=L}else{break}}if(L<l){if(l-L<1.0e-13){v=D;break L3599}else{M=x;P=L;S=z;V=D}}else{if(L-l<1.0e-13){v=D;break L3599}else{M=L;P=y;S=D;V=A}}if(+N(+(S-V))<1.0e-13){v=D;break}else{x=M;y=P;z=S;A=V;B=D;C=C+1|0}}}}}while(0);if(l==0.0){X=0.0}else{X=+W(+t,+(-0.0-u))}u=1.5707963267948966-v;v=+Q(+u);t=+R(+u);l=X-o;o=+Q(+l);X=+R(+l);B=g*v;V=b*t-B*o;if(+N(+V)<1.0e-5){Y=B*(1.0-o)- +Q(+(a+u))}else{Y=V}V=X*(-0.0-v);if(Y!=0.0|V!=0.0){Z=+W(+V,+Y)}else{Z=l+3.141592653589793}X=+h[d+688+(r<<3)>>3];B=X+Z*180.0/3.141592653589793;do{if(X<0.0){if(B<=0.0){_=B;break}_=B+-360.0}else{if(B>=0.0){_=B;break}_=B+360.0}}while(0);do{if(_>360.0){$=_+-360.0}else{if(_>=-360.0){$=_;break}$=_+360.0}}while(0);do{if(+aX(+l,3.141592653589793)==0.0){_=(u+a*o)*180.0/3.141592653589793;if(_>90.0){aa=180.0-_}else{aa=_}if(aa>=-90.0){ab=aa;break}ab=-180.0-aa}else{_=g*t+b*v*o;if(+N(+_)<=.99){ab=+U(+_)*180.0/3.141592653589793;break}B=+T(+(+O(+(V*V+Y*Y))));if(_<0.0){ab=B*-180.0/3.141592653589793;break}else{ab=B*180.0/3.141592653589793;break}}}while(0);h[e>>3]=$;h[f>>3]=ab;p=0;return p|0}function cN(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0,A=0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0,P=0.0,S=0.0,V=0.0,X=0,Y=0.0,Z=0.0,_=0.0;g=d+3304|0;i=(c[g>>2]|0)==0|0;j=(a- +h[d+688+((i^1)<<3)>>3])*3.141592653589793/180.0;a=b*3.141592653589793/180.0;b=+Q(+j);k=+R(+j);l=+Q(+a);m=+R(+a);n=(90.0- +h[d+688+(i<<3)>>3])*3.141592653589793/180.0;o=+Q(+n);p=+R(+n);q=+h[d+3176>>3];if(q==999.0){r=3.141592653589793}else{r=q*3.141592653589793/180.0}q=l*o;s=m*p-b*q;if(+N(+s)<1.0e-5){t=(1.0-b)*q- +Q(+(a+n))}else{t=s}s=k*(-0.0-l);if(t!=0.0|s!=0.0){u=+W(+s,+t)}else{u=j-3.141592653589793}k=r+u;do{if(k>3.141592653589793){v=k-6.283185307179586}else{if(k>=-3.141592653589793){v=k;break}v=k+6.283185307179586}}while(0);do{if(+aX(+j,3.141592653589793)==0.0){k=a+b*n;if(k>1.5707963267948966){w=3.141592653589793-k}else{w=k}if(w>=-1.5707963267948966){x=w;break}x=-3.141592653589793-w}else{k=m*o+b*l*p;if(+N(+k)<=.99){x=+U(+k);break}u=+T(+(+O(+(s*s+t*t))));if(k>=0.0){x=u;break}x=-0.0-u}}while(0);t=1.5707963267948966-x;x=(t*(t*(t*(t*(t*(t*(t*(t*(t*(t*0.0+ +h[d+4168>>3])+ +h[d+4160>>3])+ +h[d+4152>>3])+ +h[d+4144>>3])+ +h[d+4136>>3])+ +h[d+4128>>3])+ +h[d+4120>>3])+ +h[d+4112>>3])+ +h[d+4104>>3])+ +h[d+4096>>3])*+h[d+3192>>3];i=d+5960|0;y=d+5964|0;do{if((c[i>>2]|0)==0){if((c[y>>2]|0)!=0){z=2765;break}A=(c[g>>2]|0)==0;t=x*+R(+v);s=+Q(+v)*(-0.0-x);B=A?t:s;C=A?s:t}else{z=2765}}while(0);if((z|0)==2765){t=x*+R(+v);s=+Q(+v)*(-0.0-x);z=0;x=t;v=s;while(1){if((z|0)>=500){D=x;E=v;break}A=c[i>>2]|0;if((A|0)==0){F=0.0;G=1.0;H=x}else{p=x+ +cI(A,x,v);l=+cJ(c[i>>2]|0,x,v,1,0)+1.0;F=+cJ(c[i>>2]|0,x,v,0,1);G=l;H=p}p=H-t;A=c[y>>2]|0;if((A|0)==0){I=1.0;J=0.0;K=v}else{l=v+ +cI(A,x,v);b=+cJ(c[y>>2]|0,x,v,1,0);I=+cJ(c[y>>2]|0,x,v,0,1)+1.0;J=b;K=l}l=K-s;b=G*I-F*J;if(b==0.0){D=x;E=v;break}o=(F*l+I*(-0.0-p))/b;m=(p*J+G*(-0.0-l))/b;b=x+o;w=v+m;n=+N(+o);a=n>+N(+m)?o:m;m=+N(+a);o=+N(+p);n=o>+N(+l)?p:l;if(+N(+(m>+N(+n)?a:n))<2.8e-8){D=b;E=w;break}else{z=z+1|0;x=b;v=w}}z=(c[g>>2]|0)==0;B=z?D:E;C=z?E:D}if((c[d+3300>>2]|0)!=0){h[e>>3]=B*+h[d+88>>3]+C*+h[d+96>>3];h[f>>3]=B*+h[d+104>>3]+C*+h[d+112>>3];L=+h[e>>3];M=d+16|0;P=+h[M>>3];S=L+P;h[e>>3]=S;V=+h[f>>3];X=d+24|0;Y=+h[X>>3];Z=V+Y;h[f>>3]=Z;return 0}D=+h[d+48>>3];if(D!=0.0){E=D*3.141592653589793/180.0;D=+Q(+E);v=+R(+E);h[e>>3]=B*D+C*v;_=C*D-B*v}else{h[e>>3]=B;_=C}h[f>>3]=_;_=+h[d+32>>3];if(_!=0.0){h[e>>3]=+h[e>>3]/_}_=+h[d+40>>3];if(_==0.0){L=+h[e>>3];M=d+16|0;P=+h[M>>3];S=L+P;h[e>>3]=S;V=+h[f>>3];X=d+24|0;Y=+h[X>>3];Z=V+Y;h[f>>3]=Z;return 0}h[f>>3]=+h[f>>3]/_;L=+h[e>>3];M=d+16|0;P=+h[M>>3];S=L+P;h[e>>3]=S;V=+h[f>>3];X=d+24|0;Y=+h[X>>3];Z=V+Y;h[f>>3]=Z;return 0}function cO(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0.0,g=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0;f=(+h[c+224>>3]-(+h[c+176>>3]+a+-1.0+.5)*+h[c+192>>3])/1.0e3;a=((+h[c+184>>3]+b+-1.0+.5)*+h[c+200>>3]- +h[c+248>>3])/1.0e3;b=f*f;g=a*a;i=f*b;j=a*g;k=b+g;l=(j*+h[c+336>>3]+(i*+h[c+312>>3]+(k*+h[c+304>>3]+(g*+h[c+296>>3]+(+h[c+272>>3]+(f*+h[c+256>>3]+a*+h[c+264>>3])+b*+h[c+280>>3]+a*f*+h[c+288>>3])))+a*b*+h[c+320>>3]+g*f*+h[c+328>>3])+k*f*+h[c+344>>3]+k*k*f*+h[c+352>>3])/206264.8062470964;m=(i*+h[c+496>>3]+(j*+h[c+472>>3]+(k*+h[c+464>>3]+(b*+h[c+456>>3]+(+h[c+432>>3]+(a*+h[c+416>>3]+f*+h[c+424>>3])+g*+h[c+440>>3]+a*f*+h[c+448>>3])))+f*g*+h[c+480>>3]+b*a*+h[c+488>>3])+k*a*+h[c+504>>3]+k*k*a*+h[c+512>>3])/206264.8062470964;a=+h[c+160>>3];k=+S(+a);b=1.0-m*k;g=+W(+(l/+Q(+a)),+b);a=g+ +h[c+152>>3];if(a>=0.0){n=a;o=n/.01745329252;h[d>>3]=o;p=+Q(+g);q=m+k;r=q/b;s=p*r;t=+V(+s);u=t/.01745329252;h[e>>3]=u;return 0}n=a+6.28318530717959;o=n/.01745329252;h[d>>3]=o;p=+Q(+g);q=m+k;r=q/b;s=p*r;t=+V(+s);u=t/.01745329252;h[e>>3]=u;return 0}function cP(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0.0,g=0.0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,O=0.0,P=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0.0,ar=0.0,as=0.0;h[d>>3]=0.0;h[e>>3]=0.0;f=b*3.141592653589793/180.0;b=+R(+f);g=+Q(+f);i=c+160|0;f=+h[i>>3];if(f==0.0){j=+h[c+8>>3]*3.141592653589793/180.0;h[i>>3]=j;k=j}else{k=f}f=+R(+k);j=+Q(+k);i=c+152|0;k=+h[i>>3];if(k==0.0){l=+h[c+8>>3]*3.141592653589793/180.0;h[i>>3]=l;m=l}else{m=k}k=a*3.141592653589793/180.0-m;m=+Q(+k);a=b*f+g*j*m;if(a==0.0){n=1;return n|0}l=g*+R(+k)*206264.8062470964/a;k=(b*j-g*f*m)*206264.8062470964/a;a=+h[c+168>>3];if(a==0.0){n=1;return n|0}m=+h[c+256>>3];f=+h[c+264>>3];g=+h[c+272>>3];j=+h[c+280>>3];b=+h[c+288>>3];o=+h[c+296>>3];p=+h[c+304>>3];q=+h[c+312>>3];r=+h[c+320>>3];s=+h[c+328>>3];t=+h[c+336>>3];u=+h[c+344>>3];v=+h[c+352>>3];w=j*2.0;x=p*2.0;y=q*3.0;z=r*2.0;A=o*2.0;B=s*2.0;C=t*3.0;D=u*2.0;E=v*4.0;F=+h[c+416>>3];G=+h[c+424>>3];H=+h[c+432>>3];I=+h[c+440>>3];J=+h[c+448>>3];K=+h[c+456>>3];L=+h[c+464>>3];M=+h[c+472>>3];O=+h[c+480>>3];P=+h[c+488>>3];S=+h[c+496>>3];T=+h[c+504>>3];U=+h[c+512>>3];V=K*2.0;W=L*2.0;X=P*2.0;Y=S*3.0;Z=T*2.0;_=U*4.0;$=I*2.0;aa=M*3.0;ab=O*2.0;ac=k/a;i=0;ad=l/a;do{a=ac*ad;ae=ad*ad;af=ac*ac;ag=ac*ae;ah=af*ad;ai=af+ae;aj=ai*ai;ak=ad*ae;al=ac*af;am=ae*ae;an=af*af;ao=af*ae*6.0;ap=af*s+(ac*b+(m+ad*w)+ad*x+ae*y+a*z)+(af+ae*3.0)*u+(an+(am*5.0+ao))*v;aq=f+ad*b+ac*A+ac*x+ae*r+a*B+af*C+a*D+ai*a*E;ar=G+ac*J+ad*V+ad*W+af*O+a*X+ae*Y+a*Z+ai*a*_;as=ae*P+(ad*J+(F+ac*$)+ac*W+af*aa+a*ab)+(af*3.0+ae)*T+(am+(an*5.0+ao))*U;ao=g+(ad*m+ac*f)+ae*j+a*b+af*o+ai*p+ak*q+ag*r+ah*s+al*t+ai*ad*u+aj*ad*v-l;an=H+(ac*F+ad*G)+af*I+a*J+ae*K+ai*L+al*M+ah*O+ag*P+ak*S+ai*ac*T+aj*ac*U-k;aj=ap*as-aq*ar;ai=(as*(-0.0-ao)+aq*an)/aj;aq=(ao*ar+ap*(-0.0-an))/aj;ad=ad+ai;ac=ac+aq;if(+N(+ai)<5.0e-7){if(+N(+aq)<5.0e-7){break}}i=i+1|0;}while((i|0)<50);k=+h[c+192>>3];if(k==0.0){n=1;return n|0}U=+h[c+200>>3];if(U==0.0){n=1;return n|0}T=(ac*1.0e3+ +h[c+248>>3])/U;h[d>>3]=(+h[c+224>>3]-ad*1.0e3)/k- +h[c+176>>3]+1.0+-.5;k=T- +h[c+184>>3]+1.0+-.5;h[e>>3]=k;T=+h[d>>3];if(T<.5){n=-1;return n|0}if(T>+h[c+136>>3]+.5|k<.5){n=-1;return n|0}if(k>+h[c+144>>3]+.5){n=-1;return n|0}n=0;return n|0}function cQ(a,b){a=a|0;b=b|0;var d=0;ao(c[m>>2]|0,2792,(d=i,i=i+16|0,c[d>>2]=a,c[d+8>>2]=b,d)|0)|0;i=d;aF(-1|0)}function cR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0,F=0;d=i;i=i+88|0;e=d|0;f=d+40|0;g=d+64|0;j=c[a+16>>2]|0;k=c[a>>2]|0;l=c[a+4>>2]|0;m=c[a+12>>2]|0;n=c[a+20>>2]|0;do{if((j|0)!=0){o=j-1|0;if((o|0)!=0){p=f|0;q=e|0;r=o;do{q=q+8|0;h[q>>3]=1.0;p=p+4|0;c[p>>2]=0;r=r-1|0;}while((r|0)!=0)}r=c[a+24>>2]|0;if((r|0)!=0){p=n;q=g|0;o=r;while(1){r=o-1|0;c[q>>2]=c[p>>2];if((r|0)==0){break}else{p=p+4|0;q=q+4|0;o=r}}}o=g+(c[m>>2]<<2)|0;q=c[o>>2]|0;if((q|0)==0){break}c[o>>2]=q-1}}while(0);n=l+8|0;s=+h[l>>3];l=k+8|0;h[k>>3]=1.0;k=f|0;c[k>>2]=1;t=+h[b>>3];f=e|0;h[f>>3]=t;e=(c[a+8>>2]|0)-1|0;if((e|0)==0){u=s;i=d;return+u}if((j|0)>0){v=n;w=s;x=l;y=e;z=t}else{a=n;A=s;n=l;l=e;s=t;while(1){h[n>>3]=s;t=A+s*+h[a>>3];e=l-1|0;if((e|0)==0){u=t;break}a=a+8|0;A=t;n=n+8|0;l=e;s=+h[f>>3]}i=d;return+u}while(1){l=x+8|0;h[x>>3]=z;n=v+8|0;s=w+z*+h[v>>3];a=k;e=f;q=m;o=0;p=b;while(1){r=g+(c[q>>2]<<2)|0;B=c[r>>2]|0;c[r>>2]=B-1;C=c[a>>2]|0;if((B|0)!=0){D=2830;break}c[g+(c[q>>2]<<2)>>2]=C;c[a>>2]=0;h[e>>3]=1.0;B=o+1|0;if((B|0)<(j|0)){a=a+4|0;e=e+8|0;q=q+4|0;o=B;p=p+8|0}else{break}}do{if((D|0)==2830){D=0;c[a>>2]=C+1;A=+h[p>>3]*+h[e>>3];h[e>>3]=A;if((o|0)==0){break}else{E=o;F=e}do{F=F-8|0;E=E-1|0;h[F>>3]=A;}while((E|0)!=0)}}while(0);e=y-1|0;if((e|0)==0){u=s;break}v=n;w=s;x=l;y=e;z=+h[f>>3]}i=d;return+u}function cS(a){a=a|0;if((a|0)==0){return}ek(c[a+4>>2]|0);ek(c[a>>2]|0);ek(c[a+20>>2]|0);ek(c[a+12>>2]|0);ek(a);return}function cT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=i;i=i+528|0;g=f|0;h=f+512|0;j=ej(1,28)|0;k=j;if((j|0)==0){cQ(4744,3752);return 0}c[j+16>>2]=b;if((b|0)>4){l=g|0;aG(l|0,2880,(m=i,i=i+16|0,c[m>>2]=b,c[m+8>>2]=4,m)|0)|0;i=m;cQ(2672,l);return 0}if((b|0)==0){n=j+12|0}else{l=ei(b<<2)|0;o=j+12|0;c[o>>2]=l;if((l|0)==0){cQ(4744,2320);return 0}l=c[o>>2]|0;p=b;q=a;while(1){a=p-1|0;c[l>>2]=(c[q>>2]|0)-1;if((a|0)==0){n=o;break}else{l=l+4|0;p=a;q=q+4|0}}}c[j+24>>2]=e;L3849:do{if((e|0)==0){c[j+8>>2]=1;r=1}else{q=c[n>>2]|0;p=e<<2;l=ei(p)|0;c[j+20>>2]=l;if((l|0)==0){cQ(4744,2096);return 0}ey(h|0,0,p|0);L3855:do{if((b|0)>0){p=0;while(1){l=c[q+(p<<2)>>2]|0;if((l|0)>=(e|0)){break}o=h+(l<<2)|0;c[o>>2]=(c[o>>2]|0)+1;p=p+1|0;if((p|0)>=(b|0)){break L3855}}cQ(1832,8600);return 0}}while(0);q=j+8|0;c[q>>2]=1;if((e|0)<=0){r=1;break}p=c[j+20>>2]|0;o=d;l=0;a=1;while(1){s=o+4|0;t=c[o>>2]|0;c[p+(l<<2)>>2]=t;if((t|0)>10){break}u=c[h+(l<<2)>>2]|0;if((t|0)==0){v=1;w=1}else{x=t;y=1;z=1;while(1){A=_(y,x+u|0)|0;B=x-1|0;C=_(z,x)|0;if((B|0)==0){v=A;w=C;break}else{x=B;y=A;z=C}}}z=_(a,(v|0)/(w|0)|0)|0;c[q>>2]=z;y=l+1|0;if((y|0)<(e|0)){o=s;l=y;a=z}else{r=z;break L3849}}a=g|0;aG(a|0,1024,(m=i,i=i+16|0,c[m>>2]=t,c[m+8>>2]=10,m)|0)|0;i=m;cQ(2672,a);return 0}}while(0);m=ei(r<<3)|0;c[j>>2]=m;if((m|0)==0){cQ(4744,6024);return 0}m=ej(r,8)|0;c[j+4>>2]=m;if((m|0)==0){cQ(4744,5576);return 0}else{i=f;return k|0}return 0}function cU(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0.0,L=0,M=0.0,N=0,O=0,P=0,Q=0,R=0.0,S=0,T=0,U=0,V=0,W=0;j=i;i=i+32|0;k=j|0;l=(b|0)!=0;m=(g|0)==0;if(m&(l^1)){cQ(5160,4952)}n=c[a+8>>2]|0;o=c[a+16>>2]|0;p=_(n,n)|0;q=c[a>>2]|0;r=ej(p,8)|0;p=r;if((r|0)==0){cQ(4744,4696)}s=ej(n,8)|0;t=s;if((s|0)==0){cQ(4744,4568)}if((f|0)!=0){u=(n|0)==0;v=(o|0)>0;w=k|0;x=g;g=b;b=e;e=d;d=f;while(1){f=d-1|0;do{if(l){if(v){y=g;z=0;while(1){h[k+(z<<3)>>3]=+h[y>>3];A=z+1|0;if((A|0)<(o|0)){y=y+8|0;z=A}else{break}}B=g+(o<<3)|0}else{B=g}+cR(a,w);if(m|u){C=B;D=x;break}else{E=x;F=q;G=n}while(1){z=G-1|0;h[E>>3]=+h[F>>3];if((z|0)==0){break}else{E=E+8|0;F=F+8|0;G=z}}C=B;D=x+(n<<3)|0}else{if(u){C=g;D=x;break}else{H=x;I=q;J=n}while(1){z=J-1|0;h[I>>3]=+h[H>>3];if((z|0)==0){break}else{H=H+8|0;I=I+8|0;J=z}}C=g;D=x+(n<<3)|0}}while(0);if((b|0)==0){K=1.0;L=0}else{K=+h[b>>3];L=b+8|0}z=e+8|0;M=+h[e>>3];if(!u){y=q;A=t;N=p;O=n;while(1){P=O-1|0;Q=y+8|0;R=K*+h[y>>3];S=A+8|0;h[A>>3]=+h[A>>3]+M*R;T=q;U=N;V=n;while(1){W=V-1|0;h[U>>3]=+h[U>>3]+R*+h[T>>3];if((W|0)==0){break}else{T=T+8|0;U=U+8|0;V=W}}if((P|0)==0){break}else{y=Q;A=S;N=N+(n<<3)|0;O=P}}}if((f|0)==0){break}else{x=D;g=C;b=L;e=z;d=f}}}cV(p,t,n);ek(r);if((n|0)==0){ek(s);i=j;return}r=c[a+4>>2]|0;a=t;t=n;while(1){n=t-1|0;h[r>>3]=+h[a>>3];if((n|0)==0){break}else{r=r+8|0;a=a+8|0;t=n}}ek(s);i=j;return}function cV(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;if((cW(a,b,c)|0)==0){return}d=c<<3;e=ei(_(d,c)|0)|0;if((e|0)==0){cQ(4744,4296)}f=ei(d)|0;if((f|0)==0){cQ(4744,4120)}cX(a,b,c,c,e,f);ek(e);ek(f);return}function cW(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,i=0,j=0,k=0,l=0.0,m=0,n=0.0,o=0,p=0,q=0.0,r=0,s=0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0;d=ei(c<<3)|0;e=d;if((d|0)==0){cQ(4744,4048);return 0}f=(c|0)>0;do{if(f){g=0;L3939:do{i=_(g,c)|0;j=e+(g<<3)|0;if((g|0)>0){k=g;do{l=+h[a+(k+i<<3)>>3];m=_(k,c)|0;n=l;o=g;do{o=o-1|0;n=n- +h[a+(o+i<<3)>>3]*+h[a+(o+m<<3)>>3];}while((o|0)>0);if((g|0)==(k|0)){if(n<=0.0){p=2931;break L3939}h[j>>3]=+O(+n)}else{l=n/+h[j>>3];h[a+((_(k,c)|0)+g<<3)>>3]=l}k=k+1|0;}while((k|0)<(c|0))}else{k=g;do{l=+h[a+(k+i<<3)>>3];if((g|0)==(k|0)){if(l<=0.0){p=2931;break L3939}h[j>>3]=+O(+l)}else{q=l/+h[j>>3];h[a+((_(k,c)|0)+g<<3)>>3]=q}k=k+1|0;}while((k|0)<(c|0))}g=g+1|0;}while((g|0)<(c|0));if((p|0)==2931){ek(d);r=-1;return r|0}if(f){s=0}else{break}do{g=b+(s<<3)|0;q=+h[g>>3];if((s|0)>0){k=_(s,c)|0;l=q;j=s;while(1){i=j-1|0;t=l- +h[a+(i+k<<3)>>3]*+h[b+(i<<3)>>3];if((i|0)>0){l=t;j=i}else{u=t;break}}}else{u=q}h[g>>3]=u/+h[e+(s<<3)>>3];s=s+1|0;}while((s|0)<(c|0));if(f){v=c}else{break}while(1){j=v-1|0;k=b+(j<<3)|0;l=+h[k>>3];if((v|0)<(c|0)){t=l;i=v;while(1){w=+h[a+((_(i,c)|0)+j<<3)>>3];x=t-w*+h[b+(i<<3)>>3];o=i+1|0;if((o|0)<(c|0)){t=x;i=o}else{y=x;break}}}else{y=l}h[k>>3]=y/+h[e+(j<<3)>>3];if((j|0)>0){v=j}else{break}}}}while(0);ek(d);r=0;return r|0}function cX(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0.0,z=0,A=0,B=0.0,C=0,D=0.0,E=0.0,F=0,G=0.0,H=0,I=0.0,J=0.0,K=0.0,L=0,M=0,P=0,Q=0,R=0.0,S=0,T=0,U=0,V=0,W=0,X=0.0,Y=0.0,Z=0.0,$=0.0,aa=0,ab=0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0,ai=0,aj=0,ak=0,al=0.0,am=0,an=0,ao=0,ap=0.0,aq=0,ar=0,as=0.0,at=0,au=0,av=0,aw=0,ax=0.0,ay=0,az=0,aA=0.0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0.0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0.0,aU=0.0,aV=0.0,aW=0.0,aX=0.0,aY=0.0,aZ=0.0,a_=0.0,a$=0.0,a0=0.0,a1=0.0,a2=0.0,a3=0.0,a4=0.0,a5=0.0,a6=0.0,a7=0.0,a8=0.0,a9=0,ba=0.0,bb=0,bc=0,bd=0,be=0.0,bf=0.0,bg=0.0,bh=0,bi=0,bj=0,bk=0.0;if((c|0)<(d|0)){cQ(3928,3816)}g=d<<3;i=ei(g)|0;j=i;if((i|0)==0){cQ(4744,3656)}k=ei(g)|0;g=k;if((k|0)==0){cQ(4744,3536)}l=(d|0)>0;L3990:do{if(l){m=c+1|0;n=0;o=0.0;p=0.0;q=0.0;while(1){r=n+1|0;s=d-r|0;t=j+(n<<3)|0;h[t>>3]=p*q;u=c-n|0;L3994:do{if((u|0)>0){v=a+((_(n,m)|0)<<3)|0;w=(n|0)==(c|0);if(w){x=0.0;y=0.0;break}else{z=v;A=u;B=0.0}while(1){C=A-1|0;D=B+ +N(+(+h[z>>3]));if((C|0)==0){break}else{z=z+8|0;A=C;B=D}}if(D==0.0){x=D;y=0.0;break}if(w){E=0.0}else{C=v;F=u;G=0.0;while(1){H=F-1|0;I=+h[C>>3]/D;h[C>>3]=I;J=G+I*I;if((H|0)==0){E=J;break}else{C=C+8|0;F=H;G=J}}}G=+h[v>>3];J=+N(+(+O(+E)));if(G<0.0){K=-0.0-J}else{K=J}J=-0.0-K;I=G*J-E;h[v>>3]=G+K;if((r|0)!=(d|0)){F=a+((_(r,c)|0)+n<<3)|0;C=s;while(1){H=C-1|0;L4011:do{if(!w){L=v;M=F;P=u;G=0.0;while(1){Q=P-1|0;R=G+ +h[M>>3]*+h[L>>3];if((Q|0)==0){break}L=L+8|0;M=M+8|0;P=Q;G=R}G=R/I;if(w){break}else{S=v;T=F;U=u}while(1){P=U-1|0;h[T>>3]=+h[T>>3]+G*+h[S>>3];if((P|0)==0){break L4011}S=S+8|0;T=T+8|0;U=P}}}while(0);if((H|0)==0){break}else{F=F+(c<<3)|0;C=H}}}if(w){x=D;y=J;break}else{V=v;W=u}while(1){C=W-1|0;h[V>>3]=D*+h[V>>3];if((C|0)==0){x=D;y=J;break L3994}V=V+8|0;W=C}}else{x=0.0;y=0.0}}while(0);J=y*x;u=f+(n<<3)|0;h[u>>3]=J;do{if((n|0)>=(c|0)|(r|0)==(d|0)){X=0.0;Y=0.0;Z=J}else{v=_(r,c)|0;w=a+(v+n<<3)|0;C=w;F=s;I=0.0;while(1){P=F-1|0;$=I+ +N(+(+h[C>>3]));if((P|0)==0){break}else{C=C+(c<<3)|0;F=P;I=$}}if($!=0.0){aa=w;ab=s;ac=0.0}else{X=$;Y=0.0;Z=J;break}while(1){F=ab-1|0;I=+h[aa>>3]/$;h[aa>>3]=I;ad=ac+I*I;if((F|0)==0){break}else{aa=aa+(c<<3)|0;ab=F;ac=ad}}I=+h[w>>3];G=+N(+(+O(+ad)));if(I<0.0){ae=-0.0-G}else{ae=G}G=-0.0-ae;af=I*G-ad;ag=I+ae;h[w>>3]=ag;F=j+(r<<3)|0;C=w;P=F;M=s;I=ag;while(1){L=M-1|0;h[P>>3]=I/af;Q=C+(c<<3)|0;if((L|0)==0){break}C=Q;P=P+8|0;M=L;I=+h[Q>>3]}if((r|0)==(c|0)){ah=w;ai=s}else{M=a+(v+r<<3)|0;P=c-r|0;while(1){C=P-1|0;Q=w;L=M;aj=s;I=0.0;while(1){ak=aj-1|0;al=I+ +h[L>>3]*+h[Q>>3];if((ak|0)==0){am=M;an=F;ao=s;break}Q=Q+(c<<3)|0;L=L+(c<<3)|0;aj=ak;I=al}while(1){aj=ao-1|0;h[am>>3]=+h[am>>3]+al*+h[an>>3];if((aj|0)==0){break}else{am=am+(c<<3)|0;an=an+8|0;ao=aj}}if((C|0)==0){ah=w;ai=s;break}else{M=M+8|0;P=C}}}while(1){P=ai-1|0;h[ah>>3]=$*+h[ah>>3];if((P|0)==0){break}ah=ah+(c<<3)|0;ai=P}X=$;Y=G;Z=+h[u>>3]}}while(0);J=+N(+Z);I=J+ +N(+(+h[t>>3]));ap=o>I?o:I;if((r|0)<(d|0)){n=r;o=ap;p=Y;q=X}else{break}}n=d-1|0;if(l){aq=d;ar=0;as=Y;at=n}else{break}while(1){do{if((at|0)<(n|0)){if(as!=0.0){m=a+(at+(_(aq,c)|0)<<3)|0;u=e+((_(at,d)|0)+aq<<3)|0;s=e+((_(aq,d)|0)+aq<<3)|0;q=+h[m>>3];p=as*q;P=(ar|0)==0;if(P){break}else{au=m;av=u;aw=ar;ax=q}while(1){M=aw-1|0;h[av>>3]=ax/p;w=au+(c<<3)|0;if((M|0)==0){break}au=w;av=av+8|0;aw=M;ax=+h[w>>3]}if(P){break}else{ay=s;az=ar}while(1){w=az-1|0;M=m;F=ay;v=ar;p=0.0;while(1){aj=v-1|0;aA=p+ +h[M>>3]*+h[F>>3];if((aj|0)==0){aB=u;aC=ay;aD=ar;break}M=M+(c<<3)|0;F=F+8|0;v=aj;p=aA}while(1){v=aD-1|0;h[aC>>3]=+h[aC>>3]+aA*+h[aB>>3];if((v|0)==0){break}else{aB=aB+8|0;aC=aC+8|0;aD=v}}if((w|0)==0){break}else{ay=ay+(d<<3)|0;az=w}}}if((ar|0)==0){break}u=_(at,d)|0;m=e+(at+(_(aq,d)|0)<<3)|0;s=e+(u+aq<<3)|0;u=ar;while(1){P=u-1|0;h[s>>3]=0.0;h[m>>3]=0.0;if((P|0)==0){break}else{m=m+(d<<3)|0;s=s+8|0;u=P}}}}while(0);h[e+((_(at,d)|0)+at<<3)>>3]=1.0;if((at|0)>0){aq=at;ar=d-at|0;as=+h[j+(at<<3)>>3];at=at-1|0}else{break}}if(!l){break}n=~d;r=~c;t=(n|0)>(r|0)?n:r;r=a+((_(-2-t|0,c)|0)-2-t<<3)|0;n=-8-(c<<3)|0;u=(t+c<<3)+16|0;t=d;s=0;while(1){m=r+(_(n,s)|0)|0;P=u+(s<<3)|0;v=t-1|0;F=d-t|0;M=c-v|0;p=+h[f+(v<<3)>>3];C=(_(v,c)|0)+v|0;aj=a+(C<<3)|0;L=a+(C+c<<3)|0;C=(t|0)==(d|0);if(!C){Q=L;H=F;while(1){ak=H-1|0;h[Q>>3]=0.0;if((ak|0)==0){break}else{Q=Q+(c<<3)|0;H=ak}}}L4087:do{if(p!=0.0){G=1.0/p;if(!C){H=M-1|0;Q=(H|0)==0;ak=(v|0)==(c|0);aE=L;aF=F;while(1){aG=aF-1|0;if(Q){aH=0.0}else{aI=aj;aJ=aE;q=0.0;aK=H;while(1){aL=aI+8|0;aM=aJ+8|0;o=q+ +h[aL>>3]*+h[aM>>3];aN=aK-1|0;if((aN|0)==0){aH=o;break}else{aI=aL;aJ=aM;q=o;aK=aN}}}q=+h[aj>>3];o=G*(aH/q);L4097:do{if(!ak){aK=aj;aJ=aE;aI=M;I=q;while(1){w=aI-1|0;aN=aK+8|0;h[aJ>>3]=+h[aJ>>3]+o*I;if((w|0)==0){break L4097}aK=aN;aJ=aJ+8|0;aI=w;I=+h[aN>>3]}}}while(0);if((aG|0)==0){break}else{aE=aE+(c<<3)|0;aF=aG}}}if((v|0)==(c|0)){break}else{aO=aj;aP=M}while(1){aF=aP-1|0;h[aO>>3]=G*+h[aO>>3];if((aF|0)==0){break L4087}aO=aO+8|0;aP=aF}}else{if((v|0)==(c|0)){break}ey(m|0,0,P|0)}}while(0);h[aj>>3]=+h[aj>>3]+1.0;if((v|0)>0){t=v;s=s+1|0}else{break}}if(!l){break}s=(c|0)==0;t=0;u=d;L4111:while(1){n=u-1|0;r=f+(n<<3)|0;P=u-2|0;m=f+(P<<3)|0;M=j+(P<<3)|0;F=j+(n<<3)|0;L=t;C=0;while(1){aF=L;aE=n;while(1){if((aE|0)<=-1){aQ=aF;aR=3040;break}ak=aE-1|0;if(ap+ +N(+(+h[j+(aE<<3)>>3]))==ap){aS=ak;break}if(ap+ +N(+(+h[f+(ak<<3)>>3]))==ap){aQ=ak;aR=3040;break}else{aF=ak;aE=ak}}L4119:do{if((aR|0)==3040){aR=0;aF=a+((_(aQ,c)|0)<<3)|0;if((aE|0)>(n|0)){aS=aQ;break}ak=a+((_(aE,c)|0)<<3)|0;p=1.0;H=aE;while(1){G=p*+h[j+(H<<3)>>3];o=+N(+G);if(ap+o==ap){aS=aQ;break L4119}Q=f+(H<<3)|0;q=+h[Q>>3];I=+N(+q);do{if(o>I){J=I/o;aT=o*+O(+(J*J+1.0))}else{if(q==0.0){aT=0.0;break}J=o/I;aT=I*+O(+(J*J+1.0))}}while(0);h[Q>>3]=aT;I=1.0/aT;o=q*I;J=I*(-0.0-G);if(!s){aI=aF;aJ=ak;aK=c;while(1){aN=aK-1|0;I=+h[aJ>>3];af=+h[aI>>3];h[aI>>3]=J*I+o*af;h[aJ>>3]=o*I-J*af;if((aN|0)==0){break}else{aI=aI+8|0;aJ=aJ+8|0;aK=aN}}}aK=H+1|0;if((aK|0)>(n|0)){aS=aQ;break L4119}ak=ak+(c<<3)|0;p=J;H=aK}}}while(0);aU=+h[r>>3];if((aE|0)==(n|0)){aR=3052;break}if((C|0)==99){break L4111}p=+h[f+(aE<<3)>>3];o=+h[m>>3];G=+h[M>>3];q=+h[F>>3];af=((o-aU)*(aU+o)+(G-q)*(G+q))/(o*q*2.0);G=+N(+af);if(G>1.0){I=1.0/G;aV=G*+O(+(I*I+1.0))}else{aV=+O(+(G*G+1.0))}G=+N(+aV);if(af<0.0){aW=-0.0-G}else{aW=G}G=((p-aU)*(aU+p)+q*(o/(af+aW)-q))/p;if((aE|0)>(P|0)){aX=G;aY=p}else{H=_(aE,c)|0;ak=a+(H<<3)|0;H=e+((_(aE,d)|0)<<3)|0;aF=aE;q=1.0;af=G;G=1.0;o=p;while(1){aG=aF+1|0;p=+h[j+(aG<<3)>>3];I=+h[f+(aG<<3)>>3];ag=G*p;aZ=q*p;p=+N(+af);a_=+N(+ag);do{if(p>a_){a$=a_/p;a0=p*+O(+(a$*a$+1.0))}else{if(ag==0.0){a0=0.0;break}a$=p/a_;a0=a_*+O(+(a$*a$+1.0))}}while(0);h[j+(aF<<3)>>3]=a0;a_=af/a0;p=ag/a0;a$=o*a_+aZ*p;a1=aZ*a_-o*p;a2=I*p;a3=I*a_;aK=H+(d<<3)|0;aJ=aK;aI=H;Q=d;while(1){aN=Q-1|0;a4=+h[aJ>>3];a5=+h[aI>>3];h[aI>>3]=p*a4+a_*a5;h[aJ>>3]=a_*a4-p*a5;if((aN|0)==0){break}else{aJ=aJ+8|0;aI=aI+8|0;Q=aN}}I=+N(+a$);aZ=+N(+a2);do{if(I>aZ){ag=aZ/I;a6=I*+O(+(ag*ag+1.0));aR=3077}else{if(a2!=0.0){ag=I/aZ;a6=aZ*+O(+(ag*ag+1.0));aR=3077;break}else{h[f+(aF<<3)>>3]=0.0;a7=p;a8=a_;break}}}while(0);do{if((aR|0)==3077){aR=0;h[f+(aF<<3)>>3]=a6;if(a6==0.0){a7=p;a8=a_;break}aZ=1.0/a6;a7=a2*aZ;a8=a$*aZ}}while(0);a$=a1*a8+a3*a7;a2=a3*a8-a1*a7;Q=ak+(c<<3)|0;if(!s){aI=Q;aJ=ak;aN=c;while(1){w=aN-1|0;a_=+h[aI>>3];p=+h[aJ>>3];h[aJ>>3]=a7*a_+a8*p;h[aI>>3]=a8*a_-a7*p;if((w|0)==0){break}else{aI=aI+8|0;aJ=aJ+8|0;aN=w}}}if((aG|0)>(P|0)){aX=a$;aY=a2;break}else{ak=Q;H=aK;aF=aG;q=a8;af=a$;G=a7;o=a2}}}h[j+(aE<<3)>>3]=0.0;h[F>>3]=aX;h[r>>3]=aY;aF=C+1|0;if((aF|0)<100){L=P;C=aF}else{a9=P;break}}do{if((aR|0)==3052){aR=0;if(aU>=0.0){a9=aS;break}h[r>>3]=-0.0-aU;P=e+((_(n,d)|0)<<3)|0;C=d;while(1){L=C-1|0;h[P>>3]=-0.0- +h[P>>3];if((L|0)==0){a9=aS;break}else{P=P+8|0;C=L}}}}while(0);if((n|0)>0){t=a9;u=n}else{break L3990}}cQ(3400,3816)}}while(0);a9=(d|0)==0;do{if(!a9){aS=f;aR=d;aU=0.0;while(1){j=aR-1|0;aY=+h[aS>>3];ba=aY>aU?aY:aU;if((j|0)==0){break}else{aS=aS+8|0;aR=j;aU=ba}}aU=ba*1.0e-11;if(a9){break}else{bb=f;bc=d}while(1){aR=bc-1|0;if(+h[bb>>3]<aU){h[bb>>3]=0.0}if((aR|0)==0){break}else{bb=bb+8|0;bc=aR}}if(a9){break}aR=(c|0)==0;aS=f;j=a;aQ=g;aP=d;while(1){aO=aP-1|0;aU=+h[aS>>3];if(aU!=0.0){if(aR){bd=j;be=0.0}else{at=j;ar=b;aY=0.0;aq=c;while(1){az=aq-1|0;bf=aY+ +h[at>>3]*+h[ar>>3];if((az|0)==0){break}else{at=at+8|0;ar=ar+8|0;aY=bf;aq=az}}bd=j+(c<<3)|0;be=bf}bg=be/aU;bh=bd}else{bg=0.0;bh=j+(c<<3)|0}h[aQ>>3]=bg;if((aO|0)==0){break}else{aS=aS+8|0;j=bh;aQ=aQ+8|0;aP=aO}}}}while(0);if(l){bi=e;bj=0}else{ek(k);ek(i);return}while(1){e=bi;l=g;bh=d;bg=0.0;while(1){c=bh-1|0;bk=bg+ +h[e>>3]*+h[l>>3];if((c|0)==0){break}e=e+(d<<3)|0;l=l+8|0;bh=c;bg=bk}h[b+(bj<<3)>>3]=bk;bh=bj+1|0;if((bh|0)<(d|0)){bi=bi+8|0;bj=bh}else{break}}ek(k);ek(i);return}function cY(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=i;i=i+8|0;g=f|0;h=g;j=i;i=i+9|0;i=i+7>>3<<3;c[g>>2]=5260110;c[g+4>>2]=5459015;g=e+4|0;a[g]=0;k=j|0;a[k]=0;j=e+20|0;c[j>>2]=-1;l=e+24|0;c[l>>2]=-1;m=e+28|0;c[m>>2]=-1;do{if((b|0)>0){n=e+8|0;o=e+13|0;p=o;q=0;r=0;L4215:while(1){s=d+(q*9|0)|0;do{if((a[d+(q*9|0)+4|0]|0)==45){t=d+(q*9|0)+5|0;v=c[48]|0;w=0;while(1){if((w|0)>=(v|0)){break}if((aj(t|0,88+(w<<2)|0,3)|0)==0){break}else{w=w+1|0}}if((w|0)==(v|0)){x=0;while(1){if((x|0)>=2){break}if((aj(t|0,h+(x<<2)|0,3)|0)==0){break}else{x=x+1|0}}if((x|0)==2){y=r;break}}if((a[g]|0)!=0){if((aj(s|0,k|0,8)|0)!=0|(r|0)==0){z=1;A=3141;break L4215}c[r>>2]=q;a[k]=0;y=r;break}aG(g|0,5984,(v=i,i=i+8|0,c[v>>2]=t,v)|0)|0;i=v;w=s|0;if((aj(w|0,5552,4)|0)==0){c[j>>2]=q;a[n]=a[5144]|0;a[n+1|0]=a[5145|0]|0;a[n+2|0]=a[5146|0]|0;u=4408644;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;aG(k|0,4688,(v=i,i=i+8|0,c[v>>2]=g,v)|0)|0;i=v;y=l;break}if((aj(w|0,4560,4)|0)==0){c[l>>2]=q;a[n]=a[5144]|0;a[n+1|0]=a[5145|0]|0;a[n+2|0]=a[5146|0]|0;u=4408644;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;aG(k|0,4488,(v=i,i=i+8|0,c[v>>2]=g,v)|0)|0;i=v;y=j;break}B=d+(q*9|0)+1|0;if((aj(B|0,4424,3)|0)==0){c[j>>2]=q;C=a[w]|0;aG(n|0,4368,(v=i,i=i+8|0,c[v>>2]=C,v)|0)|0;i=v;C=a[w]|0;aG(o|0,4288,(v=i,i=i+8|0,c[v>>2]=C,v)|0)|0;i=v;aG(k|0,4112,(v=i,i=i+16|0,c[v>>2]=o,c[v+8>>2]=g,v)|0)|0;i=v;y=l;break}if((aj(B|0,4040,3)|0)==0){c[l>>2]=q;C=a[w]|0;aG(n|0,4368,(v=i,i=i+8|0,c[v>>2]=C,v)|0)|0;i=v;C=a[w]|0;aG(o|0,4288,(v=i,i=i+8|0,c[v>>2]=C,v)|0)|0;i=v;aG(k|0,4112,(v=i,i=i+16|0,c[v>>2]=n,c[v+8>>2]=g,v)|0)|0;i=v;y=j;break}C=d+(q*9|0)+2|0;if((aj(C|0,3920,2)|0)==0){c[j>>2]=q;D=a[w]|0;E=a[B]|0;aG(n|0,3808,(v=i,i=i+16|0,c[v>>2]=D,c[v+8>>2]=E,v)|0)|0;i=v;E=a[w]|0;D=a[B]|0;aG(o|0,3648,(v=i,i=i+16|0,c[v>>2]=E,c[v+8>>2]=D,v)|0)|0;i=v;aG(k|0,4112,(v=i,i=i+16|0,c[v>>2]=o,c[v+8>>2]=g,v)|0)|0;i=v;y=l;break}if((aj(C|0,3528,2)|0)!=0){z=1;A=3139;break L4215}c[l>>2]=q;C=a[B]|0;aG(n|0,3808,(v=i,i=i+16|0,c[v>>2]=a[w]|0,c[v+8>>2]=C,v)|0)|0;i=v;C=a[B]|0;aG(o|0,3648,(v=i,i=i+16|0,c[v>>2]=a[w]|0,c[v+8>>2]=C,v)|0)|0;i=v;aG(k|0,4112,(v=i,i=i+16|0,c[v>>2]=n,c[v+8>>2]=g,v)|0)|0;i=v;y=j}else{if((a4(s|0,960)|0)!=0){y=r;break}if((c[m>>2]|0)!=-1){z=1;A=3140;break L4215}c[m>>2]=q;y=r}}while(0);s=q+1|0;if((s|0)<(b|0)){q=s;r=y}else{A=3133;break}}if((A|0)==3133){if((a[k]|0)==0){break}else{z=1}i=f;return z|0}else if((A|0)==3139){i=f;return z|0}else if((A|0)==3140){i=f;return z|0}else if((A|0)==3141){i=f;return z|0}}}while(0);if((aj(g|0,3392,3)|0)==0){A=g;u=4998739;a[A]=u&255;u=u>>8;a[A+1|0]=u&255;u=u>>8;a[A+2|0]=u&255;u=u>>8;a[A+3|0]=u&255;F=137}else{F=(a[g]|0)==0?999:137}c[e>>2]=F;z=0;i=f;return z|0}function cZ(b,d,e,f,g,i,j,k,l,m,n){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0.0,y=0.0,z=0.0;o=d|0;p=m+4|0;do{if((c[o>>2]|0)!=137){if((cY(c[p>>2]|0,b,d)|0)==0){break}else{q=1}return q|0}}while(0);b=c[p>>2]|0;if((b|0)>0){r=d+20|0;s=d+24|0;t=0;v=b;while(1){do{if((t|0)==(c[r>>2]|0)){w=v}else{if((t|0)==(c[s>>2]|0)){w=v;break}h[l+(t<<3)>>3]=+h[e+(t<<3)>>3]- +h[f+(t<<3)>>3];w=c[p>>2]|0}}while(0);b=t+1|0;if((b|0)<(w|0)){t=b;v=w}else{break}}}do{if((c[o>>2]|0)!=999){w=d+4|0;do{if((a4(w|0,3240)|0)==0){v=g+16|0;if(+h[v>>3]==0.0){q=2;return q|0}else{t=w;u=5130579;a[t]=u&255;u=u>>8;a[t+1|0]=u&255;u=u>>8;a[t+2|0]=u&255;u=u>>8;a[t+3|0]=u&255;h[k+40>>3]=0.0;x=+d9(+h[v>>3]);h[k+48>>3]=x/+ea(+h[v>>3]);v=k+4|0;c[v>>2]=c[v>>2]>>31;break}}}while(0);v=d+20|0;t=c[v>>2]|0;p=d+24|0;f=c[p>>2]|0;s=c4(w,+h[e+(t<<3)>>3],+h[e+(f<<3)>>3],g,i,j,k,l+(t<<3)|0,l+(f<<3)|0)|0;if((s|0)!=0){q=s;return q|0}s=d+28|0;f=c[s>>2]|0;if((f|0)==-1){break}x=+h[k+24>>3];if(x==0.0){y=90.0}else{y=x*3.141592653589793*.5}t=l+(c[p>>2]<<3)|0;x=+h[t>>3];if(x<y*-.5){h[t>>3]=y+x;h[l+(c[s>>2]<<3)>>3]=5.0;break}z=y*.5;if(x>z){h[t>>3]=x-y;h[l+(c[s>>2]<<3)>>3]=0.0;break}t=l+(c[v>>2]<<3)|0;x=+h[t>>3];if(x>y*2.5){h[t>>3]=x-y*3.0;h[l+(c[s>>2]<<3)>>3]=4.0;break}if(x>y*1.5){h[t>>3]=x-y*2.0;h[l+(c[s>>2]<<3)>>3]=3.0;break}if(x>z){h[t>>3]=x-y;h[l+(c[s>>2]<<3)>>3]=2.0;break}else{h[l+(f<<3)>>3]=1.0;break}}}while(0);q=(c1(l,m,n)|0)==0?0:4;return q|0}function c_(b,d,e,f,g,i,j,k,l,m,n){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,v=0.0,w=0.0;o=d|0;do{if((c[o>>2]|0)!=137){if((cY(c[f+4>>2]|0,b,d)|0)==0){break}else{p=1}return p|0}}while(0);if((c2(e,f,g)|0)!=0){p=4;return p|0}e=f+4|0;f=c[e>>2]|0;if((f|0)>0){b=d+20|0;q=d+24|0;r=0;s=f;while(1){do{if((r|0)==(c[b>>2]|0)){t=s}else{if((r|0)==(c[q>>2]|0)){t=s;break}h[n+(r<<3)>>3]=+h[g+(r<<3)>>3]+ +h[l+(r<<3)>>3];t=c[e>>2]|0}}while(0);f=r+1|0;if((f|0)<(t|0)){r=f;s=t}else{break}}}do{if((c[o>>2]|0)!=999){t=c[d+28>>2]|0;L4330:do{if((t|0)!=-1){v=+h[g+(t<<3)>>3];s=~~(v+.5);if(+N(+(v- +(s|0)))>1.0e-10){p=3;return p|0}v=+h[i+24>>3];if(v==0.0){w=90.0}else{w=v*3.141592653589793*.5}switch(s|0){case 5:{s=g+(c[d+24>>2]<<3)|0;h[s>>3]=+h[s>>3]-w;break L4330;break};case 2:{s=g+(c[d+20>>2]<<3)|0;h[s>>3]=w+ +h[s>>3];break L4330;break};case 4:{s=g+(c[d+20>>2]<<3)|0;h[s>>3]=w*3.0+ +h[s>>3];break L4330;break};case 0:{s=g+(c[d+24>>2]<<3)|0;h[s>>3]=w+ +h[s>>3];break L4330;break};case 3:{s=g+(c[d+20>>2]<<3)|0;h[s>>3]=w*2.0+ +h[s>>3];break L4330;break};case 1:{break L4330;break};default:{p=3;return p|0}}}}while(0);t=d+4|0;do{if((a4(t|0,3240)|0)==0){s=m+16|0;if(+h[s>>3]==0.0){p=2;return p|0}else{r=t;u=5130579;a[r]=u&255;u=u>>8;a[r+1|0]=u&255;u=u>>8;a[r+2|0]=u&255;u=u>>8;a[r+3|0]=u&255;h[i+40>>3]=0.0;v=+d9(+h[s>>3]);h[i+48>>3]=v/+ea(+h[s>>3]);s=i+4|0;c[s>>2]=c[s>>2]>>31;break}}}while(0);s=c[d+20>>2]|0;r=c[d+24>>2]|0;e=c5(t,+h[g+(s<<3)>>3],+h[g+(r<<3)>>3],i,j,k,m,n+(s<<3)|0,n+(r<<3)|0)|0;if((e|0)==0){break}else{p=e}return p|0}}while(0);p=0;return p|0}function c$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=c[a+4>>2]|0;d=_(b<<3,b)|0;e=ei(d)|0;f=e;g=a+20|0;c[g>>2]=f;if((e|0)==0){i=1;return i|0}j=ei(d)|0;d=j;k=a+24|0;c[k>>2]=d;if((j|0)==0){ek(e);i=1;return i|0}if((b|0)>0){e=a+16|0;j=a+12|0;l=0;m=0;while(1){n=l;o=1;while(1){h[(c[g>>2]|0)+(n<<3)>>3]=+h[(c[e>>2]|0)+(m<<3)>>3]*+h[(c[j>>2]|0)+(n<<3)>>3];if((o|0)>=(b|0)){break}n=n+1|0;o=o+1|0}o=m+1|0;if((o|0)<(b|0)){l=b+l|0;m=o}else{break}}p=c[g>>2]|0;q=c[k>>2]|0}else{p=f;q=d}if((c0(b,p,q)|0)!=0){i=2;return i|0}c[a>>2]=137;i=0;return i|0}function c0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;e=a<<2;f=ei(e)|0;g=f;if((f|0)==0){i=1;return i|0}j=ei(e)|0;e=j;if((j|0)==0){ek(f);i=1;return i|0}k=a<<3;l=ei(k)|0;m=l;if((l|0)==0){ek(f);ek(j);i=1;return i|0}n=ei(_(k,a)|0)|0;k=n;if((n|0)==0){ek(f);ek(j);ek(l);i=1;return i|0}o=(a|0)>0;p=a<<3;q=0;r=0;while(1){if((q|0)>=(a|0)){break}c[g+(q<<2)>>2]=q;s=m+(q<<3)|0;h[s>>3]=0.0;if(!o){t=3243;break}u=n+(r<<3)|0;v=b+(r<<3)|0;ev(u|0,v|0,p)|0;v=0;u=r;w=0.0;while(1){x=+N(+(+h[b+(u<<3)>>3]));if(x>w){h[s>>3]=x;y=x}else{y=w}z=v+1|0;if((z|0)<(a|0)){v=z;u=u+1|0;w=y}else{break}}if(y==0.0){t=3243;break}else{q=q+1|0;r=r+a|0}}if((t|0)==3243){ek(f);ek(j);ek(l);ek(n);i=2;return i|0}do{if(o){t=0;while(1){r=_(t,a)|0;q=k+(r+t<<3)|0;b=m+(t<<3)|0;u=t+1|0;v=(u|0)<(a|0);if(!v){break}y=+h[b>>3];s=t;w=+N(+(+h[q>>3]))/y;z=u;while(1){y=+N(+(+h[k+((_(z,a)|0)+t<<3)>>3]));x=y/+h[m+(z<<3)>>3];A=x>w;B=A?z:s;C=z+1|0;if((C|0)<(a|0)){s=B;w=A?x:w;z=C}else{break}}if((B|0)>(t|0)){z=r;s=_(B,a)|0;C=0;while(1){A=k+(s<<3)|0;w=+h[A>>3];D=k+(z<<3)|0;h[A>>3]=+h[D>>3];h[D>>3]=w;D=C+1|0;if((D|0)<(a|0)){z=z+1|0;s=s+1|0;C=D}else{break}}C=m+(B<<3)|0;w=+h[C>>3];h[C>>3]=+h[b>>3];h[b>>3]=w;C=g+(B<<2)|0;s=c[C>>2]|0;z=g+(t<<2)|0;c[C>>2]=c[z>>2];c[z>>2]=s}if(v){E=u}else{break}do{s=_(E,a)|0;z=k+(s+t<<3)|0;w=+h[z>>3];L4422:do{if(w!=0.0){x=w/+h[q>>3];h[z>>3]=x;C=u;y=x;while(1){D=k+(C+s<<3)|0;h[D>>3]=+h[D>>3]-y*+h[k+(C+r<<3)>>3];D=C+1|0;if((D|0)>=(a|0)){break L4422}C=D;y=+h[z>>3]}}}while(0);E=E+1|0;}while((E|0)<(a|0));if(v){t=u}else{break}}if(o){F=0}else{break}do{c[e+(c[g+(F<<2)>>2]<<2)>>2]=F;F=F+1|0;}while((F|0)<(a|0));if(o){G=0;H=0}else{break}while(1){ey(d+(G<<3)|0,0,p|0);t=H+1|0;if((t|0)<(a|0)){G=G+a|0;H=t}else{break}}if(o){I=0}else{break}do{t=c[e+(I<<2)>>2]|0;h[d+((_(t,a)|0)+I<<3)>>3]=1.0;r=t+1|0;if((r|0)<(a|0)){q=r;while(1){if((t|0)<(q|0)){r=_(q,a)|0;b=d+(r+I<<3)|0;z=t;w=+h[b>>3];do{y=+h[k+(z+r<<3)>>3];w=w-y*+h[d+((_(z,a)|0)+I<<3)>>3];h[b>>3]=w;z=z+1|0;}while((z|0)<(q|0))}z=q+1|0;if((z|0)<(a|0)){q=z}else{J=a;break}}}else{J=a}while(1){q=J-1|0;t=_(q,a)|0;u=d+(t+I<<3)|0;if((J|0)<(a|0)){v=J;w=+h[u>>3];do{y=+h[k+(v+t<<3)>>3];w=w-y*+h[d+((_(v,a)|0)+I<<3)>>3];h[u>>3]=w;v=v+1|0;}while((v|0)<(a|0))}h[u>>3]=+h[u>>3]/+h[k+(t+q<<3)>>3];if((q|0)>0){J=q}else{break}}I=I+1|0;}while((I|0)<(a|0))}}while(0);ek(f);ek(j);ek(l);ek(n);i=0;return i|0}function c1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0;e=c[b+4>>2]|0;do{if((c[b>>2]|0)!=137){if((c$(b)|0)==0){break}else{f=1}return f|0}}while(0);g=(e|0)>0;if(!g){f=0;return f|0}i=b+24|0;j=0;k=0;while(1){l=d+(j<<3)|0;h[l>>3]=0.0;m=k;n=0;o=0.0;while(1){p=o+ +h[(c[i>>2]|0)+(m<<3)>>3]*+h[a+(n<<3)>>3];h[l>>3]=p;q=n+1|0;if((q|0)<(e|0)){m=m+1|0;n=q;o=p}else{break}}n=j+1|0;if((n|0)<(e|0)){j=n;k=e+k|0}else{break}}if(!g){f=0;return f|0}g=b+8|0;b=0;while(1){k=d+(b<<3)|0;h[k>>3]=+h[(c[g>>2]|0)+(b<<3)>>3]+ +h[k>>3];k=b+1|0;if((k|0)<(e|0)){b=k}else{f=0;break}}return f|0}function c2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0.0,k=0,l=0,m=0;e=d;f=c[b+4>>2]|0;do{if((c[b>>2]|0)!=137){if((c$(b)|0)==0){break}else{g=1}return g|0}}while(0);if((f|0)<=0){g=0;return g|0}ey(e|0,0,f<<3|0);e=b+8|0;i=b+20|0;b=0;while(1){j=+h[a+(b<<3)>>3]- +h[(c[e>>2]|0)+(b<<3)>>3];k=b;l=0;while(1){m=d+(l<<3)|0;h[m>>3]=+h[m>>3]+j*+h[(c[i>>2]|0)+(k<<3)>>3];m=l+1|0;if((m|0)<(f|0)){k=k+f|0;l=m}else{break}}l=b+1|0;if((l|0)<(f|0)){b=l}else{g=0;break}}return g|0}function c3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0,A=0,B=0.0,C=0;if((c6(a,d)|0)!=0){e=1;return e|0}a=b+8|0;f=b+24|0;g=+h[f>>3]==999.0;i=d+16|0;j=+h[i>>3];do{if(j==90.0){if(g){h[f>>3]=180.0}k=+h[b+16>>3];h[b+32>>3]=k;h[b+40>>3]=+h[a>>3];h[b+48>>3]=90.0-k;l=k}else{k=+h[b+16>>3];if(g){h[f>>3]=k<j?180.0:0.0}m=+d9(k);k=+ea(+h[b+16>>3]);n=+d9(+h[f>>3]);o=+ea(+h[f>>3]);p=+d9(+h[i>>3]);q=+ea(+h[i>>3]);r=n*p;n=+O(+(r*r+q*q));do{if(n==0.0){if(k!=0.0){e=1;return e|0}else{s=+h[b+32>>3];break}}else{t=k/n;if(+N(+t)>1.0){e=1;return e|0}u=+ef(q,r);v=+ec(t);t=u+v;do{if(t>180.0){w=t+-360.0}else{if(t>=-180.0){w=t;break}w=t+360.0}}while(0);t=u-v;do{if(t>180.0){x=t+-360.0}else{if(t>=-180.0){x=t;break}x=t+360.0}}while(0);d=b+32|0;t=+h[d>>3];v=+N(+(t-w));if(v<+N(+(t-x))){y=+N(+w)<90.0000000001?w:x}else{y=+N(+x)<90.0000000001?x:w}h[d>>3]=y;s=y}}while(0);d=b+40|0;z=b+48|0;h[z>>3]=90.0-s;r=m*+d9(s);do{if(+N(+r)<1.0e-10){if(+N(+m)<1.0e-10){A=a|0;n=+h[A>>3];h[d>>3]=n;h[z>>3]=90.0- +h[i>>3];B=n;C=A;break}if(s>0.0){A=a|0;n=+h[A>>3]+ +h[f>>3]+-180.0;h[d>>3]=n;h[z>>3]=0.0;B=n;C=A;break}if(s<0.0){A=a|0;n=+h[A>>3]- +h[f>>3];h[d>>3]=n;h[z>>3]=180.0;B=n;C=A;break}else{B=+h[d>>3];C=a|0;break}}else{n=(q-k*+ea(s))/r;t=o*p/m;if(n==0.0&t==0.0){e=1;return e|0}else{A=a|0;v=+h[A>>3];u=v- +ef(t,n);h[d>>3]=u;B=u;C=A;break}}}while(0);z=d|0;if(+h[C>>3]<0.0){if(B<=0.0){l=s;break}h[z>>3]=B+-360.0;l=s;break}else{if(B>=0.0){l=s;break}h[z>>3]=B+360.0;l=s;break}}}while(0);h[b+56>>3]=+h[f>>3];f=b+48|0;h[b+64>>3]=+d9(+h[f>>3]);h[b+72>>3]=+ea(+h[f>>3]);c[b>>2]=137;e=+N(+l)>90.0000000001?2:0;return e|0}function c4(a,b,d,e,f,g,i,j,k){a=a|0;b=+b;d=+d;e=e|0;f=f|0;g=g|0;i=i|0;j=j|0;k=k|0;var l=0;do{if((c[e>>2]|0)!=137){if((c3(a,e,i)|0)==0){break}else{l=1}return l|0}}while(0);d5(b,d,e+40|0,f,g)|0;e=a8[c[i+1888>>2]&127](+h[f>>3],+h[g>>3],i,j,k)|0;if((e|0)==0){l=0;return l|0}l=(e|0)==1?2:3;return l|0}function c5(a,b,d,e,f,g,i,j,k){a=a|0;b=+b;d=+d;e=e|0;f=f|0;g=g|0;i=i|0;j=j|0;k=k|0;var l=0;do{if((c[i>>2]|0)!=137){if((c3(a,i,e)|0)==0){break}else{l=1}return l|0}}while(0);a=a8[c[e+1892>>2]&127](b,d,e,f,g)|0;if((a|0)==0){d=+h[f>>3];b=+h[g>>3];g=i+40|0;d8(d,b,g,j,k)|0;l=0;return l|0}else{l=(a|0)==1?2:3;return l|0}return 0}function c6(b,d){b=b|0;d=d|0;var e=0,f=0,g=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0;if((a4(b|0,2856)|0)==0){c7(d)|0;e=0;return e|0}if((a4(b|0,2648)|0)==0){c8(d)|0;e=0;return e|0}if((a4(b|0,2304)|0)==0){f=d;u=5128532;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;f=d+4|0;c[f>>2]=(c[f>>2]>>31&-206)+103;h[d+8>>3]=0.0;h[d+16>>3]=90.0;f=d+24|0;if(+h[f>>3]==0.0){h[f>>3]=57.29577951308232}c[d+1888>>2]=64;c[d+1892>>2]=8;f=99;while(1){if((f|0)<=-1){break}if(+h[d+280+(f<<3)>>3]!=0.0){break}if(+h[d+280+(f+100<<3)>>3]==0.0){f=f-1|0}else{break}}c[d+276>>2]=(f|0)<0?0:f;e=0;return e|0}if((a4(b|0,2080)|0)==0){f=d;u=4674643;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=104;h[d+8>>3]=0.0;h[d+16>>3]=90.0;f=d+24|0;g=+h[f>>3];if(g==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=114.59155902616465;h[d+120>>3]=.008726646259971648}else{i=g*2.0;h[d+112>>3]=i;h[d+120>>3]=1.0/i}c[d+1888>>2]=78;c[d+1892>>2]=98;e=0;return e|0}if((a4(b|0,1792)|0)==0){f=d;u=5130579;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;f=d+4|0;c[f>>2]=(c[f>>2]>>31&-210)+105;h[d+8>>3]=0.0;h[d+16>>3]=90.0;f=d+24|0;i=+h[f>>3];if(i==0.0){h[f>>3]=57.29577951308232;j=57.29577951308232}else{j=i}h[d+112>>3]=1.0/j;j=+h[d+40>>3];i=+h[d+48>>3];g=j*j+i*i;h[d+120>>3]=g;h[d+128>>3]=g+1.0;h[d+136>>3]=g+-1.0;c[d+1888>>2]=90;c[d+1892>>2]=2;e=0;return e|0}if((a4(b|0,1448)|0)==0){f=d;u=4411969;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=106;h[d+8>>3]=0.0;h[d+16>>3]=90.0;f=d+24|0;g=+h[f>>3];if(g==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{i=g*3.141592653589793/180.0;h[d+112>>3]=i;h[d+120>>3]=1.0/i}c[d+1888>>2]=26;c[d+1892>>2]=32;e=0;return e|0}if((a4(b|0,952)|0)==0){c9(d)|0;e=0;return e|0}if((a4(b|0,5976)|0)==0){f=d;u=4277594;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=108;h[d+8>>3]=0.0;h[d+16>>3]=90.0;f=d+24|0;i=+h[f>>3];if(i==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=114.59155902616465;h[d+120>>3]=.008726646259971648}else{g=i*2.0;h[d+112>>3]=g;h[d+120>>3]=1.0/g}c[d+1888>>2]=86;c[d+1892>>2]=6;e=0;return e|0}if((a4(b|0,5544)|0)==0){f=d;u=5392705;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=109;h[d+8>>3]=0.0;h[d+16>>3]=90.0;f=d+24|0;g=+h[f>>3];if(g==0.0){h[f>>3]=57.29577951308232;k=57.29577951308232}else{k=g}g=k*2.0;f=d+112|0;h[f>>3]=g;k=+h[d+40>>3];do{if(k==90.0){h[d+120>>3]=-.5;h[d+128>>3]=1.0;l=g;m=1.0}else{if(k>-90.0){i=+d9((90.0-k)*.5);j=i*i;n=+Y(+i)*j/(1.0-j);h[d+120>>3]=n;j=.5-n;h[d+128>>3]=j;l=+h[f>>3];m=j;break}else{e=0;return e|0}}}while(0);h[d+136>>3]=m*l;h[d+144>>3]=1.0e-4;h[d+152>>3]=m*1.0e-4;h[d+160>>3]=57.29577951308232/m;c[d+1888>>2]=36;c[d+1892>>2]=88;e=0;return e|0}if((a4(b|0,5136)|0)==0){f=d;u=5265731;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=201;f=d+24|0;ey(d+8|0,0,16);m=+h[f>>3];do{if(m==0.0){h[f>>3]=57.29577951308232;l=+h[d+48>>3];h[d+112>>3]=l;if(l==0.0){e=0;return e|0}h[d+120>>3]=1.0/l;k=(l+ +h[d+40>>3])*57.29577951308232;h[d+128>>3]=k;if(k==0.0){e=0;return e|0}else{h[d+136>>3]=1.0/k;break}}else{k=+h[d+48>>3];l=m*k*3.141592653589793/180.0;h[d+112>>3]=l;if(l==0.0){e=0;return e|0}h[d+120>>3]=1.0/l;l=m*(k+ +h[d+40>>3]);h[d+128>>3]=l;if(l==0.0){e=0;return e|0}else{h[d+136>>3]=1.0/l;break}}}while(0);c[d+1888>>2]=18;c[d+1892>>2]=104;e=0;return e|0}if((a4(b|0,4936)|0)==0){f=d;u=4277571;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=202;f=d+24|0;ey(d+8|0,0,16);m=+h[f>>3];do{if(m==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0;l=+h[d+40>>3];if(l<=0.0|l>1.0){e=0;return e|0}else{h[d+128>>3]=57.29577951308232/l;h[d+136>>3]=l/57.29577951308232;break}}else{h[d+112>>3]=m*3.141592653589793/180.0;h[d+120>>3]=57.29577951308232/m;l=+h[d+40>>3];if(l<=0.0|l>1.0){e=0;return e|0}else{h[d+128>>3]=m/l;h[d+136>>3]=l/m;break}}}while(0);c[d+1888>>2]=30;c[d+1892>>2]=20;e=0;return e|0}if((a4(b|0,4680)|0)==0){f=d;u=5390659;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=203;f=d+24|0;ey(d+8|0,0,16);m=+h[f>>3];if(m==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{l=m*3.141592653589793/180.0;h[d+112>>3]=l;h[d+120>>3]=1.0/l}c[d+1888>>2]=96;c[d+1892>>2]=92;e=0;return e|0}if((a4(b|0,4552)|0)==0){f=d;u=5391693;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=204;f=d+24|0;ey(d+8|0,0,16);l=+h[f>>3];if(l==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{m=l*3.141592653589793/180.0;h[d+112>>3]=m;h[d+120>>3]=1.0/m}c[d+1888>>2]=80;c[d+1892>>2]=28;e=0;return e|0}if((a4(b|0,4480)|0)==0){f=d;u=4998739;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=301;f=d+24|0;ey(d+8|0,0,16);m=+h[f>>3];if(m==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0}else{l=m*3.141592653589793/180.0;h[d+112>>3]=l;h[d+120>>3]=1.0/l}c[d+1888>>2]=34;c[d+1892>>2]=54;e=0;return e|0}if((a4(b|0,4416)|0)==0){f=d;u=5390672;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=302;f=d+24|0;ey(d+8|0,0,16);l=+h[f>>3];if(l==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0;h[d+128>>3]=180.0;h[d+136>>3]=.005555555555555556}else{m=l*3.141592653589793;l=m/180.0;h[d+112>>3]=l;h[d+120>>3]=1.0/l;h[d+128>>3]=m;h[d+136>>3]=1.0/m}c[d+1888>>2]=94;c[d+1892>>2]=38;e=0;return e|0}if((a4(b|0,4360)|0)==0){f=d;u=5001037;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=303;f=d+24|0;ey(d+8|0,0,16);m=+h[f>>3];if(m==0.0){h[f>>3]=57.29577951308232;o=57.29577951308232}else{o=m}m=o*1.4142135623730951;h[d+112>>3]=m;h[d+120>>3]=m/90.0;h[d+128>>3]=1.0/m;h[d+136>>3]=90.0/o;h[d+144>>3]=.6366197723675814;c[d+1888>>2]=48;c[d+1892>>2]=58;e=0;return e|0}if((a4(b|0,4280)|0)==0){f=d;u=5523777;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=401;f=d+24|0;ey(d+8|0,0,16);o=+h[f>>3];if(o==0.0){h[f>>3]=57.29577951308232;p=57.29577951308232}else{p=o}o=p*2.0;m=p*o;h[d+112>>3]=m;p=1.0/(m*2.0);h[d+120>>3]=p;h[d+128>>3]=p*.25;h[d+136>>3]=1.0/o;c[d+1888>>2]=14;c[d+1892>>2]=72;e=0;return e|0}if((a4(b|0,4104)|0)==0){da(d)|0;e=0;return e|0}if((a4(b|0,4032)|0)==0){db(d)|0;e=0;return e|0}if((a4(b|0,3912)|0)==0){dc(d)|0;e=0;return e|0}if((a4(b|0,3784)|0)==0){dd(d)|0;e=0;return e|0}if((a4(b|0,3640)|0)==0){de(d)|0;e=0;return e|0}if((a4(b|0,3520)|0)==0){f=d;u=5194576;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=602;f=d+24|0;ey(d+8|0,0,16);o=+h[f>>3];if(o==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=1.0;h[d+120>>3]=1.0;h[d+128>>3]=114.59155902616465}else{p=o*3.141592653589793/180.0;h[d+112>>3]=p;h[d+120>>3]=1.0/p;h[d+128>>3]=o*2.0}c[d+1888>>2]=70;c[d+1892>>2]=66;e=0;return e|0}if((a4(b|0,3384)|0)==0){f=d;u=4412244;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=701;f=d+24|0;ey(d+8|0,0,16);o=+h[f>>3];if(o==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=45.0;h[d+120>>3]=.022222222222222223}else{p=o*3.141592653589793*.25;h[d+112>>3]=p;h[d+120>>3]=1.0/p}c[d+1888>>2]=46;c[d+1892>>2]=100;e=0;return e|0}if((a4(b|0,3312)|0)==0){f=d;u=4412227;a[f]=u&255;u=u>>8;a[f+1|0]=u&255;u=u>>8;a[f+2|0]=u&255;u=u>>8;a[f+3|0]=u&255;c[d+4>>2]=702;f=d+24|0;ey(d+8|0,0,16);p=+h[f>>3];if(p==0.0){h[f>>3]=57.29577951308232;h[d+112>>3]=45.0;h[d+120>>3]=.022222222222222223}else{o=p*3.141592653589793*.25;h[d+112>>3]=o;h[d+120>>3]=1.0/o}c[d+1888>>2]=44;c[d+1892>>2]=40;e=0;return e|0}if((a4(b|0,3232)|0)!=0){e=1;return e|0}b=d;u=4412241;a[b]=u&255;u=u>>8;a[b+1|0]=u&255;u=u>>8;a[b+2|0]=u&255;u=u>>8;a[b+3|0]=u&255;c[d+4>>2]=703;b=d+24|0;ey(d+8|0,0,16);o=+h[b>>3];if(o==0.0){h[b>>3]=57.29577951308232;h[d+112>>3]=45.0;h[d+120>>3]=.022222222222222223}else{p=o*3.141592653589793*.25;h[d+112>>3]=p;h[d+120>>3]=1.0/p}c[d+1888>>2]=84;c[d+1892>>2]=52;e=0;return e|0}function c7(b){b=b|0;var d=0,e=0.0,f=0.0,g=0,i=0,j=0,k=0.0,l=0.0;d=b;u=5265985;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;d=b+4|0;c[d>>2]=(c[d>>2]>>31&-202)+101;h[b+8>>3]=0.0;h[b+16>>3]=90.0;d=b+24|0;e=+h[d>>3];if(e==0.0){h[d>>3]=57.29577951308232;f=57.29577951308232}else{f=e}d=b+40|0;e=f*(+h[d>>3]+1.0);h[b+112>>3]=e;if(e==0.0){g=1;return g|0}i=b+48|0;e=+d9(+h[i>>3]);j=b+136|0;h[j>>3]=e;if(e==0.0){g=1;return g|0}h[b+128>>3]=1.0/e;e=+ea(+h[i>>3]);h[b+144>>3]=e;f=+h[j>>3];h[b+120>>3]=e/f;e=+h[d>>3];if(+N(+e)>1.0){h[b+152>>3]=+ed(-1.0/e);k=+h[d>>3];l=+h[j>>3]}else{h[b+152>>3]=-90.0;k=e;l=f}f=k*l;h[b+160>>3]=f;h[b+168>>3]=+N(+f)<1.0?1.0:0.0;c[b+1888>>2]=12;c[b+1892>>2]=56;g=0;return g|0}function c8(b){b=b|0;var d=0,e=0.0,f=0.0,g=0,i=0,j=0,k=0,l=0,m=0;d=b;u=5266003;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;d=b+4|0;c[d>>2]=(c[d>>2]>>31&-204)+102;h[b+8>>3]=0.0;h[b+16>>3]=90.0;d=b+24|0;e=+h[d>>3];if(e==0.0){h[d>>3]=57.29577951308232;f=57.29577951308232}else{f=e}h[b+112>>3]=1.0/f;g=b+40|0;f=+h[g>>3];i=b+56|0;e=f*+ea(+h[i>>3])+1.0;j=b+136|0;h[j>>3]=e;if(e==0.0){k=1;return k|0}e=-0.0- +h[g>>3];f=+d9(+h[i>>3])*e;l=b+48|0;m=b+120|0;h[m>>3]=f*+ea(+h[l>>3]);f=+h[g>>3];e=f*+d9(+h[i>>3]);f=e*+d9(+h[l>>3]);h[b+128>>3]=f;e=+h[d>>3];h[b+144>>3]=e*+h[m>>3];h[b+152>>3]=e*f;f=+h[j>>3];h[b+160>>3]=e*f;e=f+-1.0;h[b+168>>3]=f*e+-1.0;if(+N(+e)<1.0){h[b+176>>3]=+ed(1.0-f)}else{h[b+176>>3]=-90.0}c[b+1888>>2]=10;c[b+1892>>2]=60;k=0;return k|0}function c9(b){b=b|0;var d=0,e=0,f=0,g=0,i=0,j=0.0,k=0.0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,v=0.0,w=0.0,x=0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0;d=b;u=5132378;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;e=b+4|0;c[e>>2]=(c[e>>2]>>31&-214)+107;f=b+8|0;h[f>>3]=0.0;g=b+16|0;h[g>>3]=90.0;i=b+24|0;j=+h[i>>3];if(j==0.0){h[i>>3]=57.29577951308232;k=57.29577951308232}else{k=j}l=9;while(1){if((l|0)<=-1){m=3546;break}if(+h[b+32+(l<<3)>>3]==0.0){l=l-1|0}else{break}}if((m|0)==3546){u=4411969;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;c[e>>2]=106;h[f>>3]=0.0;h[g>>3]=90.0;if(k==0.0){h[i>>3]=57.29577951308232;h[b+112>>3]=1.0;h[b+120>>3]=1.0}else{j=k*3.141592653589793/180.0;h[b+112>>3]=j;h[b+120>>3]=1.0/j}c[b+1888>>2]=26;c[b+1892>>2]=32;n=0;return n|0}c[b+272>>2]=l;c[b+1888>>2]=62;c[b+1892>>2]=42;if((l|0)<=2){n=0;return n|0}j=+h[b+40>>3];if(j<=0.0){n=1;return n|0}i=(l|0)>0;L4819:do{if(i){k=0.0;o=0.0;p=0.0;q=j;g=0;while(1){if((g|0)>=180){r=k;s=p;break}t=+(g|0)*3.141592653589793/180.0;f=l;v=0.0;do{v=t*v+ +(f|0)*+h[b+32+(f<<3)>>3];f=f-1|0;}while((f|0)>0);if(v>0.0){k=t;o=t;p=v;q=v;g=g+1|0}else{r=t;s=v;break}}if((g|0)==180){w=3.141592653589793;break}if(i){x=1;y=q;z=s;A=o;B=r}else{C=r;D=s;E=q;F=o;m=3563;break}while(1){p=A-y*(B-A)/(z-y);f=l;k=0.0;do{k=p*k+ +(f|0)*+h[b+32+(f<<3)>>3];f=f-1|0;}while((f|0)>0);if(+N(+k)<1.0e-13){w=p;break L4819}f=k<0.0;e=x+1|0;if((e|0)<11){x=e;y=f?y:k;z=f?k:z;A=f?A:p;B=f?p:B}else{w=p;break}}}else{C=0.0;D=0.0;E=j;F=0.0;m=3563}}while(0);if((m|0)==3563){w=F-E*(C-F)/(D-E)}m=l;E=0.0;while(1){G=w*E+ +h[b+32+(m<<3)>>3];if((m|0)>0){m=m-1|0;E=G}else{break}}h[b+112>>3]=w;h[b+120>>3]=G;n=0;return n|0}function da(b){b=b|0;var d=0,e=0.0,f=0,g=0.0,i=0;d=b;u=5263171;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;d=b+4|0;c[d>>2]=(c[d>>2]>>31&-1002)+501;h[b+8>>3]=0.0;d=b+40|0;e=+h[d>>3];h[b+16>>3]=e;f=b+24|0;if(+h[f>>3]==0.0){h[f>>3]=57.29577951308232}g=+ea(e);h[b+112>>3]=g;if(g==0.0){i=1;return i|0}h[b+120>>3]=1.0/g;g=+h[f>>3];e=g*+d9(+h[b+48>>3]);f=b+136|0;h[f>>3]=e;if(e==0.0){i=1;return i|0}h[b+144>>3]=1.0/e;e=1.0/+eb(+h[d>>3]);h[b+152>>3]=e;h[b+128>>3]=e*+h[f>>3];c[b+1888>>2]=82;c[b+1892>>2]=76;i=0;return i|0}function db(b){b=b|0;var d=0,e=0.0,f=0,g=0.0,i=0.0,j=0.0,k=0,l=0,m=0;d=b;u=4542275;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;c[b+4>>2]=502;h[b+8>>3]=0.0;d=b+40|0;e=+h[d>>3];h[b+16>>3]=e;f=b+24|0;if(+h[f>>3]==0.0){h[f>>3]=57.29577951308232}g=+h[b+48>>3];i=e-g;j=e+g;g=+ea(i);e=(g+ +ea(j))*.5;k=b+112|0;h[k>>3]=e;if(e==0.0){l=1;return l|0}h[b+120>>3]=1.0/e;m=b+136|0;h[m>>3]=+h[f>>3]/e;e=+ea(i);i=e*+ea(j)+1.0;h[b+144>>3]=i;j=+h[k>>3]*2.0;h[b+152>>3]=j;e=+h[m>>3];h[b+160>>3]=e*e*i;h[b+168>>3]=1.0/(+h[f>>3]*2.0*e);h[b+176>>3]=e*+O(+(i+j));h[b+128>>3]=e*+O(+(i-j*+ea(+h[d>>3])));c[b+1888>>2]=68;c[b+1892>>2]=4;l=0;return l|0}function dc(b){b=b|0;var d=0,e=0.0,f=0,g=0.0,i=0.0,j=0,k=0,l=0.0,m=0;d=b;u=4476739;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;c[b+4>>2]=503;h[b+8>>3]=0.0;d=b+40|0;e=+h[d>>3];h[b+16>>3]=e;f=b+24|0;g=+h[f>>3];if(g==0.0){h[f>>3]=57.29577951308232;i=57.29577951308232}else{i=g}j=b+48|0;k=+h[j>>3]==0.0;g=i*+ea(e);if(k){e=g*3.141592653589793/180.0;h[b+112>>3]=e;l=e}else{e=g*+ea(+h[j>>3]);g=e/+h[j>>3];h[b+112>>3]=g;l=g}if(l==0.0){m=1;return m|0}h[b+120>>3]=1.0/l;l=+h[f>>3];g=l*+d9(+h[j>>3]);l=g*+d9(+h[d>>3]);g=l/+h[b+112>>3];h[b+128>>3]=g;h[b+136>>3]=g+ +h[d>>3];c[b+1888>>2]=74;c[b+1892>>2]=22;m=0;return m|0}function dd(b){b=b|0;var d=0,e=0.0,f=0,g=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0;d=b;u=5197635;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;c[b+4>>2]=504;h[b+8>>3]=0.0;d=b+40|0;e=+h[d>>3];h[b+16>>3]=e;f=b+24|0;if(+h[f>>3]==0.0){h[f>>3]=57.29577951308232}g=+h[b+48>>3];i=e-g;j=e+g;g=+eb((90.0-i)*.5);e=+d9(i);if(i==j){k=+ea(i);h[b+112>>3]=k;l=k}else{k=+eb((90.0-j)*.5);i=+Y(+(+d9(j)/e));j=i/+Y(+(k/g));h[b+112>>3]=j;l=j}if(l==0.0){m=1;return m|0}h[b+120>>3]=1.0/l;j=+h[f>>3]*(e/l);e=j/+P(+g,+l);f=b+136|0;h[f>>3]=e;if(e==0.0){m=1;return m|0}l=+eb((90.0- +h[d>>3])*.5);h[b+128>>3]=e*+P(+l,+(+h[b+112>>3]));h[b+144>>3]=1.0/+h[f>>3];c[b+1888>>2]=50;c[b+1892>>2]=24;m=0;return m|0}function de(b){b=b|0;var d=0,e=0.0,f=0.0,g=0.0,i=0,j=0;d=b;u=5132098;a[d]=u&255;u=u>>8;a[d+1|0]=u&255;u=u>>8;a[d+2|0]=u&255;u=u>>8;a[d+3|0]=u&255;c[b+4>>2]=601;d=b+24|0;ey(b+8|0,0,16);e=+h[d>>3];if(e==0.0){h[d>>3]=57.29577951308232;h[b+120>>3]=1.0;d=b+40|0;f=+d9(+h[d>>3])*57.29577951308232;g=f/+ea(+h[d>>3]);h[b+128>>3]=g+ +h[d>>3];i=b+1888|0;c[i>>2]=102;j=b+1892|0;c[j>>2]=16;return 0}else{h[b+120>>3]=e*3.141592653589793/180.0;d=b+40|0;g=+d9(+h[d>>3]);f=g/+ea(+h[d>>3]);h[b+128>>3]=e*(f+ +h[d>>3]*3.141592653589793/180.0);i=b+1888|0;c[i>>2]=102;j=b+1892|0;c[j>>2]=16;return 0}return 0}function df(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0;g=d+4|0;i=c[g>>2]|0;do{if((((i|0)>-1?i:-i|0)|0)!=101){if((c7(d)|0)==0){break}else{j=1}return j|0}}while(0);k=+d9(a);l=+d9(b);m=k*+h[d+120>>3];i=d+40|0;n=+h[i>>3];o=l*m+(n+ +ea(b));if(o==0.0){j=2;return j|0}n=l*+h[d+112>>3]/o;h[e>>3]=n*+ea(a);h[f>>3]=k*(-0.0-n)*+h[d+128>>3];do{if((c[g>>2]|0)>0){if(+h[d+152>>3]>b){j=2;return j|0}if(+h[d+168>>3]<=0.0){break}n=+h[i>>3];k=n/+O(+(m*m+1.0));if(+N(+k)>1.0){break}n=+ee(-0.0-m);a=+ed(k);k=n-a;o=n+a+180.0;if(k>90.0){p=k+-360.0}else{p=k}if(o>90.0){q=o+-360.0}else{q=o}if((p>q?p:q)>b){j=2}else{break}return j|0}}while(0);j=0;return j|0}function dg(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0;g=c[d+4>>2]|0;do{if((((g|0)>-1?g:-g|0)|0)!=101){if((c7(d)|0)==0){break}else{i=1}return i|0}}while(0);j=+h[d+136>>3]*b;k=+O(+(a*a+j*j));if(k==0.0){h[e>>3]=0.0;l=90.0}else{h[e>>3]=+ef(a,-0.0-j);j=k/(+h[d+112>>3]+ +h[d+144>>3]*b);b=j*+h[d+40>>3];k=b/+O(+(j*j+1.0));b=+ef(1.0,j);do{if(+N(+k)>1.0){j=k<0.0?-90.0:90.0;if(+N(+j)>1.0000000000001){i=2}else{m=j;break}return i|0}else{m=+ed(k)}}while(0);k=b-m;j=b+m+180.0;if(k>90.0){n=k+-360.0}else{n=k}if(j>90.0){o=j+-360.0}else{o=j}l=n>o?n:o}h[f>>3]=l;i=0;return i|0}function dh(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0,p=0.0,q=0.0,r=0.0;g=d+4|0;i=c[g>>2]|0;do{if((((i|0)>-1?i:-i|0)|0)!=102){if((c8(d)|0)==0){break}else{j=1}return j|0}}while(0);k=+d9(a);l=+ea(a);a=+d9(b);m=1.0- +ea(b);i=d+136|0;n=+h[i>>3]-m;if(n==0.0){j=2;return j|0}o=d+160|0;h[e>>3]=(l*a*+h[o>>3]-m*+h[d+144>>3])/n;h[f>>3]=(-0.0-(k*a*+h[o>>3]+m*+h[d+152>>3]))/n;do{if((c[g>>2]|0)>0){if(+h[d+176>>3]>b){j=2;return j|0}if(+N(+(+h[d+40>>3]))<=1.0){break}n=l*+h[d+120>>3]-k*+h[d+128>>3];m=1.0/+O(+(+h[d+168>>3]+n*n));if(+N(+m)>1.0){break}a=+ef(n,+h[i>>3]+-1.0);n=+ed(m);m=a-n;p=a+n+180.0;if(m>90.0){q=m+-360.0}else{q=m}if(p>90.0){r=p+-360.0}else{r=p}if((q>r?q:r)>b){j=2}else{break}return j|0}}while(0);j=0;return j|0}function di(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;g=c[d+4>>2]|0;do{if((((g|0)>-1?g:-g|0)|0)!=102){if((c8(d)|0)==0){break}else{i=1}return i|0}}while(0);j=+h[d+112>>3];k=j*a;a=j*b;b=k*k+a*a;j=+h[d+136>>3];l=(k- +h[d+120>>3])/j;m=(a- +h[d+128>>3])/j;j=k*l+a*m;do{if(b<1.0e-10){h[f>>3]=90.0- +O(+(b/(j+1.0)))*57.29577951308232;n=b*.5}else{o=l*l+m*m;p=o+1.0;q=j-o;r=q*q-p*(o+(b-j-j)+-1.0);if(r<0.0){i=2;return i|0}o=+O(+r);r=(o-q)/p;s=(-0.0-q-o)/p;p=r>s?r:s;do{if(p>1.0){if(p+-1.0<1.0e-13){t=1.0;break}t=r<s?r:s}else{t=p}}while(0);p=t<-1.0&t+1.0>-1.0e-13?-1.0:t;if(p>1.0|p<-1.0){i=2;return i|0}else{h[f>>3]=+ed(p);n=1.0-p;break}}}while(0);h[e>>3]=+ef(k-l*n,-0.0-(a-m*n));i=0;return i|0}function dj(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,v=0,w=0,x=0,y=0;j=i;i=i+16|0;k=j|0;l=e+4|0;m=c[l>>2]|0;if((((m|0)>-1?m:-m|0)|0)!=103){n=e;u=5128532;a[n]=u&255;u=u>>8;a[n+1|0]=u&255;u=u>>8;a[n+2|0]=u&255;u=u>>8;a[n+3|0]=u&255;c[l>>2]=(m>>31&-206)+103;h[e+8>>3]=0.0;h[e+16>>3]=90.0;m=e+24|0;if(+h[m>>3]==0.0){h[m>>3]=57.29577951308232}c[e+1888>>2]=64;c[e+1892>>2]=8;m=99;while(1){if((m|0)<=-1){break}if(+h[e+280+(m<<3)>>3]!=0.0){break}if(+h[e+280+(m+100<<3)>>3]==0.0){m=m-1|0}else{break}}c[e+276>>2]=(m|0)<0?0:m}o=+ea(d);if(o<=0.0){i=j;return 2}p=+h[e+24>>3];q=p*+d9(d)/o;d=q*+ea(b);m=k|0;h[m>>3]=d;n=k+8|0;h[n>>3]=+d9(b)*(-0.0-q);k=c[e+1880>>2]|0;if((k|0)==0){r=d}else{r=+cR(k,m)}h[f>>3]=r;f=c[e+1884>>2]|0;if((f|0)==0){s=+h[n>>3];h[g>>3]=s;t=c[l>>2]|0;v=(t|0)>0;w=o<0.0;x=v&w;y=x?2:0;i=j;return y|0}else{s=+cR(f,m);h[g>>3]=s;t=c[l>>2]|0;v=(t|0)>0;w=o<0.0;x=v&w;y=x?2:0;i=j;return y|0}return 0}function dk(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0.0,s=0.0,t=0,v=0.0,w=0.0;j=i;i=i+16|0;k=j|0;l=j+8|0;m=e+4|0;n=c[m>>2]|0;if((((n|0)>-1?n:-n|0)|0)==103){o=c[e+276>>2]|0}else{p=e;u=5128532;a[p]=u&255;u=u>>8;a[p+1|0]=u&255;u=u>>8;a[p+2|0]=u&255;u=u>>8;a[p+3|0]=u&255;c[m>>2]=(n>>31&-206)+103;h[e+8>>3]=0.0;h[e+16>>3]=90.0;n=e+24|0;if(+h[n>>3]==0.0){h[n>>3]=57.29577951308232}c[e+1888>>2]=64;c[e+1892>>2]=8;n=99;while(1){if((n|0)<=-1){break}if(+h[e+280+(n<<3)>>3]!=0.0){break}if(+h[e+280+(n+100<<3)>>3]==0.0){n=n-1|0}else{break}}m=(n|0)<0?0:n;c[e+276>>2]=m;o=m}if((o|0)==0){h[k>>3]=b;h[l>>3]=d;q=b;r=d}else{dl(e,b,d,k,l)|0;q=+h[k>>3];r=+h[l>>3]}d=+O(+(q*q+r*r));if(d==0.0){s=0.0;h[f>>3]=s;t=e+24|0;v=+h[t>>3];w=+ef(v,d);h[g>>3]=w;i=j;return 0}s=+ef(q,-0.0-r);h[f>>3]=s;t=e+24|0;v=+h[t>>3];w=+ef(v,d);h[g>>3]=w;i=j;return 0}function dl(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0;g=c[a+276>>2]|0;i=+h[a+1080>>3]+ +h[a+1088>>3]*b;j=+h[a+280>>3]+ +h[a+288>>3]*d;do{if((g|0)==1){k=j;l=i}else{m=i+ +h[a+1096>>3]*d;n=j+ +h[a+296>>3]*b;if((g|0)==2){k=n;l=m;break}o=b*b;p=d*d;q=+O(+(o+p));r=m+q*+h[a+1104>>3];m=n+q*+h[a+304>>3];if((g|0)==3){k=m;l=r;break}n=r+o*+h[a+1112>>3];r=m+p*+h[a+312>>3];if((g|0)==4){k=r;l=n;break}m=b*d;s=n+m*+h[a+1120>>3];n=r+m*+h[a+320>>3];if((g|0)==5){k=n;l=s;break}m=s+p*+h[a+1128>>3];s=n+o*+h[a+328>>3];if((g|0)==6){k=s;l=m;break}n=o*b;r=m+n*+h[a+1136>>3];m=p*d;t=s+m*+h[a+336>>3];if((g|0)==7){k=t;l=r;break}s=r+o*+h[a+1144>>3]*d;r=t+p*+h[a+344>>3]*b;if((g|0)==8){k=r;l=s;break}t=s+p*+h[a+1152>>3]*b;s=r+o*+h[a+352>>3]*d;if((g|0)==9){k=s;l=t;break}r=t+m*+h[a+1160>>3];t=s+n*+h[a+360>>3];if((g|0)==10){k=t;l=r;break}s=q*q*q;u=r+s*+h[a+1168>>3];r=t+s*+h[a+368>>3];if((g|0)==11){k=r;l=u;break}t=o*o;v=u+t*+h[a+1176>>3];u=p*p;w=r+u*+h[a+376>>3];if((g|0)==12){k=w;l=v;break}r=v+n*+h[a+1184>>3]*d;v=w+m*+h[a+384>>3]*b;if((g|0)==13){k=v;l=r;break}w=r+p*o*+h[a+1192>>3];r=v+p*o*+h[a+392>>3];if((g|0)==14){k=r;l=w;break}v=w+m*+h[a+1200>>3]*b;w=r+n*+h[a+400>>3]*d;if((g|0)==15){k=w;l=v;break}r=v+u*+h[a+1208>>3];v=w+t*+h[a+408>>3];if((g|0)==16){k=v;l=r;break}w=t*b;x=r+w*+h[a+1216>>3];r=u*d;y=v+r*+h[a+416>>3];if((g|0)==17){k=y;l=x;break}v=x+t*+h[a+1224>>3]*d;x=y+u*+h[a+424>>3]*b;if((g|0)==18){k=x;l=v;break}y=v+p*n*+h[a+1232>>3];v=x+o*m*+h[a+432>>3];if((g|0)==19){k=v;l=y;break}x=y+m*o*+h[a+1240>>3];y=v+n*p*+h[a+440>>3];if((g|0)==20){k=y;l=x;break}v=x+u*+h[a+1248>>3]*b;x=y+t*+h[a+448>>3]*d;if((g|0)==21){k=x;l=v;break}y=v+r*+h[a+1256>>3];v=x+w*+h[a+456>>3];if((g|0)==22){k=v;l=y;break}x=q*q*s;s=y+x*+h[a+1264>>3];y=v+x*+h[a+464>>3];if((g|0)==23){k=y;l=s;break}v=w*b;z=s+v*+h[a+1272>>3];s=r*d;A=y+s*+h[a+472>>3];if((g|0)==24){k=A;l=z;break}y=z+w*+h[a+1280>>3]*d;z=A+r*+h[a+480>>3]*b;if((g|0)==25){k=z;l=y;break}A=y+p*t*+h[a+1288>>3];y=z+o*u*+h[a+488>>3];if((g|0)==26){k=y;l=A;break}z=A+m*n*+h[a+1296>>3];A=y+n*m*+h[a+496>>3];if((g|0)==27){k=A;l=z;break}y=z+u*o*+h[a+1304>>3];z=A+t*p*+h[a+504>>3];if((g|0)==28){k=z;l=y;break}A=y+r*+h[a+1312>>3]*b;y=z+w*+h[a+512>>3]*d;if((g|0)==29){k=y;l=A;break}z=A+s*+h[a+1320>>3];A=y+v*+h[a+520>>3];if((g|0)==30){k=A;l=z;break}y=v*b;B=z+y*+h[a+1328>>3];z=s*d;C=A+z*+h[a+528>>3];if((g|0)==31){k=C;l=B;break}A=B+v*+h[a+1336>>3]*d;B=C+s*+h[a+536>>3]*b;if((g|0)==32){k=B;l=A;break}C=A+p*w*+h[a+1344>>3];A=B+o*r*+h[a+544>>3];if((g|0)==33){k=A;l=C;break}B=C+m*t*+h[a+1352>>3];C=A+n*u*+h[a+552>>3];if((g|0)==34){k=C;l=B;break}A=B+u*n*+h[a+1360>>3];n=C+t*m*+h[a+560>>3];if((g|0)==35){k=n;l=A;break}m=A+r*o*+h[a+1368>>3];o=n+w*p*+h[a+568>>3];if((g|0)==36){k=o;l=m;break}p=m+s*+h[a+1376>>3]*b;s=o+v*+h[a+576>>3]*d;if((g|0)==37){k=s;l=p;break}v=p+z*+h[a+1384>>3];z=s+y*+h[a+584>>3];if((g|0)==38){k=z;l=v;break}y=q*q*x;k=z+y*+h[a+592>>3];l=v+y*+h[a+1392>>3]}}while(0);h[e>>3]=l;h[f>>3]=k;return 0}function dm(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0,n=0.0;i=e+4|0;if((c[i>>2]|0)!=104){j=e;u=4674643;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=104;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648}else{l=k*2.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=78;c[e+1892>>2]=98}l=+ea(d)+1.0;if(l==0.0){m=2;return m|0}k=+h[e+112>>3];n=k*+d9(d)/l;h[f>>3]=n*+ea(b);h[g>>3]=+d9(b)*(-0.0-n);m=0;return m|0}function dn(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0;i=e+4|0;if((c[i>>2]|0)!=104){j=e;u=4674643;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=104;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648}else{l=k*2.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=78;c[e+1892>>2]=98}l=+O(+(b*b+d*d));if(l==0.0){m=0.0;h[f>>3]=m;n=e+120|0;o=+h[n>>3];p=l*o;q=+ee(p);r=q*2.0;s=90.0-r;h[g>>3]=s;return 0}m=+ef(b,-0.0-d);h[f>>3]=m;n=e+120|0;o=+h[n>>3];p=l*o;q=+ee(p);r=q*2.0;s=90.0-r;h[g>>3]=s;return 0}function dp(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0;i=e+4|0;j=c[i>>2]|0;if((((j|0)>-1?j:-j|0)|0)!=105){k=e;u=5130579;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=(j>>31&-210)+105;h[e+8>>3]=0.0;h[e+16>>3]=90.0;j=e+24|0;l=+h[j>>3];if(l==0.0){h[j>>3]=57.29577951308232;m=57.29577951308232}else{m=l}h[e+112>>3]=1.0/m;m=+h[e+40>>3];l=+h[e+48>>3];n=m*m+l*l;h[e+120>>3]=n;h[e+128>>3]=n+1.0;h[e+136>>3]=n+-1.0;c[e+1888>>2]=90;c[e+1892>>2]=2}n=(90.0- +N(+d))*3.141592653589793/180.0;do{if(n<1.0e-5){l=n*n*.5;if(d>0.0){o=l;p=n;break}o=2.0-l;p=n}else{l=1.0- +ea(d);o=l;p=+d9(d)}}while(0);n=+d9(b);l=+ea(b);j=e+24|0;k=e+40|0;h[f>>3]=+h[j>>3]*(p*l+o*+h[k>>3]);f=e+48|0;h[g>>3]=(p*n-o*+h[f>>3])*(-0.0- +h[j>>3]);do{if((c[i>>2]|0)>0){if(+h[e+120>>3]==0.0){if(d<0.0){q=2}else{break}return q|0}else{if(d<-0.0- +ee(l*+h[k>>3]-n*+h[f>>3])){q=2}else{break}return q|0}}}while(0);q=0;return q|0}function dq(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,v=0.0,w=0.0;i=e+4|0;j=c[i>>2]|0;if((((j|0)>-1?j:-j|0)|0)==105){k=+h[e+112>>3];l=+h[e+120>>3]}else{m=e;u=5130579;a[m]=u&255;u=u>>8;a[m+1|0]=u&255;u=u>>8;a[m+2|0]=u&255;u=u>>8;a[m+3|0]=u&255;c[i>>2]=(j>>31&-210)+105;h[e+8>>3]=0.0;h[e+16>>3]=90.0;j=e+24|0;n=+h[j>>3];if(n==0.0){h[j>>3]=57.29577951308232;o=57.29577951308232}else{o=n}n=1.0/o;h[e+112>>3]=n;o=+h[e+40>>3];p=+h[e+48>>3];q=o*o+p*p;h[e+120>>3]=q;h[e+128>>3]=q+1.0;h[e+136>>3]=q+-1.0;c[e+1888>>2]=90;c[e+1892>>2]=2;k=n;l=q}q=k*b;b=k*d;d=q*q+b*b;if(l==0.0){if(d!=0.0){r=+ef(q,-0.0-b)}else{r=0.0}h[f>>3]=r;if(d<.5){h[g>>3]=+ec(+O(+d));s=0;return s|0}if(d>1.0){s=2;return s|0}h[g>>3]=+ed(+O(+(1.0-d)));s=0;return s|0}j=e+40|0;i=e+48|0;r=q*+h[j>>3]+b*+h[i>>3];do{if(d<1.0e-10){h[g>>3]=90.0- +O(+(d/(r+1.0)))*57.29577951308232;t=d*.5}else{k=+h[e+128>>3];n=r-l;p=n*n-k*(d-r-r+ +h[e+136>>3]);if(p<0.0){s=2;return s|0}o=+O(+p);p=(o-n)/k;v=(-0.0-n-o)/k;k=p>v?p:v;do{if(k>1.0){if(k+-1.0<1.0e-13){w=1.0;break}w=p<v?p:v}else{w=k}}while(0);k=w<-1.0&w+1.0>-1.0e-13?-1.0:w;if(k>1.0|k<-1.0){s=2;return s|0}else{h[g>>3]=+ed(k);t=1.0-k;break}}}while(0);w=t*+h[i>>3]-b;b=q-t*+h[j>>3];if(w==0.0&b==0.0){h[f>>3]=0.0;s=0;return s|0}else{h[f>>3]=+ef(b,w);s=0;return s|0}return 0}function dr(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0.0,t=0.0,v=0.0;i=e+4|0;if((c[i>>2]|0)==106){j=+h[e+112>>3];k=90.0-d;l=k*j;m=+ea(b);n=l*m;h[f>>3]=n;o=-0.0-l;p=+d9(b);q=p*o;h[g>>3]=q;return 0}r=e;u=4411969;a[r]=u&255;u=u>>8;a[r+1|0]=u&255;u=u>>8;a[r+2|0]=u&255;u=u>>8;a[r+3|0]=u&255;c[i>>2]=106;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;s=+h[i>>3];if(s==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;t=1.0}else{v=s*3.141592653589793/180.0;h[e+112>>3]=v;h[e+120>>3]=1.0/v;t=v}c[e+1888>>2]=26;c[e+1892>>2]=32;j=t;k=90.0-d;l=k*j;m=+ea(b);n=l*m;h[f>>3]=n;o=-0.0-l;p=+d9(b);q=p*o;h[g>>3]=q;return 0}function ds(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0;i=e+4|0;if((c[i>>2]|0)!=106){j=e;u=4411969;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=106;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0}else{l=k*3.141592653589793/180.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=26;c[e+1892>>2]=32}l=+O(+(b*b+d*d));if(l==0.0){m=0.0;h[f>>3]=m;n=e+120|0;o=+h[n>>3];p=l*o;q=90.0-p;h[g>>3]=q;return 0}m=+ef(b,-0.0-d);h[f>>3]=m;n=e+120|0;o=+h[n>>3];p=l*o;q=90.0-p;h[g>>3]=q;return 0}function dt(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0.0;g=d+4|0;i=c[g>>2]|0;do{if((((i|0)>-1?i:-i|0)|0)!=107){if((c9(d)|0)==0){break}else{j=1}return j|0}}while(0);k=(90.0-b)*3.141592653589793/180.0;b=(k*(k*(k*(k*(k*(k*(k*(k*(k*(k*0.0+ +h[d+104>>3])+ +h[d+96>>3])+ +h[d+88>>3])+ +h[d+80>>3])+ +h[d+72>>3])+ +h[d+64>>3])+ +h[d+56>>3])+ +h[d+48>>3])+ +h[d+40>>3])+ +h[d+32>>3])*+h[d+24>>3];h[e>>3]=b*+ea(a);h[f>>3]=+d9(a)*(-0.0-b);do{if((c[g>>2]|0)>0){if(k>+h[d+112>>3]){j=2}else{break}return j|0}}while(0);j=0;return j|0}function du(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0,x=0.0,y=0.0,z=0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0;g=c[d+4>>2]|0;do{if((((g|0)>-1?g:-g|0)|0)!=107){if((c9(d)|0)==0){break}else{i=1}return i|0}}while(0);g=c[d+272>>2]|0;j=+O(+(a*a+b*b));k=j/+h[d+24>>3];if((g|0)<1){i=1;return i|0}L167:do{switch(g|0){case 1:{l=(k- +h[d+32>>3])/+h[d+40>>3];break};case 2:{j=+h[d+48>>3];m=+h[d+40>>3];n=m*m-j*4.0*(+h[d+32>>3]-k);if(n<0.0){i=2;return i|0}o=+O(+n);n=j*2.0;j=(o-m)/n;p=(-0.0-m-o)/n;n=j<p?j:p;if(n<-1.0e-13){q=j>p?j:p}else{q=n}if(q<0.0){if(q<-1.0e-13){i=2}else{l=0.0;break L167}return i|0}if(q<=3.141592653589793){l=q;break L167}if(q>3.141592653589893){i=2}else{l=3.141592653589793;break L167}return i|0};default:{n=+h[d+32>>3];p=+h[d+112>>3];j=+h[d+120>>3];if(k<n){if(k<n+-1.0e-13){i=2}else{l=0.0;break L167}return i|0}if(k>j){if(k>j+1.0e-13){i=2}else{l=p;break L167}return i|0}if((g|0)>-1){r=p;s=0.0;t=0.0;u=j;v=n;w=0}else{o=0.0-k;m=p;p=0.0;x=0.0;y=j;j=n;z=0;while(1){if((z|0)>=100){l=x;break L167}n=(y-k)/(y-j);do{if(n<.1){A=.1}else{if(n<=.9){A=n;break}A=.9}}while(0);n=m-(m-p)*A;if(k>0.0){if(k<1.0e-13){l=n;break L167}else{B=m;C=n;D=y;E=0.0}}else{if(o<1.0e-13){l=n;break L167}else{B=n;C=p;D=0.0;E=j}}if(+N(+(B-C))<1.0e-13){l=n;break L167}else{m=B;p=C;x=n;y=D;j=E;z=z+1|0}}}while(1){if((w|0)>=100){l=t;break L167}j=(u-k)/(u-v);do{if(j<.1){F=.1}else{if(j<=.9){F=j;break}F=.9}}while(0);j=r-(r-s)*F;z=g;y=0.0;while(1){G=j*y+ +h[d+32+(z<<3)>>3];if((z|0)>0){z=z-1|0;y=G}else{break}}if(G<k){if(k-G<1.0e-13){l=j;break L167}else{H=r;I=j;J=u;K=G}}else{if(G-k<1.0e-13){l=j;break L167}else{H=j;I=s;J=G;K=v}}if(+N(+(H-I))<1.0e-13){l=j;break}else{r=H;s=I;t=j;u=J;v=K;w=w+1|0}}}}}while(0);if(k==0.0){L=0.0}else{L=+ef(a,-0.0-b)}h[e>>3]=L;h[f>>3]=90.0-l*180.0/3.141592653589793;i=0;return i|0}function dv(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0;i=e+4|0;if((c[i>>2]|0)==108){j=+h[e+112>>3]}else{k=e;u=4277594;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=108;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648;m=114.59155902616465}else{n=l*2.0;h[e+112>>3]=n;h[e+120>>3]=1.0/n;m=n}c[e+1888>>2]=86;c[e+1892>>2]=6;j=m}m=j*+ea((90.0-d)*.5);h[f>>3]=m*+ea(b);h[g>>3]=+d9(b)*(-0.0-m);return 0}function dw(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0;i=e+4|0;if((c[i>>2]|0)!=108){j=e;u=4277594;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=108;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=114.59155902616465;h[e+120>>3]=.008726646259971648}else{l=k*2.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=86;c[e+1892>>2]=6}l=+O(+(b*b+d*d));if(l==0.0){m=0.0}else{m=+ef(b,-0.0-d)}h[f>>3]=m;m=l*+h[e+120>>3];do{if(+N(+m)>1.0){if(+N(+(l- +h[e+112>>3]))<1.0e-12){n=-90.0;break}else{o=2}return o|0}else{n=90.0- +ed(m)*2.0}}while(0);h[g>>3]=n;o=0;return o|0}function dx(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0.0;i=e+4|0;if((c[i>>2]|0)!=109){j=e;u=5392705;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=109;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;l=57.29577951308232}else{l=k}k=l*2.0;i=e+112|0;h[i>>3]=k;l=+h[e+40>>3];do{if(l==90.0){h[e+120>>3]=-.5;h[e+128>>3]=1.0;m=k;n=1.0}else{if(l>-90.0){o=+d9((90.0-l)*.5);p=o*o;q=+Y(+o)*p/(1.0-p);h[e+120>>3]=q;p=.5-q;h[e+128>>3]=p;m=+h[i>>3];n=p;break}else{r=1;return r|0}}}while(0);h[e+136>>3]=n*m;h[e+144>>3]=1.0e-4;h[e+152>>3]=n*1.0e-4;h[e+160>>3]=57.29577951308232/n;c[e+1888>>2]=36;c[e+1892>>2]=88}do{if(d==90.0){s=0.0}else{if(d<=-90.0){r=2;return r|0}n=90.0-d;m=n*.017453292519943295*.5;if(m<+h[e+144>>3]){s=m*+h[e+136>>3];break}else{m=+d9(n*.5);n=+O(+(1.0-m*m))/m;l=-0.0- +h[e+112>>3];k=+Y(+m)/n;s=(k+n*+h[e+120>>3])*l;break}}}while(0);h[f>>3]=s*+ea(b);h[g>>3]=+d9(b)*(-0.0-s);r=0;return r|0}function dy(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0.0,C=0.0,D=0.0,E=0,F=0.0,G=0.0,H=0.0,I=0.0,J=0;i=e+4|0;if((c[i>>2]|0)==109){j=+h[e+112>>3]}else{k=e;u=5392705;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=109;h[e+8>>3]=0.0;h[e+16>>3]=90.0;i=e+24|0;l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;m=57.29577951308232}else{m=l}l=m*2.0;i=e+112|0;h[i>>3]=l;m=+h[e+40>>3];do{if(m==90.0){h[e+120>>3]=-.5;h[e+128>>3]=1.0;n=l;o=1.0}else{if(m>-90.0){p=+d9((90.0-m)*.5);q=p*p;r=+Y(+p)*q/(1.0-q);h[e+120>>3]=r;q=.5-r;h[e+128>>3]=q;n=+h[i>>3];o=q;break}else{s=1;return s|0}}}while(0);h[e+136>>3]=o*n;h[e+144>>3]=1.0e-4;h[e+152>>3]=o*1.0e-4;h[e+160>>3]=57.29577951308232/o;c[e+1888>>2]=36;c[e+1892>>2]=88;j=n}n=+O(+(b*b+d*d))/j;if(n==0.0){t=0.0;v=0.0}else{do{if(n<+h[e+152>>3]){w=n*+h[e+160>>3]}else{i=e+120|0;j=0.0;o=1.0;k=0;m=0.0;l=0.0;while(1){if((k|0)>=30){x=j;y=m;break}q=o*.5;r=+O(+(1.0-q*q))/q;p=+Y(+q)/r;z=-0.0-(p+r*+h[i>>3]);if(n>z){j=q;o=q;k=k+1|0;m=z;l=z}else{x=q;y=z;break}}if((k|0)==30){s=2;return s|0}m=+h[i>>3];j=l;z=y;A=0;q=o;r=x;while(1){p=(z-n)/(z-j);do{if(p<.1){B=.1}else{if(p<=.9){B=p;break}B=.9}}while(0);C=r-(r-q)*B;p=+O(+(1.0-C*C))/C;D=+Y(+C)/p+p*m;p=-0.0-D;if(n>p){if(n+D<1.0e-12){E=A;break}else{F=r;G=C;H=z;I=p}}else{if(p-n<1.0e-12){E=A;break}else{F=C;G=q;H=p;I=j}}J=A+1|0;if((J|0)<100){j=I;z=H;A=J;q=G;r=F}else{E=J;break}}if((E|0)==100){s=2;return s|0}else{w=+ec(C);break}}}while(0);t=+ef(b,-0.0-d);v=w}h[f>>3]=t;h[g>>3]=90.0-v*2.0;s=0;return s|0}function dz(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0;i=e+4|0;if((c[i>>2]|0)==201){j=+h[e+40>>3]}else{k=e;u=5265731;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=201;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];do{if(l==0.0){h[i>>3]=57.29577951308232;m=+h[e+48>>3];h[e+112>>3]=m;if(m==0.0){n=1;return n|0}h[e+120>>3]=1.0/m;o=+h[e+40>>3];p=(m+o)*57.29577951308232;h[e+128>>3]=p;if(p==0.0){n=1;return n|0}else{h[e+136>>3]=1.0/p;q=o;break}}else{o=+h[e+48>>3];p=l*o*3.141592653589793/180.0;h[e+112>>3]=p;if(p==0.0){n=1;return n|0}h[e+120>>3]=1.0/p;p=+h[e+40>>3];m=l*(o+p);h[e+128>>3]=m;if(m==0.0){n=1;return n|0}else{h[e+136>>3]=1.0/m;q=p;break}}}while(0);c[e+1888>>2]=18;c[e+1892>>2]=104;j=q}q=j+ +d9(d);if(q==0.0){n=2;return n|0}h[f>>3]=+h[e+112>>3]*b;b=+h[e+128>>3];h[g>>3]=b*+ea(d)/q;n=0;return n|0}function dA(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0;i=e+4|0;if((c[i>>2]|0)==201){j=+h[e+120>>3]}else{k=e;u=5265731;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=201;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];do{if(l==0.0){h[i>>3]=57.29577951308232;m=+h[e+48>>3];h[e+112>>3]=m;if(m==0.0){n=1;return n|0}o=1.0/m;h[e+120>>3]=o;p=(m+ +h[e+40>>3])*57.29577951308232;h[e+128>>3]=p;if(p==0.0){n=1;return n|0}else{h[e+136>>3]=1.0/p;q=o;break}}else{o=+h[e+48>>3];p=l*o*3.141592653589793/180.0;h[e+112>>3]=p;if(p==0.0){n=1;return n|0}m=1.0/p;h[e+120>>3]=m;p=l*(o+ +h[e+40>>3]);h[e+128>>3]=p;if(p==0.0){n=1;return n|0}else{h[e+136>>3]=1.0/p;q=m;break}}}while(0);c[e+1888>>2]=18;c[e+1892>>2]=104;j=q}h[f>>3]=j*b;b=+h[e+136>>3]*d;d=+ef(b,1.0);j=b*+h[e+40>>3];h[g>>3]=d+ +ed(j/+O(+(b*b+1.0)));n=0;return n|0}function dB(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0,o=0.0,p=0.0;i=e+4|0;if((c[i>>2]|0)==202){j=+h[e+112>>3]}else{k=e;u=4277571;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=202;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];do{if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;m=+h[e+40>>3];if(m<=0.0|m>1.0){n=1;return n|0}else{h[e+128>>3]=57.29577951308232/m;h[e+136>>3]=m/57.29577951308232;o=1.0;break}}else{m=l*3.141592653589793/180.0;h[e+112>>3]=m;h[e+120>>3]=57.29577951308232/l;p=+h[e+40>>3];if(p<=0.0|p>1.0){n=1;return n|0}else{h[e+128>>3]=l/p;h[e+136>>3]=p/l;o=m;break}}}while(0);c[e+1888>>2]=30;c[e+1892>>2]=20;j=o}h[f>>3]=j*b;b=+h[e+128>>3];h[g>>3]=b*+ea(d);n=0;return n|0}function dC(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0.0;i=e+4|0;if((c[i>>2]|0)==202){j=+h[e+136>>3]}else{k=e;u=4277571;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=202;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];do{if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;m=+h[e+40>>3];if(m<=0.0|m>1.0){n=1;return n|0}else{h[e+128>>3]=57.29577951308232/m;o=m/57.29577951308232;h[e+136>>3]=o;p=o;break}}else{h[e+112>>3]=l*3.141592653589793/180.0;h[e+120>>3]=57.29577951308232/l;o=+h[e+40>>3];if(o<=0.0|o>1.0){n=1;return n|0}else{h[e+128>>3]=l/o;m=o/l;h[e+136>>3]=m;p=m;break}}}while(0);c[e+1888>>2]=30;c[e+1892>>2]=20;j=p}p=j*d;d=+N(+p);do{if(d>1.0){if(d>1.0000000000001){n=2;return n|0}else{q=p<0.0?-1.0:1.0;break}}else{q=p}}while(0);h[f>>3]=+h[e+120>>3]*b;h[g>>3]=+ed(q);n=0;return n|0}function dD(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0;i=e+4|0;if((c[i>>2]|0)==203){j=e+112|0;k=+h[j>>3];l=j;m=k*b;h[f>>3]=m;n=+h[l>>3];o=n*d;h[g>>3]=o;return 0}j=e;u=5390659;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=203;i=e+24|0;ey(e+8|0,0,16);p=+h[i>>3];if(p==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;q=1.0}else{r=p*3.141592653589793/180.0;h[e+112>>3]=r;h[e+120>>3]=1.0/r;q=r}c[e+1888>>2]=96;c[e+1892>>2]=92;k=q;l=e+112|0;m=k*b;h[f>>3]=m;n=+h[l>>3];o=n*d;h[g>>3]=o;return 0}function dE(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0;i=e+4|0;if((c[i>>2]|0)==203){j=e+120|0;k=+h[j>>3];l=j;m=k*b;h[f>>3]=m;n=+h[l>>3];o=n*d;h[g>>3]=o;return 0}j=e;u=5390659;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=203;i=e+24|0;ey(e+8|0,0,16);p=+h[i>>3];if(p==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;q=1.0}else{r=p*3.141592653589793/180.0;h[e+112>>3]=r;p=1.0/r;h[e+120>>3]=p;q=p}c[e+1888>>2]=96;c[e+1892>>2]=92;k=q;l=e+120|0;m=k*b;h[f>>3]=m;n=+h[l>>3];o=n*d;h[g>>3]=o;return 0}function dF(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0;i=e+4|0;if((c[i>>2]|0)!=204){j=e;u=5391693;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=204;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0}else{l=k*3.141592653589793/180.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=80;c[e+1892>>2]=28}if(d<=-90.0|d>=90.0){m=2;return m|0}h[f>>3]=+h[e+112>>3]*b;b=+h[e+24>>3];h[g>>3]=b*+Y(+(+eb((d+90.0)*.5)));m=0;return m|0}function dG(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,v=0.0,w=0.0;i=e+4|0;if((c[i>>2]|0)==204){j=+h[e+120>>3];k=e+24|0;l=j*b;h[f>>3]=l;m=+h[k>>3];n=d/m;o=+X(+n);p=+ee(o);q=p*2.0;r=q+-90.0;h[g>>3]=r;return 0}s=e;u=5391693;a[s]=u&255;u=u>>8;a[s+1|0]=u&255;u=u>>8;a[s+2|0]=u&255;u=u>>8;a[s+3|0]=u&255;c[i>>2]=204;i=e+24|0;ey(e+8|0,0,16);t=+h[i>>3];if(t==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;v=1.0}else{w=t*3.141592653589793/180.0;h[e+112>>3]=w;t=1.0/w;h[e+120>>3]=t;v=t}c[e+1888>>2]=80;c[e+1892>>2]=28;j=v;k=i;l=j*b;h[f>>3]=l;m=+h[k>>3];n=d/m;o=+X(+n);p=+ee(o);q=p*2.0;r=q+-90.0;h[g>>3]=r;return 0}function dH(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;i=e+4|0;if((c[i>>2]|0)==301){j=e+112|0;k=+h[j>>3];l=j;m=k*b;n=+d9(d);o=m*n;h[f>>3]=o;p=+h[l>>3];q=p*d;h[g>>3]=q;return 0}j=e;u=4998739;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=301;i=e+24|0;ey(e+8|0,0,16);r=+h[i>>3];if(r==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;s=1.0}else{t=r*3.141592653589793/180.0;h[e+112>>3]=t;h[e+120>>3]=1.0/t;s=t}c[e+1888>>2]=34;c[e+1892>>2]=54;k=s;l=e+112|0;m=k*b;n=+d9(d);o=m*n;h[f>>3]=o;p=+h[l>>3];q=p*d;h[g>>3]=q;return 0}function dI(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0;i=e+4|0;if((c[i>>2]|0)==301){j=+h[e+24>>3]}else{k=e;u=4998739;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=301;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;m=57.29577951308232}else{n=l*3.141592653589793/180.0;h[e+112>>3]=n;h[e+120>>3]=1.0/n;m=l}c[e+1888>>2]=34;c[e+1892>>2]=54;j=m}m=+Q(+(d/j));i=e+120|0;if(m==0.0){o=0.0;h[f>>3]=o;p=+h[i>>3];q=p*d;h[g>>3]=q;return 0}o=+h[i>>3]*b/m;h[f>>3]=o;p=+h[i>>3];q=p*d;h[g>>3]=q;return 0}function dJ(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0;i=e+4|0;if((c[i>>2]|0)!=302){j=e;u=5390672;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=302;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=180.0;h[e+136>>3]=.005555555555555556}else{l=k*3.141592653589793;k=l/180.0;h[e+112>>3]=k;h[e+120>>3]=1.0/k;h[e+128>>3]=l;h[e+136>>3]=1.0/l}c[e+1888>>2]=94;c[e+1892>>2]=38}l=+ea(d/3.0);h[f>>3]=+h[e+112>>3]*b*(1.0-l*l*4.0);h[g>>3]=l*+h[e+128>>3];return 0}function dK(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0,p=0.0;i=e+4|0;if((c[i>>2]|0)==302){j=+h[e+136>>3]}else{k=e;u=5390672;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=302;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=180.0;h[e+136>>3]=.005555555555555556;m=.005555555555555556}else{n=l*3.141592653589793;l=n/180.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l;h[e+128>>3]=n;l=1.0/n;h[e+136>>3]=l;m=l}c[e+1888>>2]=94;c[e+1892>>2]=38;j=m}m=j*d;if(m>1.0|m<-1.0){o=2;return o|0}d=1.0-m*m*4.0;do{if(d==0.0){if(b==0.0){p=0.0;break}else{o=2}return o|0}else{p=+h[e+120>>3]*b/d}}while(0);h[f>>3]=p;h[g>>3]=+ed(m)*3.0;o=0;return o|0}function dL(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0;i=e+4|0;if((c[i>>2]|0)!=303){j=e;u=5001037;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=303;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;l=57.29577951308232}else{l=k}k=l*1.4142135623730951;h[e+112>>3]=k;h[e+120>>3]=k/90.0;h[e+128>>3]=1.0/k;h[e+136>>3]=90.0/l;h[e+144>>3]=.6366197723675814;c[e+1888>>2]=48;c[e+1892>>2]=58}if(+N(+d)==90.0){h[f>>3]=0.0;l=+N(+(+h[e+112>>3]));if(d<0.0){m=-0.0-l}else{m=l}h[g>>3]=m;return 0}if(d==0.0){h[f>>3]=+h[e+120>>3]*b;h[g>>3]=0.0;return 0}m=+ea(d)*3.141592653589793;i=0;d=m;l=-3.141592653589793;k=3.141592653589793;while(1){n=d-m+ +R(+d);if(n<0.0){if(n>-1.0e-13){o=d;break}else{p=k;q=d}}else{if(n<1.0e-13){o=d;break}else{p=d;q=l}}n=(q+p)*.5;j=i+1|0;if((j|0)<100){i=j;d=n;l=q;k=p}else{o=n;break}}p=o*.5;o=+h[e+120>>3]*b;h[f>>3]=o*+Q(+p);o=+h[e+112>>3];h[g>>3]=o*+R(+p);return 0}function dM(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0.0;i=e+4|0;if((c[i>>2]|0)==303){j=+h[e+24>>3]}else{k=e;u=5001037;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=303;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;m=57.29577951308232}else{m=l}l=m*1.4142135623730951;h[e+112>>3]=l;h[e+120>>3]=l/90.0;h[e+128>>3]=1.0/l;h[e+136>>3]=90.0/m;h[e+144>>3]=.6366197723675814;c[e+1888>>2]=48;c[e+1892>>2]=58;j=m}m=d/j;j=2.0-m*m;do{if(j>1.0e-12){l=+O(+j);n=l;o=+h[e+136>>3]*b/l}else{if(j<-1.0e-12){p=2;return p|0}if(+N(+b)>1.0e-12){p=2}else{n=0.0;o=0.0;break}return p|0}}while(0);h[f>>3]=o;o=+h[e+128>>3]*d;d=+N(+o);do{if(d>1.0){if(d>1.000000000001){p=2;return p|0}else{q=(o<0.0?-1.0:1.0)+m*n/3.141592653589793;break}}else{b=+U(+o);q=b*+h[e+144>>3]+m*n/3.141592653589793}}while(0);n=+N(+q);do{if(n>1.0){if(n>1.000000000001){p=2;return p|0}else{r=q<0.0?-1.0:1.0;break}}else{r=q}}while(0);h[g>>3]=+ed(r);p=0;return p|0}function dN(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0,l=0.0,m=0.0,n=0.0;i=e+4|0;if((c[i>>2]|0)==401){j=e+112|0}else{k=e;u=5523777;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=401;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;m=57.29577951308232}else{m=l}l=m*2.0;n=m*l;i=e+112|0;h[i>>3]=n;m=1.0/(n*2.0);h[e+120>>3]=m;h[e+128>>3]=m*.25;h[e+136>>3]=1.0/l;c[e+1888>>2]=14;c[e+1892>>2]=72;j=i}l=+d9(d);m=+h[j>>3];n=b*.5;b=+O(+(m/(l*+d9(n)+1.0)));h[f>>3]=+ea(n)*l*b*2.0;h[g>>3]=b*+ea(d);return 0}function dO(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0.0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0;i=e+4|0;if((c[i>>2]|0)==401){j=+h[e+128>>3];k=+h[e+120>>3]}else{l=e;u=5523777;a[l]=u&255;u=u>>8;a[l+1|0]=u&255;u=u>>8;a[l+2|0]=u&255;u=u>>8;a[l+3|0]=u&255;c[i>>2]=401;i=e+24|0;ey(e+8|0,0,16);m=+h[i>>3];if(m==0.0){h[i>>3]=57.29577951308232;n=57.29577951308232}else{n=m}m=n*2.0;o=n*m;h[e+112>>3]=o;n=1.0/(o*2.0);h[e+120>>3]=n;o=n*.25;h[e+128>>3]=o;h[e+136>>3]=1.0/m;c[e+1888>>2]=14;c[e+1892>>2]=72;j=o;k=n}n=1.0-b*b*j-d*d*k;do{if(n<0.0){if(n<-1.0e-13){p=2}else{q=0.0;break}return p|0}else{q=n}}while(0);n=+O(+q);q=n*d/+h[e+24>>3];d=+N(+q);do{if(d>1.0){if(d>1.0000000000001){p=2;return p|0}else{r=q<0.0?-1.0:1.0;break}}else{r=q}}while(0);q=n*n*2.0+-1.0;d=n*b*+h[e+136>>3];if(q==0.0&d==0.0){s=0.0}else{s=+ef(d,q)*2.0}h[f>>3]=s;h[g>>3]=+ed(r);p=0;return p|0}function dP(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0,k=0.0,l=0.0,m=0,n=0.0,o=0.0;g=d+4|0;i=c[g>>2]|0;do{if((((i|0)>-1?i:-i|0)|0)!=501){if((da(d)|0)==0){break}else{j=1}return j|0}}while(0);k=b- +h[d+40>>3];b=+d9(k);if(b==0.0){j=2;return j|0}i=d+112|0;l=+h[i>>3]*a;m=d+128|0;a=+h[m>>3];n=+h[d+136>>3];o=a-n*+ea(k)/b;h[e>>3]=o*+ea(l);b=+h[m>>3];h[f>>3]=b-o*+d9(l);do{if((c[g>>2]|0)>0){if(o*+h[i>>3]<0.0){j=2}else{break}return j|0}}while(0);j=0;return j|0}function dQ(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0;g=c[d+4>>2]|0;do{if((((g|0)>-1?g:-g|0)|0)!=501){if((da(d)|0)==0){break}else{i=1}return i|0}}while(0);j=+h[d+128>>3]-b;b=+O(+(a*a+j*j));g=d+40|0;if(+h[g>>3]<0.0){k=-0.0-b}else{k=b}if(k==0.0){l=0.0}else{l=+ef(a/k,j/k)}h[e>>3]=l*+h[d+120>>3];l=+h[g>>3];h[f>>3]=l+ +ee(+h[d+152>>3]-k*+h[d+144>>3]);i=0;return i|0}function dR(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0.0,j=0.0,k=0.0,l=0.0;do{if((c[d+4>>2]|0)!=502){if((db(d)|0)==0){break}else{g=1}return g|0}}while(0);i=+h[d+112>>3]*a;if(b==-90.0){j=+h[d+176>>3]}else{a=+h[d+136>>3];k=+h[d+144>>3];l=+h[d+152>>3];j=a*+O(+(k-l*+ea(b)))}h[e>>3]=j*+ea(i);b=+h[d+128>>3];h[f>>3]=b-j*+d9(i);g=0;return g|0}function dS(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0.0,j=0.0,k=0.0;do{if((c[d+4>>2]|0)!=502){if((db(d)|0)==0){break}else{g=1}return g|0}}while(0);i=+h[d+128>>3]-b;b=+O(+(a*a+i*i));if(+h[d+40>>3]<0.0){j=-0.0-b}else{j=b}if(j==0.0){k=0.0}else{k=+ef(a/j,i/j)}h[e>>3]=k*+h[d+120>>3];if(+N(+(j- +h[d+176>>3]))<1.0e-12){h[f>>3]=-90.0;g=0;return g|0}k=(+h[d+160>>3]-j*j)*+h[d+168>>3];if(+N(+k)<=1.0){h[f>>3]=+ed(k);g=0;return g|0}if(+N(+(k+-1.0))<1.0e-12){h[f>>3]=90.0;g=0;return g|0}if(+N(+(k+1.0))>=1.0e-12){g=2;return g|0}h[f>>3]=-90.0;g=0;return g|0}function dT(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0.0;do{if((c[d+4>>2]|0)!=503){if((dc(d)|0)==0){break}else{g=1}return g|0}}while(0);i=+h[d+112>>3]*a;a=+h[d+136>>3]-b;h[e>>3]=a*+ea(i);b=+h[d+128>>3];h[f>>3]=b-a*+d9(i);g=0;return g|0}function dU(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0.0,j=0.0,k=0.0;do{if((c[d+4>>2]|0)!=503){if((dc(d)|0)==0){break}else{g=1}return g|0}}while(0);i=+h[d+128>>3]-b;b=+O(+(a*a+i*i));if(+h[d+40>>3]<0.0){j=-0.0-b}else{j=b}if(j==0.0){k=0.0}else{k=+ef(a/j,i/j)}h[e>>3]=k*+h[d+120>>3];h[f>>3]=+h[d+136>>3]-j;g=0;return g|0}function dV(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0;do{if((c[d+4>>2]|0)!=504){if((dd(d)|0)==0){break}else{g=1}return g|0}}while(0);i=d+112|0;j=+h[i>>3];k=j*a;do{if(b==-90.0){if(j<0.0){l=0.0;break}else{g=2}return g|0}else{a=+h[d+136>>3];m=+eb((90.0-b)*.5);l=a*+P(+m,+(+h[i>>3]))}}while(0);h[e>>3]=l*+ea(k);b=+h[d+128>>3];h[f>>3]=b-l*+d9(k);g=0;return g|0}function dW(a,b,d,e,f){a=+a;b=+b;d=d|0;e=e|0;f=f|0;var g=0,i=0.0,j=0.0,k=0.0,l=0;do{if((c[d+4>>2]|0)!=504){if((dd(d)|0)==0){break}else{g=1}return g|0}}while(0);i=+h[d+128>>3]-b;b=+O(+(a*a+i*i));if(+h[d+40>>3]<0.0){j=-0.0-b}else{j=b}do{if(j==0.0){h[e>>3]=+h[d+120>>3]*0.0;if(+h[d+112>>3]<0.0){k=-90.0;break}else{g=2}return g|0}else{b=+ef(a/j,i/j);l=d+120|0;h[e>>3]=b*+h[l>>3];k=90.0- +ee(+P(+(j*+h[d+144>>3]),+(+h[l>>3])))*2.0}}while(0);h[f>>3]=k;g=0;return g|0}function dX(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0,r=0.0;i=e+4|0;j=c[i>>2]|0;if(+h[e+40>>3]!=0.0){if((j|0)!=601){de(e)|0}k=e+128|0;l=+h[k>>3]- +h[e+120>>3]*d;m=+h[e+24>>3]*b;n=m*+d9(d)/l;h[f>>3]=l*+ea(n);m=+h[k>>3];o=m-l*+d9(n);h[g>>3]=o;return 0}if((j|0)==301){j=e+112|0;p=+h[j>>3];q=j}else{j=e;u=4998739;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=301;i=e+24|0;ey(e+8|0,0,16);n=+h[i>>3];if(n==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;r=1.0}else{l=n*3.141592653589793/180.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l;r=l}c[e+1888>>2]=34;c[e+1892>>2]=54;p=r;q=e+112|0}h[f>>3]=p*b*+d9(d);o=+h[q>>3]*d;h[g>>3]=o;return 0}function dY(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0,m=0.0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,v=0.0,w=0.0,x=0.0;i=e+40|0;j=+h[i>>3];k=e+4|0;l=c[k>>2]|0;if(j==0.0){if((l|0)==301){m=+h[e+24>>3]}else{n=e;u=4998739;a[n]=u&255;u=u>>8;a[n+1|0]=u&255;u=u>>8;a[n+2|0]=u&255;u=u>>8;a[n+3|0]=u&255;c[k>>2]=301;k=e+24|0;ey(e+8|0,0,16);o=+h[k>>3];if(o==0.0){h[k>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;p=57.29577951308232}else{q=o*3.141592653589793/180.0;h[e+112>>3]=q;h[e+120>>3]=1.0/q;p=o}c[e+1888>>2]=34;c[e+1892>>2]=54;m=p}p=+Q(+(d/m));k=e+120|0;if(p==0.0){r=0.0}else{r=+h[k>>3]*b/p}h[f>>3]=r;h[g>>3]=+h[k>>3]*d;return 0}else{if((l|0)==601){s=j}else{de(e)|0;s=+h[i>>3]}i=e+128|0;j=+h[i>>3];r=j-d;d=+O(+(b*b+r*r));if(s<0.0){t=-0.0-d}else{t=d}if(t==0.0){v=0.0;w=j}else{j=+ef(b/t,r/t);v=j;w=+h[i>>3]}j=(w-t)/+h[e+120>>3];h[g>>3]=j;w=+d9(j);if(w==0.0){x=0.0}else{x=v*(t/+h[e+24>>3])/w}h[f>>3]=x;return 0}return 0}function dZ(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0;i=e+4|0;if((c[i>>2]|0)!=602){j=e;u=5194576;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=602;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=114.59155902616465}else{l=k*3.141592653589793/180.0;h[e+112>>3]=l;h[e+120>>3]=1.0/l;h[e+128>>3]=k*2.0}c[e+1888>>2]=70;c[e+1892>>2]=66}k=+d9(d);l=+ea(d);m=l*b;if(l==0.0){h[f>>3]=+h[e+112>>3]*b;n=0.0;h[g>>3]=n;return 0}else{b=k/l;i=e+24|0;l=b*+h[i>>3];h[f>>3]=l*+ea(m);l=+h[i>>3];n=l*(d*3.141592653589793/180.0+b*(1.0- +d9(m)));h[g>>3]=n;return 0}return 0}function d_(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,v=0.0,w=0,x=0.0,y=0;i=e+4|0;if((c[i>>2]|0)==602){j=+h[e+120>>3]}else{k=e;u=5194576;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=602;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=1.0;h[e+120>>3]=1.0;h[e+128>>3]=114.59155902616465;m=1.0}else{n=l*3.141592653589793/180.0;h[e+112>>3]=n;o=1.0/n;h[e+120>>3]=o;h[e+128>>3]=l*2.0;m=o}c[e+1888>>2]=70;c[e+1892>>2]=66;j=m}m=+N(+(j*d));if(m<1.0e-12){h[f>>3]=j*b;h[g>>3]=0.0;return 0}if(+N(+(m+-90.0))<1.0e-12){h[f>>3]=0.0;h[g>>3]=d<0.0?-90.0:90.0;return 0}m=d>0.0?90.0:-90.0;j=b*b;i=e+112|0;o=d-m*+h[i>>3];k=e+128|0;l=0.0;n=m;m=j+o*o;o=-999.0;p=0;while(1){if(o<-100.0){q=(l+n)*.5}else{r=m/(m-o);do{if(r<.1){s=.1}else{if(r<=.9){s=r;break}s=.9}}while(0);q=n-(n-l)*s}h[g>>3]=q;t=d-q*+h[i>>3];v=+eb(q);r=j+t*(t- +h[k>>3]/v);if(+N(+r)<1.0e-12){break}if(+N(+(n-l))<1.0e-12){break}w=r>0.0;x=+h[g>>3];y=p+1|0;if((y|0)<64){l=w?l:x;n=w?x:n;m=w?r:m;o=w?o:r;p=y}else{break}}o=+h[e+24>>3]-v*t;t=v*b;if(o==0.0&t==0.0){h[f>>3]=0.0;return 0}else{b=+ef(t,o);h[f>>3]=b/+ea(+h[g>>3]);return 0}return 0}function d$(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0,q=0.0,r=0,s=0.0,t=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0.0,A=0.0;i=e+4|0;if((c[i>>2]|0)!=701){j=e;u=4412244;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=701;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223}else{l=k*3.141592653589793*.25;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=46;c[e+1892>>2]=100}l=+d9(d);k=l*+d9(b);m=l*+ea(b);b=+ea(d);i=k>b;d=i?k:b;j=m>d;l=j?m:d;d=-0.0-k;n=l<d;o=n?d:l;l=-0.0-m;p=o<l;q=p?l:o;o=-0.0-b;r=q<o;s=r?o:q;switch((r?5:p?4:n?3:j?2:i&1)|0){case 1:{t=b/s;v=m/s;w=0.0;x=0.0;break};case 0:{t=d/s;v=m/s;w=2.0;x=0.0;break};case 3:{t=b/s;v=l/s;w=0.0;x=4.0;break};case 2:{t=b/s;v=d/s;w=0.0;x=2.0;break};case 5:{t=k/s;v=m/s;w=-2.0;x=0.0;break};case 4:{t=b/s;v=k/s;w=0.0;x=6.0;break};default:{t=0.0;v=0.0;w=0.0;x=0.0}}s=+N(+v);do{if(s>1.0){if(s>1.000000000001){y=2;return y|0}else{z=v<0.0?-1.0:1.0;break}}else{z=v}}while(0);v=+N(+t);do{if(v>1.0){if(v>1.000000000001){y=2;return y|0}else{A=t<0.0?-1.0:1.0;break}}else{A=t}}while(0);i=e+112|0;h[f>>3]=(x+z)*+h[i>>3];h[g>>3]=(w+A)*+h[i>>3];y=0;return y|0}function d0(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0;i=e+4|0;if((c[i>>2]|0)==701){j=+h[e+120>>3]}else{k=e;u=4412244;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=701;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223;m=.022222222222222223}else{n=l*3.141592653589793*.25;h[e+112>>3]=n;l=1.0/n;h[e+120>>3]=l;m=l}c[e+1888>>2]=46;c[e+1892>>2]=100;j=m}m=j*b;b=j*d;d=+N(+m);do{if(d>1.0){if(d>7.0){o=2;return o|0}if(+N(+b)>1.0){o=2}else{break}return o|0}else{if(+N(+b)>3.0){o=2}else{break}return o|0}}while(0);if(m<-1.0){p=m+8.0}else{p=m}do{if(p>5.0){m=p+-6.0;d=-1.0/+O(+(b*b+(m*m+1.0)));j=-0.0-d;q=b*j;r=d;s=m*j}else{if(p>3.0){j=p+-4.0;m=-1.0/+O(+(b*b+(j*j+1.0)));q=b*(-0.0-m);r=j*m;s=m;break}if(p>1.0){m=p+-2.0;j=1.0/+O(+(b*b+(m*m+1.0)));q=b*j;r=j;s=m*(-0.0-j);break}if(b>1.0){j=b+-2.0;m=1.0/+O(+(j*j+(p*p+1.0)));q=m;r=p*m;s=j*(-0.0-m);break}if(b<-1.0){m=b+2.0;j=-1.0/+O(+(m*m+(p*p+1.0)));d=-0.0-j;q=j;r=p*d;s=m*d;break}else{d=1.0/+O(+(b*b+(p*p+1.0)));q=b*d;r=p*d;s=d;break}}}while(0);if(s==0.0&r==0.0){t=0.0}else{t=+ef(r,s)}h[f>>3]=t;h[g>>3]=+ed(q);o=0;return o|0}function d1(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0,q=0.0,r=0,s=0.0,t=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0;i=e+4|0;if((c[i>>2]|0)!=702){j=e;u=4412227;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=702;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223}else{l=k*3.141592653589793*.25;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=44;c[e+1892>>2]=40}l=+d9(d);k=l*+d9(b);m=l*+ea(b);b=+ea(d);i=k>b;d=i?k:b;j=m>d;l=j?m:d;d=-0.0-k;n=l<d;o=n?d:l;l=-0.0-m;p=o<l;q=p?l:o;o=-0.0-b;r=q<o;s=r?o:q;t=r?5:p?4:n?3:j?2:i&1;switch(t|0){case 1:{v=b;w=m;x=0.0;y=0.0;break};case 2:{v=b;w=d;x=2.0;y=0.0;break};case 4:{v=b;w=k;x=6.0;y=0.0;break};case 3:{v=b;w=l;x=4.0;y=0.0;break};case 0:{v=d;w=m;x=0.0;y=2.0;break};default:{v=k;w=m;x=0.0;y=(t|0)==5?-2.0:0.0}}m=w/s;w=v/s;s=m*m;v=w*w;k=1.0-s;d=1.0-v;l=+N(+(m*w));if(s>1.0e-16){z=s*s}else{z=0.0}if(v>1.0e-16){A=v*v}else{A=0.0}if(l>1.0e-16){B=s*v*.15384112298488617}else{B=0.0}l=m*(s+k*(s*(-.15959623456001282-k*(s*-.021776249632239342+.07591962069272995))+(v*(s*.004869491793215275+k*-.1316167116165161+d*(A*.10695946961641312+(z*-.1782512068748474+(s*.08097013086080551+.14118963479995728+v*-.2815285325050354+B))))+1.374848484992981)));m=w*(v+d*(v*(-.15959623456001282-d*(v*-.021776249632239342+.07591962069272995))+(s*(v*.004869491793215275+d*-.1316167116165161+k*(z*.10695946961641312+(A*-.1782512068748474+(s*-.2815285325050354+(v*.08097013086080551+.14118963479995728)+B))))+1.374848484992981)));B=+N(+l);do{if(B>1.0){if(B>1.0000001000000012){C=2;return C|0}else{D=l<0.0?-1.0:1.0;break}}else{D=l}}while(0);l=+N(+m);do{if(l>1.0){if(l>1.0000001000000012){C=2;return C|0}else{E=m<0.0?-1.0:1.0;break}}else{E=m}}while(0);t=e+112|0;h[f>>3]=(x+D)*+h[t>>3];h[g>>3]=+h[t>>3]*(y+E);C=0;return C|0}function d2(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0,p=0.0,q=0,r=0.0,s=0.0,t=0.0,v=0.0,w=0.0,x=0.0;i=e+4|0;if((c[i>>2]|0)==702){j=+h[e+120>>3]}else{k=e;u=4412227;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=702;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223;m=.022222222222222223}else{n=l*3.141592653589793*.25;h[e+112>>3]=n;l=1.0/n;h[e+120>>3]=l;m=l}c[e+1888>>2]=44;c[e+1892>>2]=40;j=m}m=j*b;b=j*d;d=+N(+m);do{if(d>1.0){if(d>7.0){o=2;return o|0}if(+N(+b)>1.0){o=2}else{break}return o|0}else{if(+N(+b)>3.0){o=2}else{break}return o|0}}while(0);if(m<-1.0){p=m+8.0}else{p=m}do{if(p>5.0){q=4;r=p+-6.0;s=b}else{if(p>3.0){q=3;r=p+-4.0;s=b;break}if(p>1.0){q=2;r=p+-2.0;s=b;break}if(b>1.0){q=0;r=p;s=b+-2.0;break}if(b>=-1.0){q=1;r=p;s=b;break}q=5;r=p;s=b+2.0}}while(0);b=r*r;p=s*s;m=r;r=m+m*(1.0-b)*(b*(b*(b*(b*(b*(b*.025843750685453415+.25795793533325195)+-.6293006539344788)+.5485238432884216)+-.22797055542469025)+-.07629968971014023)+-.2729269564151764+p*(b*(b*(b*(b*(b*-.5302233695983887+1.715475082397461)-1.7411445379257202)+.48051509261131287)+-.014715650118887424)+-.028194520622491837+p*(b*(b*(b*(b*-.8318046927452087+.9893810153007507)+.30803316831588745)+-.5680093765258789)+.27058160305023193+p*(b*(b*(b*.08693841099739075+-.9367857575416565)+1.5088008642196655)+-.6044155955314636+p*(b*(b*.3388744592666626-1.4160192012786865)+.934120774269104+p*(p*.14381584525108337+(b*.5203223824501038+-.6391530632972717)))))));m=s;s=m+m*(1.0-p)*(p*(p*(p*(p*(p*(p*.025843750685453415+.25795793533325195)+-.6293006539344788)+.5485238432884216)+-.22797055542469025)+-.07629968971014023)+-.2729269564151764+b*(p*(p*(p*(p*(p*-.5302233695983887+1.715475082397461)-1.7411445379257202)+.48051509261131287)+-.014715650118887424)+-.028194520622491837+b*(p*(p*(p*(p*-.8318046927452087+.9893810153007507)+.30803316831588745)+-.5680093765258789)+.27058160305023193+b*(p*(p*(p*.08693841099739075+-.9367857575416565)+1.5088008642196655)+-.6044155955314636+b*(p*(p*.3388744592666626-1.4160192012786865)+.934120774269104+b*(p*.5203223824501038+-.6391530632972717+b*.14381584525108337))))));switch(q|0){case 0:{b=1.0/+O(+(s*s+r*r+1.0));t=(-0.0-s)*b;v=r*b;w=b;break};case 1:{b=1.0/+O(+(s*s+r*r+1.0));t=b;v=r*b;w=s*b;break};case 2:{b=1.0/+O(+(s*s+r*r+1.0));t=(-0.0-r)*b;v=b;w=s*b;break};case 3:{b=-1.0/+O(+(s*s+r*r+1.0));t=b;v=r*b;w=(-0.0-s)*b;break};case 4:{b=-1.0/+O(+(s*s+r*r+1.0));t=(-0.0-r)*b;v=b;w=(-0.0-s)*b;break};case 5:{b=-1.0/+O(+(s*s+r*r+1.0));t=(-0.0-s)*b;v=(-0.0-r)*b;w=b;break};default:{t=0.0;v=0.0;w=0.0}}if(t==0.0&v==0.0){x=0.0}else{x=+ef(v,t)}h[f>>3]=x;h[g>>3]=+ed(w);o=0;return o|0}function d3(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0,k=0.0,l=0.0,m=0.0,n=0,o=0.0,p=0.0,q=0,r=0.0,s=0,t=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0;i=e+4|0;if((c[i>>2]|0)!=703){j=e;u=4412241;a[j]=u&255;u=u>>8;a[j+1|0]=u&255;u=u>>8;a[j+2|0]=u&255;u=u>>8;a[j+3|0]=u&255;c[i>>2]=703;i=e+24|0;ey(e+8|0,0,16);k=+h[i>>3];if(k==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223}else{l=k*3.141592653589793*.25;h[e+112>>3]=l;h[e+120>>3]=1.0/l}c[e+1888>>2]=84;c[e+1892>>2]=52}if(+N(+d)==90.0){h[f>>3]=0.0;l=+N(+(+h[e+112>>3]*2.0));if(d<0.0){m=-0.0-l}else{m=l}h[g>>3]=m;n=0;return n|0}m=+d9(d);l=m*+d9(b);k=m*+ea(b);m=+ea(d);i=l>m;o=i?l:m;j=k>o;p=j?k:o;o=-0.0-l;q=p<o;r=q?o:p;p=-0.0-k;s=r<p;t=s?p:r;r=-0.0-m;v=t<r;w=1.0-(v?r:t);L947:do{switch((v?5:s?4:q?3:j?2:i&1)|0){case 1:{if(w>=1.0e-8){x=0.0;y=0.0;z=m;A=k;B=w;break L947}t=d*3.141592653589793/180.0;r=+aX(+b,360.0);if(r<-180.0){C=r+360.0}else{C=r}if(C>180.0){D=C+-360.0}else{D=C}r=D*.017453292519943295;x=0.0;y=0.0;z=m;A=k;B=(t*t+r*r)*.5;break};case 0:{if(w>=1.0e-8){x=2.0;y=0.0;z=o;A=k;B=w;break L947}r=(90.0-d)*3.141592653589793/180.0;x=2.0;y=0.0;z=o;A=k;B=r*r*.5;break};case 2:{if(w>=1.0e-8){x=0.0;y=2.0;z=m;A=o;B=w;break L947}r=d*3.141592653589793/180.0;t=+aX(+b,360.0);if(t<-180.0){E=t+360.0}else{E=t}t=(90.0-E)*3.141592653589793/180.0;x=0.0;y=2.0;z=m;A=o;B=(r*r+t*t)*.5;break};case 4:{if(w>=1.0e-8){x=0.0;y=6.0;z=m;A=l;B=w;break L947}t=d*3.141592653589793/180.0;r=+aX(+b,360.0);if(r>180.0){F=r+-360.0}else{F=r}r=F*((F+90.0)*3.141592653589793/180.0);x=0.0;y=6.0;z=m;A=l;B=(t*t+r*r)*.5;break};case 5:{if(w>=1.0e-8){x=-2.0;y=0.0;z=l;A=k;B=w;break L947}r=(d+90.0)*3.141592653589793/180.0;x=-2.0;y=0.0;z=l;A=k;B=r*r*.5;break};case 3:{if(w>=1.0e-8){x=0.0;y=4.0;z=m;A=p;B=w;break L947}r=d*3.141592653589793/180.0;t=+aX(+b,360.0);if(t<0.0){G=t+360.0}else{G=t}t=(180.0-G)*3.141592653589793/180.0;x=0.0;y=4.0;z=m;A=p;B=(r*r+t*t)*.5;break};default:{x=0.0;y=0.0;z=0.0;A=0.0;B=w}}}while(0);do{if(A==0.0&z==0.0){H=0.0;I=0.0}else{w=+N(+z);if(w<=-0.0-A){p=z/A;m=p*p+1.0;G=-0.0- +O(+(B/(1.0-1.0/+O(+(m+1.0)))));b=+ee(p);H=G/15.0*(b- +ed(p/+O(+(m+m))));I=G;break}if(A>=w){w=z/A;G=w*w+1.0;m=+O(+(B/(1.0-1.0/+O(+(G+1.0)))));p=+ee(w);H=m/15.0*(p- +ed(w/+O(+(G+G))));I=m;break}m=+N(+A);if(m<-0.0-z){G=A/z;w=G*G+1.0;p=-0.0- +O(+(B/(1.0-1.0/+O(+(w+1.0)))));b=+ee(G);H=p;I=p/15.0*(b- +ed(G/+O(+(w+w))));break}if(z<=m){H=0.0;I=0.0;break}m=A/z;w=m*m+1.0;G=+O(+(B/(1.0-1.0/+O(+(w+1.0)))));b=+ee(m);H=G;I=G/15.0*(b- +ed(m/+O(+(w+w))))}}while(0);B=+N(+I);do{if(B>1.0){if(B>1.000000000001){n=2;return n|0}else{J=I<0.0?-1.0:1.0;break}}else{J=I}}while(0);I=+N(+H);do{if(I>1.0){if(I>1.000000000001){n=2;return n|0}else{K=H<0.0?-1.0:1.0;break}}else{K=H}}while(0);i=e+112|0;h[f>>3]=(y+J)*+h[i>>3];h[g>>3]=(x+K)*+h[i>>3];n=0;return n|0}function d4(b,d,e,f,g){b=+b;d=+d;e=e|0;f=f|0;g=g|0;var i=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0,p=0.0,q=0.0,r=0.0,s=0,t=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,P=0.0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0;i=e+4|0;if((c[i>>2]|0)==703){j=+h[e+120>>3]}else{k=e;u=4412241;a[k]=u&255;u=u>>8;a[k+1|0]=u&255;u=u>>8;a[k+2|0]=u&255;u=u>>8;a[k+3|0]=u&255;c[i>>2]=703;i=e+24|0;ey(e+8|0,0,16);l=+h[i>>3];if(l==0.0){h[i>>3]=57.29577951308232;h[e+112>>3]=45.0;h[e+120>>3]=.022222222222222223;m=.022222222222222223}else{n=l*3.141592653589793*.25;h[e+112>>3]=n;l=1.0/n;h[e+120>>3]=l;m=l}c[e+1888>>2]=84;c[e+1892>>2]=52;j=m}m=j*b;b=j*d;d=+N(+m);do{if(d>1.0){if(d>7.0){o=2;return o|0}if(+N(+b)>1.0){o=2}else{break}return o|0}else{if(+N(+b)>3.0){o=2}else{break}return o|0}}while(0);if(m<-1.0){p=m+8.0}else{p=m}do{if(p>5.0){q=b;r=p+-6.0;s=4}else{if(p>3.0){q=b;r=p+-4.0;s=3;break}if(p>1.0){q=b;r=p+-2.0;s=2;break}if(b>1.0){q=b+-2.0;r=p;s=0;break}if(b>=-1.0){q=b;r=p;s=1;break}q=b+2.0;r=p;s=5}}while(0);p=+N(+r);e=p>+N(+q);do{if(e){if(r==0.0){t=0.0;v=1.0;w=0.0;x=1.0;y=832;break}p=q*15.0/r;b=+ea(p);m=b/(+d9(p)+-.7071067811865475);p=m*m+1.0;z=p;A=r*r*(1.0-1.0/+O(+(p+1.0)));B=m;y=830}else{if(q==0.0){t=0.0;v=1.0;w=0.0;x=1.0;y=832;break}m=r*15.0/q;p=+ea(m);b=p/(+d9(m)+-.7071067811865475);m=b*b+1.0;z=m;A=q*q*(1.0-1.0/+O(+(m+1.0)));B=b;y=830}}while(0);do{if((y|0)==830){b=1.0-A;if(b>=-1.0){t=B;v=b;w=A;x=z;y=832;break}if(b<-1.000000000001){o=2}else{C=0.0;D=-1.0;E=B;break}return o|0}}while(0);if((y|0)==832){C=+O(+(w*(2.0-w)/x));D=v;E=t}L1049:do{switch(s|0){case 0:{if(e){if(r<0.0){F=-0.0-C}else{F=C}G=D;H=F;I=E*(-0.0-F);break L1049}else{if(q>0.0){J=-0.0-C}else{J=C}G=D;H=E*(-0.0-J);I=J;break L1049}break};case 3:{t=-0.0-D;if(e){if(r>0.0){K=-0.0-C}else{K=C}G=E*(-0.0-K);H=K;I=t;break L1049}else{if(q<0.0){L=-0.0-C}else{L=C}G=L;H=E*(-0.0-L);I=t;break L1049}break};case 1:{if(e){if(r<0.0){M=-0.0-C}else{M=C}G=E*M;H=M;I=D;break L1049}else{if(q<0.0){P=-0.0-C}else{P=C}G=P;H=E*P;I=D;break L1049}break};case 2:{if(e){if(r>0.0){Q=-0.0-C}else{Q=C}G=E*(-0.0-Q);H=D;I=Q;break L1049}else{if(q<0.0){R=-0.0-C}else{R=C}G=R;H=D;I=E*(-0.0-R);break L1049}break};case 4:{t=-0.0-D;if(e){if(r<0.0){S=-0.0-C}else{S=C}G=E*S;H=t;I=S;break L1049}else{if(q<0.0){T=-0.0-C}else{T=C}G=T;H=t;I=E*T;break L1049}break};case 5:{t=-0.0-D;if(e){if(r<0.0){U=-0.0-C}else{U=C}G=t;H=U;I=E*U;break L1049}else{if(q<0.0){V=-0.0-C}else{V=C}G=t;H=E*V;I=V;break L1049}break};default:{G=0.0;H=0.0;I=0.0}}}while(0);if(I==0.0&H==0.0){W=0.0}else{W=+ef(H,I)}h[f>>3]=W;h[g>>3]=+ed(G);o=0;return o|0}function d5(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0.0,g=0.0,i=0.0,j=0.0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0;f=+d9(b);g=+ea(b);i=a- +h[c>>3];a=+d9(i);j=+ea(i);k=c+32|0;l=c+24|0;m=g*+h[k>>3]-a*f*+h[l>>3];if(+N(+m)<1.0e-5){n=+d9(+h[c+8>>3]+b);o=(1.0-a)*f*+h[l>>3]-n}else{o=m}m=j*(-0.0-f);if(o!=0.0|m!=0.0){p=+ef(m,o)}else{p=i+-180.0}j=p+ +h[c+16>>3];h[d>>3]=j;do{if(j>180.0){h[d>>3]=j+-360.0}else{if(j>=-180.0){break}h[d>>3]=j+360.0}}while(0);if(+aX(+i,180.0)==0.0){i=a*+h[c+8>>3]+b;if(i>90.0){q=180.0-i}else{q=i}h[e>>3]=q;if(q>=-90.0){return 0}h[e>>3]=-180.0-q;return 0}q=g*+h[l>>3]+a*f*+h[k>>3];if(+N(+q)<=.99){h[e>>3]=+ed(q);return 0}f=+ec(+O(+(m*m+o*o)));if(q<0.0){h[e>>3]=-0.0-f;return 0}else{h[e>>3]=f;return 0}return 0}function d6(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0,s=0,t=0.0,u=0,v=0.0,w=0,x=0.0,y=0,z=0.0;g=i;i=i+80|0;j=g|0;if((c[a+5968>>2]|0)!=1){h[e>>3]=b;k=d;h[f>>3]=k;i=g;return}l=c[a+7592>>2]|0;m=c[a+8400>>2]|0;n=b- +h[a+16>>3];o=d- +h[a+24>>3];do{if((l|0)<0){p=0.0;q=j|0}else{r=0;do{s=l-r|0;t=+h[a+7600+(s*80|0)+(r<<3)>>3];u=j+(r<<3)|0;h[u>>3]=t;if((r|0)>0){v=t;w=r;do{w=w-1|0;v=o*v+ +h[a+7600+(s*80|0)+(w<<3)>>3];}while((w|0)>0);h[u>>3]=v}r=r+1|0;}while((r|0)<=(l|0));r=j|0;t=+h[r>>3];if((l|0)<=0){p=t;q=r;break}w=l+1|0;x=t;s=l;while(1){t=n*x+ +h[j+(w-s<<3)>>3];y=s-1|0;if((y|0)>0){x=t;s=y}else{p=t;q=r;break}}}}while(0);h[e>>3]=p;do{if((m|0)<0){z=+h[q>>3]}else{l=0;do{r=m-l|0;p=+h[a+8408+(r*80|0)+(l<<3)>>3];s=j+(l<<3)|0;h[s>>3]=p;if((l|0)>0){x=p;w=l;do{w=w-1|0;x=o*x+ +h[a+8408+(r*80|0)+(w<<3)>>3];}while((w|0)>0);h[s>>3]=x}l=l+1|0;}while((l|0)<=(m|0));v=+h[q>>3];if((m|0)<=0){z=v;break}l=m+1|0;p=v;w=m;while(1){v=n*p+ +h[j+(l-w<<3)>>3];r=w-1|0;if((r|0)>0){p=v;w=r}else{z=v;break}}}}while(0);h[f>>3]=z;h[e>>3]=+h[e>>3]+b;k=+h[f>>3]+d;h[f>>3]=k;i=g;return}function d7(a,b,d,e,f){a=a|0;b=+b;d=+d;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0,s=0,t=0.0,u=0,v=0.0,w=0,x=0.0,y=0,z=0.0;g=i;i=i+80|0;j=g|0;if((c[a+5968>>2]|0)!=1){h[e>>3]=b;k=d;h[f>>3]=k;i=g;return}l=c[a+5976>>2]|0;m=c[a+6784>>2]|0;n=b- +h[a+16>>3];o=d- +h[a+24>>3];do{if((l|0)<0){p=0.0;q=j|0}else{r=0;do{s=l-r|0;t=+h[a+5984+(s*80|0)+(r<<3)>>3];u=j+(r<<3)|0;h[u>>3]=t;if((r|0)>0){v=t;w=r;do{w=w-1|0;v=o*v+ +h[a+5984+(s*80|0)+(w<<3)>>3];}while((w|0)>0);h[u>>3]=v}r=r+1|0;}while((r|0)<=(l|0));r=j|0;t=+h[r>>3];if((l|0)<=0){p=t;q=r;break}w=l+1|0;x=t;s=l;while(1){t=n*x+ +h[j+(w-s<<3)>>3];y=s-1|0;if((y|0)>0){x=t;s=y}else{p=t;q=r;break}}}}while(0);h[e>>3]=p;do{if((m|0)<0){z=+h[q>>3]}else{l=0;do{r=m-l|0;p=+h[a+6792+(r*80|0)+(l<<3)>>3];s=j+(l<<3)|0;h[s>>3]=p;if((l|0)>0){x=p;w=l;do{w=w-1|0;x=o*x+ +h[a+6792+(r*80|0)+(w<<3)>>3];}while((w|0)>0);h[s>>3]=x}l=l+1|0;}while((l|0)<=(m|0));v=+h[q>>3];if((m|0)<=0){z=v;break}l=m+1|0;p=v;w=m;while(1){v=n*p+ +h[j+(l-w<<3)>>3];r=w-1|0;if((r|0)>0){p=v;w=r}else{z=v;break}}}}while(0);h[f>>3]=z;h[e>>3]=+h[e>>3]+b;k=+h[f>>3]+d;h[f>>3]=k;i=g;return}function d8(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;var f=0.0,g=0.0,i=0.0,j=0.0,k=0,l=0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0;f=+d9(b);g=+ea(b);i=a- +h[c+16>>3];a=+d9(i);j=+ea(i);k=c+32|0;l=c+24|0;m=g*+h[k>>3]-a*f*+h[l>>3];if(+N(+m)<1.0e-5){n=+d9(+h[c+8>>3]+b);o=(1.0-a)*f*+h[l>>3]-n}else{o=m}m=j*(-0.0-f);if(o!=0.0|m!=0.0){p=+ef(m,o)}else{p=i+180.0}j=p+ +h[c>>3];h[d>>3]=j;do{if(+h[c>>3]<0.0){if(j<=0.0){q=j;break}p=j+-360.0;h[d>>3]=p;q=p}else{if(j>=0.0){q=j;break}p=j+360.0;h[d>>3]=p;q=p}}while(0);do{if(q>360.0){h[d>>3]=q+-360.0}else{if(q>=-360.0){break}h[d>>3]=q+360.0}}while(0);if(+aX(+i,180.0)==0.0){i=a*+h[c+8>>3]+b;if(i>90.0){r=180.0-i}else{r=i}h[e>>3]=r;if(r>=-90.0){return 0}h[e>>3]=-180.0-r;return 0}r=g*+h[l>>3]+a*f*+h[k>>3];if(+N(+r)<=.99){h[e>>3]=+ed(r);return 0}f=+ec(+O(+(m*m+o*o)));if(r<0.0){h[e>>3]=-0.0-f;return 0}else{h[e>>3]=f;return 0}return 0}function d9(a){a=+a;var b=0.0,c=0.0,d=0.0;b=+aX(+a,360.0);c=+N(+b);do{if(b==0.0){d=1.0}else{if(c==90.0){d=0.0;break}if(c==180.0){d=-1.0;break}if(c==270.0){d=0.0;break}d=+Q(+(a*.017453292519943295))}}while(0);return+d}function ea(a){a=+a;var b=0.0,c=0.0;b=+aX(+(a+-90.0),360.0);do{if(b==0.0){c=1.0}else{if(b==90.0){c=0.0;break}if(b==180.0){c=-1.0;break}if(b==270.0){c=0.0;break}c=+R(+(a*.017453292519943295))}}while(0);return+c}function eb(a){a=+a;var b=0.0,c=0.0;b=+aX(+a,360.0);do{if(b==0.0){c=0.0}else{if(+N(+b)==180.0){c=0.0;break}if(b==45.0|b==225.0){c=1.0;break}if(b==-135.0|b==-315.0){c=-1.0;break}c=+S(+(a*.017453292519943295))}}while(0);return+c}function ec(a){a=+a;var b=0.0,c=0;do{if(a<1.0){if(a==0.0){b=90.0;break}if(a<=-1.0&a+1.0>-1.0e-10){b=180.0}else{c=1010}}else{if(a+-1.0<1.0e-10){b=0.0}else{c=1010}}}while(0);if((c|0)==1010){b=+T(+a)*57.29577951308232}return+b}function ed(a){a=+a;var b=0.0,c=0;do{if(a>-1.0){if(a==0.0){b=0.0;break}if(a>=1.0&a+-1.0<1.0e-10){b=90.0}else{c=1016}}else{if(a+1.0>-1.0e-10){b=-90.0}else{c=1016}}}while(0);if((c|0)==1016){b=+U(+a)*57.29577951308232}return+b}function ee(a){a=+a;var b=0.0;do{if(a==-1.0){b=-45.0}else{if(a==0.0){b=0.0;break}if(a==1.0){b=45.0;break}b=+V(+a)*57.29577951308232}}while(0);return+b}function ef(a,b){a=+a;b=+b;var c=0.0,d=0;do{if(a==0.0){if(b>=0.0){c=0.0;break}if(b<0.0){c=180.0}else{d=1029}}else{if(b!=0.0){d=1029;break}if(a>0.0){c=90.0;break}if(a<0.0){c=-90.0}else{d=1029}}}while(0);if((d|0)==1029){c=+W(+a,+b)*57.29577951308232}return+c}function eg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;e=d|0;if((c[a+5968>>2]|0)!=1){i=d;return}f=a+3324|0;if((c[f>>2]|0)==2){c[f>>2]=3;c[a+5976>>2]=0;c[a+6784>>2]=0;c[a+7592>>2]=0;c[a+8400>>2]=0;i=d;return}f=a+5976|0;do{if((cd(b,2368,f)|0)==0){bK(4600)}else{g=c[f>>2]|0;h=(g|0)<0;if(h){break}j=(g<<3)+8|0;k=0;do{ey(a+5984+(k*80|0)|0,0,j|0);k=k+1|0;}while((k|0)<=(g|0));if(h){break}k=e|0;j=0;do{l=g-j|0;if((l|0)>=0){m=0;do{aG(k|0,3560,(n=i,i=i+16|0,c[n>>2]=j,c[n+8>>2]=m,n)|0)|0;i=n;ck(b,k,a+5984+(j*80|0)+(m<<3)|0)|0;m=m+1|0;}while((m|0)<=(l|0))}j=j+1|0;}while((j|0)<=(g|0))}}while(0);f=a+6784|0;do{if((cd(b,2840,f)|0)==0){bK(2568)}else{g=c[f>>2]|0;j=(g|0)<0;if(j){break}k=(g<<3)+8|0;h=0;do{ey(a+6792+(h*80|0)|0,0,k|0);h=h+1|0;}while((h|0)<=(g|0));if(j){break}h=e|0;k=0;do{l=g-k|0;if((l|0)>=0){m=0;do{aG(h|0,2288,(n=i,i=i+16|0,c[n>>2]=k,c[n+8>>2]=m,n)|0)|0;i=n;ck(b,h,a+6792+(k*80|0)+(m<<3)|0)|0;m=m+1|0;}while((m|0)<=(l|0))}k=k+1|0;}while((k|0)<=(g|0))}}while(0);f=a+7592|0;do{if((cd(b,2056,f)|0)==0){bK(1720)}else{g=c[f>>2]|0;k=(g|0)<0;if(k){break}h=(g<<3)+8|0;j=0;do{ey(a+7600+(j*80|0)|0,0,h|0);j=j+1|0;}while((j|0)<=(g|0));if(k){break}j=e|0;h=0;do{l=g-h|0;if((l|0)>=0){m=0;do{aG(j|0,1416,(n=i,i=i+16|0,c[n>>2]=h,c[n+8>>2]=m,n)|0)|0;i=n;ck(b,j,a+7600+(h*80|0)+(m<<3)|0)|0;m=m+1|0;}while((m|0)<=(l|0))}h=h+1|0;}while((h|0)<=(g|0))}}while(0);f=a+8400|0;if((cd(b,920,f)|0)==0){bK(5904);i=d;return}g=c[f>>2]|0;f=(g|0)<0;if(f){i=d;return}h=(g<<3)+8|0;j=0;do{ey(a+8408+(j*80|0)|0,0,h|0);j=j+1|0;}while((j|0)<=(g|0));if(f){i=d;return}f=e|0;e=0;do{j=g-e|0;if((j|0)>=0){h=0;do{aG(f|0,5504,(n=i,i=i+16|0,c[n>>2]=e,c[n+8>>2]=h,n)|0)|0;i=n;ck(b,f,a+8408+(e*80|0)+(h<<3)|0)|0;h=h+1|0;}while((h|0)<=(j|0))}e=e+1|0;}while((e|0)<=(g|0));i=d;return}function eh(a,b){a=a|0;b=b|0;var d=0;if((eu(b|0)|0)<9){c[a+5968>>2]=0;return}d=a+5968|0;if((aj(b+8|0,4544,4)|0)==0){c[d>>2]=1;return}else{c[d>>2]=0;return}}
function ei(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[2154]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=8656+(h<<2)|0;j=8656+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[2154]=e&~(1<<g)}else{if(l>>>0<(c[2158]|0)>>>0){an();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{an();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[2156]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=8656+(p<<2)|0;m=8656+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[2154]=e&~(1<<r)}else{if(l>>>0<(c[2158]|0)>>>0){an();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{an();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[2156]|0;if((l|0)!=0){q=c[2159]|0;d=l>>>3;l=d<<1;f=8656+(l<<2)|0;k=c[2154]|0;h=1<<d;do{if((k&h|0)==0){c[2154]=k|h;s=f;t=8656+(l+2<<2)|0}else{d=8656+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[2158]|0)>>>0){s=g;t=d;break}an();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[2156]=m;c[2159]=e;n=i;return n|0}l=c[2155]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[8920+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[2158]|0;if(r>>>0<i>>>0){an();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){an();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){an();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){an();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){an();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{an();return 0}}}while(0);L1467:do{if((e|0)!=0){f=d+28|0;i=8920+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[2155]=c[2155]&~(1<<c[f>>2]);break L1467}else{if(e>>>0<(c[2158]|0)>>>0){an();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L1467}}}while(0);if(v>>>0<(c[2158]|0)>>>0){an();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[2158]|0)>>>0){an();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[2158]|0)>>>0){an();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[2156]|0;if((f|0)!=0){e=c[2159]|0;i=f>>>3;f=i<<1;q=8656+(f<<2)|0;k=c[2154]|0;g=1<<i;do{if((k&g|0)==0){c[2154]=k|g;y=q;z=8656+(f+2<<2)|0}else{i=8656+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[2158]|0)>>>0){y=l;z=i;break}an();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[2156]=p;c[2159]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[2155]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[8920+(A<<2)>>2]|0;L1515:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L1515}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[8920+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[2156]|0)-g|0)>>>0){o=g;break}q=K;m=c[2158]|0;if(q>>>0<m>>>0){an();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){an();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){an();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){an();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){an();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{an();return 0}}}while(0);L1565:do{if((e|0)!=0){i=K+28|0;m=8920+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[2155]=c[2155]&~(1<<c[i>>2]);break L1565}else{if(e>>>0<(c[2158]|0)>>>0){an();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L1565}}}while(0);if(L>>>0<(c[2158]|0)>>>0){an();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[2158]|0)>>>0){an();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[2158]|0)>>>0){an();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;m=8656+(e<<2)|0;r=c[2154]|0;j=1<<i;do{if((r&j|0)==0){c[2154]=r|j;O=m;P=8656+(e+2<<2)|0}else{i=8656+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[2158]|0)>>>0){O=d;P=i;break}an();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=8920+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[2155]|0;l=1<<Q;if((m&l|0)==0){c[2155]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1240;break}else{l=l<<1;m=j}}if((T|0)==1240){if(S>>>0<(c[2158]|0)>>>0){an();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[2158]|0;if(m>>>0<i>>>0){an();return 0}if(j>>>0<i>>>0){an();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[2156]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[2159]|0;if(S>>>0>15){R=J;c[2159]=R+o;c[2156]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[2156]=0;c[2159]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[2157]|0;if(o>>>0<J>>>0){S=J-o|0;c[2157]=S;J=c[2160]|0;K=J;c[2160]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1612]|0)==0){J=a$(8)|0;if((J-1&J|0)==0){c[1614]=J;c[1613]=J;c[1615]=-1;c[1616]=-1;c[1617]=0;c[2265]=0;c[1612]=(aO(0)|0)&-16^1431655768;break}else{an();return 0}}}while(0);J=o+48|0;S=c[1614]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[2264]|0;do{if((O|0)!=0){P=c[2262]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1657:do{if((c[2265]&4|0)==0){O=c[2160]|0;L1659:do{if((O|0)==0){T=1270}else{L=O;P=9064;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1270;break L1659}else{P=M}}if((P|0)==0){T=1270;break}L=R-(c[2157]|0)&Q;if(L>>>0>=2147483647){W=0;break}m=aV(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=1279}}while(0);do{if((T|0)==1270){O=aV(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1613]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[2262]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}m=c[2264]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=aV($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=1279}}while(0);L1679:do{if((T|0)==1279){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1290;break L1657}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1614]|0;O=K-_+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aV(O|0)|0)==-1){aV(m|0)|0;W=Y;break L1679}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1290;break L1657}}}while(0);c[2265]=c[2265]|4;ad=W;T=1287}else{ad=0;T=1287}}while(0);do{if((T|0)==1287){if(S>>>0>=2147483647){break}W=aV(S|0)|0;Z=aV(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=1290}}}while(0);do{if((T|0)==1290){ad=(c[2262]|0)+aa|0;c[2262]=ad;if(ad>>>0>(c[2263]|0)>>>0){c[2263]=ad}ad=c[2160]|0;L1699:do{if((ad|0)==0){S=c[2158]|0;if((S|0)==0|ab>>>0<S>>>0){c[2158]=ab}c[2266]=ab;c[2267]=aa;c[2269]=0;c[2163]=c[1612];c[2162]=-1;S=0;do{Y=S<<1;ac=8656+(Y<<2)|0;c[8656+(Y+3<<2)>>2]=ac;c[8656+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[2160]=ab+ae;c[2157]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[2161]=c[1616]}else{S=9064;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1302;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1302){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[2160]|0;Y=(c[2157]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[2160]=Z+ai;c[2157]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[2161]=c[1616];break L1699}}while(0);if(ab>>>0<(c[2158]|0)>>>0){c[2158]=ab}S=ab+aa|0;Y=9064;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1312;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1312){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[2160]|0)){J=(c[2157]|0)+K|0;c[2157]=J;c[2160]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[2159]|0)){J=(c[2156]|0)+K|0;c[2156]=J;c[2159]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1744:do{if(X>>>0<256){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=8656+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[2158]|0)>>>0){an();return 0}if((c[U+12>>2]|0)==(Z|0)){break}an();return 0}}while(0);if((Q|0)==(U|0)){c[2154]=c[2154]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[2158]|0)>>>0){an();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}an();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){ao=0;break}else{ap=O;aq=e}}else{ap=L;aq=g}while(1){g=ap+20|0;L=c[g>>2]|0;if((L|0)!=0){ap=L;aq=g;continue}g=ap+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ap=L;aq=g}}if(aq>>>0<(c[2158]|0)>>>0){an();return 0}else{c[aq>>2]=0;ao=ap;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[2158]|0)>>>0){an();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){an();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;ao=P;break}else{an();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=8920+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=ao;if((ao|0)!=0){break}c[2155]=c[2155]&~(1<<c[P>>2]);break L1744}else{if(m>>>0<(c[2158]|0)>>>0){an();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=ao}else{c[m+20>>2]=ao}if((ao|0)==0){break L1744}}}while(0);if(ao>>>0<(c[2158]|0)>>>0){an();return 0}c[ao+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[2158]|0)>>>0){an();return 0}else{c[ao+16>>2]=P;c[P+24>>2]=ao;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[2158]|0)>>>0){an();return 0}else{c[ao+20>>2]=P;c[P+24>>2]=ao;break}}}while(0);ar=ab+(($|al)+aa)|0;as=$+K|0}else{ar=Z;as=K}J=ar+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=as|1;c[ab+(as+W)>>2]=as;J=as>>>3;if(as>>>0<256){V=J<<1;X=8656+(V<<2)|0;P=c[2154]|0;m=1<<J;do{if((P&m|0)==0){c[2154]=P|m;at=X;au=8656+(V+2<<2)|0}else{J=8656+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[2158]|0)>>>0){at=U;au=J;break}an();return 0}}while(0);c[au>>2]=_;c[at+12>>2]=_;c[ab+(W+8)>>2]=at;c[ab+(W+12)>>2]=X;break}V=ac;m=as>>>8;do{if((m|0)==0){av=0}else{if(as>>>0>16777215){av=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;av=as>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=8920+(av<<2)|0;c[ab+(W+28)>>2]=av;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[2155]|0;Q=1<<av;if((X&Q|0)==0){c[2155]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((av|0)==31){aw=0}else{aw=25-(av>>>1)|0}Q=as<<aw;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(as|0)){break}ax=X+16+(Q>>>31<<2)|0;m=c[ax>>2]|0;if((m|0)==0){T=1385;break}else{Q=Q<<1;X=m}}if((T|0)==1385){if(ax>>>0<(c[2158]|0)>>>0){an();return 0}else{c[ax>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[2158]|0;if(X>>>0<$>>>0){an();return 0}if(m>>>0<$>>>0){an();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=9064;while(1){ay=c[W>>2]|0;if(ay>>>0<=Y>>>0){az=c[W+4>>2]|0;aA=ay+az|0;if(aA>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ay+(az-39)|0;if((W&7|0)==0){aB=0}else{aB=-W&7}W=ay+(az-47+aB)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aC=0}else{aC=-_&7}_=aa-40-aC|0;c[2160]=ab+aC;c[2157]=_;c[ab+(aC+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[2161]=c[1616];c[ac+4>>2]=27;c[W>>2]=c[2266];c[W+4>>2]=c[9068>>2];c[W+8>>2]=c[9072>>2];c[W+12>>2]=c[9076>>2];c[2266]=ab;c[2267]=aa;c[2269]=0;c[2268]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aA>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aA>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256){K=W<<1;Z=8656+(K<<2)|0;S=c[2154]|0;m=1<<W;do{if((S&m|0)==0){c[2154]=S|m;aD=Z;aE=8656+(K+2<<2)|0}else{W=8656+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[2158]|0)>>>0){aD=Q;aE=W;break}an();return 0}}while(0);c[aE>>2]=ad;c[aD+12>>2]=ad;c[ad+8>>2]=aD;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aF=0}else{if(_>>>0>16777215){aF=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aF=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=8920+(aF<<2)|0;c[ad+28>>2]=aF;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[2155]|0;Q=1<<aF;if((Z&Q|0)==0){c[2155]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aF|0)==31){aG=0}else{aG=25-(aF>>>1)|0}Q=_<<aG;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aH=Z+16+(Q>>>31<<2)|0;m=c[aH>>2]|0;if((m|0)==0){T=1420;break}else{Q=Q<<1;Z=m}}if((T|0)==1420){if(aH>>>0<(c[2158]|0)>>>0){an();return 0}else{c[aH>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[2158]|0;if(Z>>>0<m>>>0){an();return 0}if(_>>>0<m>>>0){an();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[2157]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[2157]=_;ad=c[2160]|0;Q=ad;c[2160]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(aW()|0)>>2]=12;n=0;return n|0}function ej(a,b){a=a|0;b=b|0;var d=0,e=0;do{if((a|0)==0){d=0}else{e=_(b,a)|0;if((b|a)>>>0<=65535){d=e;break}d=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}}while(0);b=ei(d)|0;if((b|0)==0){return b|0}if((c[b-4>>2]&3|0)==0){return b|0}ey(b|0,0,d|0);return b|0}function ek(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[2158]|0;if(b>>>0<e>>>0){an()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){an()}h=f&-8;i=a+(h-8)|0;j=i;L1928:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){an()}if((n|0)==(c[2159]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[2156]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=8656+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){an()}if((c[k+12>>2]|0)==(n|0)){break}an()}}while(0);if((s|0)==(k|0)){c[2154]=c[2154]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){an()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}an()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){an()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){an()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){an()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{an()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=8920+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[2155]=c[2155]&~(1<<c[v>>2]);q=n;r=o;break L1928}else{if(p>>>0<(c[2158]|0)>>>0){an()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1928}}}while(0);if(A>>>0<(c[2158]|0)>>>0){an()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[2158]|0)>>>0){an()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[2158]|0)>>>0){an()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){an()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){an()}do{if((e&2|0)==0){if((j|0)==(c[2160]|0)){B=(c[2157]|0)+r|0;c[2157]=B;c[2160]=q;c[q+4>>2]=B|1;if((q|0)!=(c[2159]|0)){return}c[2159]=0;c[2156]=0;return}if((j|0)==(c[2159]|0)){B=(c[2156]|0)+r|0;c[2156]=B;c[2159]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L2031:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=8656+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[2158]|0)>>>0){an()}if((c[u+12>>2]|0)==(j|0)){break}an()}}while(0);if((g|0)==(u|0)){c[2154]=c[2154]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[2158]|0)>>>0){an()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}an()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[2158]|0)>>>0){an()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[2158]|0)>>>0){an()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){an()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{an()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=8920+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[2155]=c[2155]&~(1<<c[t>>2]);break L2031}else{if(f>>>0<(c[2158]|0)>>>0){an()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L2031}}}while(0);if(E>>>0<(c[2158]|0)>>>0){an()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[2158]|0)>>>0){an()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[2158]|0)>>>0){an()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[2159]|0)){H=B;break}c[2156]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=8656+(d<<2)|0;A=c[2154]|0;E=1<<r;do{if((A&E|0)==0){c[2154]=A|E;I=e;J=8656+(d+2<<2)|0}else{r=8656+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[2158]|0)>>>0){I=h;J=r;break}an()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=8920+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[2155]|0;d=1<<K;do{if((r&d|0)==0){c[2155]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1607;break}else{A=A<<1;J=E}}if((N|0)==1607){if(M>>>0<(c[2158]|0)>>>0){an()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[2158]|0;if(J>>>0<E>>>0){an()}if(B>>>0<E>>>0){an()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[2162]|0)-1|0;c[2162]=q;if((q|0)==0){O=9072}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[2162]=-1;return}function el(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=ei(b)|0;return d|0}if(b>>>0>4294967231){c[(aW()|0)>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=em(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=ei(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;ev(f|0,a|0,e)|0;ek(a);d=f;return d|0}function em(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[2158]|0;if(g>>>0<j>>>0){an();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){an();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){an();return 0}if((k|0)==0){if(b>>>0<256){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[1614]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;en(g+b|0,k);n=a;return n|0}if((i|0)==(c[2160]|0)){k=(c[2157]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[2160]=g+b;c[2157]=l;n=a;return n|0}if((i|0)==(c[2159]|0)){l=(c[2156]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[2156]=q;c[2159]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L2217:do{if(m>>>0<256){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=8656+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){an();return 0}if((c[l+12>>2]|0)==(i|0)){break}an();return 0}}while(0);if((k|0)==(l|0)){c[2154]=c[2154]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){an();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}an();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){an();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){an();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){an();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{an();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=8920+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[2155]=c[2155]&~(1<<c[t>>2]);break L2217}else{if(s>>>0<(c[2158]|0)>>>0){an();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L2217}}}while(0);if(y>>>0<(c[2158]|0)>>>0){an();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[2158]|0)>>>0){an();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[2158]|0)>>>0){an();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;en(g+b|0,q);n=a;return n|0}return 0}function en(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L2293:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[2158]|0;if(i>>>0<l>>>0){an()}if((j|0)==(c[2159]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[2156]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=8656+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){an()}if((c[p+12>>2]|0)==(j|0)){break}an()}}while(0);if((q|0)==(p|0)){c[2154]=c[2154]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){an()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}an()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){an()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){an()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){an()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{an()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=8920+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[2155]=c[2155]&~(1<<c[t>>2]);n=j;o=k;break L2293}else{if(m>>>0<(c[2158]|0)>>>0){an()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L2293}}}while(0);if(y>>>0<(c[2158]|0)>>>0){an()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[2158]|0)>>>0){an()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[2158]|0)>>>0){an()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[2158]|0;if(e>>>0<a>>>0){an()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[2160]|0)){A=(c[2157]|0)+o|0;c[2157]=A;c[2160]=n;c[n+4>>2]=A|1;if((n|0)!=(c[2159]|0)){return}c[2159]=0;c[2156]=0;return}if((f|0)==(c[2159]|0)){A=(c[2156]|0)+o|0;c[2156]=A;c[2159]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L2392:do{if(z>>>0<256){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=8656+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){an()}if((c[g+12>>2]|0)==(f|0)){break}an()}}while(0);if((t|0)==(g|0)){c[2154]=c[2154]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){an()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}an()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){an()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){an()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){an()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{an()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=8920+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[2155]=c[2155]&~(1<<c[l>>2]);break L2392}else{if(m>>>0<(c[2158]|0)>>>0){an()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L2392}}}while(0);if(C>>>0<(c[2158]|0)>>>0){an()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[2158]|0)>>>0){an()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[2158]|0)>>>0){an()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[2159]|0)){F=A;break}c[2156]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256){z=o<<1;y=8656+(z<<2)|0;C=c[2154]|0;b=1<<o;do{if((C&b|0)==0){c[2154]=C|b;G=y;H=8656+(z+2<<2)|0}else{o=8656+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[2158]|0)>>>0){G=d;H=o;break}an()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=8920+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[2155]|0;z=1<<I;if((o&z|0)==0){c[2155]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=1887;break}else{I=I<<1;J=G}}if((L|0)==1887){if(K>>>0<(c[2158]|0)>>>0){an()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[2158]|0;if(J>>>0<I>>>0){an()}if(L>>>0<I>>>0){an()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function eo(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0.0,R=0.0,S=0.0;e=b;while(1){f=e+1|0;if((aY(a[e]|0)|0)==0){break}else{e=f}}switch(a[e]|0){case 43:{g=f;i=0;break};case 45:{g=f;i=1;break};default:{g=e;i=0}}e=-1;f=0;j=g;while(1){k=a[j]|0;if(((k<<24>>24)-48|0)>>>0<10){l=e}else{if(k<<24>>24!=46|(e|0)>-1){break}else{l=f}}e=l;f=f+1|0;j=j+1|0}l=j+(-f|0)|0;g=(e|0)<0;m=((g^1)<<31>>31)+f|0;n=(m|0)>18;o=(n?-18:-m|0)+(g?f:e)|0;e=n?18:m;do{if((e|0)==0){p=b;q=0.0}else{if((e|0)>9){m=l;n=e;f=0;while(1){g=a[m]|0;r=m+1|0;if(g<<24>>24==46){s=a[r]|0;t=m+2|0}else{s=g;t=r}u=(f*10|0)-48+(s<<24>>24)|0;r=n-1|0;if((r|0)>9){m=t;n=r;f=u}else{break}}v=+(u|0)*1.0e9;w=9;x=t;y=1935}else{if((e|0)>0){v=0.0;w=e;x=l;y=1935}else{z=0.0;A=0.0}}if((y|0)==1935){f=x;n=w;m=0;while(1){r=a[f]|0;g=f+1|0;if(r<<24>>24==46){B=a[g]|0;C=f+2|0}else{B=r;C=g}D=(m*10|0)-48+(B<<24>>24)|0;g=n-1|0;if((g|0)>0){f=C;n=g;m=D}else{break}}z=+(D|0);A=v}E=A+z;L2536:do{switch(k<<24>>24){case 69:case 101:{m=j+1|0;switch(a[m]|0){case 43:{F=j+2|0;G=0;break};case 45:{F=j+2|0;G=1;break};default:{F=m;G=0}}m=a[F]|0;if(((m<<24>>24)-48|0)>>>0<10){H=F;I=0;J=m}else{K=0;L=F;M=G;break L2536}while(1){m=(I*10|0)-48+(J<<24>>24)|0;n=H+1|0;f=a[n]|0;if(((f<<24>>24)-48|0)>>>0<10){H=n;I=m;J=f}else{K=m;L=n;M=G;break}}break};default:{K=0;L=j;M=0}}}while(0);n=o+((M|0)==0?K:-K|0)|0;m=(n|0)<0?-n|0:n;if((m|0)>511){c[(aW()|0)>>2]=34;N=1.0;O=16;P=511;y=1952}else{if((m|0)==0){Q=1.0}else{N=1.0;O=16;P=m;y=1952}}if((y|0)==1952){while(1){y=0;if((P&1|0)==0){R=N}else{R=N*+h[O>>3]}m=P>>1;if((m|0)==0){Q=R;break}else{N=R;O=O+8|0;P=m;y=1952}}}if((n|0)>-1){p=L;q=E*Q;break}else{p=L;q=E/Q;break}}}while(0);if((d|0)!=0){c[d>>2]=p}if((i|0)==0){S=q;return+S}S=-0.0-q;return+S}function ep(a){a=a|0;return+(+eo(a,0))}function eq(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function er(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;while(e>>>0<d>>>0){f=eq(a[b+e|0]|0)|0;g=eq(a[c+e|0]|0)|0;if((f|0)==(g|0)&(f|0)==0)return 0;if((f|0)==0)return-1;if((g|0)==0)return 1;if((f|0)==(g|0)){e=e+1|0;continue}else{return(f>>>0>g>>>0?1:-1)|0}}return 0}function es(a,b){a=a|0;b=b|0;return er(a,b,-1)|0}function et(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function eu(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function ev(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function ew(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function ex(b,c){b=b|0;c=c|0;var d=0,e=0;d=b+(eu(b)|0)|0;do{a[d+e|0]=a[c+e|0];e=e+1|0}while(a[c+(e-1)|0]|0);return b|0}function ey(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function ez(a,b){a=a|0;b=b|0;a5[a&1](b|0)}function eA(a,b){a=a|0;b=b|0;return a6[a&1](b|0)|0}function eB(a){a=a|0;a7[a&1]()}function eC(a,b,c,d,e,f){a=a|0;b=+b;c=+c;d=d|0;e=e|0;f=f|0;return a8[a&127](+b,+c,d|0,e|0,f|0)|0}function eD(a,b,c){a=a|0;b=b|0;c=c|0;return a9[a&1](b|0,c|0)|0}function eE(a){a=a|0;$(0)}function eF(a){a=a|0;$(1);return 0}function eG(){$(2)}function eH(a,b,c,d,e){a=+a;b=+b;c=c|0;d=d|0;e=e|0;$(3);return 0}function eI(a,b){a=a|0;b=b|0;$(4);return 0}
// EMSCRIPTEN_END_FUNCS
var a5=[eE,eE];var a6=[eF,eF];var a7=[eG,eG];var a8=[eH,eH,dq,eH,dS,eH,dw,eH,dk,eH,dh,eH,df,eH,dN,eH,dY,eH,dz,eH,dC,eH,dU,eH,dW,eH,dr,eH,dG,eH,dB,eH,ds,eH,dH,eH,dx,eH,dK,eH,d2,eH,du,eH,d1,eH,d$,eH,dL,eH,dV,eH,d4,eH,dI,eH,dg,eH,dM,eH,di,eH,dt,eH,dj,eH,d_,eH,dR,eH,dZ,eH,dO,eH,dT,eH,dQ,eH,dm,eH,dF,eH,dP,eH,d3,eH,dv,eH,dy,eH,dp,eH,dE,eH,dJ,eH,dD,eH,dn,eH,d0,eH,dX,eH,dA,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH,eH];var a9=[eI,eI];return{_strncasecmp:er,_strcat:ex,_free:ek,_memcpy:ev,_realloc:el,_strncpy:et,_tolower:eq,_strlen:eu,_initwcs:br,_memset:ey,_malloc:ei,_wcsunits:bu,_reg2wcsstr:bv,_strcasecmp:es,_wcssys:bt,_pix2wcsstr:bs,_strcpy:ew,_calloc:ej,runPostSets:bq,stackAlloc:ba,stackSave:bb,stackRestore:bc,setThrew:bd,setTempRet0:bg,setTempRet1:bh,setTempRet2:bi,setTempRet3:bj,setTempRet4:bk,setTempRet5:bl,setTempRet6:bm,setTempRet7:bn,setTempRet8:bo,setTempRet9:bp,dynCall_vi:ez,dynCall_ii:eA,dynCall_v:eB,dynCall_iffiii:eC,dynCall_iii:eD}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iffiii": invoke_iffiii, "invoke_iii": invoke_iii, "_strncmp": _strncmp, "_fabsf": _fabsf, "_snprintf": _snprintf, "_strtok_r": _strtok_r, "_abort": _abort, "_fprintf": _fprintf, "_sqrt": _sqrt, "_toupper": _toupper, "_fflush": _fflush, "___buildEnvironment": ___buildEnvironment, "__reallyNegative": __reallyNegative, "_tan": _tan, "_strchr": _strchr, "_asin": _asin, "_strtol": _strtol, "_log": _log, "_fabs": _fabs, "_strtok": _strtok, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_write": _write, "_exit": _exit, "_sprintf": _sprintf, "_llvm_lifetime_end": _llvm_lifetime_end, "_strdup": _strdup, "_sin": _sin, "_strncat": _strncat, "_atan2": _atan2, "_atan": _atan, "__exit": __exit, "_time": _time, "__formatString": __formatString, "_getenv": _getenv, "_atoi": _atoi, "_cos": _cos, "_pwrite": _pwrite, "_llvm_pow_f64": _llvm_pow_f64, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_fmod": _fmod, "_isspace": _isspace, "_llvm_lifetime_start": _llvm_lifetime_start, "__parseInt": __parseInt, "_sysconf": _sysconf, "_islower": _islower, "_exp": _exp, "_acos": _acos, "_isupper": _isupper, "_strcmp": _strcmp, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _strncasecmp = Module["_strncasecmp"] = asm["_strncasecmp"];
var _strcat = Module["_strcat"] = asm["_strcat"];
var _free = Module["_free"] = asm["_free"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _initwcs = Module["_initwcs"] = asm["_initwcs"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _wcsunits = Module["_wcsunits"] = asm["_wcsunits"];
var _reg2wcsstr = Module["_reg2wcsstr"] = asm["_reg2wcsstr"];
var _strcasecmp = Module["_strcasecmp"] = asm["_strcasecmp"];
var _wcssys = Module["_wcssys"] = asm["_wcssys"];
var _pix2wcsstr = Module["_pix2wcsstr"] = asm["_pix2wcsstr"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iffiii = Module["dynCall_iffiii"] = asm["dynCall_iffiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
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
      throw e;
    }
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
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
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
  throw 'abort() at ' + (new Error().stack);
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
