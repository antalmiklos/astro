const { INDIClient } = require("indi-client");
const IndiDevice = require("../device/device");

class CCDController {
    constructor(device) {
        this.device = device;
    }

    /**
     * 
     * @param {Number} duration 
     * @param {IndiDevice} device 
     */
    expose(duration) {
        this.device.setNumber("CCD_EXPOSURE", "CCD_EXPOSURE_VALUE", duration)
    }

    startCooler(){
        this.device.setSwitch("CCD_COOLER", "COOLER_ON", "On")
    }
}

class CCD extends IndiDevice {
    constructor(name, client) {
        super(name, client);
        this.type = "ccd";
        this.hasCooler = false;
        this.coolerActive = false;
        this.ccdTemp = 0;
    }

    log() {
        console.log(this instanceof IndiDevice)
    }

    getCoolerInfo() {
        const data = this.properties.switch;
        if(data["CCD_COOLER"] !== undefined) {
            const coolerData = data["CCD_COOLER"]
            this.hasCooler = coolerData !== undefined
            this.coolerActive = coolerData.switches["COOLER_ON"].value === "On";
        }
    }

    getCCDTemp() {
        this.getCoolerInfo();
        if(!this.hasCooler) {
            this.ccdTemp = 0;
            return this.ccdTemp
        }
        const tempProp = this.properties.number["CCD_TEMPERATURE"]
        //console.log(tempProp.numbers["CCD_TEMPERATURE_VALUE"].value)
        this.ccdTemp = tempProp.numbers["CCD_TEMPERATURE_VALUE"].value
        return this.ccdTemp;
    }

    /**
     * 
     * @param {Number} duration 
     * @param {IndiDevice} device 
     */
    expose(duration) {
        this.setNumber("CCD_EXPOSURE", "CCD_EXPOSURE_VALUE", duration)
    }

    startCooler(){
        this.setSwitch("CCD_COOLER", "COOLER_ON", "On")
    }
}

module.exports = {CCDController, CCD}