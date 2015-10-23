//
// Copyright (c) 2015 Thomas Dideriksen
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

var MD = {};

//
// Endian indicators
//
MD.LITTLE_ENDIAN = 0;
MD.BIG_ENDIAN = 1;

//
// Jpeg markers
//
MD.JPEG_MARKER_SOI = 0xd8;
MD.JPEG_MARKER_SOS = 0xda;
MD.JPEG_MARKER_APP0 = 0xe0;
MD.JPEG_MARKER_APP1 = 0xe1;
MD.JPEG_MARKER_APP2 = 0xe2;
MD.JPEG_MARKER_APP13 = 0xed;

//
// Jpeg headers
//
MD.JPEG_HEADER_EXIF = [0x45, 0x78, 0x69, 0x66, 0x0, 0x0];
MD.JPEG_HEADER_JFIF = [0x4A, 0x46, 0x49, 0x46, 0x0];
MD.JPEG_HEADER_JFXX = [0x4A, 0x46, 0x49, 0x46, 0x0];
MD.JPEG_HEADER_ICCPROFILE = [0x49, 0x43, 0x43, 0x5F, 0x50, 0x52, 0x4F, 0x46, 0x49, 0x4C, 0x45, 0x0];
MD.JPEG_HEADER_PHOTOSHOP_30 = [0x50, 0x68, 0x6F, 0x74, 0x6F, 0x73, 0x68, 0x6F, 0x70, 0x20, 0x33, 0x2E, 0x30, 0x0];

//
// Tiff magic values
//
MD.TIFF_LITTLE_ENDIAN = 0x4949;
MD.TIFF_BIG_ENDIAN = 0x4d4d;
MD.TIFF_MAGIC = 42;

//
// Tiff data types
//
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

//
// Tiff tag IDs
//
MD.TIFF_ID_EXIFIFD = 0x8769;
MD.TIFF_ID_GPSIFD = 0x8825;
MD.TIFF_ID_INTEROPERABILITYIFD = 0xA005;
MD.TIFF_ID_SUBIFDS = 0x014A;
MD.TIFF_ID_JPEGINTERCHANGEFORMAT = 0x0201;
MD.TIFF_ID_JPEGINTERCHANGEFORMATLENGTH = 0x0202;
MD.TIFF_ID_STRIPOFFSETS = 0x0111;
MD.TIFF_ID_STRIPBYTECOUNTS = 0x0117;
MD.TIFF_ID_TILEOFFSETS = 0x0144;
MD.TIFF_ID_TILEBYTECOUNTS = 0x0145;
MD.TIFF_ID_RICHTIFFIPTC = 0x83BB;

//
// Photoshop resource constants
//
MD.PHOTOSHOP_8BIM = 0x3842494D;

//
// Photoshop tag IDs
//
MD.PHOTOSHOP_ID_THUMB4 = 0x0409;
MD.PHOTOSHOP_ID_THUMB5 = 0x040C;

//
// Known tag pairs - these tag pairs indicates the position and 
// size of a data payload. The codec must know about these in order
// to properly extract and re-insert this data.
//
MD.KNOWN_PAIRS = {
    'jpeginterchangeformat': {
        positionId: MD.TIFF_ID_JPEGINTERCHANGEFORMAT,
        lengthId: MD.TIFF_ID_JPEGINTERCHANGEFORMATLENGTH
    },
    'strips': {
        positionId: MD.TIFF_ID_STRIPOFFSETS,
        lengthId: MD.TIFF_ID_STRIPBYTECOUNTS
    },
    'tiles': {
        positionId: MD.TIFF_ID_TILEOFFSETS,
        lengthId: MD.TIFF_ID_TILEBYTECOUNTS
    }
};

//
// Known sub-IFD tiff tags - these tags points to one (or multiple) 
// sub-IFDs elsewhere in the file structure. The codec must know about
// these in order to properly encode/decode the full tag tree.
// This structure also includes human readable names for adressing purposes.
// 
MD.KNOWN_SUBIFDS = {
    'exif': MD.TIFF_ID_EXIFIFD,
    'gps': MD.TIFF_ID_GPSIFD,
    'interoperability': MD.TIFF_ID_INTEROPERABILITYIFD,
    'subifds': MD.TIFF_ID_SUBIFDS
};

//
// Helper function for checking the validity of an expression
//
MD.check = function(expr, msg) {
    'use strict';
    if (!expr) {
        throw msg;
    }
};

//
// Helper function for fetching binary data using XHR/AJAX
//
MD.get = function(url, success, failure) {
    'use strict';
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
    };
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
};

//
// Base64 encodes the specified ArrayBuffer
//
MD.encodeBase64 = function(buffer) { 
    var buffer8 = new Uint8Array(buffer);
    var table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var extraBytes = buffer8.length % 3;
    var result = ''
    var temp, length, i;
    // Helper functions
    function lookup(num) {
      return table.charAt(num);
    }
    function encode(num) {
      return lookup(num >> 18 & 0x3F) + 
             lookup(num >> 12 & 0x3F) + 
             lookup(num >> 6 & 0x3F) + 
             lookup(num & 0x3F);
    }
    // Iterate through buffer, 3 bytes at the time
    for (i = 0, length = buffer8.length - extraBytes; i < length; i += 3) {
      temp = (buffer8[i] << 16) + 
             (buffer8[i + 1] << 8) + 
             (buffer8[i + 2]);
      result += encode(temp);
    }
    // Handle remaining bytes
    switch (extraBytes) {
      case 1:
        temp = buffer8[buffer.length - 1];
        result += lookup(temp >> 2);
        result += lookup((temp << 4) & 0x3F);
        result += '==';
        break;
      case 2:
        temp = (buffer8[buffer8.length - 2] << 8) + (buffer8[buffer8.length - 1]);
        result += lookup(temp >> 10);
        result += lookup((temp >> 4) & 0x3F);
        result += lookup((temp << 2) & 0x3F);
        result += '=';
        break;
      default:
        break;
    }
    return result;
}

//
// Create data URL from ArrayBuffer with specified mimetype (mimetype example: 'image/jpeg')
//
MD.toDataURL = function(buffer, mimetype) {
    return 'data:' + mimetype + ';base64,' + MD.encodeBase64(buffer);
}

