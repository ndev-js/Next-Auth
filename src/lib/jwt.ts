import jwt, { JwtPayload } from "jsonwebtoken";

interface SignOption {
  expiresIn: string | number;
}

const DEFAULT_SIGN_OPTIOM: SignOption = {
  expiresIn: "1d",
};

export function signJWT(
  payload: JwtPayload,
  option: SignOption = DEFAULT_SIGN_OPTIOM
) {
  const secretKey = process.env.JWT_USER_ID_SECRET!;
  const token = jwt.sign(payload, secretKey);
  return token;
}

export function verifyJWT(token: string) {
  try {
    const secretKey = process.env.JWT_USER_ID_SECRET!;
    const decoded = jwt.verify(token, secretKey);
    return decoded as JwtPayload;
  } catch (error) {
    console.log(error);
    return null;
  }
}
