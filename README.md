# CETEC - Sistema de Matrículas

Sistema PWA/app instalável para controle de matrículas do CETEC, usando Firebase Cloud Firestore.

## Arquivos principais

- `index.html`: menu inicial
- `matricula.html`: cadastro e edição de matrícula
- `consulta.html`: consulta, filtros, WhatsApp, PDF e atualização de status
- `dashboard.html`: relatórios e gráficos
- `cursos.html`: gerenciamento de cursos
- `api.js`: comunicação com o Firestore
- `firebase-config.js`: configuração do Firebase
- `manifest.json`, `service-worker.js`, `pwa.js`: instalação como app/PWA
- `importador.html`: importador online dos dados antigos
- `firestore.rules` e `firestore-rules.txt`: regras do Firestore para teste
- `storage-rules.txt`: regras do Storage fechado

## Como subir no GitHub Pages

1. Extraia este pacote.
2. Envie todos os arquivos para a raiz do repositório.
3. No GitHub, vá em `Settings > Pages`.
4. Em `Build and deployment`, escolha a branch principal e a pasta raiz.
5. Aguarde o link do GitHub Pages ficar ativo.

## Como importar os dados antigos online

Não suba o arquivo `dados-cetec-firestore.json` no GitHub público.

Depois que o site estiver publicado:

1. Abra `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/importador.html`.
2. Clique para selecionar o arquivo `dados-cetec-firestore.json` salvo no seu computador.
3. Clique em `Importar para o Firebase`.
4. Aguarde a mensagem de conclusão.
5. Abra `consulta.html` e `dashboard.html` para conferir.
6. Depois da importação, apague o arquivo `importador.html` do repositório para evitar uso indevido.

## Regras do Firebase

Para teste, cole o conteúdo de `firestore-rules.txt` em:

`Firebase Console > Firestore Database > Rules`

Essas regras estão abertas porque o sistema foi pedido sem login. Para uso real, o ideal é proteger a área administrativa, pois o sistema trabalha com dados pessoais de alunos.

## Observação importante

Arquivos com dados dos alunos, como JSON e CSV, devem ficar fora do GitHub público.
