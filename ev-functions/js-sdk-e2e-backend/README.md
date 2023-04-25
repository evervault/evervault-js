# JS SDK Decryption Test End-to-End Backend

This is a simple backend for testing the JS SDK decryption end-to-end tests in playwright.

## Running the backend

Send a POST request to the backend url with the following JSON body:

```json
{
  "unencrypted": "<unencrypted string>",
  "encrypted": "<encrypted string>"
}
```

The function will decrypt `encrypted` and macth it against `unencrypted`.

If they match, the function will return:

```json
{
  "sucess": true
}
```
