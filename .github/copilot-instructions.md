Voce eh um engenheiro de software senior em Javascript/TypeScript. Voce esta ajudando a implementar uma API RESTful usando Fastify e TypeScript.

Essa aplicacao `secretary` ja possui uma arquitetura bem definida, com camadas de Config, Services, Controllers, Routes, App e Main.

IMPORTANTE: Utilize o @mcp firecrawl para buscar informacoes sobre os pacotes abaixo (links) e o contexto necessario para implementar as funcionalidades requisitadas.

Voce deve implementar a seguinte entidades para manipulacao em um banco Postgres utilizando o plugin @fastify/postgres (https://github.com/fastify/fastify-postgres) que eh basicamente um wrapper em cima do node-postgres ([pg](https://node-postgres.com/)).

IMPORTANTE:
    - Utilize o pool de conexoes do plugin para todas as operacoes com o banco.
    - Utilize queries parametrizadas para evitar SQL Injection.
    - Implemente as operacoes CRUD (Create, Read, Update, Delete) para a entidade.
    - Utilize transacoes quando necessario.
    - Garanta que o codigo esteja tipado corretamente com TypeScript.
    - Melhores praticas de desenvolvimento devem ser seguidas.
    - Propriedades, variaveis, nomes de colunas, funcoes devem estar em ingles.
    - O nome do banco deve ser `secretary`.
    - As queries devem ser escritas em SQL puro e devem ser as mais performaticas possiveis.
         - Sempre busque por campos indexados.
         - Selecione apenas as colunas necessarias.
    - Utilize migrations para criar as tabelas no banco.
    - Trate 100% dos erros possiveis, principalmente em funcoes assincronas.
    - Considere sempre os principios de SOLID e DRY.
    - Codigo deve ser simples, limpo e legivel. Sem complexidades desnecessarias.
    - Nome das funcoes devem ser descritivos e seguir padroes comuns do mercado.
    - Utilize o padrao de `repository` para acesso ao banco de dados, de forma a separar a logica de negocio da logica de acesso a dados.
        - Crie um repositorio para cada entidade.
        - Cada repositorio deve ter funcoes para cada operacao CRUD.
        - Utilize injeccao de dependencia para passar o repositorio para os services.
        - Garanta que o repository seja injetado com a implementacao de interface em vez de uma classe concreta. Para que seja possivel trocar a implementacao futuramente se necessario, por exemplo: Chamar uma API, um Redis ou outro banco de dados.

## 📋 Visão Geral

### Atores do Sistema
- **Manager**: Controle total da plataforma
- **Entity**: Organização (clínica, empresa)
- **Professional**: Médicos, consultores, etc
- **Client**: Pacientes, clientes
- **Agent**: Assistente AI nas rooms

### Funcionalidades Principais
- Instruções customizadas por área/departamento
- Profissionais avulsos ou vinculados a entities
- Transcrições e assistência AI em tempo real
- Sistema robusto de rastreamento de eventos
- Controle de acesso granular ao backoffice

### Integrações
- LiveKit para gerenciamento de rooms
- PostgreSQL com suporte a JSONB
- Sistema de eventos para auditoria

---

## 📊 Tabelas do Banco de Dados

### User
**Descrição**: Usuários do backoffice (Manager e Entity admins)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| email | VARCHAR(254) | UNIQUE, NOT NULL |
| password | VARCHAR(254) | NOT NULL (hashed) |
| phone_number | VARCHAR(20) | NOT NULL, INDEX |
| role | ENUM('MANAGER', 'ENTITY_ADMIN') | NOT NULL |
| entity_id | INTEGER | FK → Entity.id, NULLABLE (NULL para MANAGER) |
| active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- UNIQUE (email)
- INDEX (phone_number)
- INDEX (entity_id)

---

### Entity
**Descrição**: Clínicas, empresas ou organizações

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| name | VARCHAR(200) | NOT NULL |
| type | VARCHAR(100) | ex: "medical_clinic", "design_agency" |
| instructions | JSONB | NULLABLE - instruções gerais para todos os agentes |
| active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)

