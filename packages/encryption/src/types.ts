export interface AppKey {
  teamUuid: string;
  appUuid: string;
  key: string;
  ecdhKey: string;
  ecdhP256Key: string;
  ecdhP256KeyUncompressed: string;
  isDebugMode: boolean;
}
