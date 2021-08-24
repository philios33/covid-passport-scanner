
import { KeysMap, PublicKey } from '../scripts/buildCertBundle';
import base45 from 'base45';
// import cbor from 'cbor-web';
import zlib from 'browserify-zlib';
import cose from 'cose-js';
// import moment from 'moment-mini';
import { isValidDate, calculateAge, calculateDaysSince, calculateDaysUntil } from './date';

const cbor = require('cbor-web')

export class CertificateDecodingError extends Error {
    code: string;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

type HealthClaims = {
    version: string,
    names: Names,
    dob: PartialDateOfBirth,
    certificate: VaccineCertificate,
}

function decodeCode(code: string, validMappings: {[key: string]: string}) : null | string {
    if (code in validMappings) {
        return validMappings[code];
    } else {
        // Not found in our list
        // Not necessarily a certificate problem, we just don't know what this maps to
        return null;
    }
}

export function decodeSignatureErrorCode(code: string) {
    if (code === "SIGNING_CERTIFICATE_FUTURE_VALID") {
        return "The signing certificate is not valid yet.";

    } else if (code === "SIGNING_CERTIFICATE_EXPIRED") {
        return "The signing certificate has expired.";

    } else if (code === "INVALID_SIGNATURE") {
        return "This certificate is not signed properly with a trusted authority."

    } else if (code === "KEY_NOT_FOUND") {
        return "The public key used to sign this certificate is unknown so we cannot validate it.  This could be because it is a recently expired key, or a recently new key which this website has yet to import."

    /*
    } else if (code === "ISSUER_NOT_FOUND") {
        return "The issuer that signed this certificate is unknown so we cannot validate it."
        */

    } else {
        return "BUG: Unknown error message.";
    }
}

function decodeTargettedAgent(code: string) {
    const validMappings = {
        "840539006": "COVID-19"
    }
    return decodeCode(code, validMappings);
}

function decodeVaccineProphylaxis(code: string) {
    const validMappings = {
        "1119305005": "SARS-CoV2 antigen vaccine",
        "1119349007": "SARS-CoV2 mRNA vaccine",
        "J07BX03": "covid-19 vaccines (ATC)"
    }
    return decodeCode(code, validMappings);
}

function decodeVaccineProduct(code: string) {
    const validMappings = {
        "EU/1/20/1528": "Comirnaty",
        "EU/1/20/1507": "COVID-19 Vaccine Moderna",
        "EU/1/21/1529": "Vaxzevria",
        "EU/1/20/1525": "COVID-19 Vaccine Janssen",
        "CVnCoV": "CVnCoV",
        "NVXCoV2373": "NVXCoV2373",
        "Sputnik-V": "Sputnik V",
        "Convidecia": "Convidecia",
        "EpiVacCorona": "EpiVacCorona",
        "BBIBP-CorV": "BBIBPCorV",
        "Inactivated-SARS-CoV-2-Vero-Cell": "Inactivated SARSCoV-2 (Vero Cell)",
        "CoronaVac": "CoronaVac",
        "Covaxin": "Covaxin (also known as BBV152 A, B, C)",
    }
    return decodeCode(code, validMappings);
}

function decodeVaccineManufacturer(code: string) {
    const validMappings = {
        "ORG-100001699": "AstraZeneca AB",
        "ORG-100030215": "Biontech Manufacturing GmbH",
        "ORG-100001417": "Janssen-Cilag International",
        "ORG-100031184": "Moderna Biotech Spain S.L.",
        "ORG-100006270": "Curevac AG",
        "ORG-100013793": "CanSino Biologics",
        "ORG-100020693": "China Sinopharm International Corp. - Beijing location",
        "ORG-100010771": "Sinopharm Weiqida Europe Pharmaceutical s.r.o. - Prague location",
        "ORG-100024420": "Sinopharm Zhijun (Shenzhen) Pharmaceutical Co. Ltd. - Shenzhen location",
        "ORG-100032020": "Novavax CZ AS",
        "Gamaleya-Research-Institute": "Gamaleya Research Institute",
        "Vector-Institute": "Vector Institute",
        "Sinovac-Biotech": "Sinovac Biotech",
        "Bharat-Biotech": "Bharat Biotech",
    }
    return decodeCode(code, validMappings);
}

export type VaccineCertificate = {
    targettedAgentCode: string
    targettedAgentText: null | string

    vaccineProphylaxisCode: string
    vaccineProphylaxisText: null | string

    vaccineProductCode: string
    vaccineProductText: null | string

    vaccineManufacturerCode: string
    vaccineManufacturerText: null | string

    doseNumber: number
    totalDoses: number
    vaccinationDate: Date
    daysSinceVaccination: number
    administeredCountryCode: string
    issuerName: string
    uniqueCertificateIdentifier: string
}

function decodeVaccinationCertificate(v: any) : VaccineCertificate {

    // Disease or agent targeted (tg)
    if (!("tg" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.tg claim for the disease of agent targetted");
    }

    // Vaccine or Prophylaxis (vp)
    if (!("vp" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.vp claim for the vaccine or prophylaxis");
    }

    // Vaccine product (mp)
    if (!("mp" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.mp claim for the vaccine product");
    }

    // Vaccine marketing authorisation holder or manufacturer (ma)
    if (!("ma" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.ma claim for the vaccine manufacturer");
    }

    // Dose number (dn)
    if (!("dn" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.dn claim for the dose number");
    }

    // Total doses in series (sd)
    if (!("sd" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.sd claim for the total number of doses in the series");
    }

    const targettedAgentText = decodeTargettedAgent(v.tg);
    const vaccineProphylaxisText = decodeVaccineProphylaxis(v.vp);
    const vaccineProductText = decodeVaccineProduct(v.mp);
    const vaccineManufacturerText = decodeVaccineManufacturer(v.ma);
    const doseNumber = parseInt(v.dn);
    const totalDoses = parseInt(v.sd);

    // Date of vaccination
    if (!("dt" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.dt claim for the date of vaccination");
    }
    const dateRegExp = /^(\d{4})\-(\d{2})\-(\d{2})$/;
    const matches = dateRegExp.exec(v.dt);
    if (!matches) {
        throw new CertificateDecodingError("INVALID_HC_V", "Invalid v.dt claim for the date of vaccination, format MUST be YYYY-MM-DD but found: " + v.dt);
    }
    const dateYear = matches[1];
    const dateMonth = matches[2];
    const dateDay = matches[3];
    
    if (!isValidDate(dateYear + "-" + dateMonth + "-" + dateDay, "YYYY-MM-DD")) {
        throw new CertificateDecodingError("INVALID_HC_V", "Invalid v.dt claim for the date of vaccination: " + v.dt);
    }

    const vaccinationDate = new Date(v.dt);
    
    if (!("co" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.co claim for the country of administration");
    }
    const administeredCountryCode = v.co;

    if (!("is" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.is claim for the issuer that issued the certificate");
    }
    const issuerName = v.is;

    if (!("ci" in v)) {
        throw new CertificateDecodingError("INVALID_HC_V", "Missing v.ci claim for the unique certificate identifier");
    }
    const uniqueCertificateIdentifier = v.ci;

    return {
        targettedAgentCode: v.tg,
        targettedAgentText,

        vaccineProphylaxisCode: v.vp,
        vaccineProphylaxisText,

        vaccineProductCode: v.mp,
        vaccineProductText,

        vaccineManufacturerCode: v.ma,
        vaccineManufacturerText,

        doseNumber,
        totalDoses,
        vaccinationDate,
        daysSinceVaccination: calculateDaysSince(vaccinationDate),
        administeredCountryCode,
        issuerName,
        uniqueCertificateIdentifier,
    }
}

type Names = {
    surnames: string
    surnamesTransliterated: string
    givenNames: null | string
    givenNamesTransliterated: null | string
}

function decodeNames(nam: any) : Names {
    if (!("fn" in nam)) {
        throw new CertificateDecodingError("INVALID_HC_NAM", "Missing surname claim at HC/nam/fn");
    }
    if (!("fnt" in nam)) {
        throw new CertificateDecodingError("INVALID_HC_NAM", "Missing transliterated surname claim at HC/nam/fnt");
    }

    let givenNames = null;
    if ("gn" in nam) {
        givenNames = nam.gn;
    }
    let givenNamesTransliterated = null;
    if ("gnt" in nam) {
        givenNamesTransliterated = nam.gnt;
    }

    return {
        surnames: nam.fn,
        surnamesTransliterated: nam.fnt,
        givenNames,
        givenNamesTransliterated,
    }
}

type PartialDateOfBirth = {
    date: null | Date
    age: null | number
    text: string
    original: string
}

function validateDOB(year: string, month: string, day: string, orig: string): void {
    if (!isValidDate(year + "-" + month + "-" + day, "YYYY-MM-DD")) {
        throw new CertificateDecodingError("INVALID_HC_DOB", "Invalid DoB: " + orig);
    }
}

function decodePartialDOB(dob: string) : PartialDateOfBirth {
    // Only the formats: YYYY-MM-DD, YYYY-MM, YYYY or "" can be used

    if (dob === "") {
        // No date of birth known
        return {
            date: null,
            age: null,
            text: "Unknown",
            original: dob,
        }
    } else {
        const format1 = /^(\d{4})\-(\d{2})\-(\d{2})$/;
        const format2 = /^(\d{4})\-(\d{2})$/;
        const format3 = /^(\d{4})$/;

        let matches = format1.exec(dob);
        if (matches) {
            const dobYear = matches[1];
            const dobMonth = matches[2];
            const dobDay = matches[3];
            
            // Validate full DOB exists here
            validateDOB(dobYear, dobMonth, dobDay, dob);

            const date = new Date(dob);
            const age = calculateAge(dob, "YYYY-MM-DD");
            
            return {
                date,
                age,
                text: dobYear + "-" + dobMonth + "-" + dobDay,
                original: dob,
            }

        } else {
            matches = format2.exec(dob);
            if (matches) {
                const dobYear = matches[1];
                const dobMonth = matches[2];

                // Validate partial DOB exists here
                // Note: I use 28 here because it is as high as we can go without making invalid dates
                // I want an underestimate of the age to be safe
                validateDOB(dobYear, dobMonth, "28", dob);
                const age = calculateAge(dobYear + "-" + dobMonth + "-28", "YYYY-MM-DD");

                return {
                    date: null,
                    age,
                    text: dobYear + "-" + dobMonth + "-XX",
                    original: dob,
                }
                
            } else {
                matches = format3.exec(dob);
                if (matches) {
                    const dobYear = matches[1];

                    const age = calculateAge(dobYear + "-12-31", "YYYY-MM-DD");

                    return {
                        date: null,
                        age,
                        text: dobYear + "-XX-XX",
                        original: dob,
                    }
                    
                } else {
                    throw new CertificateDecodingError("INVALID_HC_DOB", "Invalid DoB format: " + dob);
                }
            }
        }
    }
}

function decodeHealthClaims(hc: any) : HealthClaims {
    
    // Decoding ver, nam, dob, and the specific cert health claims (v, t, r)
    // Based on spec: https://ec.europa.eu/health/sites/default/files/ehealth/docs/covid-certificate_json_specification_en.pdf
    // And values: https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-certificates_dt-specifications_en.pdf

    if (typeof hc !== "object") {
        throw new CertificateDecodingError("INVALID_HC_STRUCTURE", "Expecting an HC object type, but found " + typeof hc);
    }

    const expectedKeys = ['ver', 'nam', 'dob'];
    expectedKeys.forEach(key => {
        if (!(key in hc)) {
            throw new CertificateDecodingError("INVALID_HC_STRUCTURE", "Missing claim: " + key);
        }
    });

    const expectedCertClaims = ['v', 't', 'r'];
    let numOfCerts = 0;
    let certClaims = [] as Array<string>;
    expectedCertClaims.forEach(key => {
        if (key in hc) {
            numOfCerts++;
            certClaims.push(key);
        }
    });
    if (numOfCerts !== 1) {
        throw new CertificateDecodingError("INVALID_HC_STRUCTURE", "Expecting 1 certificate claims, but found: " + numOfCerts + " (" + certClaims.join(", ") + ")");
    }

    if (hc.ver !== "1.3.0") {
        throw new CertificateDecodingError("INVALID_HC_VERSION", "Expecting HC version 1.3.0 but found: " + hc.ver);
    }

    // Names
    const names = decodeNames(hc.nam);

    // Date of birth
    const dob = decodePartialDOB(hc.dob);  

    // Certificate Types
    let certificate: VaccineCertificate;
    if ("v" in hc) {
        // Vaccination certificate
        certificate = decodeVaccinationCertificate(hc.v[0]);

    } else if ("t" in hc) {
        // Test certificate
        throw new CertificateDecodingError("NOT_YET_IMPLEMENTED", "Test certificate is not yet supported");

    } else if ("r" in hc) {
        // Recovery certificate
        throw new CertificateDecodingError("NOT_YET_IMPLEMENTED", "Recovery certificate is not yet supported");

    } else {
        throw new CertificateDecodingError("INVALID_HC_STRUCTURE", "No certificate was found");
    }

    return {
        version: hc.ver,
        names,
        dob,
        certificate,
    }
}

export type GreenCertificateResult = {
    signingKey: PublicKey | null
    
    signatureVerified: boolean
    signatureErrorCode: null | string
    signatureErrorMessage: null | string
    
    issuedAtDate: Date
    expiresAtDate: Date
    isValidNow: boolean

    daysUntilSigningCertExpires: null | number
    daysUntilDCCExpires: number
    
    healthClaims: HealthClaims
};

export async function verifyEuropeanGreenCertificate(buf: Buffer, trustedKeys: KeysMap) : Promise<GreenCertificateResult> {
    const expectedHeader = buf.slice(0,4).toString();
    if (expectedHeader !== "HC1:") {
        throw new CertificateDecodingError("INCORRECT_HC1_HEADER", "Expected 4 byte header: 'HC1:'");
    }
    const restOfCert = buf.slice(4);
    // console.log("REST OF CERT", restOfCert);
    // console.log("REST OF CERT B64", restOfCert.toString("base64"));
    let compressed;
    try {
        compressed = base45.decode(restOfCert.toString());
    } catch(e) {
        throw new CertificateDecodingError("FAILED_B45_DECODING", "Base 45 Decode Error: " + e.message);
    }
    
    // console.log("Compressed", compressed);
    // console.log("Compressed B64", compressed.toString("base64"));
    let unzipped;
    try {
        unzipped = zlib.unzipSync(compressed);
    } catch(e) {
        throw new CertificateDecodingError("FAILED_TO_INFLATE", "ZLIB Error: " + e.message);
    }

    const decoded = cbor.decode(unzipped);
    if (decoded.tag === 18) {
        // Decode the COSE value in to an array of 4 items
        const value = decoded.value;
        // console.log("VALUE", value);

        const protectedHeader = value[0];
        const unprotectedHeader = value[1];
        const payload = value[2];
        // const sig = value[3];

        // Decode the header
        const headerVal = cbor.decode(protectedHeader);
        // console.log("Header", headerVal);

        if (headerVal.get(1) !== -7) {
            throw new CertificateDecodingError("INVALID_PASSPORT_FORMAT", "Header item 1 is expected to equal -7");
        }
        let keyId = headerVal.get(4);
        if (typeof keyId === "undefined") {
            // It looks like some contain claim 4 within the 2nd unprotected array map
            // Not sure if this is valid or not, but I will allow this if the key is found
            
            keyId = unprotectedHeader.get(4);
            // console.log("Trying with", keyId);
        }

        // console.log("HEADER KEY ID", keyId.toString("base64"));

        const payloadVal = cbor.decode(payload);

        const issuer = payloadVal.get(1); // This is normally the 2 char country code of the issuer, but should act as an issuer ID 
        const issuedAt = payloadVal.get(6);
        const expiresAt = payloadVal.get(4);
        const myHealthClaims = payloadVal.get(-260);

        // console.log("Health claims", myHealthClaims.get(1).v);

        let signingKey = null as null | PublicKey;
        let signatureVerified = false;
        let signatureErrorCode = null as null | string;
        let signatureErrorMessage = null as null | string;
        try {
            const kidb64 = keyId.toString("base64");

            // Fix: issuer isn't necessarily the same as the country code of the issuing signing certificate
            // if (issuer in trustedCerts) {
                // const keys = trustedCerts[issuer].keys;
                const keys = trustedKeys;
                
                if (kidb64 in keys) {
                    const usedKey = keys[kidb64];
                    signingKey = usedKey;
                    const verifier = {
                        'key': {
                            'x': Buffer.from(usedKey.x, 'base64'),
                            'y': Buffer.from(usedKey.y, 'base64')
                        }
                    };

                    // Check the certificate validity period, if it exists
                    if (usedKey.certificate !== null) {
                        const validFrom = new Date(usedKey.certificate.validFrom);
                        const validTo = new Date(usedKey.certificate.validTo);
                        const now = new Date();
                        if (now < validFrom) {
                            throw new CertificateDecodingError("SIGNING_CERTIFICATE_FUTURE_VALID", "Please check the system clock. The validity period starts at " + validFrom.toLocaleString());
                        }
                        if (now > validTo) {
                            throw new CertificateDecodingError("SIGNING_CERTIFICATE_EXPIRED", "The validity period expired at " + validTo.toLocaleString());
                        }
                    }

                    try {
                        await cose.sign.verify(
                            unzipped,
                            verifier
                        );

                        // Certificate is verified
                        signatureVerified = true;
                    } catch(e) {
                        throw new CertificateDecodingError("INVALID_SIGNATURE", e.message);
                    }
                } else {
                    throw new CertificateDecodingError("KEY_NOT_FOUND", "Could not find certificate signing key " + keyId.toString("hex") + " / " + keyId.toString("base64") + " in list of keys");
                }
            // Fix: ISSUER_NOT_FOUND is now obsolete
            // } else {
            //     throw new CertificateDecodingError("ISSUER_NOT_FOUND", "Could not find issuer " + issuer + " in list " + Object.keys(trustedCerts).join(",") + " for key id: " + kidb64);
            // }
        } catch(e) {
            if (e instanceof CertificateDecodingError) {
                signatureVerified = false;
                signatureErrorCode = e.code;
                signatureErrorMessage = e.message;
            } else {
                throw e;
            }
        }

        // Check validity period here
        let isValidNow = false;
        const issuedAtDate = new Date(issuedAt * 1000);
        const expiresAtDate = new Date(expiresAt * 1000);
        try {
            const now = new Date();
            if (now < issuedAtDate) {
                throw new Error("Before validity period.  Check local clock is correct.  Valid from: " + issuedAtDate);
            } else if (now > expiresAtDate) {
                throw new Error("Expired on " + expiresAtDate);
            } else {
                // Within validity period
                // console.log("Issued on: ", issuedAtDate);
                // console.log("Valid until: ", expiresAtDate);
                isValidNow = true;
            }
        } catch(e) {
            isValidNow = false;
        }

        // Continue with trying to decode the certificate, even if not verified or invalid timestamp.

        // Health claims
        const hc = myHealthClaims.get(1);
        const healthClaims = decodeHealthClaims(hc);
        
        let daysUntilSigningCertExpires = null as null | number;
        if (signingKey?.certificate) {
            daysUntilSigningCertExpires = calculateDaysUntil(new Date(signingKey.certificate.validTo));
        }
        return {
            signingKey, // Includes auth URL
            
            signatureVerified,
            signatureErrorCode,
            signatureErrorMessage,
            
            issuedAtDate,
            expiresAtDate,
            isValidNow,

            daysUntilDCCExpires: calculateDaysUntil(expiresAtDate),
            daysUntilSigningCertExpires,

            healthClaims,
        };
        
    } else {
        throw new Error("Expecting a COSE_Sign1 (tag 18) data item.  Please see https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml");
    }
}

