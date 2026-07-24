# UniPulse Schema Diagram

This diagram reflects the schema visible from the repository migrations and active application code. The full hosted Supabase schema should be exported separately before deleting or renaming tables such as `classes`.

```mermaid
erDiagram
  auth_users ||--|| profiles : owns
  profiles }o--|| universities : belongs_to
  profiles }o--|| faculties : belongs_to
  profiles }o--|| departments : belongs_to
  faculties ||--o{ faculty_departments : maps
  departments ||--o{ faculty_departments : maps
  profiles ||--o{ student_grades : records
  profiles ||--o{ activity_logs : creates
  profiles ||--o{ admin_notes : receives
  profiles }o--o{ classes : may_reference
  pending_registrations }o--|| profiles : creates_after_email

  auth_users {
    uuid id PK
    text email
  }
  profiles {
    uuid id PK
    text email
    text username
    text full_name
    text role
    uuid university_id FK
    uuid faculty_id FK
    uuid department_id FK
    uuid class_id FK
  }
  universities {
    uuid id PK
    text ad
  }
  faculties {
    uuid id PK
    uuid university_id FK
    text ad
  }
  departments {
    uuid id PK
    text ad
    text slug
  }
  faculty_departments {
    uuid faculty_id FK
    text department_slug
  }
  classes {
    uuid id PK
    text name
  }
  student_grades {
    uuid id PK
    uuid user_id FK
    text course_name
    text letter_grade
    numeric credits
  }
  activity_logs {
    uuid id PK
    uuid user_id FK
    uuid target_user_id FK
    text action
    jsonb details
  }
  admin_notes {
    uuid id PK
    uuid user_id FK
    uuid admin_id FK
    text note
  }
  pending_registrations {
    uuid id PK
    text email UK
    text username UK
    text password_cipher
    text password_iv
    jsonb dept_data
    text token UK
    timestamptz expires_at
  }
```
