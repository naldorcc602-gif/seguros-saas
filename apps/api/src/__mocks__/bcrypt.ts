// Mock de bcrypt para testes — evita compilar o binding nativo neste
// ambiente. PasswordService é testado isoladamente (mockado) nos specs que
// dependem dele; este stub só existe para satisfazer a resolução de módulo
// de arquivos que importam bcrypt transitivamente.
export function hash(value: string): Promise<string> {
  return Promise.resolve(`hashed:${value}`);
}
export function compare(value: string, hash: string): Promise<boolean> {
  return Promise.resolve(hash === `hashed:${value}`);
}
