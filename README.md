# metadata.js examples

Get the camera model name from a jpeg file:
```javascript
var jpeg = new MD.JpegResource(jpegArrayBuffer);
if (jpeg.exifBuffer) {
  var exif = new MD.TiffResource(jpeg.exifBuffer);
  var cameraModelTag = exif.getTag('/ifd[0]', 0x0110);
  if (cameraModelTag) {
    console.log(cameraModelTag.data);
  }
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
if (jpeg.exifBuffer) {
  var exif = new MD.TiffResource(jpeg.exifBuffer);
  var allTags = exif.enumerateTags();
  for (var i = 0; i < allTags.length; i++) {
    var entry = allTags[i];
    console.log('Path    : ' + entry.path);
    console.log('Tag ID  : 0x' + entry.tag.id.toString(16));
    console.log('Tag type: ' + entry.tag.type);
    console.log('Tag data: ' + entry.tag.data);
  }
}
```  

Change the 'Software' tag in a jpeg file:
```javascript
var jpeg = new MD.JpegResource(jpegArrayBuffer);
var exif = new MD.TiffResource(jpeg.exifBuffer);
exif.addTag({
  id: 0x0131,
  type: MD.TIFF_TYPE_ASCII,
  data: 'My custom software'
});
jpeg.exifBuffer = exif.save();
var result = jpeg.save();
```

