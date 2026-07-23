# Tomichi

**Seu companheiro de jornada.**

Tomichi é uma aplicação pensada para ajudar pessoas a construir novos hábitos e manter constância na rotina, com a possibilidade de compartilhar o progresso com alguém de confiança — psicólogo, terapeuta, mentor, amigo ou familiar.

> ⚠️ Projeto em fase inicial de desenvolvimento. A API e a estrutura ainda estão em construção ativa e sujeitas a mudanças frequentes.

---

## Status atual

O foco de desenvolvimento neste momento é **100% back-end** (FastAPI). O front-end existente é estritamente funcional — server-rendered com Jinja2, sem estilização ou polimento — e só receberá atenção quando o back-end estiver em um estado maduro.

**Já implementado:**
- Estrutura base do projeto (FastAPI + SQLAlchemy 2.0 + SQLite para desenvolvimento)
- Modelos de dados (`User`, `Task`) com relacionamento entre eles
- Fluxo de registro de usuário (ainda usando uma base de dados fake em memória, como placeholder)
- Páginas de login/registro renderizadas via Jinja2 (sem estilização)

**Em construção / pendente:**
- Hash de senha (o campo `password_hash` já existe no modelo, a função de hashing ainda não)
- Autenticação (login funcional, geração de sessão/token)
- Persistência real via SQLAlchemy no lugar da base fake
- CRUD de tarefas/hábitos (modelos e schemas já existem, rotas ainda não)
- Front-end (design e experiência de usuário — propositalmente adiado)

## Stack

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/)
- **ORM:** SQLAlchemy 2.0 (estilo `Mapped`/`mapped_column`)
- **Banco de dados:** SQLite (desenvolvimento)
- **Templates:** Jinja2
- **Validação:** Pydantic

## Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/VitorHGomesL/Tomichi.git
cd Tomichi

# Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# edite o .env se necessário

# Rode o servidor
uvicorn main:app --reload
```

A aplicação sobe em `http://localhost:8000`.

## Estrutura do projeto

```
tomichi/
├── main.py                    # ponto de entrada da aplicação FastAPI
├── requirements.txt
├── .env.example                # template de variáveis de ambiente
├── frontend/
│   ├── static/                 # CSS
│   └── templates/               # templates Jinja2
└── src/
    ├── config.py                 # carregamento de variáveis de ambiente
    ├── database/                 # engine, sessão e conexão com o banco
    ├── modules/
    │   ├── auth/                    # registro, login, modelos de usuário
    │   ├── homepage/                 # página inicial
    │   └── tasks/                     # modelos e schemas de tarefas/hábitos
    └── security/                  # hashing de senha (pendente)
```

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

Feito por [Vitor Gomes](https://github.com/VitorHGomesL).
