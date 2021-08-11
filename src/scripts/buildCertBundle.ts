import fs from 'fs';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Certificate as Cert } from '@fidm/x509';

// This should scrape all cert URLs and build a trusted cert bundle
console.log("Grabbing certificates");

type Subject = {
    C: string
    O: string
    OU: string
    CN: string
    L?: string
}

type Certificate = {
    ident: string,
    subject: Subject
    issuer: Subject
    validFrom: string
    validTo: string
}
export type PublicKey = {
    issuer: string
    kid: string
    x: string
    y: string
    fromUrl: string
    certificate: Certificate | null
}
type Issuer = {
    keys: {
        [key: string] : PublicKey   
    }
}
export type IssuersMap = {
    [key: string]: Issuer
}

async function importEUCertsFromSwedishUrl(all: IssuersMap) {
    const url = 'https://dgcg.covidbevis.se/tp/trust-list';
    const result = await axios({
        url
    });
    if (result.status === 200) {
        // OK
        const decoded = jwt.decode(result.data, {complete:true});
        if (decoded) {
            // console.log("Decoded", decoded);
            const issuers = Object.keys(decoded.payload.dsc_trust_list);
            for (let j=0; j<issuers.length; j++) {
                const issuer = issuers[j];
                const certs = decoded.payload.dsc_trust_list[issuer];

                for (let k=0; k<certs.keys.length; k++) {
                    const key = certs.keys[k];

                    if (!("kid" in key)) {
                        console.warn("KEY", key);
                        throw new Error("Missing kid in key from " + issuer);
                    }
                    if (!("kty" in key)) {
                        console.warn("KEY", key);
                        throw new Error("Missing kty (key type) in key from " + issuer);
                    }
                    // console.log(issuer, Object.keys(key), key.kty, key["x5t#S256"], key.kid);

                    // TODO Fix importing public key from cert at key.x5c
                    /*
                    if (!("x" in key)) {
                        console.warn("KEY", key);
                        throw new Error("Missing x in key from " + issuer);
                    }
                    if (!("y" in key)) {
                        console.warn("KEY", key);
                        throw new Error("Missing y in key from " + issuer);
                    }
                    */

                    // For now, just ignore if it is not the x and y component format
                    if (key.kty === "EC" && "x" in key && "y" in key) {

                        const kid = key.kid;
                        const x = key.x;
                        const y = key.y;

                        // Also decode certificate here in to components for: subject, issuer, issuedAt, expiresAt, sha256
                        let certificate = null as null | Certificate;
                        if (key.x5c) {
                            certificate = decodeCertificateToComponents(key.x5c);

                            // Certificate Subject & Issuer countries should match the issuer code here
                            if (certificate.subject.C !== issuer) {
                                throw new Error("Certificate subject country " + certificate.subject.C + " does not match current importing issuer " + issuer);
                            }
                            if (certificate.issuer.C !== issuer) {
                                throw new Error("Certificate issuer country " + certificate.subject.C + " does not match current importing issuer " + issuer);
                            }
                        }

                        if (!(issuer in all)) {
                            all[issuer] = {
                                keys: {}
                            }
                        }

                        all[issuer].keys[kid] = {
                            issuer,
                            kid,
                            x,
                            y,
                            fromUrl: url,
                            certificate,
                        };
                    } else if ("x5c" in key) {
                        // TODO Attempt to support this
                        // Ignoring this for now since I am not sure how to use an RSA publicKey to validate a COSE signature
                        // Perhaps just inputting it in to the key value of the cose verifier
                        // But I don't have a valid Lithuanian certificate, so have nothing to test with
                        /*
                        const pieces = Cert.fromPEM(Buffer.from("-----BEGIN CERTIFICATE-----\n" + key.x5c + "\n-----END CERTIFICATE-----"));
                        console.log("Public Key", pieces.publicKey.toASN1().DER.toString("base64"));
                        const components = decodePublicKeyComponents(pieces.publicKey.toASN1().DER.toString("base64"));
                        console.log("Components", components);
                        process.exit(1);
                        */
                       // Ignoring for now
                    
                    } else {
                        console.warn("Missing x or y component in key from " + issuer);
                    }
                }
                // console.log("CERTS", issuer, certs);
            }
        } else {
            console.warn(result.data);
            throw new Error("Could not decode JWT");
        }
    } else {
        throw new Error("Non 200 response from: " + url);
    }

}

