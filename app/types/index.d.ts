import { RecaptchaVerifier } from 'firebase/auth'

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }

  interface Player {
    admin: string;
    id: string;
    fname: string;
    lname: string;
    phone: string;
    ghin: number;
    leagues: string[];
  }

  interface League {
    id: string;
    name: string;
    leagueID: string;
  }
}

export {}