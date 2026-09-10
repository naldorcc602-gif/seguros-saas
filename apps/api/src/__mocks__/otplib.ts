export const authenticator = {
  generateSecret: () => 'MOCKSECRET',
  keyuri: () => 'otpauth://totp/mock',
  verify: () => true,
};
