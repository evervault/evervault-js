require("dotenv").config();

window.__EVERVAULT_TEST_CLIENT_ = new window.Evervault(
    process.env.EV_TEAM_UUID,
    process.env.EV_APP_UUID
)

window.__EV_TEST_ENCRYPT_ = function (value) {
    return window.__EVERVAULT_TEST_CLIENT_.encrypt(value);
}
