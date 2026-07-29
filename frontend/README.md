# Frontend Tomichi — MVP 1

Frontend final do primeiro MVP do Tomichi, preparado para:

- página pública;
- criação de conta;
- login;
- página do usuário;
- listagem, criação, edição e exclusão de tasks;
- modo claro e modo escuro;
- uso responsivo por teclado, celular e desktop.

## Decisão de arquitetura

O frontend ativo usa apenas **Jinja2, CSS e JavaScript nativo**. Não existe etapa
de build, gerenciador de pacotes ou framework JavaScript.

Essa escolha é intencional:

- o backend atual já renderiza templates Jinja2;
- o tamanho do MVP não justifica React, TanStack, Radix ou dezenas de componentes;
- cada script tem uma responsabilidade clara;
- o navegador recebe apenas os arquivos realmente usados;
- a integração pode ser feita copiando a pasta para o projeto FastAPI.

## Estrutura

```text
frontend2/
├── README.md
├── templates/
│   ├── base.html
│   ├── homepage.html
│   ├── register.html
│   ├── login.html
│   └── dashboard.html
└── static/
    ├── css/
    │   └── app.css
    └── js/
        ├── app.js
        ├── auth.js
        └── tasks.js
```

## Como integrar ao projeto atual

O backend analisado procura os templates em `frontend/templates` e monta a pasta
`frontend` no caminho `/static`.

Existem duas formas válidas de usar este pacote:

1. Substituir o conteúdo da pasta `frontend` atual pelo conteúdo de `frontend2`.
2. Manter o nome `frontend2` e alterar no backend:
   - `StaticFiles(directory="frontend2")`;
   - todas as instâncias de `Jinja2Templates(directory="frontend2/templates")`.

Não mantenha os dois frontends ativos em paralelo. Isso criaria duas fontes de
verdade para as mesmas páginas.

### Rotas web esperadas

| Método | Rota | Template | Situação no backend analisado |
|---|---|---|---|
| `GET` | `/homepage/` | `homepage.html` | Existe |
| `GET` | `/registrar` | `register.html` | Existe |
| `GET` | `/login` | `login.html` | Existe |
| `GET` | `/painel` | `dashboard.html` | Precisa ser criada |

Os nomes usados por `url_for` nos templates atuais são:

- `homepage`;
- `register_page`;
- `login_page`;
- `create_user`.

Se uma função de rota receber outro nome, ajuste a referência correspondente no
template.

## Contrato já conectado

### Registro

`POST /api/v1/auth/registrar`

JSON enviado:

```json
{
  "username": "string",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string"
}
```

Regras espelhadas no formulário:

| Campo | Regra |
|---|---|
| `username` | 3–50 caracteres |
| `first_name` | 3–30 caracteres |
| `last_name` | 3–50 caracteres |
| `email` | e-mail válido, máximo 50 caracteres |
| `password` | 3–50 caracteres |
| `confirm_password` | validação exclusiva do navegador; não é enviada |

O frontend trata sucesso, duplicidade de username/e-mail, erro `422`, erro
inesperado e servidor indisponível.

### Login

`POST /api/v1/auth/login`

JSON enviado:

```json
{
  "username": "string",
  "password": "string"
}
```

O retorno esperado é o `UserResponse` atual:

```json
{
  "user_id": 1,
  "username": "string",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "created_at": "2026-07-29T12:00:00Z"
}
```

Depois do sucesso, o navegador guarda somente esse perfil público no
`sessionStorage` e navega para `/painel`.

**Isso não é autenticação.** O armazenamento serve apenas para manter a saudação
e o `user_id` disponíveis enquanto o backend ainda não cria sessão. Senha, hash
e token não são armazenados.

Para o login ficar seguro, o backend ainda precisa:

- criar uma sessão em cookie seguro ou outro mecanismo de autenticação;
- implementar uma rota de usuário atual;
- proteger a página `/painel`;
- obter o usuário das tasks pela sessão, não por um ID controlado pelo cliente.

### Listar tasks

`GET /{user_id}/tasks`

O backend atual responde com uma lista de `TaskResponse`. O frontend usa:

