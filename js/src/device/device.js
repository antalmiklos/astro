const { newSwitchVector, newNumberVector } = require("indi-client");

class IndiDevice {
    constructor(name, indiClient) {
        this.name = name;
        this.connected = false;
        this.properties = {};
        this.client = indiClient;
        this.type = "generic"
    }

    setupProperties(deviceProperties) {
        this.properties = deviceProperties;
        this._setup = true;
    }

    addOrUpdateProperty(property) {
        if(this.properties[property.type] === undefined) {
            this.properties[property.type] = {}
        }
        this.properties[property.type][property.name] = property;
    }

    // iterate switches, if ccd in any, it's a camera
    isCamera() {
        let result = false;
        if(this.type === "ccd"){
            return true;
        }
        if (Object.keys(this.properties["switch"]).length === 0) {
            return false;
        }

        //console.log(this.name, this.type, this.properties["switch"])
        Object.keys(this.properties["switch"]).forEach(element => {
            if (element.startsWith("CCD")) {
                result = true;
                this.type === "ccd"
            }
        });

        return result;
    }

    isConnected(obj) {
        const connSwitch = obj.switches.filter((sw) => {
            return sw.name === "CONNECT";
        })[0]
        if(connSwitch === undefined) {
            this.connected = false;
            return this.connected;
        }
        this.connected = connSwitch.value === "On"
        return this.connected;
    }

    connect() {
        if (this.connected) {
            return;
        }

        const conn = new newSwitchVector(this.name, "CONNECT", new Date(), 
            [{name: "CONNECT", value: "On"}]
        )

        this.send(conn)
    }

    disconnect() {
        console.log("disconnecting: ", this.name, this.connected)
        if (!this.connected) {
            return;
        }

        const conn = new newSwitchVector(this.name, "CONNECTION", new Date(), 
            [
                {name: "DISCONNECT", value: "On"}
            ]
        )
        this.send(conn)
    }

    setSwitch(propertyName, switchName, value) {
        const newSwitch = new newSwitchVector(
            this.name,
            propertyName,
            new Date(),
            [{name: switchName, value: value}]
        );
        this.send(newSwitch);
    }

    setNumber(propertyName, name, value) {
        const newNumber = new newNumberVector(
            this.name,
            propertyName,
            new Date(),
            [{name: name, value: value}]
        );
        this.send(newNumber);
    }

    setNumbers(propertyName, propValues) {
        const newNumbers = new newNumberVector(
            this.name,
            propertyName,
            new Date(),
            propValues
        );
        this.send(newNumbers);
    }

    send(prop) {
        this.client.send(prop)
    }
}



module.exports = IndiDevice;