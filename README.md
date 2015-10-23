# metadata

Example of how to get the camera model name from a jpeg file:
```
var jpeg = new MD.JpegResource(jpegArrayBuffer);
if (jpeg.exifBuffer) {
  var exif = new MD.TiffResource(jpeg.exifBuffer);
  var cameraModelTag = exif.getTag('/ifd[0]', 0x0110);
  if (cameraModelTag) {
    console.log(cameraModelTag.data);
  }
}
```

Example of how to extract and show the embedded thumbnail from a jpeg file:
```
var jpeg = new MD.JpegResource(jpegArrayBuffer);
if (jpeg.thumbnailBuffer) {
  var im = document.createElement('img');
  im.src = MD.toDataURL(jpeg.thumbnailBuffer, 'image/jpeg');
  document.body.appendChild(im);
}
```
