import React from 'react';
import './DecodedCertificateResult.scss';
import { CertificateResult } from './App';
import DecodedCertificateStatus from './DecodedCertificateStatus';

import certificateIcon from '../images/certificate.svg';
import injectionIcon from '../images/injection.svg';

import issuerFlags from '../compiled/flags';
import { decodeSignatureErrorCode } from '../lib/decode';

function getFlagForIssuer(issuer: string) : null | string {
    if (issuer in issuerFlags) {
        return issuerFlags[issuer].default as string;
    } else {
        return null;
    }
}

function decodeCertificateErrorCode(code: string) {
    if (code === "INVALID_HC_V") {
        return "Invalid Vaccination Certificate.";

    } else if (code === "INVALID_HC_NAM") {
        return "Invalid 'nam' Name claim.";

    } else if (code === "INVALID_HC_DOB") {
        return "Invalid 'dob' Date of birth claim.";

    } else if (code === "INVALID_HC_STRUCTURE") {
        return "Bad Health Certificate Structure.";

    } else if (code === "INVALID_HC_VERSION") {
        return "Sorry but this website does not support this health certificate version.  Current version spec can be found here: https://ec.europa.eu/health/sites/default/files/ehealth/docs/covid-certificate_json_specification_en.pdf";

    } else if (code === "NOT_YET_IMPLEMENTED") {
        return "This website has not yet implemented the decoding of this certificate type.  Coming soon...";

    } else if (code === "INCORRECT_HC1_HEADER") {
        return "Incorrect header";

    } else if (code === "FAILED_B45_DECODING") {
        return "Failed to decode expected Base 45 data";

    } else if (code === "FAILED_TO_INFLATE") {
        return "Failed to inflate expected ZLIB compressed data";

    } else if (code === "INVALID_PASSPORT_FORMAT") {
        return "Invalid internal structure";

    } else {
        return "BUG: Unknown error message";
    }
}

type Props = {
    result: CertificateResult | null
}