---

### Department
**Descrição**: Áreas/Departamentos dentro de uma Entity (Cardiologia, Clínica Geral, etc)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| entity_id | INTEGER | FK → Entity.id, NOT NULL, INDEX |
| name | VARCHAR(100) | NOT NULL (ex: "Cardiologia") |
| instructions | JSONB | NULLABLE - instruções específicas da área |
| active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (entity_id)

**Nota**: As instruções finais do agente = `agent_instructions` (Department) + `default_agent_instructions` (Entity)

---

### Professional
**Descrição**: Profissionais (podem trabalhar para múltiplas entities)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| name | VARCHAR(200) | NOT NULL |
| email | VARCHAR(254) | NULLABLE |
| phone_number | VARCHAR(20) | NOT NULL, INDEX |
| external_id | VARCHAR(254) | NULLABLE, INDEX |
| license_number | VARCHAR(100) | NULLABLE (CRM, CREFITO, etc) |
| active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (phone_number)
- INDEX (external_id)
- INDEX (active)

**Nota**: Relacionamento com Entity/Department agora é N:N através da tabela `ProfessionalEntity`

---

### Participant
**Descrição**: Participantes genéricos (Clients, Professionals, Agents)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL |
| type | ENUM('CLIENT', 'PROFESSIONAL', 'AGENT') | NOT NULL |
| phone_number | VARCHAR(20) | NOT NULL, INDEX |
| external_id | VARCHAR(254) | NULLABLE, INDEX |
| professional_id | INTEGER | FK → Professional.id, NULLABLE (quando type=PROFESSIONAL) |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (phone_number)
- INDEX (external_id)
- COMPOUND INDEX (phone_number, type)
- INDEX (professional_id)

**Nota**: Quando `type='PROFESSIONAL'`, o campo `professional_id` referencia a tabela Professional para obter dados completos.

---

### ProfessionalEntity
**Descrição**: Relacionamento N:N entre Profissionais e Entities (um profissional pode trabalhar em várias entities)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| professional_id | INTEGER | FK → Professional.id, NOT NULL, INDEX |
| entity_id | INTEGER | FK → Entity.id, NOT NULL, INDEX |
| department_id | INTEGER | FK → Department.id, NULLABLE |
| active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (professional_id)
- INDEX (entity_id)
- INDEX (department_id)
- UNIQUE INDEX (professional_id, entity_id, department_id)

**Nota**: Permite que um profissional trabalhe em múltiplas entities e em diferentes departamentos dentro de cada entity.

---

### Room
**Descrição**: Participantes genéricos (Clients, Professionals, Agents)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL |
| type | ENUM('CLIENT', 'PROFESSIONAL', 'AGENT') | NOT NULL |
| phone_number | VARCHAR(20) | NOT NULL, INDEX |
| external_id | VARCHAR(254) | NULLABLE, INDEX |
| professional_id | INTEGER | FK → Professional.id, NULLABLE (quando type=PROFESSIONAL) |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (phone_number)
- INDEX (external_id)
- COMPOUND INDEX (phone_number, type)
- INDEX (professional_id)

**Nota**: Quando `type='PROFESSIONAL'`, o campo `professional_id` referencia a tabela Professional para obter dados completos.

---

### RoomParticipant
**Descrição**: Relacionamento entre Rooms e Participants (LiveKit participant identities)

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| room_id | INTEGER | FK → Room.id, NOT NULL, INDEX |
| participant_id | INTEGER | FK → Participant.id, NOT NULL, INDEX |
| context | JSONB | NOT NULL (ex: {"processedContext": "...", "rawContext": "..."}) |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (room_id)
- INDEX (participant_id)
- UNIQUE INDEX (room_id, participant_id)

**Nota**: O campo `context` armazena informações adicionais sobre o participante naquela room específica.

---

