#!/bin/sh
# infra/scripts/smoke-test.sh
#
# Roda logo após o deploy (chamado por deploy.sh) para confirmar que os
# serviços essenciais estão de pé. NÃO substitui os testes automatizados da
# Fase 14 — é uma checagem rasa e rápida (segundos, não minutos) de que o
# deploy não quebrou nada óbvio, pensada para rodar em produção sem criar
# dados de teste (ao contrário do auth.e2e-spec.ts, que registra um tenant).
#
# Uso:
#   BASE_URL=https://seudominio.com ./infra/scripts/smoke-test.sh
#   (default: http://localhost)

set -eu

BASE_URL="${BASE_URL:-http://localhost}"
FAILED=0

check_get() {
  description="$1"
  url="$2"
  expected_status="$3"

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")

  if [ "$status" = "$expected_status" ]; then
    echo "[smoke-test] OK   - $description ($status)"
  else
    echo "[smoke-test] FAIL - $description (esperado $expected_status, recebido $status)"
    FAILED=1
  fi
}

check_post() {
  description="$1"
  url="$2"
  body="$3"
  expected_status="$4"

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST -H "Content-Type: application/json" -d "$body" "$url" || echo "000")

  if [ "$status" = "$expected_status" ]; then
    echo "[smoke-test] OK   - $description ($status)"
  else
    echo "[smoke-test] FAIL - $description (esperado $expected_status, recebido $status)"
    FAILED=1
  fi
}

echo "[smoke-test] Testando contra: $BASE_URL"

# A API vive sob /api/ no Nginx (location /api/ remove o prefixo antes de
# repassar para o container da api — ver infra/nginx/conf.d/default.conf).
# /docs tem uma location própria, sem prefixo. / é o front-end (Next.js).
check_get  "Health check da API"                  "$BASE_URL/api/health"           200
check_get  "Swagger (/docs) está de pé"           "$BASE_URL/docs"                  200
check_post "Login com corpo inválido retorna 400" "$BASE_URL/api/auth/login" '{}'   400
check_get  "Rota protegida sem token retorna 401" "$BASE_URL/api/dashboard/summary" 401
check_get  "Frontend (Next.js) responde"          "$BASE_URL/"                      200

if [ "$FAILED" -eq 1 ]; then
  echo "[smoke-test] FALHOU — pelo menos uma checagem não passou. Veja os logs acima."
  exit 1
fi

echo "[smoke-test] Todas as checagens passaram."
