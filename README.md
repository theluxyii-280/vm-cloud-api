# VM Cloud API

API inicial para o futuro app gamer controlar VM, jogo e streaming sem expor chaves da nuvem no APK.

## Rotas

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/vm/status`
- `POST /api/v1/vm/start`
- `POST /api/v1/vm/stop`
- `POST /api/v1/vm/restart`
- `POST /api/v1/session/create`
- `GET /api/v1/game/status`
- `POST /api/v1/game/start`
- `POST /api/v1/game/stop`
- `GET /api/v1/stream/status`
- `POST /api/v1/stream/start`
- `POST /api/v1/stream/stop`

## Primeiro teste

O projeto inicia em `VM_PROVIDER=mock`. Assim as rotas da VM funcionam sem cobrança e sem chave externa.

Teste público:

```bash
curl https://vm-cloud-api.luxyiidev.workers.dev/api/v1/health
```

Para proteger as rotas privadas, crie o secret `APP_API_TOKEN` no painel da Cloudflare ou com Wrangler:

```bash
npx wrangler secret put APP_API_TOKEN
```

Depois envie:

```http
Authorization: Bearer SEU_TOKEN
```

## RunPod real

Quando houver um Pod Linux GPU criado na RunPod, configure:

```text
VM_PROVIDER=runpod
RUNPOD_API_KEY=<secret>
RUNPOD_POD_ID=<secret ou variável>
```

A API usa os endpoints REST oficiais da RunPod para consultar, iniciar, parar e reiniciar o Pod.

## Agent dentro da VM

As rotas `/game/*` e `/stream/*` já estão reservadas para o Agent que será instalado dentro da VM Linux.

Configure futuramente:

```text
VM_AGENT_URL=https://endereco-do-agent
VM_AGENT_TOKEN=<secret>
```

O Worker nunca deve guardar chaves sensíveis diretamente no código-fonte.

## Deploy

```bash
npm install
npm run check
npm run deploy
```
# vm-cloud-api