### RoomEvent
**Descrição**: Eventos que ocorrem nas rooms

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| room_id | INTEGER | FK → Room.id, NOT NULL, INDEX |
| name | VARCHAR(100) | NOT NULL, INDEX |
| data | JSONB | NOT NULL |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (room_id)
- INDEX (name)
- COMPOSITE INDEX (room_id, created_at) para queries de eventos por sala

---

### AgentSessionEvent
**Descrição**: Eventos específicos das sessões de agentes AI

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| room_id | INTEGER | FK → Room.id, NOT NULL, INDEX |
| name | VARCHAR(100) | NOT NULL, INDEX |
| data | JSONB | NOT NULL |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (room_id)
- INDEX (name)
- COMPOSITE INDEX (room_id, created_at) para queries de eventos por sessão

---

### AgentUsage
**Descrição**: Métricas e dados de utilização dos agentes em cada room

| Campo | Tipo | Constraints |
|-------|------|-------------|
| **id** | SERIAL | PRIMARY KEY |
| room_id | INTEGER | FK → Room.id, NOT NULL, INDEX |
| participant_id | INTEGER | FK → Participant.id, NOT NULL (referência ao agent) |
| entity_id | INTEGER | FK → Entity.id, NULLABLE, INDEX |
| department_id | INTEGER | FK → Department.id, NULLABLE, INDEX |
| session_start | TIMESTAMP | NOT NULL |
| session_end | TIMESTAMP | NULLABLE (NULL = sessão ainda ativa) |
| data | JSONB | NOT NULL (dados de uso e outros dados gerais) |
| created_at | TIMESTAMP | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMP | NOT NULL DEFAULT now() |

**Índices**:
- PRIMARY KEY (id)
- INDEX (room_id)
- INDEX (participant_id)
- INDEX (entity_id)
- INDEX (department_id)
- INDEX (session_start)
- COMPOSITE INDEX (entity_id, session_start) para relatórios por entity
- COMPOSITE INDEX (department_id, session_start) para relatórios por departamento

**Nota**: Esta tabela permite análises de custo, performance e uso dos agentes por entity, departamento ou room.

---

## 🔗 Relacionamentos

### User ↔ Entity
- **Tipo**: N:1 (muitos usuários para uma entity)
- **FK**: User.entity_id → Entity.id
- **Nota**: NULLABLE para Managers (acesso a todas entities)

### Entity ↔ Department
- **Tipo**: 1:N (uma entity tem muitos departamentos)
- **FK**: Department.entity_id → Entity.id

### Professional ↔ Entity (N:N via ProfessionalEntity)
- **Tipo**: N:N (profissional trabalha em múltiplas entities)
- **Tabela Intermediária**: ProfessionalEntity
- **FKs**: 
  - ProfessionalEntity.professional_id → Professional.id
  - ProfessionalEntity.entity_id → Entity.id
  - ProfessionalEntity.department_id → Department.id (NULLABLE)

### Professional ↔ Department (N:N via ProfessionalEntity)
- **Tipo**: N:N (profissional pode ter múltiplas especialidades em diferentes entities)
- **FK**: ProfessionalEntity.department_id → Department.id
- **Nota**: Um profissional pode ser "Cardiologista" na Entity A e "Clínico Geral" na Entity B

### Participant ↔ Professional
- **Tipo**: N:1 (referência quando participant é profissional)
- **FK**: Participant.professional_id → Professional.id
- **Nota**: Usado apenas quando Participant.type = 'PROFESSIONAL'

### Room ↔ Entity
- **Tipo**: N:1 (muitas rooms para uma entity)
- **FK**: Room.entity_id → Entity.id
- **Nota**: NULLABLE para rooms avulsas

### Room ↔ Department
- **Tipo**: N:1 (muitas rooms para um departamento)
- **FK**: Room.department_id → Department.id
- **Nota**: Define qual conjunto de instruções de agente usar

### RoomParticipant ↔ Room
- **Tipo**: N:1 (muitos participantes para uma room)
- **FK**: RoomParticipant.room_id → Room.id

### RoomParticipant ↔ Participant
- **Tipo**: N:1 (muitas participações de um participant)
- **FK**: RoomParticipant.participant_id → Participant.id