const decodeCertificateToComponents = (cert: string) : Certificate => {
    const pieces = Cert.fromPEM(Buffer.from("-----BEGIN CERTIFICATE-----\n" + cert + "\n-----END CERTIFICATE-----"));
    /* if (pieces.subject.countryName === "SE") {
        console.log(pieces);
        process.exit(1);    
    } */
    return {
        ident: pieces.subjectKeyIdentifier,
        subject: {
            C: pieces.subject.countryName,
            O: pieces.subject.organizationName,
            OU: pieces.subject.organizationalUnitName,
            CN: pieces.subject.commonName,
            L: pieces.subject.localityName,
        },
        issuer: {
            C: pieces.issuer.countryName,
            O: pieces.issuer.organizationName,
            OU: pieces.issuer.organizationalUnitName,
            CN: pieces.issuer.commonName,
            L: pieces.issuer.localityName,
        },
        validFrom: pieces.validFrom.toISOString(),
        validTo: pieces.validTo.toISOString(),
    }
}

const asn1Tree = require('asn1-tree');

const decodePublicKeyComponents = (publicKey: string) : {x:string, y:string} => {
    const realPublicKey = Buffer.from(publicKey, "base64");
    
    const decoded = asn1Tree.decode(realPublicKey);
    // Find the tagCode 3
    // 16.6 === <Buffer 2a 86 48 86 f7 0d 01 01 01> means RSA Public Key
    // 16.6 === <Buffer 2a 86 48 ce 3d 02 01> means X Y uncompressed components EC Public Key
    const tagCode16 = decoded.elements.find(t => t.tagCode === 16);
    if (tagCode16) {
        const tagCode166 = tagCode16.elements.find(t => t.tagCode === 6);
        if (tagCode166.value.toString("hex") === "2a8648ce3d0201") {
            // console.log("Uncompressed EC Public Key detected");

            const tagCode3 = decoded.elements.find(t => t.tagCode === 3);
            if (tagCode3) {
                // console.log("tagCode3", tagCode3);
                const buf = tagCode3.value as Buffer;
                const first = buf.readInt16BE(0);
                if (first === 4) {
                    const x = buf.slice(2,34);
                    const y = buf.slice(34);
                    // console.log("X", x.length, x);
                    // console.log("Y", y.length, y);
                    if (x.byteLength === 32 && y.byteLength === 32) {
                        return {
                            x: x.toString("base64"),
                            y: y.toString("base64"),
                        }
                    } else {
                        throw new Error("Incorrect key lengths found");
                    }
                } else {
                    throw new Error("First int was not equal to 4 (uncompressed format), cannot decode");
                }
            } else {
                throw new Error("Did not find tagCode 3 in ASN1/DER public key");
            }

        } else if (tagCode166.value.toString("hex") === "2a864886f70d010101") {
            console.log("RSA Public Key found.  This is not yet supported");
            throw new Error("Unsupported RSA Public Key Found");

        } else {
            console.warn(tagCode166.value.toString("hex"));
            throw new Error("Unknown value at tag 16.6 found");
        }
    } else {
        throw new Error("Did not find tagCode 16");
    }
}

async function importGBPublicKeys(all: IssuersMap) {
    const url = 'https://covid-status.service.nhsx.nhs.uk/pubkeys/keys.json';
    const result = await axios({
        url
    });
    if (result.status === 200) {
        // OK
        // console.log("Content", result.data);

        if (!("GB" in all)) {
            all.GB = {
                keys: {}
            };
        }
        for(let i=0; i<result.data.length; i++) {
            const key = result.data[i];
            const components = decodePublicKeyComponents(key.publicKey);
            all.GB.keys[key.kid] = {
                issuer: "GB",
                kid: key.kid,
                x: components.x,
                y: components.y,
                fromUrl: url,
                certificate: null,
            }
        }
    } else {
        throw new Error("Non 200 response from: " + url);
    }
}

(async () => {
    const issuers: IssuersMap = {}
    await importEUCertsFromSwedishUrl(issuers);
    await importGBPublicKeys(issuers);
    // console.log("FINAL", JSON.stringify(issuers, null, 4));

    console.log("---");
    console.log(Object.keys(issuers).length + " issuers imported");

    let keyCount = 0;
    let certCount = 0;
    Object.values(issuers).forEach(iss => {
        Object.values(iss.keys).forEach(pk => {
            keyCount++;
            if (pk.certificate) {
                certCount++;
            }
        })
    })
    console.log(keyCount + " keys imported");
    console.log(certCount + " certificates imported");
    console.log("---");
    
    const allData = {
        stats: {
            numKeys: keyCount,
            numIssuers: Object.keys(issuers).length,
            buildTime: (new Date()).toISOString(),
        },
        issuers
    }

    fs.writeFileSync(__dirname + "/../compiled/certs.json", JSON.stringify(allData, null, 4));
    console.log("Finished writing file");
})();
