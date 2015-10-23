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
  console.log('Path    : ' + entry.path);
  console.log('Tag ID  : 0x' + entry.tag.id.toString(16));
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

