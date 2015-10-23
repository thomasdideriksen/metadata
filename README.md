# metadata

Example of how do get the camera model name from the EXIF metadata block:
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
