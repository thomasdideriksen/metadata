# metadata

Example of how to get the camera model name from a jpeg file:
```
var jpeg = new MD.JpegResource(jpegArrayBuffer);
if (jpeg.exif) {
  var exif = new MD.TiffResource(jpeg.exif);
  var cameraModelTag = exif.getTag('/ifd[0]', 0x0110);
  if (cameraModelTag) {
    console.log(cameraModelTag.data);
  }
}
```