- `task_id`;
- `user_id`;
- `title`;
- `content`;
- `due_date`;
- `created_at`;
- `updated_at`.

O objeto `author` retornado atualmente não é necessário para renderizar o card.

O backend analisado usa `404` tanto para “usuário inexistente” quanto para “lista
vazia”. Enquanto esse contrato não for melhorado, o frontend verifica o
`detail`: `"User not found"` vira erro de identidade; os demais `404` dessa
listagem viram estado vazio.

### Criar task

`POST /{user_id}/create_task`

JSON enviado:

```json
{
  "title": "string",
  "content": "string",
  "due_date": "2026-07-29T15:00:00.000Z"
}
```

`due_date` é opcional e será `null` quando o campo estiver vazio.

O navegador envia datas com fuso explícito. Como o SQLite do backend atual pode
devolver datetimes sem offset, `tasks.js` interpreta respostas sem fuso como
UTC, coerente com `datetime.now(UTC)` usado nos models. Quando o backend passar
a garantir offsets em todas as respostas, essa compatibilidade pode ser
removida.

Regras do formulário:

| Campo | Regra |
|---|---|
| `title` | 2–100 caracteres |
| `content` | 5–500 caracteres |
| `due_date` | opcional; convertido de `datetime-local` para ISO 8601 |

## Marcadores obrigatórios de integração

Todo valor que depende de uma parte ainda inexistente da API usa exatamente:

```text
[-------ATENÇÃO!!!!!!!!!!!!----------SUBSTITUIR-AQUI-POR:-----{[(nome_do_item)]}-----------]
```

Somente `nome_do_item` muda. O restante do marcador não deve ser alterado.

### Endpoints pendentes

Todos estão reunidos no objeto `API_ROUTES`, no início de
`static/js/tasks.js`.

| Marcador | Método usado pelo frontend | Substituição esperada |
|---|---|---|
| `current_user_endpoint` | `GET` | Rota que retorna o usuário autenticado |
| `update_task_endpoint` | `PATCH` | Rota de atualização da task |
| `delete_task_endpoint` | `DELETE` | Rota de exclusão da task |
| `logout_endpoint` | `POST` | Rota que encerra a sessão |

A rota de atualização e a rota de exclusão podem conter os tokens `{user_id}` e
`{task_id}`. O script substitui esses tokens antes da requisição.

Exemplos de valores completos depois que o backend existir:

```text
/api/v1/tasks/{task_id}
/api/v1/users/{user_id}/tasks/{task_id}
```

Substitua o marcador completo pela rota escolhida. Não coloque uma rota dentro
de `{[(...)]}`.

### Dados exibidos

`templates/dashboard.html` mantém marcadores visíveis para:

- `user_id`;
- `first_name`;
- `username`;
- `email`;
- `task_id`;
- `task_title`;
- `task_content`;
- `task_due_date`;
- `task_created_at`;
- `task_updated_at`;
- `total_tasks`;
- `upcoming_tasks`;
- `overdue_tasks`;
- `undated_tasks`.

Quando a API responde, `tasks.js` substitui esses textos com `textContent`.
Isso evita interpretar título ou conteúdo de task como HTML e reduz risco de
XSS.

Se o dashboard passar a receber o usuário por contexto Jinja, os marcadores do
perfil também podem ser substituídos por expressões Jinja no backend.

## Fluxo do CRUD

### Leitura

1. O painel tenta obter o usuário pela rota `current_user_endpoint`.
2. Enquanto ela não existe, usa o perfil público devolvido pelo login.
3. Com o `user_id`, consulta a lista atual.
4. Exibe um dos estados: carregando, lista, vazio ou erro.

### Criação

1. “Nova task” abre um único diálogo reutilizável.
2. O navegador valida os limites.
3. A data local é convertida para ISO 8601.
4. A interface espera a confirmação da API.
5. Após sucesso, fecha o diálogo e recarrega a lista.

### Edição

1. “Editar” abre o mesmo diálogo preenchido.
2. O frontend envia `PATCH` para `update_task_endpoint`.
3. A lista só muda depois do sucesso.
4. Enquanto o marcador não for substituído, o formulário informa claramente
   que falta conectar a rota e mantém os dados digitados.

