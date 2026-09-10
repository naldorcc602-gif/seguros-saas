export function toDataURL(): Promise<string> {
  return Promise.resolve('data:image/png;base64,mock');
}
export default { toDataURL };
