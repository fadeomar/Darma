const ICO_HEADER_SIZE = 6;
const ICO_DIRECTORY_SIZE = 16;

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

export async function createIcoFromPngs(pngs: Array<{ size: number; blob: Blob }>): Promise<Blob> {
  const sorted = [...pngs].sort((a, b) => a.size - b.size);
  const pngBuffers = await Promise.all(sorted.map(async (item) => ({ ...item, bytes: toUint8Array(await item.blob.arrayBuffer()) })));
  const directoryOffset = ICO_HEADER_SIZE;
  let imageOffset = ICO_HEADER_SIZE + pngBuffers.length * ICO_DIRECTORY_SIZE;
  const totalLength = imageOffset + pngBuffers.reduce((sum, item) => sum + item.bytes.length, 0);
  const output = new Uint8Array(totalLength);
  const view = new DataView(output.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngBuffers.length, true);

  pngBuffers.forEach((item, index) => {
    const entryOffset = directoryOffset + index * ICO_DIRECTORY_SIZE;
    const sizeByte = item.size >= 256 ? 0 : item.size;
    view.setUint8(entryOffset, sizeByte);
    view.setUint8(entryOffset + 1, sizeByte);
    view.setUint8(entryOffset + 2, 0);
    view.setUint8(entryOffset + 3, 0);
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, item.bytes.length, true);
    view.setUint32(entryOffset + 12, imageOffset, true);
    output.set(item.bytes, imageOffset);
    imageOffset += item.bytes.length;
  });

  return new Blob([output], { type: "image/x-icon" });
}
