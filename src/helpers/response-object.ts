import { ResponseObject } from "../types/helpers";

export default ({ message, data, errors, accessToken, others }: ResponseObject) => {
  return {
    message,
    data,
    errors,
    accessToken,
    others
  };
};
