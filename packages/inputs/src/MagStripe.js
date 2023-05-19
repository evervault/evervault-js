const mostRecentPresses = [];

const toTitleCase = (name) => {
    return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
}

const parseName = (nameData) => {
    const splitName = nameData.split('/');
    const surname = toTitleCase(splitName[0]);
    const firstName = toTitleCase(splitName[1].split('.')[0]);
    return `${firstName} ${surname}`;
}

const parseTrackOne = (trackOneData) => {
    const data = trackOneData.split('^');
    const number = data[0];
    const name = parseName(data[1]);
    const expYear = data[2].substring(0, 2);
    const expMonth = data[2].substring(2, 4);
    return {
        number,
        name,
        expMonth,
        expYear
    }
}

const parseTrackTwo = (trackOneData) => {
    const data = trackOneData.split('=');
    const number = data[0];
    const expYear = data[1].substring(0, 2);
    const expMonth = data[1].substring(2, 4);
    return {
        number,
        expMonth,
        expYear
    }
}

const parseCard = (cardString) => {
    if (cardString.substring(0, 2).toLowerCase() == "%B".toLowerCase()) {
        const tracks = cardString.split('?;');
        const trackOne = tracks[1] ? `${tracks[0]}?` : tracks[0];
        const trackTwo = tracks[1] ? `;${tracks[1]}` : undefined;
        return {
            trackOne,
            trackTwo,
            ...parseTrackOne(trackOne.substring(2))
        }
    } else if (cardString.substring(0, 1) == ";") {
        return {
            trackTwo: cardString,
            ...parseTrackTwo(cardString.substring(1))
        };
    }
}

export class MagStripe {
    /**
     * @type {import('./InputElementsManager').InputElementsManager}
     */
    #inputsManager;

    #mostRecentPresses;

    /**
     * 
     * @param {import('./InputElementsManager').InputElementsManager} inputsManager 
     */
    constructor(inputsManager) {
        this.#inputsManager = inputsManager;
        this.#mostRecentPresses = [];
    }

    swipeCapture = (event) => {
        this.#mostRecentPresses.push(event.key);
        if (this.#mostRecentPresses.slice(-2).join("") === "%B") {
            this.#mostRecentPresses.splice(0, this.#mostRecentPresses.length - 2);
        }
        if (this.#mostRecentPresses.slice(0, 2).join("") !== "%B" && this.#mostRecentPresses.slice(-1)[0] === ";") {
            this.#mostRecentPresses.splice(0, this.#mostRecentPresses.length - 1);
        }
        if (this.#mostRecentPresses.slice(0, 2).join("") == "%B"
            && JSON.stringify(this.#mostRecentPresses.slice(-2)) == JSON.stringify(["?", "Enter"])) {
            // If track one and track two are present
            console.debug("Card swipe: Track 1 and 2 present");
            const trackData = this.#mostRecentPresses.slice(0, -1).join("");
            const { number, name, expMonth, expYear, trackOne, trackTwo } = parseCard(trackData);
            this.#inputsManager.masks.cardNumber.unmaskedValue = number;
            this.#inputsManager.masks.expirationDate.value = `${expMonth} / ${expYear}`;

            document.getElementById("name").value = name;
            document.getElementById("trackdata").value = trackData;
            document.getElementById("trackone").value = trackOne;
            document.getElementById("tracktwo").value = trackTwo;

            this.#inputsManager.els.cardNumber.dispatchEvent(new Event("input"));
            this.#inputsManager.els.cardNumber.disabled = true;
            this.#inputsManager.els.expirationDate.disabled = true;
    
            this.#mostRecentPresses.length = 0;
        } else if (this.#mostRecentPresses[0] === ";"
            && JSON.stringify(this.#mostRecentPresses.slice(-2)) == JSON.stringify(["?", "Enter"])) {
            console.debug("Card swipe: Track 2 present");
            // If just track two is present
            const trackData = this.#mostRecentPresses.slice(0, -1).join("");
            const { number, expMonth, expYear, trackTwo } = parseCard(trackData);

            this.#inputsManager.masks.cardNumber.unmaskedValue = number;
            this.#inputsManager.masks.expirationDate.value = `${expMonth} / ${expYear}`;

            document.getElementById("name").value = "";
            document.getElementById("trackdata").value = trackData;
            document.getElementById("trackone").value = "";
            document.getElementById("tracktwo").value = trackTwo;
            
            this.#inputsManager.els.cardNumber.dispatchEvent(new Event("input"));
            this.#inputsManager.els.cardNumber.disabled = true;
            this.#inputsManager.els.expirationDate.disabled = true;
    
            this.#mostRecentPresses.length = 0;
        }
    };
}