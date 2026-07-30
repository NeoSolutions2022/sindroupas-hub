# SindRoupas Hub

Plataforma de gestão do SindRoupas para empresas associadas, atividades, comunicação e financeiro.

## Desenvolvimento local

Requisitos:

- Node.js
- npm

```sh
git clone <URL_DO_REPOSITORIO>
cd sindroupas-hub
npm install
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
VITE_AUTH_URL=http://localhost:3001
VITE_HASURA_URL=http://localhost:8080/v1/graphql
VITE_HASURA_ADMIN_SECRET=seu_admin_secret
VITE_BOLETOS_API_URL=http://localhost:3333
```

Após alterar o `.env`, reinicie `npm run dev` para o Vite recarregar as variáveis.

Em produção com Docker e nginx, as variáveis também são lidas em tempo de execução por meio do arquivo `/env.js`, gerado na inicialização do container.

## Tecnologias

- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS

## Scripts

```sh
npm run dev
npm run build
npm run lint
npm run preview
```
