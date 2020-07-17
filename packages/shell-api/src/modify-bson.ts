import {
  ALL_PLATFORMS,
  ALL_SERVER_VERSIONS,
  ALL_TOPOLOGIES,
  ServerVersions,
  toStringMethods
} from './enums';
import Help from './help';
/**
 * This method modifies the BSON class passed in as argument. This is required so that
 * we can have the driver return our BSON classes without having to write our own serializer.
 * @param {Object} bson
 */
function constructHelp(className): Help {
  const classHelpKeyPrefix = `shell-api.classes.${className}.help`;
  const classHelp = {
    help: `${classHelpKeyPrefix}.description`,
    docs: `${classHelpKeyPrefix}.link`,
    attr: []
  };
  return new Help(classHelp);
}

export default function(bson, platform): void {
  [
    'Binary', 'Code', 'DBRef', 'Decimal128', 'Int32', 'Long', /* 'Double',*/
    'MaxKey', 'MinKey', 'ObjectId', 'Timestamp', 'Symbol'
  ].forEach((className) => {
    bson[className].prototype.serverVersions = ALL_SERVER_VERSIONS;
    bson[className].prototype.platforms = ALL_PLATFORMS;
    bson[className].prototype.topologies = ALL_TOPOLOGIES;

    const help = constructHelp(className);
    bson[className].prototype.help = (): Help => (help);
    Object.setPrototypeOf(bson[className].prototype.help, help);
  });

  const toString = toStringMethods[platform];

  bson.DBRef.prototype[toString] = function(): string {
    return `DBRef(${this.toJSON()})`;
  };

  bson.MaxKey.prototype[toString] = function(): string {
    return '{ "$maxKey" : 1 }';
  };

  bson.MinKey.prototype[toString] = function(): string {
    return '{ "$minKey" : 1 }';
  };

  bson.ObjectId.prototype[toString] = function(): string {
    return `ObjectID('${this.toHexString()}')`;
  };

  bson.Symbol.prototype[toString] = function(): string {
    return `'${this.valueOf()}'`;
  };
  bson.Symbol.prototype.serverVersions = [ ServerVersions.earliest, '1.6.0' ];

  bson.Timestamp.prototype[toString] = function(): string {
    return `Timestamp(${this.low}, ${this.high})`;
  };

  bson.Code.prototype[toString] = function(): string {
    return this.toJSON();
  };

  bson.Decimal128.prototype[toString] = function(): string {
    return `NumberDecimal('${this.toString()}')`;
  };
  const helpDecimal = constructHelp('NumberDecimal');
  bson.Decimal128.prototype.help = (): Help => (helpDecimal);
  Object.setPrototypeOf(bson.Decimal128.prototype.help, helpDecimal);

  // bson.Double.prototype[toString] = function(): string {
  //   return this.valueOf();
  // };

  bson.Int32.prototype[toString] = function(): string {
    return this.valueOf();
  };
  const helpInt = constructHelp('NumberInt');
  bson.Int32.prototype.help = (): Help => (helpInt);
  Object.setPrototypeOf(bson.Int32.prototype.help, helpInt);

  bson.Long.prototype[toString] = function(): string {
    return `NumberLong(${this.toNumber()})`;
  };
  const helpLong = constructHelp('NumberLong');
  bson.Long.prototype.help = (): Help => (helpLong);
  Object.setPrototypeOf(bson.Long.prototype.help, helpLong);

  bson.Binary.prototype[toString] = function(): string {
    return `BinData(${this.value()})`;
  };
  const helpBinData = constructHelp('BinData');
  bson.Binary.prototype.help = (): Help => (helpBinData);
  Object.setPrototypeOf(bson.Binary.prototype.help, helpBinData);
}