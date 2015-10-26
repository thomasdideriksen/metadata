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

In order to navigate this IFD structure and extract/insert tags in specific IFDs, metadata.js provides a simple, string-based format for adressing IFDs. For example, if you want to extract the [exposure time](http://www.awaresystems.be/imaging/tiff/tifftags/privateifd/exif/exposuretime.html) tag, you would use the following IFD path.

```javascript
var tag = exif.getTag('/ifd[0]/exif[0]/ifd[0]', 0x829a);
```

This scheme extends to arbitrarily complex IFD trees. As an example, consider the following structure.

![alt text](https://www.dropbox.com/s/8wzwlp7cxjh5dd8/complex.png?raw=1)

In this case you can obtain the blue tag, using the following IFD path.

```javascript
var tag = exif.getTag('/ifd[0]/subifds[1]/ifd[1]/subifds[0]/ifd[0]', 0xff0a);
```

You can get a complete list of all the tags in a file, including their IFD paths, by using the *enumerateTags* method.

# documentation

##*JpegResource*
Jpeg serializer/deserializer
####constructor
```javascript
new MD.JpegResource(buffer);
```
*buffer* is an ArrayBuffer containing a jpeg image

####properties
|property name                               |description|
|:-------------------------------------------|:----------|
|*MD.JpegResource.prototype.exifBuffer*      | An ArrayBuffer containing the EXIF block of the jpeg image. This property is read/write. |
|*MD.JpegResource.prototype.thumbnailBuffer* | An ArrayBuffer containing the embedded thumbnail of the jpeg image. This property is read-only. |
|*MD.JpegResource.prototype.iccProfileBuffer*| An ArrayBuffer containing the embedded ICC profile of the jpeg image. This property is read/write. |
|*MD.JpegResource.prototype.photoshopBuffer* | An ArrayBuffer containing the Photoshop/8BIM metadata block of the jpeg image. This property is read/write. |

####methods
|method name|description|
|:------------|:----------|
|*MD.JpegResource.prototype.save()*| This function returns an ArrayBuffer containing the jpeg image, including all changes made to the various metadata sections. |

##*TiffResource*
Tiff/EXIF serializer/deserializer

####constructor
```javascript
new MD.TiffResource(buffer);
```
*buffer* is an ArrayBuffer containing an EXIF structure or a tiff image. Note that *buffer* is optional - if nothing is passed into the constructor, an empty TIFF structure will be created.
####methods
|method name|description|
|:------------|:----------|
|*MD.TiffResource.prototype.enumerateTags()*| Returns an array containing all tags in the TIFF resource. Individual entries in the list contains the tag itself, but also the corresponding IFD path.
|*MD.TiffResource.prototype.getTags(path)*| Get all tags in the IFD that corresponds to *path* |
|*MD.TiffResource.prototype.getTag(path, id)*| Get the tag with *id* from the IDS that corresponds to *path*  |
|*MD.TiffResource.prototype.setTag(path, tag)*| Set the *tag* in the IFD that corresponds to *path*. If the IFD and tag already exists, it will be overwritten. |
|*MD.TiffResource.prototype.removeTag(path, id)*| Remove tag with specified *id* fro the IFD that corresponds to *path* |
|*MD.TiffResource.prototype.enumerateData()*| Return an array of all the named data payloads in the TIFF resource. Individual entries in the list contains the data itself, but also the corresponding IFD path and data-name |
|*MD.TiffResource.prototype.getData(path, name)*| Get the named data payload with *name* from the IFD corresponding to *path*  |
|*MD.TiffResource.prototype.setData(path, name, data)*| Set the named data payload with *name* from the IFD corresponding to *path* to *data*. If the IFD and named data entry already exists it will be overwritten. |
|*MD.TiffResource.prototype.removeData(path, name)*| Remove named data with *name* from IFD corresponding to *path* |
|*MD.TiffResource.prototype.save(endian)*| This function returns an ArrayBuffer containing the binary TIFF/EXIF structure, including all changes made to the various tags and data payloads. The optional *endian* parameter may be used to set the endian of the binary result (allowed values are *MD.BIG_ENDIAN* or *MD.LITTLE_ENDIAN*) |
