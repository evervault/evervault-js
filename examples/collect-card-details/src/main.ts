import "./style.css";

const evervault = new window.Evervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID,
  {
    urls: {
      keysUrl: import.meta.env.VITE_KEYS_URL as string,
      apiUrl: import.meta.env.VITE_API_URL as string,
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL as string,
    },
  }
);

const themeBg1 = (utilities) => {
  return {
    styles: {
      label: {
        width: '16.66666667%',
        textAlign: 'right',
        padding: '0 15px',
        fontWeight: '700',
        fontSize: 14,
        textTransform: 'uppercase',
        ...utilities.media("(max-with: 678px)", {
          label: {
            textAlign: 'left',
            whiteSpace: 'nowrap',
          },
        })
      },
      '.field input': {
        fontSize: "14px",
        margin: "0 15px",
        minHeight: "34px",
        borderRadius: "4px",
        padding: '8px 12px',
        border: 'border: 20px solid #ccc',
        ...utilities.media("(max-with: 888px)", {
          input: {
            width: 'calc(33.33333333% - 30px)'
          },
        }),
        ...utilities.media("(max-with: 678px)", {
          input: {
            width: 'calc(100% - 30px)'
          },
        })
      },
      '.field:focus-within input': {
        borderColor: '#66afe9',
        outline: 0,
        transition: "0.15s !important",
        boxShadow: "inset 0 1px 1px rgb(0 0 0 / 8%), 0 0 8px rgb(102 175 233 / 60%);"
      },
    },
  }
}


const card = evervault.ui.card({
  icons: true,
  theme: themeBg1
});

card.on("change", (values) => {
  console.log("change", values);
});

card.on("swipe", (values) => {
  console.log("swipe", values);
});

card.on("validate", (values) => {
  console.log("validate", values);
});

card.on("blur", (field) => {
  console.log("blur", field);
});

card.on("focus", (field) => {
  console.log("focus", field);
});

card.on("keyup", (field) => {
  console.log("keyup", field);
});

card.on("keydown", (field) => {
  console.log("keydown", field);
});

card.mount("#form");

const btn = document.getElementById("purchase");
const output = document.getElementById("output");

btn?.addEventListener("click", () => {
  if (!output) return;
  output.innerText = "";
  card.validate();

  if (card.values.isComplete) {
    console.log("Valid!", card.values);
    const { number, expiry, cvc } = card.values.card;
    output.innerHTML += "Thank you for your purchase! <br /><br />";
    output.innerHTML += `Your card number is ${number} <br /><br />`;
    output.innerHTML += `Your card expiry is ${expiry.month}/${expiry.year} <br /><br />`;
    output.innerHTML += `Your card cvc is ${cvc}`;
  } else {
    console.log("Invalid!", card.values);
    output.innerText = "Please enter valid card details";
  }
});
