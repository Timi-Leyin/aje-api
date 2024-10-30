export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  firstName: string;
  lastName: string;
}

export type ForgotPasswordDTO = Omit<LoginDTO, "password">;

export interface verifyOtpDTP {
  email: string;
  newPassword: string;
  otp: string;
}
