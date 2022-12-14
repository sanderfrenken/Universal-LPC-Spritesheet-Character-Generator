const animationRowsLayout = {
  "thrust-n": 3,
  "thrust-w": 4,
  "thrust-s": 5,
  "thrust-e": 6,
  "slash-n": 11,
  "slash-w": 12,
  "slash-s": 13,
  "slash-e": 14
}

const customAnimations = {
  tool_rod: {
    frameSize: 128,
    frames: [
      ["thrust-n,0", "thrust-n,1", "thrust-n,2", "thrust-n,3", "thrust-n,4", "thrust-n,5", "thrust-n,4", "thrust-n,4", "thrust-n,4", "thrust-n,5", "thrust-n,4", "thrust-n,2", "thrust-n,3"],
      ["thrust-w,0", "thrust-w,1", "thrust-w,2", "thrust-w,3", "thrust-w,4", "thrust-w,5", "thrust-w,4", "thrust-w,4", "thrust-w,4", "thrust-w,5", "thrust-w,4", "thrust-w,2", "thrust-w,3"],
      ["thrust-s,0", "thrust-s,1", "thrust-s,2", "thrust-s,3", "thrust-s,4", "thrust-s,5", "thrust-s,4", "thrust-s,4", "thrust-s,4", "thrust-s,5", "thrust-s,4", "thrust-s,2", "thrust-s,3"],
      ["thrust-e,0", "thrust-e,1", "thrust-e,2", "thrust-e,3", "thrust-e,4", "thrust-e,5", "thrust-e,4", "thrust-e,4", "thrust-e,4", "thrust-e,5", "thrust-e,4", "thrust-e,2", "thrust-e,3"],
    ]
  },
  tool_smash: {
    frameSize: 128,
    frames: [
      ["slash-n,0", "slash-n,1", "slash-n,2", "slash-n,3", "slash-n,4", "slash-n,5"],
      ["slash-w,0", "slash-w,1", "slash-w,2", "slash-w,3", "slash-w,4", "slash-w,5"],
      ["slash-s,0", "slash-s,1", "slash-s,2", "slash-s,3", "slash-s,4", "slash-s,5"],
      ["slash-e,0", "slash-e,1", "slash-e,2", "slash-e,3", "slash-e,4", "slash-e,5"]
    ]
  },
  thrust_oversize: {
    frameSize: 192,
    frames: [
      ["thrust-n,0", "thrust-n,1", "thrust-n,2", "thrust-n,3", "thrust-n,4", "thrust-n,5", "thrust-n,6", "thrust-n,7"],
      ["thrust-w,0", "thrust-w,1", "thrust-w,2", "thrust-w,3", "thrust-w,4", "thrust-w,5", "thrust-w,6", "thrust-w,7"],
      ["thrust-s,0", "thrust-s,1", "thrust-s,2", "thrust-s,3", "thrust-s,4", "thrust-s,5", "thrust-s,6", "thrust-s,7"],
      ["thrust-e,0", "thrust-e,1", "thrust-e,2", "thrust-e,3", "thrust-e,4", "thrust-e,5", "thrust-e,6", "thrust-e,7"]
    ]
  },
  slash_oversize: {
    frameSize: 192,
    frames: [
      ["slash-n,0", "slash-n,1", "slash-n,2", "slash-n,3", "slash-n,4", "slash-n,5"],
      ["slash-w,0", "slash-w,1", "slash-w,2", "slash-w,3", "slash-w,4", "slash-w,5"],
      ["slash-s,0", "slash-s,1", "slash-s,2", "slash-s,3", "slash-s,4", "slash-s,5"],
      ["slash-e,0", "slash-e,1", "slash-e,2", "slash-e,3", "slash-e,4", "slash-e,5"]
    ]
  },
  // For illustrative purposes only. Can be removed once we have a real "mirrored" usecase in the generator
  slash_oversize_mirror: {
    frameSize: 192,
    frames: [
      ["slash-n,0,mirrored", "slash-n,1,mirrored", "slash-n,2,mirrored", "slash-n,3,mirrored", "slash-n,4,mirrored", "slash-n,5,mirrored"],
      ["slash-w,0,mirrored", "slash-w,1,mirrored", "slash-w,2,mirrored", "slash-w,3,mirrored", "slash-w,4,mirrored", "slash-w,5,mirrored"],
      ["slash-s,0", "slash-s,1", "slash-s,2", "slash-s,3", "slash-s,4", "slash-s,5"],
      ["slash-e,0", "slash-e,1", "slash-e,2", "slash-e,3", "slash-e,4", "slash-e,5"]
    ]
  }
}