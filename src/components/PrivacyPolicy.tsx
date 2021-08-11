
import React, { MouseEventHandler } from 'react';
import './PrivacyPolicy.scss';

type Props = {
    hidePrivacyPolicy: MouseEventHandler<HTMLAnchorElement>
}

export const GithubUrl = "https://github.com/philios33/covid-passport-scanner";

function PrivacyPolicy(props: Props) {


    return (
        <div className="privacyPolicy">
            <a className="topClose" href="#" onClick={props.hidePrivacyPolicy}>Close</a>

            <h1>Privacy Policy</h1>
            <p>By using this website, you implicitly agree to the following terms.</p>

            <h2>Usage</h2>
            <p>This website is a personal project of mine and I am allowing completely free use.  Reading, decoding and verification against the certificate store is done completely offline.</p>

            <h2>Usage Statistics</h2>
            <p>To make it easier for me to fix issues with the scanner, data inserted or scanned is sent securely (HTTPS) over the wire to a usage endpoint.  This data will remain securely stored for debugging purposes.  This data may be stored for up to 30 days.  You may opt-out of this feature by deselecting the checkbox at the top of the page.</p>

            <h2>Open source</h2>
            <p>This software is completely open source.  All packages used, including this project, are released under the <a rel="noopener" target="_blank" href="https://en.wikipedia.org/wiki/MIT_License">MIT license</a>.  Please find <a rel="noopener" target="_blank" href={GithubUrl}>the project on github</a> for the source code or to contribute.</p>

            <h2>Tracking &amp; Cookies</h2>
            <p>This website will NEVER track you.  It does not use cookies or "HTML Web Storage" mechanisms to track revisiting users.  However, I reserve the right to harness HTML5 Web Storage in the future to enhance functionality.</p>

            <h2>DCC History</h2>
            <p>Since November 2020 the EU have worked together between member states to roll out a digital certificate format which can prove a person has been vaccinated, tested or recovered from COVID-19.</p>
            <p><a rel="noopener" target="_blank" href="https://ec.europa.eu/info/live-work-travel-eu/coronavirus-response/safe-covid-19-vaccines-europeans/eu-digital-covid-certificate_en#what-is-the-eu-digital-covid-certificate">Read more</a></p>
            
            <p>The UK National Health Service (NHS) has also adopted the same format for it's COVID Pass.</p>
            <p><a rel="noopener" target="_blank" href="https://www.nhs.uk/conditions/coronavirus-covid-19/covid-pass/">Read more</a></p>
            
            <p>The initial EU project, previously called "Digital Green Certificates" is open source and on github.</p>
            <p><a rel="noopener" target="_blank" href="https://github.com/eu-digital-green-certificates">View on Github</a></p>
            
            <p>More technical information on how the system works, including the trust framework and detailed technical specification, can be found on the EU eHealth pages.</p>
            <p><a rel="noopener" target="_blank" href="https://ec.europa.eu/health/ehealth/covid-19_en">View EU eHealth page</a></p>
            
            
            <a className="bottomClose" href="#" onClick={props.hidePrivacyPolicy}>Close</a>
        </div>
    )
}

export default PrivacyPolicy;
