/*
 * Copyright (c) 2015 Martin von Gagern. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following
 * disclaimer in the documentation and/or other materials provided
 * with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// See http://docs.oracle.com/javase/7/docs/platform/serialization/spec/protocol.html for reference

"use strict";

var names = [
    "Null", "Reference", "ClassDesc", "Object", "String", "Array", "Class", "BlockData", "EndBlockData",
    "Reset", "BlockDataLong", "Exception", "LongString", "ProxyClassDesc", "Enum"
];

var endBlock = {};

function Parser(buf) {
    this.buf = buf;
    this.pos = 0;
    this.nextHandle = 0x7e0000;
    this.handles = [];
    this.contents = [];
    this.magic();
    this.version();
    while (this.pos < this.buf.length) {
        this.contents.push(this.content());
    }
}

Parser.prototype.step = function(len) {
    var pos = this.pos;
    this.pos += len;
    return pos;
}

Parser.prototype.readUInt8 = function() { return this.buf.readUInt8(this.step(1)); }
Parser.prototype.readInt8 = function() { return this.buf.readUInt8(this.step(1)); }
Parser.prototype.readUInt16 = function() { return this.buf.readUInt16BE(this.step(2)); }
Parser.prototype.readInt16 = function() { return this.buf.readUInt16BE(this.step(2)); }
Parser.prototype.readUInt32 = function() { return this.buf.readUInt32BE(this.step(4)); }
Parser.prototype.readInt32 = function() { return this.buf.readUInt32BE(this.step(4)); }

Parser.prototype.readHex = function(len) {
    var res = this.buf.toString("hex", this.pos, this.pos + len);
    this.pos += len;
    return res;
}

Parser.prototype.utf = function() {
    var len = this.readUInt16();
    var res = this.buf.toString("utf8", this.pos, this.pos + len);
    this.pos += len;
    return res;
}

Parser.prototype.utfLong = function() {
    if (this.readUInt32() !== 0)
        throw new Error("Can't handle more than 2^32 bytes in a string");
    var len = this.readUInt32();
    var res = this.buf.toString("utf8", this.pos, this.pos + len);
    this.pos += len;
    return res;
}

Parser.prototype.magic = function() {
    this.magic = this.readUInt16();
    if (this.magic !== 0xaced)
        throw Error("STREAM_MAGIC not found");
}

Parser.prototype.version = function() {
    this.version = this.readUInt16();
    if (this.version !== 5)
        throw Error("Only understand protocol version 5");
}

Parser.prototype.content = function(allowed) {
    var tc = this.readUInt8() - 0x70;
    if (tc < 0 || tc > names.length)
        throw Error("Don't know about type 0x" + (tc + 0x70).toString(16));
    var name = names[tc];
    if (allowed && allowed.indexOf(name) === -1)
        throw Error(name + " not allowed here");
    var handler = this["parse" + name];
    if (!handler)
        throw Error("Don't know how to handle " + name);
    var elt = handler.call(this);
    return elt;
}

Parser.prototype.annotations = function(allowed) {
    var annotations = [];
    while (true) {
        var annotation = this.content(allowed);
        if (annotation === endBlock)
            break;
        annotations.push(annotation);
    }
    return annotations;
}

Parser.prototype.classDesc = function() {
    return this.content(["ClassDesc", "ProxyClassDesc", "Null", "Reference"]);
}

Parser.prototype.parseClassDesc = function() {
    var res = {};
    res.name = this.utf();
    res.serialVersionUID = this.readHex(8);
    this.newHandle(res);
    res.flags = this.readUInt8();
    res.isEnum = !!(res.flags & 0x10);
    var count = this.readUInt16();
    res.fields = [];
    for (var i = 0; i < count; ++i)
        res.fields.push(this.fieldDesc());
    res.annotations = this.annotations();
    res.super = this.classDesc();
    return res;
}

Parser.prototype.fieldDesc = function() {
    var res = {};
    res.type = String.fromCharCode(this.readUInt8());
    res.name = this.utf();
    if ("[L".indexOf(res.type) !== -1)
        res.className = this.content();
    return res;
}

Parser.prototype.parseObject = function() {
    var res = Object.defineProperties({}, {
        "class": {
            configurable: true,
            value: this.classDesc()
        },
        "extends": {
            configurable: true,
            value: {}
        }
    });
    this.newHandle(res);
    this.recursiveClassData(res.class, res);
    return res;
}

Parser.prototype.recursiveClassData = function(cls, obj) {
    var fields = obj.extends[cls.name] = this.classdata(cls, obj);
    if (cls.super)
        this.recursiveClassData(cls.super, obj);
    for (var name in fields)
        obj[name] = fields[name];
}

Parser.prototype.classdata = function(cls) {
    var res;
    var postproc = this[cls.name + "@" + cls.serialVersionUID];
    switch (cls.flags & 0x0f) {
    case 0x02: // SC_SERIALIZABLE without SC_WRITE_METHOD
        return this.values(cls);
    case 0x03: // SC_SERIALIZABLE with SC_WRITE_METHOD
        res = this.values(cls);
        res["@"] = this.annotations();
        if (postproc)
            res = postproc.call(this, cls, res);
        return res;
    case 0x04: // SC_EXTERNALIZABLE without SC_BLOCKDATA
        throw Error("Can't parse version 1 external content");
    case 0x0c: // SC_EXTERNALIZABLE with SC_BLOCKDATA
        return {"@": this.annotations()};
    default:
        throw Error("Don't know how to deserialize class with flags 0x" + cls.flags.toString(16));
    }
}

Parser.prototype.parseBlockData = function() {
    var len = this.readUInt8();
    var res = this.buf.slice(this.pos, this.pos + len);
    this.pos += len;
    return res;
}

Parser.prototype.parseBlockDataLong = function() {
    var len = this.readUInt32();
    var res = this.buf.slice(this.pos, this.pos + len);
    this.pos += len;
    return res;
}

Parser.prototype.parseString = function() {
    return this.newHandle(this.utf());
}

Parser.prototype.parseStringLong = function() {
    return this.newHandle(this.utfLong());
}

Parser.prototype.values = function(cls) {
    var vals = {};
    var fields = cls.fields;
    for (var i = 0; i < fields.length; ++i) {
        var field = fields[i];
        var handler = this["prim" + field.type];
        if (!handler)
            throw Error("Don't know how to read field of type '" + field.type + "'");
        vals[field.name] = handler.call(this, field);
    }
    return vals;
}

Parser.prototype.newHandle = function(obj) {
    this.handles[this.nextHandle++] = obj;
    return obj;
}

Parser.prototype.parseReference = function() {
    return this.handles[this.readInt32()];
}

Parser.prototype.parseNull = function() {
    return null;
}

Parser.prototype.parseEndBlockData = function() {
    return endBlock;
}

Parser.prototype.primB = function() {
    return this.readInt8();
}

Parser.prototype.primC = function() {
    return String.fromCharCode(this.readUInt16());
}

Parser.prototype.primD = function() {
    return this.buf.readDoubleBE(this.step(8));
}

Parser.prototype.primF = function() {
    return this.buf.readFloatBE(this.step(4));
}

Parser.prototype.primI = function() {
    return this.readInt32();
}

Parser.prototype.primJ = function() {
    return this.readHex(8);
}

Parser.prototype.primS = function() {
    return this.readInt16();
}

Parser.prototype.primZ = function() {
    return !!this.readInt8();
}

Parser.prototype.primL = function() {
    return this.content();
}

function mapParser(cls, fields) {
    var data = fields["@"];
    var capacity = data[0].readInt32BE(0);
    var size = data[0].readInt32BE(4);
    var map = {};
    for (var i = 0; i < size; ++i) {
        var key = data[2*i + 1];
        var value = data[2*i + 2];
        if (typeof key !== "string") {
            return fields;
        }
        map[key] = value;
    }
    delete fields["@"];
    fields.map = map;
    return fields;
}

Parser.prototype["java.util.Hashtable@13bb0f25214ae4b8"] = mapParser;
Parser.prototype["java.util.HashMap@0507dac1c31660d1"] = mapParser;

module.exports.parse = function parse(buf) {
    var parser = new Parser(buf);
    return parser.contents;
}