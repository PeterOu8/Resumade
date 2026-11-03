import 'next-auth';
import { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    error?: string;
    user: { id?: string } & DefaultSession['user'];
  }
  interface User {
    apiToken?: string;
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    apiToken?: string;
    apiUserId?: string;
    error?: string;
  }
}
