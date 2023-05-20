export const overlay =
  (x, offset) =>
    xs =>
      xs.substring(0, offset[0]) + x + xs.substring(offset[1])
