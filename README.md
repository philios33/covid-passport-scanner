# Covid Passport Scanner

This project is for the website https://covidpassportscanner.net

Issues & Pull Requests welcome.

## Development Setup

- `nvm use 14`
- `npm ci`
- `npm run downloadCertBundle`
- `npm run downloadFlags`
- `npm run build`

Then you can run the hot reloading dev server

- `npm run start`

## Test built files with server

- `npm run build`
- `npm run serve`

## Testing docker image

- `docker build -t scanner .`
- `docker run -t -i -p 8081:8081 scanner`


# Other Useful URLS

- Main - https://ec.europa.eu/health/ehealth/covid-19_en
- https://github.com/eu-digital-green-certificates
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-certificates_v3_en.pdf
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-certificates_v2_en.pdf
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-certificates_v5_en.pdf
- https://ec.europa.eu/health/documents/community-register/html/reg_hum_act.htm?sort=n
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-value-sets_en.pdf
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/covid-certificate_json_specification_en.pdf
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/covid-certificate_json_specification_en.pdf
- https://ec.europa.eu/health/sites/default/files/ehealth/docs/digital-green-certificates_dt-specifications_en.pdf
- https://github.com/lovasoa/sanipasse/blob/master/src/assets/Digital_Green_Certificate_Signing_Keys.json
- https://de.dscg.ubirch.com/trustList/DSC/
- https://greencheck.gv.at/api/masterdata
- https://covid-pass-verifier.com/assets/certificates.json
- https://covid-status.service.nhsx.nhs.uk/pubkeys/keys.json
- https://github.com/hannob/vacdec/blob/main/vacdec
- https://github.com/panzi/verify-ehc/blob/main/verify_ehc.py

# Other TODO

The issuer isn't always the country code.
    Put all trusted certs in single object by key id.

Create component for certificate overview
    View Name & Dose status, Vaccine name, X Days ago, in a small widget near the top above everything else!

Fix alignment of details

Finish testing all error codes

---

Support other 2 certificates (Wait for data before rendering tho)
Support RSA public keys (like Lithuania)

Add page for viewing the trusted key store
Make privacy policy a different URL
Add Menu at the top
    Scan, Keys, About, Terms

Implement proper server side rendering for each static page and hydrate the bundle.
