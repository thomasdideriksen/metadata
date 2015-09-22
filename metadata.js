var MD = {};

MD.LITTLE_ENDIAN = 0;
MD.BIG_ENDIAN = 1;

MD.SOI = 0xd8;
MD.APP0 = 0xe0;
MD.APP1 = 0xe1;
MD.SOS = 0xda;

MD.TIFF_LITTLE_ENDIAN = 0x4949;
MD.TIFF_BIG_ENDIAN = 0x4d4d;
MD.TIFF_MAGIC = 42;

MD.TIFF_TYPE_BYTE = 1;
MD.TIFF_TYPE_ASCII = 2;
MD.TIFF_TYPE_SHORT = 3;
MD.TIFF_TYPE_LONG = 4;
MD.TIFF_TYPE_RATIONAL = 5;
MD.TIFF_TYPE_SBYTE = 6;
MD.TIFF_TYPE_UNDEFINED = 7;
MD.TIFF_TYPE_SSHORT = 8;
MD.TIFF_TYPE_SLONG = 9;
MD.TIFF_TYPE_SRATIONAL = 10;
MD.TIFF_TYPE_FLOAT = 11;
MD.TIFF_TYPE_DOUBLE = 12;
MD.TIFF_TYPE_IFD = 13;

MD.TIFF_ID_EXIFIFD = 0x8769;
MD.TIFF_ID_GPSIFD = 0x8825;
MD.TIFF_ID_INTEROPERABILITYIFD = 0xA005;
MD.TIFF_ID_SUBIFDS = 0x014A;
MD.TIFF_ID_RICHTIFFIPTC = 0x83BB;
MD.TIFF_ID_JPEGINTERCHANGEFORMAT = 0x0201;
MD.TIFF_ID_JPEGINTERCHANGEFORMATLENGTH = 0x0202;
MD.TIFF_ID_STRIPOFFSETS = 0x0111;
MD.TIFF_ID_STRIPBYTECOUNTS = 0x0117;
MD.TIFF_ID_TILEOFFSETS = 0x0144;
MD.TIFF_ID_TILEBYTECOUNTS = 0x0145;

MD.check = function(expr, msg) {
    if (!expr) {
        throw msg;
    }
}

MD.get = function(url, success, failure) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                if (success) {
                    success(xhr.response);
                }
            } else {
                if (failure) {
                    failure();
                }
            }
        }
    }
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', url, true);
    xhr.send();
}

MD.BinaryReader = function(buffer, endian) {
    this._view = new DataView(buffer);
    this.endian = endian;
    this.position = 0;
    this.length = buffer.byteLength;
}

MD.BinaryReader.prototype = {
    constructor: MD.BinaryReader,

    readGeneric: function(fn, subSize, subCount, count) {
        var result = [];
        for (var i = 0; i < count; i++) {
            var item = [];
            for (var j = 0; j < subCount; j++) {
                var subItem = this._view[fn](this.position, (this.endian == MD.LITTLE_ENDIAN));
                this.position += subSize;
                item.push(subItem);
            }
            result.push((item.length == 1) ? item[0] : item);
        }
        return (result.length == 1) ? result[0] : result;
    },
   
    read8u:  function() { return this.readGeneric('getUint8', 1, 1, 1);   },
    read8s:  function() { return this.readGeneric('getInt8', 1, 1, 1);    },
    read16u: function() { return this.readGeneric('getUint16', 2, 1, 1);  },
    read16s: function() { return this.readGeneric('getInt16', 2, 1, 1);   },
    read32u: function() { return this.readGeneric('getUint32', 4, 1, 1);  },
    read32s: function() { return this.readGeneric('getInt32', 4, 1, 1);   },
    read32u: function() { return this.readGeneric('getUint32', 4, 1, 1);  },
    read32s: function() { return this.readGeneric('getInt32', 4, 1, 1);   },
    read32f: function() { return this.readGeneric('getFloat32', 4, 1, 1); },
    read64f: function() { return this.readGeneric('getFloat64', 8, 1, 1); },
    
    read: function(size) {
        var result = this._view.buffer.slice(this.position, this.position + size);
        this.position += size;
        return result;
    },
    
    readRemaining: function() {
        var result = this.read(this.length - this.position);
        this.position = this.length;
        return result;
    }
}

MD.Jpeg = function(buffer) {
    this.segments = [];
    this._parse(buffer);
}

