import bcryptjs from "bcryptjs";
export const hashPassword = async (password: string) => {
  return await bcryptjs.hash(password, 10);
};
export const comaparePassword = async (password: string, hashed: string) => {
  return await bcryptjs.compare(password, hashed);
};
