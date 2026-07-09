/* eslint-disable @typescript-eslint/no-namespace */

export interface AuthUser {
  id: string
  username: string
  displayName: string
  roles: string[]
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}
