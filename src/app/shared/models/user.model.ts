/**
 * @fileoverview User model definitions for the Contract Processing System
 * Implements strict typing for user data, authentication responses, and role-based access control
 * @version 1.0.0
 * @license MIT
 */

/**
 * User role enumeration
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  CONTRACT_MANAGER = 'CONTRACT_MANAGER',
  REVIEWER = 'REVIEWER',
  BASIC_USER = 'BASIC_USER'
}

/**
 * User model interface defining the structure of user data
 */
export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication response interface containing user data and JWT tokens
 */
export interface IUserResponse {
  /** Authenticated user's profile data */
  user: IUser;
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string;
  /** Token expiration date */
  tokenExpiry: string;
}

export interface IRegistrationResponse {
  message: string;
}