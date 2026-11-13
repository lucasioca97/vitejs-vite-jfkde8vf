# Agenda do AnestVet — configuração do Firestore

A aba Agenda usa uma nova coleção **agendamentos**, com um documento por compromisso e o campo `userId` igual ao UID da conta Firebase autenticada.

## Regras necessárias

**Adicione apenas o bloco abaixo dentro do match /databases/{database}/documents já existente** nas regras do Firestore do projeto `registro-de-anestesias`. Não substitua nem apague as regras das coleções existentes.

```javascript
match /agendamentos/{documentId} {
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;
  allow read, delete: if request.auth != null
    && resource.data.userId == request.auth.uid;
  allow update: if request.auth != null
    && resource.data.userId == request.auth.uid
    && request.resource.data.userId == request.auth.uid;
}
```

As consultas usam `where('userId', '==', user.uid)`. Se aparecer `Missing or insufficient permissions`, confirme a publicação das regras acima.

## Etapas de integração Google

O botão **Google Agenda** desta primeira versão abre a tela de criação de um evento pré-preenchido para confirmação manual. Ele **não** faz sincronização automática nem mantém vínculos remotos. Ações de edição e exclusão no AnestVet não alteram eventos que já tenham sido salvos no Google.

Para a sincronização automática unidirecional prevista na próxima etapa:
1. Habilitar Google Calendar API no Google Cloud Console.
2. Configurar tela de consentimento OAuth e cliente Web com origens corretas para os domínios do AnestVet.
3. Implementar fluxo OAuth seguro, servidor de sincronização e controle de vínculo por `googleEventId`, sem expor tokens no frontend nem commitá-los no Git.
4. Tratar falhas, tentativas e prevenção de duplicatas; só marcar evento como sincronizado após confirmação da API.
5. Definir política de privacidade: informações clínicas devem permanecer no Firebase; enviar ao calendário somente os dados mínimos do compromisso.

Esta branch é destinada a testes em Preview antes de alteração de produção.
