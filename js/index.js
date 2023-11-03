const Mount = require("./src/mount/mount.js")
const indiController = require("./src/controller.js")

let tracking = false

var readline = require('readline');
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
    process.stdin.setRawMode(true);
process.stdin.on('keypress', (chunk, key) => {
    if(key.sequence === "a") {
        stopSlew();
    }
    if(key.sequence === "e") {
        exposure(5);
    }
    if(key.sequence === "g") {
        goto();
    }
    if(key.sequence === "t") {
        toggleTracking();
    }
    if(key.sequence === "l") {
        console.log(devices)
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
} = require("indi-client");


const indiHost = process.env.INDI_HOST || "127.0.0.1";
const indiPort = process.env.INDI_PORT ? parseInt(process.env.INDI_PORT) : 7624;

const indiClient = new INDIClient(indiHost, indiPort);
const controller = new indiController(indiClient)

indiClient.on("connect", () => {
    console.log("indi connection up, getting properties");
    indiClient.getProperties();
    indiClient.send(new getProperties())
    indiClient.enableBLOB(null, null, "Also"); // Get blobs as well as everything else.
})

indiClient.on("close", () => {
    console.log("indi connection closed");
})

indiClient.on("error", (err) => {
    console.log("indi error: " + err);
})

indiClient.connect();

const devices = new Set();
const mount = new Mount()
const mainCamera = "CCD1"

function stopSlew() {
    const slew = new newSwitchVector(
        "Telescope Simulator",
        "TELESCOPE_ABORT_MOTION",
        new Date(),
        [{name: "ABORT", value: "On"}]
    )
    indiClient.send(slew);
}

Object.keys(mapping).forEach(key => {
    indiClient.on(key, (obj) => {
        if (obj.name === 'ACTIVE_DEVICES') {
            obj.texts.forEach(element => {
                if(element.name === "ACTIVE_TELESCOPE" && mount.name !== element.value) {
                    mount.name = element.value
                    console.log("mount name: "+mount.name)
                }

                const val = element.value
                devices.add(val)
            })
        }
        if(obj.name === "TARGET_EOD_COORD") {
            mount.setTarget({Ra: obj.numbers[0].value, Dec: obj.numbers[1].value})
        }

        if(obj.name === 'EQUATORIAL_EOD_COORD') {
            mount.setCurrent({Ra: obj.numbers[0].value, Dec: obj.numbers[1].value})
            process.stdout.clearLine(0);
            process.stdout.write(`\rRa: ${mount.getError().Ra} Dec: ${mount.getError().Dec}`)
            process.stdout.cursorTo(0);
        }

        if(obj.name === "ON_COORD_SET") {
        }
        if(String(obj.name).includes("IPS")) {
            console.log(obj)
        }

        if(obj.name === "CCD_EXPOSURE") {
            if(obj.state === "Busy" && obj.numbers[0] !== undefined) {
                console.log("exposing: "+ Number(obj.numbers[0].value).toFixed(0))
            }
        }
    })
});

function exposure(time = 3) {
    const exposure = new newNumberVector(
        "CCD Simulator",
        "CCD_EXPOSURE",
        new Date(),
        [{name: "CCD_EXPOSURE_VALUE", value: time}]
    )
    indiClient.send(exposure);
}



function goto() {
    const ra = 18.628693545041624
    const dec = 38.80819213476307
    controller.gotoTarget(ra, dec)
}

function toggleTracking() {
    tracking ? stopTracking() : startTracking();
}

function stopTracking(){
    const stopTrack = new newSwitchVector(
        "Telescope Simulator",
        "TELESCOPE_TRACK_STATE",
        new Date(),
        [
            {name: "TRACK_ON", value: "Off"},
            {name: "TRACK_OFF", value: "On"}
        ]
    )
    tracking = false
    indiClient.send(stopTrack);
}

function startTracking() {
    const startTrack = new newSwitchVector(
        "Telescope Simulator",
        "TELESCOPE_TRACK_STATE",
        new Date(),
        [
            {name: "TRACK_ON", value: "On"},
            {name: "TRACK_OFF", value: "Off"}
        ]
    )
    tracking = true
    indiClient.send(startTrack);
}

// receiving images
indiClient.on('setBLOBVector', (obj) => {
    if(obj.name !== mainCamera) {
        return;
    }
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
    console.log(Number(headerObj.RA.value))
    console.log(Number(headerObj.DEC.value))
    console.log("image received")
});
