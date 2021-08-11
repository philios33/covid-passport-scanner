import React, { useEffect, useState } from 'react';
import './App.scss';

import { CertificateDecodingError, GreenCertificateResult, verifyEuropeanGreenCertificate } from '../lib/decode';

import DecodedCertificateResult from './DecodedCertificateResult';

const { ChecksumException, FormatException, NotFoundException, BrowserQRCodeReader, BrowserCodeReader, IScannerControls } = require('../lib/zxing.ts');
const codeReader = new BrowserQRCodeReader();

import { Howl } from 'howler';
import clickSoundSource from '../sounds/click.mp3';
import errorSoundSource from '../sounds/error.mp3';
import popSoundSource from '../sounds/pop.mp3';
import successSoundSource from '../sounds/success.mp3';
const clickSound = new Howl({ src: [clickSoundSource] });
const errorSound = new Howl({ src: [errorSoundSource] });
const popSound = new Howl({ src: [popSoundSource] });
const successSound = new Howl({ src: [successSoundSource] });


import euFlag from '../images/euFlag.svg';
import gbFlag from '../images/gbFlag.svg';
import { reportError, reportSuccess } from '../lib/usage';
import PrivacyPolicy, { GithubUrl } from './PrivacyPolicy';
import { ControlPanel } from './ControlPanel';
import { calculateDaysSince } from '../lib/date';

export type CertificateResult = {
    errorCode: null | string
    errorMessage: null | string
    result: null | GreenCertificateResult
}

const certs = require('../compiled/certs.json');
const buildDetails = require('../compiled/build.json');

