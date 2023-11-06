const fs = require("fs");
const Mount = require("./src/mount/mount.js")
const indiController = require("./src/controller.js")
const {CCDController, CCD} = require('./src/camera/ccd.js')

var readline = require('readline');
readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY)
    process.stdin.setRawMode(true);

process.stdin.on('keypress', (chunk, key) => {
    if(key.sequence === "a") {
        stopSlew();
    }

    if(key.sequence === "e") {
        const device = devices['CCD Simulator']
    }

    if(key.sequence === "g") {
        goto();
    }

    if(key.sequence === "c") {
        const device = devices['CCD Simulator']
        device.getCoolerInfo();
        console.log(device.ccdTemp)
    }

    if(key.sequence === "p") {
        controller.gotoPrevious();
    }

    if(key.sequence === "t") {
        const device = devices['Telescope Simulator']
        device.setSwitch("TELESCOPE_TRACK_STATE", "TRACK_ON", "On")
        device.setSwitch("TELESCOPE_TRACK_MODE", "TRACK_SIDEREAL", "On")
    }

    if(key.sequence === "l") {
        console.log(devices["Telescope Simulator"].properties)
    }

    if(key.sequence === "x") {
        devices[mainCamera].disconnect();
    }
});

const {
    getProperties,
    enableBLOB,
    mapping,
    newSwitchVector,
    newTextVector,
    newNumberVector,
    INDIClient,
    setBLOBVector,
    defSwitch,
    oneSwitch,
    setSwitchVector,
    defSwitchVector,
    defNumberVector,
    setNumberVector,
} = require("indi-client");

const IndiDevice = require("./src/device/device.js");

const indiHost = process.env.INDI_HOST || "127.0.0.1";
const indiPort = process.env.INDI_PORT ? parseInt(process.env.INDI_PORT) : 7624;

const indiClient = new INDIClient(indiHost, indiPort);

indiClient.on("connect", () => {
    console.log("indi connection up, getting properties");
    indiClient.getProperties();
    indiClient.send(new getProperties())
    indiClient.enableBLOB(null, null, "Also"); // Get blobs as well as everything else.
    setInterval(()=>{
        indiClient.getProperties()
    }, 10000)

})

indiClient.on("close", () => {
    console.log("indi connection closed");
})

indiClient.on("error", (err) => {
    console.log("indi error: " + err);
})

indiClient.connect();

const devices = {};
const mount = new Mount();
const mainCamera = "CCD Simulator"
const controller = new indiController(indiClient, mount)
controller.setPrimaryCamera(mainCamera)
controller.setGuideCamera("CCD2")

function stopSlew() {
    const slew = new newSwitchVector(
        "Telescope Simulator",
        "TELESCOPE_ABORT_MOTION",
        new Date(),
        [{name: "ABORT", value: "On"}]
    )
    indiClient.send(slew);
}

function initDevices() {
    Object.keys(devices).forEach(key => {
        try{
            if(devices[key] instanceof CCD) {
                return;
            }
            if(devices[key].type === "ccd") {
                return;
            }
            if(devices[key].isCamera()) {
                const ccd = new CCD(key, indiClient)
                const props = Object.assign({}, devices[key].properties)
                delete devices[key]
                ccd.setupProperties(props);
                ccd.getCoolerInfo();
                devices[key] = ccd
            }
        } catch(e) {
            console.log(e.message)
        }
    });
}

