export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  firstName: string;
  lastName: string;
  businessAddress?: string;
  businessName?: string;
  userType: "Users" | "Agent/Property Owner" | "Artisan" | "Vendor";
}

export type ForgotPasswordDTO = Omit<LoginDTO, "password">;

export interface verifyOtpDTP {
  email: string;
  newPassword: string;
  otp: string;
}
