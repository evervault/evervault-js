interface CardData {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export async function setupReveal(request: string): Promise<void> {
  const cardData = await makeRequestAndValidateResponse(request);
  setRevealContent(cardData);
  setupClipboardCopyButton();

  // Overwrite the default copy action to remove spaces from card number
  // when user highlights and copies as opposed to clicking the button
  overwriteCopyAction();
}

async function makeRequestAndValidateResponse(
  requestJson: string
): Promise<CardData> {
  const requestData = JSON.parse(requestJson) as Request;
  const request = new Request(requestData.url, {
    ...requestData,
  });
  const req = await makeRequest(request);
  const response = (await req.json()) as CardData;

  if (!response.cardNumber) {
    throw new Error("No card number found in response");
  }

  if (!response.expiry) {
    throw new Error("No expiration date found in response");
  }

  if (!response.cvv) {
    throw new Error("No cvv found in response");
  }

  return response;
}

function makeRequest(request: Request): Promise<Response> {
  return fetch(request);
}

function setRevealContent(cardData: CardData) {
  const cardNumberElement = document.getElementById("cardnumber");
  if (cardNumberElement) {
    cardNumberElement.textContent = formatAnyLengthCardNumber(
      cardData.cardNumber
    );
  }

  const expiryElement = document.getElementById("expirationdate");
  if (expiryElement) {
    expiryElement.textContent = formatExpiryDate(cardData.expiry.toString());
  }

  const cvvElement = document.getElementById("securitycode");
  if (cvvElement) {
    cvvElement.textContent = cardData.cvv.toString();
  }
}

function formatAmexCardNumber(cardNumber: string): string {
  const formattedCardNumberArray = cardNumber.split("");
  const formattedCardNumberWithSpaces = formattedCardNumberArray
    .map((char, index) => {
      if (index === 4 || index === 10) {
        return ` ${char}`;
      }
      return char;
    })
    .join("");

  return formattedCardNumberWithSpaces;
}

function formatAnyLengthCardNumber(cardNumber: string): string {
  const rawCardNumber = cardNumber.toString().replace(/ /g, "");
  if (rawCardNumber.length === 15) {
    return formatAmexCardNumber(rawCardNumber);
  }

  const formattedCardNumberArray = rawCardNumber.split("");
  const formattedCardNumberWithSpaces = formattedCardNumberArray
    .map((char, index) => {
      if (index % 4 === 0 && index !== 0) {
        return ` ${char}`;
      }
      return char;
    })
    .join("");

  return formattedCardNumberWithSpaces;
}

function formatExpiryDate(expiryDate: string): string {
  const formattedExpiryDateArray = expiryDate.replace(/[ /]/g, "").split("");
  const formattedExpiryDateWithSlash = formattedExpiryDateArray
    .map((char, index) => {
      if (index === 2) {
        return ` / ${char}`;
      }
      return char;
    })
    .join("");

  return formattedExpiryDateWithSlash;
}

function removeFormatting(cardNumber: string): string {
  return cardNumber.replace(/ /g, "");
}

function setupClipboardCopyButton() {
  const copyButton = document.getElementById("copybutton");
  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const cardNumberElement = document.getElementById("cardnumber");
      if (cardNumberElement) {
        const cardNumber = removeFormatting(cardNumberElement.innerHTML);
        navigator.clipboard.writeText(cardNumber).catch(() => {
          console.error("failed to copy card number to clipboard");
        });
        window.parent.postMessage({ type: "EV_REVEAL_COPY_EVENT" }, "*");
      }
    });
  }
}

function overwriteCopyAction() {
  const cardNumberElement = document.getElementById("cardnumber");
  if (cardNumberElement) {
    cardNumberElement.addEventListener("copy", (event) => {
      // Prevent the default copy action
      event.preventDefault();

      const selection = window.getSelection();
      if (selection) {
        const selectedText = selection.toString();
        const cleanedText = removeFormatting(selectedText);
        navigator.clipboard.writeText(cleanedText).catch(() => {
          console.error("failed to overwrite clipboard");
        });
      }
    });
  }
}
