import React, { ChangeEventHandler } from 'react';
import './ControlPanel.scss';
import qrCode from '../images/qrcode.svg';
import stopSvg from '../images/stop.svg';

type Props = {
    isScanning: boolean
    selectedMediaDeviceId: null | string
    startScanning: Function
    stopScanning: Function
    handleVideoDeviceChange: ChangeEventHandler<HTMLSelectElement>
    videoInputDevices: Array<MediaDeviceInfo>
    usageStatisticsEnabled: boolean
    toggleUsageStatistics: ChangeEventHandler<HTMLInputElement>
}

export function ControlPanel(props: Props) {

    return (
        <div className="box controlPanel">

            {!props.isScanning ? (
                <button className="startScanning" onClick={() => props.startScanning()}>
                    <img className="icon" src={qrCode} />
                    <span>Start scanning</span>
                </button>
            ) : (
                <button className="stopScanning" onClick={() => props.stopScanning(true)}>
                    <img className="icon" src={stopSvg} />
                    <span>Stop scanning</span>
                </button>
            )}

            <select disabled={props.selectedMediaDeviceId === null} className="mediaDropdown" onChange={props.handleVideoDeviceChange} value={props.selectedMediaDeviceId || ""}>
                { props.selectedMediaDeviceId === null ? (
                    <option>Select camera</option>
                ) : (
                    props.videoInputDevices.map((vd) => <option
                        key={vd.deviceId} 
                        value={vd.deviceId}
                        >
                            {vd.label}
                        </option>    
                    )
                )}
            </select>

            <div className="usageStatsControl">
                <label htmlFor="usageStats">Send usage statistics</label>
                <input id="usageStats" type="checkbox" checked={props.usageStatisticsEnabled} onChange={props.toggleUsageStatistics}></input>
            </div>
            
        </div>
    );
}