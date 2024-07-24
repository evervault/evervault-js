import "./style.css";

// themes can just be objects, however, here we are using a function so that we can update the theme
// when the card type is detected.
const theme = (
  opts: {
    showIcon?: boolean;
  } = {}
) => ({
  styles: {
    fieldset: {
      position: "relative",
    },

    label: {
      display: "none",
    },

    input: {
      padding: 15,
      fontSize: 18,
      outline: "none",
      border: "2px solid #ccc",

      "&::placeholder": {
        color: "#aaa",
      },
    },

    "fieldset[ev-valid=false]": {
      paddingBottom: 15,

      "& input": {
        borderColor: "#f00",
      },
    },

    ".field": {
      position: "unset",
    },

    ".error": {
      left: 0,
      bottom: 0,
      color: "#f00",
      fontSize: 14,
      display: "none",
      position: "absolute",
    },

    ".field[ev-valid=false]:nth-child(1) .error": {
      display: "block",
    },

    "[ev-valid=true]:nth-child(1) + [ev-valid=false] .error": {
      display: "block",
    },

    "[ev-valid=true]:nth-child(1) + [ev-valid=true]:nth-child(2) + [ev-valid=false] .error":
      {
        display: "block",
      },

    '.field[ev-name="expiry"] input': {
      top: 0,
      right: 60,
      width: "100px",
      position: "absolute",
      borderColor: "transparent",
      transition: "transform 0.2s ease",
      transform: opts.showIcon ? "translateX(-50px)" : "translateX(0)",
    },

    '.field[ev-name="cvc"] input': {
      top: 0,
      right: 0,
      width: 80,
      position: "absolute",
      textAlign: "right",
      borderColor: "transparent",
      transition: "transform 0.2s ease",
      transform: opts.showIcon ? "translateX(-50px)" : "translateX(0)",
    },
  },
});

const evervault = new window.Evervault(
  "team_3db7422f8262",
  "app_eead1d640d7c",
  {
    urls: {
      keysUrl: "https://keys.evervault.io",
      apiUrl: "https://api.evervault.io",
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL as string,
    },
  }
);

window.evervault = evervault;

const card = evervault.ui.card({ 
  theme: theme()
});

card.on("ready", () => {
  document.body.classList.add("ready");
});

const cardIcon: HTMLElement = document.querySelector(".card-icon")!;

card.on("change", (values) => {
  console.log("change", values);
  if (!cardIcon) return;

  if (values.card.brand) {
    cardIcon.dataset.type = values.card.brand;
    cardIcon.classList.add("show");
    card.update({ theme: theme({ showIcon: true }) });
  } else {
    cardIcon.classList.remove("show");
    card.update({ theme: theme() });
  }
});

card.on("complete", (values) => {
  console.log("complete", values);
});

card.on("ready", () => {
  console.log("component is ready");
});

const holder = document.getElementById("holder")! as HTMLInputElement;

card.on("swipe", (values) => {
  if (values.firstName) {
    holder.value = `${values.firstName} ${values.lastName}`;
  }
});

card.mount("#card");
