/**
 * Infinity Claude AI — Zip Utils
 * Cria arquivos ZIP diretamente no navegador sem dependências pesadas externas.
 */
(function () {
  'use strict';

  const ZipUtils = {
    crcTable: null,
    makeCRCTable() {
      if (this.crcTable) return this.crcTable;
      const c = [];
      for (let n = 0; n < 256; n++) {
        let curr = n;
        for (let k = 0; k < 8; k++) {
          curr = (curr & 1) ? (0xedb88320 ^ (curr >>> 1)) : (curr >>> 1);
        }
        c[n] = curr;
      }
      this.crcTable = c;
      return c;
    },

    crc32(bytes) {
      const table = this.makeCRCTable();
      let crc = 0 ^ (-1);
      for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xff];
      }
      return (crc ^ (-1)) >>> 0;
    },

    stringToBytes(str) {
      return new TextEncoder().encode(str);
    },

    writeUint16LE(val) {
      return new Uint8Array([val & 0xff, (val >> 8) & 0xff]);
    },

    writeUint32LE(val) {
      return new Uint8Array([val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff]);
    },

    concat(...arrays) {
      const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
      const res = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of arrays) {
        res.set(arr, offset);
        offset += arr.length;
      }
      return res;
    },

    dateToDos(d) {
      const date = d || new Date();
      const time = (date.getSeconds() >> 1) | (date.getMinutes() << 5) | (date.getHours() << 11);
      const dosDate = date.getDate() | ((date.getMonth() + 1) << 5) | ((date.getFullYear() - 1980) << 9);
      return { time, date: dosDate };
    },

    async createZip(files) {
      const fileRecords = [];
      const centralDirectoryRecords = [];
      let offset = 0;
      const dosDateTime = this.dateToDos(new Date());

      for (const file of files) {
        const nameBytes = this.stringToBytes(file.name || file.path || 'file.txt');
        let contentBytes;
        if (file.content instanceof Uint8Array) {
          contentBytes = file.content;
        } else if (typeof file.content === 'string') {
          contentBytes = this.stringToBytes(file.content);
        } else {
          contentBytes = new Uint8Array(0);
        }

        const crc = this.crc32(contentBytes);
        const size = contentBytes.length;

        // Local file header
        const localHeader = this.concat(
          new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
          this.writeUint16LE(20), // version needed
          this.writeUint16LE(0), // general flag
          this.writeUint16LE(0), // compression method (stored)
          this.writeUint16LE(dosDateTime.time),
          this.writeUint16LE(dosDateTime.date),
          this.writeUint32LE(crc),
          this.writeUint32LE(size), // compressed size
          this.writeUint32LE(size), // uncompressed size
          this.writeUint16LE(nameBytes.length),
          this.writeUint16LE(0), // extra field length
          nameBytes,
          contentBytes
        );

        fileRecords.push(localHeader);

        // Central directory header
        const cdHeader = this.concat(
          new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
          this.writeUint16LE(20), // version made by
          this.writeUint16LE(20), // version needed
          this.writeUint16LE(0),
          this.writeUint16LE(0),
          this.writeUint16LE(dosDateTime.time),
          this.writeUint16LE(dosDateTime.date),
          this.writeUint32LE(crc),
          this.writeUint32LE(size),
          this.writeUint32LE(size),
          this.writeUint16LE(nameBytes.length),
          this.writeUint16LE(0),
          this.writeUint16LE(0),
          this.writeUint16LE(0),
          this.writeUint16LE(0),
          this.writeUint32LE(0),
          this.writeUint32LE(offset),
          nameBytes
        );

        centralDirectoryRecords.push(cdHeader);
        offset += localHeader.length;
      }

      const cdSize = centralDirectoryRecords.reduce((acc, curr) => acc + curr.length, 0);
      const cdOffset = offset;

      // End of central directory record
      const eocd = this.concat(
        new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
        this.writeUint16LE(0),
        this.writeUint16LE(0),
        this.writeUint16LE(files.length),
        this.writeUint16LE(files.length),
        this.writeUint32LE(cdSize),
        this.writeUint32LE(cdOffset),
        this.writeUint16LE(0)
      );

      const zipBytes = this.concat(...fileRecords, ...centralDirectoryRecords, eocd);
      return new Blob([zipBytes], { type: 'application/zip' });
    },

    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "project.zip";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 5000);
    }
  };

  if (typeof self !== 'undefined') self.ZipUtils = ZipUtils;
  if (typeof window !== 'undefined') window.ZipUtils = ZipUtils;
})();
