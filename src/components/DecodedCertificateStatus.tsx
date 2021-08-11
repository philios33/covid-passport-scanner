// import moment from 'moment-mini';
import React from 'react';
import './DecodedCertificateStatus.scss';
import { CertificateResult } from './App';

import redCross from '../images/redcross.svg';
import greenTick from '../images/greentick.svg';
import { decodeSignatureErrorCode } from '../lib/decode';

type Props = {
    result: CertificateResult | null
}

function formatDate(date: Date) {
    return date.toLocaleString();
}

function DecodedCertificateStatus(props: Props) {
    const result = props.result;

    let statusClass = "waiting";
    let statusTitle = "Waiting";
    let statusDetails = "Waiting for scan...";

    if (result === null) {
        // Awaiting scan
    } else {
        if (result.errorCode === null && result.result !== null) {
            // There was no error and a result
            if (result.result.signatureVerified) {
                // Cert signed
                if (result.result.isValidNow) {
                    // Cert valid
                    statusClass = "ok";
                    statusTitle = "Certificate valid";
                    statusDetails = "This certificate is valid and securely signed by a trusted authority.";
                } else {
                    // Cert expired
                    statusClass = "notok";
                    statusTitle = "Certificate invalid";
                    statusDetails = "This certificate is invalid.  It is only valid from " + formatDate(result.result.issuedAtDate) + " and expires " + formatDate(result.result.expiresAtDate);
                }
            } else {
                // Sig not verified
                statusClass = "notok";
                if (result.result.signatureErrorCode !== null) {
                    // With error code
                    statusTitle = decodeSignatureErrorCode(result.result.signatureErrorCode);
                    statusDetails = "";
                    if (result.result.signatureErrorMessage !== null) {
                        // And error message
                        statusDetails = result.result.signatureErrorMessage;
                    }
                } else {
                    // Without error code
                    statusTitle = "BUG";
                    statusDetails = "Unknown signature not verified failure, make sure the signatureErrorCode exists";
                }
            }
        } else if (result.errorCode !== null && result.errorMessage !== null) {
            statusClass = "notok";
            // statusTitle = decodeCertificateErrorCode(result.errorCode);
            // statusDetails = result.errorMessage;
            statusTitle = "Certificate invalid";
            statusDetails = ""

        } else {
            statusClass = "notok";
            statusTitle = "BUG";
            statusDetails = "Unknown combination";
        }
    }


    return (
        <div className={"decodedCertificateStatus " + statusClass}>
            {statusClass === "ok" && (
                <div className="statusIcon">
                    <img src={greenTick} />
                </div>
            )}
            {statusClass === "notok" && (
                <div className="statusIcon">
                    <img src={redCross} />
                </div>
            )}
            <div className="statusText">
                <h1>{statusTitle}</h1>
                <p>{statusDetails}</p>
            </div>
        </div>
    )
}

export default DecodedCertificateStatus;
