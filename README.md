# metadata.js

Metadata.js is a compact, self-contained Javascript library for reading and writing image metadata. The library currently supports:

* JPEG and TIFF images (including TIFF derivatives such as DNG, NEF, etc.)
* EXIF metadata
* Photoshop/8BIM metadata
* Embedded thumbnails
* Embedded ICC profiles

The library operates on data in-memory, specifically using [ArrayBuffers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).


# code examples

Get the camera [model](http://www.awaresystems.be/imaging/tiff/tifftags/model.html) name from a jpeg file:
```javascript
var jpeg = new MD.JpegResource(jpegArrayBuffer);
var exif = new MD.TiffResource(jpeg.exifBuffer);
var cameraModelTag = exif.getTag('/ifd[0]', 0x0110);
if (cameraModelTag) {
  console.log(cameraModelTag.data);
}
```

Extract and show the embedded thumbnail from a jpeg file:
```javascript
var jpeg = new MD.JpegResource(jpegArrayBuffer);
if (jpeg.thumbnailBuffer) {
  var im = document.createElement('img');
  im.src = MD.toDataURL(jpeg.thumbnailBuffer, 'image/jpeg');
  document.body.appendChild(im);
}
```

Enumerate all EXIF tags in a jpeg file:
```javascript
var jpeg = new MD.JpegResource(jpegArrayBuffer);
var exif = new MD.TiffResource(jpeg.exifBuffer);
var allTags = exif.enumerateTags();
for (var i = 0; i < allTags.length; i++) {
  var entry = allTags[i];
  console.log('Path: ' + entry.path);
  console.log('Tag ID: 0x' + entry.tag.id.toString(16));
  console.log('Tag type: ' + entry.tag.type);
  console.log('Tag data: ' + entry.tag.data);
}
```  

Set the [software](http://www.awaresystems.be/imaging/tiff/tifftags/software.html) tag in a jpeg file and save the result:
```javascript
var jpeg = new MD.JpegResource(jpegArrayBuffer);
var exif = new MD.TiffResource(jpeg.exifBuffer);
exif.setTag('/ifd[0]', {
  id: 0x0131,
  type: MD.TIFF_TYPE_ASCII,
  data: 'My custom software'
});
jpeg.exifBuffer = exif.save();
var result = jpeg.save();
```

# navigating the tag tree

The TIFF/EXIF format is made up of multiple individual tags, each carrying a specific data payload such as camera name, time of capture, exposure time, etc. These tags are contained in lists called IFDs (Image File Directories). A single TIFF/EXIF block typically contains multiple IFDs, organized in a tree-like structure. For example, a typical EXIF block in a JPEG file has the following IFD structure.

![alt text](https://www.dropbox.com/s/4c5byfv4hv4kpx5/jpeg.png?raw=1)

In order to navigate this IFD structure and extract/insert tags in specific IFDs, metadata.js provides a simple, string-based address format. For example, if you want to extract the [exposure time](http://www.awaresystems.be/imaging/tiff/tifftags/privateifd/exif/exposuretime.html) tag, you would use the following address.

```javascript
var tag = exif.getTag('/ifd[0]/exif[0]/ifd[0]', 0x829a);
```

# documentation

##*JpegResource*
Jpeg serializer/deserializer
####constructor
```javascript
new MD.JpegResource(buffer);
```
*buffer* is an ArrayBuffer containing a jpeg image

####properties
*MD.JpegResource.prototype.exifBuffer*

*MD.JpegResource.prototype.thumbnailBuffer*

*MD.JpegResource.prototype.iccProfileBuffer*

*MD.JpegResource.prototype.photoshopBuffer*

####methods
*MD.JpegResource.prototype.save()*

##*TiffResource*
Tiff/EXIF serializer/deserializer

####constructor
```javascript
new MD.TiffResource(buffer);
```
*buffer* is an ArrayBuffer containing an EXIF structure or a tiff image
####methods
*MD.TiffResource.prototype.enumerateTags()*

*MD.TiffResource.prototype.getTags(path)*

*MD.TiffResource.prototype.getTag(path, id)*

*MD.TiffResource.prototype.setTag(path, tag)*

*MD.TiffResource.prototype.removeTag(path, id)*

*MD.TiffResource.prototype.enumerateData()*

*MD.TiffResource.prototype.getData(path, name)*

*MD.TiffResource.prototype.setData(path, name, data)*

*MD.TiffResource.prototype.removeData(path, name)*

*MD.TiffResource.prototype.save(endian)*
