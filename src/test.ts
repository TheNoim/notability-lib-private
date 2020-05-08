import { readFileSync } from 'fs';
import { NotabilitySession } from './lib/plist-loader';
import { dump } from 'dumper.js';
import {DrawInstructionArray, ImageMediaObject} from "./lib/INotabilitySession";
import {parseStringFloatArray} from "./lib/points";
import { writeFileSync } from 'fs';
import { join } from 'path';

// const sessionPath = join(__dirname, '../Skizzegalvanisches Element/Session.plist');
// const sessionPath = join(__dirname, '../Ellipse/Session.plist');
const sessionPath = join(__dirname, '../SimplePartialShape/Session.plist');

const bplistData = readFileSync(sessionPath);

const session = NotabilitySession.getNotabilitySession(bplistData);

const curves = session.getCoordinates();

// const color = session.getColorData();

// const test = session.getClassesForType('Figure');

// const [x] = session.getClassesForType<ImageMediaObject>("ImageMediaObject");
//
// const [u0, u1] = parseStringFloatArray(session.safeReferenceAccess(x.unscaledContentSize))
// const [o0, o1] = parseStringFloatArray(session.safeReferenceAccess(x.documentOrigin))
//
// const width = u0 - o0;
// const height = u1 - o1;

writeFileSync(join(__dirname, '../test/data.json'), JSON.stringify(session.getDrawInstructions(), undefined, 4));

debugger;
