/**
 * Faz o PUT direto para a URL pré-assinada do S3/R2 — o arquivo nunca passa
 * pelo nosso backend (ver StorageService, Fase 9). `onProgress` usa
 * XMLHttpRequest (não fetch) porque fetch ainda não tem um evento de
 * progresso de upload padronizado em todos os navegadores.
 */
export function uploadFileToPresignedUrl(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Falha no upload (status ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Falha de rede durante o upload.'));

    xhr.send(file);
  });
}

/** Tenta obter a localização aproximada do navegador (com permissão do usuário) — usado só no portal público. */
export function tryGetBrowserGeolocation(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`),
      () => resolve(undefined), // usuário negou ou timeout — segue sem geolocalização, não bloqueia o upload
      { timeout: 5000 },
    );
  });
}
