#!/bin/sh
# infra/scripts/init-ssl.sh
#
# Emite o certificado Let's Encrypt (primeira vez) e ativa o bloco HTTPS do
# Nginx. Rode isso DEPOIS que a aplicação já estiver de pé em HTTP simples
# (`./infra/scripts/deploy.sh producao`) e o domínio já estiver resolvendo
# publicamente para o IP do servidor — certbot precisa alcançar
# http://SEU_DOMINIO/.well-known/acme-challenge/... de fora para validar.
#
# Uso:
#   DOMAIN=seudominio.com CERTBOT_EMAIL=admin@seudominio.com ./infra/scripts/init-ssl.sh
#
# Idempotente: se já existir um certificado válido para o domínio, o
# certbot não emite um novo (só renova perto do vencimento, o que já é
# coberto pelo serviço `certbot` do docker-compose.yml rodando em loop).

set -eu

DOMAIN="${DOMAIN:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [ -z "$DOMAIN" ] || [ -z "$CERTBOT_EMAIL" ]; then
  echo "Uso: DOMAIN=seudominio.com CERTBOT_EMAIL=admin@seudominio.com $0" >&2
  exit 1
fi

echo "[init-ssl] Confirmando que o Nginx está de pé em HTTP (necessário para o desafio ACME)..."
docker compose up -d nginx

echo "[init-ssl] Emitindo o certificado para ${DOMAIN}..."
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

echo "[init-ssl] Gerando a configuração do Nginx com SSL ativado..."
sed "s|\${DOMAIN}|${DOMAIN}|g" \
  infra/nginx/conf.d/production-ssl.conf.template \
  > infra/nginx/conf.d/default.conf

echo "[init-ssl] Recarregando o Nginx..."
docker compose exec nginx nginx -s reload

echo "[init-ssl] SSL ativado para https://${DOMAIN}"
echo "[init-ssl] O serviço 'certbot' do docker-compose.yml já cuida da renovação automática — nada mais a fazer."
