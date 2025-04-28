export default class Encryption {
  team: string;
  app: string;

  constructor(team: string, app: string) {
    this.team = team;
    this.app = app;
  }

  async encrypt(text: string): Promise<string> {
    return "encrypted text";
  }
}