MD.Jpeg.prototype = {
    constructor: MD.Jpeg,
    
    _parse: function(buffer) {
        var reader = new MD.BinaryReader(buffer, MD.BIG_ENDIAN);
        MD.check(reader.read8u() == 0xff, 'Invalid jpeg magic value');
        MD.check(reader.read8u() == MD.SOI, 'Invalid jpeg SOI marker');
        while (true) {
            MD.check(reader.read8u() == 0xff, 'Invalid jpeg marker');
            var marker = reader.read8u();
            if (marker != MD.SOS) {
                var segmentSize = reader.read16u() - 2;
                MD.check(segmentSize >= 0, 'Invalid jpeg segment size');
                this.segments.push({
                    marker: marker,
                    data: reader.read(segmentSize)
                });
            } else {
                this.segments.push({
                    marker: marker,
                    data: reader.readRemaining()
                });
                break;
            }
        }
    },
    
    _findSegments: function(marker, header) {
        var result = [];
        for (var i = 0; i < this.segments.length; i++) {
            var segment = this.segments[i];
            if (segment.marker == marker) {
                var headerMatch = true;
                if (header && header.length > 0) {
                    var reader = new MD.BinaryReader(segment.data);
                    var candidate = new Uint8Array(reader.read(header.length));
                    for (var j = 0; j < header.length; j++) {
                        if (header[j] != candidate[j]) {
                            headerMatch = false;
                            break;
                        }
                    }
                }
                if (headerMatch) {
                    result.push(segment);
                }
            }
        }
        return result;
    },
    
    getExifBuffer: function() {
        var exifHeader = [0x45, 0x78, 0x69, 0x66, 0x0, 0x0];
        var exifSegments = this._findSegments(MD.APP1, exifHeader);
        switch (exifSegments.length) {
            case 0: return undefined;
            case 1:
                var reader = new MD.BinaryReader(exifSegments[0].data);
                reader.position = exifHeader.length;
                return reader.readRemaining();
            default: throw 'Too many EXIF segments';
        }
    }
}

MD.Tiff = function(buffer) {
    this.tree = [];
    this.data = [];
    this._parse(buffer)
}