### RoomEvent ↔ Room
- **Tipo**: N:1 (muitos eventos para uma room)
- **FK**: RoomEvent.room_id → Room.id

### AgentSessionEvent ↔ Room
- **Tipo**: N:1 (muitos eventos de agente para uma room)
- **FK**: AgentSessionEvent.room_id → Room.id

### AgentUsage ↔ Room
- **Tipo**: N:1 (múltiplas sessões de agente em uma room)
- **FK**: AgentUsage.room_id → Room.id

### AgentUsage ↔ Participant
- **Tipo**: N:1 (referência ao agente específico)
- **FK**: AgentUsage.participant_id → Participant.id
- **Nota**: O Participant referenciado deve ter type='AGENT'

### AgentUsage ↔ Entity
- **Tipo**: N:1 (métricas agregadas por entity)
- **FK**: AgentUsage.entity_id → Entity.id
- **Nota**: Para relatórios de custo por entity

### AgentUsage ↔ Department
- **Tipo**: N:1 (métricas agregadas por departamento)
- **FK**: AgentUsage.department_id → Department.id
- **Nota**: Para relatórios de uso por especialidade

---

## 💡 Pontos de Atenção e Regras de Negócio

### Hierarquia de Instruções para Agentes
1. **Instruções Específicas**: Department.agent_instructions
2. **Instruções Gerais**: Entity.default_agent_instructions
3. **Resultado**: Concatenação ou merge das duas (lógica na aplicação)

### Profissionais Avulsos vs Vinculados
- **Avulso**: Professional sem registros na tabela `ProfessionalEntity`
- **Vinculado a Entity**: Possui registro(s) em `ProfessionalEntity`
- **Com Especialidade**: `ProfessionalEntity.department_id` preenchido
- **Múltiplas Entities**: Múltiplos registros em `ProfessionalEntity` (ex: Dr. João trabalha em Clínica A e Hospital B)

### Tipos de Participant
- **CLIENT**: Paciente ou cliente final
- **PROFESSIONAL**: Referencia um Professional via `professional_id`
- **AGENT**: Agente AI despachado para a room

### Controle de Acesso (User)
- **MANAGER**: `entity_id = NULL`, acesso total a todas entities e configurações
- **ENTITY_ADMIN**: `entity_id` preenchido, acesso apenas à sua entity

### Rooms
- **Avulsa**: `entity_id = NULL` e `department_id = NULL` (sem instruções pré-definidas)
- **Com Entity**: Herda `default_agent_instructions` da Entity
- **Com Department**: Herda instruções específicas + gerais

### Eventos
- **RoomEvent**: Eventos gerais da room (entrada/saída de participantes, mudança de status, etc)
- **AgentSessionEvent**: Eventos específicos do agente (transcrições, sugestões, respostas, etc)

### Métricas de Agentes
- **AgentUsage**: Armazena dados de utilização (tokens, duração, custos) para:
  - Controle de custos por entity/department
  - Análise de performance dos agentes
  - Relatórios de uso e faturamento
  - Auditoria de sessões

**Exemplo de uso do AgentUsage**:
```json
{
  "room_id": 123,
  "participant_id": 456,
  "entity_id": 10,
  "department_id": 5,
  "session_start": "2025-11-03 14:30:00",
  "session_end": "2025-11-03 15:15:00",
  "duration_seconds": 2700,
  "total_tokens_input": 15000,
  "total_tokens_output": 8500,
  "total_audio_minutes": 45.00,
  "interactions_count": 42,
  "transcription_count": 12,
  "cost_estimate": 2.35,
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "features_used": ["transcription", "suggestions", "context_analysis"]
  }
}
```

---

## 🔒 Considerações de Segurança

1. **Senha**: Sempre armazenar hash (bcrypt, argon2)
2. **Controle de Acesso**: Validar `User.role` e `User.entity_id` em todas operações
3. **JSONB Validation**: Validar estrutura dos campos `context` e `data`
4. **Soft Delete**: Usar campo `active` ao invés de DELETE físico
5. **Auditoria**: Os campos `created_at` e `updated_at` são essenciais

