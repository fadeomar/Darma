import type { GeneratedAsset } from "./types";

type ZipEntry = {
  name: string;
  bytes: Uint8Array;
  crc32: number;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeName(name: string): Uint8Array {
  return new TextEncoder().encode(name.replace(/^\/+/, ""));
}

function dosTime(date: Date) {
  return ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f);
}

function dosDate(date: Date) {
  return (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f);
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

async function assetToEntry(asset: GeneratedAsset): Promise<ZipEntry> {
  const bytes = new Uint8Array(await asset.blob.arrayBuffer());
  return { name: asset.filename, bytes, crc32: crc32(bytes) };
}

export async function createZipArchive(assets: GeneratedAsset[]): Promise<Blob> {
  const entries = await Promise.all(assets.map(assetToEntry));
  const now = new Date();
  const time = dosTime(now);
  const date = dosDate(now);
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  entries.forEach((entry) => {
    const nameBytes = encodeName(entry.name);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0x0800);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, time);
    writeUint16(localView, 12, date);
    writeUint32(localView, 14, entry.crc32);
    writeUint32(localView, 18, entry.bytes.length);
    writeUint32(localView, 22, entry.bytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, entry.bytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0x0800);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, time);
    writeUint16(centralView, 14, date);
    writeUint32(centralView, 16, entry.crc32);
    writeUint32(centralView, 20, entry.bytes.length);
    writeUint32(centralView, 24, entry.bytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, localOffset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.length + entry.bytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, entries.length);
  writeUint16(endView, 10, entries.length);
  writeUint32(endView, 12, centralSize);
  writeUint32(endView, 16, localOffset);
  writeUint16(endView, 20, 0);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function readUint16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

export async function listZipFileNames(file: File): Promise<string[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const names: string[] = [];
  let offset = 0;
  const decoder = new TextDecoder();

  while (offset + 30 <= bytes.length) {
    const signature = readUint32(view, offset);
    if (signature !== 0x04034b50) break;
    const compressedSize = readUint32(view, offset + 18);
    const nameLength = readUint16(view, offset + 26);
    const extraLength = readUint16(view, offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > bytes.length) break;
    names.push(decoder.decode(bytes.slice(nameStart, nameEnd)));
    offset = nameEnd + extraLength + compressedSize;
  }

  return names;
}