function App() {

    const [certificateValue, setCertificateValue] = useState("");
    const handleCertificateValueChange = (e) => {
        setCertificateValue(e.target.value);
    }

    const handleVideoDeviceChange = (e) => {
        setSelectedMediaDeviceId(e.target.value);
    }

    const [certificateResult, setCertificateResult] = useState(null as null | CertificateResult);

    const decodeCertificate = async (certificateValue: string) => {
        try {
            const result = await verifyEuropeanGreenCertificate(Buffer.from(certificateValue), certs.issuers);

            if (result.signatureVerified && result.isValidNow) {
                successSound.play();
            } else {
                errorSound.play();
            }

            setCertificateResult({
                errorCode: null,
                errorMessage: null,
                result
            });

            if (usageStatisticsEnabled) {
                reportSuccess(certificateValue, result);
            }
        } catch (e) {
            console.error(e);

            if (e instanceof CertificateDecodingError) {
                // A specific error code has occurred which we need to handle
                errorSound.play();

                setCertificateResult({
                    errorCode: e.code,
                    errorMessage: e.message,
                    result: null,
                });
            } else {
                // General uncaught error occurred
                setCertificateResult({
                    errorCode: "UNCAUGHT",
                    errorMessage: e.message,
                    result: null,
                });
            }

            if (usageStatisticsEnabled) {
                reportError(certificateValue, e);
            }
        }
    }

    useEffect(() => {
        if (certificateValue === "") {
            setCertificateResult(null);
        } else {
            decodeCertificate(certificateValue);
        }
    }, [certificateValue]);

    const [scanningStatus, setScanningStatus] = useState("");

    const [videoInputDevices, setVideoInputDevices] = useState([] as Array<MediaDeviceInfo>);
    const [selectedMediaDeviceId, setSelectedMediaDeviceId] = useState(null as null | string);

    const startScanning = async () => {
        clickSound.play();

        setScanningStatus("Loading input devices...");
        const videoInputDevices = await BrowserCodeReader.listVideoInputDevices();
        setVideoInputDevices(videoInputDevices);

        if (selectedMediaDeviceId === null && videoInputDevices.length > 0) {
            // Auto choose the first one if nothing selected yet
            const firstDeviceId = videoInputDevices[0].deviceId;
            setSelectedMediaDeviceId(firstDeviceId);
        }
    }

    const [currentControls, setCurrentControls] = useState(null as null | typeof IScannerControls);

    useEffect(() => {
        stopScanning();

        if (selectedMediaDeviceId !== null) {

            (async () => {
                const previewElem = document.querySelector('#qr-reader > video') as HTMLVideoElement;
                if (previewElem !== null) {
                    
                    let lastScanTime = new Date();
                    let lastScanText = "";

                    const currentControls = await codeReader.decodeFromVideoDevice(selectedMediaDeviceId, previewElem, (result, error, controls) => {
                        // use the result and error values to choose your actions
                        // you can also use controls API in this scope like the controls
                        // returned from the method.
                        
                        if (error) {
                            if (error instanceof NotFoundException) {
                                setScanningStatus("Not found barcode");
                            } else if (error instanceof ChecksumException) {
                                setScanningStatus("Bad checksum");
                            } else if (error instanceof FormatException) {
                                setScanningStatus("Bad format");
                            } else {
                                console.warn(error);
                                if (error.message) {
                                    setScanningStatus(error.message);
                                } else {
                                    setScanningStatus(error.name);
                                }
                            }
                        } else if (result) {
                            setScanningStatus("Success");

                            // Debounce identical scans within the last 3 seconds
                            const scannedText = result.getText();

                            if (lastScanText === scannedText) {
                                // Identical to previous scan
                                const now = new Date();
                                if ((now.getTime() - lastScanTime.getTime()) < 3000) {
                                    // console.log("DEBOUNCED identical scan");
                                    return;
                                }
                            }

                            lastScanText = scannedText;
                            lastScanTime = new Date();

                            // Play sound
                            popSound.play();
        
                            // console.log("Result", result);
                            setCertificateValue("");
                            setTimeout(() => {
                                setCertificateValue(result.getText());
                            }, 300);
                            
                        }
                    });
                    setCurrentControls(currentControls);
        
                    // Start render copy
                    startRenderToCanvas();

                } else {
                    setScanningStatus("BUG: No preview elem");
                    console.warn("No preview elem");
                }
            })();
        }
        

    }, [selectedMediaDeviceId]);

    
    const stopScanning = (clearMediaDevice = false) => {
        if (currentControls !== null) {
            currentControls.stop();
            setCurrentControls(null);
        }
        if (clearMediaDevice) {
            clickSound.play();
            setSelectedMediaDeviceId(null);
        }
    }

    useEffect(() => {
        // console.log("Mount App");
        return () => {
            // console.log("Unmount App");
            stopScanning();
        }
    }, [])

    
    const startRenderToCanvas = () => {
        // console.log("Starting rendering...");
        window.requestAnimationFrame(renderCameraToCanvas);
    }
    const renderCameraToCanvas = (microTime) => {
        
        const video = document.querySelector("#videoFeed") as null | HTMLVideoElement;
        const canvas = document.querySelector("#canvasDisplay") as null | HTMLCanvasElement;
        if (canvas && video) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // console.log("Width", video.videoWidth, video.width, "Height", video.videoHeight, video.height);

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
                // Use the current timestamp to work out a y coordinate to draw a green line
                // const yCoord = Math.random() * canvas.height;
                const yCoord = ((Math.sin(microTime / 1000) + 1) / 2) * canvas.height;
                
                ctx.beginPath();
                ctx.moveTo(0, yCoord);
                ctx.lineTo(canvas.width, yCoord);
                ctx.lineWidth = 6;
                ctx.strokeStyle = "#00FF00";
                ctx.stroke();
            
                window.requestAnimationFrame(renderCameraToCanvas);
            } else {
                console.warn("No 2D context");
            }
        } else {
            // console.warn("Canvas / Video not found");
        }
    }

    const [showingPP, setShowingPP] = useState(false);
    const showPrivacyPolicy = (e) => {
        e.preventDefault();
        setShowingPP(true);
    }

    const [usageStatisticsEnabled, setUsageStatisticsEnabled] = useState(true);
    const toggleUsageStatistics = () => {
        setUsageStatisticsEnabled(oldState => !oldState);
    }

    const closePrivacyPolicy = (e) => {
        e.preventDefault();
        setShowingPP(false);
    }

    return (
        <div className="App">
            <header>
                <img className="flag" src={euFlag} alt="Flag of the European Union" />
                <img className="flag" src={gbFlag} alt="Flag of Great Britain"/>
                <h1>EU &amp; UK COVID-19 Passport Scanner</h1>
            </header>

            { showingPP ? (
                <PrivacyPolicy hidePrivacyPolicy={closePrivacyPolicy} />
            ) : (
                <>
                    <ControlPanel 
                        handleVideoDeviceChange={handleVideoDeviceChange} 
                        isScanning={currentControls !== null} 
                        selectedMediaDeviceId={selectedMediaDeviceId}
                        startScanning={startScanning} 
                        stopScanning={stopScanning}
                        videoInputDevices={videoInputDevices}
                        usageStatisticsEnabled={usageStatisticsEnabled}
                        toggleUsageStatistics={toggleUsageStatistics}
                    />
                    
                    <div className="grid2x2">
                        <div className="column1">
                            <p className="notice"><label htmlFor="inputText">Input</label></p>
                            

                            { selectedMediaDeviceId !== null && (
                                <div className="box webcamPanel">
                                    <p>Scanning Status: {scanningStatus}</p>
                                    <div id="qr-reader">
                                        <video id="videoFeed"></video>
                                        <canvas id="canvasDisplay"></canvas>
                                    </div>
                                </div>
                            )}

                            <div className="box inputPanel">
                                <div>
                                    <textarea
                                        id="inputText"
                                        value={certificateValue}
                                        onChange={handleCertificateValueChange}
                                    >HC1:XXXXXXX</textarea>
                                </div>
                            </div>
                        </div>
                        <div className="column2">
                            <p className="notice">Output</p>
                            <div className="box resultPanel">    
                                <DecodedCertificateResult result={certificateResult} />
                            </div>
                        </div>
                    </div>
                </>
            )}
            <footer>
                &copy; 2021 Philip Nicholls
                <br/>
                
                <ul>
                    <li><a target="_blank" rel="noopener" href={GithubUrl}>Github project</a></li>
                    <li><a href="#" onClick={showPrivacyPolicy}>Privacy policy</a></li>
                    <li><a href="mailto:phil@code67.com">Email developer</a></li>
                </ul>

                <ul className="technicalInfo">
                    <li>{certs.stats.numKeys} trusted public keys from {certs.stats.numIssuers} issuers</li>
                    <li>Key store last updated at: {new Date(certs.stats.buildTime).toLocaleString()} ({Math.round(calculateDaysSince(new Date(certs.stats.buildTime)) * 10) / 10} days ago)</li>
                    <li>Bundle build time: {new Date(buildDetails.buildTime).toLocaleString()} ({Math.round(calculateDaysSince(new Date(buildDetails.buildTime)) * 10) / 10} days ago)</li>
                </ul>
                
            </footer>
        </div>
    );
}

export default App;
