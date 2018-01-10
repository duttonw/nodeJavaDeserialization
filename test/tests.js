const chai = require('chai');
const expect = chai.expect;
const javaDeserialization = require('../');

function testCase(b64data, checks) {
  return function() {
    const bytes = Buffer.from(b64data, 'base64');
    const res = javaDeserialization.parse(bytes);
    const begin = res[0];
    const end = res[res.length - 1];
    expect(begin[0]).to.equal('Begin');
    expect(begin[1]).to.equal(begin);
    expect(end[0]).to.equal(end);
    expect(end[1]).to.equal('End');
    expect(res.length,
      'Number of serialized objects must match args list'
    ).to.equal(checks.length + 2);
    return checks.apply(null, res.slice(1, -1));
  };
}

describe('Deserialization of', () => {

  it('canaries only', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABdXEAfgAAAAAAAnEAfgADdAADRW5k',
    function() {
    }));

  it('string', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABdAAIc29tZXRleHR1cQB+AAAAAAACcQB+AAR0AANFbmQ=',
    function(itm) {
      expect(typeof itm, "typeof itm").to.equal('string');
      expect(itm, "itm").to.equal('sometext');
    }));

  it('primitive fields', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAD1ByaW1pdGl2ZUZpZWxkcwAAEjRWeJq8AgAIWgACYm9CAAJieUMAAWNEAAFkRgAB' +
    'ZkkAAWlKAAFsUwABc3hwAesSNEAorhR64UeuQpkAAP///4X////////86/44dXEAfgAAAAAA' +
    'AnEAfgAFdAADRW5k',
    function(itm) {
      expect(itm.i, "itm.i").to.equal(-123);
      expect(itm.s, "itm.s").to.equal(-456);
      expect(String(itm.l), "String(itm.l)").to.equal('-789');
      expect(itm.l.toNumber(), "itm.l.toNumber()").to.equal(-789);
      expect(itm.l.equals(-789), "itm.l.equals(-789)").to.be.true;
      expect(itm.by, "itm.by").to.equal(-21);
      expect(itm.d, "itm.d").to.equal(12.34);
      expect(itm.f, "itm.f").to.equal(76.5);
      expect(itm.bo, "itm.bo").to.equal(true);
      expect(itm.c, "itm.c").to.equal('\u1234');
      expect(Object.keys(itm).length, "Object.keys(itm).length").to.equal(8);
      expect(itm.class.serialVersionUID, "itm.class.serialVersionUID").to.equal('0000123456789abc');
    }));

  it('boxed primitives', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAEWphdmEubGFuZy5JbnRlZ2VyEuKgpPeBhzgCAAFJAAV2YWx1ZXhyABBqYXZhLmxh' +
    'bmcuTnVtYmVyhqyVHQuU4IsCAAB4cP///4VzcgAPamF2YS5sYW5nLlNob3J0aE03EzRg2lIC' +
    'AAFTAAV2YWx1ZXhxAH4ABP44c3IADmphdmEubGFuZy5Mb25nO4vkkMyPI98CAAFKAAV2YWx1' +
    'ZXhxAH4ABP////////zrc3IADmphdmEubGFuZy5CeXRlnE5ghO5Q9RwCAAFCAAV2YWx1ZXhx' +
    'AH4ABOtzcgAQamF2YS5sYW5nLkRvdWJsZYCzwkopa/sEAgABRAAFdmFsdWV4cQB+AARAKK4U' +
    'euFHrnNyAA9qYXZhLmxhbmcuRmxvYXTa7cmi2zzw7AIAAUYABXZhbHVleHEAfgAEQpkAAHNy' +
    'ABFqYXZhLmxhbmcuQm9vbGVhbs0gcoDVnPruAgABWgAFdmFsdWV4cAFzcgATamF2YS5sYW5n' +
    'LkNoYXJhY3RlcjSLR9lrGiZ4AgABQwAFdmFsdWV4cBI0dXEAfgAAAAAAAnEAfgAUdAADRW5k',
    function(i, s, l, by, d, f, bo, c) {
      expect(i.value, "i.value").to.equal(-123);
      expect(s.value, "s.value").to.equal(-456);
      expect(l.value.equals(-789), "l.value.equals(-789)").to.be.true;
      expect(by.value, "by.value").to.equal(-21);
      expect(d.value, "d.value").to.equal(12.34);
      expect(f.value, "f.value").to.equal(76.5);
      expect(bo.value, "bo.value").to.equal(true);
      expect(c.value, "c.value").to.equal('\u1234');
      expect(i.class.name, "i.class.name").to.equal('java.lang.Integer');
      expect(s.class.name, "s.class.name").to.equal('java.lang.Short');
      expect(l.class.name, "l.class.name").to.equal('java.lang.Long');
      expect(by.class.name, "by.class.name").to.equal('java.lang.Byte');
      expect(d.class.name, "d.class.name").to.equal('java.lang.Double');
      expect(f.class.name, "f.class.name").to.equal('java.lang.Float');
      expect(bo.class.name, "bo.class.name").to.equal('java.lang.Boolean');
      expect(c.class.name, "c.class.name").to.equal('java.lang.Character');
    }));

  it('inherited field', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAHERlcml2ZWRDbGFzc1dpdGhBbm90aGVyRmllbGQAAAAAAAAjRQIAAUkAA2Jhcnhy' +
    'ABJCYXNlQ2xhc3NXaXRoRmllbGQAAAAAAAASNAIAAUkAA2Zvb3hwAAAAewAAAOp1cQB+AAAA' +
    'AAACcQB+AAZ0AANFbmQ=',
    function(itm) {
      expect(itm.class.name, "itm.class.name").to.equal('DerivedClassWithAnotherField');
      expect(itm.class.super.name, "itm.class.super.name").to.equal('BaseClassWithField');
      expect(itm.class.super.super, "itm.class.super.super").to.equal(null);
      expect(itm.extends.DerivedClassWithAnotherField.bar, "itm.extends.DerivedClassWithAnotherField.bar").to.equal(234);
      expect(itm.extends.DerivedClassWithAnotherField.foo, "itm.extends.DerivedClassWithAnotherField.foo").to.equal(undefined);
      expect(itm.extends.BaseClassWithField.foo, "itm.extends.BaseClassWithField.foo").to.equal(123);
      expect(itm.bar, "itm.bar").to.equal(234);
      expect(itm.foo, "itm.foo").to.equal(123);
    }));

  it('duplicate field', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAGURlcml2ZWRDbGFzc1dpdGhTYW1lRmllbGQAAAAAAAA0VgIAAUkAA2Zvb3hyABJC' +
    'YXNlQ2xhc3NXaXRoRmllbGQAAAAAAAASNAIAAUkAA2Zvb3hwAAAAewAAAVl1cQB+AAAAAAAC' +
    'cQB+AAZ0AANFbmQ=',
    function(itm) {
      expect(itm.class.name, "itm.class.name").to.equal('DerivedClassWithSameField');
      expect(itm.class.super.name, "itm.class.super.name").to.equal('BaseClassWithField');
      expect(itm.class.super.super, "itm.class.super.super").to.equal(null);
      expect(itm.extends.DerivedClassWithSameField.foo, "itm.extends.DerivedClassWithSameField.foo").to.equal(345);
      expect(itm.extends.BaseClassWithField.foo, "itm.extends.BaseClassWithField.foo").to.equal(123);
      expect(itm.foo, "itm.foo").to.equal(345);
    }));

  it('primitive array', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABdXIAAltJTbpgJnbqsqUCAAB4cAAAAAMAAAAMAAAAIgAAADh1cQB+AAAAAAACcQB+AAV0' +
    'AANFbmQ=',
    function(itm) {
      expect(Array.isArray(itm), "Array.isArray(itm)").to.be.true;
      expect(itm.length, "itm.length").to.equal(3);
      expect(itm[0], "itm[0]").to.equal(12);
      expect(itm[1], "itm[1]").to.equal(34);
      expect(itm[2], "itm[2]").to.equal(56);
      expect(itm.class.name, "itm.class.name").to.equal('[I');
    }));

  it('nested array', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABdXIAFFtbTGphdmEubGFuZy5TdHJpbmc7Mk0JrYQy5FcCAAB4cAAAAAJ1cgATW0xqYXZh' +
    'LmxhbmcuU3RyaW5nO63SVufpHXtHAgAAeHAAAAACdAABYXQAAWJ1cQB+AAUAAAABdAABY3Vx' +
    'AH4AAAAAAAJxAH4AC3QAA0VuZA==',
    function(itm) {
      expect(Array.isArray(itm), "Array.isArray(itm)").to.be.true;
      expect(itm.length, "itm.length").to.equal(2);
      expect(Array.isArray(itm[0]), "Array.isArray(itm[0])").to.be.true;
      expect(itm[0].length, "itm[0].length").to.equal(2);
      expect(itm[1].length, "itm[1].length").to.equal(1);
      expect(itm[0][0], "itm[0][0]").to.equal('a');
      expect(itm[0][1], "itm[0][1]").to.equal('b');
      expect(itm[1][0], "itm[1][0]").to.equal('c');
    }));

  it('array fields', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAC0FycmF5RmllbGRzAAAAAAAAAAECAANbAAJpYXQAAltJWwADaWFhdAADW1tJWwAC' +
    'c2F0ABNbTGphdmEvbGFuZy9TdHJpbmc7eHB1cgACW0lNumAmduqypQIAAHhwAAAAAwAAAAwA' +
    'AAAiAAAAOHVyAANbW0kX9+RPGY+JPAIAAHhwAAAAAnVxAH4ACAAAAAIAAAALAAAADHVxAH4A' +
    'CAAAAAMAAAAVAAAAFgAAABd1cgATW0xqYXZhLmxhbmcuU3RyaW5nO63SVufpHXtHAgAAeHAA' +
    'AAACdAADZm9vdAADYmFydXEAfgAAAAAAAnEAfgASdAADRW5k',
    function(itm) {
      expect(Array.isArray(itm.ia), "Array.isArray(itm.ia)").to.be.true;
      expect(Array.isArray(itm.iaa), "Array.isArray(itm.iaa)").to.be.true;
      expect(Array.isArray(itm.sa), "Array.isArray(itm.sa)").to.be.true;
      expect(itm.iaa[1][2], "itm.iaa[1][2]").to.equal(23);
      expect(itm.sa[1], "itm.sa[1]").to.equal('bar');
    }));

  it('enum', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABfnIACFNvbWVFbnVtAAAAAAAAAAASAAB4cgAOamF2YS5sYW5nLkVudW0AAAAAAAAAABIA' +
    'AHhwdAADT05FfnEAfgADdAAFVEhSRUV1cQB+AAAAAAACcQB+AAl0AANFbmQ=',
    function(one, three) {
      expect(typeof one, "typeof one").to.equal('object');
      expect(one instanceof String, "one instanceof String").to.be.true;
      expect(one == 'ONE', "one == 'ONE'").to.be.true;
      expect(one, "one").to.not.equal('ONE');
      expect(one.class.name, "one.class.name").to.equal('SomeEnum');
      expect(one.class.isEnum, "one.class.isEnum").to.be.true;
      expect(one.class.super.name, "one.class.super.name").to.equal('java.lang.Enum');
      expect(one.class.super.super, "one.class.super.super").to.equal(null);
      expect(three == 'THREE', "three == 'THREE'").to.be.true;
    }));

  it('custom format', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IADEN1c3RvbUZvcm1hdAAAAAAAAAABAwABSQADZm9veHAAADA5dwu16y0AtestALXr' +
    'LXQACGFuZCBtb3JleHVxAH4AAAAAAAJxAH4ABnQAA0VuZA==',
    function(itm) {
      expect(Array.isArray(itm['@']), "Array.isArray(itm['@'])").to.be.true;
      expect(itm['@'].length, "itm['@'].length").to.equal(2);
      expect(Buffer.isBuffer(itm['@'][0]), "Buffer.isBuffer(itm['@'][0])").to.be.true;
      expect(itm['@'][0].toString('hex'), "itm['@'][0].toString('hex')").to.equal('b5eb2d00b5eb2d00b5eb2d');
      expect(itm['@'][1], "itm['@'][1]").to.equal('and more');
      expect(itm.foo, "itm.foo").to.equal(12345);
    }));

  it('HashMap<String, …>', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAEWphdmEudXRpbC5IYXNoTWFwBQfawcMWYNEDAAJGAApsb2FkRmFjdG9ySQAJdGhy' +
    'ZXNob2xkeHA/QAAAAAAADHcIAAAAEAAAAAJ0AANiYXJ0AANiYXp0AANmb29zcgARamF2YS5s' +
    'YW5nLkludGVnZXIS4qCk94GHOAIAAUkABXZhbHVleHIAEGphdmEubGFuZy5OdW1iZXKGrJUd' +
    'C5TgiwIAAHhwAAAAe3h1cQB+AAAAAAACcQB+AAt0AANFbmQ=',
    function(itm) {
      expect(typeof itm.map, "typeof itm.map").to.equal('object');
      expect(typeof itm['@'], "typeof itm['@']").to.equal('object');
      expect(itm.map.bar, "itm.map.bar").to.equal('baz');
      expect(itm.map.foo.value, "itm.map.foo.value").to.equal(123);
      expect(Object.keys(itm.map).length, "Object.keys(itm.map).length").to.equal(2);
    }));

  it('HashMap<not String, …>', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAEWphdmEudXRpbC5IYXNoTWFwBQfawcMWYNEDAAJGAApsb2FkRmFjdG9ySQAJdGhy' +
    'ZXNob2xkeHA/QAAAAAAADHcIAAAAEAAAAAJ0AANiYXp0AANiYXJzcgARamF2YS5sYW5nLklu' +
    'dGVnZXIS4qCk94GHOAIAAUkABXZhbHVleHIAEGphdmEubGFuZy5OdW1iZXKGrJUdC5TgiwIA' +
    'AHhwAAAAe3QAA2Zvb3h1cQB+AAAAAAACcQB+AAt0AANFbmQ=',
    function(itm) {
      expect(typeof itm.map, "typeof itm.map").to.equal('undefined');
      expect(typeof itm['@'], "typeof itm['@']").to.equal('object');
      expect(Array.isArray(itm['@']), "Array.isArray(itm['@'])").to.be.true;
    }));

  it('empty HashMap', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAEWphdmEudXRpbC5IYXNoTWFwBQfawcMWYNEDAAJGAApsb2FkRmFjdG9ySQAJdGhy' +
    'ZXNob2xkeHA/QAAAAAAAAHcIAAAAEAAAAAB4dXEAfgAAAAAAAnEAfgAFdAADRW5k',
    function(itm) {
      expect(typeof itm.map, "typeof itm.map").to.equal('object');
      expect(Object.keys(itm.map).length, "Object.keys(itm.map).length").to.equal(0);
    }));

  it('Hashtable<String, …>', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAE2phdmEudXRpbC5IYXNodGFibGUTuw8lIUrkuAMAAkYACmxvYWRGYWN0b3JJAAl0' +
    'aHJlc2hvbGR4cD9AAAAAAAAIdwgAAAALAAAAAnQAA2JhcnQAA2JhenQAA2Zvb3NyABFqYXZh' +
    'LmxhbmcuSW50ZWdlchLioKT3gYc4AgABSQAFdmFsdWV4cgAQamF2YS5sYW5nLk51bWJlcoas' +
    'lR0LlOCLAgAAeHAAAAB7eHVxAH4AAAAAAAJxAH4AC3QAA0VuZA==',
    function(itm) {
      expect(typeof itm.map, "typeof itm.map").to.equal('object');
      expect(typeof itm['@'], "typeof itm['@']").to.equal('object');
      expect(itm.map.bar, "itm.map.bar").to.equal('baz');
      expect(itm.map.foo.value, "itm.map.foo.value").to.equal(123);
      expect(Object.keys(itm.map).length, "Object.keys(itm.map).length").to.equal(2);
    }));

  it('EnumMap', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAEWphdmEudXRpbC5FbnVtTWFwBl19976QfKEDAAFMAAdrZXlUeXBldAARTGphdmEv' +
    'bGFuZy9DbGFzczt4cHZyAAhTb21lRW51bQAAAAAAAAAAEgAAeHIADmphdmEubGFuZy5FbnVt' +
    'AAAAAAAAAAASAAB4cHcEAAAAAn5xAH4ABnQAA09ORXNyABFqYXZhLmxhbmcuSW50ZWdlchLi' +
    'oKT3gYc4AgABSQAFdmFsdWV4cgAQamF2YS5sYW5nLk51bWJlcoaslR0LlOCLAgAAeHAAAAB7' +
    'fnEAfgAGdAAFVEhSRUV0AANiYXp4dXEAfgAAAAAAAnEAfgARdAADRW5k',
    function(itm) {
      expect(typeof itm.map, "typeof itm.map").to.equal('object');
      expect(typeof itm['@'], "typeof itm['@']").to.equal('object');
      expect(itm.map.THREE, "itm.map.THREE").to.equal('baz');
      expect(itm.map.ONE.value, "itm.map.ONE.value").to.equal(123);
      expect(Object.keys(itm.map).length, "Object.keys(itm.map).length").to.equal(2);
      expect(itm.keyType.name, "itm.keyType.name").to.equal('SomeEnum');
      expect(itm.keyType.isEnum, "itm.keyType.isEnum").to.be.true;
    }));

  it('ArrayList', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAE2phdmEudXRpbC5BcnJheUxpc3R4gdIdmcdhnQMAAUkABHNpemV4cAAAAAJ3BAAA' +
    'AAJ0AANmb29zcgARamF2YS5sYW5nLkludGVnZXIS4qCk94GHOAIAAUkABXZhbHVleHIAEGph' +
    'dmEubGFuZy5OdW1iZXKGrJUdC5TgiwIAAHhwAAAAe3h1cQB+AAAAAAACcQB+AAl0AANFbmQ=',
    function(itm) {
      expect(Array.isArray(itm.list), "Array.isArray(itm.list)").to.be.true;
      expect(itm.list.length, "itm.list.length").to.equal(2);
      expect(itm.list[0], "itm.list[0]").to.equal('foo');
      expect(itm.list[1].value, "itm.list[1].value").to.equal(123);
    }));

  it('ArrayDeque', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAFGphdmEudXRpbC5BcnJheURlcXVlIHzaLiQNoIsDAAB4cHcEAAAAAnQAA2Zvb3Ny' +
    'ABFqYXZhLmxhbmcuSW50ZWdlchLioKT3gYc4AgABSQAFdmFsdWV4cgAQamF2YS5sYW5nLk51' +
    'bWJlcoaslR0LlOCLAgAAeHAAAAB7eHVxAH4AAAAAAAJxAH4ACXQAA0VuZA==',
    function(itm) {
      expect(Array.isArray(itm.list), "Array.isArray(itm.list)").to.be.true;
      expect(itm.list.length, "itm.list.length").to.equal(2);
      expect(itm.list[0], "itm.list[0]").to.equal('foo');
      expect(itm.list[1].value, "itm.list[1].value").to.equal(123);
    }));

  it('HashSet', testCase(
    'rO0ABXVyABNbTGphdmEubGFuZy5PYmplY3Q7kM5YnxBzKWwCAAB4cAAAAAJ0AAVCZWdpbnEA' +
    'fgABc3IAEWphdmEudXRpbC5IYXNoU2V0ukSFlZa4tzQDAAB4cHcMAAAAED9AAAAAAAACdAAD' +
    'Zm9vc3IAEWphdmEubGFuZy5JbnRlZ2VyEuKgpPeBhzgCAAFJAAV2YWx1ZXhyABBqYXZhLmxh' +
    'bmcuTnVtYmVyhqyVHQuU4IsCAAB4cAAAAHt4dXEAfgAAAAAAAnEAfgAJdAADRW5k',
    function(itm) {
      expect(itm.set instanceof Set, "itm.set instanceof Set").to.be.true;
      expect(itm.set.size, "itm.set.size").to.equal(2);
      expect(itm.set.has('foo'), "itm.set.has('foo')").to.be.true;
    }));

});
