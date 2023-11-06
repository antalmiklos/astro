const { newNumberVector } = require("indi-client")

class indiController {
    constructor(client, mount) {
        this.client = client
        this.mount = mount
        this.primaryCamera = "";
        this.guideCamera = "";
        this.prevTarget = {Ra: 0, Dec: 0}
    }

    setPrimaryCamera(cameraName) {
        this.primaryCamera = cameraName;
    }

    setGuideCamera(cameraName) {
        this.guideCamera = cameraName;
    }

    gotoPrevious() {
        this.gotoTarget(this.prevTarget.Ra, this.prevTarget.Dec)
    }

    gotoTarget(ra, dec) {
        this.prevTarget = this.mount.target
        console.log(`goto: ${ra}, ${dec} ${this.mount.name || "kaki"}`)
        const goto = new newNumberVector(
            this.mount.name,
            "EQUATORIAL_EOD_COORD",
            null,
            [   
                {name: "RA", value: ra},
                {name: "DEC", value: dec}
            ]
        )
        this.client.send(goto);
    }

    expose(camera, duration) {
        const exposure = new newNumberVector(
            "camera",
            "CCD_EXPOSURE",
            new Date(),
            [{name: "CCD_EXPOSURE_VALUE", value: duration}]
        )
        this.client.send(exposure);
    }
}

module.exports = indiController