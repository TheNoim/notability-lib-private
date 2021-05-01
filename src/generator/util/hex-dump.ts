import hex = require('browser-hex');
import {writeFileSync} from "fs";
import {join} from 'path';

export function hexDump(buffer: Buffer, name: string) {
    const targetNumber = new Date().getTime();
    const targetFile = join(join(__dirname, '../../dumps/'), `${name}-${targetNumber}.bin`);
    writeFileSync(targetFile, buffer);
    console.log('Dump: ' + targetFile);
    const hexStr = hex(buffer);
    console.log(hexStr);
}
