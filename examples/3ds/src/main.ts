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

const modal = document.getElementById("myModal");
const threeds = evervault.ui.threeds();
const span = document.getElementsByClassName("close")[0];

const receiveMessage = (event: MessageEvent) => {
    if (event.data === "3ds-complete") {
        modal.style.display = "none";
        threeds.unmount();
    }
}

const btn = document.getElementById("purchase");

window.addEventListener("message", receiveMessage, false);



if (btn && modal) {
  btn?.addEventListener("click", () => {
    modal.style.display = "block";
    threeds.mount("#mc");
  });

  span.addEventListener("click", () =>{
    modal.style.display = "none";
    threeds.unmount();
  });
  
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      threeds.unmount();
    }
  }
}