class Mount {
    constructor() {
        this.target = {Ra: 0, Dec: 0}
        this.current = {Ra: 0, Dec: 0}
        this.name = "";
        this.type = "mount"
    }

    setTarget(target) {
        this.target = target
    }

    setCurrent(current) {
        this.current = current
    }

    getError(precision = 5) {
        const raError = Number((this.target.Ra - this.current.Ra).toFixed(precision))
        const decError = Number((this.target.Dec - this.current.Dec).toFixed(precision))
        return {
            Ra: raError,
            Dec: decError
        }
    }
}

module.exports = Mount