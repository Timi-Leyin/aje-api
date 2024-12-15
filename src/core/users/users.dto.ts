import { RegisterDTO } from "../auth/auth.dto";

export interface updateProfileDTO extends RegisterDTO {
  bio: string;
  phone: string;
  skills?:string
  //   gender
}
