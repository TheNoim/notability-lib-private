import { readFileSync } from 'fs';
import { join } from 'path';
import { NotabilitySession } from './lib/plist-loader';
import { dump } from 'dumper.js';
import {ImageMediaObject} from "./lib/INotabilitySession";
import {parseStringFloatArray} from "./lib/points";

const sessionPath = join(__dirname, '../Test Bild File/Session.plist');

const bplistData = readFileSync(sessionPath);

const session = NotabilitySession.getNotabilitySession(bplistData);

const curves = session.getCoordinates();

// const color = session.getColorData();

// const test = session.getClassesForType('Figure');

const [x] = session.getClassesForType<ImageMediaObject>("ImageMediaObject");

const [u0, u1] = parseStringFloatArray(session.safeReferenceAccess(x.unscaledContentSize))
const [o0, o1] = parseStringFloatArray(session.safeReferenceAccess(x.documentOrigin))

const width = u0 - o0;
const height = u1 - o1;

debugger;
