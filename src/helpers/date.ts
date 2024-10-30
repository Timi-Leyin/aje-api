export const checkExpiration = (
  expiresIn: string,
  createdAt: string | Date
) => {
  const expirationTime = expiresIn === "5m" ? 5 * 60 * 1000 : 60 * 60 * 1000;
  const expirationDate = new Date(
    new Date(createdAt).getTime() + expirationTime
  );
  const isExpired = expirationDate < new Date();
  return isExpired;
};
