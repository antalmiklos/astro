const { newNumberVector } = require("indi-client")

class indiController {
    constructor(client) {
        this.client = client
    }

    gotoTarget(ra, dec) {
        console.log(`goto: ${ra}, ${dec}`)
        const goto = new newNumberVector(
            "Telescope Simulator",
            "EQUATORIAL_EOD_COORD",
            null,
            [   
                {name: "RA", value: ra},
                {name: "DEC", value: dec}
            ]
        )
        this.client.send(goto);
    }
}

module.exports = indiController