//
// Binary reader class
//
MD.BinaryReader = function(buffer, endian) {
    'use strict';
    this._view = new DataView(buffer);
    this.endian = endian ? endian : MD.LITTLE_ENDIAN;
    this.position = 0;
    this.length = buffer.byteLength;
};

MD.BinaryReader.prototype = {
    constructor: MD.BinaryReader,

    //
    // Generic reader function
    //
    readGeneric: function(fn, subSize, subCount, count) {
        'use strict';
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
   
    //
    // Type-specific reader functions
    //
    read8u:  function() { 'use strict'; return this.readGeneric('getUint8', 1, 1, 1);   },
    read8s:  function() { 'use strict'; return this.readGeneric('getInt8', 1, 1, 1);    },
    read16u: function() { 'use strict'; return this.readGeneric('getUint16', 2, 1, 1);  },
    read16s: function() { 'use strict'; return this.readGeneric('getInt16', 2, 1, 1);   },
    read32u: function() { 'use strict'; return this.readGeneric('getUint32', 4, 1, 1);  },
    read32s: function() { 'use strict'; return this.readGeneric('getInt32', 4, 1, 1);   },
    read32f: function() { 'use strict'; return this.readGeneric('getFloat32', 4, 1, 1); },
    read64f: function() { 'use strict'; return this.readGeneric('getFloat64', 8, 1, 1); },
    
    //
    // Read the specified number of bytes and return the result as an ArrayBuffer
    //
    read: function(size) {
        'use strict';
        var result = this._view.buffer.slice(this.position, this.position + size);
        this.position += size;
        return result;
    },
    
    //
    // Read the remaing bytes in the stream and return the result as an ArrayBuffer
    //
    readRemaining: function() {
        'use strict';
        var result = this.read(this.length - this.position);
        this.position = this.length;
        return result;
    }
};

//
// Binary writer class
//
MD.BinaryWriter = function(buffer, endian) {
    'use strict';
    this.position = 0;
    this.endian = endian ? endian : MD.LITTLE_ENDIAN;
    this.buffer = buffer;
    this._view = new DataView(buffer);
};

MD.BinaryWriter.prototype = {
    constructor: MD.BinaryWriter,
    
    //
    // Generic writer function
    //
    writeGeneric: function(fn, subSize, subCount, count, value) {
        'use strict';
        var items = (count == 1) ? [value] : value;
        MD.check(items.length == count, 'Invalid tag data size');
        for (var i = 0; i < items.length; i++) {
            var item = (items[i] instanceof Array) ? items[i] : [items[i]];
            MD.check(item.length == subCount, 'Invalid tag data size');
            for (var j = 0; j < item.length; j++) {
                this._view[fn](this.position, item[j], (this.endian == MD.LITTLE_ENDIAN));
                this.position += subSize;
            }
        }
    },
    
    //
    // Type specific writer functions
    //
    write8u:  function(val) { 'use strict'; this.writeGeneric('setUint8', 1, 1, 1, val);   },
    write8s:  function(val) { 'use strict'; this.writeGeneric('setInt8', 1, 1, 1, val);    },
    write16u: function(val) { 'use strict'; this.writeGeneric('setUint16', 2, 1, 1, val);  },
    write16s: function(val) { 'use strict'; this.writeGeneric('setInt16', 2, 1, 1, val);   },
    write32u: function(val) { 'use strict'; this.writeGeneric('setUint32', 4, 1, 1, val);  },
    write32s: function(val) { 'use strict'; this.writeGeneric('setInt32', 4, 1, 1, val);   },
    write32f: function(val) { 'use strict'; this.writeGeneric('setFloat32', 4, 1, 1, val); },
    write64f: function(val) { 'use strict'; this.writeGeneric('setFloat64', 8, 1, 1, val); },
    
    //
    // Write ArrayBuffer
    //
    write: function(buf) {
        'use strict';
        var u8 = new Uint8Array(this._view.buffer);
        u8.set(new Uint8Array(buf), this.position);
        this.position += buf.byteLength;
    }
};

//
// Jpeg metadata codec class
//
MD.JpegResource = function(buffer) {
    'use strict';
    this._segments = [];
    this._parse(buffer);
};

MD.JpegResource.prototype = {
    
    //
    // PUBLIC METHODS
    //
    
    constructor: MD.JpegResource,

    //
    // Get 'Photoshop 3.0' buffer
    //
    get photoshopBuffer() {
        'use strict';
        return this._getSegmentDataSingle(MD.JPEG_MARKER_APP13, MD.JPEG_HEADER_PHOTOSHOP_30);
    },
    
    //
    // Set 'Photoshop 3.0' buffer
    //
    set photoshopBuffer(buffer) {
        'use strict';
        this._removeSegments(MD.JPEG_MARKER_APP13, MD.JPEG_HEADER_PHOTOSHOP_30);
        if (!buffer) {
            return;
        }
        var photoshopSegment = this._createSegment(MD.JPEG_MARKER_APP13, MD.JPEG_HEADER_PHOTOSHOP_30, buffer);
        var insertIdx = this._lastSegmentIndex([MD.JPEG_MARKER_APP0, MD.JPEG_MARKER_APP1]) + 1;
        this._segments.splice(insertIdx, 0, photoshopSegment);
    },
    
    //
    // Get EXIF buffer
    //
    get exifBuffer() {
        'use strict';
        return this._getSegmentDataSingle(MD.JPEG_MARKER_APP1, MD.JPEG_HEADER_EXIF);
    },
    
    //
    // Set EXIF buffer
    //
    set exifBuffer(buffer) {
        'use strict';
        this._removeSegments(MD.JPEG_MARKER_APP1, MD.JPEG_HEADER_EXIF);
        if (!buffer) {
            return;
        }
        var exifSegment = this._createSegment(MD.JPEG_MARKER_APP1, MD.JPEG_HEADER_EXIF, buffer);
        this._removeSegments(MD.JPEG_MARKER_APP0, MD.JPEG_HEADER_JFIF);
        this._removeSegments(MD.JPEG_MARKER_APP0, MD.JPEG_HEADER_JFXX);
        this._segments.unshift(exifSegment);
    },
    
    //
    // Get embedded ICC profile
    //
    get iccProfileBuffer() {
        'use strict';
        // Get ICC segments
        var iccSegments = this._findSegments(MD.JPEG_MARKER_APP2, MD.JPEG_HEADER_ICCPROFILE);
        if (iccSegments.length === 0) {
            return undefined;
        }
        // Sort segments by sequence number (in ascending order)
        iccSegments.sort(function(a, b) {
            var ra = new MD.BinaryReader(a.data);
            var rb = new MD.BinaryReader(b.data);
            ra.position = rb.position = MD.JPEG_HEADER_ICCPROFILE.length;
            return ra.read8u() - rb.read8u();
        });
        // Compute size of embedded ICC profile - also verify that all segments are present
        var i, size = 0;
        var iccSegment, reader;
        for (i = 0; i < iccSegments.length; i++) {
            iccSegment = iccSegments[i];
            size += (iccSegment.data.byteLength - MD.JPEG_HEADER_ICCPROFILE.length - 2);
            reader = new MD.BinaryReader(iccSegment.data);
            reader.position = MD.JPEG_HEADER_ICCPROFILE.length;
            var current = reader.read8u();
            var total = reader.read8u();
            MD.check(current == (i + 1), 'Invalid ICC sequence number');
            MD.check(total == iccSegments.length, 'Invalid ICC segment count');
        }
        // Assemble ICC profile buffer
        var buffer = new ArrayBuffer(size);
        var writer = new MD.BinaryWriter(buffer);
        for (i = 0; i < iccSegments.length; i++) {
            iccSegment = iccSegments[i];
            reader = new MD.BinaryReader(iccSegment.data);
            reader.position = MD.JPEG_HEADER_ICCPROFILE.length + 2;
            writer.write(reader.readRemaining());
        }
        // Return ICC profile (as an ArrayBuffer)
        return buffer;
    },
    
    //
    // Set embedded ICC profile
    //
    set iccProfileBuffer(buffer) {
        'use strict';
        // Remove existing ICC profile (if present)
        this._removeSegments(MD.JPEG_MARKER_APP2, MD.JPEG_HEADER_ICCPROFILE);
        if (!buffer) {
            return;
        }
        // Compute the number of segments needed to embed ICC profile
        var maxSize = 0xffff - MD.JPEG_HEADER_ICCPROFILE.length - 4;
        var segmentCount = Math.ceil(buffer.byteLength / maxSize);
        MD.check(segmentCount <= 255, 'ICC profile is too large');
        // Create ICC profile segments
        var reader = new MD.BinaryReader(buffer);
        var iccSegments = [];
        var remaining = buffer.byteLength;
        var currentSegment = 1;
        while (remaining > 0) {
            var size = Math.min(remaining, maxSize);
            remaining -= size;
            var iccBuffer = new ArrayBuffer(size + MD.JPEG_HEADER_ICCPROFILE.length + 2);
            var writer = new MD.BinaryWriter(iccBuffer);
            writer.write(new Uint8Array(MD.JPEG_HEADER_ICCPROFILE).buffer);
            writer.write8u(currentSegment++);
            writer.write8u(segmentCount);
            writer.write(reader.read(size));
            iccSegments.push({
                marker: MD.JPEG_MARKER_APP2,
                data: iccBuffer
            });
        }
        // Insert ICC profile segments in segment array
        var insertIdx = this._lastSegmentIndex([MD.JPEG_MARKER_APP0, MD.JPEG_MARKER_APP1]) + 1;
        for (i = 0; i < iccSegments.length; i++) {
            this._segments.splice(insertIdx, 0, iccSegments[i]);
            insertIdx++;
        }
    },
    
    //
    // Get embedded jpeg thumbnail
    //
    get thumbnailBuffer() {
        // First, attempt to get the thumbnail from the Photoshop segment
        if (this.photoshopBuffer) {
            var photoshop = new MD.PhotoshopResource(this.photoshopBuffer);
            var thumb = photoshop.getTag(MD.PHOTOSHOP_ID_THUMB5);
            if (!thumb) {
                thumb = photoshop.getTag(MD.PHOTOSHOP_ID_THUMB4);
            }
            if (thumb) {
                var reader = new MD.BinaryReader(thumb.data, MD.BIG_ENDIAN);
                var format = reader.read32u();
                var width = reader.read32u();
                var height = reader.read32u();
                var widthBytes = reader.read32u();
                var totalSize = reader.read32u();
                var compressedSize = reader.read32u();
                var bitsPerPixel = reader.read16u();
                var numberOfPlanes = reader.read16u();
                // We only support jpeg compressed thumbnails for now. (0 = uncompressed, 1 = jpeg)
                if (format == 1 ) {
                    return reader.readRemaining();
                }
            } 
        }
        // Otherwise attempt to get the legacy thumbnail from IFD1
        if (this.exifBuffer) {
            var exif = new MD.TiffResource(this.exifBuffer);
            var data = exif.getData('/ifd[1]', 'jpeginterchangeformat');
            return (data && data.length == 1) ? data[0] : undefined;
        }
        return undefined;
    },
    
    //
    // Serialize (or save) jpeg. This function returns an ArrayBuffer
    // that contains valid jpeg data.
    //
    save: function() {
        'use strict';
        // Compute size of jpeg buffer
        var i, segment, size = 2;
        for (i = 0; i < this._segments.length; i++) {
            segment = this._segments[i];
            size += 4;
            size += segment.data.byteLength;
        }
        size -= 2; // Note: Subtract 2 since the last segment (SOS) doesn't have a 16-bit size
        // Create buffer and write segment headers/data
        var buffer = new ArrayBuffer(size);
        var writer = new MD.BinaryWriter(buffer, MD.BIG_ENDIAN);
        writer.write8u(0xff);
        writer.write8u(MD.JPEG_MARKER_SOI);
        for (i = 0; i < this._segments.length; i++) {
            segment = this._segments[i];
            writer.write8u(0xff);
            writer.write8u(segment.marker);
            if (segment.marker != MD.JPEG_MARKER_SOS) {
                var segmentSize = 2 + segment.data.byteLength;
                MD.check(segmentSize <= 0xffff, 'Segment is too large');
                writer.write16u(segmentSize);
            }
            writer.write(segment.data);
        }
        // Return serialized jpeg buffer
        return buffer;
    },
    
    //
    // PRIVATE METHODS
    //
    
    //
    // Jpeg parser, this will extract the individual jpeg segments
    //
    _parse: function(buffer) {
        'use strict';
        var reader = new MD.BinaryReader(buffer, MD.BIG_ENDIAN);
        MD.check(reader.read8u() == 0xff, 'Invalid jpeg magic value');
        MD.check(reader.read8u() == MD.JPEG_MARKER_SOI, 'Invalid jpeg SOI marker');
        while (true) {
            MD.check(reader.read8u() == 0xff, 'Invalid jpeg marker');
            var marker = reader.read8u();
            if (marker != MD.JPEG_MARKER_SOS) {
                var segmentSize = reader.read16u() - 2;
                MD.check(segmentSize >= 0, 'Invalid jpeg segment size');
                this._segments.push({
                    marker: marker,
                    data: reader.read(segmentSize)
                });
            } else {
                this._segments.push({
                    marker: marker,
                    data: reader.readRemaining()
                });
                break;
            }
        }
    },
    
    //
    // Finds the last position (index) of the specified marker type(s)
    //
    _lastSegmentIndex: function(markers) {
        var idx = 0;
        for (var i = 0; i < this._segments.length; i++) {
            var segment = this._segments[i];
            for (var j = 0; j < markers.length; j++) {
                if (segment.marker == markers[j]) {
                    idx = i;
                }
            }
        }
        return idx;
    },
    
    //
    // Find and return segments that matches the specified marker 
    // and (optionally) header
    //
    _findSegments: function(marker, header) {
        'use strict';
        var result = [];
        for (var i = 0; i < this._segments.length; i++) {
            var segment = this._segments[i];
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
    
    //
    // Remove all segments with the specified marker and (optionally) header
    //
    _removeSegments: function(marker, header) {
        'use strict';
        var toRemove = this._findSegments(marker, header);
        for (var i = 0; i < toRemove.length; i++) {
            var idx = this._segments.indexOf(toRemove[i]);
            this._segments.splice(idx, 1);
        }
    },
    
    //
    // Get the data payload from a single segment with the specified marker
    // and (optionally) header. If multiple matches are found this function 
    // will throw an exception.
    //
    _getSegmentDataSingle: function(marker, header) {
        'use strict';
        var segments = this._findSegments(marker, header);
        switch (segments.length) {
            case 0: return undefined;
            case 1:
                var reader = new MD.BinaryReader(segments[0].data);
                reader.position = header ? header.length : 0;
                return reader.readRemaining();
            default: throw 'Too many segments';
        }
    },
    
    //
    // Create a segment buffer
    //
    _createSegment(marker, header, payload) {
        'use strict';
        // Compute and verify segment size
        var segmentSize = payload.byteLength + header.length;
        MD.check(segmentSize <= (0xffff - 2), 'Segment buffer is too large');
        // Create segment
        var segmentData = new ArrayBuffer(segmentSize);
        var writer = new MD.BinaryWriter(segmentData);
        writer.write(new Uint8Array(header).buffer);
        writer.write(payload);
        var segment = {
            marker: marker,
            data: segmentData
        };
        return segment;
    }
};

//
// Tiff metadata codec class
//
MD.TiffResource = function(buffer) {
    'use strict';
    this._tree = [];
    this._nativeEndian = MD.LITTLE_ENDIAN;
    this._parse(buffer);
};

MD.TiffResource.prototype = {
    
    //
    // PUBLIC METHODS
    //
    
    constructor: MD.TiffResource,

    //
    // Get the tag-array that matches the specified path
    //
    getTags: function(path) {
        'use strict';
        return this._getTagsByPath(path);
    },
    
    //
    // Get the tag that matches the specified path and ID
    //
    getTag: function(path, id) {
        'use strict';
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
    
    //
    // Remove (delete) the tag that matches the specified path and ID
    //
    removeTag: function(path, id) {
        'use strict';
        var tags = this._getTagsByPath(path);
        this._removeTag(tags, id);
    },
    
    //
    // Add tag to tag-list that matches the specified path (will overwrite if the tag already exist)
    //
    setTag: function(path, tag) {
        'use strict';
        var tags = this._getTagsByPath(path, true);
        MD.check(tags, 'Failed to get or create path: ' + path);
        this._removeTag(tags, tag.id);
        tags.push(tag);
    },
    
    //
    // Enumerate all tags in the tiff tree
    //
    enumerateTags: function() {
        'use strict';
        var list = [];
        this._enumerateRecursive(this._tree, '', function(path, ifd) {
            for (var i = 0; i < ifd.tags.length; i++) {
                list.push({
                    path: path,
                    tag: ifd.tags[i]
                });
            }
        });
        return list;
    },
    
    //
    // Enumerate all named data-entries in the tiff tree
    //
    enumerateData: function() {
        'use strict';
        var list = [];
        this._enumerateRecursive(this._tree, '', function(path, ifd) {
            for (var i in ifd.data) {
                list.push({
                    path: path,
                    name: i,
                    data: ifd.data[i].data
                });
            }
        });
        return list;
    },
    
    //
    // Get named data
    //
    getData: function(path, name) {
        'use strict';
        MD.check(name in MD.KNOWN_PAIRS, 'Unknown data name: "' + name + '"');
        var ifd = this._getIfdByPath(path, false);
        if (ifd && ifd.data && (name in ifd.data)) {
            return ifd.data[name].data;
        }
        return undefined;
    },
    
    //
    // Set named data
    //
    setData: function(path, name, data) {
        'use strict';
        MD.check(name in MD.KNOWN_PAIRS, 'Unknown data name: "' + name + '"');
        // Set data
        var pair = MD.KNOWN_PAIRS[name];
        var ifd = this._getIfdByPath(path, true);
        ifd.data = ifd.data ? ifd.data : {};
        ifd.data[name] = {
            positionId: pair.positionId,
            lengthId: pair.lengthId,
            data: data
        }
        // Ensure that the corresponding tag pair is present in the IFD
        this._removeTag(ifd.tags, pair.positionId);
        ifd.tags.push({
            id: pair.positionId,
            type: MD.TIFF_TYPE_LONG,
            data: 0
        });
        this._removeTag(ifd.tags, pair.lengthId);
        ifd.tags.push({
            id: pair.lengthId,
            type: MD.TIFF_TYPE_LONG,
            data: 0
        });
    },
    
    //
    // Remove named data
    //
    removeData: function(path, name) {
        'use strict';
        // Remove named data and corresponding tag pair
        MD.check(name in MD.KNOWN_PAIRS, 'Unknown data name: "' + name + '"');
        var ifd = this._getIfdByPath(path, false);
        var pair = MD.KNOWN_PAIRS[name];
        if (ifd && ifd.data && (name in ifd.data)) {
            delete ifd.data[name];
            this._removeTag(ifd.tags, pair.positionId);
            this._removeTag(ifd.tags, pair.lengthId);
        }
    },
    
    //
    // Serialize (or save) tiff structure. This function returns an ArrayBuffer
    // that contains valid tiff data.
    //
    save: function(endian) {
        'use strict';
        var sizes = this._computeSizes();
        var buffer = new ArrayBuffer(sizes.layoutSize + sizes.payloadSize);
        
        var targetEndian = endian ? endian : this._nativeEndian;
        var layoutWriter = new MD.BinaryWriter(buffer, targetEndian);
        var payloadWriter = new MD.BinaryWriter(buffer, targetEndian);
        payloadWriter.position = sizes.layoutSize;
        
        switch (layoutWriter.endian) {
            case MD.LITTLE_ENDIAN: layoutWriter.write16u(MD.TIFF_LITTLE_ENDIAN); break;
            case MD.BIG_ENDIAN: layoutWriter.write16u(MD.TIFF_BIG_ENDIAN); break;
            default: throw 'Invalid endian specifier (' + layoutWriter.endian + ')';
        }
        layoutWriter.write16u(MD.TIFF_MAGIC);
        layoutWriter.write32u(layoutWriter.position + 4);
        this._saveTrunk(layoutWriter, payloadWriter, this._tree);
        return buffer;
    },
    
    //
    // PRIVATE METHODS
    //
    
    //
    // Compute tag 'count' value based on tag type/data
    //
    _computeCount: function(tag) {
        'use strict';
        switch (tag.type) {
            case MD.TIFF_TYPE_RATIONAL:
            case MD.TIFF_TYPE_SRATIONAL:
                MD.check(tag.data instanceof Array, 'Invalid (S)RATIONAL data');
                return (tag.data[0] instanceof Array) ? tag.data.length : 1;
            case MD.TIFF_TYPE_ASCII:
                MD.check(typeof tag.data === 'string', 'Invalid ASCII data');
                return tag.data.length + 1; // Zero terminator
            default:
                return (tag.data instanceof Array) ? tag.data.length : 1;
        }
    },
    
    //
    // Write tag payload data
    //        
    _writeTagData: function(writer, type, data, count) {
        'use strict';
        var beforePosition = writer.position;
        switch (type) {
            case MD.TIFF_TYPE_UNDEFINED:
            case MD.TIFF_TYPE_BYTE: 
                writer.writeGeneric('setUint8', 1, 1, count, data);
                break;
            case MD.TIFF_TYPE_ASCII:
                MD.check(typeof data === 'string', 'Invalid ASCII data');
                MD.check(count == data.length + 1, 'Invalid ASCII count');
                for (var i = 0; i < data.length; i++) {
                    writer.write8u(data.charCodeAt(i));
                }
                writer.write8u(0); // Zero terminator
                break;
            case MD.TIFF_TYPE_SBYTE:
                writer.writeGeneric('setInt8', 1, 1, count, data);
                break;
            case MD.TIFF_TYPE_SHORT:
                writer.writeGeneric('setUint16', 2, 1, count, data);
                break;
            case MD.TIFF_TYPE_SSHORT:
                writer.writeGeneric('setInt16', 2, 1, count, data);
                break;
            case MD.TIFF_TYPE_IFD:
            case MD.TIFF_TYPE_LONG:
                writer.writeGeneric('setUint32', 4, 1, count, data);
                break;
            case MD.TIFF_TYPE_SLONG: 
                writer.writeGeneric('setInt32', 4, 1, count, data);
                break;
            case MD.TIFF_TYPE_FLOAT:
                writer.writeGeneric('setFloat32', 4, 1, count, data);
                break;
            case MD.TIFF_TYPE_RATIONAL:
                writer.writeGeneric('setUint32', 4, 2, count, data);
                break;
            case MD.TIFF_TYPE_SRATIONAL:
                writer.writeGeneric('setInt32', 4, 2, count, data);
                break;
            case MD.TIFF_TYPE_DOUBLE:
                writer.writeGeneric('setFloat32', 8, 1, count, data);
                break;
            default: 
                throw 'Invalid TIFF type (' + type + ')';
        }
        var writtenBytes = writer.position - beforePosition;
        if (writtenBytes % 2 == 1) {
            writer.write8u(0); // Note: Padding
        }
    },
    
    //
    // Serialize sub branches
    //
    _saveBranches: function(layoutWriter, payloadWriter, trunk, dataOffsets) {
        'use strict';
        for (var i = 0; i < trunk.length; i++) {
            var ifd = trunk[i];
            for (var j in ifd.branches) {
                if (ifd.branches.hasOwnProperty(j)) {
                    var dataOffset = dataOffsets[i][j];
                    if (dataOffset && this._pointsToSubIfd(dataOffset.tag)) {
                        var subTrunks = ifd.branches[j];
                        MD.check(this._computeCount(dataOffset.tag) == subTrunks.length, 'Inconsistent number of sub IFDs');
                        var writer = new MD.BinaryWriter(layoutWriter.buffer, layoutWriter.endian);
                        writer.position = dataOffset.offset;
                        for (var k = 0; k < subTrunks.length; k++) {
                            writer.write32u(layoutWriter.position);
                            this._saveTrunk(layoutWriter, payloadWriter, subTrunks[k]);
                        }
                    }
                }
            }
        }
    },
    
    //
    // Serialize data payloads (pair IDs)
    //
    _saveData: function(layoutWriter, payloadWriter, trunk, dataOffsets) {
        'use strict';
        for (var i = 0; i < trunk.length; i++) {
            var ifd = trunk[i];
            if (ifd.data) {
                for (var j in ifd.data) {
                    var chunk = ifd.data[j];
                    var offsetLen = dataOffsets[i][chunk.lengthId];
                    var offsetPos = dataOffsets[i][chunk.positionId];
                    if (offsetLen && offsetPos) {
                        var k;
                        var writer = new MD.BinaryWriter(layoutWriter.buffer, layoutWriter.endian);
                        writer.position = offsetLen.offset;
                        for (k = 0; k < chunk.data.length; k++) {
                            writer.write32u(chunk.data[k].byteLength);
                        }
                        writer.position = offsetPos.offset;
                        for (k = 0; k < chunk.data.length; k++) {
                            writer.write32u(payloadWriter.position);
                            payloadWriter.write(chunk.data[k]);
                            if (chunk.data[k].byteLength % 2 == 1) {
                                payloadWriter.write8u(0); // Padding
                            }
                        }
                    }
                }
            }
        }
    },
    
    //
    // Check if the specified id is part of a broken id-pair
    //
    _isBrokenPair: function(id, tagsById) {
        'use strict';
        var valid = true;
        for (var i in MD.KNOWN_PAIRS) {
            var pair = MD.KNOWN_PAIRS[i];
            if (id == pair.positionId) {
                valid = (pair.lengthId in tagsById);
                break;
            }
            if (id == pair.lengthId) {
                valid = (pair.positionId in tagsById);
                break;
            }
        }
        return !valid;
    },
    
    //
    // Check if the specifed id is part of a pair where the data payload is missing
    //
    _isMissingDataPayload: function(id, data) {
        'use strict';
        for (var i in MD.KNOWN_PAIRS) {
            var pair = MD.KNOWN_PAIRS[i];
            if (pair.positionId == id || pair.lengthId == id) {
                return !(i in data);
            }
        }
        return false;
    },
    
    //
    // Serialize IFD trunk
    //
    _saveTrunk: function(layoutWriter, payloadWriter, trunk) {
        'use strict';
        var dataOffsets = {};
        // Loop through sub IFDs in trunk
        for (var i = 0; i < trunk.length; i++) {
            dataOffsets[i] = {};
            var ifd = trunk[i];
            var j, tag, tagsById = {};
            // Construct tab-by-id lookup
            for (j = 0; j < ifd.tags.length; j++) {
                tag = ifd.tags[j];
                MD.check(!(tag.id in tagsById), 'Duplicate tag ID');
                tagsById[tag.id] = tag;
            }
            // Prune tags that for some reason have become invalid
            var prunedTags = [];
            for (j in  tagsById) {
                if (tagsById.hasOwnProperty(j)) {
                    tag = tagsById[j];
                    // Prune sub IFD pointer-tags with non-existant sub IFDs
                    if (this._pointsToSubIfd(tag) && !(tag.id in ifd.branches)) {
                        continue;
                    }
                    // Prune tags that are part of a broken id-pair
                    if (this._isBrokenPair(tag.id, tagsById)) {
                        continue;
                    }
                    // Prune id-pair tags if the corresponding data payload is missing
                    if (this._isMissingDataPayload(tag.id, ifd.data)) {
                        continue;
                    }
                    prunedTags.push(tag);
                }
            }
            // Sort tags by ID, as per the spec
            prunedTags.sort(function(a, b) {
                return (a.id - b.id);
            });
            // Serialize tags            
            layoutWriter.write16u(prunedTags.length);
            for (j = 0; j < prunedTags.length; j++) {
                tag = prunedTags[j];
                var count = this._computeCount(tag);
                var size = this._getTypeSize(tag.type) * count;
                layoutWriter.write16u(tag.id);
                layoutWriter.write16u(tag.type);
                layoutWriter.write32u(count);
                dataOffsets[i][tag.id] = {
                    tag: tag,
                    offset: (size > 4) ? payloadWriter.position : layoutWriter.position
                };
                layoutWriter.write32u(0);
                var nextPos = layoutWriter.position;
                layoutWriter.position -= 4;
                if (size > 4) {
                    layoutWriter.write32u(payloadWriter.position);
                    this._writeTagData(payloadWriter, tag.type, tag.data, count);
                } else {
                    this._writeTagData(layoutWriter, tag.type, tag.data, count);
                }
                layoutWriter.position = nextPos;
            }
            var isLastIfd = (i == trunk.length - 1);
            layoutWriter.write32u(isLastIfd ? 0 : layoutWriter.position + 4);
        }
        // Save branches (sub IFDs)
        this._saveBranches(layoutWriter, payloadWriter, trunk, dataOffsets);
        // Save payload data (id-pairs)
        this._saveData(layoutWriter, payloadWriter, trunk, dataOffsets);
    },
    
    //
    // Compute size of tiff structure
    //
    _computeSizes: function() {
        'use strict';
        var sizes = {
            layoutSize: 8,
            payloadSize: 0
        };
        this._computeSizesRecursive(this._tree, sizes);
        MD.check(sizes.layoutSize % 2 === 0, 'Invalid file structure size');
        MD.check(sizes.payloadSize % 2 === 0, 'Invalid file structure size');
        return sizes;
    },
    
    //
    // Helper function for computing the size of the tiff structure
    //
    _computeSizesRecursive: function(trunk, sizes) {
        'use strict';
        for (var i = 0; i < trunk.length; i++) {
            // Size contributes from the main trunk
            var ifd = trunk[i];
            var j, k, dataSize;
            sizes.layoutSize += 2;
            for (j = 0; j < ifd.tags.length; j++) {
                sizes.layoutSize += 12;
                var tag = ifd.tags[j];
                dataSize = this._computeCount(tag) * this._getTypeSize(tag.type);
                if (dataSize > 4) {
                    sizes.payloadSize += dataSize + (dataSize % 2); // Note: Padding
                }
            }
            // Size contributes from data payloads (id-pairs)
            sizes.layoutSize += 4;
            if (ifd.data) {
                for (j in ifd.data) {
                    for (k = 0; k < ifd.data[j].data.length; k++) {
                        dataSize = ifd.data[j].data[k].byteLength;
                        sizes.payloadSize += dataSize + (dataSize % 2); // Note: Padding
                    }
                }
            }
            // Size contributions from sub IFDs
            for (j in ifd.branches) {
                if (ifd.branches.hasOwnProperty(j)) {
                    var subTrunks = ifd.branches[j];
                    for (k = 0; k < subTrunks.length; k++) {
                        this._computeSizesRecursive(subTrunks[k], sizes);
                    }
                }
            }
        }
    },
    
    //
    // Parse tiff structure (main entry point)
    //
    _parse: function(buffer) {
        'use strict';
        if (buffer) {
            // Read tiff header and set appropriate endianess
            var reader = new MD.BinaryReader(buffer);
            switch (reader.read16u()) {
                case MD.TIFF_LITTLE_ENDIAN: reader.endian = MD.LITTLE_ENDIAN; break;
                case MD.TIFF_BIG_ENDIAN: reader.endian = MD.BIG_ENDIAN; break;
                default: throw 'Invalid TIFF endian specifier';
            }
            // Store the native endianess of the tiff structure
            this._nativeEndian = reader.endian;
            // Verify the tiff magic value and parse the entire IFD tree (recursively)
            MD.check(reader.read16u() == MD.TIFF_MAGIC, 'Invalid TIFF magic number');
            reader.position = reader.read32u();
            this._tree = this._parseTree(reader);
        }
    },
    
    //
    // Parse IFD array (aka. IFD trunk) at the reader position
    //
    _parseTree: function(reader) {
        'use strict';
        // Loop through each IFD in the trunk
        var trunk = [];
        while (true) {
            // Create IFD structure
            var ifd = {
                tags: [],
                branches: {}
            };
            // Read and decode each tag in the IFD
            var tagsById = {};
            var tagCount = reader.read16u();
            for (var i = 0; i < tagCount; i++) {
                // Read raw tag data
                var id = reader.read16u();
                var type = reader.read16u();
                var count = reader.read32u();
                var nextPosition = reader.position + 4;
                var payloadSize = count * this._getTypeSize(type);
                if (payloadSize > 4) {
                    reader.position = reader.read32u();
                }
                var payload = reader.read(payloadSize);
                // Decode tag data and create deserialized tag structure
                var tag = {
                    id: id,
                    type: type,
                    data: this._parsePayload(payload, reader.endian, type, count)
                };
                tagsById[tag.id] = tag;
                ifd.tags.push(tag);
                // If the tag points to a sub-IFD, parse it and insert it as a 'branch' in the deserialized tree
                if (this._pointsToSubIfd(tag)) {
                    MD.check(tag.type == MD.TIFF_TYPE_LONG || tag.type == MD.TIFF_TYPE_IFD, 'Invalid tag type for sub IFD (' + tag.type + ')');
                    MD.check(!(tag.id in ifd.branches), 'Multiple sub IFDs with same parent ID (' + tag.id + ')');
                    // Note: Some sub-IFD pointer tags points to an array of sub-IFD positions
                    ifd.branches[tag.id] = [];
                    var offsets = (tag.data instanceof Array) ? tag.data : [tag.data];
                    for (var j = 0; j < offsets.length; j++) {
                        reader.position = offsets[j];
                        ifd.branches[tag.id].push(this._parseTree(reader));
                    }
                }
                reader.position = nextPosition;
            }
            // Extract known data payloads
            var offset = reader.read32u();
            ifd.data = this._extractData(reader, tagsById);
            // Store the deserialized IFD and move on to the next IFD in the trunk (or terminate if we've reached the end)
            trunk.push(ifd);
            if (offset === 0) {
                break;
            }
            reader.position = offset;
        }
        // Return the deserialized IFD array
        return trunk;
    },
    
    //
    // Extract known data payloads from the specified IFD ('tagsById')
    //
    _extractData: function(reader, tagsById) {
        'use strict';
        // Loop through all know data payload ID pairs
        var result = {};
        for (var i in MD.KNOWN_PAIRS) {
            var pair = MD.KNOWN_PAIRS[i];
            var tagPos = tagsById[pair.positionId];
            var tagLen = tagsById[pair.lengthId];
            // Verify we don't have any broken pairs
            MD.check((tagPos && tagLen) || (!tagPos && !tagLen), 'Missing one tag in data tag-pair');
            if (tagPos && tagLen) {
                // If the pair is present, do some sanity
                MD.check(tagPos.type == MD.TIFF_TYPE_LONG, 'Invalid tag type for position tag');
                MD.check(tagLen.type == MD.TIFF_TYPE_LONG || tagLen.type == MD.TIFF_TYPE_SHORT || tagLen.type == MD.TIFF_TYPE_BYTE, 'Invalid tag type for length tag');
                var positions = (tagPos.data instanceof Array) ? tagPos.data : [tagPos.data];
                var lengths = (tagLen.data instanceof Array) ? tagLen.data : [tagLen.data];
                MD.check(positions.length == lengths.length, 'Inconsistent data pair list length');
                // Extract data payload
                var dataList = [];
                for (var j = 0; j < positions.length; j++) {
                    reader.position = positions[j];
                    dataList.push(reader.read(lengths[j]));
                }
                // Store data payload
                result[i] = {
                    positionId: pair.positionId,
                    lengthId: pair.lengthId,
                    data: dataList
                };
            }
        }
        // Return data payload array
        return result;
    },
    
    //
    // Parse tag payload data
    //
    _parsePayload: function(payload, endian, type, count) {
        'use strict';
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
                return reader.readGeneric('getUint16', 2, 1, count);
            case MD.TIFF_TYPE_SSHORT:
                return reader.readGeneric('getInt16', 2, 1, count);
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
    
    //
    // Returns true if the specified tag points to a sub-IFD, otherwise false
    //
    _pointsToSubIfd: function(tag) {
        'use strict';
        if (tag.type == MD.TIFF_TYPE_IFD) {
            return true;
        }
        for (var i in MD.KNOWN_SUBIFDS) {
            if (tag.id == MD.KNOWN_SUBIFDS[i]) {
                MD.check(tag.type == MD.TIFF_TYPE_LONG, 'Invalid sub IFD data type');
                return true;
            }
        }
        return false;
    },
    
    //
    // Get the size (in bytes) for the given tiff type
    //
    _getTypeSize: function(type) {
        'use strict';
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
    
    //
    // Helper function for the tag address parser
    //
    _parsePathComponent: function(component) {
        'use strict';
        var result, match = /(\w+)\[(\d+)\]/.exec(component);
        MD.check(match, 'Invalid path component: ' + component);
        result = {
            name: match[1],
            index: parseInt(match[2])
        };
        return result;
    },
    
    //
    // Get the tag-array that matches the specified path. If the 'create' flag
    // is set to true the function will create the internal structures required to 
    // match the path (if they do not already exist)
    //
    _getTagsByPath: function(path, create) {
        var ifd = this._getIfdByPath(path, create);
        return ifd ? ifd.tags : undefined;
    },
    
    //
    // Get the IFD that matches the specified path. If the 'create' flag
    // is set to true the function will create the internal structures required to 
    // match the path (if they do not already exist)
    //
    _getIfdByPath: function(path, create) {
        'use strict';
        // Basic sanity check and path splitting
        MD.check(path && path.startsWith('/'), 'Invalid path: ' + path);
        var components = path.split('/');
        var trunk = this._tree;
        var j, ifd = null;
        // Loop through all path components and navigate the tree accordingly
        for (var i = 1; i < components.length; i++) {
            var component = components[i].trim().toLowerCase();
            var data = this._parsePathComponent(component);
            if (i % 2 == 1) {
                // Odd compoents are IFDs
                MD.check(data.name == 'ifd', 'Invalid component (' + component + ') expected "ifd"');
                if (data.index >= trunk.length) {
                    if (create) {
                        for (j = trunk.length; j <= data.index; j++) {
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
                // Even components are sub IFD pointers
                var id;
                if (data.name in MD.KNOWN_SUBIFDS) {
                    // Check if the sub IFD is adressed via its human-readable name
                    id = MD.KNOWN_SUBIFDS[data.name];
                } else {
                    // ... otherwise use the numeric tag ID value
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
                        for (j = ifd.branches[id].length; j <= data.index; j++) {
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
        MD.check(ifd, 'Invalid path: ' + path + ', last component must be "ifd[N]" where N is an integer >= 0');
        return ifd;
    },
    
    //
    // Helper function for (recursively) enumerating the entire tiff tree
    //
    _enumerateRecursive: function(trunk, path, callback) {
        'use strict';
        // Loop through the IFDs in the trunk
        for (var i = 0; i < trunk.length; i++) {
            var newPath = path + '/ifd[' + i + ']';
            var j, ifd = trunk[i];
            callback(newPath, ifd);
            // Enumerate branches recursively
            for (j in ifd.branches) {
                if (ifd.branches.hasOwnProperty(j)) {
                    var subTrunks = ifd.branches[j];
                    var branchName = j.toString();
                    for (var name in MD.KNOWN_SUBIFDS) {
                        if (MD.KNOWN_SUBIFDS[name] == j) {
                            branchName = name;
                            break;
                        }
                    }
                    for (var k = 0; k < subTrunks.length; k++) {
                        this._enumerateRecursive(subTrunks[k], newPath + '/' + branchName + '[' + k + ']', callback);
                    }
                }
            }
        }
    },
    
    //
    // Remove tag with 'id' in the list of 'tags'
    //
    _removeTag: function(tags, id) {
        'use strict';
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
    }
};

//
// Photoshop resource codec class
//
MD.PhotoshopResource = function(buffer) {
    'use strict';
    this._tags = [];
    this._parse(buffer);
};

MD.PhotoshopResource.prototype = {
    
    //
    // PUBLIC METHODS
    //
    
    constructor: MD.PhotoshopResource,
    
    //
    // Get tag with specified ID
    //
    getTag: function(id) {
        'use strict';
        for (var i = 0; i < this._tags.length; i++) {
            var tag = this._tags[i];
            if (tag.id == id) {
                return tag;
            }
        }
        return undefined;
    },
    
    //
    // Set tag (will overwrite if tag already exists)
    //
    setTag: function(tag) {
        'use strict';
        // TODO
    },
    
    //
    // Serialize (save) Photoshop 3.0 format
    //
    save: function() {
        'use strict';
        var i, size = 0;
        for (i = 0; i < this._tags.length; i++) {
            var tag = this._tags[i];
            var nameLength = tag.name.length + 1;
            nameLength += (nameLength % 2);
            var dataLength = tag.data.byteLength;
            dataLength += (dataLength % 2);
            size += 4 + 2 + nameLength + 4 + dataLength; 
        }
        var result = new ArrayBuffer(size);
        var writer = new MD.BinaryWriter(result, MD.BIG_ENDIAN);
        for (i = 0; i< this._tags.length; i++) {
            var tag = this._tags[i];
            writer.write32u(MD.PHOTOSHOP_8BIM);
            writer.write16u(tag.id);
            this._writePascalString(writer, tag.name);
            writer.write32u(tag.data.byteLength);
            if (tag.data.byteLength % 2 == 1) {
                writer.write8u(0);
            }
        }
        return result;
    },
    
    //
    // PRIVATE METHODS
    //
    
    //
    // Write pascal string
    //
    _writePascalString: function(writer, str) {
        'use strict';
        MD.check(str.length <= 255, 'String is too long, it can not be represented as a Pascal string');
        writer.write8u(str.length);
        for (var i = 0; i < str.length; i++) {
            writer.write8u(str.charCodeAt(i));
        }
        if (str.length + 1 % 2 == 1) {
            writer.write8u(0); // Note: Padding
        }
    },
    
    //
    // Read pascal string
    //
    _readPascalString: function(reader) {
        'use strict';
        var len = reader.read8u();
        var ascii = reader.readGeneric('getUint8', 1, 1, len);
        if ((len + 1) % 2 == 1) {
            reader.read8u(); // Note: Padding
        }
        return String.fromCharCode.apply(null, ascii);  
    },
    
    //
    // Parse (deserialize) Photoshop 3.0 format
    //
    _parse: function(buffer) {
        'use strict';
        var reader = new MD.BinaryReader(buffer, MD.BIG_ENDIAN);
        while (reader.position < buffer.byteLength) {
            MD.check(reader.read32u() == MD.PHOTOSHOP_8BIM, 'Invalid 8BIM signature');
            var id = reader.read16u();
            var name = this._readPascalString(reader);
            var size = reader.read32u();
            var data = reader.read(size);
            reader.position += (size % 2);
            this._tags.push({
                id: id,
                name: name,
                data: data
            });
        }
    }
};