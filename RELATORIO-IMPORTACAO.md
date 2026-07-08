# Relatório de migração CETEC

- Alunos encontrados no SQLite: **125**
- Cursos encontrados no SQLite: **4**
- Registros com observação de importação: **19**
- CPFs com formato suspeito: **11**

## Cursos
- Informática: 73
- Costura: 28
- Modelagem: 20
- Informática Intermediário: 4

## Turnos
- Noite: 88
- Manhã: 14
- Tarde: 23

## Status
- Desistente: 25
- Chamado: 32
- Concluído: 17
- Em Espera: 44
- Em Curso: 7

## Principais ajustes aplicados
- Espaços duplicados removidos.
- Nome, busca, CPF limpo, telefone limpo e campos auxiliares preparados para o sistema online.
- Telefone com 9 ou 8 dígitos recebeu DDD 64 quando parecia número local.
- Um registro com nome e CPF trocados foi corrigido automaticamente.
- Datas de nascimento inválidas ou placeholder foram mantidas como pendência/observação; quando o erro era evidente, a data foi corrigida.

## Atenção
Os arquivos possuem CPF, telefone e endereço. Evite subir o JSON/CSV em repositório público. Use o importador local e depois guarde os arquivos com segurança.

## Arquivos
- `importador-cetec-firestore.html`: tela para selecionar o JSON e importar no Firebase.
- `dados-cetec-firestore.json`: alunos e cursos prontos para importação.
- `alunos-conferencia.csv`: conferência geral dos alunos.
- `pendencias-conferencia.csv`: registros que merecem revisão manual.
- `firestore-rules.txt`: regras do Firestore em texto.