// define listeners for various SSEs
function init() {
    Object.keys(mapping).forEach(key => {
        indiClient.on(key, (obj) => {
            if(obj instanceof defSwitchVector || obj instanceof setSwitchVector) {
                const switches = obj.switches
                const switchObj = {};
                switches.forEach((sw) => {
                    switchObj[sw.name] = sw
                })
                if(devices[obj.device] === undefined) {
                    devices[obj.device] = new IndiDevice(obj.device, indiClient)
                }
                if(devices[obj.device] instanceof IndiDevice) {
                    devices[obj.device].addOrUpdateProperty({name: obj.name, switches: switchObj, type: "switch", label: obj.label, group: obj.group})
                }
            }
            if(obj instanceof defNumberVector || obj instanceof setNumberVector) {
                const numbers = obj.numbers
                const numbersObj = {};
                numbers.forEach((sw) => {
                    numbersObj[sw.name] = sw
                })
                if(devices[obj.device] === undefined) {
                    devices[obj.device] = new IndiDevice(obj.device, indiClient)
                }
                if(devices[obj.device] instanceof IndiDevice) {
                    devices[obj.device].addOrUpdateProperty({name: obj.name, numbers: numbersObj, type: "number", label: obj.label})
                }
            }

            if(obj.name === "CONNECTION") {
                devices[obj.device].isConnected(obj)
            }
    
            if(obj.name === "TARGET_EOD_COORD") {
                mount.setTarget({Ra: obj.numbers[0].value, Dec: obj.numbers[1].value})
            }

            if(obj.name.startsWith("CCD")) {
                //console.log(obj.name)
                //console.log(devices[obj.device].properties)
            }

            if(obj.name === "CCD_TEMPERATURE") {
                devices[obj.device].getCCDTemp();
            }

            if(obj.name === "TARGET_EOD_COORD") {
                mount.setTarget({Ra: obj.numbers[0].value, Dec: obj.numbers[1].value})
            }
    
            if(obj.name === "TELESCOPE_TRACK_STATE") {
                //console.log(obj)
            }
            
            if(obj.name === "TELESCOPE_TRACK_MODE") {
                //console.log(obj)
            }
    
            if(obj.name === 'EQUATORIAL_EOD_COORD') {
                mount.setCurrent({Ra: obj.numbers[0].value, Dec: obj.numbers[1].value})
                //console.log(`\rRa: ${mount.current.Ra} Dec: ${mount.current.Dec}`)
            }
    
            if(obj.name === "CCD_EXPOSURE") {
                if(obj.state === "Busy" && obj.numbers[0] !== undefined) {
                    console.log("exposing: "+ Number(obj.numbers[0].value).toFixed(0))
                }
            }
            initDevices(obj)
        })
    });
}

function goto() {
    const ra = 18.628693545041624
    const dec = 38.80819213476307
    const device = devices["Telescope Simulator"]
    device.setNumbers("EQUATORIAL_EOD_COORD", [{name: "RA", value: ra}, {name: "DEC", value: dec}])
}

function stopTracking(){
    const stopTrack = new newSwitchVector(
        controller.mount.name,
        "TELESCOPE_TRACK_STATE",
        new Date(),
        [
            {name: "TRACK_OFF", value: "On"}
        ]
    )
    tracking = false
    console.log(controller.mount.name || "kaki")
    indiClient.send(stopTrack);
}

function startCooler(){
    const stopTrack = new newSwitchVector(
        controller.primaryCamera,
        "CCD_COOLER",
        new Date(),
        [
            {name: "COOLER_ON", value: "Off"},
            {name: "COOLER_OFF", value: "On"},
        ]
    )
    console.log(controller.primaryCamera)
    indiClient.send(stopTrack);
}

function startTracking() {
    const startTrack = new newSwitchVector(
        controller.mount.name,
        "TELESCOPE_TRACK_STATE",
        new Date(),
        [
            {name: "TRACK_ON", value: "On"},
        ]
    )
    tracking = true
    console.log(controller.mount.name)
    indiClient.send(startTrack);
}

// receiving images
indiClient.on('setBLOBVector', (obj) => {
    const data = new setBLOBVector()
    Object.keys(obj).forEach(key => {
        data[key] = obj[key]
    })
    const headerTabSize = 80;
    let buff = Buffer.alloc(obj.blobs[0].size);
    buff.write(obj.blobs[0].value, 'base64')
    fs.writeFile("out.fit", buff.toString('ascii'), (err) => {
        if (err) {
            console.error(err);
        }
    });
    let endTag = new Array(80)
    endTag.push("END".split(""));
    endTag.fill(" ")
    let headerEnd = buff.indexOf(endTag.join("")) - 3
    let header = buff.subarray(0, headerEnd)
    const headerTabs = Math.floor(header.length / headerTabSize);
    let headerObj = {};
    let current = 0;
    for (let i = 0; i <= headerTabs; i++) {
        const element = header.subarray(current, current + headerTabSize);
        current = i * 80;
        if (element.toString().startsWith("COMMENT")) {
            continue;
        }
        let data = element.toString().split("=");
        let tag = data[0].trim();
        let value = data[1].split("/")[0].replace("'", '').replace("'", '').trim();
        let comment = data[1].split("/")[1].trim();
        headerObj[tag] = { 'value': value, 'commnent': comment };
    }
    console.log("image received")
});

init();