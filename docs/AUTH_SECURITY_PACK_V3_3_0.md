# v3.3.0 Auth Security Pack

Добавлено:

- rate limit для регистрации и входа;
- минимальная длина пароля 8 символов;
- статус аккаунта `active/suspended`;
- роли `user/admin/owner`;
- logout и logout-all;
- смена пароля;
- foundation для password reset;
- foundation для email verification;
- security status для кабинета;
- admin users endpoint;
- admin auth events/audit logs;
- `npm run auth-security-check`.

Важно: отправка email пока не подключена. Reset/verification токены в production должны уходить через email provider в следующем email-этапе.
