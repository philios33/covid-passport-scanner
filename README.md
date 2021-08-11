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

- sudo docker build -t test .
- sudo docker run -t -i -v "$(pwd)"/server/reports:/home/node/server/reports -p 8081:8081 test

Run certs and flags script first locally
Then build docker image
Mount a local dir for the server reports to go

Look in to how it works on the wedding server with docker-compose
Add script for refreshing certs and flags and redeploying

Then hook it up to the gateway by adding nginx config.
Point DNS and sort out lets encrypt cert
Test live traffic is routed properly and that reports save
Test wedding site still works fine
Do chrome insights tests for optimisation!

Focus on "critical" stuff "above the flow"