### Exclusão

1. “Excluir” abre um diálogo separado com o título da task.
2. Cancelar não altera a lista.
3. Confirmar envia `DELETE` para `delete_task_endpoint`.
4. O card só desaparece depois da confirmação da API.

O frontend não oferece “marcar como concluída”, pois o model atual não possui
campo de status ou conclusão.

## Tema claro e escuro

O tema:

- usa variáveis CSS;
- considera `prefers-color-scheme` no primeiro acesso;
- salva a escolha manual em `localStorage`;
- é aplicado antes do CSS para reduzir o flash do tema incorreto;
- atualiza `meta[name="theme-color"]`;
- funciona em todas as páginas;
- respeita `prefers-reduced-motion`.

O rosa `#FFC0CB` é a assinatura visual. Para botões e textos importantes,
também há tons de rosa mais escuros, necessários para contraste acessível.
Verde é usado apenas como cor semântica de sucesso.

## Acessibilidade

O pacote inclui:

- link “Pular para o conteúdo”;
- landmarks e títulos hierárquicos;
- labels vinculados a todos os campos;
- foco visível;
- mensagens com `aria-live`;
- erros relacionados aos campos por `aria-describedby`;
- estado de menu e tema exposto por atributos ARIA;
- `<dialog>` nativo, fechamento com `Esc` e restauração do foco;
- texto além da cor para prazo vencido, erros e sucesso;
- suporte a redução de movimento;
- controles com área clicável adequada;
- layouts testáveis desde 320 px.

## Estados tratados

| Área | Estados |
|---|---|
| Registro | inicial, inválido, enviando, duplicado, sucesso, erro, rede indisponível |
| Login | inicial, inválido, enviando, credenciais inválidas, sucesso, erro, rede indisponível |
| Lista | carregando, preenchida, vazia, filtrada sem resultado, erro |
| Criar/editar | inicial, inválido, enviando, sucesso, erro, rota pendente |
| Excluir | confirmação, enviando, sucesso, erro, rota pendente |

## Segurança e limitações atuais

O frontend:

- nunca salva senha;
- nunca registra credenciais no console;
- insere conteúdo de usuário e tasks com `textContent`;
- não faz alteração otimista antes da API confirmar;
- usa `credentials: "same-origin"` para permitir a futura sessão por cookie;
- exibe a mesma mensagem para username inexistente e senha errada.

O backend ainda precisa corrigir pontos que o frontend não consegue resolver:

1. O login atual verifica a senha, mas não cria sessão ou token.
2. As rotas de tasks recebem `user_id` pela URL e ainda não validam propriedade.
3. Atualização e exclusão ainda não existem.
4. A rota de usuário atual e logout ainda não existem.
5. A página `/painel` ainda precisa ser protegida.

Não publique o MVP como aplicação multiusuário antes de implementar essas
proteções. Caso contrário, alterar o `user_id` da URL pode permitir acesso a
tasks de outra conta.

## Checklist antes de considerar a integração concluída

- [ ] A pasta ativa no FastAPI aponta para este frontend.
- [ ] `/painel` renderiza `dashboard.html`.
- [ ] Login cria sessão segura e redireciona para `/painel`.
- [ ] `current_user_endpoint` retorna o usuário da sessão.
- [ ] Listar/criar tasks usa o usuário autenticado no backend.
- [ ] `update_task_endpoint` aceita `PATCH` e devolve sucesso.
- [ ] `delete_task_endpoint` aceita `DELETE` e devolve sucesso.
- [ ] `logout_endpoint` encerra a sessão.
- [ ] Todos os marcadores foram substituídos ou permanecem intencionalmente visíveis.
- [ ] Registro foi testado com sucesso, duplicidade e `422`.
- [ ] Login foi testado com senha correta e incorreta.
- [ ] Lista foi testada preenchida, vazia e com erro.
- [ ] CRUD foi testado sem duplicar requisições.
- [ ] Tema foi testado nos dois modos.
- [ ] Teclado, `Esc`, menu móvel e diálogos foram testados.
- [ ] O painel foi verificado em 320, 375, 768, 1024 e 1440 px.