function DecodedCertificateResult(props: Props) {
    const result = props.result;

    let issuerFlag = null as null | string;
    if (result?.result?.signingKey) {
        issuerFlag = getFlagForIssuer(result.result.signingKey.issuer);
    }

    let administeredFlag = null as null | string;
    if (result?.result?.healthClaims.certificate.administeredCountryCode) {
        administeredFlag = getFlagForIssuer(result.result.healthClaims.certificate.administeredCountryCode);
    }

    return (
        <div className="decodedCertificateResult">
            { result !== null ? (
                result.result !== null ? (
                    <>
                        <h1>Signing Authority</h1>
                        <div className="signingAuthority">
                            <div className="left">
                                <img className="certificateIcon" src={certificateIcon} alt="Certificate" />
                            </div>
                            <div className="right">
                                { result.result.signingKey ? (
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td className="heading">Verified</td>
                                                {result.result.signatureVerified ? (
                                                    <td className="green">Yes</td>
                                                ) : (
                                                    <td className="red">No - {decodeSignatureErrorCode(result.result.signatureErrorCode || "")}</td>
                                                )}
                                            </tr>
                                            <tr>
                                                <td className="heading">Key Id</td>
                                                <td className="code">{result.result.signingKey.kid}</td>
                                            </tr>
                                            <tr>
                                                <td className="heading">Issuer</td>
                                                <td className="code">{result.result.signingKey.issuer} {issuerFlag !== null && (
                                                    <img className="smallFlag" src={issuerFlag} alt={result.result.signingKey.issuer + " flag"} />
                                                )}</td>
                                            </tr>
                                            <tr>
                                                <td className="heading">Authoritative URL</td>
                                                <td className="value"><a href={result.result.signingKey.fromUrl} target="_blank" rel="noopener">View</a></td>
                                            </tr>
                                            
                                            {result.result.signingKey?.certificate && (
                                                <>
                                                    <tr>
                                                        <td className="heading">Signing certificate</td>
                                                        <td className="value">
                                                            <span>{result.result.signingKey.certificate.subject.CN}, {result.result.signingKey.certificate.subject.O}</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="heading">Certificate issued by</td>
                                                        <td className="value">{result.result.signingKey.certificate.issuer.CN}, {result.result.signingKey.certificate.issuer.O}</td>
                                                    </tr>

                                                    {result.result.daysUntilSigningCertExpires !== null && (
                                                        <tr>
                                                            <td className="heading">Expires in</td>
                                                            <td className={result.result.daysUntilSigningCertExpires < 8 ? "code warning" : "code"}>{Math.floor(result.result.daysUntilSigningCertExpires)} days</td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <>
                                        <h2>Unknown signing key</h2>
                                        <h3>{decodeSignatureErrorCode(result.result.signatureErrorCode || "")}</h3>
                                        <h3>{result.result.signatureErrorMessage}</h3>
                                    </>
                                ) 
                                }
                            </div>
                        </div>
                        
                        <DecodedCertificateStatus result={result} />

                        <h1>Digital Covid Certificate (DCC) Details</h1>
                        <div className="certificateDetails">
                            
                        <h2>Validity</h2>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className="heading">DCC Schema version</td>
                                        <td className="code">{result.result.healthClaims.version}</td>
                                    </tr>
                                    <tr>
                                        <td className="heading">Issuer</td>
                                        <td className="code">{result.result.signingKey?.issuer} {issuerFlag !== null && (
                                            <img className="smallFlag" src={issuerFlag} alt={result.result.signingKey?.issuer + " flag"}/>
                                        )}</td>
                                    </tr>
                                    <tr>
                                        <td className="heading">Issued at</td>
                                        <td className="code">{result.result.issuedAtDate.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="heading">Expires at</td>
                                        <td className="code">{result.result.expiresAtDate.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="heading">Valid</td>
                                        {result.result.signatureVerified ? (
                                            <td className={result.result.isValidNow ? "green" : "red"}>{result.result.isValidNow ? "Yes" : "No"}</td>
                                        ) : (
                                            <td className="red">Signature not verified</td>
                                        )}
                                    </tr>
                                    {result.result.signatureVerified && (
                                        <tr>
                                            <td className="heading">Expires in</td>
                                            <td className={result.result.daysUntilDCCExpires < 8 ? "code warning" : "code"}>{Math.floor(result.result.daysUntilDCCExpires)} days</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <h2>Health Claims</h2>
                            <div className="healthClaims">

                                <h3>Name(s)</h3>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="heading">Surname</td>
                                            <td className="value">{result.result.healthClaims.names.surnames}</td>
                                            <td className="code padleft big">{result.result.healthClaims.names.surnamesTransliterated}</td>
                                        </tr>
                                        { result.result.healthClaims.names.givenNames !== null && (
                                            <tr>
                                                <td className="heading">Given names</td>
                                                <td className="value">{result.result.healthClaims.names.givenNames}</td>
                                                <td className="code padleft big">{result.result.healthClaims.names.givenNamesTransliterated}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>


                                <h2>DoB / Age</h2>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="heading">Date of birth</td>
                                            <td className="code">{result.result.healthClaims.dob.text}</td>
                                            {result.result.healthClaims.dob.age !== null && (
                                                <td className={result.result.healthClaims.dob.age < 18 ? "value padleft warning" : "value padleft"}>{result.result.healthClaims.dob.age} years old</td>
                                            )}
                                        </tr>
                                    </tbody>
                                </table>

                                <h2>Vaccination Certificate Details</h2>
                                <img className="injectionIcon" src={injectionIcon} alt="Injection" />
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="heading">Vaccination date</td>
                                            <td className="code">{result.result.healthClaims.certificate.vaccinationDate.toLocaleDateString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Days since vaccination</td>
                                            <td className={result.result.healthClaims.certificate.daysSinceVaccination < 14 ? "code warning" : "code"}>{Math.round(result.result.healthClaims.certificate.daysSinceVaccination)}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Administered country</td>
                                            <td className="value">{result.result.healthClaims.certificate.administeredCountryCode} {administeredFlag !== null && (
                                                <img className="smallFlag" src={administeredFlag} alt={result.result.healthClaims.certificate.administeredCountryCode + " flag"} />
                                            )}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Issued by</td>
                                            <td className="value">{result.result.healthClaims.certificate.issuerName}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Targetted agent</td>
                                            <td className="value">{result.result.healthClaims.certificate.targettedAgentText}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Vaccine prophylaxis</td>
                                            <td className="value">{result.result.healthClaims.certificate.vaccineProphylaxisText}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Vaccine product</td>
                                            <td className="value">{result.result.healthClaims.certificate.vaccineProductText}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Vaccine manufacturer</td>
                                            <td className="value">{result.result.healthClaims.certificate.vaccineManufacturerText}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Dose sequence</td>
                                            <td className={result.result.healthClaims.certificate.doseNumber === result.result.healthClaims.certificate.totalDoses ? "value" : "value warning"}>{result.result.healthClaims.certificate.doseNumber} of {result.result.healthClaims.certificate.totalDoses}</td>
                                        </tr>
                                        <tr>
                                            <td className="heading">Unique ID</td>
                                            <td className="code">{result.result.healthClaims.certificate.uniqueCertificateIdentifier}</td>
                                        </tr>
                                    </tbody>
                                </table>

                            </div>

                            
                            
                        </div>
                        

                        
                    </>
                ) : (
                    <>
                        <h1>Error</h1>
                        <p>{ decodeCertificateErrorCode(result.errorCode || "") }</p>
                        <h2>Details</h2>
                        <p>{result.errorMessage}</p>
                    </>
                )
            ) : (
                <p className="faint">Decoded certificate will appear here.</p>
            )}
        </div>
    )
}

export default DecodedCertificateResult;