---

## 📈 Otimizações Recomendadas

### Índices Compostos Adicionais
```sql
-- Para queries de profissionais por entity e departamento
CREATE INDEX idx_prof_entity_dept ON ProfessionalEntity(entity_id, department_id);
CREATE INDEX idx_prof_entity_active ON ProfessionalEntity(professional_id, entity_id, active);

-- Para queries de rooms por entity e status
CREATE INDEX idx_room_entity_status ON Room(entity_id, status);

-- Para queries de eventos por room e período
CREATE INDEX idx_room_event_time ON RoomEvent(room_id, created_at DESC);
CREATE INDEX idx_agent_event_time ON AgentSessionEvent(room_id, created_at DESC);

-- Para relatórios de uso de agentes
CREATE INDEX idx_agent_usage_entity_date ON AgentUsage(entity_id, session_start DESC);
CREATE INDEX idx_agent_usage_dept_date ON AgentUsage(department_id, session_start DESC);
CREATE INDEX idx_agent_usage_active ON AgentUsage(room_id, session_end) WHERE session_end IS NULL;
```

### Particionamento (Para Alto Volume)
- **RoomEvent** e **AgentSessionEvent**: Particionar por `created_at` (mensal)
- Melhora performance de queries históricas

### Cache
- **Entity.default_agent_instructions**: Cache em memória
- **Department.agent_instructions**: Cache com invalidação por entity
- **User permissions**: Cache de permissões do usuário

---

## 🚀 Exemplo de Fluxo

### 1. Criação de Room com Agente
```
1. Entity "Clínica XYZ" tem Department "Cardiologia"
2. Department tem agent_instructions específicas
3. Professional "Dr. João" vinculado ao Department
4. Room criada com department_id = Cardiologia
5. Agente despachado herda: instructions(Cardiologia) + default_instructions(Clínica XYZ)
6. Participant(AGENT) criado e vinculado via RoomParticipant
```

### 2. Profissional Avulso
```
1. Professional criado com entity_id = NULL
2. Room criada com entity_id = NULL
3. Agente despachado sem instruções pré-definidas (ou instruções default da plataforma)
```

---

## 📝 Notas de Implementação

### Enums no PostgreSQL
```sql
CREATE TYPE user_role AS ENUM ('MANAGER', 'ENTITY_ADMIN');
CREATE TYPE participant_type AS ENUM ('CLIENT', 'PROFESSIONAL', 'AGENT');
CREATE TYPE room_status AS ENUM ('OPEN', 'CLOSED', 'IN_PROGRESS');
```

### Triggers Úteis
- **updated_at**: Trigger para atualizar automaticamente em UPDATEs
- **Audit Log**: Trigger para log de mudanças em tabelas críticas (User, Entity, Professional)
- **AgentUsage.duration_seconds**: Trigger para calcular automaticamente quando `session_end` é preenchido
  ```sql
  CREATE OR REPLACE FUNCTION calculate_agent_duration()
  RETURNS TRIGGER AS $
  BEGIN
    IF NEW.session_end IS NOT NULL THEN
      NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start))::INTEGER;
    END IF;
    RETURN NEW;
  END;
  $ LANGUAGE plpgsql;
  
  CREATE TRIGGER trg_calculate_duration
  BEFORE INSERT OR UPDATE ON AgentUsage
  FOR EACH ROW
  EXECUTE FUNCTION calculate_agent_duration();
  ```

### Validações na Aplicação
- Validar que ENTITY_ADMIN só acessa sua própria entity
- Validar que Participant.professional_id só é preenchido quando type='PROFESSIONAL'
- Validar estrutura dos JSONB antes de inserir
- Validar que AgentUsage.participant_id referencia um Participant com type='AGENT'
- Calcular cost_estimate baseado em tokens e audio_minutes usando tabela de preços
- Atualizar métricas de AgentUsage em tempo real durante a sessão