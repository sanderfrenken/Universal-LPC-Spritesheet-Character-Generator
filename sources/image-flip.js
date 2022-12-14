// Adapted from https://stackoverflow.com/questions/3129099/how-to-flip-images-horizontally-with-html5

function flipImageData(imageData, frameSize) {
  var imageFlip = new ImageData (frameSize, frameSize);
  var Npel = imageData.data.length / 4;
  for (var kPel = 0; kPel < Npel; kPel++) {
      var kFlip = flip_index (kPel, frameSize);
      var offset = 4 * kPel;
      var offsetFlip = 4 * kFlip;
      imageFlip.data[offsetFlip + 0] = imageData.data[offset + 0];
      imageFlip.data[offsetFlip + 1] = imageData.data[offset + 1];
      imageFlip.data[offsetFlip + 2] = imageData.data[offset + 2];
      imageFlip.data[offsetFlip + 3] = imageData.data[offset + 3];
  }
  return imageFlip;
}

function flip_index (kPel, width) {
  var i = Math.floor(kPel / width);
  var j = kPel % width;
  var jFlip = width - j - 1;
  var kFlip = i * width + jFlip;
  return kFlip;
}