MD.Tiff.prototype = {
    constructor: MD.Tiff,
    
    _parse: function(buffer) {
        if (buffer) {
            var reader = new MD.BinaryReader(buffer, MD.LITTLE_ENDIAN);
            switch (reader.read16u()) {
                case MD.TIFF_LITTLE_ENDIAN: reader.endian = MD.LITTLE_ENDIAN; break;
                case MD.TIFF_BIG_ENDIAN: reader.endian = MD.BIG_ENDIAN; break;
                default: throw 'Invalid TIFF endian specifier';
            }
            MD.check(reader.read16u() == MD.TIFF_MAGIC, 'Invalid TIFF magic number');
            reader.position = reader.read32u();
            this.tree = this._parseTree(reader);
            this.data = this._extractData(reader);
        }
    },
    
    _extractData: function(reader) {
        var backupPos = reader.position;
        var result = {};
        var list = this.enumerate();
        var lookup = {};
        for (var i = 0; i < list.length; i++) {
            if (!(list[i].path in lookup)) {
                lookup[list[i].path] = {};
            }
            lookup[list[i].path][list[i].tag.id] = list[i].tag;
        }
        for (var path in lookup) {
            var tagLookup = lookup[path];
            for (var i = 0; i < this._DATA_REGIONS.length; i++) {
                var region = this._DATA_REGIONS[i];
                if (region.positionId in tagLookup && region.lengthId in tagLookup) {
                    var positionTag = tagLookup[region.positionId];
                    var lengthTag = tagLookup[region.lengthId];
                    MD.check(positionTag.type == MD.TIFF_TYPE_LONG, 'Invalid type for data position (' + positionTag.type + ')');
                    MD.check(lengthTag.type == MD.TIFF_TYPE_LONG, 'Invalid type for data length (' + lengthTag.type + ')');
                    var positions = (positionTag.data instanceof Array) ? positionTag.data : [positionTag.data];
                    var lengths = (lengthTag.data instanceof Array) ? lengthTag.data : [lengthTag.data];
                    MD.check(positions.length == lengths.length, 'Inconsistent position/length data');
                    var data = [];
                    for (var j = 0; j < positions.length; j++) {
                        reader.position = positions[j];
                        data.push(reader.read(lengths[j]));
                    }
                    if (!(path in result)) {
                        result[path] = [];
                    }
                    result[path].push({
                        data: data,
                        positionTag: positionTag,
                        lengthTag: lengthTag
                    });
                }
            }
        }
        reader.position = backupPos;
        return result;
    },
    
    _parseTree: function(reader) {
        var trunk = [];
        while (true) {
            var ifd = {
                tags: [],
                branches: {}
            };
            var tagCount = reader.read16u();
            for (var i = 0; i < tagCount; i++) {
                var id = reader.read16u();
                var type = reader.read16u();
                var count = reader.read32u();
                var nextPosition = reader.position + 4;
                var payloadSize = count * this._getTypeSize(type);
                if (payloadSize > 4) {
                    reader.position = reader.read32u();
                }
                var payload = reader.read(payloadSize);
                var tag = {
                    id: id,
                    type: type,
                    data: this._parsePayload(payload, reader.endian, type, count)
                };
                ifd.tags.push(tag);
                if (this._isSubIFD(tag.id, tag.type)) {
                    MD.check(tag.type == MD.TIFF_TYPE_LONG || tag.type == MD.TIFF_TYPE_IFD, 'Invalid tag type for sub IFD (' + tag.type + ')');
                    MD.check(!(tag.id in ifd.branches), 'Multiple sub IFDs with same parent ID (' + tag.id + ')');
                    ifd.branches[tag.id] = [];
                    var offsets = (tag.data instanceof Array) ? tag.data : [tag.data];
                    for (var j = 0; j < offsets.length; j++) {
                        reader.position = offsets[j];
                        ifd.branches[tag.id].push(this._parseTree(reader));
                    }
                }
                reader.position = nextPosition;
            }
            trunk.push(ifd);
            var offset = reader.read32u();
            if (offset == 0) {
                break;
            }
            reader.position = offset;
        }
        return trunk;
    },
    
    _parsePayload: function(payload, endian, type, count) {
        var reader = new MD.BinaryReader(payload, endian);
        switch (type) {
            case MD.TIFF_TYPE_UNDEFINED:
            case MD.TIFF_TYPE_BYTE: 
                return reader.readGeneric('getUint8', 1, 1, count);
            case MD.TIFF_TYPE_ASCII:
                MD.check(count > 0, 'Invalid ASCII length');
                var ascii = reader.readGeneric('getUint8', 1, 1, count - 1);
                return String.fromCharCode.apply(null, ascii);
            case MD.TIFF_TYPE_SBYTE:
                return reader.readGeneric('getInt8', 1, 1, count);
            case MD.TIFF_TYPE_SHORT:
                return reader.readGeneric('getUint8', 2, 1, count);
            case MD.TIFF_TYPE_SSHORT:
                return reader.readGeneric('getInt8', 2, 1, count);
            case MD.TIFF_TYPE_IFD:
            case MD.TIFF_TYPE_LONG:
                return reader.readGeneric('getUint32', 4, 1, count);
            case MD.TIFF_TYPE_SLONG: 
                return reader.readGeneric('getInt32', 4, 1, count);
            case MD.TIFF_TYPE_FLOAT:
                return reader.readGeneric('getFloat32', 4, 1, count);
            case MD.TIFF_TYPE_RATIONAL:
                return reader.readGeneric('getUint32', 4, 2, count);
            case MD.TIFF_TYPE_SRATIONAL:
                return reader.readGeneric('getInt32', 4, 2, count);
            case MD.TIFF_TYPE_DOUBLE:
                return reader.readGeneric('getFloat64', 8, 1, count);
            default: 
                throw 'Invalid TIFF type (' + type + ')';
        }
    },
    
    _isSubIFD: function(id, type) {
        if (type == MD.TIFF_TYPE_IFD) {
            return true;
        }
        switch (id) {
            case MD.TIFF_ID_EXIFIFD:
            case MD.TIFF_ID_GPSIFD:
            case MD.TIFF_ID_INTEROPERABILITYIFD:
            case MD.TIFF_ID_SUBIFDS:
                return true;
            default: 
                return false;
        }
    },
    
    _getTypeSize: function(type) {
        switch (type) {
            case MD.TIFF_TYPE_BYTE:
            case MD.TIFF_TYPE_ASCII:
            case MD.TIFF_TYPE_SBYTE:
            case MD.TIFF_TYPE_UNDEFINED:
                return 1;
            case MD.TIFF_TYPE_SHORT:
            case MD.TIFF_TYPE_SSHORT:
                return 2;
            case MD.TIFF_TYPE_LONG:
            case MD.TIFF_TYPE_SLONG: 
            case MD.TIFF_TYPE_FLOAT:
            case MD.TIFF_TYPE_IFD:
                return 4;
            case MD.TIFF_TYPE_RATIONAL:
            case MD.TIFF_TYPE_SRATIONAL:
            case MD.TIFF_TYPE_DOUBLE:
                return 8;
            default: throw 'Invalid TIFF type (' + type + ')';
        }
    },
    
    _parsePathComponent: function(component) {
        var result = undefined;
        var match = /(\w+)\[(\d+)\]/.exec(component);
        MD.check(match, 'Invalid path component: ' + component);
        result = {
            name: match[1],
            index: parseInt(match[2])
        };
        return result;
    },
    
    _DATA_REGIONS: [
        {
            positionId: MD.TIFF_ID_JPEGINTERCHANGEFORMAT,
            lengthId: MD.TIFF_ID_JPEGINTERCHANGEFORMATLENGTH
        },
        {
            positionId: MD.TIFF_ID_STRIPOFFSETS,
            lengthId: MD.TIFF_ID_STRIPBYTECOUNTS

        },
        {
            positionId: MD.TIFF_ID_TILEOFFSETS,
            lengthId: MD.TIFF_ID_TILEBYTECOUNTS
        }
    ],
    
    _SUBIFD_NAME_ID_MAPPING: {
        'exif': MD.TIFF_ID_EXIFIFD,
        'gps': MD.TIFF_ID_GPSIFD,
        'interoperability': MD.TIFF_ID_INTEROPERABILITYIFD,
        'subifds': MD.TIFF_ID_SUBIFDS
    },
    
    _getTagsByPath: function(path, create) {
        MD.check(path && path.startsWith('/'), 'Invalid path: ' + path);
        var components = path.split('/');
        var trunk = this.tree;
        var ifd = null;
        for (var i = 1; i < components.length; i++) {
            var component = components[i].trim().toLowerCase();
            var data = this._parsePathComponent(component);
            if (i % 2 == 1) {
                MD.check(data.name == 'ifd', 'Invalid component (' + component + ') expected "ifd"');
                if (data.index >= trunk.length) {
                    if (create) {
                        for (var j = trunk.length; j <= data.index; j++) {
                            trunk.push({
                                tags: [],
                                branches: {}
                            });
                        }
                    } else {
                        return undefined;
                    }
                }
                ifd = trunk[data.index];
                trunk = null;
            } else {
                var id;
                if (data.name in this._SUBIFD_NAME_ID_MAPPING) {
                    id = this._SUBIFD_NAME_ID_MAPPING[data.name];
                } else {
                    id = parseInt(data.name);
                    MD.check(!isNaN(id), 'Invalid branch in path: ' + data.name);
                }
                if (!(id in ifd.branches)) {
                    if (create) {
                        ifd.branches[id] = [];
                    } else {
                        return undefined;
                    }
                }
                if (data.index >= ifd.branches[id].length) {
                    if (create) {
                        for (var j = ifd.branches[id].length; j <= data.index; j++) {
                            ifd.branches[id].push([]);
                        }
                    } else {
                        return undefined;
                    }
                }
                trunk = ifd.branches[id][data.index];
                ifd = null;
            }
        }
        MD.check(ifd, 'Invalid path: ' + path + ', last component must be "ifd[N]"');
        return ifd.tags;
    },
    
    _enumerateRecursive: function(trunk, list, path) {
        for (var i = 0; i < trunk.length; i++) {
            var newPath = path + '/ifd[' + i + ']';
            var ifd = trunk[i];
            for (var j = 0; j < ifd.tags.length; j++) {
                list.push({
                    path: newPath,
                    tag: ifd.tags[j]    
                });
            }
            for (var j in ifd.branches) {
                var subTrunks = ifd.branches[j];
                var branchName = j.toString();
                for (var name in this._SUBIFD_NAME_ID_MAPPING) {
                    if (this._SUBIFD_NAME_ID_MAPPING[name] == j) {
                        branchName = name;
                        break;
                    }
                }
                for (var k = 0; k < subTrunks.length; k++) {
                    this._enumerateRecursive(subTrunks[k], list, newPath + '/' + branchName + '[' + k + ']');
                }
            }
        }
    },
    
    _removeTag: function(tags, id) {
        if (tags) {
            var idx = -1;
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx >= 0) {
                tags.splice(idx, 1);
            }
        }
    },
    
    getTags: function(path) {
        return this._getTagsByPath(path);
    },
    
    getTag: function(path, id) {
        var tags = this._getTagsByPath(path);
        if (tags) {
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].id == id) {
                    return tags[i];
                }
            }
        }
        return undefined;
    },
    
    removeTag: function(path, id) {
        var tags = this._getTagsByPath(path);
        this._removeTag(tags, id);
    },
    
    addTag: function(path, tag) {
        var tags = this._getTagsByPath(path, true);
        MD.check(tags, 'Failed to get or create path: ' + path);
        this._removeTag(tags, tag.id);
        tags.push(tag);
    },
    
    enumerate: function() {
        var list = [];
        this._enumerateRecursive(this.tree, list, '');
        return list;
    }
}