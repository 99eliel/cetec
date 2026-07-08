# CETEC - Sistema de Matrículas

Sistema online/PWA para controle de matrículas do CETEC usando Firebase Firestore.

## Principais funções

- Cadastro e edição de alunos
- Cadastro de cursos
- Consulta com filtros por busca geral, data, período, curso, turno e status
- Visualização responsiva em tabela no PC e cards no celular
- Chamada do aluno pelo WhatsApp
- Alteração rápida de status
- Geração de ficha de matrícula para imprimir/salvar PDF
- Dashboard com cards e gráficos
- Instalação como aplicativo no celular/PC
- Importador online para migrar dados do arquivo JSON privado

## Arquivos importantes

- `index.html`: menu inicial
- `matricula.html`: cadastro/edição de aluno
- `consulta.html`: busca, filtros, WhatsApp, ficha e status
- `dashboard.html`: relatórios e gráficos
- `cursos.html`: gerenciamento de cursos
- `importador.html`: importação do JSON privado para o Firestore
- `api.js`: comunicação com Firebase/Firestore
- `firebase-config.js`: configuração do projeto Firebase
- `firestore-rules.txt`: regras do Firestore em TXT para copiar e colar
- `storage-rules.txt`: regras do Storage em TXT

## Segurança

O sistema foi criado sem login, como solicitado. Para uso público ou com dados sensíveis de alunos, o ideal é proteger a área administrativa depois.

Não suba arquivos de dados privados, como `dados-cetec-firestore.json`, em repositório público.
